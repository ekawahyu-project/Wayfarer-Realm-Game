"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { playerFrameState } from "@/game/state/usePlayerStore";

const BIRD_COUNT = 28;
const BUTTERFLY_COUNT = 36;
const FISH_COUNT = 45;

export interface HorsePosition { x: number; y: number; z: number; yaw: number; }
export const horseLivePositions: HorsePosition[] = [];

// Shared geometries & materials for horses so 12 anatomical horses render with super-low GPU overhead!
const darkHoofMat = new THREE.MeshStandardMaterial({ color: "#18181b", roughness: 0.8 });
const maneDarkMat = new THREE.MeshStandardMaterial({ color: "#1c1917", roughness: 0.85 });
const eyeGlossMat = new THREE.MeshStandardMaterial({ color: "#090d16", roughness: 0.1 });
const muzzleMat = new THREE.MeshStandardMaterial({ color: "#3f2e21", roughness: 0.7 });

function AnatomicalHorse({
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
  const neckGroupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  // 4 Two-Segment Articulated Equine Legs (Upper Thigh/Shoulder + Lower Cannon/Hoof)
  const flUpperRef = useRef<THREE.Group>(null);
  const flLowerRef = useRef<THREE.Group>(null);
  const frUpperRef = useRef<THREE.Group>(null);
  const frLowerRef = useRef<THREE.Group>(null);
  const blUpperRef = useRef<THREE.Group>(null);
  const blLowerRef = useRef<THREE.Group>(null);
  const brUpperRef = useRef<THREE.Group>(null);
  const brLowerRef = useRef<THREE.Group>(null);

  const coatMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: horseTex, color, roughness: 0.58 }),
    [horseTex, color]
  );

  useFrame((state) => {
    const isMounted = playerFrameState.mountedHorseIndex === index;
    let x = cx, z = cz, y = 0, yaw = 0, animFreq = 0, strideAmp = 0;

    if (isMounted) {
      x = playerFrameState.x;
      z = playerFrameState.z;
      y = getExactMeshTerrainHeight(x, z);
      yaw = playerFrameState.horseYaw;
      if (playerFrameState.isMoving) {
        animFreq = playerFrameState.isRunning ? 15.5 : 10.0;
        strideAmp = playerFrameState.isRunning ? 0.68 : 0.42;
      }
    } else {
      const t = state.clock.elapsedTime * 0.35 + phase;
      x = cx + Math.cos(t) * radius;
      z = cz + Math.sin(t) * radius;
      y = getExactMeshTerrainHeight(x, z);
      yaw = -t;
      animFreq = 6.2;
      strideAmp = 0.32;
    }

    horseLivePositions[index] = { x, y, z, yaw };

    const cyc = state.clock.elapsedTime * animFreq + phase;
    const bodyBounce = strideAmp > 0 ? Math.abs(Math.sin(cyc)) * 0.06 * strideAmp : 0;
    const bodyPitch = strideAmp > 0.5 ? Math.cos(cyc) * 0.045 : 0;

    if (groupRef.current) {
      groupRef.current.position.set(x, y + bodyBounce, z);
      groupRef.current.rotation.set(bodyPitch, yaw, 0);
    }

    // Natural equine head-bob & flowing tail
    if (neckGroupRef.current) {
      neckGroupRef.current.rotation.x = -0.52 + (strideAmp > 0 ? Math.sin(cyc - 0.5) * 0.08 * strideAmp : Math.sin(state.clock.elapsedTime * 1.8 + phase) * 0.04);
    }
    if (tailRef.current) {
      tailRef.current.rotation.x = 0.38 + strideAmp * 0.35 + Math.sin(state.clock.elapsedTime * 6 + phase) * 0.08;
      tailRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 4 + phase) * 0.12;
    }

    // 4-Beat Equine Gait Articulation (Shoulder/Thigh + Knee/Hock Flexion)
    const animateLimb = (upper: THREE.Group | null, lower: THREE.Group | null, phaseOffset: number, isFront: boolean) => {
      if (!upper || !lower) return;
      if (strideAmp === 0) {
        upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, 0, 0.15);
        lower.rotation.x = THREE.MathUtils.lerp(lower.rotation.x, 0, 0.15);
        return;
      }
      const s = Math.sin(cyc + phaseOffset);
      const c = Math.cos(cyc + phaseOffset);
      upper.rotation.x = s * strideAmp;
      const kneeBend = Math.max(0, -c) * strideAmp * 1.15;
      lower.rotation.x = isFront ? kneeBend : -kneeBend * 0.85;
    };

    animateLimb(flUpperRef.current, flLowerRef.current, 0.0, true);
    animateLimb(frUpperRef.current, frLowerRef.current, Math.PI * 0.85, true);
    animateLimb(blUpperRef.current, blLowerRef.current, Math.PI * 1.15, false);
    animateLimb(brUpperRef.current, brLowerRef.current, Math.PI * 0.25, false);
  });

  return (
    <group ref={groupRef}>
      {/* 1. SCULPTED EQUINE TORSO: Broad Muscular Chest, Swayed Back, Barrel Ribs & Rounded Croup/Haunches */}
      {/* Broad Chest (Brisket) */}
      <mesh castShadow position={[0, 1.18, 0.48]} scale={[0.92, 1.05, 1.05]} material={coatMat}>
        <sphereGeometry args={[0.42, 14, 12]} />
      </mesh>
      {/* Ribcage & Barrel */}
      <mesh castShadow position={[0, 1.16, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.88, 1.0, 0.95]} material={coatMat}>
        <cylinderGeometry args={[0.38, 0.40, 0.95, 14]} />
      </mesh>
      {/* Powerful Hindquarters (Croup / Haunches) */}
      <mesh castShadow position={[0, 1.20, -0.48]} scale={[0.94, 1.06, 1.10]} material={coatMat}>
        <sphereGeometry args={[0.41, 14, 12]} />
      </mesh>

      {/* 2. TAPERED EQUINE NECK, SCULPTED HEAD, MUZZLE, EARS & LAYERED MANE */}
      <group ref={neckGroupRef} position={[0, 1.38, 0.56]} rotation={[-0.52, 0, 0]}>
        {/* Tapered Muscular Neck */}
        <mesh castShadow position={[0, 0.34, 0]} material={coatMat}>
          <cylinderGeometry args={[0.17, 0.28, 0.72, 12]} />
        </mesh>
        {/* Layered Flowing Horse Mane along Neck */}
        {[0.08, 0.24, 0.40, 0.56].map((my, mIdx) => (
          <mesh key={mIdx} position={[0, my, -0.18]} rotation={[0.25, 0, 0]} material={maneDarkMat}>
            <coneGeometry args={[0.07, 0.24, 6]} />
          </mesh>
        ))}

        {/* Equine Head, Cheekbones & Tapered Muzzle/Snout */}
        <group position={[0, 0.68, 0.06]} rotation={[1.15, 0, 0]}>
          {/* Cranium & Cheek Jowls */}
          <mesh castShadow position={[0, 0, 0]} scale={[0.82, 0.88, 1.05]} material={coatMat}>
            <sphereGeometry args={[0.19, 12, 12]} />
          </mesh>
          {/* Long Tapered Equine Bridge & Muzzle */}
          <mesh castShadow position={[0, -0.02, 0.24]} rotation={[Math.PI / 2, 0, 0]} material={coatMat}>
            <cylinderGeometry args={[0.10, 0.16, 0.42, 10]} />
          </mesh>
          {/* Soft Dark Snout & Nostrils */}
          <mesh position={[0, -0.02, 0.44]} scale={[1.0, 0.85, 0.7]} material={muzzleMat}>
            <sphereGeometry args={[0.105, 10, 10]} />
          </mesh>
          {/* Expressive Side-Set Equine Eyes */}
          <mesh position={[-0.145, 0.04, 0.06]} material={eyeGlossMat}><sphereGeometry args={[0.032, 8, 8]} /></mesh>
          <mesh position={[0.145, 0.04, 0.06]} material={eyeGlossMat}><sphereGeometry args={[0.032, 8, 8]} /></mesh>
          {/* Alert Pointed Ears & Forelock Tuft */}
          <mesh position={[-0.09, 0.20, -0.06]} rotation={[-0.2, 0, 0.18]} material={coatMat}><coneGeometry args={[0.045, 0.18, 8]} /></mesh>
          <mesh position={[0.09, 0.20, -0.06]} rotation={[-0.2, 0, -0.18]} material={coatMat}><coneGeometry args={[0.045, 0.18, 8]} /></mesh>
          <mesh position={[0, 0.16, 0.08]} rotation={[0.6, 0, 0]} material={maneDarkMat}><coneGeometry args={[0.055, 0.16, 6]} /></mesh>
        </group>
      </group>

      {/* 3. FLOWING PLUMED HORSE TAIL */}
      <group ref={tailRef} position={[0, 1.32, -0.84]} rotation={[0.38, 0, 0]}>
        <mesh position={[0, -0.32, -0.06]} material={maneDarkMat}>
          <cylinderGeometry args={[0.05, 0.13, 0.65, 8]} />
        </mesh>
        <mesh position={[0, -0.68, -0.08]} material={maneDarkMat}>
          <coneGeometry args={[0.13, 0.42, 8]} />
        </mesh>
      </group>

      {/* 4. FOUR ARTICULATED 2-JOINT EQUINE LEGS (Thigh/Shoulder -> Knee/Hock -> Cannon -> Hoof) */}
      {/* Front-Left Leg */}
      <group ref={flUpperRef} position={[-0.24, 1.02, 0.52]}>
        <mesh castShadow position={[0, -0.24, 0]} material={coatMat}><cylinderGeometry args={[0.105, 0.075, 0.50, 8]} /></mesh>
        <group ref={flLowerRef} position={[0, -0.48, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.068, 0.055, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.065, 0.082, 0.11, 8]} /></mesh>
        </group>
      </group>

      {/* Front-Right Leg */}
      <group ref={frUpperRef} position={[0.24, 1.02, 0.52]}>
        <mesh castShadow position={[0, -0.24, 0]} material={coatMat}><cylinderGeometry args={[0.105, 0.075, 0.50, 8]} /></mesh>
        <group ref={frLowerRef} position={[0, -0.48, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.068, 0.055, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.065, 0.082, 0.11, 8]} /></mesh>
        </group>
      </group>

      {/* Back-Left Leg */}
      <group ref={blUpperRef} position={[-0.25, 1.04, -0.52]}>
        <mesh castShadow position={[0, -0.25, 0]} material={coatMat}><cylinderGeometry args={[0.125, 0.080, 0.52, 8]} /></mesh>
        <group ref={blLowerRef} position={[0, -0.50, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.072, 0.056, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.065, 0.082, 0.11, 8]} /></mesh>
        </group>
      </group>

      {/* Back-Right Leg */}
      <group ref={brUpperRef} position={[0.25, 1.04, -0.52]}>
        <mesh castShadow position={[0, -0.25, 0]} material={coatMat}><cylinderGeometry args={[0.125, 0.080, 0.52, 8]} /></mesh>
        <group ref={brLowerRef} position={[0, -0.50, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.072, 0.056, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.065, 0.082, 0.11, 8]} /></mesh>
        </group>
      </group>
    </group>
  );
}

