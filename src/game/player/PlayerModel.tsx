"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerFrameState } from "@/game/state/usePlayerStore";

export interface DigitalHumanProps {
  coatColor?: string;
  skirtColor?: string;
  capeColor?: string;
  hairColor?: string;
  isNpc?: boolean;
  npcWalkSpeed?: number;
  npcSeed?: number;
  hasStaff?: boolean;
}

let sharedPixarGeos: {
  torsoTunic: THREE.BufferGeometry;
  thigh: THREE.BufferGeometry;
  calfBoot: THREE.BufferGeometry;
  upperArm: THREE.BufferGeometry;
  forearm: THREE.BufferGeometry;
} | null = null;

export function getSculptedHumanGeometries() {
  if (sharedPixarGeos) return sharedPixarGeos;

  const torsoCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.142, -0.16),
    new THREE.Vector2(0.136, -0.06),
    new THREE.Vector2(0.138, 0.05),
    new THREE.Vector2(0.148, 0.18),
    new THREE.Vector2(0.145, 0.27),
    new THREE.Vector2(0.115, 0.33),
    new THREE.Vector2(0.064, 0.36),
  ]);
  const torsoTunic = new THREE.LatheGeometry(torsoCurve.getPoints(24), 22);
  torsoTunic.scale(1.10, 1.0, 0.84);
  torsoTunic.computeVertexNormals();

  const thighCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.064, -0.25),
    new THREE.Vector2(0.074, -0.14),
    new THREE.Vector2(0.082, -0.04),
    new THREE.Vector2(0.078, 0.05),
  ]);
  const thigh = new THREE.LatheGeometry(thighCurve.getPoints(16), 16);
  thigh.computeVertexNormals();

  const calfCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.054, -0.25),
    new THREE.Vector2(0.052, -0.16),
    new THREE.Vector2(0.062, -0.07),
    new THREE.Vector2(0.058, 0.04),
  ]);
  const calfBoot = new THREE.LatheGeometry(calfCurve.getPoints(16), 16);
  calfBoot.computeVertexNormals();

  const upperArmCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.046, -0.18),
    new THREE.Vector2(0.054, -0.09),
    new THREE.Vector2(0.058, 0.04),
  ]);
  const upperArm = new THREE.LatheGeometry(upperArmCurve.getPoints(14), 14);
  upperArm.computeVertexNormals();

  const forearmCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.038, -0.16),
    new THREE.Vector2(0.046, -0.08),
    new THREE.Vector2(0.045, 0.03),
  ]);
  const forearm = new THREE.LatheGeometry(forearmCurve.getPoints(14), 14);
  forearm.computeVertexNormals();

  sharedPixarGeos = { torsoTunic, thigh, calfBoot, upperArm, forearm };
  return sharedPixarGeos;
}

