"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";

export default function Mountains() {
  const windowMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Generate cozy snow-valley cabins with warm glowing orange windows (Reference Image 2)
  const cabins = useMemo(() => {
    const coords = [
      { x: -45, z: -365, rot: 0.2 },
      { x: -18, z: -380, rot: -0.4 },
      { x: 15, z: -372, rot: 0.5 },
      { x: 42, z: -395, rot: -0.2 },
      { x: -32, z: -415, rot: 0.8 },
      { x: 5, z: -422, rot: 0.1 },
      { x: 35, z: -435, rot: -0.6 },
      { x: -12, z: -452, rot: 0.3 },
      { x: 22, z: -468, rot: -0.3 },
      { x: -55, z: -445, rot: 0.4 },
    ];
    return coords.map((c) => ({
      ...c,
      y: getTerrainHeight(c.x, c.z),
    }));
  }, []);

  useFrame(() => {
    if (windowMatRef.current) {
      // Warm orange glow turns on automatically from dusk to dawn (PRD 5.4)
      const night = globalUniforms.uNightFactor.value;
      windowMatRef.current.emissiveIntensity = 0.2 + night * 3.5;
    }
  });

  const sharedWindowMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fde68a",
        emissive: "#f59e0b",
        emissiveIntensity: 1.5,
      }),
    []
  );

  return (
    <group name="snow-mountain-valley-village">
      {/* Keep material ref synced */}
      <primitive object={sharedWindowMaterial} ref={windowMatRef} attach="userData-windowMat" />

      {cabins.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} rotation={[0, c.rot, 0]}>
          {/* Timber Cabin Body */}
          <mesh castShadow receiveShadow position={[0, 1.8, 0]}>
            <boxGeometry args={[5.2, 3.6, 4.4]} />
            <meshStandardMaterial color="#4a3525" roughness={0.9} />
          </mesh>
          {/* Snow-covered pitched roof */}
          <mesh castShadow receiveShadow position={[0, 4.4, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[4.4, 2.4, 4]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.75} />
          </mesh>
          {/* Warm Glowing Windows (Front & Back) */}
          <mesh position={[-1.2, 1.9, 2.22]} material={sharedWindowMaterial}>
            <planeGeometry args={[0.9, 0.9]} />
          </mesh>
          <mesh position={[1.2, 1.9, 2.22]} material={sharedWindowMaterial}>
            <planeGeometry args={[0.9, 0.9]} />
          </mesh>
          <mesh position={[0, 1.9, -2.22]} rotation={[0, Math.PI, 0]} material={sharedWindowMaterial}>
            <planeGeometry args={[1.1, 0.9]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
