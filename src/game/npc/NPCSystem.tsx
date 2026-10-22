"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getWalkableHeight } from "@/utils/noise";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getSculptedHumanGeometries } from "@/game/player/PlayerModel";
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
  hasCrown: boolean;
}

const headGeo = new THREE.SphereGeometry(0.148, 16, 16);
const hairGeo = new THREE.SphereGeometry(0.158, 16, 14);
const neckGeo = new THREE.CylinderGeometry(0.046, 0.056, 0.14, 10);
const crownGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.11, 8);
const eyeGeo = new THREE.SphereGeometry(0.022, 8, 8);
const skinMat = new THREE.MeshPhysicalMaterial({ color: "#ffe4d0", roughness: 0.38, sheen: 0.3 });
const eyeDarkMat = new THREE.MeshStandardMaterial({ color: "#0f172a" });
const pantMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.75 });
const leatherBeltMat = new THREE.MeshStandardMaterial({ color: "#451a03", roughness: 0.72 });
const goldCrownMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.85, roughness: 0.2 });

export default function NPCSystem() {
  const geos = useMemo(() => getSculptedHumanGeometries(), []);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const leftLegRefs = useRef<(THREE.Group | null)[]>([]);
  const rightLegRefs = useRef<(THREE.Group | null)[]>([]);
  const leftArmRefs = useRef<(THREE.Group | null)[]>([]);
  const rightArmRefs = useRef<(THREE.Group | null)[]>([]);

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
        hasCrown: Boolean(n.hasCrown),
      });
    });

    const extraCoords: [number, number, number, number][] = [
      [345, -2, 12, 0], [372, 2, -10, 0], [332, -11, 7, 0], [352, 11, 8, 0],
      [378, -11, -7, 0], [392, 11, 6, 0], [340, -26, 8, 0], [388, 26, -8, 0],
      [405, 0, 0, 10], [322, 0, 8, 0], [360, 28, 7, 0], [360, -28, -7, 0],
      [-295, 238, 10, 0], [-265, 242, -10, 0], [-290, 229, 7, 0], [-270, 251, -7, 0],
      [-305, 240, 0, 8], [-255, 240, 0, -8], [-285, 212, 8, 0], [-275, 268, -8, 0],
      [-260, -93, 10, 0], [-230, -97, -10, 0], [-255, -104, 7, 0], [-235, -86, -7, 0],
      [-270, -95, 0, 8], [-220, -95, 0, -8], [-250, -122, 8, 0], [-240, -68, -8, 0],
      [-4.5, 448, 0, 0], [4.5, 448, 0, 0], [-4.5, 436, 0, 0], [4.5, 436, 0, 0],
      [-8, 380, 0, 12], [8, 405, 0, -12],
    ];

    extraCoords.forEach(([x, z, dx, dz], idx) => {
      list.push({
        id: "citizen_" + idx,
        x, z, dx, dz,
        coatColor: coats[idx % coats.length],
        capeColor: coats[(idx + 3) % coats.length],
        hairColor: hairs[idx % hairs.length],
        isInteractive: false,
        hasCrown: false,
      });
    });

    return list;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    for (let i = 0; i < allPeople.length; i++) {
      const grp = groupRefs.current[i];
      if (!grp) continue;
      const p = allPeople[i];
      const distSq = (p.x - playerFrameState.x) * (p.x - playerFrameState.x) + (p.z - playerFrameState.z) * (p.z - playerFrameState.z);
      grp.visible = distSq < 135 * 135;
      if (!grp.visible) continue;

      const isMoving = Math.abs(p.dx) + Math.abs(p.dz) > 0.01;
      const t = time * 0.55 + i * 1.3;
      const wave = isMoving ? Math.sin(t) : 0;
      const wx = p.x + p.dx * wave;
      const wz = p.z + p.dz * wave;
      const wy = getWalkableHeight(wx, wz);

      const walkPhase = time * 7.5 + i * 2.1;
      const swing = isMoving ? Math.sin(walkPhase) * 0.55 : 0;
      const bounce = isMoving ? Math.abs(Math.sin(walkPhase)) * 0.04 : Math.sin(time * 2 + i) * 0.008;

      grp.position.set(wx, wy + 0.74 + bounce, wz);

      if (isMoving) {
        const vx = p.dx * Math.cos(t);
        const vz = p.dz * Math.cos(t);
        grp.rotation.y = Math.atan2(vx, vz);
      } else {
        grp.rotation.y = Math.PI;
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
    <group name="sculpted-human-npcs">
      {allPeople.map((p, i) => (
        <group key={p.id} ref={(el) => { groupRefs.current[i] = el; }}>
          <mesh geometry={geos.torsoTunic} position={[0, 0.04, 0]} castShadow>
            <meshPhysicalMaterial color={p.coatColor} roughness={0.55} sheen={0.35} />
          </mesh>
          <mesh position={[0, -0.11, 0]} scale={[1.12, 0.86, 0.72]} material={pantMat}>
            <sphereGeometry args={[0.132, 12, 10]} />
          </mesh>
          <mesh position={[0, -0.01, 0]} scale={[1.14, 1, 0.72]} material={leatherBeltMat}>
            <cylinderGeometry args={[0.122, 0.126, 0.052, 14]} />
          </mesh>
          <mesh geometry={neckGeo} material={skinMat} position={[0, 0.43, 0]} />

          <group ref={(el) => { leftLegRefs.current[i] = el; }} position={[-0.080, -0.15, 0]}>
            <mesh geometry={geos.thigh} material={pantMat} />
            <mesh geometry={geos.calfBoot} material={leatherBeltMat} position={[0, -0.27, 0]} />
            <mesh position={[0, -0.54, 0.03]} scale={[0.86, 0.72, 1.4]} material={leatherBeltMat}><sphereGeometry args={[0.054, 10, 8]} /></mesh>
          </group>
          <group ref={(el) => { rightLegRefs.current[i] = el; }} position={[0.080, -0.15, 0]}>
            <mesh geometry={geos.thigh} material={pantMat} />
            <mesh geometry={geos.calfBoot} material={leatherBeltMat} position={[0, -0.27, 0]} />
            <mesh position={[0, -0.54, 0.03]} scale={[0.86, 0.72, 1.4]} material={leatherBeltMat}><sphereGeometry args={[0.054, 10, 8]} /></mesh>
          </group>

          <group ref={(el) => { leftArmRefs.current[i] = el; }} position={[-0.160, 0.30, 0]} rotation={[0, 0, 0.11]}>
            <mesh position={[0.01, 0.01, 0]} material={pantMat}><sphereGeometry args={[0.052, 10, 8]} /></mesh>
            <mesh geometry={geos.upperArm}><meshStandardMaterial color={p.coatColor} roughness={0.58} /></mesh>
            <mesh geometry={geos.forearm} material={skinMat} position={[0, -0.19, 0]} />
            <group position={[0, -0.385, 0.005]}>
              <mesh scale={[0.42, 1.05, 0.82]} material={skinMat}><sphereGeometry args={[0.031, 10, 8]} /></mesh>
              <mesh position={[0.008, -0.006, 0.022]} rotation={[0.55, 0, 0.15]} material={skinMat}><capsuleGeometry args={[0.005, 0.018, 4, 4]} /></mesh>
              {[-0.01, 0, 0.01].map((fz, fi) => (
                <mesh key={fi} position={[0.003, -0.032, fz]} rotation={[0, 0, 0.18]} material={skinMat}><capsuleGeometry args={[0.005, 0.022, 4, 4]} /></mesh>
              ))}
            </group>
          </group>
          <group ref={(el) => { rightArmRefs.current[i] = el; }} position={[0.160, 0.30, 0]} rotation={[0, 0, -0.11]}>
            <mesh position={[-0.01, 0.01, 0]} material={pantMat}><sphereGeometry args={[0.052, 10, 8]} /></mesh>
            <mesh geometry={geos.upperArm}><meshStandardMaterial color={p.coatColor} roughness={0.58} /></mesh>
            <mesh geometry={geos.forearm} material={skinMat} position={[0, -0.19, 0]} />
            <group position={[0, -0.385, 0.005]}>
              <mesh scale={[0.42, 1.05, 0.82]} material={skinMat}><sphereGeometry args={[0.031, 10, 8]} /></mesh>
              <mesh position={[-0.008, -0.006, 0.022]} rotation={[0.55, 0, -0.15]} material={skinMat}><capsuleGeometry args={[0.005, 0.018, 4, 4]} /></mesh>
              {[-0.01, 0, 0.01].map((fz, fi) => (
                <mesh key={fi} position={[-0.003, -0.032, fz]} rotation={[0, 0, -0.18]} material={skinMat}><capsuleGeometry args={[0.005, 0.022, 4, 4]} /></mesh>
              ))}
            </group>
          </group>

          <group position={[0, 0.52, 0.01]} scale={[0.84, 0.86, 0.84]}>
            <mesh geometry={headGeo} material={skinMat} scale={[0.85, 1.04, 0.90]} />
            <mesh geometry={eyeGeo} material={eyeDarkMat} position={[-0.048, 0.01, 0.125]} />
            <mesh geometry={eyeGeo} material={eyeDarkMat} position={[0.048, 0.01, 0.125]} />
            <mesh geometry={hairGeo} position={[0, 0.045, -0.015]} scale={[0.92, 1.02, 0.98]}>
              <meshPhysicalMaterial color={p.hairColor} roughness={0.45} sheen={0.5} />
            </mesh>
            {p.hasCrown && <mesh geometry={crownGeo} material={goldCrownMat} position={[0, 0.19, 0]} />}
          </group>

          {p.isInteractive && (
            <mesh position={[0, 0.98, 0]}>
              <octahedronGeometry args={[0.11, 0]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.5} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
