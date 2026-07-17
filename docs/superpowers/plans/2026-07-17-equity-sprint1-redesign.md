# equity Sprint 1: Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3D ambient hero backdrop (R3F + React Spring) behind the existing live terminal, keeping dark-only theme and all current components intact.

**Architecture:** New `HeroScene` R3F canvas lazy-loaded (`ssr:false`) behind `ForgeHero`. Reduced-motion renders null. No changes to data/API layer. Nav, pages, component docs extended only.

**Tech Stack:** Next 16, React 19, three, @react-three/fiber, @react-three/drei, react-spring (or @react-spring/three), Tailwind v4.

## Global Constraints

- Keep `scanRepo` / `runWorkflow` / API response shapes unchanged.
- WCAG AA minimum. Dark-only. No light theme. No DB/auth/CI.
- 54 tests stay green.
- Custom motion `cubic-bezier(0.32,0.72,0,1)` 250ms.
- Banned fonts not used; Syne/DM Sans/JetBrains Mono stay.

---

### Task 1: Add 3D dependencies

**Files:**

- Modify: `package.json`

**Interfaces:**

- None.

- [ ] **Step 1: Add deps to package.json**

```json
"dependencies": {
  "three": "^0.171.0",
  "@react-three/fiber": "^9.0.0",
  "@react-three/drei": "^10.0.0",
  "@react-spring/three": "^9.7.5"
}
```

- [ ] **Step 2: Install**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm install`
Expected: added three, @react-three/fiber, @react-three/drei, @react-spring/three

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add R3F + react-spring deps for 3D hero"
```

### Task 2: Build HeroScene (R3F backdrop)

**Files:**

- Create: `src/components/HeroScene.tsx`

**Interfaces:**

- Consumes: none.
- Produces: default export `HeroScene` React component (renders `<Canvas>` with floating amber mesh + auto-rotate + pointer parallax).

- [ ] **Step 1: Write HeroScene.tsx**

```tsx
"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useSpring, animated } from "@react-spring/three";
import type { Group, Mesh } from "three";

function FloatingShape() {
  const mesh = useRef<Mesh>(null);
  const group = useRef<Group>(null);
  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.15;
    if (mesh.current) {
      mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.15;
    }
  });
  const { scale } = useSpring({
    scale: 1,
    config: { tension: 120, friction: 14 },
  });
  return (
    <group ref={group}>
      <animated.mesh ref={mesh} scale={scale as unknown as number}>
        <icosahedronGeometry args={[1.4, 1]} />
        <meshStandardMaterial
          color="#ffb700"
          emissive="#ffb700"
          emissiveIntensity={0.25}
          roughness={0.4}
          metalness={0.1}
          wireframe
        />
      </animated.mesh>
    </group>
  );
}

export function HeroScene() {
  return (
    <Canvas
      className="!absolute inset-0 -z-10"
      camera={{ position: [0, 0, 4], fov: 50 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={1.2} color="#ffb700" />
      <FloatingShape />
    </Canvas>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npx tsc --noEmit 2>&1 | head`
Expected: no type errors for HeroScene.

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroScene.tsx
git commit -m "feat: add R3F HeroScene backdrop"
```

### Task 3: Lazy-mount HeroScene in ForgeHero with reduced-motion guard

**Files:**

- Modify: `src/components/ForgeHero.tsx`
- Create: none (HeroScene from Task 2)

**Interfaces:**

- Consumes: `HeroScene` from `@/components/HeroScene`.
- Produces: ForgeHero renders HeroScene behind terminal when motion allowed.

- [ ] **Step 1: Add dynamic import + reduced-motion check**

At top of ForgeHero.tsx add:

```tsx
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion"; // or use useMediaQuery; if no framer, read matchMedia

const HeroScene = dynamic(
  () => import("@/components/HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => null,
  },
);
```

Add inside the bezel `div` (absolute layer behind content):

```tsx
{
  !prefersReduced && (
    <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
      <HeroScene />
    </div>
  );
}
```

Where `prefersReduced` = `window.matchMedia('(prefers-reduced-motion: reduce)').matches` captured in a `useState`/`useEffect` (guard SSR).

- [ ] **Step 2: Verify build**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm run build 2>&1 | tail -15`
Expected: build succeeds; 3D chunk split out.

- [ ] **Step 3: Commit**

```bash
git add src/components/ForgeHero.tsx
git commit -m "feat: mount HeroScene behind terminal, reduced-motion safe"
```

### Task 4: Nav + pages polish (dark-only, no toggle)

**Files:**

- Modify: `src/components/Nav.tsx` (optional load animation), `src/components/HowItWorksSection.tsx`, `src/components/DocsPage.tsx`, `src/components/Dashboard.tsx` as needed.

**Interfaces:**

- Consumes: existing components.
- Produces: verified amber contrast, no new theme code.

- [ ] **Step 1: Add subtle nav entrance (optional)**

In Nav.tsx header add `className` transition on mount (translate-y fade). Keep `cubic-bezier(0.32,0.72,0,1)`.

- [ ] **Step 2: Verify contrast**

Run a quick check: amber `#ffb700` on `#0a0908` = 11.39:1 (pass). No change needed unless new text added.

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.tsx src/components/HowItWorksSection.tsx src/components/DocsPage.tsx src/components/Dashboard.tsx
git commit -m "style: dark-only polish on nav + pages"
```

### Task 5: Component library docs update

**Files:**

- Modify: `DESIGN.md`

**Interfaces:**

- Consumes: HeroScene (Task 2).
- Produces: documented component.

- [ ] **Step 1: Add HeroScene + note dark-only to DESIGN.md Components table**

Add row: `| HeroScene | R3F ambient 3D backdrop behind ForgeHero, lazy, reduced-motion safe |`.

- [ ] **Step 2: Commit**

```bash
git add DESIGN.md
git commit -m "docs: add HeroScene to component library"
```

### Task 6: Full test + build gate

**Files:**

- None new.

- [ ] **Step 1: Run tests + build**

Run: `cd /home/mahesh-diwan/SPECTRE/Hackathons/OpenAI_Build_Week/accessibility-forge && npm test 2>&1 | tail -5 && npm run build 2>&1 | tail -10`
Expected: 54+ tests pass, build clean.

- [ ] **Step 2: Commit (if any fix)**

```bash
git add -A && git commit -m "test: sprint 1 green gate" || echo "nothing to commit"
```
