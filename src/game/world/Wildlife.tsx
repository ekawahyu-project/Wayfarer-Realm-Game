"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";

const BIRD_COUNT = 32;
const BUTTERFLY_COUNT = 45;
const FISH_COUNT = 55;

// Articulated 3D Horse (Kuda) with Walking Legs, Neck, Mane & Tail
function AnimatedHorse({ cx, cz, color, phase, radius }: { cx: number; cz: number; color: string; phase: number; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);
  const leg3Ref = useRef<THREE.Mesh>(null);
  const leg4Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.45 + phase;
    const x = cx + Math.cos(t) * radius;
    const z = cz + Math.sin(t) * radius;
    const y = getExactMeshTerrainHeight(x, z);
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = -t;
    }
    const walk = Math.sin(state.clock.elapsedTime * 7.5 + phase) * 0.45;
    if (leg1Ref.current && leg2Ref.current && leg3Ref.current && leg4Ref.current) {
      leg1Ref.current.rotation.x = walk;
      leg2Ref.current.rotation.x = -walk;
      leg3Ref.current.rotation.x = -walk;
      leg4Ref.current.rotation.x = walk;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Horse Body */}
      <mesh castShadow position={[0, 1.15, 0]}><boxGeometry args={[0.75, 0.72, 1.75]} /><meshStandardMaterial color={color} roughness={0.7} /></mesh>
      {/* Neck & Head */}
      <mesh castShadow position={[0, 1.65, 0.75]} rotation={[0.45, 0, 0]}><boxGeometry args={[0.38, 0.85, 0.42]} /><meshStandardMaterial color={color} /></mesh>
      <mesh castShadow position={[0, 1.95, 1.05]} rotation={[0.25, 0, 0]}><boxGeometry args={[0.34, 0.34, 0.65]} /><meshStandardMaterial color={color} /></mesh>
      {/* Flowing Mane & Tail */}
      <mesh castShadow position={[0, 1.72, 0.55]} rotation={[0.45, 0, 0]}><boxGeometry args={[0.12, 0.8, 0.22]} /><meshStandardMaterial color="#1e1b18" /></mesh>
      <mesh castShadow position={[0, 1.05, -0.98]} rotation={[-0.35, 0, 0]}><cylinderGeometry args={[0.08, 0.14, 0.85, 8]} /><meshStandardMaterial color="#1e1b18" /></mesh>
      {/* 4 Articulated Legs */}
      <mesh ref={leg1Ref} castShadow position={[-0.26, 0.45, 0.62]}><cylinderGeometry args={[0.10, 0.08, 0.95, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={leg2Ref} castShadow position={[0.26, 0.45, 0.62]}><cylinderGeometry args={[0.10, 0.08, 0.95, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={leg3Ref} castShadow position={[-0.26, 0.45, -0.62]}><cylinderGeometry args={[0.10, 0.08, 0.95, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh ref={leg4Ref} castShadow position={[0.26, 0.45, -0.62]}><cylinderGeometry args={[0.10, 0.08, 0.95, 8]} /><meshStandardMaterial color={color} /></mesh>
    </group>
  );
}

// Articulated 3D Cow (Sapi) with Spots, Horns & Walking Legs
function AnimatedCow({ cx, cz, phase, radius }: { cx: number; cz: number; phase: number; radius: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.25 + phase;
    const x = cx + Math.cos(t) * radius;
    const z = cz + Math.sin(t) * radius;
    const y = getExactMeshTerrainHeight(x, z);
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = -t;
    }
    const walk = Math.sin(state.clock.elapsedTime * 4.5 + phase) * 0.32;
    if (leg1Ref.current && leg2Ref.current) {
      leg1Ref.current.rotation.x = walk;
      leg2Ref.current.rotation.x = -walk;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow position={[0, 0.95, 0]}><boxGeometry args={[0.88, 0.78, 1.55]} /><meshStandardMaterial color="#f8fafc" roughness={0.8} /></mesh>
      {/* Black Dairy Cow Spots */}
      <mesh position={[0.45, 1.0, 0.2]}><boxGeometry args={[0.04, 0.42, 0.55]} /><meshStandardMaterial color="#18181b" /></mesh>
      <mesh position={[-0.45, 0.95, -0.25]}><boxGeometry args={[0.04, 0.45, 0.5]} /><meshStandardMaterial color="#18181b" /></mesh>
      {/* Head, Pink Snout & Horns */}
      <mesh castShadow position={[0, 1.15, 0.92]}><boxGeometry args={[0.52, 0.48, 0.55]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh position={[0, 1.05, 1.22]}><boxGeometry args={[0.38, 0.24, 0.12]} /><meshStandardMaterial color="#fda4af" /></mesh>
      <mesh position={[-0.28, 1.42, 0.9]} rotation={[0, 0, 0.4]}><coneGeometry args={[0.06, 0.25, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
      <mesh position={[0.28, 1.42, 0.9]} rotation={[0, 0, -0.4]}><coneGeometry args={[0.06, 0.25, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
      {/* Legs */}
      <mesh ref={leg1Ref} castShadow position={[-0.28, 0.35, 0.5]}><cylinderGeometry args={[0.10, 0.09, 0.7, 8]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh ref={leg2Ref} castShadow position={[0.28, 0.35, 0.5]}><cylinderGeometry args={[0.10, 0.09, 0.7, 8]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh castShadow position={[-0.28, 0.35, -0.5]}><cylinderGeometry args={[0.10, 0.09, 0.7, 8]} /><meshStandardMaterial color="#f8fafc" /></mesh>
      <mesh castShadow position={[0.28, 0.35, -0.5]}><cylinderGeometry args={[0.10, 0.09, 0.7, 8]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </group>
  );
}

// Pecking 3D Chicken (Ayam) with Red Comb & Beak
function AnimatedChicken({ cx, cz, phase }: { cx: number; cz: number; phase: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.8 + phase;
    const x = cx + Math.cos(t) * 2.4;
    const z = cz + Math.sin(t * 1.3) * 2.4;
    const y = getExactMeshTerrainHeight(x, z);
    if (groupRef.current) {
      groupRef.current.position.set(x, y + Math.abs(Math.sin(t * 8)) * 0.05, z);
      groupRef.current.rotation.y = -t;
      groupRef.current.rotation.x = Math.max(0, Math.sin(t * 6)) * 0.35; // Pecking motion
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow position={[0, 0.28, 0]} scale={[0.8, 0.85, 1.15]}><sphereGeometry args={[0.22, 10, 10]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh castShadow position={[0, 0.46, 0.18]}><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color="#ffffff" /></mesh>
      {/* Red Comb (Jengger) & Yellow Beak */}
      <mesh position={[0, 0.60, 0.18]}><boxGeometry args={[0.04, 0.10, 0.12]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 0.46, 0.32]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.04, 0.10, 6]} /><meshStandardMaterial color="#f59e0b" /></mesh>
    </group>
  );
}

export default function Wildlife() {
  const birdRef = useRef<THREE.InstancedMesh>(null);
  const butterflyRef = useRef<THREE.InstancedMesh>(null);
  const fishRef = useRef<THREE.InstancedMesh>(null);

  const { birds, butterflies, fishes, horses, cows, chickens } = useMemo(() => {
    const bList = Array.from({ length: BIRD_COUNT }).map((_, i) => ({
      cx: ((i * 137) % 800) - 400, cz: ((i * 193) % 800) - 400,
      y: 38 + (i % 6) * 6, radius: 45 + (i % 5) * 18, speed: 0.25 + (i % 4) * 0.06, phase: i * 0.8,
    }));
    const bfList = Array.from({ length: BUTTERFLY_COUNT }).map((_, i) => {
      const x = ((i * 89) % 700) - 350, z = ((i * 113) % 600) - 250;
      return { x, y: Math.max(4.5, getExactMeshTerrainHeight(x, z) + 1.2), z, phase: i * 1.4 };
    });
    const fList = Array.from({ length: FISH_COUNT }).map((_, i) => ({
      cx: -575 - (i % 8) * 5, cz: ((i * 23) % 140) - 70, radius: 3.5 + (i % 4) * 1.8, speed: 0.9 + (i % 5) * 0.25, phase: i * 1.1,
    }));

    // 14 Horses across Central Meadow, Village Pastures & Kingdom Outskirts
    const hColors = ["#78350f", "#92400e", "#f8fafc", "#27272a", "#b45309"];
    const hList = [
      [-45, 25], [35, -30], [-110, 40], [180, -35], [275, 28], [285, -32],
      [-220, 210], [-210, -65], [-60, 260], [65, 255], [-160, -15], [95, 65],
    ].map(([cx, cz], i) => ({ cx, cz, color: hColors[i % hColors.length], phase: i * 1.3, radius: 6 + (i % 4) * 2 }));

    // 14 Cows grazing near Villages & Meadows
    const cList = [
      [265, -22], [255, 20], [425, -25], [430, 22], [-25, -45], [55, 35],
      [-240, 235], [-315, 245], [-210, -95], [-280, -90], [140, 25], [-85, 85],
    ].map(([cx, cz], i) => ({ cx, cz, phase: i * 1.7, radius: 4 + (i % 3) * 1.5 }));

    // 28 Chickens around all 3 Villages & Markets
    const chkList = [
      [355, -3], [362, 4], [372, -4], [348, 5], [380, 3], [335, -5], [392, -3], [368, 11],
      [322, 4], [405, 5], [-282, 235], [-274, 242], [-290, 240], [-266, 236],
      [-248, -92], [-238, -98], [-255, -95], [-232, -90], [12, -8], [-15, 12],
    ].map(([cx, cz], i) => ({ cx, cz, phase: i * 0.9 }));

    return { birds: bList, butterflies: bfList, fishes: fList, horses: hList, cows: cList, chickens: chkList };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (birdRef.current) {
      for (let i = 0; i < BIRD_COUNT; i++) {
        const b = birds[i];
        const angle = t * b.speed + b.phase;
        const flap = Math.sin(t * 7.5 + b.phase) * 0.25;
        dummy.position.set(b.cx + Math.cos(angle) * b.radius, b.y + flap, b.cz + Math.sin(angle) * b.radius);
        dummy.rotation.set(0, -angle, flap * 0.8);
        dummy.scale.set(1.2, 0.25, 0.65);
        dummy.updateMatrix();
        birdRef.current.setMatrixAt(i, dummy.matrix);
      }
      birdRef.current.instanceMatrix.needsUpdate = true;
    }
    if (butterflyRef.current) {
      for (let i = 0; i < BUTTERFLY_COUNT; i++) {
        const bf = butterflies[i];
        dummy.position.set(bf.x + Math.sin(t * 1.5 + bf.phase) * 2.5, bf.y + Math.sin(t * 3.8 + bf.phase) * 0.45, bf.z + Math.cos(t * 1.3 + bf.phase) * 2.5);
        dummy.rotation.set(0, t * 2 + bf.phase, Math.sin(t * 14 + bf.phase) * 0.6);
        dummy.scale.set(0.22, 0.05, 0.18);
        dummy.updateMatrix();
        butterflyRef.current.setMatrixAt(i, dummy.matrix);
      }
      butterflyRef.current.instanceMatrix.needsUpdate = true;
    }
    if (fishRef.current) {
      for (let i = 0; i < FISH_COUNT; i++) {
        const f = fishes[i];
        const angle = t * f.speed + f.phase;
        dummy.position.set(f.cx + Math.cos(angle) * f.radius, -0.55 + Math.sin(t * 2 + f.phase) * 0.1, f.cz + Math.sin(angle) * f.radius);
        dummy.rotation.set(0, -angle + Math.PI / 2, 0);
        dummy.scale.set(0.14, 0.18, 0.48);
        dummy.updateMatrix();
        fishRef.current.setMatrixAt(i, dummy.matrix);
      }
      fishRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="ambient-wildlife-and-livestock">
      {horses.map((h, i) => <AnimatedHorse key={"h" + i} {...h} />)}
      {cows.map((c, i) => <AnimatedCow key={"c" + i} {...c} />)}
      {chickens.map((chk, i) => <AnimatedChicken key={"chk" + i} {...chk} />)}
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
