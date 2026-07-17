import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import type { Violation } from "./types";
import type { NodePath } from "@babel/traverse";
import type { CheckRunner } from "./violation-meta";

// @babel/traverse is CJS; handle default interop (Next/Turbopack may unwrap)
const traverse: typeof _traverse = (typeof _traverse === "function" ? _traverse : (_traverse as any).default) ?? _traverse;

interface JSXNode {
  loc: { start?: { line?: number } } | null;
  openingElement?: {
    name?: { type?: string; name?: string };
    attributes?: Array<{
      type?: string;
      name?: { type?: string; name?: string };
    }>;
  };
  children?: Array<{ type?: string; value?: string }>;
}

function line(loc: { start?: { line?: number } } | null | undefined): number {
  return loc?.start?.line ?? 1;
}

function attr(node: JSXNode, name: string): boolean {
  const attrs = node.openingElement?.attributes || [];
  return attrs.some(
    (a) => a.type === "JSXAttribute" && a.name?.type === "JSXIdentifier" && a.name.name === name
  );
}

function hasChildren(node: JSXNode): boolean {
  const children = node.children || [];
  return children.some((c) => c.type === "JSXText" && (c.value ?? "").trim().length > 0);
}

/**
 * Scan TSX/JSX source via AST for accessibility violations.
 *
 * Why: Uses Babel parser to avoid false positives from regex-based scanners.
 * Checks img (alt), iframe (title/aria-label), button/a (accessible name),
 * and form inputs (accessible label). Returns high-confidence violations only.
 *
 * @param content - Source code content to scan.
 * @param file - File path for violation location tracking.
 * @returns Array of violations found. Empty if parse fails or no violations detected.
 */
export function scanAst(content: string, file: string): Violation[] {
  const violations: Violation[] = [];
  let ast;
  try {
    ast = parse(content, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    });
  } catch {
    return violations;
  }

  traverse(ast, {
    JSXElement(path: NodePath) {
      const node = path.node as unknown as JSXNode;
      const name = node.openingElement?.name;
      const tag = name?.type === "JSXIdentifier" ? name.name : "";

      if (tag === "img" && !attr(node, "alt")) {
        violations.push({
          type: "missing-alt-text",
          file,
          line: line(node.loc),
          description: "JSX <img> missing alt prop. Screen readers cannot describe the image.",
          snippet: `<img ...> (line ${line(node.loc)})`,
        });
      }

      if (tag === "iframe" && !attr(node, "title") && !attr(node, "aria-label")) {
        violations.push({
          type: "iframe-no-title",
          file,
          line: line(node.loc),
          description: "JSX <iframe> missing title/aria-label prop.",
          snippet: `<iframe ...> (line ${line(node.loc)})`,
        });
      }

      if (
        (tag === "button" || tag === "a") &&
        !hasChildren(node) &&
        !attr(node, "aria-label") &&
        !attr(node, "aria-labelledby") &&
        !attr(node, "alt") &&
        !attr(node, "title")
      ) {
        violations.push({
          type: tag === "button" ? "missing-aria-label" : "vague-link-text",
          file,
          line: line(node.loc),
          description: `JSX <${tag}> lacks accessible name (no text, aria-label, or title).`,
          snippet: `<${tag} ...> (line ${line(node.loc)})`,
        });
      }

      if (tag === "input" || tag === "select" || tag === "textarea") {
        const hasLabel =
          attr(node, "aria-label") ||
          attr(node, "aria-labelledby") ||
          attr(node, "id") ||
          attr(node, "aria-describedby");
        if (!hasLabel) {
          violations.push({
            type: "missing-form-label",
            file,
            line: line(node.loc),
            description: `JSX <${tag}> missing accessible label (aria-label/id).`,
            snippet: `<${tag} ...> (line ${line(node.loc)})`,
          });
        }
      }
    },
  });

  return violations;
}

export const astCheck: CheckRunner = {
  type: "ast", kinds: ["jsx"],
  run: (content, file) => scanAst(content, file),
};
