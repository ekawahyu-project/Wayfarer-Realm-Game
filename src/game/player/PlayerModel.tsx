"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getWorldTextures } from "@/utils/proceduralTextures";

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

let sharedHumanGeos: {
  torsoTunic: THREE.BufferGeometry;
  thigh: THREE.BufferGeometry;
  calfBoot: THREE.BufferGeometry;
  upperArm: THREE.BufferGeometry;
  forearm: THREE.BufferGeometry;
} | null = null;

export function getSculptedHumanGeometries() {
  if (sharedHumanGeos) return sharedHumanGeos;

  const torsoPoints = [
    new THREE.Vector2(0.128, -0.15),
    new THREE.Vector2(0.118, -0.06),
    new THREE.Vector2(0.114, 0.03),
    new THREE.Vector2(0.142, 0.17),
    new THREE.Vector2(0.158, 0.27),
    new THREE.Vector2(0.124, 0.33),
    new THREE.Vector2(0.058, 0.36),
  ];
  const torsoTunic = new THREE.LatheGeometry(torsoPoints, 24);
  torsoTunic.scale(1.14, 1.0, 0.70);

  const thigh = new THREE.LatheGeometry([
    new THREE.Vector2(0.050, -0.28),
    new THREE.Vector2(0.062, -0.16),
    new THREE.Vector2(0.074, -0.04),
    new THREE.Vector2(0.070, 0.05),
  ], 16);

  const calfBoot = new THREE.LatheGeometry([
    new THREE.Vector2(0.044, -0.27),
    new THREE.Vector2(0.040, -0.19),
    new THREE.Vector2(0.056, -0.09),
    new THREE.Vector2(0.050, 0.04),
  ], 16);

  const upperArm = new THREE.LatheGeometry([
    new THREE.Vector2(0.038, -0.20),
    new THREE.Vector2(0.046, -0.10),
    new THREE.Vector2(0.052, 0.04),
  ], 14);

  const forearm = new THREE.LatheGeometry([
    new THREE.Vector2(0.027, -0.18),
    new THREE.Vector2(0.036, -0.08),
    new THREE.Vector2(0.038, 0.03),
  ], 14);

  sharedHumanGeos = { torsoTunic, thigh, calfBoot, upperArm, forearm };
  return sharedHumanGeos;
}

