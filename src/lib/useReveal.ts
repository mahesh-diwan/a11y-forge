"use client";

import { useEffect, useRef, useState } from "react";

/**
 * React hook for scroll-triggered reveal animation.
 *
 * Why: Uses IntersectionObserver to detect when element enters viewport (15% threshold).
 * Sets `visible` flag once observed, then disconnects observer (one-shot).
 * Falls back to immediately visible if IntersectionObserver unavailable.
 *
 * @returns Object with `ref` (attach to target element) and `visible` (boolean state).
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setVisible(true));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();

  }, []);

  return { ref, visible };
}
