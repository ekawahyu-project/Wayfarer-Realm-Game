"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";

const BIRD_COUNT = 28;
const BUTTERFLY_COUNT = 45;
const FISH_COUNT = 55;

export default function Wildlife() {
  const birdRef = useRef<THREE.InstancedMesh>(null);
  const butterflyRef = useRef<THREE.InstancedMesh>(null);
  const fishRef = useRef<THREE.InstancedMesh>(null);

  const { birds, butterflies, fishes } = useMemo(() => {
    const bList = Array.from({ length: BIRD_COUNT }).map((_, i) => ({
      cx: ((i * 137) % 800) - 400,
      cz: ((i * 193) % 800) - 400,
      y: 38 + (i % 6) * 6,
      radius: 45 + (i % 5) * 18,
      speed: 0.25 + (i % 4) * 0.06,
      phase: i * 0.8,
    }));

    const bfList = Array.from({ length: BUTTERFLY_COUNT }).map((_, i) => {
      const x = ((i * 89) % 700) - 350;
      const z = ((i * 113) % 600) - 250;
      return {
        x,
        y: Math.max(4.5, getTerrainHeight(x, z) + 1.2),
        z,
        phase: i * 1.4,
      };
    });

    // Shallow water fishes along West Beach & Dock
    const fList = Array.from({ length: FISH_COUNT }).map((_, i) => ({
      cx: -612 - (i % 8) * 6,
      cz: ((i * 23) % 160) - 80,
      radius: 3.5 + (i % 4) * 1.8,
      speed: 0.9 + (i % 5) * 0.25,
      phase: i * 1.1,
    }));

    return { birds: bList, butterflies: bfList, fishes: fList };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 1. Soaring Birds
    if (birdRef.current) {
      for (let i = 0; i < BIRD_COUNT; i++) {
        const b = birds[i];
        const angle = t * b.speed + b.phase;
        const bx = b.cx + Math.cos(angle) * b.radius;
        const bz = b.cz + Math.sin(angle) * b.radius;
        const flap = Math.sin(t * 7.5 + b.phase) * 0.25;
        dummy.position.set(bx, b.y + flap, bz);
        dummy.rotation.set(0, -angle, flap * 0.8);
        dummy.scale.set(1.2, 0.25, 0.65);
        dummy.updateMatrix();
        birdRef.current.setMatrixAt(i, dummy.matrix);
      }
      birdRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Meadow & Village Butterflies
    if (butterflyRef.current) {
      for (let i = 0; i < BUTTERFLY_COUNT; i++) {
        const bf = butterflies[i];
        const bx = bf.x + Math.sin(t * 1.5 + bf.phase) * 2.5;
        const by = bf.y + Math.sin(t * 3.8 + bf.phase) * 0.45;
        const bz = bf.z + Math.cos(t * 1.3 + bf.phase) * 2.5;
        dummy.position.set(bx, by, bz);
        dummy.rotation.set(0, t * 2 + bf.phase, Math.sin(t * 14 + bf.phase) * 0.6);
        dummy.scale.set(0.22, 0.05, 0.18);
        dummy.updateMatrix();
        butterflyRef.current.setMatrixAt(i, dummy.matrix);
      }
      butterflyRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Shallow Reef Fishes at West Beach
    if (fishRef.current) {
      for (let i = 0; i < FISH_COUNT; i++) {
        const f = fishes[i];
        const angle = t * f.speed + f.phase;
        const fx = f.cx + Math.cos(angle) * f.radius;
        const fz = f.cz + Math.sin(angle) * f.radius;
        dummy.position.set(fx, -0.55 + Math.sin(t * 2 + f.phase) * 0.1, fz);
        dummy.rotation.set(0, -angle + Math.PI / 2, 0);
        dummy.scale.set(0.14, 0.18, 0.48);
        dummy.updateMatrix();
        fishRef.current.setMatrixAt(i, dummy.matrix);
      }
      fishRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="ambient-wildlife">
      <instancedMesh ref={birdRef} args={[undefined, undefined, BIRD_COUNT]} frustumCulled={false}>
        <coneGeometry args={[0.45, 1.1, 4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={butterflyRef} args={[undefined, undefined, BUTTERFLY_COUNT]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#fbbf24" />
      </instancedMesh>
      <instancedMesh ref={fishRef} args={[undefined, undefined, FISH_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#fb923c" roughness={0.4} />
      </instancedMesh>
    </group>
  );
}
