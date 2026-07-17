/**
 * Calculate 1-indexed line number from character index in content.
 *
 * Why: Duplicated across 4 checker modules. Single source keeps line
 * calculation consistent and eliminates copy-paste maintenance burden.
 *
 * @param content - Full file content string.
 * @param index - Character index within content.
 * @returns Line number (1-indexed).
 */
export function lineOf(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}