export function DigitalHumanCharacter({
  coatColor = "#d95338",
  skirtColor = "#4a2c18",
  hairColor = "#3b1d0e",
  isNpc = false,
  npcWalkSpeed = 0,
  npcSeed = 0,
  hasStaff = true,
}: DigitalHumanProps) {
  const geos = useMemo(() => getSculptedHumanGeometries(), []);

  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const backpackRef = useRef<THREE.Group>(null);
  const satchelRef = useRef<THREE.Group>(null);

  const leftThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const leftUpperArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  // Dedicated Refs for Sword & Lantern (Updated every frame in useFrame so Toggle NEVER fails!)
  const swordGroupRef = useRef<THREE.Group>(null);
  const lanternGroupRef = useRef<THREE.Group>(null);

  const phaseRef = useRef(npcSeed * 3.1);
  const moveBlendRef = useRef(0);

  const pixarSkinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffcaa6", emissive: "#f43f5e", emissiveIntensity: 0.08, roughness: 0.42 }),
    []
  );
  const noseBlushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f87171", emissive: "#e11d48", emissiveIntensity: 0.12, roughness: 0.45 }), []);
  const sweaterMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: coatColor, emissive: coatColor, emissiveIntensity: 0.10, roughness: 0.62 }),
    [coatColor]
  );
  const scarfMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c83223", emissive: "#991b1b", emissiveIntensity: 0.10, roughness: 0.68 }), []);
  const creamFleeceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f5ead8", emissive: "#fef3c7", emissiveIntensity: 0.10, roughness: 0.85 }), []);
  const pantMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: skirtColor, emissive: skirtColor, emissiveIntensity: 0.08, roughness: 0.72 }),
    [skirtColor]
  );
  const hairMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: hairColor, emissive: "#451a03", emissiveIntensity: 0.08, roughness: 0.45 }),
    [hairColor]
  );
  const leatherBagMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#854621", emissive: "#451a03", emissiveIntensity: 0.08, roughness: 0.62 }), []);
  const darkLeatherMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#542b14", roughness: 0.65 }), []);
  const strapTanMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b8865c", roughness: 0.65 }), []);
  const goggleFrameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#574c43", metalness: 0.65, roughness: 0.32 }), []);
  const goggleLensMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#334155", metalness: 0.85, roughness: 0.12 }), []);
  const brassBuckleMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e5a93c", metalness: 0.75, roughness: 0.25 }), []);
  const scleraMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);
  const hazelIrisMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#6b3410" }), []);
  const pupilMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#0f172a" }), []);
  const autumnLeafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ea580c", emissive: "#ea580c", emissiveIntensity: 0.2, roughness: 0.5 }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime + npcSeed * 7.3;
    if (!rootRef.current || !torsoRef.current || !headRef.current) return;

    // 1. Live Weapon Visibility Check Every Frame ('sword' | 'lantern' | 'none')
    const rawEq = (playerFrameState as any).equippedItem;
    const eq = rawEq === "none" || rawEq === "lantern" || rawEq === "sword" ? rawEq : "sword";
    if (swordGroupRef.current) {
      swordGroupRef.current.visible = !isNpc && eq === "sword";
    }
    if (lanternGroupRef.current) {
      lanternGroupRef.current.visible = !isNpc && eq === "lantern";
    }

    const isMoving = isNpc ? npcWalkSpeed > 0.05 : playerFrameState.isMoving && !playerFrameState.isInBoat;
    const isRunning = isNpc ? false : playerFrameState.isRunning;
    const isGrounded = isNpc ? true : playerFrameState.isGrounded;
    const isSwimming = isNpc ? false : playerFrameState.isSwimming && !playerFrameState.isInBoat;

    const targetBlend = isMoving ? (isRunning ? 1.25 : 0.88) : isSwimming ? 0.75 : 0.0;
    moveBlendRef.current = THREE.MathUtils.lerp(moveBlendRef.current, targetBlend, dt * 10);
    const m = moveBlendRef.current;

    const cycleSpeed = isSwimming ? 6.5 : isRunning ? 13.5 : 8.5;
    if (isMoving || isSwimming) {
      phaseRef.current += dt * cycleSpeed;
    } else {
      phaseRef.current = THREE.MathUtils.lerp(phaseRef.current, Math.round(phaseRef.current / Math.PI) * Math.PI, dt * 8);
    }

    const p = phaseRef.current;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);

    const walkBounce = isGrounded && !isSwimming ? Math.abs(sinP) * 0.052 * m : 0;
    const idleBreath = Math.sin(t * 2.4) * 0.010;
    const idleSwayX = (1.0 - Math.min(1, m)) * Math.sin(t * 1.2) * 0.012;
    const ridingY = !isNpc && playerFrameState.mountedHorseIndex !== -1 ? 0.34 : 0;
    const ridingZ = !isNpc && playerFrameState.mountedHorseIndex !== -1 ? -0.08 : 0;
    rootRef.current.position.set(idleSwayX, isSwimming ? -0.35 + idleBreath * 2 : ridingY + walkBounce + idleBreath, ridingZ);

    const targetPitch = isSwimming ? (isMoving ? 1.2 : 0.45) : !isGrounded ? 0.16 : isMoving ? (isRunning ? 0.16 : 0.06) : Math.sin(t * 1.2) * 0.015;
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetPitch, dt * 10);
    rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, cosP * 0.032 * m + idleSwayX * 0.8, dt * 10);

    torsoRef.current.rotation.y = sinP * 0.16 * m + (1.0 - Math.min(1, m)) * Math.sin(t * 0.8) * 0.04;
    torsoRef.current.rotation.z = -cosP * 0.025 * m;
    headRef.current.rotation.y = -sinP * 0.11 * m + (m < 0.05 ? Math.sin(t * 0.9) * 0.10 : 0);
    headRef.current.rotation.z = m < 0.05 ? Math.cos(t * 0.7) * 0.045 : -cosP * 0.03 * m;
    headRef.current.rotation.x = isSwimming ? -0.6 : -rootRef.current.rotation.x * 0.45 + Math.sin(t * 1.8) * 0.025;

    if (backpackRef.current) {
      backpackRef.current.position.y = 0.09 + Math.sin(p * 2.0 - 0.5) * 0.016 * m;
      backpackRef.current.rotation.x = 0.04 + Math.abs(cosP) * 0.06 * m;
    }
    if (satchelRef.current) {
      satchelRef.current.rotation.z = -0.08 - Math.abs(sinP) * 0.12 * m;
    }

    const isBlinking = (t * 0.27) % 1.0 > 0.95;
    if (leftEyelidRef.current && rightEyelidRef.current) {
      leftEyelidRef.current.visible = isBlinking;
      rightEyelidRef.current.visible = isBlinking;
    }

    const isRidingHorse = !isNpc && playerFrameState.mountedHorseIndex !== -1;
    if (leftThighRef.current && rightThighRef.current && leftShinRef.current && rightShinRef.current) {
      if (isRidingHorse) {
        leftThighRef.current.rotation.set(-0.82, 0.35, 0.58);
        rightThighRef.current.rotation.set(-0.82, -0.35, -0.58);
        leftShinRef.current.rotation.x = 0.92;
        rightShinRef.current.rotation.x = 0.92;
      } else if (!isGrounded && !isSwimming) {
        leftThighRef.current.rotation.set(-0.45, 0, 0);
        leftShinRef.current.rotation.x = 0.75;
        rightThighRef.current.rotation.set(0.25, 0, 0);
        rightShinRef.current.rotation.x = 0.45;
      } else {
        const idleKnee = (1.0 - Math.min(1, m)) * 0.05;
        leftThighRef.current.rotation.set(sinP * 0.68 * m - idleKnee * 0.5, 0.04, 0.02);
        rightThighRef.current.rotation.set(-sinP * 0.68 * m - idleKnee * 0.5, -0.04, -0.02);
        leftShinRef.current.rotation.x = Math.max(0, -cosP) * 0.82 * m + m * 0.06 + idleKnee;
        rightShinRef.current.rotation.x = Math.max(0, cosP) * 0.82 * m + m * 0.06 + idleKnee;
      }
    }

    if (leftUpperArmRef.current && rightUpperArmRef.current && leftForearmRef.current && rightForearmRef.current) {
      const armSwing = -sinP * 0.58 * m;
      const idleArmBreath = Math.sin(t * 2.4) * 0.02;
      const idleElbow = -0.24;
      const runElbow = isRunning ? -0.72 : -0.38;

      if (isSwimming) {
        leftUpperArmRef.current.rotation.set(-0.9 + sinP * 0.7, 0, 0.35 + Math.max(0, cosP) * 0.5);
        rightUpperArmRef.current.rotation.set(-0.9 + sinP * 0.7, 0, -0.35 - Math.max(0, cosP) * 0.5);
        leftForearmRef.current.rotation.x = -0.4;
        rightForearmRef.current.rotation.x = -0.4;
      } else {
        // LEFT ARM: If holding Lantern (eq === 'lantern'), raise arm forward & upward to hold the lantern aloft!
        if (!isNpc && eq === "lantern") {
          leftUpperArmRef.current.rotation.set(-1.12 + Math.sin(t * 2.8) * 0.04, -0.16, 0.14);
          leftForearmRef.current.rotation.x = -0.62 + Math.cos(t * 2.8) * 0.03;
        } else if (isRidingHorse) {
          leftUpperArmRef.current.rotation.set(-0.45, 0.2, 0.12);
          leftForearmRef.current.rotation.x = -0.65;
        } else {
          leftUpperArmRef.current.rotation.set(armSwing + 0.04, 0, 0.15 + idleArmBreath);
          leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(idleElbow, runElbow, Math.min(1, m)) + Math.max(0, -armSwing) * 0.25;
        }

        // RIGHT ARM
        if (isRidingHorse && eq !== 'sword') {
          rightUpperArmRef.current.rotation.set(-0.45, -0.2, -0.12);
          rightForearmRef.current.rotation.x = -0.65;
        } else {
          rightUpperArmRef.current.rotation.set(-armSwing + 0.04, 0, -0.15 - idleArmBreath);
          rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(idleElbow, runElbow, Math.min(1, m)) + Math.max(0, armSwing) * 0.25;
        }
      }
    }
  });

  return (
    <group ref={rootRef}>
      {!isNpc && <pointLight position={[0, 0.85, -0.65]} intensity={0.85} distance={3.5} color="#fff7ed" />}
      {!isNpc && <pointLight position={[0, 0.75, 0.75]} intensity={0.55} distance={3.0} color="#fed7aa" />}

      <group ref={torsoRef} position={[0, 0.02, 0]}>
        <mesh castShadow receiveShadow geometry={geos.torsoTunic} material={sweaterMat} />
        <mesh castShadow position={[0, 0.11, 0.072]} scale={[0.95, 1.0, 0.55]} material={creamFleeceMat}>
          <boxGeometry args={[0.22, 0.34, 0.14]} />
        </mesh>
        {[-0.088, 0.088].map((sx, sIdx) => (
          <mesh key={sIdx} position={[sx, 0.17, 0.005]} scale={[1.0, 1.0, 0.88]} material={darkLeatherMat}>
            <boxGeometry args={[0.042, 0.36, 0.24]} />
          </mesh>
        ))}
        <mesh position={[0, 0.13, 0.015]} rotation={[0, 0, -0.68]} scale={[1.12, 1.0, 0.86]} material={strapTanMat}>
          <cylinderGeometry args={[0.142, 0.142, 0.038, 16]} />
        </mesh>

        <group position={[0, 0.34, 0.01]}>
          <mesh castShadow rotation={[Math.PI / 2 + 0.08, 0, 0]} scale={[1.08, 0.92, 1.0]} material={scarfMat}>
            <torusGeometry args={[0.105, 0.042, 12, 20]} />
          </mesh>
          <mesh castShadow position={[0, 0.038, 0.005]} rotation={[Math.PI / 2 + 0.05, 0, 0]} scale={[1.02, 0.88, 0.95]} material={scarfMat}>
            <torusGeometry args={[0.096, 0.036, 10, 18]} />
          </mesh>
        </group>

        <mesh castShadow position={[0, -0.15, 0]} scale={[1.12, 0.90, 0.80]} material={pantMat}>
          <sphereGeometry args={[0.140, 14, 12]} />
        </mesh>

        <mesh position={[0, -0.05, 0]} scale={[1.14, 1.0, 0.85]} material={strapTanMat}>
          <cylinderGeometry args={[0.135, 0.138, 0.055, 18]} />
        </mesh>
        <mesh position={[0, -0.05, 0.118]} material={brassBuckleMat}><boxGeometry args={[0.052, 0.055, 0.018]} /></mesh>
        {[-0.075, 0.075].map((lx, lIdx) => (
          <mesh key={lIdx} position={[lx, -0.05, 0.112]} material={darkLeatherMat}><boxGeometry args={[0.018, 0.062, 0.022]} /></mesh>
        ))}
        <mesh position={[0.145, -0.06, 0.03]} rotation={[0, 0, -0.12]} material={creamFleeceMat}>
          <cylinderGeometry args={[0.022, 0.022, 0.065, 8]} />
        </mesh>

        {hasStaff && (
          <group ref={satchelRef} position={[-0.165, -0.12, 0.02]} rotation={[0, 0, -0.08]}>
            <mesh castShadow scale={[0.75, 1.0, 1.1]} material={leatherBagMat}>
              <sphereGeometry args={[0.088, 12, 10]} />
            </mesh>
            <mesh position={[0.02, 0.04, 0]} scale={[0.78, 0.55, 1.12]} material={darkLeatherMat}>
              <sphereGeometry args={[0.088, 10, 8]} />
            </mesh>
            <mesh position={[-0.01, 0.08, 0.03]} rotation={[0.2, 0, 0.25]} material={creamFleeceMat}>
              <cylinderGeometry args={[0.014, 0.014, 0.08, 8]} />
            </mesh>
            <group position={[-0.02, 0.08, -0.01]} rotation={[0, 0, 0.38]}>
              <mesh position={[0, 0.14, 0]} material={darkLeatherMat}><cylinderGeometry args={[0.004, 0.007, 0.28, 5]} /></mesh>
              <mesh position={[-0.04, 0.18, 0.02]} rotation={[0.2, 0, 0.55]} material={darkLeatherMat}><cylinderGeometry args={[0.003, 0.005, 0.16, 5]} /></mesh>
              {[
                [0.01, 0.24, 0.01], [-0.04, 0.22, 0.03], [-0.08, 0.24, 0.02],
                [0.03, 0.18, -0.02], [-0.02, 0.15, 0.04], [-0.06, 0.17, -0.01],
              ].map(([lx, ly, lz], li) => (
                <mesh key={li} position={[lx, ly, lz]} scale={[1.2, 0.7, 0.8]} material={autumnLeafMat}>
                  <dodecahedronGeometry args={[0.016, 0]} />
                </mesh>
              ))}
            </group>
          </group>
        )}

        {hasStaff && (
          <group ref={backpackRef} position={[0, 0.09, -0.155]}>
            <mesh castShadow position={[0, -0.02, 0]} scale={[1.15, 1.22, 0.85]} material={leatherBagMat}>
              <sphereGeometry args={[0.135, 16, 14]} />
            </mesh>
            <mesh castShadow position={[0, 0.08, 0.01]} scale={[1.18, 0.55, 0.88]} material={strapTanMat}>
              <sphereGeometry args={[0.132, 14, 10]} />
            </mesh>
            <mesh position={[0, 0.04, -0.112]} material={brassBuckleMat}><sphereGeometry args={[0.018, 8, 8]} /></mesh>
            {[-0.055, 0.055].map((bx, bIdx) => (
              <mesh key={bIdx} position={[bx, -0.02, -0.105]} material={darkLeatherMat}>
                <boxGeometry args={[0.024, 0.24, 0.025]} />
              </mesh>
            ))}
            {[-0.135, 0.135].map((px, pIdx) => (
              <mesh key={pIdx} castShadow position={[px, -0.04, 0.01]} scale={[0.55, 0.85, 0.75]} material={darkLeatherMat}>
                <sphereGeometry args={[0.068, 10, 10]} />
              </mesh>
            ))}
            <mesh castShadow position={[-0.02, 0.155, 0.02]} rotation={[0, 0.2, Math.PI / 2 - 0.15]} material={strapTanMat}>
              <cylinderGeometry args={[0.036, 0.036, 0.16, 12]} />
            </mesh>
            <mesh position={[0.055, 0.19, 0.01]} rotation={[-0.25, 0, -0.22]} material={creamFleeceMat}>
              <cylinderGeometry args={[0.022, 0.024, 0.14, 10]} />
            </mesh>
            <mesh position={[0.072, 0.25, 0.0]} rotation={[-0.25, 0, -0.22]} material={sweaterMat}>
              <cylinderGeometry args={[0.014, 0.016, 0.08, 8]} />
            </mesh>
          </group>
        )}

        <group ref={headRef} position={[0, 0.48, 0.015]} scale={[0.98, 0.96, 0.98]}>
          <mesh castShadow position={[0, 0.01, 0]} scale={[0.98, 0.95, 0.94]} material={pixarSkinMat}>
            <sphereGeometry args={[0.154, 24, 22]} />
          </mesh>
          <mesh position={[-0.082, -0.015, 0.118]} scale={[1.25, 0.8, 0.5]} material={noseBlushMat}><sphereGeometry args={[0.024, 10, 10]} /></mesh>
          <mesh position={[0.082, -0.015, 0.118]} scale={[1.25, 0.8, 0.5]} material={noseBlushMat}><sphereGeometry args={[0.024, 10, 10]} /></mesh>
          <mesh castShadow position={[0, 0.0, 0.148]} scale={[1.15, 0.82, 0.95]} material={noseBlushMat}>
            <sphereGeometry args={[0.021, 12, 12]} />
          </mesh>
          <mesh position={[0, -0.048, 0.136]} rotation={[0.15, 0, 0]} scale={[1.4, 0.45, 0.5]} material={darkLeatherMat}>
            <torusGeometry args={[0.022, 0.0045, 6, 12, Math.PI]} />
          </mesh>
          {[-1, 1].map((dir, eIdx) => (
            <group key={eIdx} position={[dir * 0.152, 0.0, -0.005]} rotation={[0, -dir * 0.28, dir * 0.18]}>
              <mesh castShadow scale={[0.72, 0.95, 0.45]} material={pixarSkinMat}><sphereGeometry args={[0.044, 12, 12]} /></mesh>
              <mesh position={[dir * 0.004, 0, 0.012]} scale={[0.48, 0.65, 0.3]} material={noseBlushMat}><sphereGeometry args={[0.036, 10, 10]} /></mesh>
            </group>
          ))}

          {[-0.050, 0.050].map((ex, idx) => (
            <group key={idx} position={[ex, 0.022, 0.128]} rotation={[0, idx === 0 ? -0.12 : 0.12, 0]}>
              <mesh scale={[1.12, 1.18, 0.46]} material={scleraMat}><sphereGeometry args={[0.027, 14, 14]} /></mesh>
              <mesh position={[0, 0, 0.006]} scale={[0.78, 0.84, 0.44]} material={hazelIrisMat}><sphereGeometry args={[0.026, 14, 14]} /></mesh>
              <mesh position={[0, 0, 0.011]} scale={[0.48, 0.54, 0.40]} material={pupilMat}><sphereGeometry args={[0.024, 10, 10]} /></mesh>
              <mesh position={[-0.006, 0.008, 0.019]} material={scleraMat}><sphereGeometry args={[0.0065, 8, 8]} /></mesh>
              <mesh position={[0.006, -0.006, 0.019]} material={scleraMat}><sphereGeometry args={[0.0035, 6, 6]} /></mesh>
              <mesh ref={idx === 0 ? leftEyelidRef : rightEyelidRef} visible={false} position={[0, 0, 0.004]} scale={[1.14, 1.20, 0.50]} material={pixarSkinMat}>
                <sphereGeometry args={[0.027, 10, 10]} />
              </mesh>
              <mesh position={[0, 0.042, 0.010]} rotation={[0, 0, (idx === 0 ? -0.12 : 0.08) + Math.PI / 2]} material={hairMat}>
                <capsuleGeometry args={[0.007, 0.036, 4, 8]} />
              </mesh>
            </group>
          ))}

          <mesh position={[0, 0.03, -0.02]} scale={[0.98, 0.96, 0.98]} material={hairMat}>
            <sphereGeometry args={[0.158, 18, 16]} />
          </mesh>
          <mesh position={[-0.025, 0.078, 0.122]} rotation={[0.22, 0.15, 1.18]} scale={[0.85, 1.1, 0.65]} material={hairMat}>
            <capsuleGeometry args={[0.028, 0.095, 6, 10]} />
          </mesh>
          <mesh position={[0.042, 0.082, 0.118]} rotation={[0.25, -0.1, 0.95]} scale={[0.75, 1.0, 0.6]} material={hairMat}>
            <capsuleGeometry args={[0.024, 0.075, 6, 10]} />
          </mesh>
          {[-0.128, 0.128].map((sx, sIdx) => (
            <mesh key={sIdx} position={[sx, -0.01, 0.065]} rotation={[0.15, 0, sx < 0 ? 0.12 : -0.12]} material={hairMat}>
              <capsuleGeometry args={[0.022, 0.085, 6, 8]} />
            </mesh>
          ))}

          <group position={[0, 0.055, -0.012]} rotation={[-0.12, 0, 0]}>
            <mesh castShadow position={[0, 0.025, 0]} scale={[1.02, 0.92, 1.05]} material={sweaterMat}>
              <sphereGeometry args={[0.162, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            </mesh>
            <mesh position={[0, 0.032, -0.005]} scale={[0.32, 0.94, 1.07]} material={creamFleeceMat}>
              <sphereGeometry args={[0.163, 14, 14, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
            </mesh>
            <mesh castShadow position={[0, 0.015, 0.005]} rotation={[Math.PI / 2, 0, 0]} scale={[1.04, 1.08, 1.15]} material={creamFleeceMat}>
              <torusGeometry args={[0.148, 0.038, 12, 24]} />
            </mesh>
            {[-0.145, 0.145].map((fx, fIdx) => (
              <mesh key={fIdx} castShadow position={[fx, -0.035, -0.025]} rotation={[0.2, 0, fx < 0 ? 0.18 : -0.18]} material={creamFleeceMat}>
                <capsuleGeometry args={[0.035, 0.065, 6, 10]} />
              </mesh>
            ))}

            <group position={[0, 0.068, 0.132]} rotation={[-0.28, 0, 0]}>
              <mesh position={[0, 0, 0.01]} material={darkLeatherMat}><boxGeometry args={[0.045, 0.022, 0.025]} /></mesh>
              {[-0.058, 0.058].map((gx, gIdx) => (
                <group key={gIdx} position={[gx, 0, 0]} rotation={[0, gIdx === 0 ? -0.18 : 0.18, 0]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} material={strapTanMat}>
                    <cylinderGeometry args={[0.050, 0.052, 0.024, 18]} />
                  </mesh>
                  <mesh position={[0, 0, 0.016]} material={goggleFrameMat}>
                    <torusGeometry args={[0.044, 0.009, 10, 20]} />
                  </mesh>
                  <mesh position={[0, 0, 0.014]} scale={[1.0, 1.0, 0.42]} material={goggleLensMat}>
                    <sphereGeometry args={[0.043, 14, 12]} />
                  </mesh>
                  <mesh position={[-0.012, 0.014, 0.032]} material={scleraMat}>
                    <sphereGeometry args={[0.006, 6, 6]} />
                  </mesh>
                </group>
              ))}
            </group>
          </group>
        </group>

        {/* LEFT ARM, LARGE 5-FINGERED HAND & RAISED LANTERN LAMP */}
        <group ref={leftUpperArmRef} position={[-0.168, 0.26, 0]}>
          <mesh position={[0.01, 0.01, 0]} material={sweaterMat}><sphereGeometry args={[0.058, 12, 10]} /></mesh>
          <mesh castShadow geometry={geos.upperArm} material={sweaterMat} />
          <group ref={leftForearmRef} position={[0, -0.17, 0]}>
            <mesh castShadow geometry={geos.forearm} material={sweaterMat} />
            <mesh position={[0, -0.115, 0]} material={leatherBagMat}><cylinderGeometry args={[0.048, 0.046, 0.065, 12]} /></mesh>
            <group position={[0, -0.18, 0.008]}>
              <mesh scale={[0.65, 1.08, 0.95]} material={darkLeatherMat}><sphereGeometry args={[0.044, 12, 10]} /></mesh>
              <mesh position={[0.012, -0.016, 0.004]} scale={[0.60, 0.88, 0.90]} material={pixarSkinMat}><sphereGeometry args={[0.040, 12, 10]} /></mesh>
              <mesh position={[0.020, -0.006, 0.036]} rotation={[0.65, 0.15, 0.25]} material={pixarSkinMat}>
                <capsuleGeometry args={[0.0105, 0.028, 6, 8]} />
              </mesh>
              {[0.019, 0.0065, -0.0065, -0.019].map((fz, fIdx) => (
                <mesh key={fIdx} position={[0.006, -0.044, fz]} rotation={[0, 0, 0.22]} material={pixarSkinMat}>
                  <capsuleGeometry args={[0.009, fIdx === 1 || fIdx === 2 ? 0.034 : 0.027, 6, 8]} />
                </mesh>
              ))}
              {/* GLOWING LANTERN LAMP (Controlled via lanternGroupRef.current.visible in useFrame!) */}
              <group ref={lanternGroupRef} visible={false} position={[0.0, -0.045, 0.025]} rotation={[1.72, 0, 0]}>
                <mesh position={[0, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} material={goggleFrameMat}>
                  <torusGeometry args={[0.024, 0.0045, 6, 12]} />
                </mesh>
                <mesh position={[0, -0.06, 0]} material={goggleFrameMat}>
                  <coneGeometry args={[0.052, 0.045, 6]} />
                </mesh>
                <mesh position={[0, -0.115, 0]}>
                  <cylinderGeometry args={[0.038, 0.032, 0.082, 6]} />
                  <meshStandardMaterial color="#fef08a" emissive="#f59e0b" emissiveIntensity={3.6} roughness={0.15} />
                </mesh>
                <mesh position={[0, -0.165, 0]} material={goggleFrameMat}>
                  <cylinderGeometry args={[0.042, 0.046, 0.024, 6]} />
                </mesh>
                <pointLight position={[0, -0.12, 0.08]} intensity={2.5} distance={24} color="#fbbf24" />
              </group>
            </group>
          </group>
        </group>

        {/* RIGHT ARM, LARGE 5-FINGERED HAND & KNIGHT SWORD */}
        <group ref={rightUpperArmRef} position={[0.168, 0.26, 0]}>
          <mesh position={[-0.01, 0.01, 0]} material={sweaterMat}><sphereGeometry args={[0.058, 12, 10]} /></mesh>
          <mesh castShadow geometry={geos.upperArm} material={sweaterMat} />
          <group ref={rightForearmRef} position={[0, -0.17, 0]}>
            <mesh castShadow geometry={geos.forearm} material={sweaterMat} />
            <mesh position={[0, -0.115, 0]} material={leatherBagMat}><cylinderGeometry args={[0.048, 0.046, 0.065, 12]} /></mesh>
            <group position={[0, -0.18, 0.008]}>
              <mesh scale={[0.65, 1.08, 0.95]} material={darkLeatherMat}><sphereGeometry args={[0.044, 12, 10]} /></mesh>
              <mesh position={[-0.012, -0.016, 0.004]} scale={[0.60, 0.88, 0.90]} material={pixarSkinMat}><sphereGeometry args={[0.040, 12, 10]} /></mesh>
              <mesh position={[-0.020, -0.006, 0.036]} rotation={[0.65, -0.15, -0.25]} material={pixarSkinMat}>
                <capsuleGeometry args={[0.0105, 0.028, 6, 8]} />
              </mesh>
              {[0.019, 0.0065, -0.0065, -0.019].map((fz, fIdx) => (
                <mesh key={fIdx} position={[-0.006, -0.044, fz]} rotation={[0, 0, -0.22]} material={pixarSkinMat}>
                  <capsuleGeometry args={[0.009, fIdx === 1 || fIdx === 2 ? 0.034 : 0.027, 6, 8]} />
                </mesh>
              ))}
              {/* KNIGHT SWORD (Controlled via swordGroupRef.current.visible in useFrame!) */}
              <group ref={swordGroupRef} visible={true} position={[-0.005, -0.032, 0.02]} rotation={[Math.PI * 0.42, 0, 0]}>
                <mesh position={[0, -0.06, 0]} material={brassBuckleMat}>
                  <sphereGeometry args={[0.022, 10, 10]} />
                </mesh>
                <mesh position={[0, 0.0, 0]} material={darkLeatherMat}>
                  <cylinderGeometry args={[0.014, 0.016, 0.11, 10]} />
                </mesh>
                <mesh position={[0, 0.06, 0]} material={brassBuckleMat}>
                  <boxGeometry args={[0.026, 0.020, 0.15]} />
                </mesh>
                <mesh castShadow position={[0, 0.34, 0]} scale={[0.35, 1.0, 1.0]}>
                  <cylinderGeometry args={[0.012, 0.026, 0.54, 8]} />
                  <meshStandardMaterial color="#f8fafc" emissive="#93c5fd" emissiveIntensity={0.22} metalness={0.88} roughness={0.15} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      </group>

      <group ref={leftThighRef} position={[-0.084, -0.15, 0]}>
        <mesh castShadow geometry={geos.thigh} material={pantMat} />
        <group ref={leftShinRef} position={[0, -0.25, 0]}>
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={creamFleeceMat}>
            <torusGeometry args={[0.056, 0.018, 8, 14]} />
          </mesh>
          <mesh position={[0, -0.10, 0]} material={darkLeatherMat}><cylinderGeometry args={[0.055, 0.052, 0.10, 12]} /></mesh>
          <mesh castShadow geometry={geos.calfBoot} material={leatherBagMat} />
          <mesh castShadow position={[0, -0.25, 0.034]} scale={[0.92, 0.78, 1.45]} material={leatherBagMat}><sphereGeometry args={[0.058, 12, 10]} /></mesh>
          <mesh position={[0, -0.285, 0.034]} scale={[0.95, 0.25, 1.48]} material={darkLeatherMat}><cylinderGeometry args={[0.058, 0.058, 0.08, 12]} /></mesh>
        </group>
      </group>

      <group ref={rightThighRef} position={[0.084, -0.15, 0]}>
        <mesh castShadow geometry={geos.thigh} material={pantMat} />
        <group ref={rightShinRef} position={[0, -0.25, 0]}>
          <mesh position={[0, -0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={creamFleeceMat}>
            <torusGeometry args={[0.056, 0.018, 8, 14]} />
          </mesh>
          <mesh position={[0, -0.10, 0]} material={darkLeatherMat}><cylinderGeometry args={[0.055, 0.052, 0.10, 12]} /></mesh>
          <mesh castShadow geometry={geos.calfBoot} material={leatherBagMat} />
          <mesh castShadow position={[0, -0.25, 0.034]} scale={[0.92, 0.78, 1.45]} material={leatherBagMat}><sphereGeometry args={[0.058, 12, 10]} /></mesh>
          <mesh position={[0, -0.285, 0.034]} scale={[0.95, 0.25, 1.48]} material={darkLeatherMat}><cylinderGeometry args={[0.058, 0.058, 0.08, 12]} /></mesh>
        </group>
      </group>
    </group>
  );
}

export default function PlayerModel() {
  return <DigitalHumanCharacter />;
}
