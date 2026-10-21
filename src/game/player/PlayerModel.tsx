"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { globalUniforms } from "@/game/systems/globalUniforms";

export default function PlayerModel() {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const ponytailRef = useRef<THREE.Group>(null);
  const capeRef = useRef<THREE.Mesh>(null);

  const leftThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);

  const leftUpperArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);
  const crystalMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const phaseRef = useRef(0);
  const moveBlendRef = useRef(0);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    if (!rootRef.current || !torsoRef.current || !headRef.current) return;

    const isMoving = playerFrameState.isMoving && !playerFrameState.isInBoat;
    const isRunning = playerFrameState.isRunning;
    const isGrounded = playerFrameState.isGrounded;
    const isSwimming = playerFrameState.isSwimming && !playerFrameState.isInBoat;

    const targetBlend = isMoving ? (isRunning ? 1.3 : 0.88) : isSwimming ? 0.75 : 0.0;
    moveBlendRef.current = THREE.MathUtils.lerp(moveBlendRef.current, targetBlend, dt * 11);
    const m = moveBlendRef.current;

    const cycleSpeed = isSwimming ? 6.5 : isRunning ? 14.5 : 9.0;
    if (isMoving || isSwimming) {
      phaseRef.current += dt * cycleSpeed;
    } else {
      phaseRef.current = THREE.MathUtils.lerp(phaseRef.current, Math.round(phaseRef.current / Math.PI) * Math.PI, dt * 8);
    }

    const p = phaseRef.current;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);

    const bounce = isGrounded && !isSwimming ? Math.abs(sinP) * 0.08 * m : 0;
    const breath = Math.sin(t * 2.5) * 0.016;
    rootRef.current.position.y = isSwimming ? -0.35 + breath * 2 : bounce + breath;

    const targetPitch = isSwimming ? (isMoving ? 1.2 : 0.45) : !isGrounded ? 0.14 : isMoving ? (isRunning ? 0.20 : 0.08) : 0;
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetPitch, dt * 10);
    rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, cosP * 0.045 * m, dt * 10);

    torsoRef.current.rotation.y = sinP * 0.16 * m;
    headRef.current.rotation.y = -sinP * 0.12 * m + (m < 0.05 ? Math.sin(t * 1.1) * 0.09 : 0);
    headRef.current.rotation.x = isSwimming ? -0.6 : -rootRef.current.rotation.x * 0.45;

    if (ponytailRef.current) {
      ponytailRef.current.rotation.x = 0.25 + m * 0.45 + Math.sin(t * 10.0) * (0.06 + m * 0.12);
      ponytailRef.current.rotation.z = cosP * 0.15 * m;
    }

    if (leftThighRef.current && rightThighRef.current && leftShinRef.current && rightShinRef.current) {
      if (!isGrounded && !isSwimming) {
        leftThighRef.current.rotation.x = THREE.MathUtils.lerp(leftThighRef.current.rotation.x, -0.5, dt * 12);
        leftShinRef.current.rotation.x = THREE.MathUtils.lerp(leftShinRef.current.rotation.x, 0.8, dt * 12);
        rightThighRef.current.rotation.x = THREE.MathUtils.lerp(rightThighRef.current.rotation.x, 0.3, dt * 12);
        rightShinRef.current.rotation.x = THREE.MathUtils.lerp(rightShinRef.current.rotation.x, 0.5, dt * 12);
      } else {
        leftThighRef.current.rotation.x = sinP * 0.72 * m;
        rightThighRef.current.rotation.x = -sinP * 0.72 * m;
        leftShinRef.current.rotation.x = Math.max(0, -cosP) * 0.88 * m + m * 0.08;
        rightShinRef.current.rotation.x = Math.max(0, cosP) * 0.88 * m + m * 0.08;
      }
    }

    if (leftUpperArmRef.current && rightUpperArmRef.current && leftForearmRef.current && rightForearmRef.current) {
      if (isSwimming) {
        leftUpperArmRef.current.rotation.x = -0.9 + sinP * 0.7;
        leftUpperArmRef.current.rotation.z = 0.35 + Math.max(0, cosP) * 0.5;
        rightUpperArmRef.current.rotation.x = -0.9 + sinP * 0.7;
        rightUpperArmRef.current.rotation.z = -0.35 - Math.max(0, cosP) * 0.5;
        leftForearmRef.current.rotation.x = -0.4;
        rightForearmRef.current.rotation.x = -0.4;
      } else {
        const armSwing = -sinP * 0.62 * m;
        leftUpperArmRef.current.rotation.x = armSwing;
        rightUpperArmRef.current.rotation.x = -armSwing;
        leftUpperArmRef.current.rotation.z = 0.10;
        rightUpperArmRef.current.rotation.z = -0.10;
        const runElbow = isRunning ? -0.7 : -0.25;
        leftForearmRef.current.rotation.x = runElbow * Math.min(1, m + 0.2);
        rightForearmRef.current.rotation.x = runElbow * Math.min(1, m + 0.2);
      }
    }

    if (capeRef.current) {
      const targetCapeAngle = 0.18 + m * 0.52 + Math.sin(t * 9.5) * (0.05 + m * 0.1);
      capeRef.current.rotation.x = THREE.MathUtils.lerp(capeRef.current.rotation.x, targetCapeAngle, dt * 10);
    }

    if (crystalMatRef.current) {
      crystalMatRef.current.emissiveIntensity = 1.4 + globalUniforms.uNightFactor.value * 2.5;
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={torsoRef} position={[0, 0.04, 0]}>
        {/* Stylized Adventurer Jacket & Pleated Tunic Skirt */}
        <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.14, 0.17, 0.42, 14]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.65} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.16, 0.26, 0.28, 16]} />
          <meshStandardMaterial color="#172554" roughness={0.7} />
        </mesh>
        {/* Gold Waist Belt */}
        <mesh castShadow position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.168, 0.172, 0.06, 14]} />
          <meshStandardMaterial color="#d97706" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Crimson Traveler Collar & Flowing Cloak */}
        <mesh castShadow position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.14, 0.048, 10, 18]} />
          <meshStandardMaterial color="#dc2626" roughness={0.65} />
        </mesh>
        <mesh ref={capeRef} castShadow position={[0, 0.28, -0.14]}>
          <boxGeometry args={[0.36, 0.65, 0.025]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.8} />
        </mesh>

        {/* Magic Wayfarer Staff & glowing Sky-Crystal on Back */}
        <group position={[0.06, 0.15, -0.18]} rotation={[0, 0, -0.38]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.022, 0.026, 1.35, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.74, 0]}>
            <octahedronGeometry args={[0.095, 0]} />
            <meshStandardMaterial ref={crystalMatRef} color="#38bdf8" emissive="#0284c7" emissiveIntensity={1.8} />
          </mesh>
        </group>

        {/* Anime-Proportioned Head, Hair & Ponytail */}
        <group ref={headRef} position={[0, 0.48, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.17, 20, 20]} />
            <meshStandardMaterial color="#ffedd5" roughness={0.45} />
          </mesh>
          {/* Expressive Eyes */}
          <mesh position={[-0.058, 0.01, 0.15]}><sphereGeometry args={[0.026, 10, 10]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
          <mesh position={[0.058, 0.01, 0.15]}><sphereGeometry args={[0.026, 10, 10]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
          {/* Stylized Dark-Brown/Auburn Hair Dome & Side Bangs */}
          <mesh castShadow position={[0, 0.04, -0.02]}>
            <sphereGeometry args={[0.182, 18, 18]} />
            <meshStandardMaterial color="#3b1d11" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[-0.13, -0.04, 0.09]} rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.038, 0.14, 6, 8]} />
            <meshStandardMaterial color="#3b1d11" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[0.13, -0.04, 0.09]} rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.038, 0.14, 6, 8]} />
            <meshStandardMaterial color="#3b1d11" roughness={0.7} />
          </mesh>
          {/* Animated Flowing Ponytail */}
          <group ref={ponytailRef} position={[0, 0.02, -0.17]}>
            <mesh castShadow position={[0, -0.16, -0.04]}>
              <coneGeometry args={[0.075, 0.38, 10]} />
              <meshStandardMaterial color="#3b1d11" roughness={0.7} />
            </mesh>
          </group>
        </group>

        {/* Arms */}
        <group ref={leftUpperArmRef} position={[-0.21, 0.24, 0]}>
          <mesh castShadow position={[0, -0.10, 0]}><capsuleGeometry args={[0.046, 0.15, 6, 10]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
          <group ref={leftForearmRef} position={[0, -0.21, 0]}>
            <mesh castShadow position={[0, -0.09, 0]}><capsuleGeometry args={[0.040, 0.13, 6, 10]} /><meshStandardMaterial color="#ffedd5" /></mesh>
          </group>
        </group>
        <group ref={rightUpperArmRef} position={[0.21, 0.24, 0]}>
          <mesh castShadow position={[0, -0.10, 0]}><capsuleGeometry args={[0.046, 0.15, 6, 10]} /><meshStandardMaterial color="#1e3a8a" /></mesh>
          <group ref={rightForearmRef} position={[0, -0.21, 0]}>
            <mesh castShadow position={[0, -0.09, 0]}><capsuleGeometry args={[0.040, 0.13, 6, 10]} /><meshStandardMaterial color="#ffedd5" /></mesh>
          </group>
        </group>
      </group>

      {/* Legs & Tall Adventurer Boots */}
      <group ref={leftThighRef} position={[-0.095, -0.20, 0]}>
        <mesh castShadow position={[0, -0.15, 0]}><capsuleGeometry args={[0.058, 0.20, 6, 10]} /><meshStandardMaterial color="#ffedd5" /></mesh>
        <group ref={leftShinRef} position={[0, -0.33, 0]}>
          <mesh castShadow position={[0, -0.15, 0]}><capsuleGeometry args={[0.054, 0.20, 6, 10]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, -0.30, 0.035]}><boxGeometry args={[0.095, 0.085, 0.18]} /><meshStandardMaterial color="#291202" /></mesh>
        </group>
      </group>
      <group ref={rightThighRef} position={[0.095, -0.20, 0]}>
        <mesh castShadow position={[0, -0.15, 0]}><capsuleGeometry args={[0.058, 0.20, 6, 10]} /><meshStandardMaterial color="#ffedd5" /></mesh>
        <group ref={rightShinRef} position={[0, -0.33, 0]}>
          <mesh castShadow position={[0, -0.15, 0]}><capsuleGeometry args={[0.054, 0.20, 6, 10]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, -0.30, 0.035]}><boxGeometry args={[0.095, 0.085, 0.18]} /><meshStandardMaterial color="#291202" /></mesh>
        </group>
      </group>
    </group>
  );
}
