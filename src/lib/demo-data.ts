import type { ScanResult, FixPR } from "./types";

export const DEMO_RESULT: ScanResult = {
  repoUrl: "github.com/mahesh-diwan/a11y-forge-demo",
  violations: [
    { type: "contrast", file: "src/Button.tsx", line: 42, description: "Color contrast ratio 3.1:1 — AA requires 4.5:1", snippet: "color: #888;\nbackground: #fff;" },
    { type: "contrast", file: "src/Nav.tsx", line: 18, description: "Color contrast ratio 2.8:1 on hover state", snippet: "color: #999;" },
    { type: "keyboard", file: "src/Nav.tsx", line: 25, description: "tabindex ≥0 on non-interactive div", snippet: '<div tabindex="0" class="nav-item">' },
    { type: "keyboard", file: "src/Modal.tsx", line: 55, description: "Missing Escape key handler on modal", snippet: '<div role="dialog">' },
    { type: "headings", file: "src/About.tsx", line: 1, description: "Heading skip — h1 → h3, no h2", snippet: "<h1>Title</h1>\n<h3>Subtitle</h3>" },
    { type: "headings", file: "src/About.tsx", line: 8, description: "Empty heading element", snippet: "<h2></h2>" },
    { type: "links", file: "src/Footer.tsx", line: 12, description: "Vague link text 'click here'", snippet: '<a href="/contact">click here</a>' },
    { type: "links", file: "src/Footer.tsx", line: 15, description: "Empty href on anchor", snippet: '<a href="">Home</a>' },
    { type: "ast", file: "src/Card.tsx", line: 3, description: "Image missing alt attribute", snippet: "<img src='/photo.jpg' />" },
    { type: "ast", file: "src/Form.tsx", line: 22, description: "Button missing aria-label", snippet: '<button class="icon-btn">' },
    { type: "ast", file: "src/Form.tsx", line: 30, description: "Input missing associated label", snippet: '<input type="text" />' },
    { type: "ast", file: "src/Layout.tsx", line: 1, description: "HTML missing lang attribute", snippet: "<html>" },
  ],
  score: {
    score: 42,
    grade: "D",
    label: "FAIL",
    color: "#ff3b3b",
    totalViolations: 12,
    breakdown: [
      { type: "contrast", count: 2, impact: 0.25 },
      { type: "keyboard", count: 2, impact: 0.2 },
      { type: "headings", count: 2, impact: 0.15 },
      { type: "links", count: 2, impact: 0.15 },
      { type: "ast", count: 4, impact: 0.25 },
    ],
    affectedFiles: ["src/Button.tsx", "src/Nav.tsx", "src/Modal.tsx", "src/About.tsx", "src/Footer.tsx", "src/Card.tsx", "src/Form.tsx", "src/Layout.tsx"],
  },
  screenReader: [
    { file: "src/Card.tsx", line: 3, element: "<img>", current: "No announcement", fixed: "Photo: team meeting", violation: "Missing alt" },
    { file: "src/Form.tsx", line: 22, element: "<button>", current: "Button (unlabeled)", fixed: "Close dialog", violation: "Missing aria-label" },
  ],
};

export const DEMO_PRS: FixPR[] = [
  { category: "contrast", url: "https://github.com/mahesh-diwan/a11y-forge-demo/pull/1", number: 1, fixCount: 2, explanation: "Fix color contrast in Button.tsx and Nav.tsx" },
  { category: "keyboard", url: "https://github.com/mahesh-diwan/a11y-forge-demo/pull/2", number: 2, fixCount: 2, explanation: "Fix keyboard traps in Nav.tsx and Modal.tsx" },
  { category: "headings", url: "https://github.com/mahesh-diwan/a11y-forge-demo/pull/3", number: 3, fixCount: 2, explanation: "Fix heading hierarchy in About.tsx" },
];
