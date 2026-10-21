"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getExactMeshTerrainHeight,
  addBoxCollider,
  addCircleCollider,
  addEnterableHouseColliders,
  clearWorldColliders,
  INTERACTIVE_DOORS,
} from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { npcLivePositions } from "@/game/npc/NPCSystem";

type HouseVariant = "tavern_L" | "tower_house" | "overpass_arch" | "merchant_gable" | "blacksmith" | "windmill";

interface HouseItem {
  id: string;
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

function MarketStall({ stall, textures }: { stall: MarketStallItem; textures: Record<string, THREE.CanvasTexture> }) {
  const awningTex =
    stall.type === "fruit" ? textures.awningRed :
    stall.type === "fish" ? textures.awningBlue :
    stall.type === "veggie" ? textures.awningGreen : textures.awningGold;

  return (
    <group position={[stall.x, stall.y, stall.z]} rotation={[0, stall.rotY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]}>
        <boxGeometry args={[4.4, 1.1, 2.2]} />
        <meshStandardMaterial map={textures.woodPlanks} color="#855836" roughness={0.88} />
      </mesh>
      {[-2.0, 2.0].map((px, i) => (
        <group key={i}>
          <mesh castShadow position={[px, 1.8, 0.95]}><cylinderGeometry args={[0.08, 0.08, 3.6, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[px, 1.8, -0.95]}><cylinderGeometry args={[0.08, 0.08, 3.6, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
        </group>
      ))}
      <mesh castShadow receiveShadow position={[0, 3.55, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[4.8, 0.18, 2.8]} />
        <meshStandardMaterial map={awningTex} roughness={0.8} />
      </mesh>
      {stall.type === "fruit" && (
        <group position={[0, 1.55, 0]}>
          {[-1.3, 0, 1.3].map((cx, idx) => (
            <group key={idx} position={[cx, 0, 0]}>
              <mesh castShadow><boxGeometry args={[1.1, 0.28, 1.5]} /><meshStandardMaterial color="#854d0e" /></mesh>
              {[-0.28, 0, 0.28].map((fx, j) => (
                <mesh key={j} position={[fx, 0.22, 0.2]}>
                  <sphereGeometry args={[0.17, 8, 8]} />
                  <meshStandardMaterial color={idx === 0 ? "#ef4444" : idx === 1 ? "#f97316" : "#15803d"} />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      )}
      {stall.type === "fish" && (
        <group position={[0, 1.55, 0]}>
          <mesh position={[-0.6, 0.05, 0]}><boxGeometry args={[2.4, 0.16, 1.6]} /><meshStandardMaterial color="#e0f2fe" /></mesh>
          {[-1.3, -0.8, -0.3, 0.2].map((fx, idx) => (
            <mesh key={idx} position={[fx, 0.18, (idx % 2) * 0.25 - 0.1]} rotation={[0, 0.3, 0]} scale={[0.35, 0.12, 0.85]}>
              <sphereGeometry args={[0.35, 8, 8]} />
              <meshStandardMaterial color={idx % 2 === 0 ? "#94a3b8" : "#fb7185"} metalness={0.4} roughness={0.3} />
            </mesh>
          ))}
        </group>
      )}
      {stall.type === "veggie" && (
        <group position={[0, 1.55, 0]}>
          {[-1.4, -1.0, -0.6].map((vx, i) => (
            <mesh key={i} position={[vx, 0.2, 0.2]}><dodecahedronGeometry args={[0.24, 1]} /><meshStandardMaterial color="#4ade80" /></mesh>
          ))}
          {[0.2, 0.8, 1.4].map((px, i) => (
            <mesh key={i} position={[px, 0.24, -0.15]} scale={[1.1, 0.8, 1.1]}><sphereGeometry args={[0.28, 8, 8]} /><meshStandardMaterial color="#ea580c" /></mesh>
          ))}
        </group>
      )}
      {stall.type === "bakery" && (
        <group position={[0, 1.55, 0]}>
          {[-1.2, -0.4, 0.4, 1.2].map((bx, i) => (
            <mesh key={i} position={[bx, 0.16, 0.15]} scale={[1.4, 0.7, 0.9]}>
              <sphereGeometry args={[0.22, 8, 8]} />
              <meshStandardMaterial color={i % 2 === 0 ? "#d97706" : "#facc15"} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default function Village() {
  const textures = useMemo(() => getWorldTextures(), []);
  const doorPivotRefs = useRef<Record<string, THREE.Group | null>>({});
  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 2.0 }), []);
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#94a3b8", roughness: 0.88 }), [textures.villageStone]);
  const timberMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#e2e8f0", roughness: 0.82 }), [textures.halfTimber]);
  const roofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#e11d48", roughness: 0.78 }), [textures.redRoof]);
  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#7c4d2b", roughness: 0.8 }), [textures.woodPlanks]);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#5c3a21", roughness: 0.9 }), [textures.woodPlanks]);

  // Build 3 Equally Large, Dense Medieval Villages (36 connected houses + 8-stall market in EACH village = 108 houses total!)
  const { houses, stalls, plazas } = useMemo(() => {
    const hList: HouseItem[] = [];
    const sList: MarketStallItem[] = [];
    const variants: HouseVariant[] = ["tavern_L", "tower_house", "merchant_gable", "overpass_arch", "blacksmith", "windmill"];

    const villageCenters = [
      { prefix: "east", cx: 365, cz: 0 },
      { prefix: "sw",   cx: -280, cz: 240 },
      { prefix: "west", cx: -245, cz: -95 },
    ];

    const pList = villageCenters.map((v) => ({
      x: v.cx,
      y: getExactMeshTerrainHeight(v.cx, v.cz),
      z: v.cz,
      r: 88,
    }));

    villageCenters.forEach((vc, vIdx) => {
      let hCounter = 0;
      const addRow = (dx: number, dz: number, rotY: number, scale: number, varIdx: number) => {
        const wx = vc.cx + dx, wz = vc.cz + dz;
        hList.push({
          id: vc.prefix + "_house_" + hCounter++,
          x: wx,
          y: getExactMeshTerrainHeight(wx, wz),
          z: wz,
          rotY,
          scale,
          variant: variants[(varIdx + vIdx) % variants.length],
        });
      };

      // 1. Inner North Street Row (9 tightly connected houses facing South toward Market)
      [-48, -36, -24, -12, 0, 12, 24, 36, 48].forEach((dx, i) => addRow(dx, -18, 0, 1.15, i));
      // 2. Inner South Street Row (9 tightly connected houses facing North toward Market)
      [-48, -36, -24, -12, 0, 12, 24, 36, 48].forEach((dx, i) => addRow(dx, 18, Math.PI, 1.15, i + 2));
      // 3. Outer North Avenue Row (8 connected houses)
      [-42, -30, -18, -6, 6, 18, 30, 42].forEach((dx, i) => addRow(dx, -38, 0, 1.14, i + 1));
      // 4. Outer South Avenue Row (8 connected houses)
      [-42, -30, -18, -6, 6, 18, 30, 42].forEach((dx, i) => addRow(dx, 38, Math.PI, 1.14, i + 3));
      // 5. East End Anchor Houses
      addRow(64, -12, -Math.PI / 2, 1.2, 1);
      addRow(64, 12,  -Math.PI / 2, 1.2, 5);

      // Complete 8-Stall Market in the Plaza of EVERY Village (Fruit, Fish, Veggie, Bakery)
      const stallSpecs: { dx: number; dz: number; rot: number; type: StallType }[] = [
        { dx: -18, dz: -7, rot: 0, type: "fruit" },
        { dx: -6,  dz: -7, rot: 0, type: "veggie" },
        { dx: 6,   dz: -7, rot: 0, type: "bakery" },
        { dx: 18,  dz: -7, rot: 0, type: "fish" },
        { dx: -18, dz: 7,  rot: Math.PI, type: "fish" },
        { dx: -6,  dz: 7,  rot: Math.PI, type: "fruit" },
        { dx: 6,   dz: 7,  rot: Math.PI, type: "veggie" },
        { dx: 18,  dz: 7,  rot: Math.PI, type: "bakery" },
      ];
      stallSpecs.forEach((st) => {
        const sx = vc.cx + st.dx, sz = vc.cz + st.dz;
        sList.push({ x: sx, y: getExactMeshTerrainHeight(sx, sz), z: sz, rotY: st.rot, type: st.type });
      });
    });

    return { houses: hList, stalls: sList, plazas: pList };
  }, []);

  useEffect(() => {
    clearWorldColliders();
    houses.forEach((h) => {
      addEnterableHouseColliders(h.id, h.x, h.y, h.z, h.rotY, 9.8 * h.scale, 7.6 * h.scale, "Pintu Rumah Desa");
    });
    stalls.forEach((s) => {
      addBoxCollider(s.x, s.z, 4.6, 2.4);
    });
  }, [houses, stalls]);

  // Animate hinged doors (smoothly swing open when opened by Player OR when an NPC walks near a door!)
  const lastNpcDoorCheck = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    windowMaterial.emissiveIntensity = 0.55 + globalUniforms.uNightFactor.value * 3.5;

    // NPCs automatically open nearby doors and close them after passing
    if (t - lastNpcDoorCheck.current > 0.5) {
      lastNpcDoorCheck.current = t;
      const npcCoords = Object.values(npcLivePositions);
      for (let i = 0; i < INTERACTIVE_DOORS.length; i++) {
        const d = INTERACTIVE_DOORS[i];
        if (d.id.startsWith("kingdom_")) continue;
        let npcNear = false;
        for (let j = 0; j < npcCoords.length; j++) {
          const n = npcCoords[j];
          if (Math.hypot(n.x - d.x, n.z - d.z) < 3.2) {
            npcNear = true;
            break;
          }
        }
        if (npcNear) d.isOpen = true;
      }
    }

    for (let i = 0; i < INTERACTIVE_DOORS.length; i++) {
      const d = INTERACTIVE_DOORS[i];
      const pivot = doorPivotRefs.current[d.id];
      if (pivot) {
        const targetRot = d.isOpen ? -Math.PI * 0.62 : 0.0;
        pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, targetRot, dt * 8);
      }
    }
  });

  return (
    <group name="three-expanded-medieval-villages">
      {plazas.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, p.y + 0.04, p.z]} receiveShadow>
          <circleGeometry args={[p.r, 40]} />
          <meshStandardMaterial map={textures.cobblestone} color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}

      {stalls.map((st, idx) => (
        <MarketStall key={idx} stall={st} textures={textures} />
      ))}

      {/* 108 Enterable Connected Medieval Houses with Hinged Doors & Interior Rooms */}
      {houses.map((h) => (
        <group key={h.id} position={[h.x, h.y, h.z]} rotation={[0, h.rotY, 0]} scale={[h.scale, h.scale, h.scale]}>
          {/* Walkable Wooden Interior Floor & Interior Table */}
          <mesh position={[0, 0.08, 0]} receiveShadow material={floorMat}>
            <boxGeometry args={[9.4, 0.14, 7.2]} />
          </mesh>
          <mesh position={[0, 0.85, -1.5]} castShadow material={doorMat}>
            <boxGeometry args={[2.2, 0.9, 1.4]} />
          </mesh>

          {/* Hollow Ground Floor Stone Walls (Back, Left, Right, and Front Left/Right of Doorway) */}
          <mesh castShadow receiveShadow position={[0, 2.2, -3.6]} material={stoneMat}><boxGeometry args={[9.8, 4.4, 0.45]} /></mesh>
          <mesh castShadow receiveShadow position={[-4.7, 2.2, 0]} material={stoneMat}><boxGeometry args={[0.45, 4.4, 7.6]} /></mesh>
          <mesh castShadow receiveShadow position={[4.7, 2.2, 0]} material={stoneMat}><boxGeometry args={[0.45, 4.4, 7.6]} /></mesh>
          <mesh castShadow receiveShadow position={[-2.9, 2.2, 3.6]} material={stoneMat}><boxGeometry args={[4.0, 4.4, 0.45]} /></mesh>
          <mesh castShadow receiveShadow position={[2.9, 2.2, 3.6]} material={stoneMat}><boxGeometry args={[4.0, 4.4, 0.45]} /></mesh>
          <mesh castShadow receiveShadow position={[0, 3.55, 3.6]} material={stoneMat}><boxGeometry args={[1.9, 1.7, 0.45]} /></mesh>

          {/* Hinged Interactive Front Wooden Door (Swings open on E or when NPC passes!) */}
          <group
            position={[-0.9, 0, 3.65]}
            ref={(el) => {
              doorPivotRefs.current[h.id] = el;
            }}
          >
            <mesh castShadow receiveShadow position={[0.9, 1.35, 0]} material={doorMat}>
              <boxGeometry args={[1.8, 2.7, 0.14]} />
            </mesh>
            {/* Brass Door Handle */}
            <mesh position={[1.55, 1.3, 0.10]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>

          {/* 2nd Floor Half-Timber Jetty */}
          <mesh castShadow receiveShadow position={[0, 6.2, 0]} material={timberMat}>
            <boxGeometry args={[10.4, 4.0, 8.4]} />
          </mesh>
          <mesh castShadow position={[0, 4.3, 0]}><boxGeometry args={[10.7, 0.38, 8.6]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          <mesh castShadow position={[0, 8.1, 0]}><boxGeometry args={[10.7, 0.38, 8.6]} /><meshStandardMaterial color="#4a2c18" /></mesh>

          {/* Steep Terracotta Roof & Variant Towers */}
          <mesh castShadow receiveShadow position={[0, 10.3, 0]} rotation={[0, Math.PI / 4, 0]} material={roofMat}>
            <coneGeometry args={[8.4, 4.8, 4]} />
          </mesh>
          {h.variant === "tower_house" && (
            <group position={[3.6, 0, 2.2]}>
              <mesh castShadow receiveShadow position={[0, 7.2, 0]} material={stoneMat}><boxGeometry args={[4.5, 14.4, 4.5]} /></mesh>
              <mesh castShadow position={[0, 16.0, 0]} rotation={[0, Math.PI / 4, 0]} material={roofMat}><coneGeometry args={[4.0, 4.2, 4]} /></mesh>
            </group>
          )}
          {h.variant === "tavern_L" && (
            <group position={[-2.6, 5.2, 4.2]}>
              <mesh castShadow receiveShadow material={timberMat}><boxGeometry args={[4.5, 6.2, 3.4]} /></mesh>
              <mesh castShadow position={[0, 4.4, 0]} rotation={[0, Math.PI / 4, 0]} material={roofMat}><coneGeometry args={[3.6, 3.0, 4]} /></mesh>
            </group>
          )}

          {/* Warm Glowing Windows */}
          <mesh position={[-2.4, 6.2, 4.24]} material={windowMaterial}><planeGeometry args={[2.2, 1.35]} /></mesh>
          <mesh position={[1.8, 6.2, 4.24]} material={windowMaterial}><planeGeometry args={[2.2, 1.35]} /></mesh>
          <mesh position={[-2.8, 2.2, 3.85]} material={windowMaterial}><planeGeometry args={[1.4, 1.2]} /></mesh>
          <mesh position={[2.8, 2.2, 3.85]} material={windowMaterial}><planeGeometry args={[1.4, 1.2]} /></mesh>
        </group>
      ))}
    </group>
  );
}
