"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";

const VILLAGE_X = 360;
const VILLAGE_Z = 0;

export default function Village() {
  const centerY = useMemo(() => getTerrainHeight(VILLAGE_X, VILLAGE_Z), []);
  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 1.5 }), []);

  useFrame(() => {
    windowMaterial.emissiveIntensity = 0.25 + globalUniforms.uNightFactor.value * 3.4;
  });

  const houses = useMemo(() => {
    const specs = [
      { dx: -26, dz: -18, rotY: 0.45, scale: 1.05, hasTower: true },
      { dx: 28, dz: -20, rotY: -0.5, scale: 1.0, hasTower: true },
      { dx: -32, dz: 22, rotY: 2.3, scale: 0.95, hasTower: false },
      { dx: 30, dz: 24, rotY: -2.4, scale: 1.1, hasTower: true },
      { dx: 0, dz: -38, rotY: 0.0, scale: 1.15, hasTower: true },
      { dx: -52, dz: 2, rotY: 1.4, scale: 0.95, hasTower: false },
      { dx: 54, dz: 4, rotY: -1.5, scale: 1.0, hasTower: false },
      { dx: -14, dz: 46, rotY: 3.0, scale: 1.05, hasTower: false },
      { dx: 18, dz: 48, rotY: -2.9, scale: 0.95, hasTower: false },
      { dx: 48, dz: -42, rotY: -0.8, scale: 0.9, hasTower: false },
    ];
    return specs.map((h) => ({ ...h, x: VILLAGE_X + h.dx, y: getTerrainHeight(VILLAGE_X + h.dx, VILLAGE_Z + h.dz), z: VILLAGE_Z + h.dz }));
  }, []);

  return (
    <group name="medieval-village-biome">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[VILLAGE_X, centerY + 0.06, VILLAGE_Z]} receiveShadow>
        <circleGeometry args={[22, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>
      <RigidBody type="fixed" colliders="cuboid" position={[VILLAGE_X, centerY, VILLAGE_Z]}>
        <group>
          <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
            <cylinderGeometry args={[1.6, 1.8, 1.4, 12]} />
            <meshStandardMaterial color="#475569" roughness={0.9} />
          </mesh>
          <mesh castShadow position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[2.3, 1.3, 4]} />
            <meshStandardMaterial color="#991b1b" roughness={0.8} />
          </mesh>
        </group>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid" position={[VILLAGE_X - 10, centerY + 0.6, VILLAGE_Z + 12]} rotation={[0, 0.35, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[9.5, 0.35, 2.8]} />
          <meshStandardMaterial color="#6b4226" roughness={0.88} />
        </mesh>
      </RigidBody>
      {[[VILLAGE_X - 18, VILLAGE_Z + 6], [VILLAGE_X + 16, VILLAGE_Z - 8], [VILLAGE_X - 8, VILLAGE_Z - 22]].map(([tx, tz], idx) => (
        <RigidBody key={idx} type="fixed" colliders="hull" position={[tx, getTerrainHeight(tx, tz), tz]}>
          <group>
            <mesh castShadow receiveShadow position={[0, 5.5, 0]}>
              <cylinderGeometry args={[0.95, 1.55, 11.5, 9]} />
              <meshStandardMaterial color="#5c4028" roughness={0.92} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 12.2, 0]}>
              <dodecahedronGeometry args={[5.5, 1]} />
              <meshStandardMaterial color="#366938" roughness={0.8} />
            </mesh>
          </group>
        </RigidBody>
      ))}
      {houses.map((h, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid" position={[h.x, h.y, h.z]} rotation={[0, h.rotY, 0]}>
          <group scale={[h.scale, h.scale, h.scale]}>
            <mesh castShadow receiveShadow position={[0, 2.0, 0]}>
              <boxGeometry args={[8.4, 4.0, 6.8]} />
              <meshStandardMaterial color="#64748b" roughness={0.9} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 5.6, 0]}>
              <boxGeometry args={[9.2, 3.6, 7.4]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.82} />
            </mesh>
            <mesh castShadow position={[0, 3.9, 0]}>
              <boxGeometry args={[9.45, 0.32, 7.65]} />
              <meshStandardMaterial color="#5c3a21" roughness={0.88} />
            </mesh>
            <mesh castShadow position={[0, 7.35, 0]}>
              <boxGeometry args={[9.45, 0.32, 7.65]} />
              <meshStandardMaterial color="#5c3a21" roughness={0.88} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 9.3, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[7.4, 4.0, 4]} />
              <meshStandardMaterial color="#9f1239" roughness={0.78} />
            </mesh>
            {h.hasTower && (
              <group position={[3.8, 0, 2.2]}>
                <mesh castShadow receiveShadow position={[0, 4.8, 0]}>
                  <boxGeometry args={[4.2, 9.6, 4.2]} />
                  <meshStandardMaterial color="#64748b" roughness={0.88} />
                </mesh>
                <mesh castShadow receiveShadow position={[0, 11.0, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[3.6, 3.2, 4]} />
                  <meshStandardMaterial color="#881337" roughness={0.78} />
                </mesh>
                <mesh position={[0, 7.2, 2.13]} material={windowMaterial}>
                  <planeGeometry args={[1.1, 1.3]} />
                </mesh>
              </group>
            )}
            <mesh position={[-2.2, 5.6, 3.73]} material={windowMaterial}><planeGeometry args={[1.8, 1.3]} /></mesh>
            <mesh position={[1.8, 5.6, 3.73]} material={windowMaterial}><planeGeometry args={[1.8, 1.3]} /></mesh>
            <mesh position={[-2.2, 2.2, 3.43]} material={windowMaterial}><planeGeometry args={[1.4, 1.2]} /></mesh>
          </group>
        </RigidBody>
      ))}
    </group>
  );
}