export function DigitalHumanCharacter({
  coatColor = "#1e3a5f",
  skirtColor = "#1e293b",
  hairColor = "#2b170e",
  isNpc = false,
  npcWalkSpeed = 0,
  npcSeed = 0,
  hasStaff = true,
}: DigitalHumanProps) {
  const textures = useMemo(() => getWorldTextures(), []);
  const geos = useMemo(() => getSculptedHumanGeometries(), []);

  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const ponytailRef = useRef<THREE.Group>(null);

  const leftThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const leftUpperArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  const phaseRef = useRef(npcSeed * 3.1);
  const moveBlendRef = useRef(0);

  const sssSkinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffe4d0",
        emissive: "#fda4af",
        emissiveIntensity: 0.05,
        roughness: 0.38,
        clearcoat: 0.12,
        sheen: 0.3,
        sheenColor: new THREE.Color("#fecdd3"),
      }),
    []
  );

  const coatMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: coatColor, roughness: 0.52, sheen: 0.4 }), [coatColor]);
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.65 }), []);
  const pantMat = useMemo(() => new THREE.MeshStandardMaterial({ color: skirtColor, roughness: 0.72 }), [skirtColor]);
  const eyeMat = useMemo(() => new THREE.MeshPhysicalMaterial({ map: textures.eyeIris, roughness: 0.04, clearcoat: 1.0 }), [textures.eyeIris]);
  const leatherMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#451a03", roughness: 0.70 }), []);
  const bootMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#291202", roughness: 0.72 }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.85, roughness: 0.2 }), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime + npcSeed * 7.3;
    if (!rootRef.current || !torsoRef.current || !headRef.current) return;

    const isMoving = isNpc ? npcWalkSpeed > 0.05 : playerFrameState.isMoving && !playerFrameState.isInBoat;
    const isRunning = isNpc ? false : playerFrameState.isRunning;
    const isGrounded = isNpc ? true : playerFrameState.isGrounded;
    const isSwimming = isNpc ? false : playerFrameState.isSwimming && !playerFrameState.isInBoat;

    const targetBlend = isMoving ? (isRunning ? 1.25 : 0.85) : isSwimming ? 0.75 : 0.0;
    moveBlendRef.current = THREE.MathUtils.lerp(moveBlendRef.current, targetBlend, dt * 11);
    const m = moveBlendRef.current;

    const cycleSpeed = isSwimming ? 6.5 : isRunning ? 14.0 : 8.8;
    if (isMoving || isSwimming) {
      phaseRef.current += dt * cycleSpeed;
    } else {
      phaseRef.current = THREE.MathUtils.lerp(phaseRef.current, Math.round(phaseRef.current / Math.PI) * Math.PI, dt * 8);
    }

    const p = phaseRef.current;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);

    const bounce = isGrounded && !isSwimming ? Math.abs(sinP) * 0.042 * m : 0;
    const breath = Math.sin(t * 2.6) * 0.007;
    const ridingY = !isNpc && playerFrameState.mountedHorseIndex !== -1 ? 0.34 : 0;
    const ridingZ = !isNpc && playerFrameState.mountedHorseIndex !== -1 ? -0.08 : 0;
    rootRef.current.position.y = isSwimming ? -0.35 + breath * 2 : ridingY + bounce + breath;
    rootRef.current.position.z = ridingZ;

    const targetPitch = isSwimming ? (isMoving ? 1.2 : 0.45) : !isGrounded ? 0.14 : isMoving ? (isRunning ? 0.14 : 0.04) : 0;
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetPitch, dt * 10);
    rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, cosP * 0.022 * m, dt * 10);

    torsoRef.current.rotation.y = sinP * 0.13 * m;
    headRef.current.rotation.y = -sinP * 0.09 * m + (m < 0.05 ? Math.sin(t * 0.9) * 0.06 : 0);
    headRef.current.rotation.x = isSwimming ? -0.6 : -rootRef.current.rotation.x * 0.45;

    const isBlinking = (t * 0.28) % 1.0 > 0.95;
    const blinkScaleY = isBlinking ? 0.95 : 0.08;
    if (leftEyelidRef.current && rightEyelidRef.current) {
      leftEyelidRef.current.scale.y = THREE.MathUtils.lerp(leftEyelidRef.current.scale.y, blinkScaleY, dt * 35);
      rightEyelidRef.current.scale.y = leftEyelidRef.current.scale.y;
    }

    if (ponytailRef.current) {
      ponytailRef.current.rotation.x = 0.22 + m * 0.42 + Math.sin(t * 9.5) * (0.05 + m * 0.1);
      ponytailRef.current.rotation.z = cosP * 0.14 * m;
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
        leftThighRef.current.rotation.set(sinP * 0.65 * m, 0, 0);
        rightThighRef.current.rotation.set(-sinP * 0.65 * m, 0, 0);
        leftShinRef.current.rotation.x = Math.max(0, -cosP) * 0.80 * m + m * 0.05;
        rightShinRef.current.rotation.x = Math.max(0, cosP) * 0.80 * m + m * 0.05;
      }
    }

    if (leftUpperArmRef.current && rightUpperArmRef.current && leftForearmRef.current && rightForearmRef.current) {
      if (isSwimming) {
        leftUpperArmRef.current.rotation.set(-0.9 + sinP * 0.7, 0, 0.35 + Math.max(0, cosP) * 0.5);
        rightUpperArmRef.current.rotation.set(-0.9 + sinP * 0.7, 0, -0.35 - Math.max(0, cosP) * 0.5);
        leftForearmRef.current.rotation.x = -0.4;
        rightForearmRef.current.rotation.x = -0.4;
      } else if (isRidingHorse) {
        leftUpperArmRef.current.rotation.set(-0.45, 0.2, 0.12);
        rightUpperArmRef.current.rotation.set(-0.45, -0.2, -0.12);
        leftForearmRef.current.rotation.x = -0.65;
        rightForearmRef.current.rotation.x = -0.65;
      } else {
        const armSwing = -sinP * 0.54 * m;
        leftUpperArmRef.current.rotation.set(armSwing, 0, 0.11);
        rightUpperArmRef.current.rotation.set(-armSwing, 0, -0.11);
        const idleElbow = -0.16;
        const runElbow = isRunning ? -0.65 : -0.30;
        leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(idleElbow, runElbow, Math.min(1, m));
        rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(idleElbow, runElbow, Math.min(1, m));
      }
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={torsoRef} position={[0, 0.04, 0]}>
        <mesh castShadow receiveShadow geometry={geos.torsoTunic} material={coatMat} />
        <mesh position={[0, 0.28, 0.082]} rotation={[Math.PI, Math.PI / 4, 0]} scale={[1.0, 1.0, 0.5]} material={shirtMat}>
          <coneGeometry args={[0.062, 0.13, 4]} />
        </mesh>
        <mesh castShadow position={[0, -0.15, 0]} scale={[1.12, 0.86, 0.72]} material={pantMat}>
          <sphereGeometry args={[0.132, 16, 12]} />
        </mesh>
        <mesh position={[0, 0.16, 0.0]} rotation={[0, 0, 0.62]} scale={[1.14, 1, 0.72]} material={leatherMat}>
          <cylinderGeometry args={[0.145, 0.145, 0.028, 16]} />
        </mesh>
        <mesh position={[0, -0.05, 0]} scale={[1.14, 1.0, 0.72]} material={leatherMat}>
          <cylinderGeometry args={[0.122, 0.126, 0.052, 18]} />
        </mesh>
        <mesh position={[0, -0.05, 0.094]} material={goldMat}><boxGeometry args={[0.044, 0.044, 0.015]} /></mesh>
        <mesh position={[0, 0.39, 0]} material={sssSkinMat}>
          <cylinderGeometry args={[0.046, 0.056, 0.14, 14]} />
        </mesh>

        {hasStaff && (
          <group position={[0.02, 0.15, -0.112]} rotation={[0, 0, -0.60]}>
            <mesh castShadow position={[0, -0.06, 0]}>
              <capsuleGeometry args={[0.014, 0.72, 8, 12]} />
              <meshStandardMaterial color="#18181b" roughness={0.22} metalness={0.35} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.10, 10]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.31, 0]} material={goldMat}>
              <cylinderGeometry args={[0.046, 0.046, 0.014, 14]} />
            </mesh>
            <mesh position={[0, 0.44, 0]}>
              <cylinderGeometry args={[0.014, 0.016, 0.24, 10]} />
              <meshStandardMaterial color="#991b1b" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.56, 0]} material={goldMat}>
              <cylinderGeometry args={[0.016, 0.016, 0.02, 10]} />
            </mesh>
          </group>
        )}

        <group ref={headRef} position={[0, 0.48, 0.01]} scale={[0.84, 0.86, 0.84]}>
          <mesh castShadow position={[0, 0.02, 0]} scale={[0.85, 1.04, 0.90]} material={sssSkinMat}>
            <sphereGeometry args={[0.150, 24, 24]} />
          </mesh>
          <mesh position={[0, -0.005, 0.138]} rotation={[-0.18, 0, 0]} material={sssSkinMat}>
            <coneGeometry args={[0.014, 0.040, 8]} />
          </mesh>
          <mesh position={[0, -0.052, 0.128]} scale={[1.2, 0.55, 0.6]}>
            <sphereGeometry args={[0.016, 10, 8]} />
            <meshStandardMaterial color="#fb7185" roughness={0.35} />
          </mesh>
          <mesh position={[-0.130, 0.005, -0.01]} scale={[0.35, 0.75, 0.55]} material={sssSkinMat}><sphereGeometry args={[0.035, 10, 10]} /></mesh>
          <mesh position={[0.130, 0.005, -0.01]} scale={[0.35, 0.75, 0.55]} material={sssSkinMat}><sphereGeometry args={[0.035, 10, 10]} /></mesh>

          {[-0.048, 0.048].map((ex, idx) => (
            <group key={idx} position={[ex, 0.018, 0.122]}>
              <mesh rotation={[0, -Math.PI / 2, 0]} scale={[0.55, 1.05, 0.92]} material={eyeMat}>
                <sphereGeometry args={[0.027, 16, 16]} />
              </mesh>
              <mesh ref={idx === 0 ? leftEyelidRef : rightEyelidRef} position={[0, 0.015, 0.003]} scale={[1, 0.08, 1]} material={sssSkinMat}>
                <sphereGeometry args={[0.028, 10, 8]} />
              </mesh>
              <mesh position={[0, 0.022, 0.015]} rotation={[0, 0, idx === 0 ? 0.08 : -0.08 + Math.PI / 2]}>
                <capsuleGeometry args={[0.004, 0.032, 4, 6]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            </group>
          ))}

          <mesh castShadow position={[0, 0.048, -0.015]} scale={[0.92, 1.02, 0.98]}>
            <sphereGeometry args={[0.160, 20, 18]} />
            <meshPhysicalMaterial color={hairColor} roughness={0.42} sheen={0.55} />
          </mesh>
          {[-0.072, -0.036, 0.0, 0.036, 0.072].map((fx, fIdx) => (
            <mesh key={fIdx} position={[fx, 0.075, 0.115]} rotation={[0.25, 0, -fx * 1.8]}>
              <coneGeometry args={[0.026, 0.115, 8]} />
              <meshPhysicalMaterial color={hairColor} roughness={0.42} sheen={0.55} />
            </mesh>
          ))}
          {[-0.120, 0.120].map((sx, sIdx) => (
            <mesh key={sIdx} position={[sx, -0.025, 0.068]} rotation={[0.12, 0, sx < 0 ? 0.12 : -0.12]}>
              <capsuleGeometry args={[0.024, 0.15, 8, 10]} />
              <meshPhysicalMaterial color={hairColor} roughness={0.42} sheen={0.55} />
            </mesh>
          ))}
          <group ref={ponytailRef} position={[0, 0.02, -0.148]}>
            <mesh position={[0, -0.16, -0.03]}>
              <coneGeometry args={[0.060, 0.36, 12]} />
              <meshPhysicalMaterial color={hairColor} roughness={0.42} sheen={0.55} />
            </mesh>
          </group>
        </group>

        <group ref={leftUpperArmRef} position={[-0.160, 0.27, 0]}>
          <mesh position={[0.01, 0.01, 0]} scale={[1.05, 1.0, 0.92]} material={coatMat}><sphereGeometry args={[0.054, 12, 10]} /></mesh>
          <mesh castShadow geometry={geos.upperArm} material={coatMat} />
          <mesh position={[0, -0.19, 0]} material={shirtMat}><cylinderGeometry args={[0.042, 0.040, 0.035, 12]} /></mesh>
          <group ref={leftForearmRef} position={[0, -0.19, 0]}>
            <mesh geometry={geos.forearm} material={sssSkinMat} />
            <group position={[0, -0.195, 0.005]}>
              <mesh scale={[0.42, 1.05, 0.82]} material={sssSkinMat}><sphereGeometry args={[0.032, 12, 10]} /></mesh>
              <mesh position={[0.008, -0.006, 0.024]} rotation={[0.55, 0, 0.15]} material={sssSkinMat}>
                <capsuleGeometry args={[0.0055, 0.020, 4, 6]} />
              </mesh>
              {[0.013, 0.004, -0.005, -0.014].map((fz, fIdx) => (
                <mesh key={fIdx} position={[0.003, -0.034, fz]} rotation={[0, 0, 0.18]} material={sssSkinMat}>
                  <capsuleGeometry args={[0.0048, fIdx === 1 || fIdx === 2 ? 0.026 : 0.020, 4, 6]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        <group ref={rightUpperArmRef} position={[0.160, 0.27, 0]}>
          <mesh position={[-0.01, 0.01, 0]} scale={[1.05, 1.0, 0.92]} material={coatMat}><sphereGeometry args={[0.054, 12, 10]} /></mesh>
          <mesh castShadow geometry={geos.upperArm} material={coatMat} />
          <mesh position={[0, -0.19, 0]} material={shirtMat}><cylinderGeometry args={[0.042, 0.040, 0.035, 12]} /></mesh>
          <group ref={rightForearmRef} position={[0, -0.19, 0]}>
            <mesh geometry={geos.forearm} material={sssSkinMat} />
            <group position={[0, -0.195, 0.005]}>
              <mesh scale={[0.42, 1.05, 0.82]} material={sssSkinMat}><sphereGeometry args={[0.032, 12, 10]} /></mesh>
              <mesh position={[-0.008, -0.006, 0.024]} rotation={[0.55, 0, -0.15]} material={sssSkinMat}>
                <capsuleGeometry args={[0.0055, 0.020, 4, 6]} />
              </mesh>
              {[0.013, 0.004, -0.005, -0.014].map((fz, fIdx) => (
                <mesh key={fIdx} position={[-0.003, -0.034, fz]} rotation={[0, 0, -0.18]} material={sssSkinMat}>
                  <capsuleGeometry args={[0.0048, fIdx === 1 || fIdx === 2 ? 0.026 : 0.020, 4, 6]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>

      <group ref={leftThighRef} position={[-0.080, -0.15, 0]}>
        <mesh castShadow geometry={geos.thigh} material={pantMat} />
        <group ref={leftShinRef} position={[0, -0.27, 0]}>
          <mesh castShadow geometry={geos.calfBoot} material={bootMat} />
          <mesh castShadow position={[0, -0.27, 0.032]} scale={[0.86, 0.72, 1.42]} material={bootMat}><sphereGeometry args={[0.055, 12, 10]} /></mesh>
        </group>
      </group>
      <group ref={rightThighRef} position={[0.080, -0.15, 0]}>
        <mesh castShadow geometry={geos.thigh} material={pantMat} />
        <group ref={rightShinRef} position={[0, -0.27, 0]}>
          <mesh castShadow geometry={geos.calfBoot} material={bootMat} />
          <mesh castShadow position={[0, -0.27, 0.032]} scale={[0.86, 0.72, 1.42]} material={bootMat}><sphereGeometry args={[0.055, 12, 10]} /></mesh>
        </group>
      </group>
    </group>
  );
}

export default function PlayerModel() {
  return <DigitalHumanCharacter />;
}
