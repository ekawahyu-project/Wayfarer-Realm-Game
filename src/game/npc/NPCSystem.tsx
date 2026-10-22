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
  hairColor: string;
  isInteractive: boolean;
  hasCrown: boolean;
}

const headGeo = new THREE.SphereGeometry(0.148, 14, 14);
const hairGeo = new THREE.SphereGeometry(0.158, 14, 12);
const bangGeo = new THREE.CapsuleGeometry(0.035, 0.08, 4, 6);
const neckGeo = new THREE.CylinderGeometry(0.046, 0.056, 0.13, 8);
const crownGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.11, 8);
const eyeWhiteGeo = new THREE.SphereGeometry(0.024, 8, 8);
const eyePupilGeo = new THREE.SphereGeometry(0.014, 8, 8);
const handGeo = new THREE.SphereGeometry(0.034, 8, 8);
const bootGeo = new THREE.SphereGeometry(0.054, 8, 8);

const skinMat = new THREE.MeshStandardMaterial({ color: "#ffdfc4", roughness: 0.45 });
const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
const eyeDarkMat = new THREE.MeshBasicMaterial({ color: "#1e3a8a" });
const pantMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.72 });
const leatherBeltMat = new THREE.MeshStandardMaterial({ color: "#451a03", roughness: 0.70 });
const goldCrownMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.8, roughness: 0.2 });

