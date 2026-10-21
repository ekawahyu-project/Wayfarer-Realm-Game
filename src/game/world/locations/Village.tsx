"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight, addBoxCollider, addCircleCollider, clearWorldColliders } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";

type HouseVariant = "tavern_L" | "tower_house" | "overpass_arch" | "merchant_gable" | "blacksmith" | "windmill";

interface HouseItem {
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale: number;
  variant: HouseVariant;
}

type StallType = "fruit" | "fish" | "veggie" | "bakery";

interface MarketStallItem {
  x: number;
  y: number;
  z: number;
  rotY: number;
  type: StallType;
}

// Reusable Market Stall Component (Toko Buah, Toko Ikan, Toko Sayur, Toko Roti)
function MarketStall({ stall, textures }: { stall: MarketStallItem; textures: Record<string, THREE.CanvasTexture> }) {
  const awningTex =
    stall.type === "fruit" ? textures.awningRed :
    stall.type === "fish" ? textures.awningBlue :
    stall.type === "veggie" ? textures.awningGreen : textures.awningGold;

  return (
    <group position={[stall.x, stall.y, stall.z]} rotation={[0, stall.rotY, 0]}>
      {/* Wooden Counter Table */}
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[4.4, 1.1, 2.2]} />
        <meshStandardMaterial color="#6b4226" roughness={0.88} />
      </mesh>
      {/* 4 Support Poles */}
      {[-2.0, 2.0].map((px, i) => (
        <group key={i}>
          <mesh castShadow position={[px, 1.8, 0.95]}><cylinderGeometry args={[0.08, 0.08, 3.6, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[px, 1.8, -0.95]}><cylinderGeometry args={[0.08, 0.08, 3.6, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
        </group>
      ))}
      {/* Striped Cloth Canopy Awning */}
      <mesh castShadow receiveShadow position={[0, 3.55, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[4.8, 0.18, 2.8]} />
        <meshStandardMaterial map={awningTex} roughness={0.8} />
      </mesh>

      {/* 1. TOKO BUAH (Apples, Oranges, Watermelons, Bananas) */}
      {stall.type === "fruit" && (
        <group position={[0, 1.55, 0]}>
          {[-1.3, 0, 1.3].map((cx, idx) => (
            <group key={idx} position={[cx, 0, 0]}>
              <mesh castShadow><boxGeometry args={[1.1, 0.28, 1.5]} /><meshStandardMaterial color="#854d0e" /></mesh>
              {[-0.28, 0, 0.28].map((fx, j) => (
                <mesh key={j} position={[fx, 0.22, 0.2]}>
                  <sphereGeometry args={[0.17, 10, 10]} />
                  <meshStandardMaterial color={idx === 0 ? "#ef4444" : idx === 1 ? "#f97316" : "#15803d"} roughness={0.5} />
                </mesh>
              ))}
              {[-0.25, 0.25].map((fx, j) => (
                <mesh key={j} position={[fx, 0.22, -0.25]}>
                  <sphereGeometry args={[0.18, 10, 10]} />
                  <meshStandardMaterial color={idx === 2 ? "#facc15" : "#dc2626"} roughness={0.5} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}

      {/* 2. TOKO IKAN (Fresh Silver/Salmon Fish on Ice, Hanging Dried Fish & Water Barrels) */}
      {stall.type === "fish" && (
        <group position={[0, 1.55, 0]}>
          {/* Crushed Ice Bed */}
          <mesh position={[-0.6, 0.05, 0]}><boxGeometry args={[2.4, 0.16, 1.6]} /><meshStandardMaterial color="#e0f2fe" roughness={0.3} /></mesh>
          {/* Fresh Fishes on Ice */}
          {[-1.3, -0.8, -0.3, 0.2].map((fx, idx) => (
            <mesh key={idx} position={[fx, 0.18, (idx % 2) * 0.25 - 0.1]} rotation={[0, 0.3, 0]} scale={[0.35, 0.12, 0.85]}>
              <sphereGeometry args={[0.35, 10, 8]} />
              <meshStandardMaterial color={idx % 2 === 0 ? "#94a3b8" : "#fb7185"} metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
          {/* Overhead Hanging Fish Rack */}
          <mesh position={[1.2, 1.1, 0]}><boxGeometry args={[1.4, 0.08, 0.08]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          {[0.8, 1.2, 1.6].map((hx, idx) => (
            <mesh key={idx} position={[hx, 0.65, 0]} scale={[0.25, 0.75, 0.15]}>
              <sphereGeometry args={[0.35, 8, 8]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.3} roughness={0.4} />
            </mesh>
          ))}
          {/* Water Tub beside Stall */}
          <mesh castShadow position={[2.6, -0.55, 0.4]}><cylinderGeometry args={[0.55, 0.48, 0.9, 12]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        </group>
      )}

      {/* 3. TOKO SAYUR & REMPAH (Cabbages, Pumpkins, Carrots, Grain Sacks) */}
      {stall.type === "veggie" && (
        <group position={[0, 1.55, 0]}>
          {/* Green Cabbages */}
          {[-1.4, -1.0, -0.6].map((vx, i) => (
            <mesh key={i} position={[vx, 0.2, 0.2]}><dodecahedronGeometry args={[0.24, 1]} /><meshStandardMaterial color="#4ade80" roughness={0.8} /></mesh>
          ))}
          {/* Orange Pumpkins */}
          {[0.2, 0.8, 1.4].map((px, i) => (
            <mesh key={i} position={[px, 0.24, -0.15]} scale={[1.1, 0.8, 1.1]}><sphereGeometry args={[0.28, 12, 10]} /><meshStandardMaterial color="#ea580c" roughness={0.7} /></mesh>
          ))}
          {/* Burlap Grain & Spice Sacks in Front */}
          {[-1.2, 0, 1.2].map((sx, i) => (
            <mesh key={i} castShadow position={[sx, -0.55, 1.35]}><cylinderGeometry args={[0.34, 0.42, 0.85, 10]} /><meshStandardMaterial color="#a16207" roughness={0.95} /></mesh>
          ))}
        </group>
      )}

      {/* 4. TOKO ROTI & KEJU (Bread Loaves, Cheese Wheels, Barrels) */}
      {stall.type === "bakery" && (
        <group position={[0, 1.55, 0]}>
          {[-1.2, -0.4, 0.4, 1.2].map((bx, i) => (
            <mesh key={i} position={[bx, 0.16, 0.15]} scale={[1.4, 0.7, 0.9]}>
              <sphereGeometry args={[0.22, 10, 10]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#d97706" : "#facc15"} roughness={0.7} />
            </mesh>
          ))}
          <mesh castShadow position={[-2.6, -0.45, 0.3]}><cylinderGeometry args={[0.5, 0.5, 1.2, 12]} /><meshStandardMaterial color="#5c3818" /></mesh>
        </group>
      )}
    </group>
  );
}

export default function Village() {
  const textures = useMemo(() => getWorldTextures(), []);
  const windmillBladesRef = useRef<THREE.Group>(null);
  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 2.0 }), []);

  useFrame((_state, delta) => {
    windowMaterial.emissiveIntensity = 0.55 + globalUniforms.uNightFactor.value * 3.5;
    if (windmillBladesRef.current) {
      windmillBladesRef.current.rotation.z += Math.min(delta, 0.05) * 0.9;
    }
  });

  // Build 3 Complete Villages with Connected Rowhouses (Rumah Mepet/Nyambung) & Market Stalls
  const { houses, stalls, plazas, trees } = useMemo(() => {
    const hList: HouseItem[] = [];
    const sList: MarketStallItem[] = [];
    const pList: { x: number; y: number; z: number; r: number }[] = [
      { x: 365, y: getExactMeshTerrainHeight(365, 0), z: 0, r: 92 },
      { x: -280, y: getExactMeshTerrainHeight(-280, 240), z: 240, r: 44 },
      { x: -245, y: getExactMeshTerrainHeight(-245, -95), z: -95, r: 42 },
    ];

    const addRowHouse = (x: number, z: number, rotY: number, scale: number, variant: HouseVariant) => {
      hList.push({ x, y: getExactMeshTerrainHeight(x, z), z, rotY, scale, variant });
    };

    // --- DESA 1: DESA PASAR UTAMA TIMUR (X: 365, Z: 0) - Rumah Mepet Berderet + Pasar Besar ---
    // North Connected Row (Mepet sepanjang jalan utama Z = -17)
    addRowHouse(328, -17, 0.05, 1.15, "tavern_L");
    addRowHouse(339, -18, 0.0,  1.18, "tower_house");
    addRowHouse(350, -17, -0.04, 1.12, "merchant_gable");
    addRowHouse(361, -18, 0.02, 1.16, "overpass_arch");
    addRowHouse(373, -17, 0.0,  1.15, "tower_house");
    addRowHouse(384, -18, -0.05, 1.12, "blacksmith");
    addRowHouse(395, -17, -0.1, 1.18, "tavern_L");

    // South Connected Row (Mepet sepanjang jalan utama Z = +17)
    addRowHouse(328, 17, Math.PI - 0.05, 1.12, "merchant_gable");
    addRowHouse(339, 18, Math.PI,        1.18, "tower_house");
    addRowHouse(350, 17, Math.PI + 0.04, 1.15, "tavern_L");
    addRowHouse(361, 18, Math.PI,        1.14, "merchant_gable");
    addRowHouse(373, 17, Math.PI - 0.04, 1.18, "tower_house");
    addRowHouse(384, 18, Math.PI,        1.12, "blacksmith");
    addRowHouse(395, 17, Math.PI + 0.1,  1.16, "overpass_arch");

    // East & Outer Connected Clusters + Windmill
    addRowHouse(414, -8, -Math.PI / 2, 1.22, "tower_house");
    addRowHouse(414, 6,  -Math.PI / 2, 1.18, "merchant_gable");
    addRowHouse(405, -36, -0.4, 1.25, "windmill");
    addRowHouse(345, -36, 0.2,  1.15, "tavern_L");
    addRowHouse(356, -37, 0.15, 1.15, "tower_house");
    addRowHouse(345, 36,  Math.PI - 0.2, 1.15, "merchant_gable");
    addRowHouse(356, 37,  Math.PI - 0.1, 1.18, "tower_house");
    // Extra Expanded Outer Village Blocks (North, South, East & West Alleys)
    addRowHouse(306, -17, 0.05, 1.15, "merchant_gable");
    addRowHouse(317, -18, 0.0,  1.18, "tower_house");
    addRowHouse(306, 17,  Math.PI, 1.15, "tavern_L");
    addRowHouse(317, 18,  Math.PI, 1.16, "overpass_arch");
    addRowHouse(322, -37, 0.1,  1.14, "merchant_gable");
    addRowHouse(333, -36, 0.05, 1.18, "tower_house");
    addRowHouse(368, -37, -0.05, 1.15, "blacksmith");
    addRowHouse(380, -36, -0.1, 1.16, "tavern_L");
    addRowHouse(392, -37, -0.15, 1.18, "tower_house");
    addRowHouse(322, 37,  Math.PI, 1.15, "tower_house");
    addRowHouse(333, 36,  Math.PI, 1.14, "merchant_gable");
    addRowHouse(368, 37,  Math.PI, 1.16, "tavern_L");
    addRowHouse(380, 36,  Math.PI, 1.18, "tower_house");
    addRowHouse(392, 37,  Math.PI, 1.15, "overpass_arch");
    addRowHouse(428, -18, -Math.PI / 2, 1.18, "tavern_L");
    addRowHouse(428, 18,  -Math.PI / 2, 1.18, "tower_house");

    // Pasar Desa Timur (8 Kios Pasar Lengkap di Alun-Alun: Buah, Ikan, Sayur, Roti)
    const eastStalls: { dx: number; dz: number; rot: number; type: StallType }[] = [
      { dx: -16, dz: -7, rot: 0, type: "fruit" },
      { dx: -6,  dz: -7, rot: 0, type: "veggie" },
      { dx: 8,   dz: -7, rot: 0, type: "bakery" },
      { dx: 18,  dz: -7, rot: 0, type: "fish" },
      { dx: -16, dz: 7,  rot: Math.PI, type: "fish" },
      { dx: -6,  dz: 7,  rot: Math.PI, type: "fruit" },
      { dx: 8,   dz: 7,  rot: Math.PI, type: "veggie" },
      { dx: 18,  dz: 7,  rot: Math.PI, type: "bakery" },
    ];
    eastStalls.forEach((st) => {
      const sx = 365 + st.dx;
      const sz = st.dz;
      sList.push({ x: sx, y: getExactMeshTerrainHeight(sx, sz), z: sz, rotY: st.rot, type: st.type });
    });

    // --- DESA 2: DESA NELAYAN TELUK BARAT DAYA (X: -280, Z: 240) ---
    addRowHouse(-298, 226, 0.1, 1.1, "tavern_L");
    addRowHouse(-287, 225, 0.0, 1.15, "tower_house");
    addRowHouse(-276, 226, -0.05, 1.1, "merchant_gable");
    addRowHouse(-265, 225, -0.1, 1.12, "blacksmith");
    addRowHouse(-296, 254, Math.PI, 1.12, "merchant_gable");
    addRowHouse(-285, 255, Math.PI, 1.15, "tower_house");
    addRowHouse(-274, 254, Math.PI, 1.12, "overpass_arch");
    sList.push({ x: -288, y: getExactMeshTerrainHeight(-288, 238), z: 238, rotY: 0, type: "fish" });
    sList.push({ x: -278, y: getExactMeshTerrainHeight(-278, 238), z: 238, rotY: 0, type: "fruit" });
    sList.push({ x: -268, y: getExactMeshTerrainHeight(-268, 238), z: 238, rotY: 0, type: "veggie" });

    // --- DESA 3: DESA LEMBAH HUTAN BARAT (X: -245, Z: -95) ---
    addRowHouse(-262, -109, 0.05, 1.12, "tower_house");
    addRowHouse(-251, -110, 0.0,  1.15, "tavern_L");
    addRowHouse(-240, -109, -0.05, 1.12, "merchant_gable");
    addRowHouse(-229, -110, -0.1, 1.15, "windmill");
    addRowHouse(-258, -81,  Math.PI, 1.12, "blacksmith");
    addRowHouse(-247, -80,  Math.PI, 1.16, "tower_house");
    addRowHouse(-236, -81,  Math.PI, 1.12, "merchant_gable");
    sList.push({ x: -252, y: getExactMeshTerrainHeight(-252, -95), z: -95, rotY: 0, type: "veggie" });
    sList.push({ x: -242, y: getExactMeshTerrainHeight(-242, -95), z: -95, rotY: 0, type: "fruit" });
    sList.push({ x: -232, y: getExactMeshTerrainHeight(-232, -95), z: -95, rotY: 0, type: "bakery" });

    const tList = [
      [320, -10], [378, 11], [342, -29], [-306, 240], [-222, -95],
    ].map(([tx, tz]) => ({ x: tx, y: getExactMeshTerrainHeight(tx, tz), z: tz }));

    return { houses: hList, stalls: sList, plazas: pList, trees: tList };
  }, []);

  // Register Solid Box Colliders for all 3 Villages & Market Stalls
  useEffect(() => {
    clearWorldColliders();
    houses.forEach((h) => {
      addBoxCollider(h.x, h.z, 9.8 * h.scale, 8.2 * h.scale);
    });
    stalls.forEach((s) => {
      addBoxCollider(s.x, s.z, 4.6, 2.5);
    });
    trees.forEach((t) => {
      addCircleCollider(t.x, t.z, 2.2);
    });
    addCircleCollider(365, 0, 2.3);
  }, [houses, stalls, trees]);

  return (
    <group name="three-medieval-villages">
      {/* Cobblestone Plazas for all 3 Villages */}
      {plazas.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, p.y + 0.04, p.z]} receiveShadow>
          <circleGeometry args={[p.r, 40]} />
          <meshStandardMaterial map={textures.cobblestone} color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}

      {/* Market Stalls (Toko Buah, Ikan, Sayur & Roti) */}
      {stalls.map((st, idx) => (
        <MarketStall key={idx} stall={st} textures={textures} />
      ))}

      {/* Giant Mossy Framing Trees (Reference Image 055154_2) */}
      {trees.map((t, idx) => (
        <group key={idx} position={[t.x, t.y, t.z]}>
          <mesh castShadow receiveShadow position={[0, 8.0, 0]}>
            <cylinderGeometry args={[1.25, 2.1, 16.0, 12]} />
            <meshStandardMaterial map={textures.oakBark} color="#6b4c30" roughness={0.9} />
          </mesh>
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

      {/* Connected Medieval Rowhouses with 6 Distinct Architectural Variants */}
      {houses.map((h, i) => (
        <group key={i} position={[h.x, h.y, h.z]} rotation={[0, h.rotY, 0]} scale={[h.scale, h.scale, h.scale]}>
          {/* Base 1st Floor Stone */}
          <mesh castShadow receiveShadow position={[0, 2.2, 0]}>
            <boxGeometry args={[9.8, 4.4, 7.6]} />
            <meshStandardMaterial map={textures.villageStone} color="#94a3b8" roughness={0.88} />
          </mesh>
          {/* 2nd Floor Half-Timber Jetty */}
          <mesh castShadow receiveShadow position={[0, 6.2, 0]}>
            <boxGeometry args={[10.4, 4.0, 8.4]} />
            <meshStandardMaterial map={textures.halfTimber} color="#e2e8f0" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0, 4.3, 0]}><boxGeometry args={[10.7, 0.38, 8.6]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[0, 8.1, 0]}><boxGeometry args={[10.7, 0.38, 8.6]} /><meshStandardMaterial color="#4a2c18" /></mesh>

          {/* Variant 1: L-Shaped Tavern / Inn */}
          {h.variant === "tavern_L" && (
            <group>
              <mesh castShadow receiveShadow position={[0, 10.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[8.4, 4.6, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#e11d48" />
              </mesh>
              <mesh castShadow receiveShadow position={[-2.6, 5.2, 4.2]}>
                <boxGeometry args={[4.6, 6.4, 3.6]} />
                <meshStandardMaterial map={textures.halfTimber} color="#fef3c7" />
              </mesh>
              <mesh castShadow position={[-2.6, 9.6, 4.2]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[3.8, 3.2, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#be123c" />
              </mesh>
            </group>
          )}

          {/* Variant 2: 3-Story Stone & Timber Watchtower House (Reference Image 055154_2 Center) */}
          {h.variant === "tower_house" && (
            <group>
              <mesh castShadow receiveShadow position={[0, 9.6, 0]}>
                <boxGeometry args={[8.8, 3.4, 7.4]} />
                <meshStandardMaterial map={textures.villageStone} color="#cbd5e1" />
              </mesh>
              <mesh castShadow receiveShadow position={[0, 13.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[8.2, 4.8, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#e11d48" />
              </mesh>
              <group position={[3.6, 0, 2.4]}>
                <mesh castShadow receiveShadow position={[0, 7.2, 0]}>
                  <boxGeometry args={[4.6, 14.4, 4.6]} />
                  <meshStandardMaterial map={textures.villageStone} color="#94a3b8" />
                </mesh>
                <mesh castShadow position={[0, 16.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                  <coneGeometry args={[4.1, 4.4, 4]} />
                  <meshStandardMaterial map={textures.redRoof} color="#9f1239" />
                </mesh>
                <mesh position={[-1.0, 10.5, 2.34]} material={windowMaterial}><planeGeometry args={[0.9, 1.3]} /></mesh>
                <mesh position={[1.0, 10.5, 2.34]} material={windowMaterial}><planeGeometry args={[0.9, 1.3]} /></mesh>
              </group>
            </group>
          )}

          {/* Variant 3: Stepped-Gable Merchant Guildhouse */}
          {h.variant === "merchant_gable" && (
            <group>
              <mesh castShadow receiveShadow position={[0, 10.4, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[8.4, 5.2, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#b91c1c" />
              </mesh>
              <mesh castShadow position={[0, 4.2, 4.6]}><boxGeometry args={[6.2, 0.28, 1.5]} /><meshStandardMaterial color="#4a2c18" /></mesh>
            </group>
          )}

          {/* Variant 4: Overpass Archway House */}
          {h.variant === "overpass_arch" && (
            <group>
              <mesh castShadow receiveShadow position={[0, 10.2, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[8.4, 4.6, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#dc2626" />
              </mesh>
              <mesh castShadow position={[0, 5.8, 5.2]}>
                <boxGeometry args={[5.4, 3.2, 3.2]} />
                <meshStandardMaterial map={textures.halfTimber} color="#cbd5e1" />
              </mesh>
            </group>
          )}

          {/* Variant 5: Blacksmith Forge with Tall Stone Chimney */}
          {h.variant === "blacksmith" && (
            <group>
              <mesh castShadow receiveShadow position={[0, 9.8, 0]} rotation={[0, Math.PI / 4, 0]}>
                <coneGeometry args={[8.0, 4.0, 4]} />
                <meshStandardMaterial map={textures.redRoof} color="#7f1d1d" />
              </mesh>
              <mesh castShadow position={[-3.8, 7.5, 1.5]}>
                <boxGeometry args={[1.8, 15.0, 1.8]} />
                <meshStandardMaterial map={textures.villageStone} color="#475569" />
              </mesh>
            </group>
          )}

          {/* Variant 6: Village Windmill */}
          {h.variant === "windmill" && (
            <group>
              <mesh castShadow receiveShadow position={[0, 11.0, 0]}>
                <cylinderGeometry args={[3.2, 4.4, 10.0, 12]} />
                <meshStandardMaterial map={textures.halfTimber} color="#e2e8f0" />
              </mesh>
              <mesh castShadow position={[0, 17.5, 0]}>
                <coneGeometry args={[3.8, 3.8, 12]} />
                <meshStandardMaterial map={textures.redRoof} color="#b91c1c" />
              </mesh>
              <group ref={i === 16 ? windmillBladesRef : undefined} position={[0, 13.5, 3.6]}>
                <mesh castShadow><boxGeometry args={[13.0, 0.9, 0.15]} /><meshStandardMaterial color="#fef3c7" /></mesh>
                <mesh castShadow><boxGeometry args={[0.9, 13.0, 0.15]} /><meshStandardMaterial color="#fef3c7" /></mesh>
              </group>
            </group>
          )}

          {/* Glowing Multipane Windows */}
          <mesh position={[-2.4, 6.2, 4.24]} material={windowMaterial}><planeGeometry args={[2.2, 1.35]} /></mesh>
          <mesh position={[1.8, 6.2, 4.24]} material={windowMaterial}><planeGeometry args={[2.2, 1.35]} /></mesh>
          <mesh position={[-2.4, 2.3, 3.84]} material={windowMaterial}><planeGeometry args={[1.6, 1.2]} /></mesh>
          <mesh position={[0, 6.2, -4.24]} rotation={[0, Math.PI, 0]} material={windowMaterial}><planeGeometry args={[2.8, 1.4]} /></mesh>
        </group>
      ))}
    </group>
  );
}
