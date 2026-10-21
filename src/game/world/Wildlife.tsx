"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { playerFrameState } from "@/game/state/usePlayerStore";

const BIRD_COUNT = 32;
const BUTTERFLY_COUNT = 45;
const FISH_COUNT = 55;

export interface HorsePosition { x: number; y: number; z: number; yaw: number; }
export const horseLivePositions: HorsePosition[] = [];

function AnimatedHorse({
  index,
  cx,
  cz,
  color,
  phase,
  radius,
  horseTex,
}: {
  index: number;
  cx: number;
  cz: number;
  color: string;
  phase: number;
  radius: number;
  horseTex: THREE.CanvasTexture;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);
  const leg3Ref = useRef<THREE.Mesh>(null);
  const leg4Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const isMountedByPlayer = playerFrameState.mountedHorseIndex === index;
    let x = cx, z = cz, y = 0, yaw = 0, animSpeed = 0;

    if (isMountedByPlayer) {
      x = playerFrameState.x;
      z = playerFrameState.z;
      y = getExactMeshTerrainHeight(x, z);
      yaw = playerFrameState.horseYaw;
      animSpeed = playerFrameState.isMoving ? (playerFrameState.isRunning ? 16.0 : 10.5) : 0;
    } else {
      const t = state.clock.elapsedTime * 0.4 + phase;
      x = cx + Math.cos(t) * radius;
      z = cz + Math.sin(t) * radius;
      y = getExactMeshTerrainHeight(x, z);
      yaw = -t;
      animSpeed = 6.5;
    }

    horseLivePositions[index] = { x, y, z, yaw };

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = yaw;
    }
    const walk = animSpeed > 0 ? Math.sin(state.clock.elapsedTime * animSpeed + phase) * 0.52 : 0;
    if (leg1Ref.current && leg2Ref.current && leg3Ref.current && leg4Ref.current) {
      leg1Ref.current.rotation.x = walk;
      leg2Ref.current.rotation.x = -walk;
      leg3Ref.current.rotation.x = -walk;
      leg4Ref.current.rotation.x = walk;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Sculpted Textured Horse Body, Chest & Haunches (No Saddle/Tack needed) */}
      <mesh castShadow position={[0, 1.15, 0]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.38, 1.05, 10, 14]} /><meshStandardMaterial map={horseTex} color={color} roughness={0.65} /></mesh>
      {/* Neck, Head, Ears & Eyes */}
      <mesh castShadow position={[0, 1.65, 0.72]} rotation={[0.45, 0, 0]}><capsuleGeometry args={[0.20, 0.65, 8, 12]} /><meshStandardMaterial map={horseTex} color={color} roughness={0.65} /></mesh>
      <mesh castShadow position={[0, 1.98, 1.04]} rotation={[0.28, 0, 0]}><capsuleGeometry args={[0.16, 0.42, 8, 12]} /><meshStandardMaterial map={horseTex} color={color} roughness={0.65} /></mesh>
      <mesh position={[-0.12, 2.22, 0.92]}><coneGeometry args={[0.05, 0.16, 6]} /><meshStandardMaterial map={horseTex} color={color} /></mesh>
      <mesh position={[0.12, 2.22, 0.92]}><coneGeometry args={[0.05, 0.16, 6]} /><meshStandardMaterial map={horseTex} color={color} /></mesh>
      <mesh position={[-0.15, 2.02, 1.05]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
      <mesh position={[0.15, 2.02, 1.05]}><sphereGeometry args={[0.03, 8, 8]} /><meshStandardMaterial color="#0f172a" /></mesh>
      {/* Flowing Mane & Tail */}
      <mesh castShadow position={[0, 1.72, 0.52]} rotation={[0.45, 0, 0]}><boxGeometry args={[0.10, 0.85, 0.22]} /><meshStandardMaterial color="#18181b" /></mesh>
      <mesh castShadow position={[0, 1.05, -0.98]} rotation={[-0.35, 0, 0]}><cylinderGeometry args={[0.07, 0.15, 0.9, 8]} /><meshStandardMaterial color="#18181b" /></mesh>
      {/* 4 Articulated Legs with Dark Hooves */}
      <mesh ref={leg1Ref} castShadow position={[-0.24, 0.48, 0.58]}><cylinderGeometry args={[0.09, 0.07, 0.96, 8]} /><meshStandardMaterial map={horseTex} color={color} /></mesh>
      <mesh ref={leg2Ref} castShadow position={[0.24, 0.48, 0.58]}><cylinderGeometry args={[0.09, 0.07, 0.96, 8]} /><meshStandardMaterial map={horseTex} color={color} /></mesh>
      <mesh ref={leg3Ref} castShadow position={[-0.24, 0.48, -0.58]}><cylinderGeometry args={[0.09, 0.07, 0.96, 8]} /><meshStandardMaterial map={horseTex} color={color} /></mesh>
      <mesh ref={leg4Ref} castShadow position={[0.24, 0.48, -0.58]}><cylinderGeometry args={[0.09, 0.07, 0.96, 8]} /><meshStandardMaterial map={horseTex} color={color} /></mesh>
    </group>
  );
}

