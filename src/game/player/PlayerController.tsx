"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";

const WALK_SPEED = 2.5;
const RUN_SPEED = 6.0;
const JUMP_VELOCITY = 5.2;
const DEFAULT_CAM_DIST = 4.5;
const MIN_CAM_DIST = 2.0;
const MAX_CAM_DIST = 9.0;
const SHOULDER_OFFSET = 0.4;
const MIN_PITCH = THREE.MathUtils.degToRad(-20);
const MAX_PITCH = THREE.MathUtils.degToRad(70);

const SAFE_SPAWN: [number, number, number] = [
  -360,
  Math.max(2, getTerrainHeight(-360, 0) + 2.5),
  0,
];

export default function PlayerController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualGroupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();
  const setStorePosition = usePlayerStore((s) => s.setPosition);
  const lastUiSyncRef = useRef(0);

  const keys = useRef<Record<string, boolean>>({});
  const orbit = useRef({
    yaw: -Math.PI / 2,
    pitch: 0.25,
    distance: DEFAULT_CAM_DIST,
  });

  const forwardVec = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;
  const moveDir = useRef(new THREE.Vector3()).current;
  const targetCamPos = useRef(new THREE.Vector3()).current;
  const lookAtTarget = useRef(new THREE.Vector3()).current;
  const smoothedCamPos = useRef(new THREE.Vector3(-365, 8, 0)).current;
  const smoothedLookAt = useRef(new THREE.Vector3(-360, 4, 0)).current;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement) return;
      const sensitivity = 0.0022;
      orbit.current.yaw -= e.movementX * sensitivity;
      orbit.current.pitch = THREE.MathUtils.clamp(
        orbit.current.pitch + e.movementY * sensitivity,
        MIN_PITCH,
        MAX_PITCH
      );
    };
    const onWheel = (e: WheelEvent) => {
      orbit.current.distance = THREE.MathUtils.clamp(
        orbit.current.distance + e.deltaY * 0.004,
        MIN_CAM_DIST,
        MAX_CAM_DIST
      );
    };
    const onCanvasClick = () => {
      if (document.pointerLockElement !== gl.domElement) {
        gl.domElement.requestPointerLock?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    gl.domElement.addEventListener("click", onCanvasClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("wheel", onWheel);
      gl.domElement.removeEventListener("click", onCanvasClick);
    };
  }, [gl.domElement]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const body = bodyRef.current;
    if (!body) return;
    const pos = body.translation();
    const vel = body.linvel();

    if (pos.y < -15 || isNaN(pos.y)) {
      const safeY = Math.max(2, getTerrainHeight(SAFE_SPAWN[0], SAFE_SPAWN[2]) + 3);
      body.setTranslation({ x: SAFE_SPAWN[0], y: safeY, z: SAFE_SPAWN[2] }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      return;
    }

    const groundY = getTerrainHeight(pos.x, pos.z);
    const footY = pos.y - 0.9;
    const isGrounded = footY <= groundY + 0.35;

    const forwardInput = (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
                         (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);
    const sideInput = (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
                      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);
    const isRunning = Boolean(keys.current["ShiftLeft"] || keys.current["ShiftRight"]);
    const speed = isRunning ? RUN_SPEED : WALK_SPEED;

    forwardVec.set(-Math.sin(orbit.current.yaw), 0, -Math.cos(orbit.current.yaw)).normalize();
    rightVec.set(Math.cos(orbit.current.yaw), 0, -Math.sin(orbit.current.yaw)).normalize();

    moveDir.set(0, 0, 0).addScaledVector(forwardVec, forwardInput).addScaledVector(rightVec, sideInput);

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize();
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      if (visualGroupRef.current) {
        const currentRot = visualGroupRef.current.rotation.y;
        let diff = targetAngle - currentRot;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        visualGroupRef.current.rotation.y += diff * Math.min(1, dt * 12);
      }
    }

    const nextX = pos.x + moveDir.x * 0.5;
    const nextZ = pos.z + moveDir.z * 0.5;
    const nextGroundY = getTerrainHeight(nextX, nextZ);
    const climbSlope = (nextGroundY - groundY) / 0.5;
    const slopeFactor = climbSlope > 1.19 ? 0 : 1;

    let nextVy = vel.y;
    if (keys.current["Space"] && isGrounded && vel.y < 1.5) {
      nextVy = JUMP_VELOCITY;
    }
    if (isGrounded && moveDir.lengthSq() > 0 && climbSlope > 0 && climbSlope <= 1.19) {
      nextVy = Math.max(nextVy, climbSlope * speed * 0.45);
    }

    body.setLinvel({ x: moveDir.x * speed * slopeFactor, y: nextVy, z: moveDir.z * speed * slopeFactor }, true);

    playerFrameState.x = pos.x;
    playerFrameState.y = pos.y;
    playerFrameState.z = pos.z;
    playerFrameState.yaw = orbit.current.yaw;

    if (state.clock.elapsedTime - lastUiSyncRef.current > 0.25) {
      lastUiSyncRef.current = state.clock.elapsedTime;
      setStorePosition([Math.round(pos.x * 10) / 10, Math.round(pos.y * 10) / 10, Math.round(pos.z * 10) / 10]);
    }

    const shoulderX = rightVec.x * SHOULDER_OFFSET;
    const shoulderZ = rightVec.z * SHOULDER_OFFSET;
    lookAtTarget.set(pos.x + shoulderX, pos.y + 0.65, pos.z + shoulderZ);

    const horizDist = orbit.current.distance * Math.cos(orbit.current.pitch);
    const vertDist = orbit.current.distance * Math.sin(orbit.current.pitch);
    const camX = lookAtTarget.x + Math.sin(orbit.current.yaw) * horizDist;
    const camZ = lookAtTarget.z + Math.cos(orbit.current.yaw) * horizDist;
    let camY = lookAtTarget.y + vertDist;

    const terrainAtCam = Math.max(-0.5, getTerrainHeight(camX, camZ));
    if (camY < terrainAtCam + 0.6) camY = terrainAtCam + 0.6;

    targetCamPos.set(camX, camY, camZ);
    const damp = 1 - Math.exp(-10 * dt);
    smoothedCamPos.lerp(targetCamPos, damp);
    smoothedLookAt.lerp(lookAtTarget, damp);

    camera.position.copy(smoothedCamPos);
    camera.lookAt(smoothedLookAt);

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = isRunning && moveDir.lengthSq() > 0 ? 65 : 60;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 6);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <RigidBody ref={bodyRef} colliders={false} mass={1} type="dynamic" position={SAFE_SPAWN} enabledRotations={[false, false, false]} linearDamping={0.5}>
      <CapsuleCollider args={[0.5, 0.4]} friction={0.1} />
      <group ref={visualGroupRef}>
        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.4, 1.0, 8, 16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 0.35, 0.32]}>
          <boxGeometry args={[0.45, 0.22, 0.2]} />
          <meshStandardMaterial color="#fef3c7" />
        </mesh>
      </group>
    </RigidBody>
  );
}
