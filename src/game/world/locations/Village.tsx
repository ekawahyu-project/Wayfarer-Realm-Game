"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { addBoxCollider, addCylinderCollider, clearCollidersByTag } from "@/game/systems/Physics";

type HouseVariant = 'cottage' | 'tall_manor' | 'windmill_keep' | 'round_wizard_tower' | 'tavern_L_inn' | 'stepped_guildhall' | 'blacksmith_forge';

interface HouseData {
  id: string;
  x: number;
  y: number;
  z: number;
  rot: number;
  wallMat: THREE.Material;
  upperWallMat: THREE.Material;
  roofMat: THREE.Material;
  variant: HouseVariant;
}

interface StallData {
  x: number;
  y: number;
  z: number;
  rot: number;
  awningMat: THREE.Material;
}

export default function Village() {
  const textures = useMemo(() => getWorldTextures(), []);
  const eastGroupRef = useRef<THREE.Group>(null);
  const swGroupRef = useRef<THREE.Group>(null);
  const westGroupRef = useRef<THREE.Group>(null);
  const bladesRefs = useRef<(THREE.Group | null)[]>([]);
  const doorPivotRefs = useRef<Record<string, THREE.Group | null>>({});
  const doorOpenState = useRef<Record<string, boolean>>({});

  const windowMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textures.windowLattice, color: "#fef08a", emissive: "#f59e0b", emissiveMap: textures.windowLattice, emissiveIntensity: 1.6, roughness: 0.4 }),
    [textures.windowLattice]
  );
  const beamMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#3b2210", roughness: 0.85 }), []);
  const doorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#8c5228", roughness: 0.82 }), [textures.woodPlanks]);
  const stoneTrimMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#94a3b8", roughness: 0.85 }), [textures.villageStone]);
  constplazaPaverMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.cobblestone, color: "#b8ada0", roughness: 0.86 }), [textures.cobblestone]);

  const palette = useMemo(
    () => ({
      walls: [
        new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#eee3ce", roughness: 0.82 }),
        new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#e5d5bc", roughness: 0.84 }),
        new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#dcd6cc", roughness: 0.85 }),
        new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#c28452", roughness: 0.82 }),
      ],
      // 6 Valid Pixar Storybook Roof Materials (Zero undefined / zero white roofs!)
      roofs: [
        new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#c84b31", roughness: 0.75 }), // Terracotta Red
        new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#b45309", roughness: 0.78 }), // Warm Amber Clay
        new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#476885", roughness: 0.76 }), // Royal Slate Blue
        new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#5c7c32", roughness: 0.80 }), // Woodland Moss Green
        new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#854d0e", roughness: 0.78 }), // Aged Cedar Brown
        new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#9a3412", roughness: 0.76 }), // Burnt Sienna
      ],
      awnings: [
        new THREE.MeshStandardMaterial({ map: textures.awningRed, side: THREE.DoubleSide, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ map: textures.awningBlue, side: THREE.DoubleSide, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ map: textures.awningGreen, side: THREE.DoubleSide, roughness: 0.7 }),
        new THREE.MeshStandardMaterial({ map: textures.awningGold, side: THREE.DoubleSide, roughness: 0.7 }),
      ],
    }),
    [textures]
  );

  const { eastHouses, swHouses, westHouses, stalls, lamps, wells } = useMemo(() => {
    const variants: HouseVariant[] = [
      "cottage", "tall_manor", "tavern_L_inn", "stepped_guildhall",
      "round_wizard_tower", "blacksmith_forge", "windmill_keep",
    ];

    const buildTown = (cx: number, cz: number, tag: string) => {
      const hList: HouseData[] = [];
      const sList: StallData[] = [];
      const lList: [number, number, number][] = [];

      const addHouse = (dx: number, dz: number, rot: number, idx: number) => {
        const x = cx + dx;
        const z = cz + dz;
        const y = getTerrainHeight(x, z);
        const wLen = palette.walls.length;
        const rLen = palette.roofs.length;
        hList.push({
          id: tag + "_h_" + idx,
          x, y, z, rot,
          wallMat: palette.walls[idx % wLen],
          upperWallMat: palette.walls[(idx + 1) % wLen],
          roofMat: palette.roofs[idx % rLen],
          variant: variants[idx % variants.length],
        });
      };

      // Collision-Free Organic Medieval Layout (18.5m spacing so zero houses ever overlap!)
      const zN = [-20, -22, -19.5, -22.5, -20, -21.5, -19.5];
      const rN = [0.06, -0.04, 0.0, 0.05, -0.05, 0.04, -0.06];
      [-55.5, -37, -18.5, 0, 18.5, 37, 55.5].forEach((dx, i) => addHouse(dx, zN[i], rN[i], i));

      const zS = [20, 22, 19.5, 22.5, 20, 21.5, 19.5];
      const rS = [Math.PI - 0.06, Math.PI + 0.04, Math.PI, Math.PI - 0.05, Math.PI + 0.05, Math.PI - 0.04, Math.PI + 0.06];
      [-55.5, -37, -18.5, 0, 18.5, 37, 55.5].forEach((dx, i) => addHouse(dx, zS[i], rS[i], i + 7));

      const zOuterN = [-43, -45, -42, -44.5, -43];
      const rOuterN = [0.07, -0.05, 0.0, 0.05, -0.07];
      [-38, -19, 0, 19, 38].forEach((dx, i) => addHouse(dx, zOuterN[i], rOuterN[i], i + 14));

      const zOuterS = [43, 45, 42, 44.5, 43];
      const rOuterS = [Math.PI - 0.07, Math.PI + 0.05, Math.PI, Math.PI - 0.05, Math.PI + 0.07];
      [-38, -19, 0, 19, 38].forEach((dx, i) => addHouse(dx, zOuterS[i], rOuterS[i], i + 19));

      [-32, -16, 16, 32].forEach((dx, i) => {
        sList.push({ x: cx + dx, y: getTerrainHeight(cx + dx, cz - 8.5), z: cz - 8.5, rot: 0, awningMat: palette.awnings[i % 4] });
        sList.push({ x: cx + dx, y: getTerrainHeight(cx + dx, cz + 8.5), z: cz + 8.5, rot: Math.PI, awningMat: palette.awnings[(i + 2) % 4] });
      });

      [-44, -22, 0, 22, 44].forEach((dx) => {
        lList.push([cx + dx, getTerrainHeight(cx + dx, cz - 12), cz - 12]);
        lList.push([cx + dx, getTerrainHeight(cx + dx, cz + 12), cz + 12]);
      });

      return { hList, sList, lList, well: [cx, getTerrainHeight(cx, cz), cz] as [number, number, number] };
    };

    const e = buildTown(360, 0, "east");
    const sw = buildTown(-280, 240, "sw");
    const w = buildTown(-245, -95, "west");

    return {
      eastHouses: e.hList,
      swHouses: sw.hList,
      westHouses: w.hList,
      stalls: [...e.sList, ...sw.sList, ...w.sList],
      lamps: [...e.lList, ...sw.lList, ...w.lList],
      wells: [e.well, sw.well, w.well],
    };
  }, [palette]);

  const allHouses = useMemo(() => [...eastHouses, ...swHouses, ...westHouses], [eastHouses, swHouses, westHouses]);

  useEffect(() => {
    clearCollidersByTag("village");
    allHouses.forEach((h) => {
      addBoxCollider(h.x, h.z - 2.2, 9.6, 2.6, "village");
      addBoxCollider(h.x - 3.6, h.z, 2.2, 7.0, "village");
      addBoxCollider(h.x + 3.6, h.z, 2.2, 7.0, "village");
    });
    wells.forEach(([wx, , wz]) => {
      addCylinderCollider(wx, wz, 2.4, "village");
    });
    return () => {
      clearCollidersByTag("village");
    };
  }, [allHouses, wells]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyE") {
        let closestId = "";
        let minDist = 6.5;
        for (const h of allHouses) {
          const doorWorldX = h.x + Math.sin(h.rot) * 3.8;
          const doorWorldZ = h.z + Math.cos(h.rot) * 3.8;
          const d = Math.hypot(playerFrameState.x - doorWorldX, playerFrameState.z - doorWorldZ);
          if (d < minDist) {
            minDist = d;
            closestId = h.id;
          }
        }
        if (closestId) {
          doorOpenState.current[closestId] = !doorOpenState.current[closestId];
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allHouses]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const glow = globalUniforms.uWindowGlow.value;
    windowMaterial.emissiveIntensity = 0.55 + glow * 2.2;

    // High 750m Draw Distance so villages never pop abruptly!
    if (eastGroupRef.current) {
      eastGroupRef.current.visible = Math.hypot(playerFrameState.x - 360, playerFrameState.z - 0) < 750;
    }
    if (swGroupRef.current) {
      swGroupRef.current.visible = Math.hypot(playerFrameState.x - -280, playerFrameState.z - 240) < 750;
    }
    if (westGroupRef.current) {
      westGroupRef.current.visible = Math.hypot(playerFrameState.x - -245, playerFrameState.z - -95) < 750;
    }

    for (const b of bladesRefs.current) {
      if (b) b.rotation.z -= dt * 1.1;
    }

    for (const h of allHouses) {
      const pivot = doorPivotRefs.current[h.id];
      if (!pivot) continue;
      const targetRot = doorOpenState.current[h.id] ? -Math.PI * 0.62 : 0;
      pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, targetRot, dt * 7);
    }
  });

  let bladeIdx = 0;

  const renderHouse = (h: HouseData) => {
    const hasSecondFloor = h.variant === 'tall_manor' || h.variant === 'tavern_L_inn' || h.variant === 'stepped_guildhall' || h.variant === 'blacksmith_forge';
    return (
      <group key={h.id} position={[h.x, h.y, h.z]} rotation={[0, h.rot, 0]}>
        {/* Stone Foundation Plinth */}
        <mesh receiveShadow position={[0, 0.25, 0]} material={stoneTrimMat}><boxGeometry args={[10.2, 0.6, 8.0]} /></mesh>

        {/* Ground Floor Half-Timber / Stone Walls */}
        <mesh castShadow receiveShadow position={[0, 2.2, -3.5]} material={h.wallMat}><boxGeometry args={[9.6, 4.2, 0.4]} /></mesh>
        <mesh castShadow receiveShadow position={[-4.6, 2.2, 0]} material={h.wallMat}><boxGeometry args={[0.4, 4.2, 7.4]} /></mesh>
        <mesh castShadow receiveShadow position={[4.6, 2.2, 0]} material={h.wallMat}><boxGeometry args={[0.4, 4.2, 7.4]} /></mesh>
        <mesh castShadow receiveShadow position={[-2.8, 2.2, 3.5]} material={h.wallMat}><boxGeometry args={[3.8, 4.2, 0.4]} /></mesh>
        <mesh castShadow receiveShadow position={[2.8, 2.2, 3.5]} material={h.wallMat}><boxGeometry args={[3.8, 4.2, 0.4]} /></mesh>
        <mesh castShadow receiveShadow position={[0, 3.5, 3.5]} material={h.wallMat}><boxGeometry args={[2.0, 1.6, 0.4]} /></mesh>

        {/* Ground-Floor Timber Colonnade Pillars & Corbel Brackets (Reference Medieval Style) */}
        {[-4.3, -1.3, 1.3, 4.3].map((px, pIdx) => (
          <group key={"col_" + pIdx} position={[px, 0, 3.85]}>
            <mesh castShadow position={[0, 2.15, 0]} material={beamMat}><boxGeometry args={[0.32, 4.3, 0.32]} /></mesh>
            <mesh position={[0, 3.85, -0.18]} rotation={[0.6, 0, 0]} material={beamMat}><boxGeometry args={[0.24, 0.75, 0.22]} /></mesh>
          </group>
        ))}
        <mesh position={[0, 4.25, 3.82]} material={beamMat}><boxGeometry args={[10.2, 0.34, 0.48]} /></mesh>

        {/* Interactive Hinged Wooden Door */}
        <mesh position={[0, 1.45, 3.58]} material={beamMat}><boxGeometry args={[2.1, 2.9, 0.22]} /></mesh>
        <group position={[-0.9, 0, 3.62]} ref={(el) => { doorPivotRefs.current[h.id] = el; }}>
          <mesh position={[0.9, 1.35, 0]} material={doorMat}><boxGeometry args={[1.8, 2.7, 0.14]} /></mesh>
        </group>

        {/* Outdoor Wooden Bench & Barrel */}
        <mesh position={[-2.8, 0.55, 4.15]} material={doorMat}><boxGeometry args={[1.6, 0.12, 0.65]} /></mesh>
        <mesh position={[3.1, 0.55, 4.10]} material={doorMat}><cylinderGeometry args={[0.34, 0.38, 1.0, 10]} /></mesh>

        {/* Mullion Lattice Windows */}
        <mesh position={[-2.8, 2.2, 3.72]} material={windowMaterial}><planeGeometry args={[1.35, 1.2]} /></mesh>
        <mesh position={[-2.8, 1.55, 3.76]} material={beamMat}><boxGeometry args={[1.5, 0.14, 0.18]} /></mesh>
        <mesh position={[2.8, 2.2, 3.72]} material={windowMaterial}><planeGeometry args={[1.35, 1.2]} /></mesh>
        <mesh position={[2.8, 1.55, 3.76]} material={beamMat}><boxGeometry args={[1.5, 0.14, 0.18]} /></mesh>

        {hasSecondFloor && (
          <group>
            <mesh position={[-2.2, 5.8, 4.02]} material={windowMaterial}><planeGeometry args={[1.65, 1.25]} /></mesh>
            <mesh position={[-2.2, 5.12, 4.06]} material={beamMat}><boxGeometry args={[1.8, 0.15, 0.18]} /></mesh>
            <mesh position={[2.2, 5.8, 4.02]} material={windowMaterial}><planeGeometry args={[1.65, 1.25]} /></mesh>
            <mesh position={[2.2, 5.12, 4.06]} material={beamMat}><boxGeometry args={[1.8, 0.15, 0.18]} /></mesh>
          </group>
        )}

        {/* 7 Distinct Architectural Roof & Upper-Story Variants (All using valid h.roofMat!) */}
        {h.variant === 'cottage' && (
          <mesh castShadow position={[0, 5.8, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}>
            <coneGeometry args={[7.6, 3.6, 4]} />
          </mesh>
        )}

        {h.variant === 'tall_manor' && (
          <group>
            <mesh castShadow receiveShadow position={[0, 5.8, 0]} material={h.upperWallMat}><boxGeometry args={[10.2, 3.2, 7.9]} /></mesh>
            <mesh castShadow position={[0, 9.2, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[8.0, 4.0, 4]} /></mesh>
          </group>
        )}

        {h.variant === 'tavern_L_inn' && (
          <group>
            <mesh castShadow receiveShadow position={[0, 5.8, 0]} material={h.upperWallMat}><boxGeometry args={[10.2, 3.2, 7.9]} /></mesh>
            <mesh castShadow position={[0, 9.1, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[8.0, 3.8, 4]} /></mesh>
            <mesh castShadow receiveShadow position={[-3.2, 2.2, -5.2]} material={h.wallMat}><boxGeometry args={[4.4, 4.2, 3.8]} /></mesh>
            <mesh castShadow position={[-3.2, 5.5, -5.2]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[3.8, 2.6, 4]} /></mesh>
          </group>
        )}

        {h.variant === 'stepped_guildhall' && (
          <group>
            <mesh castShadow receiveShadow position={[0, 5.8, 0]} material={h.upperWallMat}><boxGeometry args={[10.2, 3.2, 7.9]} /></mesh>
            <mesh castShadow position={[0, 8.6, 0]} material={h.upperWallMat}><boxGeometry args={[7.2, 2.4, 7.9]} /></mesh>
            <mesh castShadow position={[0, 10.9, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[6.4, 2.8, 4]} /></mesh>
          </group>
        )}

        {h.variant === 'round_wizard_tower' && (
          <group>
            <mesh castShadow position={[0, 5.6, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[7.5, 3.2, 4]} /></mesh>
            <mesh castShadow receiveShadow position={[3.8, 5.5, 2.2]} material={stoneTrimMat}><cylinderGeometry args={[2.2, 2.4, 11.0, 14]} /></mesh>
            <mesh castShadow position={[3.8, 12.6, 2.2]} material={h.roofMat}><coneGeometry args={[2.8, 3.6, 14]} /></mesh>
          </group>
        )}

        {h.variant === 'blacksmith_forge' && (
          <group>
            <mesh castShadow receiveShadow position={[0, 5.8, 0]} material={h.upperWallMat}><boxGeometry args={[10.2, 3.2, 7.9]} /></mesh>
            <mesh castShadow position={[0, 9.0, 0]} rotation={[0, Math.PI / 4, 0]} material={h.roofMat}><coneGeometry args={[7.9, 3.6, 4]} /></mesh>
            <mesh castShadow position={[3.8, 6.2, -1.8]} material={stoneTrimMat}><boxGeometry args={[1.4, 9.5, 1.4]} /></mesh>
          </group>
        )}

        {h.variant === 'windmill_keep' && (() => {
          const myBladeIdx = bladeIdx++;
          return (
            <group>
              <mesh castShadow position={[0, 6.6, 0]} material={h.upperWallMat}><cylinderGeometry args={[2.9, 4.2, 5.6, 12]} /></mesh>
              <mesh castShadow position={[0, 10.8, 0]} material={h.roofMat}><coneGeometry args={[3.4, 3.0, 12]} /></mesh>
              <group position={[0, 8.2, 3.3]} ref={(el) => { bladesRefs.current[myBladeIdx] = el; }}>
                <mesh material={beamMat}><boxGeometry args={[0.4, 11.5, 0.2]} /></mesh>
                <mesh material={beamMat}><boxGeometry args={[11.5, 0.4, 0.2]} /></mesh>
              </group>
            </group>
          );
        })()}
      </group>
    );
  };

  return (
    <group name="medieval-villages">
      {/* Cobblestone Town Plazas */}
      {[[360, 0], [-280, 240], [-245, -95]].map(([px, pz], idx) => (
        <mesh key={"plaza_" + idx} receiveShadow position={[px, getTerrainHeight(px, pz) + 0.05, pz]} rotation={[-Math.PI / 2, 0, 0]} material={constplazaPaverMat}>
          <circleGeometry args={[62, 40]} />
        </mesh>
      ))}

      <group ref={eastGroupRef}>{eastHouses.map(renderHouse)}</group>
      <group ref={swGroupRef}>{swHouses.map(renderHouse)}</group>
      <group ref={westGroupRef}>{westHouses.map(renderHouse)}</group>

      {/* Market Stalls */}
      {stalls.map((s, i) => (
        <group key={"stall_" + i} position={[s.x, s.y, s.z]} rotation={[0, s.rot, 0]}>
          <mesh castShadow position={[0, 0.55, 0]} material={doorMat}><boxGeometry args={[3.2, 1.1, 1.6]} /></mesh>
          <mesh position={[-1.4, 1.4, -0.6]} material={beamMat}><cylinderGeometry args={[0.07, 0.07, 2.8, 6]} /></mesh>
          <mesh position={[1.4, 1.4, -0.6]} material={beamMat}><cylinderGeometry args={[0.07, 0.07, 2.8, 6]} /></mesh>
          <mesh position={[-1.4, 1.2, 0.6]} material={beamMat}><cylinderGeometry args={[0.07, 0.07, 2.4, 6]} /></mesh>
          <mesh position={[1.4, 1.2, 0.6]} material={beamMat}><cylinderGeometry args={[0.07, 0.07, 2.4, 6]} /></mesh>
          <mesh castShadow position={[0, 2.6, 0]} rotation={[0.22, 0, 0]} material={s.awningMat}><boxGeometry args={[3.6, 0.12, 2.2]} /></mesh>
        </group>
      ))}

      {/* Street Lanterns */}
      {lamps.map(([lx, ly, lz], i) => (
        <group key={"lamp_" + i} position={[lx, ly, lz]}>
          <mesh castShadow position={[0, 2.0, 0]} material={beamMat}><cylinderGeometry args={[0.09, 0.13, 4.0, 8]} /></mesh>
          <mesh position={[0, 4.1, 0]} material={windowMaterial}><cylinderGeometry args={[0.26, 0.18, 0.55, 6]} /></mesh>
        </group>
      ))}

      {/* Town Wells */}
      {wells.map(([wx, wy, wz], i) => (
        <group key={"well_" + i} position={[wx, wy, wz]}>
          <mesh castShadow receiveShadow position={[0, 0.6, 0]} material={stoneTrimMat}><cylinderGeometry args={[2.2, 2.4, 1.2, 14]} /></mesh>
          <mesh position={[-1.6, 2.0, 0]} material={beamMat}><boxGeometry args={[0.24, 2.8, 0.24]} /></mesh>
          <mesh position={[1.6, 2.0, 0]} material={beamMat}><boxGeometry args={[0.24, 2.8, 0.24]} /></mesh>
          <mesh castShadow position={[0, 3.6, 0]} rotation={[0, Math.PI / 4, 0]} material={palette.roofs[0]}><coneGeometry args={[2.6, 1.6, 4]} /></mesh>
        </group>
      ))}
    </group>
  );
}