function AnimatedCow({ cx, cz, phase, radius, cowTex }: { cx: number; cz: number; phase: number; radius: number; cowTex: THREE.CanvasTexture }) {
  const groupRef = useRef<THREE.Group>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.25 + phase;
    const x = cx + Math.cos(t) * radius, z = cz + Math.sin(t) * radius;
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
      <mesh castShadow position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}><capsuleGeometry args={[0.42, 0.85, 10, 14]} /><meshStandardMaterial map={cowTex} roughness={0.75} /></mesh>
      <mesh castShadow position={[0, 1.15, 0.88]}><boxGeometry args={[0.48, 0.46, 0.52]} /><meshStandardMaterial map={cowTex} /></mesh>
      <mesh position={[0, 1.05, 1.16]}><boxGeometry args={[0.36, 0.24, 0.12]} /><meshStandardMaterial color="#fda4af" /></mesh>
      <mesh position={[-0.26, 1.42, 0.86]} rotation={[0, 0, 0.4]}><coneGeometry args={[0.05, 0.24, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
      <mesh position={[0.26, 1.42, 0.86]} rotation={[0, 0, -0.4]}><coneGeometry args={[0.05, 0.24, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
      <mesh ref={leg1Ref} castShadow position={[-0.26, 0.35, 0.48]}><cylinderGeometry args={[0.09, 0.08, 0.7, 8]} /><meshStandardMaterial map={cowTex} /></mesh>
      <mesh ref={leg2Ref} castShadow position={[0.26, 0.35, 0.48]}><cylinderGeometry args={[0.09, 0.08, 0.7, 8]} /><meshStandardMaterial map={cowTex} /></mesh>
      <mesh castShadow position={[-0.26, 0.35, -0.48]}><cylinderGeometry args={[0.09, 0.08, 0.7, 8]} /><meshStandardMaterial map={cowTex} /></mesh>
      <mesh castShadow position={[0.26, 0.35, -0.48]}><cylinderGeometry args={[0.09, 0.08, 0.7, 8]} /><meshStandardMaterial map={cowTex} /></mesh>
    </group>
  );
}

function AnimatedChicken({ cx, cz, phase }: { cx: number; cz: number; phase: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime * 0.8 + phase;
    const x = cx + Math.cos(t) * 2.4, z = cz + Math.sin(t * 1.3) * 2.4;
    const y = getExactMeshTerrainHeight(x, z);
    if (groupRef.current) {
      groupRef.current.position.set(x, y + Math.abs(Math.sin(t * 8)) * 0.05, z);
      groupRef.current.rotation.y = -t;
      groupRef.current.rotation.x = Math.max(0, Math.sin(t * 6)) * 0.35;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow position={[0, 0.28, 0]} scale={[0.8, 0.85, 1.15]}><sphereGeometry args={[0.22, 10, 10]} /><meshStandardMaterial color="#fef3c7" roughness={0.8} /></mesh>
      <mesh castShadow position={[0, 0.46, 0.18]}><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      <mesh position={[0, 0.60, 0.18]}><boxGeometry args={[0.04, 0.10, 0.12]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 0.46, 0.32]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.04, 0.10, 6]} /><meshStandardMaterial color="#f59e0b" /></mesh>
    </group>
  );
}

export default function Wildlife() {
  const birdRef = useRef<THREE.InstancedMesh>(null);
  const butterflyRef = useRef<THREE.InstancedMesh>(null);
  const fishRef = useRef<THREE.InstancedMesh>(null);
  const textures = useMemo(() => getWorldTextures(), []);

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

    // Rideable Horses placed near West Beach Spawn, Central Meadow, All 3 Villages & Kingdom Entrance!
    const hColors = ["#a16207", "#78350f", "#f8fafc", "#52525b", "#b45309"];
    const hList = [
      [-515, 10], [-15, 12], [292, 8], [-270, 178], [-235, -36], [12, 298],
      [-45, -25], [160, -20], [285, -28], [-210, 200], [-200, -65], [-60, 260],
    ].map(([cx, cz], i) => ({ cx, cz, color: hColors[i % hColors.length], phase: i * 1.3, radius: 4.5 }));

    const cList = [
      [265, -22], [255, 20], [440, -25], [440, 22], [-25, -45], [55, 35],
      [-240, 170], [-325, 180], [-200, -35], [-290, -35], [140, 25], [-85, 85],
    ].map(([cx, cz], i) => ({ cx, cz, phase: i * 1.7, radius: 4 + (i % 3) * 1.5 }));

    const chkList = [
      [355, -3], [362, 4], [372, -4], [348, 5], [380, 3], [335, -5],
      [-282, 235], [-274, 242], [-290, 240], [-248, -92], [-238, -98], [-255, -95],
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
      {horses.map((h, i) => <AnimatedHorse key={"h" + i} index={i} horseTex={textures.horseCoat} {...h} />)}
      {cows.map((c, i) => <AnimatedCow key={"c" + i} cowTex={textures.cowHide} {...c} />)}
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
