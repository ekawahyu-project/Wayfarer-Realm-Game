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
  hatColor: string;
  hairColor: string;
  isInteractive: boolean;
  hasCrown: boolean;
  roleType: 'noble' | 'merchant' | 'guard' | 'villager';
}

const headGeo = new THREE.SphereGeometry(0.152, 16, 16);
const hairGeo = new THREE.SphereGeometry(0.160, 16, 14);
const bangGeo = new THREE.CapsuleGeometry(0.032, 0.085, 4, 8);
const neckGeo = new THREE.CylinderGeometry(0.048, 0.058, 0.13, 10);
const crownGeo = new THREE.CylinderGeometry(0.135, 0.115, 0.11, 8);
const medievalHatGeo = new THREE.ConeGeometry(0.175, 0.18, 12);
const hatBrimGeo = new THREE.TorusGeometry(0.155, 0.028, 8, 16);
const tabardGeo = new THREE.BoxGeometry(0.19, 0.42, 0.23);
const capeGeo = new THREE.CylinderGeometry(0.12, 0.22, 0.48, 10, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
const eyeWhiteGeo = new THREE.SphereGeometry(0.026, 10, 10);
const eyePupilGeo = new THREE.SphereGeometry(0.016, 10, 10);
const noseGeo = new THREE.SphereGeometry(0.019, 8, 8);
const palmGeo = new THREE.SphereGeometry(0.042, 10, 10);
const thumbGeo = new THREE.CapsuleGeometry(0.0095, 0.025, 4, 6);
const fingerGeo = new THREE.CapsuleGeometry(0.0085, 0.030, 4, 6);
const bootGeo = new THREE.SphereGeometry(0.058, 10, 10);

const skinMat = new THREE.MeshStandardMaterial({ color: "#ffd5b5", emissive: "#f43f5e", emissiveIntensity: 0.06, roughness: 0.42 });
const noseMat = new THREE.MeshStandardMaterial({ color: "#fb7185", roughness: 0.45 });
const linenMat = new THREE.MeshStandardMaterial({ color: "#f5ead8", roughness: 0.75 });
const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: "#ffffff" });
const eyeDarkMat = new THREE.MeshBasicMaterial({ color: "#3b1d0e" });
const pantMat = new THREE.MeshStandardMaterial({ color: "#3e2723", roughness: 0.75 });
const leatherBeltMat = new THREE.MeshStandardMaterial({ color: "#5c2d0c", roughness: 0.68 });
const goldMat = new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.8, roughness: 0.22 });

