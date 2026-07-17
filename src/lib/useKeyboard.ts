import { useEffect } from "react";

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

export function useKeyboard(shortcuts: ShortcutMap): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip events from input/textarea elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Case-insensitive match for single chars, exact match for named keys
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const cb = shortcuts[key];
      if (cb) {
        cb(e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
