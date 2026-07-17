import type { Violation } from "./types";
import type { CheckRunner } from "./violation-meta";
import { lineOf } from "./line-of";

const VAGUE_LINK = /(click here|read more|learn more|here|more|link|this)/i;

/**
 * Scan for vague link text, untitled iframes, and empty-alt images.
 *
 * Why: Three common violations: (1) vague link text like "click here" gives
 * screen reader users no context when navigating by links (WCAG 2.4.4).
 * (2) iframes without titles are unidentified by screen readers (WCAG 4.1.2).
 * (3) images with empty alt but real src may be meaningful but hidden from
 * assistive tech (WCAG 1.1.1).
 *
 * @param content - File content to scan.
 * @param file - File path for violation attribution.
 * @returns Violations for vague link text, iframe-no-title, and empty-alt-meaningful-img.
 */
export function checkLinks(content: string, file: string): Violation[] {
  const violations: Violation[] = [];

  const linkRegex = /<a\b[^>]{0,500}>([\s\S]{0,2000})?<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(content)) !== null) {
    const tag = m[0];
    const inner = m[1].replace(/<[^>]+>/g, "").trim();
    const ariaLabel = (tag.match(/aria-label\s*=\s*["']([^"']+)["']/) || [])[1];
    const text = ariaLabel || inner;
    if (text && VAGUE_LINK.test(text) && !/[\w]{3,}/.test(text.replace(VAGUE_LINK, "").trim())) {
      violations.push({
        type: "vague-link-text",
        file,
        line: lineOf(content, m.index),
        description: `Link text "${text}" is vague. Screen reader users hear contextless links. Use descriptive text.`,
        snippet: tag.substring(0, 120),
      });
    }
  }

  const iframeRegex = /<iframe\b[^>]*>/gi;
  while ((m = iframeRegex.exec(content)) !== null) {
    const tag = m[0];
    if (!/title\s*=/i.test(tag) && !/aria-label\s*=/i.test(tag)) {
      violations.push({
        type: "iframe-no-title",
        file,
        line: lineOf(content, m.index),
        description: "iframe missing title attribute. Screen readers cannot identify its purpose.",
        snippet: tag.substring(0, 120),
      });
    }
  }

  const imgRegex = /<img\b[^>]*>/gi;
  while ((m = imgRegex.exec(content)) !== null) {
    const tag = m[0];
    const altM = tag.match(/alt\s*=\s*["']([^"']*)["']/i);
    const srcM = tag.match(/src\s*=\s*["']([^"']+)["']/i);
    if (altM && altM[1].trim() === "" && srcM) {
      violations.push({
        type: "empty-alt-meaningful-img",
        file,
        line: lineOf(content, m.index),
        description: "Image has empty alt but a real src. If decorative, confirm; if meaningful, alt should describe it.",
        snippet: tag.substring(0, 120),
      });
    }
  }

  return violations;
}

export const linksCheck: CheckRunner = {
  type: "vague-link-text", kinds: ["jsx", "html"],
  run: (content, file) => checkLinks(content, file),
};
