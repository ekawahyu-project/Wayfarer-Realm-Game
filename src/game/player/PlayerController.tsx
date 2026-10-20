"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls, button } from "leva";
import * as THREE from "three";
import { getWalkableHeight, resolveObstacleCollisions, BIOME_CENTERS } from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import { weatherFrameState } from "@/game/state/useWeatherStore";
import PlayerModel from "./PlayerModel";

const WALK_SPEED = 3.6;
const RUN_SPEED = 7.8;
const SWIM_SPEED = 4.2;
const BOAT_SPEED = 14.0;
const GRAVITY = 20.0;
const JUMP_VELOCITY = 7.5;
const DEFAULT_CAM_DIST = 4.8;
const MIN_CAM_DIST = 2.2;
const MAX_CAM_DIST = 12.0;
const SHOULDER_OFFSET = 0.35;
const MIN_PITCH = THREE.MathUtils.degToRad(-15);
const MAX_PITCH = THREE.MathUtils.degToRad(68);

export default function PlayerController() {
  const playerGroupRef = useRef<THREE.Group>(null);
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

  // Pure analytical position & velocity (never freezes or falls through ground!)
  const phys = useRef({
    x: BIOME_CENTERS.westBeach.x,
    y: getWalkableHeight(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z),
    z: BIOME_CENTERS.westBeach.z,
    vy: 0,
    isGrounded: true,
  });

  const keys = useRef<Record<string, boolean>>({});
  const isDraggingRef = useRef(false);
  const orbit = useRef({
    yaw: -Math.PI / 2,
    pitch: 0.24,
    distance: DEFAULT_CAM_DIST,
  });

  const forwardVec = useRef(new THREE.Vector3()).current;
  const rightVec = useRef(new THREE.Vector3()).current;
  const moveDir = useRef(new THREE.Vector3()).current;
  const targetCamPos = useRef(new THREE.Vector3()).current;
  const lookAtTarget = useRef(new THREE.Vector3()).current;
  const smoothedCamPos = useRef(new THREE.Vector3(-582, 8, 0)).current;
  const smoothedLookAt = useRef(new THREE.Vector3(-575, 5, 0)).current;

  const teleportTo = (x: number, z: number) => {
    playerFrameState.isInBoat = false;
    setInBoat(false);
    const y = Math.max(0.0, getWalkableHeight(x, z));
    requestTeleport([x, y, z]);
  };

  useControls("Teleport Lokasi (Anti-Stuck)", {
    "1. Pantai Barat & Dermaga": button(() => teleportTo(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z)),
    "2. Persimpangan Rumput": button(() => teleportTo(BIOME_CENTERS.centralMeadow.x, BIOME_CENTERS.centralMeadow.z)),
    "3. Desa Medieval (Timur)": button(() => teleportTo(BIOME_CENTERS.eastVillage.x, BIOME_CENTERS.eastVillage.z)),
    "4. Kota Kerajaan (Selatan)": button(() => teleportTo(BIOME_CENTERS.southKingdom.x, BIOME_CENTERS.southKingdom.z)),
    "5. Pelabuhan Selatan": button(() => teleportTo(BIOME_CENTERS.southHarbor.x, BIOME_CENTERS.southHarbor.z)),
    "6. Kuil Maple (Barat Laut)": button(() => teleportTo(BIOME_CENTERS.nwShrine.x, BIOME_CENTERS.nwShrine.z)),
    "7. Lembah Salju & Aurora": button(() => teleportTo(BIOME_CENTERS.northMountains.x, BIOME_CENTERS.northMountains.z)),
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "KeyE") {
        const dx = phys.current.x - playerFrameState.boatX;
        const dz = phys.current.z - playerFrameState.boatZ;
        const distToBoat = Math.hypot(dx, dz);
        if (playerFrameState.isInBoat) {
          playerFrameState.isInBoat = false;
          setInBoat(false);
          // Place player safely on dock or beside boat
          phys.current.x = playerFrameState.boatX + 3.5;
          phys.current.z = playerFrameState.boatZ;
          phys.current.y = Math.max(0.0, getWalkableHeight(phys.current.x, phys.current.z));
        } else if (distToBoat < 11.0) {
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

    // --- MODE 1: MENGEMUDI PERAHU TUGBOAT (Anti-Tembus Pantai & Dermaga) ---
    if (playerFrameState.isInBoat) {
      if (Math.abs(sideInput) > 0) {
        playerFrameState.boatYaw -= sideInput * dt * 1.5;
      }
      const moveDist = forwardInput * BOAT_SPEED * dt;
      const nextBx = playerFrameState.boatX - Math.sin(playerFrameState.boatYaw) * moveDist;
      const nextBz = playerFrameState.boatZ - Math.cos(playerFrameState.boatYaw) * moveDist;
      // Perahu hanya boleh bergerak di air dengan kedalaman memadai (< -0.4m)
      if (getWalkableHeight(nextBx, nextBz) < -0.4) {
        playerFrameState.boatX = nextBx;
        playerFrameState.boatZ = nextBz;
      }
      playerFrameState.isMoving = Math.abs(forwardInput) > 0;
      p.x = playerFrameState.boatX;
      p.y = 1.45;
      p.z = playerFrameState.boatZ;
      if (visualGroupRef.current) {
        visualGroupRef.current.rotation.y = playerFrameState.boatYaw + Math.PI;
      }
    } else {
      // --- MODE 2: JALAN, LARI, LOMPAT & BERENANG ---
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
      // Cegah tembus bangunan, menara, atau sumur
      [nextX, nextZ] = resolveObstacleCollisions(nextX, nextZ, 0.6);

      // Cegah karakter menabrak perahu saat jalan/berenang di dekatnya
      const dxBoat = nextX - playerFrameState.boatX;
      const dzBoat = nextZ - playerFrameState.boatZ;
      const distBoat = Math.hypot(dxBoat, dzBoat);
      if (distBoat < 3.6 && distBoat > 0.001) {
        nextX = playerFrameState.boatX + (dxBoat / distBoat) * 3.6;
        nextZ = playerFrameState.boatZ + (dzBoat / distBoat) * 3.6;
      }

      p.x = nextX;
      p.z = nextZ;

      const newGroundY = getWalkableHeight(p.x, p.z);

      if (isSwimming) {
        p.y = THREE.MathUtils.lerp(p.y, -0.15, dt * 8);
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

    // Sync visual group (feet sit at p.y, center of model is +0.9m above feet)
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(p.x, p.y + 0.9, p.z);
    }

    playerFrameState.x = p.x;
    playerFrameState.y = p.y + 0.9;
    playerFrameState.z = p.z;
    playerFrameState.yaw = orbit.current.yaw;

    if (state.clock.elapsedTime - lastUiSyncRef.current > 0.25) {
      lastUiSyncRef.current = state.clock.elapsedTime;
      setStorePosition([Math.round(p.x), Math.round(p.y), Math.round(p.z)]);
      setSwimming(playerFrameState.isSwimming);

      const distToBoat = Math.hypot(p.x - playerFrameState.boatX, p.z - playerFrameState.boatZ);
      if (playerFrameState.isInBoat) {
        setInteractionPrompt("Tekan E untuk Turun dari Perahu • W/S Maju/Mundur • A/D Belok");
      } else if (distToBoat < 11.0) {
        setInteractionPrompt("Tekan E untuk Naik Perahu Tugboat");
      }
    }

    // Smooth 3rd Person Camera
    const effectiveDist = playerFrameState.isInBoat ? Math.max(orbit.current.distance, 8.5) : orbit.current.distance;
    rightVec.set(Math.cos(orbit.current.yaw), 0, -Math.sin(orbit.current.yaw)).normalize();
    lookAtTarget.set(
      p.x + rightVec.x * SHOULDER_OFFSET,
      p.y + 1.55,
      p.z + rightVec.z * SHOULDER_OFFSET
    );

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
    <group ref={playerGroupRef} position={[BIOME_CENTERS.westBeach.x, 5, BIOME_CENTERS.westBeach.z]}>
      <group ref={visualGroupRef}>
        <PlayerModel />
      </group>
    </group>
  );
}
