"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { NPCS, NPCDef } from "./npcData";
import { DigitalHumanCharacter } from "@/game/player/PlayerModel";

export const npcLivePositions: Record<string, { x: number; y: number; z: number }> = {};

function SingleNPC({ npc, index }: { npc: NPCDef; index: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime * 0.55 + index * 1.7;
    const wave = Math.sin(t);
    const wx = npc.position[0] + npc.patrolOffset[0] * wave;
    const wz = npc.position[2] + npc.patrolOffset[1] * wave;
    const wy = getExactMeshTerrainHeight(wx, wz);

    // Foot offset +0.76m so NPC boots sit firmly on ground
    groupRef.current.position.set(wx, wy + 0.76, wz);

    const dx = npc.patrolOffset[0] * Math.cos(t);
    const dz = npc.patrolOffset[1] * Math.cos(t);
    if (Math.abs(dx) + Math.abs(dz) > 0.01) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }

    npcLivePositions[npc.id] = { x: wx, y: wy, z: wz };
  });

  const hairColors = ["#1e1b18", "#5c3317", "#9a3412", "#d97706", "#374151"];
  const speedMag = Math.hypot(npc.patrolOffset[0], npc.patrolOffset[1]);

  return (
    <group ref={groupRef}>
      <DigitalHumanCharacter
        coatColor={npc.coatColor}
        skirtColor="#1e293b"
        capeColor={npc.hatColor}
        hairColor={hairColors[index % hairColors.length]}
        isNpc={true}
        npcWalkSpeed={speedMag}
        npcSeed={index + 1}
        hasStaff={Boolean(npc.useSorceressModel)}
      />
      <mesh position={[0, 1.05, 0]}>
        <octahedronGeometry args={[0.11, 0]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.2} />
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
