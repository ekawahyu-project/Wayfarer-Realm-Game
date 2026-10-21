"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight, addBoxCollider, clearGroupColliders, INTERACTIVE_DOORS } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

const SHRINE_X = -310;
const SHRINE_Z = -312;
const LEAF_COUNT = 120;
const FIREFLY_COUNT = 60;

function ToriiGate({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[-2.8, 3.0, 0]}><cylinderGeometry args={[0.28, 0.34, 6.0, 10]} /><meshStandardMaterial color="#b91c1c" roughness={0.55} /></mesh>
      <mesh position={[2.8, 3.0, 0]}><cylinderGeometry args={[0.28, 0.34, 6.0, 10]} /><meshStandardMaterial color="#b91c1c" roughness={0.55} /></mesh>
      <mesh position={[-2.8, 0.45, 0]}><cylinderGeometry args={[0.42, 0.46, 0.9, 10]} /><meshStandardMaterial color="#18181b" /></mesh>
      <mesh position={[2.8, 0.45, 0]}><cylinderGeometry args={[0.42, 0.46, 0.9, 10]} /><meshStandardMaterial color="#18181b" /></mesh>
      <mesh position={[0, 4.55, 0]}><boxGeometry args={[7.2, 0.35, 0.35]} /><meshStandardMaterial color="#991b1b" /></mesh>
      <mesh position={[0, 5.75, 0]}><boxGeometry args={[8.8, 0.45, 0.6]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 5.15, 0]}><boxGeometry args={[0.6, 0.95, 0.28]} /><meshStandardMaterial color="#fbbf24" metalness={0.6} /></mesh>
    </group>
  );
}

