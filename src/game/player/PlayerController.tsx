"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { getWalkableHeight, resolveObstacleCollisions, BIOME_CENTERS } from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import { weatherFrameState } from "@/game/state/useWeatherStore";
import PlayerModel from "./PlayerModel";

const WALK_SPEED = 4.0;
const RUN_SPEED = 8.5;
const SWIM_SPEED = 4.5;
const BOAT_SPEED = 15.0;
const GRAVITY = 22.0;
const JUMP_VELOCITY = 7.8;
const DEFAULT_CAM_DIST = 4.6;
const MIN_CAM_DIST = 2.2;
const MAX_CAM_DIST = 14.0;
const SHOULDER_OFFSET = 0.35;
const MIN_PITCH = THREE.MathUtils.degToRad(-15);
const MAX_PITCH = THREE.MathUtils.degToRad(68);
const FOOT_OFFSET = 0.76; // Calibrated so boot soles sit firmly on ground!

export default function PlayerController() {
  const playerGroupRef = useRef<THREE.Group>(null);
  const visualGroupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const setStorePosition = usePlayerStore((s) => s.setPosition);
  const setSwimming = usePlayerStore((s) => s.setSwimming);
  const setInBoat = usePlayerStore((s) => s.setInBoat);
  const setInteractionPrompt = usePlayerStore((s) => s.setInteractionPrompt);
  const teleportTarget = usePlayerStore((s) => s.teleportTarget);
  const clearTeleport = usePlayerStore((s) => s.clearTeleport);
  const lastUiSyncRef = useRef(0);

  const phys = useRef({
    x: BIOME_CENTERS.westBeach.x,
    y: getWalkableHeight(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z),
    z: BIOME_CENTERS.westBeach.z,
    vy: 0,
    isGrounded: true,
  });

  const keys = useRef<Record<string, boolean>>({});
  const isDraggingRef = useRef(false);
  const orbit = useRef({ yaw: -Math.PI / 2, pitch: 0.22, distance: DEFAULT_CAM_DIST });

  const forwardVec = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;
  const moveDir = useRef(new THREE.Vector3()).current;
  const targetCamPos = useRef(new THREE.Vector3()).current;
  const lookAtTarget = useRef(new THREE.Vector3()).current;
  const smoothedCamPos = useRef(new THREE.Vector3(-542, 7, 0)).current;
  const smoothedLookAt = useRef(new THREE.Vector3(-535, 5, 0)).current;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "KeyE") {
        const distToBoat = Math.hypot(phys.current.x - playerFrameState.boatX, phys.current.z - playerFrameState.boatZ);
        if (playerFrameState.isInBoat) {
          playerFrameState.isInBoat = false;
          setInBoat(false);
          // Step off onto the pier end or beside boat
          phys.current.x = -584;
          phys.current.z = 0;
          phys.current.y = getWalkableHeight(-584, 0);
        } else if (distToBoat < 14.0) {
          playerFrameState.isInBoat = true;
          setInBoat(true);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const onMouseDown = () => { isDraggingRef.current = true; };
    const onMouseUp = () => { isDraggingRef.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== gl.domElement && !isDraggingRef.current) return;
      const sensitivity = 0.0024;
      orbit.current.yaw -= e.movementX * sensitivity;
      orbit.current.pitch = THREE.MathUtils.clamp(orbit.current.pitch + e.movementY * sensitivity, MIN_PITCH, MAX_PITCH);
    };
    const onWheel = (e: WheelEvent) => {
      orbit.current.distance = THREE.MathUtils.clamp(orbit.current.distance + e.deltaY * 0.004, MIN_CAM_DIST, MAX_CAM_DIST);
    };
    const onCanvasClick = () => {
      if (document.pointerLockElement !== gl.domElement && !weatherFrameState.isPhotoMode) {
        try {
          const p = gl.domElement.requestPointerLock?.() as unknown as Promise<void> | undefined;
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {}
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    gl.domElement.addEventListener("click", onCanvasClick);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("wheel", onWheel);
      gl.domElement.removeEventListener("click", onCanvasClick);
    };
  }, [gl.domElement, setInBoat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const p = phys.current;

    if (teleportTarget) {
      p.x = teleportTarget[0];
      p.z = teleportTarget[2];
      p.y = Math.max(0.0, getWalkableHeight(p.x, p.z));
      p.vy = 0;
      clearTeleport();
    }

    const forwardInput = (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
                         (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);
    const sideInput = (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
                      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);

    if (playerFrameState.isInBoat) {
      if (Math.abs(sideInput) > 0) {
        playerFrameState.boatYaw -= sideInput * dt * 1.5;
      }
      const moveDist = forwardInput * BOAT_SPEED * dt;
      const nextBx = playerFrameState.boatX - Math.sin(playerFrameState.boatYaw) * moveDist;
      const nextBz = playerFrameState.boatZ - Math.cos(playerFrameState.boatYaw) * moveDist;
      // Boat only sails in water deeper than -0.6m and never clips into piers
      if (getWalkableHeight(nextBx, nextBz) < -0.6) {
        playerFrameState.boatX = nextBx;
        playerFrameState.boatZ = nextBz;
      }
      playerFrameState.isMoving = Math.abs(forwardInput) > 0;
      // Stand on the rear deck behind the orange wheelhouse cabin
      p.x = playerFrameState.boatX + Math.sin(playerFrameState.boatYaw) * 2.1;
      p.z = playerFrameState.boatZ + Math.cos(playerFrameState.boatYaw) * 2.1;
      p.y = 1.25;
      if (visualGroupRef.current) {
        visualGroupRef.current.rotation.y = playerFrameState.boatYaw + Math.PI;
      }
    } else {
      const groundY = getWalkableHeight(p.x, p.z);
      const isSwimming = groundY < -1.1 && p.y <= 0.15;
      const isRunning = Boolean(keys.current["ShiftLeft"] || keys.current["ShiftRight"]) && !isSwimming;
      const speed = isSwimming ? SWIM_SPEED : isRunning ? RUN_SPEED : WALK_SPEED;

      forwardVec.set(-Math.sin(orbit.current.yaw), 0, -Math.cos(orbit.current.yaw)).normalize();
      rightVec.set(Math.cos(orbit.current.yaw), 0, -Math.sin(orbit.current.yaw)).normalize();

      moveDir.set(0, 0, 0).addScaledVector(forwardVec, forwardInput).addScaledVector(rightVec, sideInput);
      const isMoving = moveDir.lengthSq() > 0;

      if (isMoving) {
        moveDir.normalize();
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        if (visualGroupRef.current) {
          const currentRot = visualGroupRef.current.rotation.y;
          let diff = targetAngle - currentRot;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualGroupRef.current.rotation.y += diff * Math.min(1, dt * 14);
        }
      }

      let nextX = p.x + moveDir.x * speed * dt;
      let nextZ = p.z + moveDir.z * speed * dt;
      [nextX, nextZ] = resolveObstacleCollisions(nextX, nextZ, 0.65);

      // Solid collision against Tugboat hull so player NEVER walks/swims through the boat!
      const dxBoat = nextX - playerFrameState.boatX;
      const dzBoat = nextZ - playerFrameState.boatZ;
      const distBoat = Math.hypot(dxBoat, dzBoat);
      if (distBoat < 4.5 && distBoat > 0.001) {
        nextX = playerFrameState.boatX + (dxBoat / distBoat) * 4.5;
        nextZ = playerFrameState.boatZ + (dzBoat / distBoat) * 4.5;
      }

      p.x = nextX;
      p.z = nextZ;

      const newGroundY = getWalkableHeight(p.x, p.z);
      if (isSwimming) {
        p.y = THREE.MathUtils.lerp(p.y, -0.25, dt * 8);
        p.vy = 0;
        p.isGrounded = false;
      } else {
        if (keys.current["Space"] && p.isGrounded) {
          p.vy = JUMP_VELOCITY;
          p.isGrounded = false;
        }
        p.vy -= GRAVITY * dt;
        p.y += p.vy * dt;
        if (p.y <= newGroundY) {
          p.y = newGroundY;
          p.vy = 0;
          p.isGrounded = true;
        }
      }

      playerFrameState.isMoving = isMoving;
      playerFrameState.isRunning = isRunning;
      playerFrameState.isGrounded = p.isGrounded;
      playerFrameState.isSwimming = isSwimming;
    }

    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(p.x, p.y + FOOT_OFFSET, p.z);
    }

    playerFrameState.x = p.x;
    playerFrameState.y = p.y + FOOT_OFFSET;
    playerFrameState.z = p.z;
    playerFrameState.yaw = orbit.current.yaw;

    if (state.clock.elapsedTime - lastUiSyncRef.current > 0.25) {
      lastUiSyncRef.current = state.clock.elapsedTime;
      setStorePosition([Math.round(p.x), Math.round(p.y), Math.round(p.z)]);
      setSwimming(playerFrameState.isSwimming);

      const distToBoat = Math.hypot(p.x - playerFrameState.boatX, p.z - playerFrameState.boatZ);
      if (playerFrameState.isInBoat) {
        setInteractionPrompt("Tekan E untuk Turun ke Dermaga • W/S Maju/Mundur • A/D Belok");
      } else if (distToBoat < 14.0) {
        setInteractionPrompt("Tekan E untuk Naik Perahu Tugboat");
      }
    }

    const effectiveDist = playerFrameState.isInBoat ? Math.max(orbit.current.distance, 9.5) : orbit.current.distance;
    rightVec.set(Math.cos(orbit.current.yaw), 0, -Math.sin(orbit.current.yaw)).normalize();
    lookAtTarget.set(p.x + rightVec.x * SHOULDER_OFFSET, p.y + 1.4, p.z + rightVec.z * SHOULDER_OFFSET);

    const horizDist = effectiveDist * Math.cos(orbit.current.pitch);
    const vertDist = effectiveDist * Math.sin(orbit.current.pitch);
    const camX = lookAtTarget.x + Math.sin(orbit.current.yaw) * horizDist;
    const camZ = lookAtTarget.z + Math.cos(orbit.current.yaw) * horizDist;
    let camY = lookAtTarget.y + vertDist;

    const terrainAtCam = Math.max(0.3, getWalkableHeight(camX, camZ));
    if (camY < terrainAtCam + 0.7) camY = terrainAtCam + 0.7;

    targetCamPos.set(camX, camY, camZ);
    const damp = 1 - Math.exp(-12 * dt);
    smoothedCamPos.lerp(targetCamPos, damp);
    smoothedLookAt.lerp(lookAtTarget, damp);

    camera.position.copy(smoothedCamPos);
    camera.lookAt(smoothedLookAt);
  });

  return (
    <group ref={playerGroupRef} position={[BIOME_CENTERS.westBeach.x, 4, BIOME_CENTERS.westBeach.z]}>
      <group ref={visualGroupRef}>
        <PlayerModel />
      </group>
    </group>
  );
}
