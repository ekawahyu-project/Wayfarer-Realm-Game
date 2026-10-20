"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";

const KINGDOM_X = 0;
const KINGDOM_Z = 390;
const HARBOR_X = 0;
const HARBOR_Z = 618;

export default function Kingdom() {
  const baseY = useMemo(() => getTerrainHeight(KINGDOM_X, KINGDOM_Z), []);
  const harborY = useMemo(() => getTerrainHeight(HARBOR_X, HARBOR_Z), []);

  const gothicWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#eab308", emissiveIntensity: 2.0 }), []);
  const roseWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fed7aa", emissive: "#f97316", emissiveIntensity: 2.2 }), []);
  const clockFaceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef9c3", emissive: "#facc15", emissiveIntensity: 2.8 }), []);
  const torchFlameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffedd5", emissive: "#f97316", emissiveIntensity: 3.2 }), []);

  useFrame((state) => {
    const night = globalUniforms.uNightFactor.value;
    const pulse = 0.92 + 0.08 * Math.sin(state.clock.elapsedTime * 7.0);
    gothicWindowMat.emissiveIntensity = 0.55 + night * 3.4;
    roseWindowMat.emissiveIntensity = 0.65 + night * 3.2;
    clockFaceMat.emissiveIntensity = 0.9 + night * 3.8;
    torchFlameMat.emissiveIntensity = (0.9 + night * 4.2) * pulse;
  });

  return (
    <group name="kingdom-and-harbor-biome">
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        {/* Ornate Patterned Stone Courtyard & Sunken Garden Plaza (Reference Images 5 & 6) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <circleGeometry args={[72, 48]} />
          <meshStandardMaterial color="#6e6478" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, -8]} receiveShadow>
          <ringGeometry args={[7, 13, 16]} />
          <meshStandardMaterial color="#b45309" roughness={0.75} />
        </mesh>

        {/* 1. Twin Gothic Archway Gatehouse with 4 Hanging Royal Banners & Rose Windows (Image 6 Left) */}
        <group position={[-18, 0, -24]}>
          {[-9, 9].map((tx, idx) => (
            <group key={idx} position={[tx, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 14, 0]}>
                <boxGeometry args={[7.8, 28, 7.8]} />
                <meshStandardMaterial color="#8d7c9c" roughness={0.82} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 31.5, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[6.5, 8.5, 4]} />
                <meshStandardMaterial color="#9f1239" roughness={0.75} />
              </mesh>
              {/* Glowing Rose Window & Tall Lancet Windows */}
              <mesh position={[0, 22, -3.95]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[1.65, 16]} /></mesh>
              <mesh position={[-1.5, 12, -3.95]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[1.3, 5.5]} /></mesh>
              <mesh position={[1.5, 12, -3.95]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[1.3, 5.5]} /></mesh>
              <mesh position={[0, 12, 3.95]} material={gothicWindowMat}><planeGeometry args={[1.8, 5.5]} /></mesh>
            </group>
          ))}
          {/* Overhead Gothic Skybridge */}
          <mesh castShadow receiveShadow position={[0, 21.5, 0]}>
            <boxGeometry args={[12, 4.5, 5.8]} />
            <meshStandardMaterial color="#7c6d8c" roughness={0.85} />
          </mesh>
          {/* 4 Crimson & Gold Hanging Banners (Image 6) */}
          {[-3.6, -1.2, 1.2, 3.6].map((bx, idx) => (
            <mesh key={idx} castShadow position={[bx, 15.0, 0]}>
              <boxGeometry args={[1.35, 7.8, 0.15]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.65} />
            </mesh>
          ))}
        </group>

        {/* 2. Grand Glowing Clocktower with Corner Spires (Image 6 Center) */}
        <group position={[18, 0, -8]}>
          <mesh castShadow receiveShadow position={[0, 13, 0]}>
            <boxGeometry args={[9.8, 26, 9.8]} />
            <meshStandardMaterial color="#9684a3" roughness={0.82} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 30.0, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[8.2, 9.5, 4]} />
            <meshStandardMaterial color="#881337" roughness={0.75} />
          </mesh>
          {/* Glowing Clock Faces & Hands */}
          <mesh position={[0, 18.5, -4.95]} rotation={[0, Math.PI, 0]} material={clockFaceMat}><circleGeometry args={[3.3, 24]} /></mesh>
          <mesh position={[-4.95, 18.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.3, 24]} /></mesh>
          <mesh position={[4.95, 18.5, 0]} rotation={[0, Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.3, 24]} /></mesh>
        </group>

        {/* 3. Copper Observatory Dome with Giant Brass Telescope (Image 6 Right) */}
        <group position={[36, 0, -16]}>
          <mesh castShadow receiveShadow position={[0, 7.5, 0]}>
            <cylinderGeometry args={[7.2, 7.6, 15, 18]} />
            <meshStandardMaterial color="#8d7c9c" roughness={0.85} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 15.0, 0]}>
            <sphereGeometry args={[7.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#9a4a1a" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[4.5, 18.5, 0]} rotation={[0, 0, -0.65]}>
            <cylinderGeometry args={[0.95, 1.4, 6.0, 12]} />
            <meshStandardMaterial color="#78350f" metalness={0.55} roughness={0.35} />
          </mesh>
        </group>

        {/* 4. Townhouse Wings with Steep Red Gable Roofs & Ivy Hedges (Image 5) */}
        {[-32, 32].map((wx, idx) => (
          <group key={idx} position={[wx, 0, 8]} rotation={[0, wx < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]}>
              <boxGeometry args={[24, 16, 8.5]} />
              <meshStandardMaterial color="#a38fb0" roughness={0.84} />
            </mesh>
            <mesh castShadow receiveShadow position={[0, 19.5, 0]} rotation={[0, Math.PI / 4, 0]}>
              <coneGeometry args={[17, 7.5, 4]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.76} />
            </mesh>
            {[-8, -3, 3, 8].map((ox, j) => (
              <mesh key={j} position={[ox, 9.5, 4.3]} material={gothicWindowMat}><planeGeometry args={[1.8, 4.2]} /></mesh>
            ))}
            {/* Lush Green Ivy / Hedges along lower wall (Image 5 Right) */}
            {[-9, -5, -1, 3, 7].map((ix, k) => (
              <mesh key={k} castShadow position={[ix, 2.2, 4.5]}>
                <dodecahedronGeometry args={[1.6, 1]} />
                <meshStandardMaterial color="#2e6b34" roughness={0.85} />
              </mesh>
            ))}
          </group>
        ))}

        {/* 5. Grand Royal Cathedral Citadel at Back (+Z) */}
        <group position={[0, 0, 34]}>
          <mesh castShadow receiveShadow position={[0, 15, 0]}>
            <boxGeometry args={[44, 30, 18]} />
            <meshStandardMaterial color="#8d7c9c" roughness={0.84} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 34, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[30, 11, 4]} />
            <meshStandardMaterial color="#9f1239" roughness={0.76} />
          </mesh>
          <mesh position={[0, 23, -9.1]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[3.2, 20]} /></mesh>
          {[-15, -9, -3, 3, 9, 15].map((wx, i) => (
            <mesh key={i} position={[wx, 12.5, -9.1]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[2.3, 11.5]} /></mesh>
          ))}
          {[-23, 23].map((tx, i) => (
            <group key={i} position={[tx, 0, -4]}>
              <mesh castShadow receiveShadow position={[0, 17, 0]}><cylinderGeometry args={[4.6, 5.2, 34, 16]} /><meshStandardMaterial color="#9684a3" /></mesh>
              <mesh castShadow receiveShadow position={[0, 38, 0]}><coneGeometry args={[5.5, 9.0, 16]} /><meshStandardMaterial color="#9f1239" /></mesh>
            </group>
          ))}
        </group>

        {/* 6. Heroic Statues on Stone Pedestals & Wooden Crates (Image 5 Center & Left) */}
        {[
          { x: -12, z: 4, color: "#475569", staffCrystal: "#ef4444" },
          { x: 12, z: 4, color: "#f8fafc", staffCrystal: "#38bdf8" },
        ].map((st, idx) => (
          <group key={idx} position={[st.x, 0, st.z]}>
            <mesh castShadow receiveShadow position={[0, 2.2, 0]}><boxGeometry args={[3.4, 4.4, 3.4]} /><meshStandardMaterial color="#64748b" /></mesh>
            <mesh castShadow position={[0, 6.0, 0]}><cylinderGeometry args={[0.6, 0.95, 3.6, 10]} /><meshStandardMaterial color={st.color} /></mesh>
            <mesh castShadow position={[0, 8.1, 0]}><sphereGeometry args={[0.48, 12, 12]} /><meshStandardMaterial color={st.color} /></mesh>
            <mesh position={[0.9, 8.6, 0.4]}>
              <octahedronGeometry args={[0.42, 0]} />
              <meshStandardMaterial color={st.staffCrystal} emissive={st.staffCrystal} emissiveIntensity={2.8} />
            </mesh>
          </group>
        ))}

        {/* Flaming Street Braziers along Royal Avenue (Image 6) */}
        {[[-8, -42], [8, -42], [-8, -16], [8, -16], [-16, 14], [16, 14]].map(([bx, bz], idx) => (
          <group key={idx} position={[bx, 0, bz]}>
            <mesh castShadow position={[0, 1.8, 0]}><cylinderGeometry args={[0.18, 0.28, 3.6, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
            <mesh position={[0, 3.8, 0]} material={torchFlameMat}><sphereGeometry args={[0.52, 10, 10]} /></mesh>
          </group>
        ))}
      </group>

      {/* Southern Harbor, Lighthouse & Royal Galleon */}
      <group position={[HARBOR_X, harborY, HARBOR_Z]}>
        <mesh castShadow receiveShadow position={[0, 0.6, 16]}><boxGeometry args={[11, 1.2, 38]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <group position={[28, 0, 5]}>
          <mesh castShadow receiveShadow position={[0, 8.5, 0]}><cylinderGeometry args={[2.3, 3.5, 17, 16]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0, 17.8, 0]} material={clockFaceMat}><cylinderGeometry args={[2.1, 2.1, 2.4, 12]} /></mesh>
          <mesh castShadow position={[0, 20.2, 0]}><coneGeometry args={[2.8, 2.8, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
        <group position={[-14, -1.2, 34]} rotation={[0, 0.35, 0]}>
          <mesh castShadow receiveShadow position={[0, 1.8, 0]}><boxGeometry args={[6.5, 3.6, 18]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, 8.5, -2]}><cylinderGeometry args={[0.22, 0.28, 14, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh castShadow position={[0, 9.5, -1.6]}><boxGeometry args={[8.5, 6.5, 0.25]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        </group>
      </group>
    </group>
  );
}
