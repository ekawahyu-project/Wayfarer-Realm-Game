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

  // Smooth Spline-Interpolated Disney/Pixar Torso (28 smooth curve subdivisions — ZERO boxy/Lego facets!)
  const torsoCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.138, -0.16),
    new THREE.Vector2(0.126, -0.08),
    new THREE.Vector2(0.118, 0.02),
    new THREE.Vector2(0.144, 0.16),
    new THREE.Vector2(0.154, 0.26),
    new THREE.Vector2(0.122, 0.33),
    new THREE.Vector2(0.060, 0.36),
  ]);
  const torsoTunic = new THREE.LatheGeometry(torsoCurve.getPoints(28), 24);
  torsoTunic.scale(1.12, 1.0, 0.78);
  torsoTunic.computeVertexNormals();

  const thighCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.052, -0.27),
    new THREE.Vector2(0.065, -0.15),
    new THREE.Vector2(0.075, -0.04),
    new THREE.Vector2(0.070, 0.05),
  ]);
  const thigh = new THREE.LatheGeometry(thighCurve.getPoints(18), 16);
  thigh.computeVertexNormals();

  const calfCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.046, -0.26),
    new THREE.Vector2(0.043, -0.18),
    new THREE.Vector2(0.058, -0.08),
    new THREE.Vector2(0.051, 0.04),
  ]);
  const calfBoot = new THREE.LatheGeometry(calfCurve.getPoints(18), 16);
  calfBoot.computeVertexNormals();

  const upperArmCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.040, -0.19),
    new THREE.Vector2(0.048, -0.09),
    new THREE.Vector2(0.053, 0.04),
  ]);
  const upperArm = new THREE.LatheGeometry(upperArmCurve.getPoints(14), 14);
  upperArm.computeVertexNormals();

  const forearmCurve = new THREE.SplineCurve([
    new THREE.Vector2(0.030, -0.17),
    new THREE.Vector2(0.039, -0.08),
    new THREE.Vector2(0.041, 0.03),
  ]);
  const forearm = new THREE.LatheGeometry(forearmCurve.getPoints(14), 14);
  forearm.computeVertexNormals();

  sharedPixarGeos = { torsoTunic, thigh, calfBoot, upperArm, forearm };
  return sharedPixarGeos;
}

