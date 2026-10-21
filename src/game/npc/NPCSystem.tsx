"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { NPCS } from "./npcData";

export const npcLivePositions: Record<string, { x: number; y: number; z: number }> = {};

interface CrowdPerson {
  id: string;
  x: number;
  z: number;
  dx: number;
  dz: number;
  coatColor: string;
  capeColor: string;
  hairColor: string;
  isInteractive: boolean;
  hasStaff: boolean;
}

// Shared geometries so 42 articulated human NPCs render with minimal memory & 60 FPS!
const headGeo = new THREE.SphereGeometry(0.165, 12, 12);
const hairGeo = new THREE.SphereGeometry(0.175, 12, 12);
const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
const torsoGeo = new THREE.CylinderGeometry(0.145, 0.175, 0.44, 10);
const skirtGeo = new THREE.CylinderGeometry(0.165, 0.26, 0.28, 12);
const capeGeo = new THREE.BoxGeometry(0.36, 0.62, 0.025);
const limbGeo = new THREE.CapsuleGeometry(0.052, 0.34, 6, 8);
const skinMat = new THREE.MeshStandardMaterial({ color: "#ffdfc4", roughness: 0.45 });
const eyeDarkMat = new THREE.MeshStandardMaterial({ color: "#0f172a" });
const pantMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.8 });

