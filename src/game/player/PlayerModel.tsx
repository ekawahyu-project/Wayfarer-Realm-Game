"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";

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

export function DigitalHumanCharacter({
  coatColor = "#1e3a8a",
  skirtColor = "#172554",
  capeColor = "#b91c1c",
  hairColor = "#2e150b",
  isNpc = false,
  npcWalkSpeed = 0,
  npcSeed = 0,
  hasStaff = true,
}: DigitalHumanProps) {
  const textures = useMemo(() => getWorldTextures(), []);
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const leftEyelidRef = useRef<THREE.Mesh>(null);
  const rightEyelidRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const ponytailRef = useRef<THREE.Group>(null);
  const capeSeg1Ref = useRef<THREE.Group>(null);
  const capeSeg2Ref = useRef<THREE.Mesh>(null);

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

  // Subsurface Scattering (SSS) Living Skin Material
  const sssSkinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffdfc4",
        emissive: "#fca5a5",
        emissiveIntensity: 0.08, // Warm dermis subsurface blood glow
        roughness: 0.38,
        metalness: 0.02,
        clearcoat: 0.18, // Natural skin lipid sheen
        clearcoatRoughness: 0.45,
        sheen: 0.35,
        sheenColor: new THREE.Color("#fda4af"),
      }),
    []
  );

  // Corneal Gloss Eye Shader Material
  const eyeMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: textures.eyeIris,
        roughness: 0.05,
        clearcoat: 1.0, // Wet cornea reflection
        clearcoatRoughness: 0.02,
      }),
    [textures.eyeIris]
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime + npcSeed * 7.3;
    if (!rootRef.current || !torsoRef.current || !headRef.current) return;

    const isMoving = isNpc ? npcWalkSpeed > 0.05 : playerFrameState.isMoving && !playerFrameState.isInBoat;
    const isRunning = isNpc ? false : playerFrameState.isRunning;
    const isGrounded = isNpc ? true : playerFrameState.isGrounded;
    const isSwimming = isNpc ? false : playerFrameState.isSwimming && !playerFrameState.isInBoat;

    const targetBlend = isMoving ? (isRunning ? 1.25 : 0.82) : isSwimming ? 0.75 : 0.0;
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

    const bounce = isGrounded && !isSwimming ? Math.abs(sinP) * 0.048 * m : 0;
    const breath = Math.sin(t * 2.6) * 0.01;
    rootRef.current.position.y = isSwimming ? -0.35 + breath * 2 : bounce + breath;

    const targetPitch = isSwimming ? (isMoving ? 1.2 : 0.45) : !isGrounded ? 0.14 : isMoving ? (isRunning ? 0.16 : 0.06) : 0;
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetPitch, dt * 10);
    rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, cosP * 0.03 * m, dt * 10);

    torsoRef.current.rotation.y = sinP * 0.14 * m;
    headRef.current.rotation.y = -sinP * 0.10 * m + (m < 0.05 ? Math.sin(t * 0.9) * 0.09 : 0);
    headRef.current.rotation.x = isSwimming ? -0.6 : -rootRef.current.rotation.x * 0.45 + Math.sin(t * 1.7) * 0.02;

    // Digital Human Facial Capture: Natural Eyelid Blinking, Saccades & Micro-Expressions!
    const blinkCycle = (t * 0.28) % 1.0;
    const isBlinking = blinkCycle > 0.94;
    const blinkScaleY = isBlinking ? 0.95 : 0.12;
    if (leftEyelidRef.current && rightEyelidRef.current) {
      leftEyelidRef.current.scale.y = THREE.MathUtils.lerp(leftEyelidRef.current.scale.y, blinkScaleY, dt * 35);
      rightEyelidRef.current.scale.y = leftEyelidRef.current.scale.y;
    }
    // Eye Saccades (subtle living eye gaze)
    const gazeX = Math.sin(t * 1.4) * 0.08;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.rotation.y = gazeX;
      rightEyeRef.current.rotation.y = gazeX;
    }
    // Micro-expression brow & breathing mouth
    if (leftBrowRef.current && rightBrowRef.current && mouthRef.current) {
      const browLift = Math.sin(t * 1.2) * 0.006;
      leftBrowRef.current.position.y = 0.062 + browLift;
      rightBrowRef.current.position.y = 0.062 + browLift;
      mouthRef.current.scale.x = 1.0 + Math.sin(t * 2.6) * 0.08;
    }

    // Multi-Strand Hair & Multi-Segment Cloth Physics Simulation!
    if (ponytailRef.current) {
      ponytailRef.current.rotation.x = 0.24 + m * 0.42 + Math.sin(t * 9.5) * (0.05 + m * 0.12);
      ponytailRef.current.rotation.z = cosP * 0.14 * m;
    }
    if (capeSeg1Ref.current && capeSeg2Ref.current) {
      const wind = globalUniforms.uWindStrength.value;
      const wave1 = 0.16 + m * 0.44 + Math.sin(t * 8.0) * (0.04 * wind + m * 0.08);
      const wave2 = 0.12 + m * 0.28 + Math.cos(t * 8.0 - 0.8) * (0.06 * wind + m * 0.14);
      capeSeg1Ref.current.rotation.x = THREE.MathUtils.lerp(capeSeg1Ref.current.rotation.x, wave1, dt * 12);
      capeSeg2Ref.current.rotation.x = THREE.MathUtils.lerp(capeSeg2Ref.current.rotation.x, wave2, dt * 12);
    }

    // Articulated Legs & Knees
    if (leftThighRef.current && rightThighRef.current && leftShinRef.current && rightShinRef.current) {
      if (!isGrounded && !isSwimming) {
        leftThighRef.current.rotation.x = THREE.MathUtils.lerp(leftThighRef.current.rotation.x, -0.45, dt * 12);
        leftShinRef.current.rotation.x = THREE.MathUtils.lerp(leftShinRef.current.rotation.x, 0.75, dt * 12);
        rightThighRef.current.rotation.x = THREE.MathUtils.lerp(rightThighRef.current.rotation.x, 0.25, dt * 12);
        rightShinRef.current.rotation.x = THREE.MathUtils.lerp(rightShinRef.current.rotation.x, 0.45, dt * 12);
      } else {
        leftThighRef.current.rotation.x = sinP * 0.68 * m;
        rightThighRef.current.rotation.x = -sinP * 0.68 * m;
        leftShinRef.current.rotation.x = Math.max(0, -cosP) * 0.82 * m + m * 0.06;
        rightShinRef.current.rotation.x = Math.max(0, cosP) * 0.82 * m + m * 0.06;
      }
    }

    // Articulated Arms & Elbows
    if (leftUpperArmRef.current && rightUpperArmRef.current && leftForearmRef.current && rightForearmRef.current) {
      if (isSwimming) {
        leftUpperArmRef.current.rotation.x = -0.9 + sinP * 0.7;
        leftUpperArmRef.current.rotation.z = 0.35 + Math.max(0, cosP) * 0.5;
        rightUpperArmRef.current.rotation.x = -0.9 + sinP * 0.7;
        rightUpperArmRef.current.rotation.z = -0.35 - Math.max(0, cosP) * 0.5;
        leftForearmRef.current.rotation.x = -0.4;
        rightForearmRef.current.rotation.x = -0.4;
      } else {
        const armSwing = -sinP * 0.58 * m;
        leftUpperArmRef.current.rotation.x = armSwing;
        rightUpperArmRef.current.rotation.x = -armSwing;
        leftUpperArmRef.current.rotation.z = 0.09;
        rightUpperArmRef.current.rotation.z = -0.09;
        const runElbow = isRunning ? -0.65 : -0.22;
        leftForearmRef.current.rotation.x = runElbow * Math.min(1, m + 0.2);
        rightForearmRef.current.rotation.x = runElbow * Math.min(1, m + 0.2);
      }
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={torsoRef} position={[0, 0.02, 0]}>
        {/* Tailored Jacket & Pleated Tunic with Cloth Sheen */}
        <mesh castShadow receiveShadow position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.145, 0.175, 0.44, 16]} />
          <meshPhysicalMaterial color={coatColor} roughness={0.62} sheen={0.45} sheenColor="#ffffff" />
        </mesh>
        <mesh castShadow receiveShadow position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.165, 0.27, 0.30, 18]} />
          <meshPhysicalMaterial color={skirtColor} roughness={0.65} sheen={0.4} />
        </mesh>
        <mesh castShadow position={[0, -0.01, 0]}>
          <cylinderGeometry args={[0.172, 0.176, 0.065, 16]} />
          <meshStandardMaterial color="#d97706" metalness={0.65} roughness={0.25} />
        </mesh>
        <mesh castShadow position={[0, 0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.145, 0.05, 10, 18]} />
          <meshPhysicalMaterial color={capeColor} roughness={0.6} sheen={0.5} />
        </mesh>

        {/* Multi-Segment Cloth Physics Cape */}
        <group ref={capeSeg1Ref} position={[0, 0.29, -0.14]}>
          <mesh castShadow position={[0, -0.18, 0]}>
            <boxGeometry args={[0.36, 0.36, 0.022]} />
            <meshPhysicalMaterial color={capeColor} roughness={0.7} sheen={0.5} />
          </mesh>
          <mesh ref={capeSeg2Ref} castShadow position={[0, -0.35, 0]}>
            <boxGeometry args={[0.40, 0.36, 0.020]} />
            <meshPhysicalMaterial color={capeColor} roughness={0.7} sheen={0.5} />
          </mesh>
        </group>

        {hasStaff && (
          <group position={[0.06, 0.15, -0.18]} rotation={[0, 0, -0.38]}>
            <mesh castShadow><cylinderGeometry args={[0.022, 0.026, 1.35, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
            <mesh position={[0, 0.74, 0]}>
              <octahedronGeometry args={[0.095, 0]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.2} />
            </mesh>
          </group>
        )}

        {/* DIGITAL HUMAN HEAD: SSS Skin, Soulful Iris Eyes, Eyelids, Eyelashes, Nose, Lips & Multi-Strand Hair */}
        <group ref={headRef} position={[0, 0.48, 0]}>
          <mesh castShadow receiveShadow material={sssSkinMat}>
            <sphereGeometry args={[0.168, 24, 24]} />
          </mesh>
          {/* Sculpted Nose & Rosy Cheeks */}
          <mesh position={[0, -0.01, 0.166]} material={sssSkinMat}>
            <coneGeometry args={[0.022, 0.045, 8]} />
          </mesh>
          {/* Expressive Breathing Lips */}
          <mesh ref={mouthRef} position={[0, -0.065, 0.155]}>
            <boxGeometry args={[0.048, 0.014, 0.015]} />
            <meshStandardMaterial color="#e11d48" roughness={0.4} />
          </mesh>

          {/* Left & Right Eyes with Iris Shader, Blinking Eyelids & Curved Eyelashes */}
          {[-0.058, 0.058].map((ex, idx) => (
            <group key={idx} position={[ex, 0.015, 0.144]}>
              <mesh ref={idx === 0 ? leftEyeRef : rightEyeRef} rotation={[0, -Math.PI / 2, 0]} material={eyeMat}>
                <sphereGeometry args={[0.032, 16, 16]} />
              </mesh>
              {/* Blinking Upper Eyelid */}
              <mesh ref={idx === 0 ? leftEyelidRef : rightEyelidRef} position={[0, 0.018, 0.004]} scale={[1, 0.12, 1]} material={sssSkinMat}>
                <sphereGeometry args={[0.034, 12, 10]} />
              </mesh>
              {/* Individual Curved Eyelash Strands */}
              {[-0.016, 0, 0.016].map((lx, lIdx) => (
                <mesh key={lIdx} position={[lx, 0.028, 0.022]} rotation={[-0.35, 0, (idx === 0 ? 1 : -1) * 0.15]}>
                  <boxGeometry args={[0.006, 0.016, 0.012]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
              ))}
              {/* Expressive Eyebrow */}
              <mesh ref={idx === 0 ? leftBrowRef : rightBrowRef} position={[0, 0.062, 0.012]} rotation={[0, 0, idx === 0 ? 0.08 : -0.08]}>
                <boxGeometry args={[0.052, 0.011, 0.012]} />
                <meshStandardMaterial color={hairColor} />
              </mesh>
            </group>
          ))}

          {/* Multi-Strand Layered Hair Crown, Front Fringe & Side Locks */}
          <mesh castShadow position={[0, 0.045, -0.018]}>
            <sphereGeometry args={[0.180, 20, 20]} />
            <meshPhysicalMaterial color={hairColor} roughness={0.45} clearcoat={0.25} sheen={0.6} sheenColor="#fbbf24" />
          </mesh>
          {[-0.09, -0.045, 0, 0.045, 0.09].map((fx, fIdx) => (
            <mesh key={fIdx} castShadow position={[fx, 0.085, 0.135]} rotation={[0.35, 0, -fx * 1.5]}>
              <coneGeometry args={[0.032, 0.12, 8]} />
              <meshPhysicalMaterial color={hairColor} roughness={0.45} sheen={0.6} />
            </mesh>
          ))}
          {[-0.135, 0.135].map((sx, sIdx) => (
            <mesh key={sIdx} castShadow position={[sx, -0.035, 0.085]} rotation={[0, 0, sx < 0 ? 0.18 : -0.18]}>
              <capsuleGeometry args={[0.034, 0.16, 8, 10]} />
              <meshPhysicalMaterial color={hairColor} roughness={0.45} sheen={0.6} />
            </mesh>
          ))}
          <group ref={ponytailRef} position={[0, 0.02, -0.17]}>
            <mesh castShadow position={[0, -0.16, -0.04]}>
              <coneGeometry args={[0.075, 0.38, 12]} />
              <meshPhysicalMaterial color={hairColor} roughness={0.45} sheen={0.6} />
            </mesh>
          </group>
        </group>

        {/* Seamless Arms with SSS Skin Forearms & Hands */}
        <group ref={leftUpperArmRef} position={[-0.21, 0.26, 0]}>
          <mesh castShadow position={[0, -0.10, 0]}><capsuleGeometry args={[0.052, 0.18, 8, 10]} /><meshPhysicalMaterial color={coatColor} roughness={0.62} /></mesh>
          <group ref={leftForearmRef} position={[0, -0.20, 0]}>
            <mesh castShadow position={[0, -0.10, 0]} material={sssSkinMat}><capsuleGeometry args={[0.044, 0.16, 8, 10]} /></mesh>
          </group>
        </group>
        <group ref={rightUpperArmRef} position={[0.21, 0.26, 0]}>
          <mesh castShadow position={[0, -0.10, 0]}><capsuleGeometry args={[0.052, 0.18, 8, 10]} /><meshPhysicalMaterial color={coatColor} roughness={0.62} /></mesh>
          <group ref={rightForearmRef} position={[0, -0.20, 0]}>
            <mesh castShadow position={[0, -0.10, 0]} material={sssSkinMat}><capsuleGeometry args={[0.044, 0.16, 8, 10]} /></mesh>
          </group>
        </group>
      </group>

      {/* Seamless Legs & Boots */}
      <group ref={leftThighRef} position={[-0.095, -0.18, 0]}>
        <mesh castShadow position={[0, -0.14, 0]}><capsuleGeometry args={[0.064, 0.24, 8, 10]} /><meshStandardMaterial color="#334155" /></mesh>
        <group ref={leftShinRef} position={[0, -0.28, 0]}>
          <mesh castShadow position={[0, -0.14, 0]}><capsuleGeometry args={[0.058, 0.24, 8, 10]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, -0.26, 0.035]}><boxGeometry args={[0.105, 0.09, 0.20]} /><meshStandardMaterial color="#291202" /></mesh>
        </group>
      </group>
      <group ref={rightThighRef} position={[0.095, -0.18, 0]}>
        <mesh castShadow position={[0, -0.14, 0]}><capsuleGeometry args={[0.064, 0.24, 8, 10]} /><meshStandardMaterial color="#334155" /></mesh>
        <group ref={rightShinRef} position={[0, -0.28, 0]}>
          <mesh castShadow position={[0, -0.14, 0]}><capsuleGeometry args={[0.058, 0.24, 8, 10]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, -0.26, 0.035]}><boxGeometry args={[0.105, 0.09, 0.20]} /><meshStandardMaterial color="#291202" /></mesh>
        </group>
      </group>
    </group>
  );
}

export default function PlayerModel() {
  return <DigitalHumanCharacter />;
}
