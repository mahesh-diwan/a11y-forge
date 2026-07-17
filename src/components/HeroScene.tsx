"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import { useSpring, animated } from "@react-spring/three";
import type { Group, Mesh } from "three";

function FloatingShape() {
  const mesh = useRef<Mesh>(null);
  const group = useRef<Group>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const el = document.getElementById("forge");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), {
      threshold: 0.1,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useFrame((state, delta) => {
    if (!active) return;
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