export default function NPCSystem() {
  const geos = useMemo(() => getSculptedHumanGeometries(), []);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const leftLegRefs = useRef<(THREE.Group | null)[]>([]);
  const rightLegRefs = useRef<(THREE.Group | null)[]>([]);
  const leftArmRefs = useRef<(THREE.Group | null)[]>([]);
  const rightArmRefs = useRef<(THREE.Group | null)[]>([]);

  const allPeople = useMemo<CrowdPerson[]>(() => {
    const list: CrowdPerson[] = [];
    const hairs = ["#2b170e", "#5c3317", "#9a3412", "#b45309", "#374151"];
    const coats = ["#2563eb", "#16a34a", "#e11d48", "#7c3aed", "#d97706", "#0d9488", "#1d4ed8", "#be123c"];

    NPCS.forEach((n, idx) => {
      list.push({
        id: n.id,
        x: n.position[0],
        z: n.position[2],
        dx: n.patrolOffset[0],
        dz: n.patrolOffset[1],
        coatColor: n.coatColor,
        hairColor: hairs[idx % hairs.length],
        isInteractive: true,
        hasCrown: Boolean(n.hasCrown),
      });
    });

    const extraCoords: [number, number, number, number][] = [
      [345, -2, 12, 0], [372, 2, -10, 0], [332, -11, 7, 0], [352, 11, 8, 0],
      [378, -11, -7, 0], [392, 11, 6, 0], [405, 0, 0, 10], [322, 0, 8, 0],
      [-295, 238, 10, 0], [-265, 242, -10, 0], [-290, 229, 7, 0], [-270, 251, -7, 0],
      [-260, -93, 10, 0], [-230, -97, -10, 0], [-255, -104, 7, 0], [-235, -86, -7, 0],
      [-4.5, 448, 0, 0], [4.5, 448, 0, 0], [-4.5, 436, 0, 0], [4.5, 436, 0, 0],
    ];

    extraCoords.forEach(([x, z, dx, dz], idx) => {
      list.push({
        id: "citizen_" + idx,
        x, z, dx, dz,
        coatColor: coats[idx % coats.length],
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
      // Smart Distance Culling at 95m for Ultra-Smooth 60FPS
      grp.visible = distSq < 95 * 95;
      if (!grp.visible) continue;

      const isMoving = Math.abs(p.dx) + Math.abs(p.dz) > 0.01;
      const t = time * 0.55 + i * 1.3;
      const wave = isMoving ? Math.sin(t) : 0;
      const wx = p.x + p.dx * wave;
      const wz = p.z + p.dz * wave;
      const wy = getWalkableHeight(wx, wz);

      const walkPhase = time * 7.5 + i * 2.1;
      const swing = isMoving ? Math.sin(walkPhase) * 0.55 : 0;
      const bounce = isMoving ? Math.abs(Math.sin(walkPhase)) * 0.04 : 0;

      grp.position.set(wx, wy + 0.73 + bounce, wz);

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
    <group name="pixar-stylized-npcs">
      {allPeople.map((p, i) => (
        <group key={p.id} ref={(el) => { groupRefs.current[i] = el; }}>
          {/* Pixar Tunic & Pelvis */}
          <mesh geometry={geos.torsoTunic} position={[0, 0.04, 0]} castShadow>
            <meshStandardMaterial color={p.coatColor} roughness={0.55} />
          </mesh>
          <mesh position={[0, -0.11, 0]} scale={[1.10, 0.88, 0.76]} material={pantMat}>
            <sphereGeometry args={[0.132, 10, 8]} />
          </mesh>
          <mesh position={[0, -0.01, 0]} scale={[1.13, 1, 0.78]} material={leatherBeltMat}>
            <cylinderGeometry args={[0.125, 0.130, 0.052, 12]} />
          </mesh>
          <mesh geometry={neckGeo} material={skinMat} position={[0, 0.43, 0]} />

          {/* Legs */}
          <group ref={(el) => { leftLegRefs.current[i] = el; }} position={[-0.082, -0.15, 0]}>
            <mesh geometry={geos.thigh} material={pantMat} />
            <mesh geometry={geos.calfBoot} material={leatherBeltMat} position={[0, -0.26, 0]} />
            <mesh geometry={bootGeo} material={leatherBeltMat} position={[0, -0.52, 0.03]} scale={[0.88, 0.75, 1.4]} />
          </group>
          <group ref={(el) => { rightLegRefs.current[i] = el; }} position={[0.082, -0.15, 0]}>
            <mesh geometry={geos.thigh} material={pantMat} />
            <mesh geometry={geos.calfBoot} material={leatherBeltMat} position={[0, -0.26, 0]} />
            <mesh geometry={bootGeo} material={leatherBeltMat} position={[0, -0.52, 0.03]} scale={[0.88, 0.75, 1.4]} />
          </group>

          {/* Arms & Smooth Pixar Hands */}
          <group ref={(el) => { leftArmRefs.current[i] = el; }} position={[-0.162, 0.30, 0]} rotation={[0, 0, 0.12]}>
            <mesh geometry={geos.upperArm}><meshStandardMaterial color={p.coatColor} roughness={0.55} /></mesh>
            <mesh geometry={geos.forearm} material={skinMat} position={[0, -0.18, 0]} />
            <mesh geometry={handGeo} material={skinMat} position={[0, -0.36, 0.005]} scale={[0.55, 1.15, 0.82]} />
          </group>
          <group ref={(el) => { rightArmRefs.current[i] = el; }} position={[0.162, 0.30, 0]} rotation={[0, 0, -0.12]}>
            <mesh geometry={geos.upperArm}><meshStandardMaterial color={p.coatColor} roughness={0.55} /></mesh>
            <mesh geometry={geos.forearm} material={skinMat} position={[0, -0.18, 0]} />
            <mesh geometry={handGeo} material={skinMat} position={[0, -0.36, 0.005]} scale={[0.55, 1.15, 0.82]} />
          </group>

          {/* Expressive Pixar Head, Sclera+Pupil Eyes, & Swept Hair */}
          <group position={[0, 0.53, 0.01]} scale={[0.92, 0.92, 0.92]}>
            <mesh geometry={headGeo} material={skinMat} scale={[0.92, 1.0, 0.92]} />
            <mesh geometry={eyeWhiteGeo} material={eyeWhiteMat} position={[-0.046, 0.015, 0.126]} scale={[1.0, 1.1, 0.45]} />
            <mesh geometry={eyePupilGeo} material={eyeDarkMat} position={[-0.046, 0.015, 0.134]} scale={[1.0, 1.1, 0.45]} />
            <mesh geometry={eyeWhiteGeo} material={eyeWhiteMat} position={[0.046, 0.015, 0.126]} scale={[1.0, 1.1, 0.45]} />
            <mesh geometry={eyePupilGeo} material={eyeDarkMat} position={[0.046, 0.015, 0.134]} scale={[1.0, 1.1, 0.45]} />
            <mesh geometry={hairGeo} position={[0, 0.05, -0.012]} scale={[0.98, 1.02, 1.0]}>
              <meshStandardMaterial color={p.hairColor} roughness={0.45} />
            </mesh>
            <mesh geometry={bangGeo} position={[0, 0.09, 0.11]} rotation={[0.2, 0, 1.3]}>
              <meshStandardMaterial color={p.hairColor} roughness={0.45} />
            </mesh>
            {p.hasCrown && <mesh geometry={crownGeo} material={goldCrownMat} position={[0, 0.19, 0]} />}
          </group>

          {p.isInteractive && (
            <mesh position={[0, 0.98, 0]}>
              <octahedronGeometry args={[0.11, 0]} />
              <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2.2} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}
