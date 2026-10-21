"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";

const VILLAGE_X = 360;
const VILLAGE_Z = 0;

export default function Village() {
  const centerY = useMemo(() => getTerrainHeight(VILLAGE_X, VILLAGE_Z), []);
  const textures = useMemo(() => getWorldTextures(), []);

  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 2.0 }), []);

  useFrame(() => {
    windowMaterial.emissiveIntensity = 0.55 + globalUniforms.uNightFactor.value * 3.5;
  });

  // Dense two-sided medieval village street layout matching Reference Image 4 (Source 16)
  const houses = useMemo(() => {
    const specs = [
      { dx: -24, dz: -18, rotY: 0.12, scale: 1.15, stories: 3, hasTower: true },
      { dx: 2,   dz: -20, rotY: -0.08, scale: 1.12, stories: 3, hasTower: true },
      { dx: 28,  dz: -18, rotY: -0.25, scale: 1.15, stories: 3, hasTower: true },
      { dx: -24, dz: 18,  rotY: Math.PI - 0.1, scale: 1.12, stories: 3, hasTower: false },
      { dx: 2,   dz: 20,  rotY: Math.PI + 0.08, scale: 1.18, stories: 3, hasTower: true },
      { dx: 28,  dz: 18,  rotY: Math.PI + 0.2, scale: 1.12, stories: 3, hasTower: true },
      { dx: -40, dz: -36, rotY: 0.45, scale: 1.05, stories: 2, hasTower: false },
      { dx: -5,  dz: -42, rotY: 0.0,  scale: 1.2,  stories: 3, hasTower: true },
      { dx: 32,  dz: -38, rotY: -0.5, scale: 1.08, stories: 2, hasTower: false },
      { dx: -40, dz: 36,  rotY: 2.6,  scale: 1.05, stories: 2, hasTower: false },
      { dx: -5,  dz: 42,  rotY: Math.PI, scale: 1.2, stories: 3, hasTower: true },
      { dx: 32,  dz: 38,  rotY: -2.6, scale: 1.08, stories: 2, hasTower: false },
      { dx: 56,  dz: 0,   rotY: -Math.PI / 2, scale: 1.25, stories: 3, hasTower: true },
    ];
    return specs.map((h) => ({ ...h, x: VILLAGE_X + h.dx, y: getTerrainHeight(VILLAGE_X + h.dx, VILLAGE_Z + h.dz), z: VILLAGE_Z + h.dz }));
  }, []);

  return (
    <group name="medieval-village-biome">
      {/* Textured Cobblestone Village Streets & Courtyard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[VILLAGE_X, centerY + 0.05, VILLAGE_Z]} receiveShadow>
        <circleGeometry args={[52, 40]} />
        <meshStandardMaterial map={textures.cobblestone} color="#94a3b8" roughness={0.9} />
      </mesh>

      {/* Medieval Stone Well at Center */}
      <group position={[VILLAGE_X, centerY, VILLAGE_Z]}>
        <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[1.6, 1.8, 1.4, 12]} />
          <meshStandardMaterial map={textures.villageStone} color="#94a3b8" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-1.3, 1.9, 0]}><boxGeometry args={[0.22, 2.4, 0.22]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh castShadow position={[1.3, 1.9, 0]}><boxGeometry args={[0.22, 2.4, 0.22]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh castShadow position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.3, 1.3, 4]} />
          <meshStandardMaterial map={textures.redRoof} color="#dc2626" roughness={0.8} />
        </mesh>
      </group>

      {/* Wooden Ramp & Walkway Connecting Houses (Reference Image 4 Foreground Right) */}
      <group position={[VILLAGE_X + 14, centerY + 0.5, VILLAGE_Z - 9]} rotation={[0, -0.3, 0.08]}>
        <mesh castShadow receiveShadow><boxGeometry args={[10.5, 0.3, 2.8]} /><meshStandardMaterial color="#6b4226" roughness={0.88} /></mesh>
        <mesh castShadow position={[0, 0.65, 1.3]}><boxGeometry args={[10.5, 0.16, 0.16]} /><meshStandardMaterial color="#4a2c18" /></mesh>
        <mesh castShadow position={[0, 0.65, -1.3]}><boxGeometry args={[10.5, 0.16, 0.16]} /><meshStandardMaterial color="#4a2c18" /></mesh>
      </group>

      {/* Giant Mossy Framing Trees inside the Village Street (Reference Image 4 Foreground Left) */}
      {[[VILLAGE_X - 36, VILLAGE_Z - 8], [VILLAGE_X + 16, VILLAGE_Z + 9], [VILLAGE_X - 14, VILLAGE_Z - 28]].map(([tx, tz], idx) => (
        <group key={idx} position={[tx, getTerrainHeight(tx, tz), tz]}>
          <mesh castShadow receiveShadow position={[0, 8.0, 0]}>
            <cylinderGeometry args={[1.25, 2.1, 16.0, 12]} />
            <meshStandardMaterial color="#5c4228" roughness={0.9} />
          </mesh>
          {/* Green Moss Patch on Trunk (Image 4) */}
          <mesh position={[0.2, 5.5, 0.35]}>
            <cylinderGeometry args={[1.18, 1.65, 10.0, 10]} />
            <meshStandardMaterial color="#3f6212" roughness={0.95} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 17.0, 0]}>
            <dodecahedronGeometry args={[7.5, 1]} />
            <meshStandardMaterial color="#2e6b34" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Multi-Story Half-Timber Medieval Houses with Stone Bricks & Timber Beams (Reference Image 4) */}
      {houses.map((h, i) => (
        <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.rotY, 0]} scale={[h.scale, h.scale, h.scale]}>
          {/* 1st Floor: Textured Blue-Grey Stone Brick Base with Timber Pillars */}
          <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
            <boxGeometry args={[9.2, 4.4, 7.4]} />
            <meshStandardMaterial map={textures.villageStone} color="#94a3b8" roughness={0.88} />
          </mesh>
          {/* 2nd Floor: Overhanging Half-Timber & Stone Frame */}
          <mesh castShadow receiveShadow position={[0, 6.2, 0]}>
            <boxGeometry args={[10.2, 4.0, 8.2]} />
            <meshStandardMaterial map={textures.halfTimber} color="#e2e8f0" roughness={0.82} />
          </mesh>
          {/* 3rd Floor Gable Attic (for 3-story houses in Image 4) */}
          {h.stories >= 3 && (
            <mesh castShadow receiveShadow position={[0, 9.6, 0]}>
              <boxGeometry args={[8.6, 3.2, 7.2]} />
              <meshStandardMaterial map={textures.villageStone} color="#cbd5e1" roughness={0.85} />
            </mesh>
          )}
          {/* Heavy Dark-Wood Structural Beams & Corbels */}
          <mesh castShadow position={[0, 4.3, 0]}><boxGeometry args={[10.5, 0.38, 8.5]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[0, 8.1, 0]}><boxGeometry args={[10.5, 0.38, 8.5]} /><meshStandardMaterial color="#4a2c18" /></mesh>

          {/* Steep Terracotta Red Shingled Roof */}
          <mesh castShadow receiveShadow position={[0, h.stories >= 3 ? 13.0 : 10.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[8.2, 4.8, 4]} />
            <meshStandardMaterial map={textures.redRoof} color="#e11d48" roughness={0.78} />
          </mesh>

          {/* Attached Medieval Watchtower with Pointed Gable Roof (Image 4 Center) */}
          {h.hasTower && (
            <group position={[4.2, 0, 2.6]}>
              <mesh castShadow receiveShadow position={[0, 6.5, 0]}>
                <boxGeometry args={[4.8, 13.0, 4.8]} />
                <meshStandardMaterial map={textures.villageStone} color="#94a3b8" roughness={0.88} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 14.8, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[4.2, 4.2, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#be123c" roughness={0.78} />
              </mesh>
              <mesh position={[-1.1, 9.5, 2.44]} material={windowMaterial}><planeGeometry args={[0.95, 1.25]} /></mesh>
              <mesh position={[1.1, 9.5, 2.44]} material={windowMaterial}><planeGeometry args={[0.95, 1.25]} /></mesh>
            </group>
          )}

          {/* Warm Glowing Multipane Lattice Windows (Image 4) */}
          <mesh position={[-2.4, 6.2, 4.14]} material={windowMaterial}><planeGeometry args={[2.2, 1.35]} /></mesh>
          <mesh position={[1.8, 6.2, 4.14]} material={windowMaterial}><planeGeometry args={[2.2, 1.35]} /></mesh>
          <mesh position={[-2.4, 2.3, 3.74]} material={windowMaterial}><planeGeometry args={[1.6, 1.2]} /></mesh>
          <mesh position={[0, 6.2, -4.14]} rotation={[0, Math.PI, 0]} material={windowMaterial}><planeGeometry args={[2.8, 1.4]} /></mesh>
        </group>
      ))}
    </group>
  );
}
