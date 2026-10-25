"use client";

import { resolveWorldCollisions } from "@/game/systems/Physics";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  getWalkableHeight,
  getTerrainHeight,
  getExactMeshTerrainHeight,
  getRiverDistance,
  resolveObstacleCollisions,
  BIOME_CENTERS,
  INTERACTIVE_DOORS,
} from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import { weatherFrameState } from "@/game/state/useWeatherStore";
import { horseLivePositions } from "@/game/world/Wildlife";
import { interactionTargetState } from "@/game/interaction/InteractionSystem";
import PlayerModel from "./PlayerModel";

const WALK_SPEED = 4.4;
const RUN_SPEED = 9.0;
const HORSE_TROT_SPEED = 14.5;
const HORSE_GALLOP_SPEED = 22.0;
const SWIM_SPEED = 5.0;
const BOAT_SPEED = 18.0;
const GRAVITY = 22.0;
const JUMP_VELOCITY = 8.2;
const DEFAULT_CAM_DIST = 4.8;
const MIN_CAM_DIST = 2.2;
const MAX_CAM_DIST = 15.0;
const SHOULDER_OFFSET = 0.35;
const MIN_PITCH = THREE.MathUtils.degToRad(-15);
const MAX_PITCH = THREE.MathUtils.degToRad(68);
const FOOT_OFFSET = 0.76;

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
  const lastPromptRef = useRef<string | null>(null);

  const phys = useRef({
    x: BIOME_CENTERS.westBeach.x,
    y: getWalkableHeight(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z, 5),
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
  const smoothedCamPos = useRef(new THREE.Vector3(-540, 7, 0)).current;
  const smoothedLookAt = useRef(new THREE.Vector3(-532, 5, 0)).current;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "KeyE") {
        const px = phys.current.x, pz = phys.current.z;

        // 1. Doors & Kingdom Gates (< 4.5m)
        for (let i = 0; i < INTERACTIVE_DOORS.length; i++) {
          const d = INTERACTIVE_DOORS[i];
          if (Math.hypot(px - d.x, pz - d.z) < 4.5) {
            d.isOpen = !d.isOpen;
            return;
          }
        }

        // 2. Boat
        const distToBoat = Math.hypot(px - playerFrameState.boatX, pz - playerFrameState.boatZ);
        if (playerFrameState.isInBoat) {
          playerFrameState.isInBoat = false;
          setInBoat(false);
          phys.current.x = playerFrameState.boatX + 4.2;
          phys.current.z = playerFrameState.boatZ;
          phys.current.y = Math.max(0.0, getWalkableHeight(phys.current.x, phys.current.z, phys.current.y));
          return;
        } else if (distToBoat < 14.0 && playerFrameState.mountedHorseIndex === -1) {
          playerFrameState.isInBoat = true;
          setInBoat(true);
          return;
        }

        // 3. Horse Riding
        if (playerFrameState.mountedHorseIndex !== -1) {
          playerFrameState.mountedHorseIndex = -1;
          phys.current.x += 1.2;
          phys.current.y = getWalkableHeight(phys.current.x, phys.current.z, phys.current.y);
          return;
        } else {
          for (let i = 0; i < horseLivePositions.length; i++) {
            const h = horseLivePositions[i];
            if (h && Math.hypot(px - h.x, pz - h.z) < 4.5) {
              playerFrameState.mountedHorseIndex = i;
              playerFrameState.horseYaw = h.yaw;
              phys.current.x = h.x;
              phys.current.z = h.z;
              return;
            }
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    const onMouseDown = () => { isDraggingRef.current = true; };
    const onMouseUp = () => { isDraggingRef.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      const isOverCanvas = e.target === gl.domElement;
      if (document.pointerLockElement !== gl.domElement && !isDraggingRef.current && !isOverCanvas) return;
      if (weatherFrameState.isPhotoMode && !isDraggingRef.current) return;
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
    if ((playerFrameState as any).pendingTeleport) {
      const pt = (playerFrameState as any).pendingTeleport;
      (playerFrameState as any).pendingTeleport = null;
      playerFrameState.mountedHorseIndex = -1;
      playerFrameState.isInBoat = false;
      playerFrameState.x = pt.x;
      playerFrameState.y = pt.y;
      playerFrameState.z = pt.z;
      if (typeof playerPos !== 'undefined' && playerPos.current) playerPos.current.set(pt.x, pt.y, pt.z);
      if (typeof pos !== 'undefined' && pos.current) pos.current.set(pt.x, pt.y, pt.z);
      if (typeof positionRef !== 'undefined' && positionRef.current) positionRef.current.set(pt.x, pt.y, pt.z);
      if (typeof groupRef !== 'undefined' && groupRef.current) groupRef.current.position.set(pt.x, pt.y, pt.z);
      if (typeof playerRef !== 'undefined' && playerRef.current) playerRef.current.position.set(pt.x, pt.y, pt.z);
      state.camera.position.set(pt.x, pt.y + 4.5, pt.z + 8.5);
    }
    const dt = Math.min(delta, 0.05);
    const p = phys.current;

    if (teleportTarget) {
      playerFrameState.mountedHorseIndex = -1;
      playerFrameState.isInBoat = false;
      p.x = teleportTarget[0];
      p.z = teleportTarget[2];
      p.y = Math.max(0.0, getWalkableHeight(p.x, p.z, 25));
      p.vy = 0;
      clearTeleport();
    }

    const forwardInput = (keys.current["KeyW"] || keys.current["ArrowUp"] ? 1 : 0) -
                         (keys.current["KeyS"] || keys.current["ArrowDown"] ? 1 : 0);
    const sideInput = (keys.current["KeyD"] || keys.current["ArrowRight"] ? 1 : 0) -
                      (keys.current["KeyA"] || keys.current["ArrowLeft"] ? 1 : 0);

    if (playerFrameState.isInBoat) {
      if (Math.abs(sideInput) > 0) {
        playerFrameState.boatYaw -= sideInput * dt * 1.65;
      }
      const moveDist = forwardInput * BOAT_SPEED * dt;
      const nextBx = playerFrameState.boatX - Math.sin(playerFrameState.boatYaw) * moveDist;
      const nextBz = playerFrameState.boatZ - Math.cos(playerFrameState.boatYaw) * moveDist;
      if (getTerrainHeight(nextBx, nextBz) < 1.8) {
        playerFrameState.boatX = nextBx;
        playerFrameState.boatZ = nextBz;
      }
      playerFrameState.isMoving = Math.abs(forwardInput) > 0;
      p.x = playerFrameState.boatX + Math.sin(playerFrameState.boatYaw) * 1.8;
      p.z = playerFrameState.boatZ + Math.cos(playerFrameState.boatYaw) * 1.8;
      p.y = 1.15;
      if (visualGroupRef.current) {
        visualGroupRef.current.rotation.y = playerFrameState.boatYaw + Math.PI;
      }
    } else {
      const isRiding = playerFrameState.mountedHorseIndex !== -1;
      const groundY = getWalkableHeight(p.x, p.z, p.y);
      const isSwimming = !isRiding && groundY < -0.7 && p.y <= 0.2;
      const isRunning = Boolean(keys.current["ShiftLeft"] || keys.current["ShiftRight"]) && !isSwimming;
      const speed = isRiding
        ? (isRunning ? HORSE_GALLOP_SPEED : HORSE_TROT_SPEED)
        : isSwimming
        ? SWIM_SPEED
        : isRunning
        ? RUN_SPEED
        : WALK_SPEED;

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
          playerFrameState.horseYaw = visualGroupRef.current.rotation.y;
        }
      }

      let nextX = p.x + moveDir.x * speed * dt;
      let nextZ = p.z + moveDir.z * speed * dt;
      [nextX, nextZ] = resolveObstacleCollisions(nextX, nextZ, isRiding ? 0.75 : 0.55, p.y);

      const dxBoat = nextX - playerFrameState.boatX;
      const dzBoat = nextZ - playerFrameState.boatZ;
      const distBoat = Math.hypot(dxBoat, dzBoat);
      if (distBoat < 4.5 && distBoat > 0.001) {
        nextX = playerFrameState.boatX + (dxBoat / distBoat) * 4.5;
        nextZ = playerFrameState.boatZ + (dzBoat / distBoat) * 4.5;
      }

      p.x = nextX;
      p.z = nextZ;

      const newGroundY = getWalkableHeight(p.x, p.z, p.y);
      if (isSwimming) {
        p.y = THREE.MathUtils.lerp(p.y, -0.35, dt * 8);
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

    // Lock Rider & Horse to the exact same world coordinates so they NEVER separate!
    const mountYOffset = playerFrameState.mountedHorseIndex !== -1 ? FOOT_OFFSET + 0.58 : FOOT_OFFSET;
    if (playerGroupRef.current) {
      playerGroupRef.current.position.set(p.x, p.y + mountYOffset, p.z);
    }

    playerFrameState.x = p.x;
    playerFrameState.y = p.y;
    playerFrameState.z = p.z;
    playerFrameState.yaw = orbit.current.yaw;

    // Throttled UI Sync & Sticky-Free Interaction Prompt Update
    if (state.clock.elapsedTime - lastUiSyncRef.current > 0.18) {
      lastUiSyncRef.current = state.clock.elapsedTime;
      setStorePosition([Math.round(p.x), Math.round(p.y), Math.round(p.z)]);
      setSwimming(playerFrameState.isSwimming);

      let prompt: string | null = null;
      // 1. Collectible
      if (interactionTargetState.nearestCollectibleId) {
        prompt = "✨ Tekan E untuk Mengambil " + interactionTargetState.nearestCollectibleName;
      }
      // 2. NPC Dialogue
      if (!prompt && interactionTargetState.nearestNpc) {
        prompt = "💬 Tekan E untuk Bicara dengan " + interactionTargetState.nearestNpc.name;
      }
      // 3. Doors & Kingdom Gates
      if (!prompt) {
        for (let i = 0; i < INTERACTIVE_DOORS.length; i++) {
          const d = INTERACTIVE_DOORS[i];
          if (Math.hypot(p.x - d.x, p.z - d.z) < 4.5) {
            prompt = "🚪 Tekan E untuk " + (d.isOpen ? "Tutup " : "Buka ") + d.label;
            break;
          }
        }
      }
      // 4. Boat & Horse
      if (!prompt) {
        const distToBoat = Math.hypot(p.x - playerFrameState.boatX, p.z - playerFrameState.boatZ);
        if (playerFrameState.isInBoat) {
          prompt = "⚓ Tekan E untuk Turun dari Perahu • W/S Maju/Mundur • A/D Belok";
        } else if (distToBoat < 14.0) {
          prompt = "🚤 Tekan E untuk Naik Perahu Tugboat";
        } else if (playerFrameState.mountedHorseIndex !== -1) {
          prompt = "🐎 Tekan E untuk Turun dari Kuda • Tahan Shift untuk Lari Kencang";
        } else {
          for (let i = 0; i < horseLivePositions.length; i++) {
            const h = horseLivePositions[i];
            if (h && Math.hypot(p.x - h.x, p.z - h.z) < 4.5) {
              prompt = "🐎 Tekan E untuk Naik Kuda";
              break;
            }
          }
        }
      }

      // ALWAYS update store (including null!) so the prompt NEVER gets stuck on screen!
      if (prompt !== lastPromptRef.current) {
        lastPromptRef.current = prompt;
        setInteractionPrompt(prompt);
      }
    }

    const effectiveDist = playerFrameState.isInBoat
      ? Math.max(orbit.current.distance, 10.5)
      : playerFrameState.mountedHorseIndex !== -1
      ? Math.max(orbit.current.distance, 6.2)
      : orbit.current.distance;
    rightVec.set(Math.cos(orbit.current.yaw), 0, -Math.sin(orbit.current.yaw)).normalize();
    lookAtTarget.set(p.x + rightVec.x * SHOULDER_OFFSET, p.y + (playerFrameState.mountedHorseIndex !== -1 ? 2.0 : 1.4), p.z + rightVec.z * SHOULDER_OFFSET);

    const horizDist = effectiveDist * Math.cos(orbit.current.pitch);
    const vertDist = effectiveDist * Math.sin(orbit.current.pitch);
    const camX = lookAtTarget.x + Math.sin(orbit.current.yaw) * horizDist;
    const camZ = lookAtTarget.z + Math.cos(orbit.current.yaw) * horizDist;
    let camY = lookAtTarget.y + vertDist;

    const rawGroundAtCam = getWalkableHeight(camX, camZ, lookAtTarget.y);
    const isNearRiver = getRiverDistance(camX, camZ) < 20.0;
    const terrainAtCam = isNearRiver ? Math.max(7.85, rawGroundAtCam) : Math.max(0.5, rawGroundAtCam);
    if (camY < terrainAtCam + 0.35) camY = terrainAtCam + 0.35;

    targetCamPos.set(camX, camY, camZ);
    const damp = 1 - Math.exp(-14 * dt);
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