export default function NPCSystem() {
  const geos = useMemo(() => getSculptedHumanGeometries(), []);
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const leftLegRefs = useRef<(THREE.Group | null)[]>([]);
  const rightLegRefs = useRef<(THREE.Group | null)[]>([]);
  const leftArmRefs = useRef<(THREE.Group | null)[]>([]);
  const rightArmRefs = useRef<(THREE.Group | null)[]>([]);

  const allPeople = useMemo<CrowdPerson[]>(() => {
    const list: CrowdPerson[] = [];
    const hairs = ["#3b1d0e", "#5c3317", "#7c2d12", "#92400e", "#27272a"];
    // Authentic Medieval Palette (Burgundy, Forest Green, Royal Ochre, Medieval Indigo, Russet Brown)
    const coats = ["#881337", "#14532d", "#9a3412", "#1e3a8a", "#78350f", "#365314", "#701a75", "#991b1b"];
    const hats = ["#451a03", "#14532d", "#7f1d1d", "#1e3a8a", "#3f6212"];
    const roles: CrowdPerson['roleType'][] = ['merchant', 'villager', 'guard', 'noble'];

    NPCS.forEach((n, idx) => {
      list.push({
        id: n.id,
        x: n.position[0],
        z: n.position[2],
        dx: n.patrolOffset[0],
        dz: n.patrolOffset[1],
        coatColor: n.coatColor,
        hatColor: n.hatColor || hats[idx % hats.length],
        hairColor: hairs[idx % hairs.length],
        isInteractive: true,
        hasCrown: Boolean(n.hasCrown),
        roleType: n.hasCrown ? 'noble' : roles[idx % roles.length],
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
        hatColor: hats[(idx + 2) % hats.length],
        hairColor: hairs[idx % hairs.length],
        isInteractive: false,
        hasCrown: false,
        roleType: idx >= 16 ? 'guard' : roles[idx % roles.length],
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
      const dist = Math.sqrt(distSq);
      grp.visible = dist < 230;
      if (!grp.visible) continue;

      const fadeScale = dist > 190 ? Math.max(0.01, 1.0 - (dist - 190) / 40) : 1.0;
      grp.scale.setScalar(fadeScale);

      const isMoving = Math.abs(p.dx) + Math.abs(p.dz) > 0.01;
      const t = time * 0.55 + i * 1.3;
      const wave = isMoving ? Math.sin(t) : 0;
      const wx = p.x + p.dx * wave;
      const wz = p.z + p.dz * wave;
      const wy = getWalkableHeight(wx, wz);

      const walkPhase = time * 7.5 + i * 2.1;
      const swing = isMoving ? Math.sin(walkPhase) * 0.55 : 0;
      const bounce = isMoving ? Math.abs(Math.sin(walkPhase)) * 0.042 : Math.sin(time * 2.2 + i) * 0.008;

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
        leftArmRefs.current[i]!.rotation.x = -swing * 0.75 - 0.12;
        rightArmRefs.current[i]!.rotation.x = swing * 0.75 - 0.12;
      }

      if (p.isInteractive) {
        npcLivePositions[p.id] = { x: wx, y: wy, z: wz };
      }
    }
  });

  return (
    <group name="medieval-disney-npcs">
      {allPeople.map((p, i) => (
        <group key={p.id} ref={(el) => { groupRefs.current[i] = el; }}>
          {/* 1. Medieval Linen Undertunic, Heraldic Surcoat Tabard, Shoulder Rolls, & Cape */}
          <mesh geometry={geos.torsoTunic} position={[0, 0.02, 0]} castShadow>
            <meshStandardMaterial color={p.coatColor} roughness={0.62} />
          </mesh>
          {/* Medieval Heraldic Front & Back Tabard Tunic Flap + Gold Trim */}
          <mesh geometry={tabardGeo} position={[0, -0.02, 0]} material={linenMat} />
          <mesh position={[0, 0.33, 0]} scale={[1.1, 1.0, 0.85]} material={linenMat}>
            <torusGeometry args={[0.085, 0.026, 8, 14]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          {/* Flowing Medieval Traveler Cape */}
          <mesh geometry={capeGeo} position={[0, 0.10, -0.08]} rotation={[0.16, 0, 0]} castShadow>
            <meshStandardMaterial color={p.hatColor} side={THREE.DoubleSide} roughness={0.7} />
          </mesh>
          {/* Pelvis, Wide Medieval Leather Cinch Belt, Brass Buckle & Coin Pouch */}
          <mesh position={[0, -0.15, 0]} scale={[1.12, 0.88, 0.78]} material={pantMat}>
            <sphereGeometry args={[0.138, 12, 10]} />
          </mesh>
          <mesh position={[0, -0.04, 0]} scale={[1.15, 1, 0.86]} material={leatherBeltMat}>
            <cylinderGeometry args={[0.132, 0.136, 0.062, 14]} />
          </mesh>
          <mesh position={[0, -0.04, 0.12]} material={goldMat}><boxGeometry args={[0.05, 0.052, 0.018]} /></mesh>
          <mesh position={[-0.14, -0.08, 0.03]} material={leatherBeltMat}><sphereGeometry args={[0.042, 8, 8]} /></mesh>
          <mesh geometry={neckGeo} material={skinMat} position={[0, 0.41, 0]} />

          {/* 2. Medieval Breeches & Cuffed Leather Boots */}
          <group ref={(el) => { leftLegRefs.current[i] = el; }} position={[-0.084, -0.15, 0]}>
            <mesh geometry={geos.thigh} material={pantMat} />
            <mesh geometry={geos.calfBoot} material={leatherBeltMat} position={[0, -0.25, 0]} />
            <mesh geometry={bootGeo} material={leatherBeltMat} position={[0, -0.50, 0.032]} scale={[0.92, 0.78, 1.45]} />
          </group>
          <group ref={(el) => { rightLegRefs.current[i] = el; }} position={[0.084, -0.15, 0]}>
            <mesh geometry={geos.thigh} material={pantMat} />
            <mesh geometry={geos.calfBoot} material={leatherBeltMat} position={[0, -0.25, 0]} />
            <mesh geometry={bootGeo} material={leatherBeltMat} position={[0, -0.50, 0.032]} scale={[0.92, 0.78, 1.45]} />
          </group>

          {/* 3. Medieval Sleeves, Leather Bracers, & LARGE PROPORTIONATE 5-FINGERED HANDS! */}
          <group ref={(el) => { leftArmRefs.current[i] = el; }} position={[-0.168, 0.28, 0]} rotation={[0, 0, 0.14]}>
            <mesh position={[0.01, 0.01, 0]}><sphereGeometry args={[0.062, 10, 8]} /><meshStandardMaterial color={p.coatColor} roughness={0.6} /></mesh>
            <mesh geometry={geos.upperArm} material={linenMat} />
            <mesh geometry={geos.forearm} material={linenMat} position={[0, -0.17, 0]} />
            <mesh position={[0, -0.28, 0]} material={leatherBeltMat}><cylinderGeometry args={[0.048, 0.045, 0.07, 10]} /></mesh>
            {/* Large Sculpted Left Hand with Thumb & Fingers */}
            <group position={[0, -0.35, 0.008]}>
              <mesh geometry={palmGeo} material={skinMat} scale={[0.65, 1.05, 0.95]} />
              <mesh geometry={thumbGeo} material={skinMat} position={[0.020, -0.005, 0.034]} rotation={[0.65, 0.15, 0.25]} />
              {[-0.014, 0, 0.014].map((fz, fi) => (
                <mesh key={fi} geometry={fingerGeo} material={skinMat} position={[0.006, -0.042, fz]} rotation={[0, 0, 0.22]} />
              ))}
            </group>
          </group>

          <group ref={(el) => { rightArmRefs.current[i] = el; }} position={[0.168, 0.28, 0]} rotation={[0, 0, -0.14]}>
            <mesh position={[-0.01, 0.01, 0]}><sphereGeometry args={[0.062, 10, 8]} /><meshStandardMaterial color={p.coatColor} roughness={0.6} /></mesh>
            <mesh geometry={geos.upperArm} material={linenMat} />
            <mesh geometry={geos.forearm} material={linenMat} position={[0, -0.17, 0]} />
            <mesh position={[0, -0.28, 0]} material={leatherBeltMat}><cylinderGeometry args={[0.048, 0.045, 0.07, 10]} /></mesh>
            {/* Large Sculpted Right Hand with Thumb & Fingers */}
            <group position={[0, -0.35, 0.008]}>
              <mesh geometry={palmGeo} material={skinMat} scale={[0.65, 1.05, 0.95]} />
              <mesh geometry={thumbGeo} material={skinMat} position={[-0.020, -0.005, 0.034]} rotation={[0.65, -0.15, -0.25]} />
              {[-0.014, 0, 0.014].map((fz, fi) => (
                <mesh key={fi} geometry={fingerGeo} material={skinMat} position={[-0.006, -0.042, fz]} rotation={[0, 0, -0.22]} />
              ))}
            </group>
          </group>

          {/* 4. Expressive Disney/Pixar Head, Big Eyes, Button Nose, Ears, & Medieval Headgear */}
          <group position={[0, 0.50, 0.015]} scale={[0.96, 0.95, 0.96]}>
            <mesh geometry={headGeo} material={skinMat} scale={[0.96, 0.95, 0.94]} />
            <mesh geometry={noseGeo} material={noseMat} position={[0, 0.0, 0.145]} scale={[1.1, 0.82, 0.9]} />
            <mesh geometry={noseGeo} material={skinMat} position={[-0.145, 0, 0]} scale={[0.7, 1.2, 0.5]} />
            <mesh geometry={noseGeo} material={skinMat} position={[0.145, 0, 0]} scale={[0.7, 1.2, 0.5]} />
            <mesh geometry={eyeWhiteGeo} material={eyeWhiteMat} position={[-0.048, 0.02, 0.126]} scale={[1.05, 1.15, 0.45]} />
            <mesh geometry={eyePupilGeo} material={eyeDarkMat} position={[-0.048, 0.02, 0.135]} scale={[1.0, 1.1, 0.45]} />
            <mesh geometry={eyeWhiteGeo} material={eyeWhiteMat} position={[0.048, 0.02, 0.126]} scale={[1.05, 1.15, 0.45]} />
            <mesh geometry={eyePupilGeo} material={eyeDarkMat} position={[0.048, 0.02, 0.135]} scale={[1.0, 1.1, 0.45]} />
            <mesh geometry={hairGeo} position={[0, 0.04, -0.015]} scale={[0.98, 1.0, 1.0]}>
              <meshStandardMaterial color={p.hairColor} roughness={0.45} />
            </mesh>
            <mesh geometry={bangGeo} position={[0, 0.082, 0.118]} rotation={[0.2, 0, 1.25]}>
              <meshStandardMaterial color={p.hairColor} roughness={0.45} />
            </mesh>
            {/* Medieval Hat / Hood / Royal Crown */}
            {p.hasCrown ? (
              <mesh geometry={crownGeo} material={goldMat} position={[0, 0.19, 0]} />
            ) : (
              <group position={[0, 0.12, -0.01]} rotation={[-0.12, 0, (i % 2 === 0 ? 0.08 : -0.08)]}>
                <mesh geometry={hatBrimGeo} rotation={[Math.PI / 2, 0, 0]}>
                  <meshStandardMaterial color={p.hatColor} roughness={0.7} />
                </mesh>
                <mesh geometry={medievalHatGeo} position={[0, 0.07, -0.02]} rotation={[-0.25, 0, 0]}>
                  <meshStandardMaterial color={p.hatColor} roughness={0.7} />
                </mesh>
              </group>
            )}
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
