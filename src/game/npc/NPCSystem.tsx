"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { NPCS, NPCDef } from "./npcData";

function StylizedVillagerMesh({ coatColor, hatColor, isSorceress }: { coatColor: string; hatColor: string; isSorceress?: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.18, 0.26, 0.85, 10]} />
        <meshStandardMaterial color={coatColor} roughness={0.75} />
      </mesh>
      <mesh castShadow position={[0, 1.32, 0]}>
        <sphereGeometry args={[0.17, 14, 14]} />
        <meshStandardMaterial color="#fde68a" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 1.54, 0]}>
        <coneGeometry args={[0.26, isSorceress ? 0.52 : 0.28, 10]} />
        <meshStandardMaterial color={hatColor} roughness={0.8} />
      </mesh>
      {isSorceress && (
        <group position={[0.32, 0.9, 0.15]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.03, 1.65, 8]} />
            <meshStandardMaterial color="#451a03" />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export const npcLivePositions: Record<string, { x: number; y: number; z: number }> = {};

function SingleNPC({ npc, index }: { npc: NPCDef; index: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * 0.45 + index * 1.7;
    const wave = Math.sin(t);
    const wx = npc.position[0] + npc.patrolOffset[0] * wave;
    const wz = npc.position[2] + npc.patrolOffset[1] * wave;
    const wy = getTerrainHeight(wx, wz);

    groupRef.current.position.set(wx, wy, wz);

    const dx = npc.patrolOffset[0] * Math.cos(t);
    const dz = npc.patrolOffset[1] * Math.cos(t);
    if (Math.abs(dx) + Math.abs(dz) > 0.01) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }

    npcLivePositions[npc.id] = { x: wx, y: wy, z: wz };
  });

  return (
    <group ref={groupRef}>
      <StylizedVillagerMesh coatColor={npc.coatColor} hatColor={npc.hatColor} isSorceress={npc.useSorceressModel} />
      <mesh position={[0, 2.15, 0]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.0} />
      </mesh>
    </group>
  );
}

export default function NPCSystem() {
  return (
    <group name="world-npcs">
      {NPCS.map((npc, i) => (
        <SingleNPC key={npc.id} npc={npc} index={i} />
      ))}
    </group>
  );
}
