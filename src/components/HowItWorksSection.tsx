"use client";

import { Mermaid } from "./Mermaid";

const PIPELINE = `flowchart LR
    A["<b>1. Paste project link</b><br/><span style='font-size:11px'>github.com/owner/repo</span>"]
    B["<b>2. Check code</b><br/><span style='font-size:11px'>Find problems</span>"]
    C["<b>3. Sort by importance</b><br/><span style='font-size:11px'>Group similar issues</span>"]
    D["<b>4. Write fixes</b><br/><span style='font-size:11px'>Fix each issue</span>"]
    E["<b>5. Send updates</b><br/><span style='font-size:11px'>Pull request ready</span>"]

    A --> B --> C --> D --> E

    style A fill:#2a2525,stroke:#9a9897,color:#cfcecd
    style B fill:#2a2525,stroke:#8bc48b,color:#cfcecd
    style C fill:#2a2525,stroke:#f5b544,color:#cfcecd
    style D fill:#2a2525,stroke:#8aa4d6,color:#cfcecd
    style E fill:#2a2525,stroke:#8bc48b,color:#cfcecd`;



const STEPS = [
  {
    step: "01",
    label: "Check",
    desc: "The tool reads your website files and looks for common accessibility problems: images without descriptions, buttons without labels, text that is hard to read, and keyboard navigation issues.",
  },
  {
    step: "02",
    label: "Group",
    desc: "Problems are sorted by type — missing image descriptions, hard-to-read text, unclear buttons. The most important issues come first so you know what matters most.",
  },
  {
    step: "03",
    label: "Fix",
    desc: "For each group of problems, the tool writes the actual code fixes. It adds descriptions to images, labels to buttons, readable colors, and everything else needed.",
  },
  {
    step: "04",
    label: "Submit",
    desc: "The tool creates a pull request (a suggested update) for each group of fixes. You review the changes and approve them. Once merged, your website works for more people.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mt-16 scroll-mt-24">
      <h1 className="sr-only">How it works</h1>
      <div className="bezel">
        <div className="bezel-core p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">
            What happens when you scan
          </h2>
          <p className="mt-3 max-w-2xl text-sm" style={{ color: "var(--color-muted)" }}>
            Paste a link to your project. The tool checks every file for accessibility issues,
            groups them by type, writes the fixes, and sends them back as ready-to-merge updates.
            No accessibility expertise required to start — every fix is a reviewable pull request.
          </p>
          <p className="mt-2 max-w-2xl font-mono text-[11px]" style={{ color: "var(--color-pass)" }}>
            Scans HTML/JSX source for common WCAG issues. Not a substitute for manual screen-reader testing.
          </p>

          <div className="mt-8">
            <div className="bezel">
              <div className="bezel-core p-4">
                <Mermaid chart={PIPELINE} />
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.step} className="bezel">
                <div className="bezel-core p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] font-bold" style={{ background: "var(--color-surface)", color: "var(--color-pass)" }}>
                      {s.step}
                    </span>
                    <span className="font-mono text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                      {s.label}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>
    </section>
  );
}
