"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight, addBoxCollider, addCircleCollider } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";

const KINGDOM_X = 0;
const KINGDOM_Z = 395;

export default function Kingdom() {
  const baseY = useMemo(() => getExactMeshTerrainHeight(KINGDOM_X, KINGDOM_Z), []);
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

  // Register Solid Box Colliders for all Kingdom Towers, Wings, Statues, Crates & Harbor Ships
  useEffect(() => {
    // Gatehouse Towers
    addBoxCollider(-27, 371, 9.0, 9.0);
    addBoxCollider(-9,  371, 9.0, 9.0);
    // Clocktower & Observatory
    addBoxCollider(20, 387, 11.0, 11.0);
    addCircleCollider(38, 379, 8.2);
    // Connected Gothic Townhouse Wings (Left & Right)
    addBoxCollider(-42, 405, 14.0, 62.0);
    addBoxCollider(42,  405, 14.0, 62.0);
    // Grand Cathedral Keep & Side Castles at Back
    addBoxCollider(0, 442, 64.0, 22.0);
    addCircleCollider(-28, 436, 6.5);
    addCircleCollider(28,  436, 6.5);
    // Statues & Cargo Crates
    addBoxCollider(-11, 397, 4.2, 4.2);
    addBoxCollider(11,  397, 4.2, 4.2);
    addBoxCollider(-21, 400, 3.6, 3.6);
    // Outer Fortress Gate Pillars
    addCircleCollider(-18, 332, 4.5);
    addCircleCollider(18,  332, 4.5);
    // Harbor Lighthouse & Galleon Ship
    addCircleCollider(24, 548, 4.2);
    addBoxCollider(-14, 578, 8.0, 20.0);
    // NW Shrine Pagoda
    addBoxCollider(-310, -315, 26.0, 16.0);
  }, []);

  return (
    <group name="expanded-kingdom-and-harbor">
      {/* --- 1. EXPANDED ROYAL KINGDOM CITADEL (Reference Image 055226_2) --- */}
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        {/* Massive Cobblestone Royal Plaza */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
          <circleGeometry args={[105, 48]} />
          <meshStandardMaterial map={textures.cobblestone} color="#a89bb5" roughness={0.85} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, -2]} receiveShadow>
          <ringGeometry args={[9, 16, 8]} />
          <meshStandardMaterial color="#b45309" roughness={0.75} />
        </mesh>

        {/* Outer Royal Curtain Walls & Bastion Towers at Entrance (Z = -63) */}
        {[-18, 18].map((px, i) => (
          <group key={i} position={[px, 0, -63]}>
            <mesh castShadow receiveShadow position={[0, 11, 0]}>
              <cylinderGeometry args={[4.2, 4.8, 22, 16]} />
              <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" />
            </mesh>
            <mesh castShadow position={[0, 25, 0]}>
              <coneGeometry args={[5.0, 7.0, 16]} />
              <meshStandardMaterial map={textures.redRoof} color="#e11d48" />
            </mesh>
          </group>
        ))}

        {/* Continuous Connected Gothic Townhouse Rows & Cylindrical Turrets (Reference Image 055226_2) */}
        {[-42, 42].map((wx, sideIdx) => (
          <group key={sideIdx} position={[wx, 0, 10]} rotation={[0, wx < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            {/* 5 Connected Multi-Gable Gothic Townhouses per Wing */}
            {[-24, -12, 0, 12, 24].map((offsetX, hIdx) => (
              <group key={hIdx} position={[offsetX, 0, 0]}>
                <mesh castShadow receiveShadow position={[0, 10.5, 0]}>
                  <boxGeometry args={[12.4, 21, 11.5]} />
                  <meshStandardMaterial map={textures.kingdomStone} color={hIdx % 2 === 0 ? "#e2c6ec" : "#d1b3de"} roughness={0.82} />
                </mesh>
                <mesh castShadow receiveShadow position={[0, 25.0, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[8.8, 8.5, 4]} />
                  <meshStandardMaterial map={textures.redRoof} color="#e11d48" roughness={0.75} />
                </mesh>
                <mesh position={[0, 22.0, 5.82]} material={roseWindowMat}><circleGeometry args={[1.45, 16]} /></mesh>
                <mesh position={[-2.6, 11.5, 5.82]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.5]} /></mesh>
                <mesh position={[2.6, 11.5, 5.82]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.5]} /></mesh>
                {/* Attached Projecting Cylindrical Turret (Reference Image 055226_2 Right) */}
                {hIdx % 2 === 1 && (
                  <group position={[5.2, 4.0, 5.2]}>
                    <mesh castShadow receiveShadow position={[0, 9.0, 0]}>
                      <cylinderGeometry args={[2.8, 3.0, 18, 16]} />
                      <meshStandardMaterial map={textures.kingdomStone} color="#f3e8ff" />
                    </mesh>
                    <mesh castShadow position={[0, 21.0, 0]}>
                      <coneGeometry args={[3.3, 6.5, 16]} />
                      <meshStandardMaterial map={textures.redRoof} color="#ea580c" />
                    </mesh>
                    <mesh position={[0, 10.0, 2.95]} material={gothicWindowMat}><planeGeometry args={[1.1, 3.6]} /></mesh>
                  </group>
                )}
              </group>
            ))}
            {/* Lush Cascading Ivy & Retaining Wall Shrubs (Image 055226_2) */}
            {[-26, -20, -14, -8, -2, 4, 10, 16, 22, 26].map((ix, k) => (
              <mesh key={k} castShadow position={[ix, 3.2, 6.2]}>
                <dodecahedronGeometry args={[2.2, 1]} />
                <meshStandardMaterial color="#366938" roughness={0.88} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Twin Gothic Gatehouse Archway with 4 Hanging Banners */}
        <group position={[-18, 0, -24]}>
          {[-9, 9].map((tx, idx) => (
            <group key={idx} position={[tx, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 15, 0]}>
                <boxGeometry args={[8.2, 30, 8.2]} />
                <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" />
              </mesh>
              <mesh castShadow position={[0, 34, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[6.8, 9.0, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#e11d48" />
              </mesh>
              <mesh position={[0, 23, -4.15]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[1.7, 16]} /></mesh>
              <mesh position={[-1.6, 12, -4.15]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[1.4, 6.0]} /></mesh>
              <mesh position={[1.6, 12, -4.15]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[1.4, 6.0]} /></mesh>
            </group>
          ))}
          <mesh castShadow position={[0, 22.5, 0]}>
            <boxGeometry args={[12, 4.8, 6.0]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#c084fc" />
          </mesh>
          {[-3.6, -1.2, 1.2, 3.6].map((bx, idx) => (
            <mesh key={idx} castShadow position={[bx, 15.5, 0]}>
              <boxGeometry args={[1.4, 8.2, 0.15]} />
              <meshStandardMaterial color="#b91c1c" />
            </mesh>
          ))}
        </group>

        {/* Giant Glowing Clocktower */}
        <group position={[20, 0, -8]}>
          <mesh castShadow receiveShadow position={[0, 14, 0]}>
            <boxGeometry args={[10.5, 28, 10.5]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" />
          </mesh>
          <mesh castShadow position={[0, 32.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[8.6, 10.0, 4]} />
            <meshStandardMaterial map={textures.redRoof} color="#be123c" />
          </mesh>
          <mesh position={[0, 19.5, -5.3]} rotation={[0, Math.PI, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 24]} /></mesh>
          <mesh position={[-5.3, 19.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 24]} /></mesh>
          <mesh position={[5.3, 19.5, 0]} rotation={[0, Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 24]} /></mesh>
        </group>

        {/* Copper Observatory Dome */}
        <group position={[38, 0, -16]}>
          <mesh castShadow receiveShadow position={[0, 8, 0]}>
            <cylinderGeometry args={[7.5, 8.0, 16, 18]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" />
          </mesh>
          <mesh castShadow position={[0, 16.0, 0]}>
            <sphereGeometry args={[7.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#9a4a1a" metalness={0.55} roughness={0.4} />
          </mesh>
        </group>

        {/* Massive Royal Cathedral Citadel Keep at Back (+Z = 47) */}
        <group position={[0, 0, 47]}>
          <mesh castShadow receiveShadow position={[0, 18, 0]}>
            <boxGeometry args={[62, 36, 22]} />
            <meshStandardMaterial map={textures.kingdomStone} color="#d8b4e2" />
          </mesh>
          <mesh castShadow position={[0, 41, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[40, 13, 4]} />
            <meshStandardMaterial map={textures.redRoof} color="#e11d48" />
          </mesh>
          <mesh position={[0, 27, -11.1]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[4.0, 20]} /></mesh>
          {[-22, -15, -8, 8, 15, 22].map((wx, i) => (
            <mesh key={i} position={[wx, 14.5, -11.1]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[2.8, 14.5]} /></mesh>
          ))}
          {[-28, 28].map((tx, i) => (
            <group key={i} position={[tx, 0, -6]}>
              <mesh castShadow receiveShadow position={[0, 20, 0]}><cylinderGeometry args={[5.5, 6.2, 40, 18]} /><meshStandardMaterial map={textures.kingdomStone} color="#e9d5ff" /></mesh>
              <mesh castShadow position={[0, 45, 0]}><coneGeometry args={[6.6, 11.0, 18]} /><meshStandardMaterial map={textures.redRoof} color="#e11d48" /></mesh>
            </group>
          ))}
        </group>

        {/* Heroic Statues on High Pedestals & Red Cargo Crates (Image 055226_2) */}
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

        <group position={[-21, 0, 5]}>
          <mesh castShadow receiveShadow position={[0, 1.3, 0]}><boxGeometry args={[2.8, 2.6, 2.8]} /><meshStandardMaterial color="#7f1d1d" roughness={0.85} /></mesh>
          <mesh castShadow receiveShadow position={[0.1, 3.8, 0]}><boxGeometry args={[2.6, 2.5, 2.6]} /><meshStandardMaterial color="#991b1b" roughness={0.85} /></mesh>
        </group>
      </group>

      {/* --- 2. FIXED SOUTHERN HARBOR PIER (Placed in Exact World Y = 2.2m so Player NEVER Sinks or Clips Under It!) --- */}
      <group position={[0, 0, 555]}>
        {/* Wooden Pier Deck: Top surface sits at exact Y = 2.4m matching getWalkableHeight! */}
        <mesh castShadow receiveShadow position={[0, 2.15, 8]}>
          <boxGeometry args={[12.4, 0.5, 56]} />
          <meshStandardMaterial color="#5c3a21" roughness={0.88} />
        </mesh>
        {/* Pier Support Pilings into the seabed */}
        {[-12, -2, 8, 18, 28].map((pz, i) => (
          <group key={i} position={[0, 0.2, pz]}>
            <mesh castShadow position={[-5.4, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 4.2, 8]} /><meshStandardMaterial color="#3e2723" /></mesh>
            <mesh castShadow position={[5.4, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 4.2, 8]} /><meshStandardMaterial color="#3e2723" /></mesh>
          </group>
        ))}
        {/* Harbor Lighthouse */}
        <group position={[24, getExactMeshTerrainHeight(24, 548), -7]}>
          <mesh castShadow receiveShadow position={[0, 8.5, 0]}><cylinderGeometry args={[2.3, 3.5, 17, 16]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0, 17.8, 0]} material={clockFaceMat}><cylinderGeometry args={[2.1, 2.1, 2.4, 12]} /></mesh>
          <mesh castShadow position={[0, 20.2, 0]}><coneGeometry args={[2.8, 2.8, 16]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
        {/* Royal Sailing Galleon moored beside the Pier in deep water */}
        <group position={[-14, 0.2, 23]} rotation={[0, 0.15, 0]}>
          <mesh castShadow receiveShadow position={[0, 1.8, 0]}><boxGeometry args={[6.8, 3.8, 19]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, 8.5, -2]}><cylinderGeometry args={[0.24, 0.30, 14, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh castShadow position={[0, 9.5, -1.6]}><boxGeometry args={[8.8, 6.8, 0.25]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        </group>
      </group>
    </group>
  );
}
