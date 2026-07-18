"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidProps {
  chart: string;
  label?: string;
}

export default function Mermaid({ chart, label }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [key] = useState(() => Math.random().toString(36).slice(2));

  useEffect(() => {
    if (!ref.current || !chart) return;
    let cancelled = false;
    const el = ref.current;
    const id = `m-${key}`;
    import("mermaid").then((mod) => {
      if (cancelled) return;
      const m = mod.default;
      m.initialize({
        startOnLoad: false,
        theme: "dark",
        themeVariables: {
          background: "#1e1919",
          primaryColor: "#2a2525",
          primaryBorderColor: "#8bc48b",
          primaryTextColor: "#cfcecd",
          secondaryColor: "#1a1717",
          tertiaryColor: "#2a2525",
          lineColor: "#9a9897",
          fontSize: "14px",
          fontFamily: "JetBrains Mono",
        },
        flowchart: { useMaxWidth: true, htmlLabels: true },
        sequence: { useMaxWidth: true, showSequenceNumbers: true },
      });
      m.render(id, chart).then(({ svg }: { svg: string }) => {
        if (cancelled) return;
        el.innerHTML = svg;
        const svgEl = el.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("role", "img");
          svgEl.setAttribute("aria-label", label || "Architecture diagram");
        }
      }).catch(() => {
        el.innerHTML = `<span class="font-mono text-xs" style="color:var(--fail)">diagram render failed</span>`;
      });
    }).catch(() => {
      el.innerHTML = `<span class="font-mono text-xs" style="color:var(--fail)">diagram render failed</span>`;
    });
    return () => { cancelled = true; };
  }, [chart, key, label]);

  return (
    <div ref={ref} className="mermaid flex justify-center overflow-x-auto py-2" />
  );
}