function AnimatedCow({ cx, cz, phase, radius, cowTex }: { cx: number; cz: number; phase: number; radius: number; cowTex: THREE.CanvasTexture }) {
  const groupRef = useRef<THREE.Group>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);
  const cowMat = useMemo(() => new THREE.MeshStandardMaterial({ map: cowTex, roughness: 0.75 }), [cowTex]);

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
      <mesh castShadow position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} material={cowMat}><capsuleGeometry args={[0.42, 0.85, 8, 12]} /></mesh>
      <mesh position={[0, 1.15, 0.88]} material={cowMat}><boxGeometry args={[0.48, 0.46, 0.52]} /></mesh>
      <mesh position={[0, 1.05, 1.16]}><boxGeometry args={[0.36, 0.24, 0.12]} /><meshStandardMaterial color="#fda4af" /></mesh>
      <mesh position={[-0.26, 1.42, 0.86]} rotation={[0, 0, 0.4]}><coneGeometry args={[0.05, 0.24, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
      <mesh position={[0.26, 1.42, 0.86]} rotation={[0, 0, -0.4]}><coneGeometry args={[0.05, 0.24, 6]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
      <mesh ref={leg1Ref} position={[-0.26, 0.35, 0.48]} material={cowMat}><cylinderGeometry args={[0.09, 0.08, 0.7, 6]} /></mesh>
      <mesh ref={leg2Ref} position={[0.26, 0.35, 0.48]} material={cowMat}><cylinderGeometry args={[0.09, 0.08, 0.7, 6]} /></mesh>
      <mesh position={[-0.26, 0.35, -0.48]} material={cowMat}><cylinderGeometry args={[0.09, 0.08, 0.7, 6]} /></mesh>
      <mesh position={[0.26, 0.35, -0.48]} material={cowMat}><cylinderGeometry args={[0.09, 0.08, 0.7, 6]} /></mesh>
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
      <mesh position={[0, 0.28, 0]} scale={[0.8, 0.85, 1.15]}><sphereGeometry args={[0.22, 8, 8]} /><meshStandardMaterial color="#fef3c7" roughness={0.8} /></mesh>
      <mesh position={[0, 0.46, 0.18]}><sphereGeometry args={[0.13, 8, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
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

    const hColors = ["#9a4a1a", "#6b3410", "#f1f5f9", "#3f3f46", "#b45309", "#d97706"];
    const hList = [
      [-515, 8], [-15, 12], [285, 8], [-270, 170], [-235, -28], [10, 295],
      [-45, -25], [160, -20], [285, -28], [-210, 195], [-200, -55], [-60, 260],
    ].map(([cx, cz], i) => ({ cx, cz, color: hColors[i % hColors.length], phase: i * 1.3, radius: 4.5 }));

    const cList = [
      [265, -22], [255, 20], [440, -25], [440, 22], [-25, -45], [55, 35],
      [-240, 165], [-325, 175], [-200, -25], [-290, -25],
    ].map(([cx, cz], i) => ({ cx, cz, phase: i * 1.7, radius: 4 + (i % 3) * 1.5 }));

    const chkList = [
      [355, -3], [362, 4], [372, -4], [348, 5], [380, 3],
      [-282, 235], [-274, 242], [-248, -92], [-238, -98],
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
      {horses.map((h, i) => <AnatomicalHorse key={"h" + i} index={i} horseTex={textures.horseCoat} {...h} />)}
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
