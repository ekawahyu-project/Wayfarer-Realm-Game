"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";

export default function Mountains() {
  const textures = useMemo(() => getWorldTextures(), []);

  // Placed in the smooth central valley pass with deep stone foundations so zero cabins ever float!
  const cabins = useMemo(() => {
    const coords = [
      { x: -32, z: -365, rot: 0.15 },
      { x: -14, z: -378, rot: -0.2 },
      { x: 14,  z: -372, rot: 0.25 },
      { x: 32,  z: -388, rot: -0.15 },
      { x: -26, z: -405, rot: 0.3 },
      { x: 0,   z: -412, rot: 0.0 },
      { x: 26,  z: -420, rot: -0.25 },
      { x: -16, z: -438, rot: 0.18 },
      { x: 18,  z: -445, rot: -0.2 },
      { x: -36, z: -432, rot: 0.22 },
    ];
    return coords.map((c) => ({ ...c, y: getExactMeshTerrainHeight(c.x, c.z) }));
  }, []);

  const sharedWindowMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#fde68a", emissive: "#f59e0b", emissiveIntensity: 1.5 }),
    []
  );

  useFrame(() => {
    sharedWindowMaterial.emissiveIntensity = 0.35 + globalUniforms.uNightFactor.value * 3.5;
  });

  return (
    <group name="snow-mountain-valley-village">
      {cabins.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} rotation={[0, c.rot, 0]}>
          {/* Deep Stone Foundation Basement extending -2.5m into mountain slope so cabin NEVER floats! */}
          <mesh castShadow receiveShadow position={[0, -0.8, 0]}>
            <boxGeometry args={[6.2, 2.8, 5.4]} />
            <meshStandardMaterial map={textures.villageStone} color="#64748b" roughness={0.92} />
          </mesh>
          {/* Textured Log Cabin Body */}
          <mesh castShadow receiveShadow position={[0, 2.1, 0]}>
            <boxGeometry args={[5.8, 3.6, 4.8]} />
            <meshStandardMaterial map={textures.woodPlanks} color="#7c4d2b" roughness={0.85} />
          </mesh>
          {/* Thick Snow-Draped Pitched Roof & Stone Chimney */}
          <mesh castShadow receiveShadow position={[0, 4.8, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[5.0, 2.8, 4]} />
            <meshStandardMaterial map={textures.snowFrost} color="#f8fafc" roughness={0.7} />
          </mesh>
          <mesh castShadow position={[1.8, 4.6, -1.0]}>
            <boxGeometry args={[0.9, 3.2, 0.9]} />
            <meshStandardMaterial map={textures.villageStone} color="#475569" />
          </mesh>
          {/* Wooden Front Door & Glowing Windows */}
          <mesh castShadow position={[0, 1.4, 2.43]}>
            <boxGeometry args={[1.1, 2.2, 0.12]} />
            <meshStandardMaterial map={textures.woodPlanks} color="#451a03" />
          </mesh>
          <mesh position={[-1.5, 2.1, 2.43]} material={sharedWindowMaterial}><planeGeometry args={[1.0, 1.0]} /></mesh>
          <mesh position={[1.5, 2.1, 2.43]} material={sharedWindowMaterial}><planeGeometry args={[1.0, 1.0]} /></mesh>
          <mesh position={[0, 2.1, -2.43]} rotation={[0, Math.PI, 0]} material={sharedWindowMaterial}><planeGeometry args={[1.4, 1.0]} /></mesh>
        </group>
      ))}
    </group>
  );
}