export function DigitalHumanCharacter({
  coatColor = "#254e7a",
  skirtColor = "#1e293b",
  hairColor = "#3b2214",
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

  const pixarSkinMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#ffdfc4", emissive: "#f43f5e", emissiveIntensity: 0.05, roughness: 0.42 }),
    []
  );
  const blushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fda4af", roughness: 0.5 }), []);
  const coatMat = useMemo(() => new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.52 }), [coatColor]);
  const collarMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef3c7", roughness: 0.58 }), []);
  const pantMat = useMemo(() => new THREE.MeshStandardMaterial({ color: skirtColor, roughness: 0.68 }), [skirtColor]);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.40 }), [hairColor]);
  const leatherMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5c2d0c", roughness: 0.62 }), []);
  const bootMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b1d08", roughness: 0.65 }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.75, roughness: 0.25 }), []);
  const scleraMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ffffff" }), []);
  const irisMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#1d4ed8" }), []);
  const pupilMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#0f172a" }), []);

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

    const bounce = isGrounded && !isSwimming ? Math.abs(sinP) * 0.044 * m : 0;
    const breath = Math.sin(t * 2.6) * 0.007;
    const ridingY = !isNpc && playerFrameState.mountedHorseIndex !== -1 ? 0.34 : 0;
    const ridingZ = !isNpc && playerFrameState.mountedHorseIndex !== -1 ? -0.08 : 0;
    rootRef.current.position.y = isSwimming ? -0.35 + breath * 2 : ridingY + bounce + breath;
    rootRef.current.position.z = ridingZ;

    const targetPitch = isSwimming ? (isMoving ? 1.2 : 0.45) : !isGrounded ? 0.14 : isMoving ? (isRunning ? 0.14 : 0.04) : 0;
    rootRef.current.rotation.x = THREE.MathUtils.lerp(rootRef.current.rotation.x, targetPitch, dt * 10);
    rootRef.current.rotation.z = THREE.MathUtils.lerp(rootRef.current.rotation.z, cosP * 0.024 * m, dt * 10);

    torsoRef.current.rotation.y = sinP * 0.14 * m;
    headRef.current.rotation.y = -sinP * 0.09 * m + (m < 0.05 ? Math.sin(t * 0.9) * 0.07 : 0);
    headRef.current.rotation.x = isSwimming ? -0.6 : -rootRef.current.rotation.x * 0.45;

    const isBlinking = (t * 0.26) % 1.0 > 0.95;
    if (leftEyelidRef.current && rightEyelidRef.current) {
      leftEyelidRef.current.visible = isBlinking;
      rightEyelidRef.current.visible = isBlinking;
    }

    if (ponytailRef.current) {
      ponytailRef.current.rotation.x = 0.20 + m * 0.40 + Math.sin(t * 9.0) * (0.04 + m * 0.08);
      ponytailRef.current.rotation.z = cosP * 0.12 * m;
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
        leftUpperArmRef.current.rotation.set(armSwing, 0, 0.12);
        rightUpperArmRef.current.rotation.set(-armSwing, 0, -0.12);
        const idleElbow = -0.18;
        const runElbow = isRunning ? -0.65 : -0.32;
        leftForearmRef.current.rotation.x = THREE.MathUtils.lerp(idleElbow, runElbow, Math.min(1, m));
        rightForearmRef.current.rotation.x = THREE.MathUtils.lerp(idleElbow, runElbow, Math.min(1, m));
      }
    }
  });

  return (
    <group ref={rootRef}>
      <group ref={torsoRef} position={[0, 0.04, 0]}>
        <mesh castShadow receiveShadow geometry={geos.torsoTunic} material={coatMat} />
        <mesh position={[0, 0.345, 0]} scale={[1.08, 1.0, 0.82]} material={collarMat}>
          <cylinderGeometry args={[0.068, 0.088, 0.045, 16]} />
        </mesh>
        <mesh position={[0, -0.15, 0]} scale={[1.10, 0.88, 0.76]} material={pantMat}>
          <sphereGeometry args={[0.134, 14, 12]} />
        </mesh>
        <mesh position={[0, -0.05, 0]} scale={[1.13, 1.0, 0.79]} material={leatherMat}>
          <cylinderGeometry args={[0.125, 0.130, 0.055, 16]} />
        </mesh>
        <mesh position={[0, -0.05, 0.104]} material={goldMat}><boxGeometry args={[0.046, 0.048, 0.016]} /></mesh>
        <mesh position={[0, 0.39, 0]} material={pixarSkinMat}>
          <cylinderGeometry args={[0.048, 0.058, 0.13, 14]} />
        </mesh>

        {hasStaff && (
          <group position={[0.02, 0.15, -0.115]} rotation={[0, 0, -0.58]}>
            <mesh castShadow position={[0, -0.06, 0]}>
              <capsuleGeometry args={[0.014, 0.70, 6, 10]} />
              <meshStandardMaterial color="#18181b" roughness={0.25} metalness={0.3} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <cylinderGeometry args={[0.018, 0.018, 0.10, 8]} />
              <meshStandardMaterial color="#dc2626" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.30, 0]} material={goldMat}>
              <cylinderGeometry args={[0.046, 0.046, 0.014, 12]} />
            </mesh>
            <mesh position={[0, 0.43, 0]}>
              <cylinderGeometry args={[0.014, 0.016, 0.22, 8]} />
              <meshStandardMaterial color="#991b1b" roughness={0.6} />
            </mesh>
          </group>
        )}

        {/* DISNEY/PIXAR EXPRESSIVE HEAD, CLEAR EYES WITH WHITE CATCHLIGHTS, & ROUNDED HAIR */}
        <group ref={headRef} position={[0, 0.49, 0.01]} scale={[0.92, 0.92, 0.92]}>
          <mesh castShadow position={[0, 0.02, 0]} scale={[0.92, 1.0, 0.92]} material={pixarSkinMat}>
            <sphereGeometry args={[0.152, 22, 22]} />
          </mesh>
          <mesh position={[0, 0.002, 0.142]} scale={[0.85, 0.72, 1.1]} material={pixarSkinMat}>
            <sphereGeometry args={[0.018, 10, 10]} />
          </mesh>
          <mesh position={[-0.075, -0.018, 0.118]} scale={[1.2, 0.75, 0.5]} material={blushMat}><sphereGeometry args={[0.022, 8, 8]} /></mesh>
          <mesh position={[0.075, -0.018, 0.118]} scale={[1.2, 0.75, 0.5]} material={blushMat}><sphereGeometry args={[0.022, 8, 8]} /></mesh>
          <mesh position={[0, -0.048, 0.130]} scale={[1.35, 0.50, 0.6]}>
            <sphereGeometry args={[0.015, 10, 8]} />
            <meshStandardMaterial color="#e11d48" roughness={0.4} />
          </mesh>
          <mesh position={[-0.138, 0.005, -0.01]} scale={[0.45, 0.78, 0.6]} material={pixarSkinMat}><sphereGeometry args={[0.036, 10, 10]} /></mesh>
          <mesh position={[0.138, 0.005, -0.01]} scale={[0.45, 0.78, 0.6]} material={pixarSkinMat}><sphereGeometry args={[0.036, 10, 10]} /></mesh>

          {[-0.048, 0.048].map((ex, idx) => (
            <group key={idx} position={[ex, 0.022, 0.128]} rotation={[0, idx === 0 ? -0.12 : 0.12, 0]}>
              <mesh scale={[1.05, 1.15, 0.45]} material={scleraMat}><sphereGeometry args={[0.026, 12, 12]} /></mesh>
              <mesh position={[0, 0, 0.006]} scale={[0.72, 0.82, 0.42]} material={irisMat}><sphereGeometry args={[0.024, 12, 12]} /></mesh>
              <mesh position={[0, 0, 0.010]} scale={[0.44, 0.52, 0.38]} material={pupilMat}><sphereGeometry args={[0.022, 10, 10]} /></mesh>
              <mesh position={[0.006, 0.008, 0.018]} material={scleraMat}><sphereGeometry args={[0.0055, 8, 8]} /></mesh>
              <mesh ref={idx === 0 ? leftEyelidRef : rightEyelidRef} visible={false} position={[0, 0, 0.004]} scale={[1.08, 1.18, 0.50]} material={pixarSkinMat}>
                <sphereGeometry args={[0.026, 10, 10]} />
              </mesh>
              <mesh position={[0, 0.038, 0.008]} rotation={[0, 0, (idx === 0 ? -0.10 : 0.10) + Math.PI / 2]} material={hairMat}>
                <capsuleGeometry args={[0.005, 0.034, 4, 6]} />
              </mesh>
            </group>
          ))}

          <mesh castShadow position={[0, 0.052, -0.012]} scale={[0.98, 1.02, 1.0]} material={hairMat}>
            <sphereGeometry args={[0.162, 20, 18]} />
          </mesh>
          <mesh position={[-0.035, 0.095, 0.112]} rotation={[0.25, 0.15, 0.45]} scale={[0.85, 1.0, 0.65]} material={hairMat}>
            <capsuleGeometry args={[0.038, 0.09, 8, 10]} />
          </mesh>
          <mesh position={[0.048, 0.092, 0.110]} rotation={[0.25, -0.15, -0.40]} scale={[0.85, 1.0, 0.65]} material={hairMat}>
            <capsuleGeometry args={[0.036, 0.08, 8, 10]} />
          </mesh>
          {[-0.128, 0.128].map((sx, sIdx) => (
            <mesh key={sIdx} position={[sx, -0.015, 0.065]} rotation={[0.14, 0, sx < 0 ? 0.12 : -0.12]} material={hairMat}>
              <capsuleGeometry args={[0.028, 0.12, 8, 10]} />
            </mesh>
          ))}
          <group ref={ponytailRef} position={[0, 0.02, -0.152]}>
            <mesh position={[0, -0.12, -0.03]} rotation={[0.2, 0, 0]} material={hairMat}>
              <capsuleGeometry args={[0.048, 0.22, 8, 10]} />
            </mesh>
          </group>
        </group>

        {/* SMOOTH PIXAR ARMS & HANDS WITH 5 FINGERS ALONG Z-AXIS */}
        <group ref={leftUpperArmRef} position={[-0.162, 0.27, 0]}>
          <mesh position={[0.01, 0.01, 0]} material={coatMat}><sphereGeometry args={[0.056, 12, 10]} /></mesh>
          <mesh castShadow geometry={geos.upperArm} material={coatMat} />
          <mesh position={[0, -0.18, 0]} material={collarMat}><cylinderGeometry args={[0.044, 0.042, 0.035, 12]} /></mesh>
          <group ref={leftForearmRef} position={[0, -0.18, 0]}>
            <mesh geometry={geos.forearm} material={pixarSkinMat} />
            <group position={[0, -0.185, 0.006]}>
              <mesh scale={[0.45, 1.08, 0.84]} material={pixarSkinMat}><sphereGeometry args={[0.033, 12, 10]} /></mesh>
              <mesh position={[0.009, -0.004, 0.024]} rotation={[0.55, 0, 0.18]} material={pixarSkinMat}><capsuleGeometry args={[0.006, 0.018, 4, 6]} /></mesh>
              {[0.012, 0.004, -0.004, -0.012].map((fz, fIdx) => (
                <mesh key={fIdx} position={[0.003, -0.032, fz]} rotation={[0, 0, 0.16]} material={pixarSkinMat}>
                  <capsuleGeometry args={[0.0048, fIdx === 1 || fIdx === 2 ? 0.024 : 0.019, 4, 6]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>

        <group ref={rightUpperArmRef} position={[0.162, 0.27, 0]}>
          <mesh position={[-0.01, 0.01, 0]} material={coatMat}><sphereGeometry args={[0.056, 12, 10]} /></mesh>
          <mesh castShadow geometry={geos.upperArm} material={coatMat} />
          <mesh position={[0, -0.18, 0]} material={collarMat}><cylinderGeometry args={[0.044, 0.042, 0.035, 12]} /></mesh>
          <group ref={rightForearmRef} position={[0, -0.18, 0]}>
            <mesh geometry={geos.forearm} material={pixarSkinMat} />
            <group position={[0, -0.185, 0.006]}>
              <mesh scale={[0.45, 1.08, 0.84]} material={pixarSkinMat}><sphereGeometry args={[0.033, 12, 10]} /></mesh>
              <mesh position={[-0.009, -0.004, 0.024]} rotation={[0.55, 0, -0.18]} material={pixarSkinMat}><capsuleGeometry args={[0.006, 0.018, 4, 6]} /></mesh>
              {[0.012, 0.004, -0.004, -0.012].map((fz, fIdx) => (
                <mesh key={fIdx} position={[-0.003, -0.032, fz]} rotation={[0, 0, -0.16]} material={pixarSkinMat}>
                  <capsuleGeometry args={[0.0048, fIdx === 1 || fIdx === 2 ? 0.024 : 0.019, 4, 6]} />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>

      <group ref={leftThighRef} position={[-0.082, -0.15, 0]}>
        <mesh castShadow geometry={geos.thigh} material={pantMat} />
        <group ref={leftShinRef} position={[0, -0.26, 0]}>
          <mesh castShadow geometry={geos.calfBoot} material={bootMat} />
          <mesh position={[0, -0.26, 0.032]} scale={[0.88, 0.75, 1.42]} material={bootMat}><sphereGeometry args={[0.056, 12, 10]} /></mesh>
        </group>
      </group>
      <group ref={rightThighRef} position={[0.082, -0.15, 0]}>
        <mesh castShadow geometry={geos.thigh} material={pantMat} />
        <group ref={rightShinRef} position={[0, -0.26, 0]}>
          <mesh castShadow geometry={geos.calfBoot} material={bootMat} />
          <mesh position={[0, -0.26, 0.032]} scale={[0.88, 0.75, 1.42]} material={bootMat}><sphereGeometry args={[0.056, 12, 10]} /></mesh>
        </group>
      </group>
    </group>
  );
}

export default function PlayerModel() {
  return <DigitalHumanCharacter />;
}
