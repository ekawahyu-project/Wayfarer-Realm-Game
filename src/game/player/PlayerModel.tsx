"use client";

import { Suspense, useEffect, useMemo, useRef, Component, ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { playerFrameState } from "@/game/state/usePlayerStore";
import manifest from "../../../public/assets/manifest.json";

class ModelErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Shared shader uniforms so even static unrigged GLB meshes swing their legs & arms naturally!
const charAnimUniforms = {
  uAnimPhase: { value: 0 },
  uMoveIntensity: { value: 0 },
  uRunFactor: { value: 0 },
  uBreathTime: { value: 0 },
};

function ArticulatedHumanoidFallback() {
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = charAnimUniforms.uAnimPhase.value;
    const m = charAnimUniforms.uMoveIntensity.value;
    if (leftLegRef.current && rightLegRef.current && leftArmRef.current && rightArmRef.current) {
      leftLegRef.current.rotation.x = Math.sin(p) * 0.65 * m;
      rightLegRef.current.rotation.x = -Math.sin(p) * 0.65 * m;
      leftArmRef.current.rotation.x = -Math.sin(p) * 0.5 * m;
      rightArmRef.current.rotation.x = Math.sin(p) * 0.5 * m;
    }
  });

  return (
    <group>
      <mesh castShadow position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <mesh castShadow position={[0, 0.05, 0]}>
        <capsuleGeometry args={[0.22, 0.45, 8, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh ref={leftArmRef} castShadow position={[-0.32, 0.12, 0]}>
        <capsuleGeometry args={[0.08, 0.38, 6, 12]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <mesh ref={rightArmRef} castShadow position={[0.32, 0.12, 0]}>
        <capsuleGeometry args={[0.08, 0.38, 6, 12]} />
        <meshStandardMaterial color="#fde68a" />
      </mesh>
      <mesh ref={leftLegRef} castShadow position={[-0.13, -0.52, 0]}>
        <capsuleGeometry args={[0.1, 0.45, 6, 12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh ref={rightLegRef} castShadow position={[0.13, -0.52, 0]}>
        <capsuleGeometry args={[0.1, 0.45, 6, 12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

interface DetectedBones {
  leftUpLeg?: THREE.Bone;
  rightUpLeg?: THREE.Bone;
  leftLeg?: THREE.Bone;
  rightLeg?: THREE.Bone;
  leftArm?: THREE.Bone;
  rightArm?: THREE.Bone;
  spine?: THREE.Bone;
  head?: THREE.Bone;
}

function LoadedCharacterGLB({ url }: { url: string }) {
  const outerRef = useRef<THREE.Group>(null);
  const gltf = useGLTF(url);
  const { actions, names } = useAnimations(gltf.animations, outerRef);
  const bonesRef = useRef<DetectedBones>({});
  const hasSkeletonRef = useRef(false);
  const phaseRef = useRef(0);
  const moveSmoothedRef = useRef(0);

  const { scale, offset, boxMinY, boxHeight } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z, 0.001);
    const targetHeight = 1.78;
    const computedScale = targetHeight / maxDim;
    const footY = -0.9 - box.min.y * computedScale;
    return {
      scale: computedScale,
      offset: [-center.x * computedScale, footY, -center.z * computedScale] as [number, number, number],
      boxMinY: box.min.y,
      boxHeight: Math.max(size.y, 0.001),
    };
  }, [gltf.scene]);

  useEffect(() => {
    const detected: DetectedBones = {};
    let foundBones = 0;

    gltf.scene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        foundBones++;
        const n = child.name.toLowerCase();
        if ((n.includes("upleg") || n.includes("thigh") || n.includes("hip")) && (n.includes("l") || n.includes("left"))) detected.leftUpLeg = child as THREE.Bone;
        else if ((n.includes("upleg") || n.includes("thigh") || n.includes("hip")) && (n.includes("r") || n.includes("right"))) detected.rightUpLeg = child as THREE.Bone;
        else if ((n.includes("leg") || n.includes("calf") || n.includes("knee")) && (n.includes("l") || n.includes("left")) && !detected.leftLeg) detected.leftLeg = child as THREE.Bone;
        else if ((n.includes("leg") || n.includes("calf") || n.includes("knee")) && (n.includes("r") || n.includes("right")) && !detected.rightLeg) detected.rightLeg = child as THREE.Bone;
        else if ((n.includes("arm") || n.includes("shoulder")) && (n.includes("l") || n.includes("left")) && !n.includes("fore") && !detected.leftArm) detected.leftArm = child as THREE.Bone;
        else if ((n.includes("arm") || n.includes("shoulder")) && (n.includes("r") || n.includes("right")) && !n.includes("fore") && !detected.rightArm) detected.rightArm = child as THREE.Bone;
        else if (n.includes("spine") || n.includes("chest") || n.includes("torso")) detected.spine = child as THREE.Bone;
        else if (n.includes("head") || n.includes("neck")) detected.head = child as THREE.Bone;
      }

      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Inject organic vertex gait animation so static/unrigged meshes walk & breathe fluidly!
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((mat) => {
          if (!mat || mat.userData?.hasGaitShader) return;
          mat.userData = { ...mat.userData, hasGaitShader: true };
          mat.onBeforeCompile = (shader) => {
            shader.uniforms.uAnimPhase = charAnimUniforms.uAnimPhase;
            shader.uniforms.uMoveIntensity = charAnimUniforms.uMoveIntensity;
            shader.uniforms.uRunFactor = charAnimUniforms.uRunFactor;
            shader.uniforms.uBreathTime = charAnimUniforms.uBreathTime;
            shader.uniforms.uMinY = { value: boxMinY };
            shader.uniforms.uHeight = { value: boxHeight };

            shader.vertexShader = [
              "uniform float uAnimPhase;",
              "uniform float uMoveIntensity;",
              "uniform float uRunFactor;",
              "uniform float uBreathTime;",
              "uniform float uMinY;",
              "uniform float uHeight;",
              shader.vertexShader
            ].join("\n").replace(
              "#include <begin_vertex>",
              [
                "#include <begin_vertex>",
                "float normY = clamp((position.y - uMinY) / uHeight, 0.0, 1.0);",
                "float sideSign = position.x >= 0.0 ? 1.0 : -1.0;",
                "float sideWeight = clamp(abs(position.x) / (uHeight * 0.07), 0.25, 1.0);",
                "// 1. Leg stride & knee lift (lower 48% of body)",
                "float legMask = smoothstep(0.50, 0.04, normY);",
                "float legSwing = sin(uAnimPhase + sideSign * 1.5708) * legMask * sideWeight * uMoveIntensity;",
                "transformed.z += legSwing * uHeight * 0.20;",
                "transformed.y += max(0.0, cos(uAnimPhase + sideSign * 1.5708)) * legMask * uMoveIntensity * uHeight * 0.07;",
                "// 2. Upper body & arm counter-swing + torso twist",
                "float armMask = smoothstep(0.48, 0.85, normY) * smoothstep(0.92, 0.72, normY);",
                "float armSwing = -sin(uAnimPhase + sideSign * 1.5708) * armMask * sideWeight * uMoveIntensity;",
                "transformed.z += armSwing * uHeight * 0.14;",
                "// 3. Hair / cloth breeze & breathing chest motion",
                "float breath = sin(uBreathTime * 2.4 + normY * 3.0) * 0.008 * uHeight * smoothstep(0.4, 0.9, normY);",
                "transformed.z += breath;",
                "transformed.x += cos(uBreathTime * 1.8 + normY * 4.0) * 0.005 * uHeight * smoothstep(0.5, 1.0, normY);"
              ].join("\n")
            );
          };
          mat.needsUpdate = true;
        });
      }
    });

    bonesRef.current = detected;
    hasSkeletonRef.current = foundBones > 3;
  }, [gltf.scene, boxMinY, boxHeight]);

  useEffect(() => {
    if (names.length > 0 && actions[names[0]]) {
      actions[names[0]]?.reset().fadeIn(0.2).play();
    }
  }, [actions, names]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!outerRef.current) return;

    const isMoving = playerFrameState.isMoving && !playerFrameState.isInBoat;
    const isRunning = playerFrameState.isRunning;
    const isSwimming = playerFrameState.isSwimming && !playerFrameState.isInBoat;

    const targetMove = isMoving ? (isRunning ? 1.25 : 0.8) : isSwimming ? 0.65 : 0.0;
    moveSmoothedRef.current = THREE.MathUtils.lerp(moveSmoothedRef.current, targetMove, dt * 10);

    const cycleSpeed = isSwimming ? 6.5 : isRunning ? 13.5 : 8.5;
    if (isMoving || isSwimming) {
      phaseRef.current += dt * cycleSpeed;
    } else {
      // Smoothly return phase to neutral stance when stopping
      phaseRef.current = THREE.MathUtils.lerp(phaseRef.current, Math.round(phaseRef.current / Math.PI) * Math.PI, dt * 6);
    }

    charAnimUniforms.uAnimPhase.value = phaseRef.current;
    charAnimUniforms.uMoveIntensity.value = moveSmoothedRef.current;
    charAnimUniforms.uRunFactor.value = isRunning ? 1.0 : 0.0;
    charAnimUniforms.uBreathTime.value = state.clock.elapsedTime;

    // Whole-body vertical bounce, forward run lean, hip sway, and swim pitch
    const bounce = Math.abs(Math.sin(phaseRef.current)) * 0.075 * moveSmoothedRef.current;
    const idleBreathY = Math.sin(state.clock.elapsedTime * 2.2) * 0.015;
    outerRef.current.position.y = isSwimming ? -0.35 + idleBreathY * 2 : bounce + idleBreathY;

    const targetLeanX = isSwimming
      ? (isMoving ? 1.15 : 0.45)
      : isMoving
      ? (isRunning ? 0.18 : 0.08)
      : 0.0;
    const targetSwayZ = Math.cos(phaseRef.current) * 0.045 * moveSmoothedRef.current;
    const targetTwistY = Math.sin(phaseRef.current) * 0.08 * moveSmoothedRef.current;

    outerRef.current.rotation.x = THREE.MathUtils.lerp(outerRef.current.rotation.x, targetLeanX, dt * 8);
    outerRef.current.rotation.z = THREE.MathUtils.lerp(outerRef.current.rotation.z, targetSwayZ, dt * 10);
    outerRef.current.rotation.y = THREE.MathUtils.lerp(outerRef.current.rotation.y, targetTwistY, dt * 10);

    // Also animate skeletal bones if present and no embedded clip is overriding
    if (names.length === 0 && hasSkeletonRef.current) {
      const b = bonesRef.current;
      const s = Math.sin(phaseRef.current) * moveSmoothedRef.current;
      if (b.leftUpLeg) b.leftUpLeg.rotation.x = s * 0.55;
      if (b.rightUpLeg) b.rightUpLeg.rotation.x = -s * 0.55;
      if (b.leftArm) b.leftArm.rotation.x = -s * 0.45;
      if (b.rightArm) b.rightArm.rotation.x = s * 0.45;
      if (b.spine) b.spine.rotation.y = s * 0.12;
    }
  });

  return (
    <group ref={outerRef}>
      <primitive object={gltf.scene} scale={scale} position={offset} />
    </group>
  );
}

export default function PlayerModel() {
  const playerUrl = manifest.models?.playerMai || "";
  if (!playerUrl) {
    return <ArticulatedHumanoidFallback />;
  }
  return (
    <ModelErrorBoundary fallback={<ArticulatedHumanoidFallback />}>
      <Suspense fallback={<ArticulatedHumanoidFallback />}>
        <LoadedCharacterGLB url={playerUrl} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
