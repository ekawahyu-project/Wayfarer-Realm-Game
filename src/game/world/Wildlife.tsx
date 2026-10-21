"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { playerFrameState } from "@/game/state/usePlayerStore";

const BIRD_COUNT = 24;
const BUTTERFLY_COUNT = 30;
const FISH_COUNT = 36;

export interface HorsePosition { x: number; y: number; z: number; yaw: number; }
export const horseLivePositions: HorsePosition[] = [];

const darkHoofMat = new THREE.MeshStandardMaterial({ color: "#18181b", roughness: 0.8 });
const maneDarkMat = new THREE.MeshStandardMaterial({ color: "#1c1917", roughness: 0.85 });
const eyeGlossMat = new THREE.MeshStandardMaterial({ color: "#090d16", roughness: 0.1 });
const muzzleMat = new THREE.MeshStandardMaterial({ color: "#3b281c", roughness: 0.65 });
const blazeWhiteMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.6 });

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

  const flUpperRef = useRef<THREE.Group>(null);
  const flLowerRef = useRef<THREE.Group>(null);
  const frUpperRef = useRef<THREE.Group>(null);
  const frLowerRef = useRef<THREE.Group>(null);
  const blUpperRef = useRef<THREE.Group>(null);
  const blLowerRef = useRef<THREE.Group>(null);
  const brUpperRef = useRef<THREE.Group>(null);
  const brLowerRef = useRef<THREE.Group>(null);

  const coatMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: horseTex, color, roughness: 0.55 }),
    [horseTex, color]
  );

  useFrame((state) => {
    const isMounted = playerFrameState.mountedHorseIndex === index;
    let x = cx, z = cz, y = 0, yaw = 0, animSpeed = 0, strideAmp = 0;

    if (isMounted) {
      // 100% Locked to Player exact X, Y, Z so Horse NEVER separates or lags behind!
      x = playerFrameState.x;
      y = playerFrameState.y;
      z = playerFrameState.z;
      yaw = playerFrameState.horseYaw;
      if (playerFrameState.isMoving) {
        animSpeed = playerFrameState.isRunning ? 15.5 : 10.0;
        strideAmp = playerFrameState.isRunning ? 0.68 : 0.42;
      }
    } else {
      const t = state.clock.elapsedTime * 0.35 + phase;
      x = cx + Math.cos(t) * radius;
      z = cz + Math.sin(t) * radius;
      y = getExactMeshTerrainHeight(x, z);
      yaw = -t;
      animSpeed = 6.2;
      strideAmp = 0.32;
    }

    horseLivePositions[index] = { x, y, z, yaw };

    const cyc = state.clock.elapsedTime * animSpeed + phase;
    const bodyBounce = (!isMounted && strideAmp > 0) ? Math.abs(Math.sin(cyc)) * 0.05 * strideAmp : 0;
    const bodyPitch = strideAmp > 0.5 ? Math.cos(cyc) * 0.04 : 0;

    if (groupRef.current) {
      groupRef.current.position.set(x, y + bodyBounce, z);
      groupRef.current.rotation.set(bodyPitch, yaw, 0);
    }

    // Positive X rotation tilts neck forward toward +Z!
    if (neckGroupRef.current) {
      neckGroupRef.current.rotation.x = 0.52 + (strideAmp > 0 ? Math.sin(cyc - 0.5) * 0.07 * strideAmp : Math.sin(state.clock.elapsedTime * 1.8 + phase) * 0.03);
    }
    if (tailRef.current) {
      tailRef.current.rotation.x = -0.35 - strideAmp * 0.3 + Math.sin(state.clock.elapsedTime * 6 + phase) * 0.06;
    }

    const animateLimb = (upper: THREE.Group | null, lower: THREE.Group | null, phaseOffset: number, isFront: boolean) => {
      if (!upper || !lower) return;
      if (strideAmp === 0) {
        upper.rotation.x = THREE.MathUtils.lerp(upper.rotation.x, 0, 0.2);
        lower.rotation.x = THREE.MathUtils.lerp(lower.rotation.x, 0, 0.2);
        return;
      }
      const s = Math.sin(cyc + phaseOffset);
      const c = Math.cos(cyc + phaseOffset);
      upper.rotation.x = s * strideAmp;
      const kneeBend = Math.max(0, -c) * strideAmp * 1.15;
      lower.rotation.x = isFront ? kneeBend : -kneeBend * 0.85;
    };

    animateLimb(flUpperRef.current, flLowerRef.current, 0.0, true);
    animateLimb(frUpperRef.current, frLowerRef.current, Math.PI, true);
    animateLimb(blUpperRef.current, blLowerRef.current, Math.PI * 0.65, false);
    animateLimb(brUpperRef.current, brLowerRef.current, Math.PI * 1.65, false);
  });

  return (
    <group ref={groupRef}>
      {/* 1. HORSE TORSO (Chest +Z, Barrel 0, Haunches -Z) */}
      <mesh position={[0, 1.16, 0.48]} scale={[0.88, 1.02, 1.05]} material={coatMat}><sphereGeometry args={[0.41, 12, 10]} /></mesh>
      <mesh castShadow position={[0, 1.15, 0.0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.86, 1.0, 0.95]} material={coatMat}><cylinderGeometry args={[0.37, 0.39, 0.95, 12]} /></mesh>
      <mesh position={[0, 1.19, -0.48]} scale={[0.92, 1.05, 1.08]} material={coatMat}><sphereGeometry args={[0.40, 12, 10]} /></mesh>

      {/* 2. SMOOTH SCULPTED ORGANIC EQUINE NECK & HEAD (Zero Boxy Edges!) */}
      <group ref={neckGroupRef} position={[0, 1.25, 0.44]} rotation={[0.48, 0, 0]}>
        {/* Smooth Tapered Muscular Neck */}
        <mesh castShadow position={[0, 0.34, 0]} material={coatMat}>
          <cylinderGeometry args={[0.15, 0.26, 0.72, 14]} />
        </mesh>
        {/* Curved Mane Crest */}
        <mesh position={[0, 0.36, -0.16]} material={maneDarkMat}>
          <capsuleGeometry args={[0.055, 0.62, 8, 10]} />
        </mesh>
        {/* Organic Sculpted Horse Head & Tapered Muzzle */}
        <group position={[0, 0.68, 0.06]} rotation={[-0.22, 0, 0]}>
          {/* Smooth Rounded Cranium & Cheekbones */}
          <mesh castShadow position={[0, 0, 0]} scale={[0.82, 0.90, 1.05]} material={coatMat}>
            <sphereGeometry args={[0.18, 14, 12]} />
          </mesh>
          {/* Smooth Tapered Nasal Bridge extending toward +Z */}
          <mesh castShadow position={[0, -0.03, 0.22]} rotation={[Math.PI * 0.46, 0, 0]} scale={[0.85, 1.0, 0.88]} material={coatMat}>
            <cylinderGeometry args={[0.095, 0.155, 0.38, 14]} />
          </mesh>
          {/* Smooth White Blaze Stripe along Nose */}
          <mesh position={[0, 0.055, 0.21]} rotation={[Math.PI * 0.46, 0, 0]} material={blazeWhiteMat}>
            <capsuleGeometry args={[0.025, 0.28, 6, 8]} />
          </mesh>
          {/* Rounded Velvet Muzzle & Nostrils */}
          <mesh position={[0, -0.05, 0.41]} scale={[0.95, 0.85, 0.85]} material={muzzleMat}>
            <sphereGeometry args={[0.105, 12, 10]} />
          </mesh>
          <mesh position={[-0.055, -0.02, 0.48]} material={eyeGlossMat}><sphereGeometry args={[0.02, 8, 8]} /></mesh>
          <mesh position={[0.055, -0.02, 0.48]} material={eyeGlossMat}><sphereGeometry args={[0.02, 8, 8]} /></mesh>
          {/* Glossy Side-Set Equine Eyes */}
          <mesh position={[-0.14, 0.04, 0.06]} material={eyeGlossMat}><sphereGeometry args={[0.032, 10, 10]} /></mesh>
          <mesh position={[0.14, 0.04, 0.06]} material={eyeGlossMat}><sphereGeometry args={[0.032, 10, 10]} /></mesh>
          {/* Sculpted Tapered Ears */}
          <mesh position={[-0.085, 0.20, -0.05]} rotation={[-0.15, 0, 0.16]} material={coatMat}><coneGeometry args={[0.04, 0.17, 10]} /></mesh>
          <mesh position={[0.085, 0.20, -0.05]} rotation={[-0.15, 0, -0.16]} material={coatMat}><coneGeometry args={[0.04, 0.17, 10]} /></mesh>
        </group>
      </group>

      {/* 3. FLOWING HORSE TAIL */}
      <group ref={tailRef} position={[0, 1.30, -0.84]} rotation={[-0.35, 0, 0]}>
        <mesh position={[0, -0.35, 0]} material={maneDarkMat}><cylinderGeometry args={[0.05, 0.13, 0.72, 8]} /></mesh>
      </group>

      {/* 4. FOUR ARTICULATED 2-JOINT EQUINE LEGS */}
      <group ref={flUpperRef} position={[-0.23, 1.02, 0.50]}>
        <mesh position={[0, -0.24, 0]} material={coatMat}><cylinderGeometry args={[0.10, 0.072, 0.50, 8]} /></mesh>
        <group ref={flLowerRef} position={[0, -0.48, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.065, 0.052, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.062, 0.078, 0.11, 8]} /></mesh>
        </group>
      </group>
      <group ref={frUpperRef} position={[0.23, 1.02, 0.50]}>
        <mesh position={[0, -0.24, 0]} material={coatMat}><cylinderGeometry args={[0.10, 0.072, 0.50, 8]} /></mesh>
        <group ref={frLowerRef} position={[0, -0.48, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.065, 0.052, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.062, 0.078, 0.11, 8]} /></mesh>
        </group>
      </group>
      <group ref={blUpperRef} position={[-0.24, 1.04, -0.50]}>
        <mesh position={[0, -0.25, 0]} material={coatMat}><cylinderGeometry args={[0.12, 0.076, 0.52, 8]} /></mesh>
        <group ref={blLowerRef} position={[0, -0.50, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.068, 0.054, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.062, 0.078, 0.11, 8]} /></mesh>
        </group>
      </group>
      <group ref={brUpperRef} position={[0.24, 1.04, -0.50]}>
        <mesh position={[0, -0.25, 0]} material={coatMat}><cylinderGeometry args={[0.12, 0.076, 0.52, 8]} /></mesh>
        <group ref={brLowerRef} position={[0, -0.50, 0]}>
          <mesh position={[0, -0.22, 0]} material={coatMat}><cylinderGeometry args={[0.068, 0.054, 0.46, 8]} /></mesh>
          <mesh position={[0, -0.48, 0.02]} material={darkHoofMat}><cylinderGeometry args={[0.062, 0.078, 0.11, 8]} /></mesh>
        </group>
      </group>
    </group>
  );
}

