/**
 * Merges class name parts, filtering out falsy values.
 *
 * Why: Lightweight alternative to clsx/classnames. Accepts strings, false,
 * null, undefined. Filters falsy entries, joins remainder with space.
 *
 * @param parts - Class name values. Falsy entries excluded from result.
 * @returns Single string of space-separated class names.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
