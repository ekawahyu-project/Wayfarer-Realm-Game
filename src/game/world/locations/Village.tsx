"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";

const VILLAGE_X = 360;
const VILLAGE_Z = 0;

export default function Village() {
  const centerY = useMemo(() => getTerrainHeight(VILLAGE_X, VILLAGE_Z), []);
  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 1.8 }), []);

  useFrame(() => {
    windowMaterial.emissiveIntensity = 0.35 + globalUniforms.uNightFactor.value * 3.5;
  });

  // Arranged cleanly around the main road so nothing blocks the road or center!
  const houses = useMemo(() => {
    const specs = [
      { dx: -26, dz: -20, rotY: 0.35, scale: 1.05, hasTower: true },
      { dx: 28, dz: -22, rotY: -0.4, scale: 1.05, hasTower: true },
      { dx: -32, dz: 22, rotY: 2.6, scale: 1.0, hasTower: false },
      { dx: 30, dz: 24, rotY: -2.5, scale: 1.1, hasTower: true },
      { dx: 0, dz: -40, rotY: 0.0, scale: 1.15, hasTower: true },
      { dx: 0, dz: 44, rotY: Math.PI, scale: 1.1, hasTower: true },
      { dx: 52, dz: 0, rotY: -Math.PI / 2, scale: 1.05, hasTower: false },
      { dx: 38, dz: -42, rotY: -0.8, scale: 0.95, hasTower: false },
    ];
    return specs.map((h) => ({ ...h, x: VILLAGE_X + h.dx, y: getTerrainHeight(VILLAGE_X + h.dx, VILLAGE_Z + h.dz), z: VILLAGE_Z + h.dz }));
  }, []);

  return (
    <group name="medieval-village-biome">
      {/* Cobblestone Village Plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[VILLAGE_X, centerY + 0.05, VILLAGE_Z]} receiveShadow>
        <circleGeometry args={[28, 36]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </mesh>

      {/* Medieval Stone Well at Center */}
      <group position={[VILLAGE_X, centerY, VILLAGE_Z]}>
        <mesh castShadow receiveShadow position={[0, 0.7, 0]}>
          <cylinderGeometry args={[1.6, 1.8, 1.4, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-1.3, 1.9, 0]}><boxGeometry args={[0.22, 2.4, 0.22]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh castShadow position={[1.3, 1.9, 0]}><boxGeometry args={[0.22, 2.4, 0.22]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <mesh castShadow position={[0, 3.2, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[2.3, 1.3, 4]} />
          <meshStandardMaterial color="#991b1b" roughness={0.8} />
        </mesh>
      </group>

      {/* Arched Wooden Footbridge (Reference Image 4) */}
      <group position={[VILLAGE_X - 18, centerY + 0.35, VILLAGE_Z + 8]} rotation={[0, 0.25, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[9.5, 0.35, 3.0]} /><meshStandardMaterial color="#6b4226" roughness={0.88} /></mesh>
        <mesh castShadow position={[0, 0.65, 1.35]}><boxGeometry args={[9.5, 0.16, 0.16]} /><meshStandardMaterial color="#4a2c18" /></mesh>
        <mesh castShadow position={[0, 0.65, -1.35]}><boxGeometry args={[9.5, 0.16, 0.16]} /><meshStandardMaterial color="#4a2c18" /></mesh>
      </group>

      {/* Giant Mossy Framing Trees (Reference Image 4 Foreground) */}
      {[[VILLAGE_X - 38, VILLAGE_Z - 10], [VILLAGE_X + 18, VILLAGE_Z + 12], [VILLAGE_X - 14, VILLAGE_Z - 26]].map(([tx, tz], idx) => (
        <group key={idx} position={[tx, getTerrainHeight(tx, tz), tz]}>
          <mesh castShadow receiveShadow position={[0, 6.5, 0]}>
            <cylinderGeometry args={[1.05, 1.75, 13.0, 10]} />
            <meshStandardMaterial color="#5c4028" roughness={0.92} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 14.0, 0]}>
            <dodecahedronGeometry args={[6.2, 1]} />
            <meshStandardMaterial color="#366938" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Detailed Half-Timber Medieval Houses with Cross-Bracing, Chimneys & Balconies (Reference Image 4) */}
      {houses.map((h, i) => (
        <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.rotY, 0]} scale={[h.scale, h.scale, h.scale]}>
          {/* Ground Floor Blue-Grey Cobblestone Base */}
          <mesh castShadow receiveShadow position={[0, 2.1, 0]}>
            <boxGeometry args={[8.4, 4.2, 6.8]} />
            <meshStandardMaterial color="#526071" roughness={0.9} />
          </mesh>
          {/* Upper Overhanging Plaster & Half-Timber Jetty */}
          <mesh castShadow receiveShadow position={[0, 5.8, 0]}>
            <boxGeometry args={[9.4, 3.8, 7.6]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.82} />
          </mesh>
          {/* Horizontal & Vertical Dark Wood Timber Beams */}
          <mesh castShadow position={[0, 4.0, 0]}><boxGeometry args={[9.65, 0.35, 7.85]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[0, 7.6, 0]}><boxGeometry args={[9.65, 0.35, 7.85]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          {[-4.5, -1.5, 1.5, 4.5].map((bx, idx) => (
            <mesh key={idx} castShadow position={[bx, 5.8, 3.82]}><boxGeometry args={[0.26, 3.6, 0.14]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          ))}
          {/* Diagonal Cross-Bracing Beams */}
          <mesh castShadow position={[-3.0, 5.8, 3.82]} rotation={[0, 0, 0.65]}><boxGeometry args={[0.2, 3.4, 0.12]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[3.0, 5.8, 3.82]} rotation={[0, 0, -0.65]}><boxGeometry args={[0.2, 3.4, 0.12]} /><meshStandardMaterial color="#4a2c18" /></mesh>

          {/* Steep Crimson Pitched Roof & Stone Chimney */}
          <mesh castShadow receiveShadow position={[0, 9.6, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[7.6, 4.2, 4]} />
            <meshStandardMaterial color="#9f1239" roughness={0.78} />
          </mesh>
          <mesh castShadow position={[-2.8, 10.2, -1.5]}>
            <boxGeometry args={[1.1, 3.5, 1.1]} />
            <meshStandardMaterial color="#475569" />
          </mesh>

          {/* Wooden Balcony & Support Brackets */}
          <mesh castShadow position={[0, 4.1, 4.35]}>
            <boxGeometry args={[4.6, 0.25, 1.4]} />
            <meshStandardMaterial color="#5c3a21" />
          </mesh>

          {/* Attached Gable Tower (Image 4 Center) */}
          {h.hasTower && (
            <group position={[3.9, 0, 2.3]}>
              <mesh castShadow receiveShadow position={[0, 5.2, 0]}>
                <boxGeometry args={[4.4, 10.4, 4.4]} />
                <meshStandardMaterial color="#526071" roughness={0.88} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 11.8, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[3.8, 3.6, 4]} />
                <meshStandardMaterial color="#881337" roughness={0.78} />
              </mesh>
              <mesh position={[0, 7.6, 2.24]} material={windowMaterial}><planeGeometry args={[1.2, 1.5]} /></mesh>
            </group>
          )}

          {/* Warm Glowing Multipane Windows */}
          <mesh position={[-2.2, 5.8, 3.84]} material={windowMaterial}><planeGeometry args={[1.8, 1.35]} /></mesh>
          <mesh position={[1.6, 5.8, 3.84]} material={windowMaterial}><planeGeometry args={[1.8, 1.35]} /></mesh>
          <mesh position={[-2.2, 2.2, 3.44]} material={windowMaterial}><planeGeometry args={[1.5, 1.25]} /></mesh>
          <mesh position={[0, 5.8, -3.84]} rotation={[0, Math.PI, 0]} material={windowMaterial}><planeGeometry args={[2.4, 1.35]} /></mesh>
        </group>
      ))}
    </group>
  );
}
