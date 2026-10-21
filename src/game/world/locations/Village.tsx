"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getExactMeshTerrainHeight,
  addBoxCollider,
  addEnterableHouseColliders,
  clearGroupColliders,
  INTERACTIVE_DOORS,
} from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { npcLivePositions } from "@/game/npc/NPCSystem";

// 8 Genuinely Distinct House Architectural Silhouettes!
type HouseVariant =
  | "cottage_porch"
  | "tall_manor"
  | "round_wizard_tower"
  | "tavern_L_inn"
  | "stepped_guildhall"
  | "barn_gambrel"
  | "blacksmith_forge"
  | "windmill_keep";

interface HouseItem {
  id: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  variant: HouseVariant;
  wallMat: THREE.MeshStandardMaterial;
  upperMat: THREE.MeshStandardMaterial;
  roofMat: THREE.MeshStandardMaterial;
}

type StallType = "fruit" | "fish" | "veggie" | "bakery";

interface MarketStallItem {
  x: number;
  y: number;
  z: number;
  rotY: number;
  type: StallType;
}

function MarketStall({ stall, textures, woodMat }: { stall: MarketStallItem; textures: Record<string, THREE.CanvasTexture>; woodMat: THREE.Material }) {
  const awningTex =
    stall.type === "fruit" ? textures.awningRed :
    stall.type === "fish" ? textures.awningBlue :
    stall.type === "veggie" ? textures.awningGreen : textures.awningGold;

  return (
    <group position={[stall.x, stall.y, stall.z]} rotation={[0, stall.rotY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.9, 0]} material={woodMat}>
        <boxGeometry args={[4.4, 1.1, 2.2]} />
      </mesh>
      {[-2.0, 2.0].map((px, i) => (
        <group key={i}>
          <mesh position={[px, 1.8, 0.95]} material={woodMat}><cylinderGeometry args={[0.08, 0.08, 3.6, 6]} /></mesh>
          <mesh position={[px, 1.8, -0.95]} material={woodMat}><cylinderGeometry args={[0.08, 0.08, 3.6, 6]} /></mesh>
        </group>
      ))}
      <mesh castShadow position={[0, 3.55, 0]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[4.8, 0.18, 2.8]} />
        <meshStandardMaterial map={awningTex} roughness={0.8} />
      </mesh>
      {stall.type === "fruit" && (
        <group position={[0, 1.55, 0]}>
          {[-1.3, 0, 1.3].map((cx, idx) => (
            <group key={idx} position={[cx, 0, 0]}>
              <mesh material={woodMat}><boxGeometry args={[1.1, 0.28, 1.5]} /></mesh>
              {[-0.28, 0, 0.28].map((fx, j) => (
                <mesh key={j} position={[fx, 0.22, 0.2]}>
                  <sphereGeometry args={[0.17, 6, 6]} />
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
              <sphereGeometry args={[0.35, 6, 6]} />
              <meshStandardMaterial color={idx % 2 === 0 ? "#94a3b8" : "#fb7185"} />
            </mesh>
          ))}
        </group>
      )}
      {stall.type === "veggie" && (
        <group position={[0, 1.55, 0]}>
          {[-1.4, -0.9, -0.4].map((vx, i) => (
            <mesh key={i} position={[vx, 0.2, 0.2]}><dodecahedronGeometry args={[0.24, 0]} /><meshStandardMaterial color="#4ade80" /></mesh>
          ))}
          {[0.3, 0.9, 1.5].map((px, i) => (
            <mesh key={i} position={[px, 0.24, -0.15]} scale={[1.1, 0.8, 1.1]}><sphereGeometry args={[0.28, 6, 6]} /><meshStandardMaterial color="#ea580c" /></mesh>
          ))}
        </group>
      )}
      {stall.type === "bakery" && (
        <group position={[0, 1.55, 0]}>
          {[-1.2, -0.4, 0.4, 1.2].map((bx, i) => (
            <mesh key={i} position={[bx, 0.16, 0.15]} scale={[1.4, 0.7, 0.9]}>
              <sphereGeometry args={[0.22, 6, 6]} />
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
  const windmillBladesRef = useRef<THREE.Group>(null);

  // Rich Palette of Shared Materials for Diverse House Styles (Zero per-house material overhead!)
  const windowMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 2.0 }), []);
  const beamMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3e2411", roughness: 0.9 }), []);
  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#7c4d2b", roughness: 0.8 }), [textures.woodPlanks]);
  const floorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#5c3a21", roughness: 0.9 }), [textures.woodPlanks]);

  const palette = useMemo(() => ({
    walls: [
      new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#94a3b8", roughness: 0.88 }),
      new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#cbd5e1", roughness: 0.86 }),
      new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#a16207", roughness: 0.85 }),
      new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#d6d3d1", roughness: 0.88 }),
    ],
    uppers: [
      new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#f8fafc", roughness: 0.82 }),
      new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#fde68a", roughness: 0.82 }), // Warm Ochre
      new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#bae6fd", roughness: 0.82 }), // Coastal Sky Blue
      new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#bbf7d0", roughness: 0.82 }), // Woodland Sage
      new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#fecdd3", roughness: 0.82 }), // Rose Terracotta
    ],
    roofs: [
      new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#e11d48", roughness: 0.78 }), // Crimson Tile
      new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#b45309", roughness: 0.80 }), // Amber Thatch/Tile
      new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#0369a1", roughness: 0.76 }), // Maritime Slate Blue
      new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#15803d", roughness: 0.82 }), // Woodland Moss Green
      new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#334155", roughness: 0.78 }), // Dark Charcoal Slate
    ],
  }), [textures]);

  const { houses, stalls, plazas } = useMemo(() => {
    const hList: HouseItem[] = [];
    const sList: MarketStallItem[] = [];
    const variants: HouseVariant[] = [
      "cottage_porch",
      "tall_manor",
      "round_wizard_tower",
      "tavern_L_inn",
      "stepped_guildhall",
      "barn_gambrel",
      "blacksmith_forge",
      "windmill_keep",
    ];

    const villageCenters = [
      { prefix: "east", cx: 365,  cz: 0,    themeRoof: [0, 1, 4], themeUpper: [0, 1, 4] }, // Medieval Half-Timber
      { prefix: "sw",   cx: -280, cz: 240,  themeRoof: [2, 4, 1], themeUpper: [2, 0, 1] }, // Coastal Maritime
      { prefix: "west", cx: -245, cz: -95,  themeRoof: [3, 1, 4], themeUpper: [3, 1, 0] }, // Woodland Nordic
    ];

    const pList = villageCenters.map((v) => ({
      x: v.cx,
      y: getExactMeshTerrainHeight(v.cx, v.cz),
      z: v.cz,
      r: 86,
    }));

    villageCenters.forEach((vc, vIdx) => {
      let hCounter = 0;
      const addHouse = (dx: number, dz: number, rotY: number, seedIdx: number) => {
        const wx = vc.cx + dx, wz = vc.cz + dz;
        const variant = variants[(seedIdx * 3 + vIdx * 2) % variants.length];
        // Varied proportions per house so adjacent houses have distinct heights & depths!
        const scaleX = 0.95 + ((seedIdx * 7) % 5) * 0.06;
        const scaleY = 0.90 + ((seedIdx * 11) % 6) * 0.08;
        const scaleZ = 0.92 + ((seedIdx * 13) % 5) * 0.06;
        const wallMat = palette.walls[(seedIdx + vIdx) % palette.walls.length];
        const upperMat = palette.uppers[vc.themeUpper[seedIdx % vc.themeUpper.length]];
        const roofMat = palette.roofs[vc.themeRoof[(seedIdx + 1) % vc.themeRoof.length]];

        hList.push({
          id: vc.prefix + "_house_" + hCounter++,
          x: wx,
          y: getExactMeshTerrainHeight(wx, wz),
          z: wz,
          rotY,
          scaleX,
          scaleY,
          scaleZ,
          variant,
          wallMat,
          upperMat,
          roofMat,
        });
      };

      [-48, -36, -24, -12, 0, 12, 24, 36, 48].forEach((dx, i) => addHouse(dx, -18, 0, i));
      [-48, -36, -24, -12, 0, 12, 24, 36, 48].forEach((dx, i) => addHouse(dx, 18, Math.PI, i + 5));
      [-36, -24, -12, 0, 12, 24, 36].forEach((dx, i) => addHouse(dx, -38, 0, i + 11));
      [-36, -24, -12, 0, 12, 24, 36].forEach((dx, i) => addHouse(dx, 38, Math.PI, i + 17));
      addHouse(64, -12, -Math.PI / 2, 23);
      addHouse(64, 12,  -Math.PI / 2, 29);

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
  }, [palette]);

  useEffect(() => {
    clearGroupColliders("village");
    houses.forEach((h) => {
      addEnterableHouseColliders(h.id, h.x, h.y, h.z, h.rotY, 9.6 * h.scaleX, 7.6 * h.scaleZ, "Pintu Rumah Desa", "village");
    });
    stalls.forEach((s) => {
      addBoxCollider(s.x, s.z, 4.6, 2.4, "village");
    });
  }, [houses, stalls]);

  const lastNpcDoorCheck = useRef(0);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    windowMaterial.emissiveIntensity = 0.55 + globalUniforms.uNightFactor.value * 3.5;
    if (windmillBladesRef.current) windmillBladesRef.current.rotation.z += dt * 0.9;

    if (t - lastNpcDoorCheck.current > 0.5) {
      lastNpcDoorCheck.current = t;
      const npcCoords = Object.values(npcLivePositions);
      for (let i = 0; i < INTERACTIVE_DOORS.length; i++) {
        const d = INTERACTIVE_DOORS[i];
        if (d.group !== "village") continue;
        for (let j = 0; j < npcCoords.length; j++) {
          const n = npcCoords[j];
          if (Math.hypot(n.x - d.x, n.z - d.z) < 3.2) {
            d.isOpen = true;
            break;
          }
        }
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
    <group name="three-distinct-medieval-villages">
      {plazas.map((p, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[p.x, p.y + 0.04, p.z]} receiveShadow>
          <circleGeometry args={[p.r, 36]} />
          <meshStandardMaterial map={textures.cobblestone} color="#94a3b8" roughness={0.9} />
        </mesh>
      ))}

      {stalls.map((st, idx) => (
        <MarketStall key={idx} stall={st} textures={textures} woodMat={doorMat} />
      ))}

      {houses.map((h, idx) => (
        <group key={h.id} position={[h.x, h.y, h.z]} rotation={[0, h.rotY, 0]} scale={[h.scaleX, h.scaleY, h.scaleZ]}>
          {/* Walkable Interior Floor & Table */}
          <mesh position={[0, 0.08, 0]} receiveShadow material={floorMat}><boxGeometry args={[9.2, 0.14, 7.2]} /></mesh>
          <mesh position={[0, 0.85, -1.5]} material={doorMat}><boxGeometry args={[2.2, 0.9, 1.4]} /></mesh>

          {/* Ground Floor Hollow Walls */}
          <mesh castShadow receiveShadow position={[0, 2.2, -3.6]} material={h.wallMat}><boxGeometry args={[9.6, 4.4, 0.45]} /></mesh>
          <mesh castShadow receiveShadow position={[-4.6, 2.2, 0]} material={h.wallMat}><boxGeometry args={[0.45, 4.4, 7.6]} /></mesh>
          <mesh castShadow receiveShadow position={[4.6, 2.2, 0]} material={h.wallMat}><boxGeometry args={[0.45, 4.4, 7.6]} /></mesh>
          <mesh castShadow receiveShadow position={[-2.85, 2.2, 3.6]} material={h.wallMat}><boxGeometry args={[3.9, 4.4, 0.45]} /></mesh>
          <mesh castShadow receiveShadow position={[2.85, 2.2, 3.6]} material={h.wallMat}><boxGeometry args={[3.9, 4.4, 0.45]} /></mesh>
          <mesh position={[0, 3.55, 3.6]} material={h.wallMat}><boxGeometry args={[1.9, 1.7, 0.45]} /></mesh>

          {/* Hinged Interactive Wooden Door */}
          <group position={[-0.9, 0, 3.65]} ref={(el) => { doorPivotRefs.current[h.id] = el; }}>
            <mesh position={[0.9, 1.35, 0]} material={doorMat}><boxGeometry args={[1.8, 2.7, 0.14]} /></mesh>
          </group>

          {/* --- 8 DISTINCT ARCHITECTURAL SILHOUETTES --- */}
          {/* 1. Low Cozy Cottage with Front Porch Awning & Flower Boxes */}
          {h.variant === "cottage_porch" && (
            <group>
              <mesh castShadow position={[0, 6.2, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[8.0, 4.2, 4]} /></mesh>
              <mesh position={[0, 3.3, 4.6]} rotation={[0.25, 0, 0]} material={h.roofMat}><boxGeometry args={[5.5, 0.2, 2.2]} /></mesh>
              <mesh position={[-2.4, 1.65, 5.4]} material={beamMat}><cylinderGeometry args={[0.1, 0.1, 3.3, 6]} /></mesh>
              <mesh position={[2.4, 1.65, 5.4]} material={beamMat}><cylinderGeometry args={[0.1, 0.1, 3.3, 6]} /></mesh>
            </group>
          )}

          {/* 2. Tall 3-Story Noble Manor with Twin Gables */}
          {h.variant === "tall_manor" && (
            <group>
              <mesh castShadow position={[0, 6.2, 0]} material={h.upperMat}><boxGeometry args={[10.2, 4.0, 8.2]} /></mesh>
              <mesh castShadow position={[0, 9.6, 0]} material={h.upperMat}><boxGeometry args={[9.4, 3.0, 7.6]} /></mesh>
              <mesh castShadow position={[-2.4, 12.8, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[5.2, 4.2, 4]} /></mesh>
              <mesh castShadow position={[2.4, 12.8, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[5.2, 4.2, 4]} /></mesh>
              <mesh position={[-2.4, 9.6, 3.85]} material={windowMaterial}><planeGeometry args={[1.6, 1.4]} /></mesh>
              <mesh position={[2.4, 9.6, 3.85]} material={windowMaterial}><planeGeometry args={[1.6, 1.4]} /></mesh>
            </group>
          )}

          {/* 3. Cylindrical Turret House with Conical Wizard Spire */}
          {h.variant === "round_wizard_tower" && (
            <group>
              <mesh castShadow position={[0, 6.0, 0]} material={h.upperMat}><boxGeometry args={[9.8, 3.6, 8.0]} /></mesh>
              <mesh castShadow position={[0, 9.6, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[7.8, 4.0, 4]} /></mesh>
              <group position={[3.6, 0, 2.4]}>
                <mesh castShadow position={[0, 7.5, 0]} material={h.wallMat}><cylinderGeometry args={[2.5, 2.7, 15.0, 12]} /></mesh>
                <mesh castShadow position={[0, 17.5, 0]} material={h.roofMat}><coneGeometry args={[3.1, 5.5, 12]} /></mesh>
                <mesh position={[0, 11.5, 2.55]} material={windowMaterial}><planeGeometry args={[1.1, 1.8]} /></mesh>
              </group>
            </group>
          )}

          {/* 4. Asymmetric L-Wing Tavern Inn with Balcony */}
          {h.variant === "tavern_L_inn" && (
            <group>
              <mesh castShadow position={[0, 6.2, 0]} material={h.upperMat}><boxGeometry args={[10.4, 4.0, 8.2]} /></mesh>
              <mesh castShadow position={[0, 10.2, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[8.4, 4.5, 4]} /></mesh>
              <group position={[-2.8, 5.2, 4.2]}>
                <mesh castShadow material={h.upperMat}><boxGeometry args={[4.4, 6.0, 3.6]} /></mesh>
                <mesh castShadow position={[0, 4.4, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[3.8, 3.2, 4]} /></mesh>
                <mesh position={[0, 1.0, 1.85]} material={windowMaterial}><planeGeometry args={[1.8, 1.3]} /></mesh>
              </group>
              <mesh position={[2.2, 4.2, 4.6]} material={beamMat}><boxGeometry args={[4.2, 0.3, 1.4]} /></mesh>
            </group>
          )}

          {/* 5. Stepped-Gable Merchant Guildhall */}
          {h.variant === "stepped_guildhall" && (
            <group>
              <mesh castShadow position={[0, 6.2, 0]} material={h.upperMat}><boxGeometry args={[9.8, 4.0, 8.2]} /></mesh>
              <mesh castShadow position={[0, 9.4, 0]} material={h.upperMat}><boxGeometry args={[7.2, 2.4, 8.0]} /></mesh>
              <mesh castShadow position={[0, 11.4, 0]} material={h.upperMat}><boxGeometry args={[4.4, 1.8, 7.8]} /></mesh>
              <mesh castShadow position={[0, 13.2, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[4.2, 2.4, 4]} /></mesh>
            </group>
          )}

          {/* 6. Wide Gambrel-Roof Timber Barn / Granary */}
          {h.variant === "barn_gambrel" && (
            <group>
              <mesh castShadow position={[0, 6.0, 0]} rotation={[0, 0, Math.PI / 4]} material={h.roofMat}><boxGeometry args={[7.2, 7.2, 8.4]} /></mesh>
              <mesh position={[0, 6.2, 4.25]} material={windowMaterial}><circleGeometry args={[1.1, 12]} /></mesh>
            </group>
          )}

          {/* 7. Blacksmith Forge with Tall Stone Smelting Chimney */}
          {h.variant === "blacksmith_forge" && (
            <group>
              <mesh castShadow position={[0, 5.8, 0]} material={h.upperMat}><boxGeometry args={[9.8, 3.2, 8.0]} /></mesh>
              <mesh castShadow position={[0, 9.2, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[8.0, 3.8, 4]} /></mesh>
              <mesh castShadow position={[-3.9, 7.8, 1.8]} material={h.wallMat}><boxGeometry args={[1.9, 15.6, 1.9]} /></mesh>
            </group>
          )}

          {/* 8. Tall Octagonal Windmill Keep */}
          {h.variant === "windmill_keep" && (
            <group>
              <mesh castShadow position={[0, 8.8, 0]} material={h.upperMat}><cylinderGeometry args={[3.1, 4.3, 9.5, 10]} /></mesh>
              <mesh castShadow position={[0, 15.2, 0]} material={h.roofMat}><coneGeometry args={[3.7, 3.6, 10]} /></mesh>
              <group ref={idx % 8 === 7 ? windmillBladesRef : undefined} position={[0, 11.5, 3.5]}>
                <mesh material={beamMat}><boxGeometry args={[12.5, 0.85, 0.15]} /></mesh>
                <mesh material={beamMat}><boxGeometry args={[0.85, 12.5, 0.15]} /></mesh>
              </group>
            </group>
          )}

          {/* Glowing Ground & Second Floor Windows */}
          <mesh position={[-2.8, 2.2, 3.85]} material={windowMaterial}><planeGeometry args={[1.4, 1.2]} /></mesh>
          <mesh position={[2.8, 2.2, 3.85]} material={windowMaterial}><planeGeometry args={[1.4, 1.2]} /></mesh>
          <mesh position={[-2.2, 6.0, 4.18]} material={windowMaterial}><planeGeometry args={[1.8, 1.3]} /></mesh>
          <mesh position={[2.2, 6.0, 4.18]} material={windowMaterial}><planeGeometry args={[1.8, 1.3]} /></mesh>
        </group>
      ))}
    </group>
  );
}
