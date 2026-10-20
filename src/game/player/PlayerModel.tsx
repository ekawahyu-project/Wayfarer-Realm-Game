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
  const capeRef = useRef<THREE.Mesh>(null);

  // Upper & lower limbs for natural knee and elbow bending
  const leftThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);

  const leftUpperArmRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightUpperArmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  const lanternMatRef = useRef<THREE.MeshStandardMaterial>(null);

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

    const targetBlend = isMoving ? (isRunning ? 1.25 : 0.82) : isSwimming ? 0.7 : 0.0;
    moveBlendRef.current = THREE.MathUtils.lerp(moveBlendRef.current, targetBlend, dt * 10);
    const m = moveBlendRef.current;

    const cycleSpeed = isSwimming ? 6.0 : isRunning ? 14.0 : 8.5;
    if (isMoving || isSwimming) {
      phaseRef.current += dt * cycleSpeed;
    } else {
      phaseRef.current = THREE.MathUtils.lerp(
        phaseRef.current,
        Math.round(phaseRef.current / Math.PI) * Math.PI,
        dt * 7
      );
    }

    const p = phaseRef.current;
    const sinP = Math.sin(p);
    const cosP = Math.cos(p);

    // 1. Root vertical bounce & swim pitch
    const bounce = isGrounded && !isSwimming ? Math.abs(sinP) * 0.075 * m : 0;
    const breath = Math.sin(t * 2.4) * 0.015;
    rootRef.current.position.y = isSwimming ? -0.32 + breath * 2 : bounce + breath;

    const targetPitch = isSwimming
      ? (isMoving ? 1.25 : 0.45)
      : !isGrounded
      ? 0.12
      : isMoving
      ? (isRunning ? 0.22 : 0.09)
      : 0;
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetPitch, dt * 9);
    rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, cosP * 0.04 * m, dt * 10);

    // 2. Torso counter-twist & head look stabilizer
    torsoRef.current.rotation.y = sinP * 0.14 * m;
    headRef.current.rotation.y = -sinP * 0.10 * m + (m < 0.05 ? Math.sin(t * 0.9) * 0.08 : 0);
    headRef.current.rotation.x = isSwimming ? -0.65 : -rootRef.current.rotation.x * 0.5 + Math.cos(t * 1.8) * 0.02;

    // 3. Articulated Legs (Thigh + Knee/Shin bending)
    if (leftThighRef.current && rightThighRef.current && leftShinRef.current && rightShinRef.current) {
      if (!isGrounded && !isSwimming) {
        // Mid-air jump pose
        leftThighRef.current.rotation.x = THREE.MathUtils.lerp(leftThighRef.current.rotation.x, -0.45, dt * 12);
        leftShinRef.current.rotation.x = THREE.MathUtils.lerp(leftShinRef.current.rotation.x, 0.75, dt * 12);
        rightThighRef.current.rotation.x = THREE.MathUtils.lerp(rightThighRef.current.rotation.x, 0.25, dt * 12);
        rightShinRef.current.rotation.x = THREE.MathUtils.lerp(rightShinRef.current.rotation.x, 0.45, dt * 12);
      } else {
        const leftSwing = sinP * 0.68 * m;
        const rightSwing = -sinP * 0.68 * m;
        leftThighRef.current.rotation.x = leftSwing;
        rightThighRef.current.rotation.x = rightSwing;

        // Knee only bends backward (positive X rotation) during leg lift
        const leftKnee = Math.max(0, -cosP) * 0.85 * m + (m * 0.08);
        const rightKnee = Math.max(0, cosP) * 0.85 * m + (m * 0.08);
        leftShinRef.current.rotation.x = leftKnee;
        rightShinRef.current.rotation.x = rightKnee;
      }
    }

    // 4. Articulated Arms (Shoulder + Forearm elbow bend)
    if (leftUpperArmRef.current && rightUpperArmRef.current && leftForearmRef.current && rightForearmRef.current) {
      if (isSwimming) {
        // Breaststroke arm motion
        leftUpperArmRef.current.rotation.x = -0.9 + sinP * 0.7;
        leftUpperArmRef.current.rotation.z = 0.35 + Math.max(0, cosP) * 0.5;
        rightUpperArmRef.current.rotation.x = -0.9 + sinP * 0.7;
        rightUpperArmRef.current.rotation.z = -0.35 - Math.max(0, cosP) * 0.5;
        leftForearmRef.current.rotation.x = -0.4;
        rightForearmRef.current.rotation.x = -0.4;
      } else if (!isGrounded) {
        leftUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(leftUpperArmRef.current.rotation.z, 0.55, dt * 10);
        rightUpperArmRef.current.rotation.z = THREE.MathUtils.lerp(rightUpperArmRef.current.rotation.z, -0.55, dt * 10);
      } else {
        const armSwing = -sinP * 0.58 * m;
        leftUpperArmRef.current.rotation.x = armSwing;
        rightUpperArmRef.current.rotation.x = -armSwing;
        leftUpperArmRef.current.rotation.z = 0.08 + Math.sin(t * 2.0) * 0.02;
        rightUpperArmRef.current.rotation.z = -0.08 - Math.sin(t * 2.0) * 0.02;

        // Elbows bend naturally forward, especially when running
        const runElbow = isRunning ? -0.65 : -0.22;
        leftForearmRef.current.rotation.x = runElbow * Math.min(1, m + 0.2) + Math.min(0, armSwing * 0.4);
        rightForearmRef.current.rotation.x = runElbow * Math.min(1, m + 0.2) + Math.min(0, -armSwing * 0.4);
      }
    }

    // 5. Flowing Traveler Cape
    if (capeRef.current) {
      const targetCapeAngle = 0.16 + m * 0.48 + Math.sin(t * 9.0) * (0.04 + m * 0.08);
      capeRef.current.rotation.x = THREE.MathUtils.lerp(capeRef.current.rotation.x, targetCapeAngle, dt * 10);
    }

    // 6. Waist Lantern auto-glow at dusk/night
    if (lanternMatRef.current) {
      lanternMatRef.current.emissiveIntensity = globalUniforms.uNightFactor.value * 2.8;
    }
  });

  return (
    <group ref={rootRef}>
      {/* TORSO & UPPER BODY */}
      <group ref={torsoRef} position={[0, 0.02, 0]}>
        {/* Tunic Coat */}
        <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.17, 0.23, 0.54, 12]} />
          <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
        </mesh>
        {/* Leather Belt & Gold Buckle */}
        <mesh castShadow position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.205, 0.21, 0.08, 12]} />
          <meshStandardMaterial color="#451a03" roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, -0.08, 0.20]}>
          <boxGeometry args={[0.08, 0.08, 0.03]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Warm Red/Amber Traveler Scarf */}
        <mesh castShadow position={[0, 0.31, 0]}>
          <torusGeometry args={[0.15, 0.055, 8, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#dc2626" roughness={0.7} />
        </mesh>
        {/* Flowing Cape */}
        <mesh ref={capeRef} castShadow position={[0, 0.28, -0.15]}>
          <boxGeometry args={[0.38, 0.68, 0.03]} />
          <meshStandardMaterial color="#991b1b" roughness={0.85} />
        </mesh>
        {/* Explorer Backpack & Bedroll */}
        <group position={[0, 0.12, -0.22]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.28, 0.34, 0.16]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.21, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.32, 10]} />
            <meshStandardMaterial color="#d97706" roughness={0.8} />
          </mesh>
          {/* Waist Lantern (glows automatically at night) */}
          <mesh castShadow position={[0.17, -0.18, 0.08]}>
            <cylinderGeometry args={[0.045, 0.035, 0.12, 8]} />
            <meshStandardMaterial
              ref={lanternMatRef}
              color="#fef08a"
              emissive="#f59e0b"
              emissiveIntensity={0}
            />
          </mesh>
        </group>

        {/* HEAD, HAIR & ADVENTURER HAT */}
        <group ref={headRef} position={[0, 0.48, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.165, 16, 16]} />
            <meshStandardMaterial color="#fde68a" roughness={0.55} />
          </mesh>
          {/* Eyes */}
          <mesh position={[-0.055, 0.02, 0.145]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          <mesh position={[0.055, 0.02, 0.145]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Stylized Hair Back */}
          <mesh castShadow position={[0, -0.02, -0.06]}>
            <sphereGeometry args={[0.16, 12, 12]} />
            <meshStandardMaterial color="#3b2314" roughness={0.8} />
          </mesh>
          {/* Explorer Hat Brim & Crown */}
          <mesh castShadow position={[0, 0.12, 0]} rotation={[-0.12, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.025, 16]} />
            <meshStandardMaterial color="#78350f" roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.22, -0.02]} rotation={[-0.18, 0, 0]}>
            <coneGeometry args={[0.17, 0.24, 12]} />
            <meshStandardMaterial color="#92400e" roughness={0.85} />
          </mesh>
        </group>

        {/* LEFT ARM (Shoulder -> Upper Arm -> Elbow -> Forearm -> Hand) */}
        <group ref={leftUpperArmRef} position={[-0.24, 0.24, 0]}>
          <mesh castShadow position={[0, -0.11, 0]}>
            <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
          </mesh>
          <group ref={leftForearmRef} position={[0, -0.22, 0]}>
            <mesh castShadow position={[0, -0.10, 0]}>
              <capsuleGeometry args={[0.048, 0.14, 6, 10]} />
              <meshStandardMaterial color="#fde68a" roughness={0.6} />
            </mesh>
            <mesh castShadow position={[0, -0.21, 0]}>
              <sphereGeometry args={[0.052, 8, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
          </group>
        </group>

        {/* RIGHT ARM */}
        <group ref={rightUpperArmRef} position={[0.24, 0.24, 0]}>
          <mesh castShadow position={[0, -0.11, 0]}>
            <capsuleGeometry args={[0.055, 0.16, 6, 10]} />
            <meshStandardMaterial color="#1e3a5f" roughness={0.75} />
          </mesh>
          <group ref={rightForearmRef} position={[0, -0.22, 0]}>
            <mesh castShadow position={[0, -0.10, 0]}>
              <capsuleGeometry args={[0.048, 0.14, 6, 10]} />
              <meshStandardMaterial color="#fde68a" roughness={0.6} />
            </mesh>
            <mesh castShadow position={[0, -0.21, 0]}>
              <sphereGeometry args={[0.052, 8, 8]} />
              <meshStandardMaterial color="#78350f" roughness={0.8} />
            </mesh>
          </group>
        </group>
      </group>

      {/* LEFT LEG (Hip -> Thigh -> Knee -> Shin -> Boot) */}
      <group ref={leftThighRef} position={[-0.10, -0.22, 0]}>
        <mesh castShadow position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.072, 0.22, 6, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        <group ref={leftShinRef} position={[0, -0.34, 0]}>
          <mesh castShadow position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.062, 0.20, 6, 10]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.30, 0.04]}>
            <boxGeometry args={[0.11, 0.09, 0.20]} />
            <meshStandardMaterial color="#291202" roughness={0.85} />
          </mesh>
        </group>
      </group>

      {/* RIGHT LEG */}
      <group ref={rightThighRef} position={[0.10, -0.22, 0]}>
        <mesh castShadow position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.072, 0.22, 6, 10]} />
          <meshStandardMaterial color="#334155" roughness={0.85} />
        </mesh>
        <group ref={rightShinRef} position={[0, -0.34, 0]}>
          <mesh castShadow position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.062, 0.20, 6, 10]} />
            <meshStandardMaterial color="#451a03" roughness={0.8} />
          </mesh>
          <mesh castShadow position={[0, -0.30, 0.04]}>
            <boxGeometry args={[0.11, 0.09, 0.20]} />
            <meshStandardMaterial color="#291202" roughness={0.85} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
