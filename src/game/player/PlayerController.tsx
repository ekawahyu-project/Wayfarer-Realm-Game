"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CapsuleCollider, RigidBody, RapierRigidBody } from "@react-three/rapier";
import { useControls, button } from "leva";
import * as THREE from "three";
import { getTerrainHeight, BIOME_CENTERS } from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import PlayerModel from "./PlayerModel";

const WALK_SPEED = 2.5;
const RUN_SPEED = 6.0;
const SWIM_SPEED = 3.2;
const BOAT_SPEED = 11.0;
const JUMP_VELOCITY = 5.2;
const DEFAULT_CAM_DIST = 4.5;
const MIN_CAM_DIST = 2.0;
const MAX_CAM_DIST = 11.0;
const SHOULDER_OFFSET = 0.4;
const MIN_PITCH = THREE.MathUtils.degToRad(-20);
const MAX_PITCH = THREE.MathUtils.degToRad(70);

const SAFE_SPAWN: [number, number, number] = [
  BIOME_CENTERS.westBeach.x,
  Math.max(3.5, getTerrainHeight(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z) + 2.2),
  BIOME_CENTERS.westBeach.z,
];

export default function PlayerController() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualGroupRef = useRef<THREE.Group>(null);
  const { camera, gl } = useThree();

  const setStorePosition = usePlayerStore((s) => s.setPosition);
  const setSwimming = usePlayerStore((s) => s.setSwimming);
  const setInBoat = usePlayerStore((s) => s.setInBoat);
  const setInteractionPrompt = usePlayerStore((s) => s.setInteractionPrompt);
  const teleportTarget = usePlayerStore((s) => s.teleportTarget);
  const requestTeleport = usePlayerStore((s) => s.requestTeleport);
  const clearTeleport = usePlayerStore((s) => s.clearTeleport);
  const lastUiSyncRef = useRef(0);

  const keys = useRef<Record<string, boolean>>({});
  const orbit = useRef({
    yaw: -Math.PI / 2,
    pitch: 0.22,
    distance: DEFAULT_CAM_DIST,
  });

  const forwardVec = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;
  const moveDir = useRef(new THREE.Vector3()).current;
  const targetCamPos = useRef(new THREE.Vector3()).current;
  const lookAtTarget = useRef(new THREE.Vector3()).current;
  const smoothedCamPos = useRef(new THREE.Vector3(SAFE_SPAWN[0] - 5, SAFE_SPAWN[1] + 2, SAFE_SPAWN[2])).current;
  const smoothedLookAt = useRef(new THREE.Vector3(SAFE_SPAWN[0], SAFE_SPAWN[1], SAFE_SPAWN[2])).current;

  const teleportTo = (x: number, z: number) => {
    playerFrameState.isInBoat = false;
    setInBoat(false);
    const y = Math.max(2.5, getTerrainHeight(x, z) + 2.5);
    requestTeleport([x, y, z]);
  };

  useControls("Teleport Lokasi (Pulau 1.4km)", {
    "1. Pantai Barat & Dermaga": button(() => teleportTo(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z)),
    "2. Padang Rumput Tengah": button(() => teleportTo(BIOME_CENTERS.centralMeadow.x, BIOME_CENTERS.centralMeadow.z)),
    "3. Desa Pedesaan (Timur)": button(() => teleportTo(BIOME_CENTERS.eastVillage.x, BIOME_CENTERS.eastVillage.z)),
    "4. Kota Kerajaan (Selatan)": button(() => teleportTo(BIOME_CENTERS.southKingdom.x, BIOME_CENTERS.southKingdom.z)),
    "5. Pelabuhan (Ujung Selatan)": button(() => teleportTo(BIOME_CENTERS.southHarbor.x, BIOME_CENTERS.southHarbor.z)),
    "6. Kuil Maple (Barat Laut)": button(() => teleportTo(BIOME_CENTERS.nwShrine.x, BIOME_CENTERS.nwShrine.z)),
    "7. Gunung Salju (Utara)": button(() => teleportTo(BIOME_CENTERS.northMountains.x, BIOME_CENTERS.northMountains.z)),
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      // Toggle Boat boarding with E when near the tugboat (PRD 6.5 & 19.6)
      if (e.code === "KeyE") {
        const dx = playerFrameState.x - playerFrameState.boatX;
        const dz = playerFrameState.z - playerFrameState.boatZ;
        const distToBoat = Math.sqrt(dx * dx + dz * dz);
        if (playerFrameState.isInBoat) {
          playerFrameState.isInBoat = false;
          setInBoat(false);
          if (bodyRef.current) {
            bodyRef.current.setTranslation({ x: playerFrameState.boatX + 3.2, y: 2.2, z: playerFrameState.boatZ }, true);
          }
        } else if (distToBoat < 9.5) {
          playerFrameState.isInBoat = true;
          setInBoat(true);
        }
      }
    };
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
  }, [gl.domElement, setInBoat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const body = bodyRef.current;
    if (!body) return;

    if (teleportTarget) {
      body.setTranslation({ x: teleportTarget[0], y: teleportTarget[1], z: teleportTarget[2] }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      playerFrameState.x = teleportTarget[0];
      playerFrameState.y = teleportTarget[1];
      playerFrameState.z = teleportTarget[2];
      clearTeleport();
      return;
    }

    const forwardInput = (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
                         (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);
    const sideInput = (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
                      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);

    // --- MODE 1: DRIVING THE TUGBOAT (PRD 6.5 & 19.6) ---
    if (playerFrameState.isInBoat) {
      if (Math.abs(sideInput) > 0) {
        playerFrameState.boatYaw -= sideInput * dt * 1.45;
      }
      const moveDist = forwardInput * BOAT_SPEED * dt;
      const nextBx = playerFrameState.boatX - Math.sin(playerFrameState.boatYaw) * moveDist;
      const nextBz = playerFrameState.boatZ - Math.cos(playerFrameState.boatYaw) * moveDist;
      // Prevent boat from driving onto dry land
      if (getTerrainHeight(nextBx, nextBz) < -0.35) {
        playerFrameState.boatX = nextBx;
        playerFrameState.boatZ = nextBz;
      }
      playerFrameState.isMoving = Math.abs(forwardInput) > 0;
      playerFrameState.x = playerFrameState.boatX;
      playerFrameState.y = 1.6;
      playerFrameState.z = playerFrameState.boatZ;
      body.setTranslation({ x: playerFrameState.boatX, y: 1.85, z: playerFrameState.boatZ }, true);
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (visualGroupRef.current) {
        visualGroupRef.current.rotation.y = playerFrameState.boatYaw + Math.PI;
      }
    } else {
      // --- MODE 2: WALKING, RUNNING, OR SWIMMING ---
      const pos = body.translation();
      const vel = body.linvel();

      if (pos.y < -15 || isNaN(pos.y)) {
        const safeY = Math.max(3.5, getTerrainHeight(SAFE_SPAWN[0], SAFE_SPAWN[2]) + 3);
        body.setTranslation({ x: SAFE_SPAWN[0], y: safeY, z: SAFE_SPAWN[2] }, true);
        body.setLinvel({ x: 0, y: 0, z: 0 }, true);
        return;
      }

      const groundY = getTerrainHeight(pos.x, pos.z);
      const footY = pos.y - 0.9;
      const isGrounded = footY <= groundY + 0.35;
      // Enter swim mode when water depth > 1.2m (PRD 6.5)
      const isSwimming = groundY < -1.2 && pos.y <= 0.35;

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
          visualGroupRef.current.rotation.y += diff * Math.min(1, dt * 12);
        }
      }

      const nextX = pos.x + moveDir.x * 0.5;
      const nextZ = pos.z + moveDir.z * 0.5;
      const nextGroundY = getTerrainHeight(nextX, nextZ);
      const climbSlope = (nextGroundY - groundY) / 0.5;
      const slopeFactor = climbSlope > 1.19 ? 0 : 1;

      let nextVy = vel.y;
      if (isSwimming) {
        // Buoyancy keeps player floating cleanly at water surface (Y ≈ 0.0)
        nextVy = (0.05 - pos.y) * 6.0;
      } else {
        if (keys.current["Space"] && isGrounded && vel.y < 1.5) {
          nextVy = JUMP_VELOCITY;
        }
        if (isGrounded && isMoving && climbSlope > 0 && climbSlope <= 1.19) {
          nextVy = Math.max(nextVy, climbSlope * speed * 0.45);
        }
      }

      body.setLinvel({ x: moveDir.x * speed * slopeFactor, y: nextVy, z: moveDir.z * speed * slopeFactor }, true);

      playerFrameState.x = pos.x;
      playerFrameState.y = pos.y;
      playerFrameState.z = pos.z;
      playerFrameState.yaw = orbit.current.yaw;
      playerFrameState.isMoving = isMoving;
      playerFrameState.isRunning = isRunning;
      playerFrameState.isGrounded = isGrounded;
      playerFrameState.isSwimming = isSwimming;
    }

    // Throttled UI sync (position, swim status, and Boat interaction prompt)
    if (state.clock.elapsedTime - lastUiSyncRef.current > 0.2) {
      lastUiSyncRef.current = state.clock.elapsedTime;
      setStorePosition([
        Math.round(playerFrameState.x * 10) / 10,
        Math.round(playerFrameState.y * 10) / 10,
        Math.round(playerFrameState.z * 10) / 10,
      ]);
      setSwimming(playerFrameState.isSwimming);

      const dx = playerFrameState.x - playerFrameState.boatX;
      const dz = playerFrameState.z - playerFrameState.boatZ;
      const distToBoat = Math.sqrt(dx * dx + dz * dz);
      if (playerFrameState.isInBoat) {
        setInteractionPrompt("Tekan E untuk Turun dari Perahu • W/S Maju/Mundur • A/D Belok");
      } else if (distToBoat < 9.5) {
        setInteractionPrompt("Tekan E untuk Naik Perahu Tugboat");
      } else {
        setInteractionPrompt(null);
      }
    }

    // Camera positioning (backs out slightly when driving the boat)
    const effectiveDist = playerFrameState.isInBoat ? Math.max(orbit.current.distance, 8.0) : orbit.current.distance;
    rightVec.set(Math.cos(orbit.current.yaw), 0, -Math.sin(orbit.current.yaw)).normalize();
    const shoulderX = rightVec.x * SHOULDER_OFFSET;
    const shoulderZ = rightVec.z * SHOULDER_OFFSET;
    lookAtTarget.set(playerFrameState.x + shoulderX, playerFrameState.y + 0.65, playerFrameState.z + shoulderZ);

    const horizDist = effectiveDist * Math.cos(orbit.current.pitch);
    const vertDist = effectiveDist * Math.sin(orbit.current.pitch);
    const camX = lookAtTarget.x + Math.sin(orbit.current.yaw) * horizDist;
    const camZ = lookAtTarget.z + Math.cos(orbit.current.yaw) * horizDist;
    let camY = lookAtTarget.y + vertDist;

    const terrainAtCam = Math.max(0.2, getTerrainHeight(camX, camZ));
    if (camY < terrainAtCam + 0.6) camY = terrainAtCam + 0.6;

    targetCamPos.set(camX, camY, camZ);
    const damp = 1 - Math.exp(-10 * dt);
    smoothedCamPos.lerp(targetCamPos, damp);
    smoothedLookAt.lerp(lookAtTarget, damp);

    camera.position.copy(smoothedCamPos);
    camera.lookAt(smoothedLookAt);

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = playerFrameState.isRunning && playerFrameState.isMoving ? 65 : 60;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * 6);
      camera.updateProjectionMatrix();
    }
  });

  return (
    <RigidBody ref={bodyRef} colliders={false} mass={1} type="dynamic" position={SAFE_SPAWN} enabledRotations={[false, false, false]} linearDamping={0.5}>
      <CapsuleCollider args={[0.5, 0.4]} friction={0.1} />
      <group ref={visualGroupRef}>
        <PlayerModel />
      </group>
    </RigidBody>
  );
}
