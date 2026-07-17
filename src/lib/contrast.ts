import type { Violation } from "./types";
import type { CheckRunner } from "./violation-meta";
import { lineOf } from "./line-of";

const NAMED_COLORS: Record<string, string> = {
  black: "#000000", silver: "#c0c0c0", gray: "#808080", grey: "#808080",
  white: "#ffffff", maroon: "#800000", red: "#ff0000", purple: "#800080",
  fuchsia: "#ff00ff", green: "#008000", lime: "#00ff00", olive: "#808000",
  yellow: "#ffff00", navy: "#000080", blue: "#0000ff", teal: "#008080",
  aqua: "#00ffff", orange: "#ffa500", pink: "#ffc0cb", transparent: "#00000000",
};

function parseColor(value: string): [number, number, number] | null {
  let v = value.trim().toLowerCase();

  const named = NAMED_COLORS[v];
  if (named) v = named;

  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) {
      h = h.split("").map((c) => c + c).join("");
    }
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
    return [r, g, b];
  }

  const rgb = v.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    if (parts.length >= 3) {
      const [r, g, b] = parts;
      if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
      return [r, g, b];
    }
  }

  return null;
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * Calculate WCAG contrast ratio between two RGB colors.
 *
 * Why: Core computation for WCAG 1.4.3 compliance. Uses relative luminance
 * formula from WCAG 2.1. Ratio must be >= 4.5:1 for normal text (AA) or
 * >= 3:1 for large text.
 *
 * @param fg - Foreground RGB tuple [R, G, B] 0-255.
 * @param bg - Background RGB tuple [R, G, B] 0-255.
 * @returns Contrast ratio (1:1 to 21:1).
 */
export function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Scan HTML/JSX content for low-contrast text.
 *
 * Why: Parses inline style attributes and CSS rule blocks for color/background
 * pairs, computes contrast ratio, and flags any pair below WCAG AA (4.5:1).
 * Deduplicates by line to avoid duplicate reports on same element.
 *
 * @param content - File content to scan.
 * @param file - File path for violation attribution.
 * @returns Array of low-contrast violations.
 */
export function checkContrast(content: string, file: string): Violation[] {
  const violations: Violation[] = [];

  const styleRegex = /style\s*=\s*["']([^"']{0,500})["']/gi;
  let styleMatch: RegExpExecArray | null;
  while ((styleMatch = styleRegex.exec(content)) !== null) {
    const style = styleMatch[1];
    const colorM = style.match(/color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]{0,100}\)|[\w-]{1,50})/i);
    const bgM = style.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]{0,100}\)|[\w-]{1,50})/i);
    if (!colorM || !bgM) continue;

    const fg = parseColor(colorM[1]);
    const bg = parseColor(bgM[1]);
    if (!fg || !bg) continue;

    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      const line = lineOf(content, styleMatch.index);
      violations.push({
        type: "low-contrast",
        file,
        line,
        description: `Text/background contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA minimum (4.5:1).`,
        snippet: `color:${colorM[1]} / background:${bgM[1]}`,
      });
    }
  }

  const cssColorRegex = /color\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]{0,100}\))/gi;
  const cssBgRegex = /background(?:-color)?\s*:\s*(#[0-9a-f]{3,8}|rgba?\([^)]{0,100}\))/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cssColorRegex.exec(content)) !== null) {
    const fg = parseColor(cm[1]);
    if (!fg) continue;
    cssBgRegex.lastIndex = cm.index;
    const bm = cssBgRegex.exec(content);
    if (!bm) break;
    const bg = parseColor(bm[1]);
    if (!bg) continue;
    const ratio = contrastRatio(fg, bg);
    if (ratio < 4.5) {
      const line = lineOf(content, cm.index);
      violations.push({
        type: "low-contrast",
        file,
        line,
        description: `CSS contrast ratio ${ratio.toFixed(2)}:1 below WCAG AA (4.5:1).`,
        snippet: `color:${cm[1]} / background:${bm[1]}`,
      });
    }
    cssColorRegex.lastIndex = cssBgRegex.lastIndex;
  }

  const seen = new Set<number>();
  return violations.filter((v) => {
    if (seen.has(v.line)) return false;
    seen.add(v.line);
    return true;
  });
}

/**
 * Parse CSS color string to RGB tuple.
 *
 * Why: Supports hex (#rgb, #rrggbb, #rgba, #rrggbbaa), rgb()/rgba() function
 * syntax, and named CSS colors. Returns null for unparseable values so callers
 * can skip gracefully. Alpha channel is ignored — only RGB used for contrast.
 *
 * @param value - CSS color string (hex, rgb/rgba, or named color).
 * @returns RGB tuple [R, G, B] 0-255 or null if unparseable.
 */
export const lowContrastCheck: CheckRunner = {
  type: "low-contrast", kinds: ["jsx", "html"],
  run: (content, file) => checkContrast(content, file),
};

export { parseColor };
