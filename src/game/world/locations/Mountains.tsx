"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight, addBoxCollider, clearGroupColliders } from "@/utils/noise";
import { useEffect } from "react";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

export default function Mountains() {
  const groupRef = useRef<THREE.Group>(null);
  const textures = useMemo(() => getWorldTextures(), []);

  const chalets = useMemo(() => {
    const coords = [
      { x: -24, z: -345, rot: 0.25, scale: 1.15, isGrandLodge: true },
      { x: 26,  z: -355, rot: -0.3, scale: 1.1,  isGrandLodge: true },
      { x: -28, z: -382, rot: 0.18, scale: 1.05, isGrandLodge: false },
      { x: 24,  z: -392, rot: -0.22, scale: 1.2, isGrandLodge: true },
      { x: -22, z: -418, rot: 0.3,  scale: 1.1,  isGrandLodge: false },
      { x: 22,  z: -428, rot: -0.25, scale: 1.15, isGrandLodge: true },
      { x: 0,   z: -452, rot: 0.0,  scale: 1.25, isGrandLodge: true },
    ];
    return coords.map((c) => ({ ...c, y: getExactMeshTerrainHeight(c.x, c.z) }));
  }, []);

  // Soft Pillowy Snowdrifts (Gundukan Salju Empuk Membulat di Sisi Jalan & Sekitar Rumah seperti Gambar 31)
  const snowDrifts = useMemo(() => {
    const list: { x: number; y: number; z: number; sx: number; sy: number; sz: number }[] = [];
    for (let z = -310; z >= -460; z -= 12) {
      const lx = -12 - (Math.abs(z * 7) % 18);
      const rx = 12 + (Math.abs(z * 11) % 18);
      list.push({ x: lx, y: getExactMeshTerrainHeight(lx, z) - 0.3, z, sx: 6.5, sy: 1.6, sz: 5.5 });
      list.push({ x: rx, y: getExactMeshTerrainHeight(rx, z) - 0.3, z, sx: 6.5, sy: 1.6, sz: 5.5 });
    }
    return list;
  }, []);

  const roadPosts = useMemo(() => {
    const list: { x: number; y: number; z: number; hasLantern: boolean }[] = [];
    for (let z = -315; z >= -445; z -= 16) {
      const curveX = Math.sin(z * 0.025) * 5.0;
      const lx = curveX - 9.0, rx = curveX + 9.0;
      list.push({ x: lx, y: getExactMeshTerrainHeight(lx, z), z, hasLantern: Math.abs(z) % 32 === 15 });
      list.push({ x: rx, y: getExactMeshTerrainHeight(rx, z), z, hasLantern: Math.abs(z) % 32 === 31 });
    }
    return list;
  }, []);

  const warmRedOrangeWindowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#fed7aa", emissive: "#ea580c", emissiveIntensity: 2.2 }),
    []
  );
  const flameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 3.0 }),
    []
  );
  const softSnowMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f8fbff", emissive: "#cfe2f7", emissiveIntensity: 0.12, roughness: 0.65 }),
    []
  );
  const darkTimberMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#334155", roughness: 0.85 }),
    [textures.woodPlanks]
  );

  useEffect(() => {
    clearGroupColliders("mountains");
    chalets.forEach((c) => {
      addBoxCollider(c.x, c.z, 10.2 * c.scale, 8.2 * c.scale, "mountains");
    });
  }, [chalets]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = playerFrameState.z < -130;
    }
    warmRedOrangeWindowMat.emissiveIntensity = 1.4 + globalUniforms.uNightFactor.value * 3.0;
  });

  return (
    <group ref={groupRef} name="alpine-snow-chalet-village">
      {/* Soft Pillowy Snowdrifts along the Road & Chalets (Reference Image 31) */}
      {snowDrifts.map((d, idx) => (
        <mesh key={"drift" + idx} position={[d.x, d.y, d.z]} scale={[d.sx, d.sy, d.sz]} receiveShadow material={softSnowMat}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}

      {/* Snow-Capped Wooden Fences & Glowing Road Lanterns */}
      {roadPosts.map((p, idx) => (
        <group key={idx} position={[p.x, p.y, p.z]}>
          <mesh position={[0, 0.85, 0]} material={darkTimberMat}><cylinderGeometry args={[0.18, 0.22, 1.9, 8]} /></mesh>
          <mesh position={[0, 1.88, 0]} scale={[1.2, 0.9, 1.2]} material={softSnowMat}><sphereGeometry args={[0.24, 10, 8]} /></mesh>
          <mesh position={[0, 1.2, -8.0]} material={darkTimberMat}><boxGeometry args={[0.12, 0.14, 16.0]} /></mesh>
          <mesh position={[0, 1.32, -8.0]} scale={[1, 0.8, 1]} material={softSnowMat}><boxGeometry args={[0.18, 0.14, 16.0]} /></mesh>
          {p.hasLantern && (
            <mesh position={[0, 2.22, 0]} material={flameMat}><sphereGeometry args={[0.24, 8, 8]} /></mesh>
          )}
        </group>
      ))}

      {/* Cozy Alpine Snow Chalets with Thick Rounded Pillowy Snow Roofs (Reference Image 31) */}
      {chalets.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} rotation={[0, c.rot, 0]} scale={[c.scale, c.scale, c.scale]}>
          <mesh position={[0, -1.2, 0]}>
            <boxGeometry args={[10.5, 3.2, 8.5]} />
            <meshStandardMaterial map={textures.villageStone} color="#475569" roughness={0.9} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 2.4, 0]} material={darkTimberMat}>
            <boxGeometry args={[9.6, 4.4, 7.6]} />
          </mesh>
          {/* Steep Roof Base + Rounded Pillowy Snow Overhang Cushion */}
          <mesh castShadow receiveShadow position={[0, 6.2, 0]} rotation={[0, Math.PI / 4, 0]} material={softSnowMat}>
            <coneGeometry args={[8.4, 4.4, 4]} />
          </mesh>
          <mesh position={[0, 5.2, 0]} scale={[5.6, 1.6, 4.6]} material={softSnowMat}>
            <sphereGeometry args={[1.0, 14, 10]} />
          </mesh>

          {c.isGrandLodge && (
            <group position={[-5.8, 0, 1.2]}>
              <mesh position={[0, 1.8, 0]} material={darkTimberMat}><boxGeometry args={[5.2, 3.4, 5.8]} /></mesh>
              <mesh position={[0, 4.6, 0]} rotation={[0, Math.PI / 4, 0]} material={softSnowMat}><coneGeometry args={[4.8, 3.6, 4]} /></mesh>
              <mesh position={[0, 3.8, 0]} scale={[3.2, 1.2, 3.4]} material={softSnowMat}><sphereGeometry args={[1.0, 12, 10]} /></mesh>
              <mesh position={[0, 1.8, 2.94]} material={warmRedOrangeWindowMat}><planeGeometry args={[2.2, 1.4]} /></mesh>
            </group>
          )}

          <mesh position={[2.4, 6.8, -1.2]}>
            <boxGeometry args={[1.2, 4.5, 1.2]} />
            <meshStandardMaterial map={textures.villageStone} color="#334155" />
          </mesh>
          <mesh position={[-2.2, 2.3, 3.84]} material={warmRedOrangeWindowMat}><planeGeometry args={[1.8, 1.3]} /></mesh>
          <mesh position={[2.2, 2.3, 3.84]} material={warmRedOrangeWindowMat}><planeGeometry args={[1.8, 1.3]} /></mesh>
          <mesh position={[0, 5.0, 3.3]} material={flameMat}><planeGeometry args={[1.5, 1.2]} /></mesh>
          <mesh position={[0, 2.3, -3.84]} rotation={[0, Math.PI, 0]} material={warmRedOrangeWindowMat}><planeGeometry args={[2.6, 1.3]} /></mesh>
        </group>
      ))}
    </group>
  );
}