function AnimatedCow({ cx, cz, phase, radius, cowTex }: { cx: number; cz: number; phase: number; radius: number; cowTex: THREE.CanvasTexture }) {
  const groupRef = useRef<THREE.Group>(null);
  const leg1Ref = useRef<THREE.Mesh>(null);
  const leg2Ref = useRef<THREE.Mesh>(null);
  const leg3Ref = useRef<THREE.Mesh>(null);
  const leg4Ref = useRef<THREE.Mesh>(null);
  const cowMat = useMemo(() => new THREE.MeshStandardMaterial({ map: cowTex, roughness: 0.72 }), [cowTex]);

  useFrame((state) => {
    if (Math.hypot(cx - playerFrameState.x, cz - playerFrameState.z) > 165) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;
    const t = state.clock.elapsedTime * 0.25 + phase;
    const x = cx + Math.cos(t) * radius, z = cz + Math.sin(t) * radius;
    const y = getExactMeshTerrainHeight(x, z);
    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
      groupRef.current.rotation.y = -t;
    }
    const walk = Math.sin(state.clock.elapsedTime * 4.5 + phase) * 0.35;
    if (leg1Ref.current && leg2Ref.current && leg3Ref.current && leg4Ref.current) {
      leg1Ref.current.rotation.x = walk;
      leg2Ref.current.rotation.x = -walk;
      leg3Ref.current.rotation.x = -walk;
      leg4Ref.current.rotation.x = walk;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Sculpted Bovine Torso, Shoulder Hump, Udder & Tail */}
      <mesh castShadow position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 1.0, 0.95]} material={cowMat}><capsuleGeometry args={[0.42, 0.88, 10, 12]} /></mesh>
      <mesh position={[0, 1.12, 0.42]} scale={[0.92, 0.95, 0.9]} material={cowMat}><sphereGeometry args={[0.40, 10, 10]} /></mesh>
      <mesh position={[0, 0.56, -0.22]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color="#fda4af" /></mesh>
      <mesh position={[0, 0.95, -0.82]} rotation={[-0.25, 0, 0]} material={cowMat}><cylinderGeometry args={[0.03, 0.05, 0.65, 6]} /></mesh>
      {/* Bovine Neck, Tapered Head, Pink Muzzle, Ears & Curved Horns */}
      <group position={[0, 1.08, 0.72]} rotation={[0.35, 0, 0]}>
        <mesh position={[0, 0, 0.15]} scale={[0.85, 0.85, 1.1]} material={cowMat}><sphereGeometry args={[0.28, 10, 10]} /></mesh>
        <mesh position={[0, -0.06, 0.42]} scale={[1.0, 0.78, 0.8]}><sphereGeometry args={[0.18, 10, 8]} /><meshStandardMaterial color="#fda4af" /></mesh>
        <mesh position={[-0.20, 0.05, 0.12]} material={eyeGlossMat}><sphereGeometry args={[0.032, 8, 8]} /></mesh>
        <mesh position={[0.20, 0.05, 0.12]} material={eyeGlossMat}><sphereGeometry args={[0.032, 8, 8]} /></mesh>
        <mesh position={[-0.26, 0.06, 0.02]} rotation={[0, 0, 1.2]} material={cowMat}><coneGeometry args={[0.07, 0.22, 6]} /></mesh>
        <mesh position={[0.26, 0.06, 0.02]} rotation={[0, 0, -1.2]} material={cowMat}><coneGeometry args={[0.07, 0.22, 6]} /></mesh>
        <mesh position={[-0.18, 0.24, 0.05]} rotation={[-0.2, 0, 0.45]}><coneGeometry args={[0.045, 0.26, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        <mesh position={[0.18, 0.24, 0.05]} rotation={[-0.2, 0, -0.45]}><coneGeometry args={[0.045, 0.26, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      </group>
      {/* 4 Animated Legs with Dark Hooves */}
      <mesh ref={leg1Ref} position={[-0.25, 0.36, 0.46]} material={cowMat}><cylinderGeometry args={[0.085, 0.065, 0.72, 8]} /></mesh>
      <mesh ref={leg2Ref} position={[0.25, 0.36, 0.46]} material={cowMat}><cylinderGeometry args={[0.085, 0.065, 0.72, 8]} /></mesh>
      <mesh ref={leg3Ref} position={[-0.25, 0.36, -0.46]} material={cowMat}><cylinderGeometry args={[0.085, 0.065, 0.72, 8]} /></mesh>
      <mesh ref={leg4Ref} position={[0.25, 0.36, -0.46]} material={cowMat}><cylinderGeometry args={[0.085, 0.065, 0.72, 8]} /></mesh>
    </group>
  );
}

function AnimatedChicken({ cx, cz, phase }: { cx: number; cz: number; phase: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (Math.hypot(cx - playerFrameState.x, cz - playerFrameState.z) > 130) {
      if (groupRef.current) groupRef.current.visible = false;
      return;
    }
    if (groupRef.current) groupRef.current.visible = true;
    const t = state.clock.elapsedTime * 0.8 + phase;
    const x = cx + Math.cos(t) * 2.4, z = cz + Math.sin(t * 1.3) * 2.4;
    const y = getExactMeshTerrainHeight(x, z);
    if (groupRef.current) {
      groupRef.current.position.set(x, y + Math.abs(Math.sin(t * 8)) * 0.03, z);
      groupRef.current.rotation.y = -t;
      groupRef.current.rotation.x = Math.max(0, Math.sin(t * 5)) * 0.28;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Plump Sculpted Chicken Body, Folded Wings, Plumed Tail, Neck, Comb, Beak & Yellow Legs */}
      <mesh position={[0, 0.28, 0]} scale={[0.78, 0.85, 1.18]}><sphereGeometry args={[0.20, 10, 10]} /><meshStandardMaterial color="#fffbeb" roughness={0.75} /></mesh>
      <mesh position={[-0.15, 0.29, 0]} scale={[0.25, 0.6, 0.85]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      <mesh position={[0.15, 0.29, 0]} scale={[0.25, 0.6, 0.85]}><sphereGeometry args={[0.18, 8, 8]} /><meshStandardMaterial color="#fef3c7" /></mesh>
      <mesh position={[0, 0.38, -0.22]} rotation={[-0.55, 0, 0]}><coneGeometry args={[0.10, 0.26, 6]} /><meshStandardMaterial color="#d97706" /></mesh>
      <mesh position={[0, 0.42, 0.15]} rotation={[0.25, 0, 0]}><cylinderGeometry args={[0.07, 0.11, 0.22, 8]} /><meshStandardMaterial color="#fffbeb" /></mesh>
      <mesh position={[0, 0.52, 0.19]}><sphereGeometry args={[0.095, 8, 8]} /><meshStandardMaterial color="#fffbeb" /></mesh>
      <mesh position={[0, 0.62, 0.19]}><boxGeometry args={[0.025, 0.09, 0.11]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 0.52, 0.30]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.032, 0.09, 6]} /><meshStandardMaterial color="#f59e0b" /></mesh>
      <mesh position={[-0.06, 0.10, 0.02]}><cylinderGeometry args={[0.015, 0.015, 0.20, 6]} /><meshStandardMaterial color="#f59e0b" /></mesh>
      <mesh position={[0.06, 0.10, 0.02]}><cylinderGeometry args={[0.015, 0.015, 0.20, 6]} /><meshStandardMaterial color="#f59e0b" /></mesh>
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

    const hColors = ["#854d0e", "#5c2d0c", "#f8fafc", "#3f3f46", "#b45309", "#a16207"];
    const hList = [
      [-515, 8], [-15, 12], [285, 8], [-270, 170], [-235, -28], [10, 295],
      [-45, -25], [160, -20], [-210, 195], [-60, 260],
    ].map(([cx, cz], i) => ({ cx, cz, color: hColors[i % hColors.length], phase: i * 1.3, radius: 4.5 }));

    const cList = [
      [292, -26], [295, 28], [440, -25], [-25, -45], [55, 35], [-240, 165], [-200, -25],
    ].map(([cx, cz], i) => ({ cx, cz, phase: i * 1.7, radius: 4 + (i % 3) * 1.5 }));

    const chkList = [
      [355, -3], [362, 4], [372, -4], [-282, 235], [-274, 242], [-248, -92],
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
