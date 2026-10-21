"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";

const KINGDOM_X = 0;
const KINGDOM_Z = 390;
const HARBOR_X = 0;
const HARBOR_Z = 555;

export default function Kingdom() {
  const baseY = useMemo(() => getTerrainHeight(KINGDOM_X, KINGDOM_Z), []);
  const harborY = useMemo(() => getTerrainHeight(HARBOR_X, HARBOR_Z), []);
  const textures = useMemo(() => getWorldTextures(), []);

  const gothicWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#eab308", emissiveIntensity: 2.2 }), []);
  const roseWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fed7aa", emissive: "#f97316", emissiveIntensity: 2.4 }), []);
  const clockFaceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef9c3", emissive: "#facc15", emissiveIntensity: 3.0 }), []);
  const torchFlameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffedd5", emissive: "#f97316", emissiveIntensity: 3.4 }), []);

  useFrame((state) => {
    const night = globalUniforms.uNightFactor.value;
    const pulse = 0.92 + 0.08 * Math.sin(state.clock.elapsedTime * 7.0);
    gothicWindowMat.emissiveIntensity = 0.75 + night * 3.4;
    roseWindowMat.emissiveIntensity = 0.85 + night * 3.2;
    clockFaceMat.emissiveIntensity = 1.0 + night * 3.8;
    torchFlameMat.emissiveIntensity = (1.0 + night * 4.2) * pulse;
  });

  return (
    <group name="kingdom-and-harbor-biome">
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        {/* Patterned Stone Courtyard & Sunken Octagonal Plaza (Reference Image 5 / Source 17) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <circleGeometry args={[88, 48]} />
          <meshStandardMaterial map={textures.cobblestone} color="#a89bb5" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, -4]} receiveShadow>
          <ringGeometry args={[8, 15, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.75} />
        </mesh>

        {/* Continuous Gothic Townhouse Facades & Gables Surrounding the Plaza (Reference Image 5 / Source 17) */}
        {[-40, -24, 24, 40].map((gx, idx) => (
          <group key={idx} position={[gx, 0, 12]} rotation={[0, gx < 0 ? Math.PI / 2.2 : -Math.PI / 2.2, 0]}>
            <mesh castShadow receiveShadow position={[0, 10, 0]}>
              <boxGeometry args={[28, 20, 10]} />
              <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" roughness={0.82} />
            </mesh>
            {/* 3 Steep Red Gabled Roofs per Wing (Image 5 Top) */}
            {[-8, 0, 8].map((rx, rIdx) => (
              <group key={rIdx} position={[rx, 20, 0]}>
                <mesh castShadow receiveShadow position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[7.2, 8.5, 4]} />
                  <meshStandardMaterial map={textures.redRoof} color="#e11d48" roughness={0.75} />
                </mesh>
                <mesh position={[0, 1.5, 5.06]} material={roseWindowMat}><circleGeometry args={[1.35, 16]} /></mesh>
              </group>
            ))}
            {/* Tall Yellow Lancet Gothic Windows */}
            {[-10, -5, 0, 5, 10].map((wx, wIdx) => (
              <mesh key={wIdx} position={[wx, 10.5, 5.06]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.2]} /></mesh>
            ))}
            {/* Cascading Green Ivy & Shrubs along the Retaining Wall (Image 5 Right) */}
            {[-11, -7, -3, 1, 5, 9].map((ix, k) => (
              <mesh key={k} castShadow position={[ix, 3.2, 5.4]}>
                <dodecahedronGeometry args={[1.9, 1]} />
                <meshStandardMaterial color="#366938" roughness={0.88} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Twin Gothic Gatehouse Archway with 4 Hanging Banners (Reference Image 6 Left) */}
        <group position={[-18, 0, -24]}>
          {[-9, 9].map((tx, idx) => (
            <group key={idx} position={[tx, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 15, 0]}>
                <boxGeometry args={[8.2, 30, 8.2]} />
                <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" roughness={0.82} />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 34, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[6.8, 9.0, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#e11d48" roughness={0.75} />
              </mesh>
              <mesh position={[0, 23, -4.15]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[1.7, 16]} /></mesh>
              <mesh position={[-1.6, 12, -4.15]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[1.4, 6.0]} /></mesh>
              <mesh position={[1.6, 12, -4.15]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[1.4, 6.0]} /></mesh>
            </group>
          ))}
          <mesh castShadow receiveShadow position={[0, 22.5, 0]}>
            <boxGeometry args={[12, 4.8, 6.0]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#c084fc" roughness={0.85} />
          </mesh>
          {[-3.6, -1.2, 1.2, 3.6].map((bx, idx) => (
            <mesh key={idx} castShadow position={[bx, 15.5, 0]}>
              <boxGeometry args={[1.4, 8.2, 0.15]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.65} />
            </mesh>
          ))}
        </group>

        {/* Giant Glowing Clocktower (Reference Image 6 Center) */}
        <group position={[20, 0, -8]}>
          <mesh castShadow receiveShadow position={[0, 14, 0]}>
            <boxGeometry args={[10.5, 28, 10.5]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" roughness={0.82} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 32.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[8.6, 10.0, 4]} />
            <meshStandardMaterial map={textures.redRoof} color="#be123c" roughness={0.75} />
          </mesh>
          <mesh position={[0, 19.5, -5.3]} rotation={[0, Math.PI, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 24]} /></mesh>
          <mesh position={[-5.3, 19.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 24]} /></mesh>
          <mesh position={[5.3, 19.5, 0]} rotation={[0, Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 24]} /></mesh>
        </group>

        {/* Copper Observatory Dome (Reference Image 6 Right) */}
        <group position={[38, 0, -16]}>
          <mesh castShadow receiveShadow position={[0, 8, 0]}>
            <cylinderGeometry args={[7.5, 8.0, 16, 18]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" roughness={0.85} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 16.0, 0]}>
            <sphereGeometry args={[7.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#9a4a1a" metalness={0.55} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[4.8, 19.5, 0]} rotation={[0, 0, -0.65]}>
            <cylinderGeometry args={[1.0, 1.45, 6.2, 12]} />
            <meshStandardMaterial color="#78350f" metalness={0.55} roughness={0.35} />
          </mesh>
        </group>

        {/* Grand Royal Cathedral Keep & Flanking Cylindrical Turrets (Reference Images 5 & 6) */}
        <group position={[0, 0, 42]}>
          <mesh castShadow receiveShadow position={[0, 17, 0]}>
            <boxGeometry args={[52, 34, 20]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" roughness={0.84} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 39, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[34, 12, 4]} />
            <meshStandardMaterial map={textures.redRoof} color="#e11d48" roughness={0.76} />
          </mesh>
          <mesh position={[0, 26, -10.1]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[3.6, 20]} /></mesh>
          {[-18, -12, -6, 6, 12, 18].map((wx, i) => (
            <mesh key={i} position={[wx, 14, -10.1]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[2.5, 13.5]} /></mesh>
          ))}
          {[-25, 25].map((tx, i) => (
            <group key={i} position={[tx, 0, -6]}>
              <mesh castShadow receiveShadow position={[0, 19, 0]}><cylinderGeometry args={[5.2, 5.8, 38, 18]} /><meshStandardMaterial map={textures.kingdomStone} color="#e9d5ff" /></mesh>
              <mesh castShadow receiveShadow position={[0, 42.5, 0]}><coneGeometry args={[6.2, 10.0, 18]} /><meshStandardMaterial map={textures.redRoof} color="#e11d48" /></mesh>
            </group>
          ))}
        </group>

        {/* Heroic Statues on High Gothic Pedestals & Red Cargo Crates (Reference Image 5 / Source 17) */}
        {[
          { x: -11, z: 2, color: "#57534e", staffCrystal: "#ef4444" },
          { x: 11,  z: 2, color: "#f8fafc", staffCrystal: "#38bdf8" },
        ].map((st, idx) => (
          <group key={idx} position={[st.x, 0, st.z]}>
            <mesh castShadow receiveShadow position={[0, 2.8, 0]}><boxGeometry args={[3.6, 5.6, 3.6]} /><meshStandardMaterial map={textures.kingdomStone} color="#94a3b8" /></mesh>
            <mesh castShadow position={[0, 7.4, 0]}><cylinderGeometry args={[0.65, 1.1, 4.0, 12]} /><meshStandardMaterial color={st.color} /></mesh>
            <mesh castShadow position={[0, 9.8, 0]}><sphereGeometry args={[0.52, 12, 12]} /><meshStandardMaterial color={st.color} /></mesh>
            <mesh position={[0.95, 10.4, 0.4]}>
              <octahedronGeometry args={[0.45, 0]} />
              <meshStandardMaterial color={st.staffCrystal} emissive={st.staffCrystal} emissiveIntensity={3.0} />
            </mesh>
          </group>
        ))}

        {/* Stacked Red & Wood Cargo Crates (Reference Image 5 Foreground Left) */}
        <group position={[-21, 0, 5]}>
          <mesh castShadow receiveShadow position={[0, 1.3, 0]}><boxGeometry args={[2.8, 2.6, 2.8]} /><meshStandardMaterial color="#7f1d1d" roughness={0.85} /></mesh>
          <mesh castShadow receiveShadow position={[0.1, 3.8, 0]}><boxGeometry args={[2.6, 2.5, 2.6]} /><meshStandardMaterial color="#991b1b" roughness={0.85} /></mesh>
        </group>

        {/* Flaming Street Braziers */}
        {[[-8, -42], [8, -42], [-8, -16], [8, -16], [-16, 14], [16, 14]].map(([bx, bz], idx) => (
          <group key={idx} position={[bx, 0, bz]}>
            <mesh castShadow position={[0, 1.8, 0]}><cylinderGeometry args={[0.18, 0.28, 3.6, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
            <mesh position={[0, 3.8, 0]} material={torchFlameMat}><sphereGeometry args={[0.52, 10, 10]} /></mesh>
          </group>
        ))}
      </group>

      {/* Southern Royal Harbor, Lighthouse & Solid Sailing Galleon (Z = +555) */}
      <group position={[HARBOR_X, harborY, HARBOR_Z]}>
        <mesh castShadow receiveShadow position={[0, 0.6, 18]}><boxGeometry args={[12, 1.2, 42]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        <group position={[26, 0, 7]}>
          <mesh castShadow receiveShadow position={[0, 8.5, 0]}><cylinderGeometry args={[2.3, 3.5, 17, 16]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0, 17.8, 0]} material={clockFaceMat}><cylinderGeometry args={[2.1, 2.1, 2.4, 12]} /></mesh>
          <mesh castShadow position={[0, 20.2, 0]}><coneGeometry args={[2.8, 2.8, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
        <group position={[-14, -0.8, 33]} rotation={[0, 0.35, 0]}>
          <mesh castShadow receiveShadow position={[0, 1.8, 0]}><boxGeometry args={[6.8, 3.8, 19]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, 8.5, -2]}><cylinderGeometry args={[0.24, 0.30, 14, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh castShadow position={[0, 9.5, -1.6]}><boxGeometry args={[8.8, 6.8, 0.25]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        </group>
      </group>
    </group>
  );
}