export default function Shrine() {
  const baseY = 18.5;
  const groupRef = useRef<THREE.Group>(null);
  const shojiLeftRef = useRef<THREE.Group>(null);
  const shojiRightRef = useRef<THREE.Group>(null);
  const leafMeshRef = useRef<THREE.InstancedMesh>(null);
  const fireflyMeshRef = useRef<THREE.InstancedMesh>(null);
  const textures = useMemo(() => getWorldTextures(), []);

  const sharedShojiMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef3c7", emissive: "#f59e0b", emissiveIntensity: 1.8 }), []);
  const sharedLanternMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffedd5", emissive: "#ea580c", emissiveIntensity: 2.5 }), []);
  const vermilionMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#b91c1c", roughness: 0.5 }), []);
  const darkWoodMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#1e293b", roughness: 0.75 }), [textures.woodPlanks]);
  const tatamiMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a3b18a", roughness: 0.85 }), []);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.85, roughness: 0.2 }), []);

  // Register Enterable Shrine Walls & Sliding Shoji Entrance Door!
  useEffect(() => {
    clearGroupColliders("shrine");
    // Back Wall, Left Wall, Right Wall, Front-Left & Front-Right Walls
    addBoxCollider(SHRINE_X, SHRINE_Z - 7.5, 24.0, 1.0, "shrine");
    addBoxCollider(SHRINE_X - 11.5, SHRINE_Z, 1.0, 15.0, "shrine");
    addBoxCollider(SHRINE_X + 11.5, SHRINE_Z, 1.0, 15.0, "shrine");
    addBoxCollider(SHRINE_X - 7.2, SHRINE_Z + 7.5, 9.5, 1.0, "shrine");
    addBoxCollider(SHRINE_X + 7.2, SHRINE_Z + 7.5, 9.5, 1.0, "shrine");

    INTERACTIVE_DOORS.push({
      group: "shrine",
      id: "shrine_main_door",
      x: SHRINE_X,
      y: baseY + 0.8,
      z: SHRINE_Z + 7.5,
      rotY: 0,
      width: 4.8,
      height: 4.0,
      isOpen: true, // Welcomes player inside, can be toggled with E!
      label: "Pintu Utama Kuil Maple",
    });
  }, []);

  const stoneLanterns = useMemo(() => {
    const coords = [[-4.8, -264], [4.8, -264], [-4.8, -276], [4.8, -276], [-4.8, -288], [4.8, -288], [-7.5, -298], [7.5, -298]];
    return coords.map(([dx, z]) => ({ x: SHRINE_X + dx, y: getExactMeshTerrainHeight(SHRINE_X + dx, z), z }));
  }, []);

  const { leaves, fireflies } = useMemo(() => ({
    leaves: Array.from({ length: LEAF_COUNT }).map((_, i) => ({ x: SHRINE_X + ((i * 37) % 70) - 35, y: baseY + ((i * 19) % 18) + 1, z: SHRINE_Z + ((i * 53) % 70) - 25, speed: 0.9 + (i % 7) * 0.22, phase: i * 0.7 })),
    fireflies: Array.from({ length: FIREFLY_COUNT }).map((_, i) => ({ x: SHRINE_X + ((i * 29) % 50) - 25, y: baseY + 0.6 + ((i * 13) % 5), z: SHRINE_Z + ((i * 41) % 60) - 15, phase: i * 1.3 })),
  }), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    // Smart Distance Culling: Skip particle loops if player is > 240m away from Shrine!
    const distToPlayer = Math.hypot(playerFrameState.x - SHRINE_X, playerFrameState.z - SHRINE_Z);
    if (groupRef.current) groupRef.current.visible = distToPlayer < 320;
    if (distToPlayer > 240) return;

    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const night = globalUniforms.uNightFactor.value;
    const blood = globalUniforms.uBloodMoon.value;
    sharedShojiMat.emissiveIntensity = 0.55 + night * (2.2 + blood * 1.8);
    sharedLanternMat.emissiveIntensity = 0.75 + night * (3.2 + blood * 2.0);

    // Animate sliding Shoji entrance doors
    const sDoor = INTERACTIVE_DOORS.find((d) => d.id === "shrine_main_door");
    if (sDoor && shojiLeftRef.current && shojiRightRef.current) {
      const slideX = sDoor.isOpen ? 2.2 : 0.0;
      shojiLeftRef.current.position.x = THREE.MathUtils.lerp(shojiLeftRef.current.position.x, -1.25 - slideX, dt * 8);
      shojiRightRef.current.position.x = THREE.MathUtils.lerp(shojiRightRef.current.position.x, 1.25 + slideX, dt * 8);
    }

    if (leafMeshRef.current) {
      for (let i = 0; i < LEAF_COUNT; i++) {
        const l = leaves[i];
        const fallY = ((l.y - t * l.speed) % 16 + 16) % 16;
        dummy.position.set(l.x + Math.sin(t * 1.6 + l.phase) * 1.8, baseY + fallY, l.z + Math.cos(t * 1.3 + l.phase) * 1.4);
        dummy.rotation.set(t * 1.5 + l.phase, t * 1.1, Math.sin(t + l.phase));
        dummy.scale.set(0.28, 0.28, 0.28);
        dummy.updateMatrix();
        leafMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      leafMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (fireflyMeshRef.current) {
      const s = night > 0.1 ? 0.085 : 0.001;
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        const f = fireflies[i];
        const pulse = s * (0.6 + 0.4 * Math.sin(t * 3.5 + f.phase));
        dummy.position.set(f.x + Math.sin(t * 0.8 + f.phase) * 1.5, f.y + Math.sin(t * 1.9 + f.phase) * 0.7, f.z + Math.cos(t * 0.7 + f.phase) * 1.5);
        dummy.scale.set(pulse, pulse, pulse);
        dummy.updateMatrix();
        fireflyMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      fireflyMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} name="enterable-maple-shrine">
      <ToriiGate position={[SHRINE_X, getExactMeshTerrainHeight(SHRINE_X, SHRINE_Z + 44), SHRINE_Z + 44]} scale={1.15} />
      <ToriiGate position={[SHRINE_X, baseY, SHRINE_Z + 22]} scale={1.08} />

      {stoneLanterns.map((l, idx) => (
        <group key={idx} position={[l.x, l.y, l.z]}>
          <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.22, 0.34, 1.8, 6]} /><meshStandardMaterial color="#4b5563" /></mesh>
          <mesh position={[0, 2.0, 0]} material={sharedLanternMat}><boxGeometry args={[0.5, 0.54, 0.5]} /></mesh>
          <mesh position={[0, 2.48, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.68, 0.48, 4]} /><meshStandardMaterial color="#374151" /></mesh>
        </group>
      ))}

      {/* Enterable Multi-Tiered Japanese Pagoda Shrine with Detailed Sacred Interior */}
      <group position={[SHRINE_X, baseY, SHRINE_Z]}>
        {/* Walkable Stone Foundation & Front Steps */}
        <mesh receiveShadow position={[0, 0.4, 0]}><boxGeometry args={[26, 0.8, 17]} /><meshStandardMaterial map={textures.villageStone} color="#475569" /></mesh>
        <mesh receiveShadow position={[0, 0.35, 10.5]} rotation={[-0.14, 0, 0]}><boxGeometry args={[8.5, 0.6, 5.5]} /><meshStandardMaterial map={textures.villageStone} color="#64748b" /></mesh>

        {/* Interior Tatami Mat Floor & Wooden Border */}
        <mesh receiveShadow position={[0, 0.82, 0]} material={tatamiMat}><boxGeometry args={[22.8, 0.08, 14.8]} /></mesh>

        {/* Hollow Shrine Exterior Walls (Back, Left, Right, Front-Left, Front-Right) */}
        <mesh castShadow receiveShadow position={[0, 3.6, -7.5]} material={darkWoodMat}><boxGeometry args={[24.0, 5.6, 0.6]} /></mesh>
        <mesh castShadow receiveShadow position={[-11.7, 3.6, 0]} material={darkWoodMat}><boxGeometry args={[0.6, 5.6, 15.0]} /></mesh>
        <mesh castShadow receiveShadow position={[11.7, 3.6, 0]} material={darkWoodMat}><boxGeometry args={[0.6, 5.6, 15.0]} /></mesh>
        <mesh castShadow receiveShadow position={[-7.2, 3.6, 7.5]} material={darkWoodMat}><boxGeometry args={[9.5, 5.6, 0.6]} /></mesh>
        <mesh castShadow receiveShadow position={[7.2, 3.6, 7.5]} material={darkWoodMat}><boxGeometry args={[9.5, 5.6, 0.6]} /></mesh>
        <mesh position={[0, 5.5, 7.5]} material={darkWoodMat}><boxGeometry args={[5.2, 1.8, 0.6]} /></mesh>

        {/* Sliding Shoji Entrance Doors (Open/Close with E!) */}
        <group ref={shojiLeftRef} position={[-1.25, 2.7, 7.5]}>
          <mesh material={sharedShojiMat}><boxGeometry args={[2.4, 3.8, 0.16]} /></mesh>
        </group>
        <group ref={shojiRightRef} position={[1.25, 2.7, 7.5]}>
          <mesh material={sharedShojiMat}><boxGeometry args={[2.4, 3.8, 0.16]} /></mesh>
        </group>

        {/* Glowing Shoji Windows along Front & Sides */}
        {[-9, -6, 6, 9].map((wx, i) => (
          <mesh key={i} position={[wx, 3.4, 7.85]} material={sharedShojiMat}><planeGeometry args={[1.8, 2.6]} /></mesh>
        ))}

        {/* --- DETAILED SACRED SHRINE INTERIOR --- */}
        {/* 1. 8 Vermilion Lacquered Columns inside Hall */}
        {[-7.5, -3.5, 3.5, 7.5].map((cx, i) => (
          <group key={i}>
            <mesh position={[cx, 3.6, -2.5]} material={vermilionMat}><cylinderGeometry args={[0.32, 0.35, 5.5, 10]} /></mesh>
            <mesh position={[cx, 3.6, 3.0]} material={vermilionMat}><cylinderGeometry args={[0.32, 0.35, 5.5, 10]} /></mesh>
          </group>
        ))}

        {/* 2. Elevated Sacred Sanctuary Altar (Butsudan / Kami Altar) at Back Wall */}
        <group position={[0, 0.85, -5.2]}>
          <mesh position={[0, 0.6, 0]} material={darkWoodMat}><boxGeometry args={[9.5, 1.2, 3.2]} /></mesh>
          <mesh position={[0, 1.25, 0]} material={vermilionMat}><boxGeometry args={[8.8, 0.15, 2.8]} /></mesh>
          {/* Golden Sacred Mirror (Yata no Kagami) & Golden Guardian Statue */}
          <mesh position={[0, 2.6, -0.4]} material={goldMat}><cylinderGeometry args={[1.1, 1.1, 0.12, 16]} rotation={[Math.PI / 2, 0, 0]} /></mesh>
          <mesh position={[0, 2.1, 0.3]} material={goldMat}><cylinderGeometry args={[0.38, 0.52, 1.6, 10]} /></mesh>
          <mesh position={[0, 3.1, 0.3]} material={goldMat}><sphereGeometry args={[0.32, 10, 10]} /></mesh>
          {/* Left & Right Golden Candle Stands */}
          <mesh position={[-2.8, 2.0, 0.4]} material={sharedLanternMat}><cylinderGeometry args={[0.15, 0.22, 1.4, 8]} /></mesh>
          <mesh position={[2.8, 2.0, 0.4]} material={sharedLanternMat}><cylinderGeometry args={[0.15, 0.22, 1.4, 8]} /></mesh>
        </group>

        {/* 3. Offering Table (Saisen-bako), Incense Burner & Sake Barrels (Kazaridaru) */}
        <mesh position={[0, 1.35, -1.2]} material={vermilionMat}><boxGeometry args={[3.2, 0.9, 1.4]} /></mesh>
        <mesh position={[0, 1.95, -1.2]} material={goldMat}><cylinderGeometry args={[0.32, 0.26, 0.4, 10]} /></mesh>
        {[-8.8, 8.8].map((sx, sIdx) => (
          <group key={sIdx} position={[sx, 1.6, -4.8]}>
            <mesh position={[-0.7, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 1.3, 10]} /><meshStandardMaterial color="#fef3c7" /></mesh>
            <mesh position={[0.7, 0, 0]}><cylinderGeometry args={[0.55, 0.55, 1.3, 10]} /><meshStandardMaterial color="#fef3c7" /></mesh>
            <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.55, 0.55, 1.3, 10]} /><meshStandardMaterial color="#dc2626" /></mesh>
          </group>
        ))}

        {/* 4. Hanging Glowing Chochin Paper Lanterns inside Hall */}
        {[-5.5, 0, 5.5].map((lx, lIdx) => (
          <mesh key={lIdx} position={[lx, 5.2, 0.5]} material={sharedLanternMat}>
            <sphereGeometry args={[0.48, 10, 10]} />
          </mesh>
        ))}

        {/* Pagoda Upper Tier Roofs */}
        <mesh castShadow position={[0, 7.6, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[18.8, 3.6, 4]} /><meshStandardMaterial color="#0f172a" roughness={0.7} /></mesh>
        <mesh position={[0, 10.4, 0]} material={darkWoodMat}><boxGeometry args={[14.0, 3.6, 9.2]} /></mesh>
        {[-3.6, 0, 3.6].map((wx, i) => (
          <mesh key={i} position={[wx, 10.4, 4.65]} material={sharedShojiMat}><planeGeometry args={[1.9, 2.1]} /></mesh>
        ))}
        <mesh castShadow position={[0, 13.5, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[12.8, 3.8, 4]} /><meshStandardMaterial color="#0f172a" roughness={0.7} /></mesh>
      </group>

      <instancedMesh ref={leafMeshRef} args={[undefined, undefined, LEAF_COUNT]} frustumCulled={false}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={fireflyMeshRef} args={[undefined, undefined, FIREFLY_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#7dd3fc" />
      </instancedMesh>
    </group>
  );
}