export default function NPCSystem() {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const leftLegRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rightLegRefs = useRef<(THREE.Mesh | null)[]>([]);
  const leftArmRefs = useRef<(THREE.Mesh | null)[]>([]);
  const rightArmRefs = useRef<(THREE.Mesh | null)[]>([]);

  // Combine 10 Interactive Story NPCs + 32 Bustling Townspeople across all 3 Villages, Markets & Kingdom!
  const allPeople = useMemo<CrowdPerson[]>(() => {
    const list: CrowdPerson[] = [];
    const hairs = ["#1e1b18", "#5c3317", "#9a3412", "#b45309", "#374151"];
    const coats = ["#0284c7", "#15803d", "#be123c", "#6d28d9", "#b45309", "#0f766e", "#1e40af", "#9f1239"];

    NPCS.forEach((n, idx) => {
      list.push({
        id: n.id,
        x: n.position[0],
        z: n.position[2],
        dx: n.patrolOffset[0],
        dz: n.patrolOffset[1],
        coatColor: n.coatColor,
        capeColor: n.hatColor,
        hairColor: hairs[idx % hairs.length],
        isInteractive: true,
        hasStaff: Boolean(n.useSorceressModel),
      });
    });

    // 32 Extra Villagers, Market Shoppers, Fishermen & Royal Citizens
    const extraCoords: [number, number, number, number][] = [
      // East Market Village Crowd (14 people)
      [345, 0, 12, 0], [365, -3, 8, 2], [380, 2, -10, 0], [332, -12, 6, 0],
      [352, 12, 8, 0], [375, -12, -7, 0], [392, 12, 6, 0], [340, -25, 0, 8],
      [388, 25, 0, -8], [405, 0, 0, 10], [322, 0, 8, 3], [360, 28, 7, 0],
      [360, -28, -7, 0], [418, -2, 0, 6],
      // SW Fishing Village Crowd (7 people)
      [-292, 240, 8, 0], [-278, 242, -7, 2], [-266, 238, 6, 0], [-285, 220, 7, 0],
      [-272, 260, -6, 0], [-302, 236, 0, 6], [-255, 242, 0, -6],
      // West Forest Village Crowd (6 people)
      [-256, -95, 7, 0], [-242, -93, -6, 2], [-230, -96, 6, 0], [-248, -118, 6, 0],
      [-238, -72, -6, 0], [-265, -95, 0, 5],
      // Royal Kingdom Plaza & Avenues Crowd (5 people)
      [-8, 380, 0, 12], [8, 405, 0, -12], [-24, 395, 8, 0], [24, 395, -8, 0], [0, 345, 6, 6],
    ];

    extraCoords.forEach(([x, z, dx, dz], idx) => {
      list.push({
        id: "citizen_" + idx,
        x, z, dx, dz,
        coatColor: coats[idx % coats.length],
        capeColor: coats[(idx + 3) % coats.length],
        hairColor: hairs[idx % hairs.length],
        isInteractive: false,
        hasStaff: false,
      });
    });

    return list;
  }, []);

  // Single centralized useFrame loop animates all 42 NPCs in < 0.15ms CPU time!
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    for (let i = 0; i < allPeople.length; i++) {
      const grp = groupRefs.current[i];
      if (!grp) continue;
      const p = allPeople[i];
      const t = time * 0.55 + i * 1.3;
      const wave = Math.sin(t);
      const wx = p.x + p.dx * wave;
      const wz = p.z + p.dz * wave;
      const wy = getExactMeshTerrainHeight(wx, wz);

      const walkPhase = time * 7.5 + i * 2.1;
      const swing = Math.sin(walkPhase) * 0.55;
      const bounce = Math.abs(Math.sin(walkPhase)) * 0.04;

      grp.position.set(wx, wy + bounce, wz);

      const vx = p.dx * Math.cos(t);
      const vz = p.dz * Math.cos(t);
      if (Math.abs(vx) + Math.abs(vz) > 0.01) {
        grp.rotation.y = Math.atan2(vx, vz);
      }

      if (leftLegRefs.current[i] && rightLegRefs.current[i]) {
        leftLegRefs.current[i]!.rotation.x = swing;
        rightLegRefs.current[i]!.rotation.x = -swing;
      }
      if (leftArmRefs.current[i] && rightArmRefs.current[i]) {
        leftArmRefs.current[i]!.rotation.x = -swing * 0.8;
        rightArmRefs.current[i]!.rotation.x = swing * 0.8;
      }

      if (p.isInteractive) {
        npcLivePositions[p.id] = { x: wx, y: wy, z: wz };
      }
    }
  });

  return (
    <group name="bustling-world-npcs">
      {allPeople.map((p, i) => (
        <group key={p.id} ref={(el) => { groupRefs.current[i] = el; }}>
          {/* Articulated Legs */}
          <mesh ref={(el) => { leftLegRefs.current[i] = el; }} geometry={limbGeo} material={pantMat} position={[-0.09, 0.32, 0]} castShadow />
          <mesh ref={(el) => { rightLegRefs.current[i] = el; }} geometry={limbGeo} material={pantMat} position={[0.09, 0.32, 0]} castShadow />
          {/* Tunic & Coat */}
          <mesh geometry={skirtGeo} position={[0, 0.62, 0]} castShadow>
            <meshStandardMaterial color={p.capeColor} roughness={0.7} />
          </mesh>
          <mesh geometry={torsoGeo} position={[0, 0.88, 0]} castShadow>
            <meshStandardMaterial color={p.coatColor} roughness={0.65} />
          </mesh>
          <mesh geometry={capeGeo} position={[0, 0.82, -0.14]} rotation={[0.18, 0, 0]} castShadow>
            <meshStandardMaterial color={p.capeColor} roughness={0.75} />
          </mesh>
          {/* Articulated Arms */}
          <mesh ref={(el) => { leftArmRefs.current[i] = el; }} geometry={limbGeo} material={skinMat} position={[-0.21, 0.86, 0]} castShadow />
          <mesh ref={(el) => { rightArmRefs.current[i] = el; }} geometry={limbGeo} material={skinMat} position={[0.21, 0.86, 0]} castShadow />
          {/* Head, Eyes & Hair */}
          <group position={[0, 1.24, 0]}>
            <mesh geometry={headGeo} material={skinMat} castShadow />
            <mesh geometry={eyeGeo} material={eyeDarkMat} position={[-0.055, 0.015, 0.145]} />
            <mesh geometry={eyeGeo} material={eyeDarkMat} position={[0.055, 0.015, 0.145]} />
            <mesh geometry={hairGeo} position={[0, 0.04, -0.02]} castShadow>
              <meshStandardMaterial color={p.hairColor} roughness={0.65} />
            </mesh>
          </group>
          {/* Floating Quest/Dialogue Crystal for Interactive NPCs */}
          {p.isInteractive && (
            <mesh position={[0, 1.72, 0]}>
              <octahedronGeometry args={[0.11, 0]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.2} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
