import type { ScoreResult } from "./types";

function escapeSvg(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateBadge(score: ScoreResult): string {
  const bgMap: Record<string, string> = {
    "A+": "#16a34a", A: "#22c55e", B: "#84cc16",
    C: "#eab308", D: "#f97316", F: "#ef4444",
  };
  const bg = bgMap[score.grade] || "#6b7280";
  const grade = escapeSvg(String(score.grade));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="30" viewBox="0 0 200 30">
  <rect width="200" height="30" rx="6" fill="#1f2937"/>
  <rect width="60" height="30" rx="6" fill="${bg}"/>
  <text x="30" y="20" text-anchor="middle" fill="white" font-family="monospace" font-size="14" font-weight="bold">${grade}</text>
  <text x="130" y="20" text-anchor="middle" fill="#9ca3af" font-family="sans-serif" font-size="10">Accessibility</text>
</svg>`;
}
