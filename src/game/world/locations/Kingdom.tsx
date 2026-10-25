"use client";

import { addBoxCollider as addGlobalBox, addCylinderCollider as addGlobalCyl, clearCollidersByTag as clearGlobalTag } from "@/game/systems/Physics";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  getExactMeshTerrainHeight,
  addBoxCollider,
  addCircleCollider,
  clearGroupColliders,
  INTERACTIVE_DOORS,
} from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

const KINGDOM_X = 0;
const KINGDOM_Z = 395;

export default function Kingdom() {
  const baseY = useMemo(() => getExactMeshTerrainHeight(KINGDOM_X, KINGDOM_Z), []);
  const textures = useMemo(() => getWorldTextures(), []);
  const kingdomRootRef = useRef<THREE.Group>(null);

  const fortressGateLeftRef = useRef<THREE.Group>(null);
  const fortressGateRightRef = useRef<THREE.Group>(null);
  const palaceDoorLeftRef = useRef<THREE.Group>(null);
  const palaceDoorRightRef = useRef<THREE.Group>(null);

  // Authentic Medieval Stone, Terracotta Roof, Timber & Heraldic Banner Palette matching Foundation Reference (images_2.jpg)!
  const medievalStoneMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#e2e8f0", roughness: 0.78 }), [textures.villageStone]);
  const darkStoneTrimMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.villageStone, color: "#cbd5e1", roughness: 0.82 }), [textures.villageStone]);
  const terracottaRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#dc2626", roughness: 0.72 }), [textures.redRoof]);
  const darkTileRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#7f271b", roughness: 0.80 }), [textures.redRoof]);
  const timberWallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.halfTimber, color: "#d6cfc2", roughness: 0.84 }), [textures.halfTimber]);
  const woodDoorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#5c3818", roughness: 0.82 }), [textures.woodPlanks]);
  const cypressMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.leafFoliage, color: "#2d5a27", roughness: 0.82 }), [textures.leafFoliage]);
  const bannerBlueMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1d4ed8", roughness: 0.7 }), []);
  const bannerWhiteMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.7 }), []);
  const marbleMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.royalMarble, roughness: 0.25, metalness: 0.1 }), [textures.royalMarble]);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.85, roughness: 0.2 }), []);
  const velvetMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#991b1b", roughness: 0.7 }), []);
  const warmWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#ea580c", emissiveIntensity: 1.8 }), []);

  useEffect(() => {
    clearGroupColliders("kingdom");

    // 1. Outer Stone Curtain Walls (Walkable on top at Y = 38.0m)
    typeof addBoxCollider === "function" && addBoxCollider(-50, 315, 68, 5.5, "kingdom", 36.5);
    typeof addBoxCollider === "function" && addBoxCollider(50,  315, 68, 5.5, "kingdom", 36.5);
    typeof addBoxCollider === "function" && addBoxCollider(-84, 395, 5.5, 160, "kingdom", 36.5);
    typeof addBoxCollider === "function" && addBoxCollider(84,  395, 5.5, 160, "kingdom", 36.5);
    typeof addBoxCollider === "function" && addBoxCollider(-50, 472, 68, 5.5, "kingdom", 36.5);
    typeof addBoxCollider === "function" && addBoxCollider(50,  472, 68, 5.5, "kingdom", 36.5);

    // 2. Inner Bailey Cloister & Guard Towers
    addCircleCollider(-16, 368, 5.5, "kingdom");
    addCircleCollider(16,  368, 5.5, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(-48, 378, 18, 28, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(48,  378, 18, 28, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(-52, 422, 16, 26, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(52,  422, 16, 26, "kingdom");

    // 3. Central Multi-Towered Storrskog Citadel Keep (Enterable Great Hall at Z = 428..463)
    typeof addBoxCollider === "function" && addBoxCollider(0,   463, 66, 2.5, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(-33, 445, 2.5, 36, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(33,  445, 2.5, 36, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(-19, 428, 28, 2.5, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(19,  428, 28, 2.5, "kingdom");

    INTERACTIVE_DOORS.push({
      group: "kingdom",
      id: "kingdom_fortress_gate",
      x: 0,
      y: baseY,
      z: 315,
      rotY: 0,
      width: 12.0,
      height: 12.0,
      isOpen: true,
      label: "Gerbang Benteng Batu",
    });
    INTERACTIVE_DOORS.push({
      group: "kingdom",
      id: "kingdom_palace_door",
      x: 0,
      y: baseY,
      z: 428,
      rotY: 0,
      width: 9.0,
      height: 10.0,
      isOpen: true,
      label: "Pintu Agung Kastil Utama",
    });

    // Harbor & Shrine Colliders
    addCircleCollider(24, 548, 4.2, "kingdom");
    typeof addBoxCollider === "function" && addBoxCollider(-14, 578, 8.0, 20.0, "kingdom");
  }, [baseY]);

  useFrame((_state, delta) => {
    if (kingdomRootRef.current) kingdomRootRef.current.visible = playerFrameState.z > 85;
    if (playerFrameState.z <= 85) return;
    const dt = Math.min(delta, 0.05);
    const night = globalUniforms.uNightFactor.value;
    warmWindowMat.emissiveIntensity = 0.65 + night * 3.0;

    const fGate = INTERACTIVE_DOORS.find((d) => d.id === "kingdom_fortress_gate");
    if (fGate && fortressGateLeftRef.current && fortressGateRightRef.current) {
      const target = fGate.isOpen ? Math.PI * 0.48 : 0;
      fortressGateLeftRef.current.rotation.y = THREE.MathUtils.lerp(fortressGateLeftRef.current.rotation.y, -target, dt * 6);
      fortressGateRightRef.current.rotation.y = THREE.MathUtils.lerp(fortressGateRightRef.current.rotation.y, target, dt * 6);
    }
    const pDoor = INTERACTIVE_DOORS.find((d) => d.id === "kingdom_palace_door");
    if (pDoor && palaceDoorLeftRef.current && palaceDoorRightRef.current) {
      const target = pDoor.isOpen ? Math.PI * 0.52 : 0;
      palaceDoorLeftRef.current.rotation.y = THREE.MathUtils.lerp(palaceDoorLeftRef.current.rotation.y, -target, dt * 6);
      palaceDoorRightRef.current.rotation.y = THREE.MathUtils.lerp(palaceDoorRightRef.current.rotation.y, target, dt * 6);
    }
  });

  // Reusable Crenellated Stone Bastion Tower (Matches Foundation Reference images_2.jpg!)
  const BastionTower = ({ x, z, h = 22, r = 4.8, hasRoof = false, hasBanner = false }: { x: number; z: number; h?: number; r?: number; hasRoof?: boolean; hasBanner?: boolean }) => (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, h * 0.5, 0]} material={medievalStoneMat}>
        <cylinderGeometry args={[r, r * 1.08, h, 12]} />
      </mesh>
      {/* Projecting Stone Machicolation Ring & Crenellated Battlement Crown */}
      <mesh position={[0, h - 0.8, 0]} material={darkStoneTrimMat}>
        <cylinderGeometry args={[r * 1.14, r * 1.04, 1.8, 12]} />
      </mesh>
      {hasRoof ? (
        <mesh castShadow position={[0, h + 3.6, 0]} material={terracottaRoofMat}>
          <coneGeometry args={[r * 1.18, 7.2, 12]} />
        </mesh>
      ) : (
        <mesh position={[0, h + 0.6, 0]} material={darkStoneTrimMat}>
          <cylinderGeometry args={[r * 1.12, r * 1.12, 1.2, 10]} />
        </mesh>
      )}
      {/* Blue & White Heraldic Vertical Banner (Like Foundation Reference images_2.jpg!) */}
      {hasBanner && (
        <group position={[0, h * 0.58, r + 0.15]}>
          <mesh material={bannerBlueMat}><boxGeometry args={[1.4, 5.5, 0.08]} /></mesh>
          <mesh position={[0, 0, 0.05]} material={bannerWhiteMat}><boxGeometry args={[0.7, 3.8, 0.04]} /></mesh>
        </group>
      )}
    </group>
  );

  useEffect(() => {
    // kingdom-comprehensive-colliders
    clearGlobalTag("kingdom_solid");
    // Outer Curtain Walls (North Left/Right, South, West, East)
    addGlobalBox(-47, 320, 74, 6.5, "kingdom_solid");
    addGlobalBox(47, 320, 74, 6.5, "kingdom_solid");
    addGlobalBox(-8.8, 320, 5.8, 6.8, "kingdom_solid");
    addGlobalBox(8.8, 320, 5.8, 6.8, "kingdom_solid");
    addGlobalBox(0, 480, 168, 6.5, "kingdom_solid");
    addGlobalBox(-80, 400, 6.5, 168, "kingdom_solid");
    addGlobalBox(80, 400, 6.5, 168, "kingdom_solid");
    // Bastion Towers
    [[-80, 320], [80, 320], [-80, 480], [80, 480], [-10.2, 320], [10.2, 320]].forEach(([tx, tz]) => {
      addGlobalCyl(tx, tz, 5.2, "kingdom_solid");
    });
    // Inner Castle Keep Walls (Leaving front palace entrance open)
    addGlobalBox(-24, 415, 28, 4.0, "kingdom_solid");
    addGlobalBox(24, 415, 28, 4.0, "kingdom_solid");
    addGlobalBox(0, 465, 76, 4.0, "kingdom_solid");
    addGlobalBox(-36, 440, 4.0, 52, "kingdom_solid");
    addGlobalBox(36, 440, 4.0, 52, "kingdom_solid");
    return () => clearGlobalTag("kingdom_solid");
  }, []);

  return (
    <group ref={kingdomRootRef} name="storrskog-medieval-citadel">
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        {/* Winding Stone Cobblestone Courtyard Paths surrounded by Green Grass Bailey (Like Reference images_2.jpg!) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 8]} receiveShadow>
          <circleGeometry args={[52, 36]} />
          <meshStandardMaterial map={textures.cobblestone} color="#9ca3af" roughness={0.88} polygonOffset polygonOffsetFactor={-3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, -40]} receiveShadow>
          <planeGeometry args={[18, 82]} />
          <meshStandardMaterial map={textures.cobblestone} color="#9ca3af" roughness={0.88} polygonOffset polygonOffsetFactor={-3} />
        </mesh>

        {/* --- 1. OUTER CRENELLATED STONE CURTAIN WALLS & 14 BASTION TOWERS (Foundation Reference images_2.jpg) --- */}
        {[-47, 47].map((wx, i) => (
          <group key={"nw" + i} position={[wx, 0, -80]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={medievalStoneMat}><boxGeometry args={[74, 16, 5.8]} /></mesh>
            <mesh position={[0, 15.6, 0]} material={woodDoorMat}><boxGeometry args={[68, 0.6, 4.2]} /></mesh>
            {[-28, -20, -12, -4, 4, 12, 20, 28].map((cx, j) => (
              <mesh key={j} position={[cx, 17.0, -2.1]} material={darkStoneTrimMat}><boxGeometry args={[3.8, 2.2, 1.3]} /></mesh>
            ))}
          </group>
        ))}
        {/* Real 22-Step Medieval Stone Fortress Staircases with Stepped Parapets & Support Buttresses (Replaces flat ramp!) */}
        {[-1, 1].map((dir, sIdx) => (
          <group key={"stair_" + sIdx} position={[0, 0, -74]}>
            {Array.from({ length: 22 }).map((_, stepIdx) => {
              const t = (stepIdx + 0.5) / 22;
              const sx = dir * (18 + t * 18);
              const stepH = (stepIdx + 1) * (16.0 / 22);
              return (
                <group key={stepIdx} position={[sx, 0, 0]}>
                  {/* Solid Masonry Step Block from Ground up to Step Height */}
                  <mesh castShadow receiveShadow position={[0, stepH * 0.5, 0]} material={medievalStoneMat}>
                    <boxGeometry args={[0.92, stepH, 5.6]} />
                  </mesh>
                  {/* Dark Stone Step Tread Cap */}
                  <mesh receiveShadow position={[0, stepH + 0.06, 0]} material={darkStoneTrimMat}>
                    <boxGeometry args={[0.98, 0.14, 5.8]} />
                  </mesh>
                  {/* Stepped Stone Side Balustrade Parapet on Inner Courtyard Side */}
                  {stepIdx % 2 === 0 && (
                    <mesh castShadow position={[0, stepH + 0.65, 2.65]} material={darkStoneTrimMat}>
                      <boxGeometry args={[1.65, 1.3, 0.55]} />
                    </mesh>
                  )}
                </group>
              );
            })}
          </group>
        ))}
        {/* Interactive Double Fortress Gates & Stone Gatehouse Arch */}
        <mesh castShadow position={[0, 18.0, -80]} material={medievalStoneMat}><boxGeometry args={[22, 5.5, 6.2]} /></mesh>
        <mesh castShadow position={[0, 22.8, -80]} rotation={[0, Math.PI / 4, 0]} material={terracottaRoofMat}><coneGeometry args={[14, 5.5, 4]} /></mesh>
        <group ref={fortressGateLeftRef} position={[-6.5, 0, -80]}>
          <mesh position={[3.25, 6.5, 0]} material={woodDoorMat}><boxGeometry args={[6.5, 13.0, 0.6]} /></mesh>
        </group>
        <group ref={fortressGateRightRef} position={[6.5, 0, -80]}>
          <mesh position={[-3.25, 6.5, 0]} material={woodDoorMat}><boxGeometry args={[6.5, 13.0, 0.6]} /></mesh>
        </group>

        {[-50, 50].map((wx, i) => (
          <group key={"sw" + i} position={[wx, 0, 77]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={medievalStoneMat}><boxGeometry args={[68, 16, 5.5]} /></mesh>
            {[-28, -20, -12, -4, 4, 12, 20, 28].map((cx, j) => (
              <mesh key={j} position={[cx, 17.0, 2.1]} material={darkStoneTrimMat}><boxGeometry args={[3.8, 2.2, 1.3]} /></mesh>
            ))}
          </group>
        ))}
        {[-84, 84].map((wx, i) => (
          <group key={"ew" + i} position={[wx, 0, -1.5]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={medievalStoneMat}><boxGeometry args={[5.5, 16, 158]} /></mesh>
            {[-64, -48, -32, -16, 0, 16, 32, 48, 64].map((cz, j) => (
              <mesh key={j} position={[wx < 0 ? -2.1 : 2.1, 17.0, cz]} material={darkStoneTrimMat}><boxGeometry args={[1.3, 2.2, 5.2]} /></mesh>
            ))}
          </group>
        ))}

        {/* 14 Outer & Inner Stone Bastion Towers (Alternating Open Crenellated Tops & Red Conical Roofs like Reference images_2.jpg!) */}
        <BastionTower x={-10.2} z={-80} h={24} r={4.8} hasRoof={true} hasBanner={true} />
        <BastionTower x={10.2}  z={-80} h={24} r={4.8} hasRoof={true} hasBanner={true} />
        <BastionTower x={-50} z={-80} h={19} r={4.2} hasRoof={false} />
        <BastionTower x={50}  z={-80} h={19} r={4.2} hasRoof={false} />
        <BastionTower x={-84} z={-80} h={21} r={4.6} hasRoof={true} />
        <BastionTower x={84}  z={-80} h={21} r={4.6} hasRoof={true} />
        <BastionTower x={-84} z={-28} h={19} r={4.2} hasRoof={false} />
        <BastionTower x={84}  z={-28} h={19} r={4.2} hasRoof={false} />
        <BastionTower x={-84} z={26}  h={19} r={4.2} hasRoof={false} />
        <BastionTower x={84}  z={26}  h={19} r={4.2} hasRoof={false} />
        <BastionTower x={-84} z={77}  h={21} r={4.6} hasRoof={true} />
        <BastionTower x={84}  z={77}  h={21} r={4.6} hasRoof={true} />
        <BastionTower x={-16} z={-27} h={25} r={5.0} hasRoof={false} hasBanner={true} />
        <BastionTower x={16}  z={-27} h={25} r={5.0} hasRoof={false} hasBanner={true} />

        {/* Cypress / Poplar Tree Rows lining the Inner Bailey Walls (Just like Reference images_2.jpg!) */}
        {[-74, 74].map((tx, sIdx) =>
          [-55, -42, -29, -16, -3, 10, 23, 36, 49].map((tz, tIdx) => (
            <group key={sIdx + "_" + tIdx} position={[tx, 0, tz]}>
              <mesh position={[0, 1.5, 0]} material={woodDoorMat}><cylinderGeometry args={[0.25, 0.38, 3.0, 6]} /></mesh>
              <mesh castShadow position={[0, 6.2, 0]} material={cypressMat}><coneGeometry args={[1.8, 9.5, 7]} /></mesh>
            </group>
          ))
        )}

        {/* --- 2. INNER BAILEY MONASTIC & GUILD HALLS (Multi-Tiered Stone & Timber Buildings with Terracotta Roofs) --- */}
        {[
          { x: -48, z: -17, w: 18, d: 28, h: 13, rot: 0.08 },
          { x: 48,  z: -17, w: 18, d: 28, h: 13, rot: -0.08 },
          { x: -52, z: 27,  w: 16, d: 26, h: 15, rot: -0.05 },
          { x: 52,  z: 27,  w: 16, d: 26, h: 15, rot: 0.05 },
        ].map((b, idx) => (
          <group key={"bailey_" + idx} position={[b.x, 0, b.z]} rotation={[0, b.rot, 0]}>
            <mesh castShadow receiveShadow position={[0, b.h * 0.5, 0]} material={medievalStoneMat}>
              <boxGeometry args={[b.w, b.h, b.d]} />
            </mesh>
            <mesh position={[0, b.h + 1.8, 0]} material={timberWallMat}>
              <boxGeometry args={[b.w * 0.92, 3.6, b.d * 0.92]} />
            </mesh>
            <mesh castShadow position={[0, b.h + 6.5, 0]} rotation={[0, Math.PI / 4, 0]} material={terracottaRoofMat}>
              <coneGeometry args={[b.d * 0.72, 6.2, 4]} />
            </mesh>
            {/* Attached Side Buttress Wing */}
            <mesh castShadow position={[b.x < 0 ? 9 : -9, b.h * 0.4, 0]} material={medievalStoneMat}>
              <boxGeometry args={[6, b.h * 0.8, 12]} />
            </mesh>
            <mesh position={[b.x < 0 ? 9 : -9, b.h * 0.8 + 2.4, 0]} rotation={[0, Math.PI / 4, 0]} material={darkTileRoofMat}>
              <coneGeometry args={[6.8, 4.8, 4]} />
            </mesh>
            {[-6, 0, 6].map((wz, wIdx) => (
              <mesh key={wIdx} position={[b.x < 0 ? b.w * 0.5 + 0.1 : -b.w * 0.5 - 0.1, b.h * 0.6, wz]} rotation={[0, b.x < 0 ? Math.PI / 2 : -Math.PI / 2, 0]} material={warmWindowMat}>
                <planeGeometry args={[1.6, 3.2]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* --- 3. CENTRAL STORRSKOG CITADEL KEEP & ENTERABLE GREAT THRONE HALL (Z = +33 to +68) --- */}
        <group position={[0, 0, 50]}>
          {/* Checkered Marble Palace Floor & Royal Red Carpet */}
          <mesh position={[0, 0.2, 0]} receiveShadow material={marbleMat}><boxGeometry args={[64, 0.3, 34]} /></mesh>
          <mesh position={[0, 0.38, 0]} receiveShadow material={velvetMat}><boxGeometry args={[6.5, 0.08, 32]} /></mesh>

          {/* Massive Stone Keep Walls with Stepped Upper Citadel Tiers (Like Center of images_2.jpg!) */}
          <mesh castShadow receiveShadow position={[0, 14, 17]} material={medievalStoneMat}><boxGeometry args={[66, 28, 2.2]} /></mesh>
          <mesh castShadow receiveShadow position={[-32.5, 14, 0]} material={medievalStoneMat}><boxGeometry args={[2.2, 28, 35]} /></mesh>
          <mesh castShadow receiveShadow position={[32.5, 14, 0]} material={medievalStoneMat}><boxGeometry args={[2.2, 28, 35]} /></mesh>
          <mesh castShadow receiveShadow position={[-19, 14, -17]} material={medievalStoneMat}><boxGeometry args={[28, 28, 2.2]} /></mesh>
          <mesh castShadow receiveShadow position={[19, 14, -17]} material={medievalStoneMat}><boxGeometry args={[28, 28, 2.2]} /></mesh>
          <mesh castShadow position={[0, 20, -17]} material={medievalStoneMat}><boxGeometry args={[10, 16, 2.2]} /></mesh>

          {/* Terracotta Pitched Roofs & towering Central Donjon Keep Spire */}
          <mesh castShadow position={[-18, 32, 0]} rotation={[0, Math.PI / 4, 0]} material={terracottaRoofMat}><coneGeometry args={[22, 9.5, 4]} /></mesh>
          <mesh castShadow position={[18, 32, 0]} rotation={[0, Math.PI / 4, 0]} material={terracottaRoofMat}><coneGeometry args={[22, 9.5, 4]} /></mesh>
          {/* High Central Keep Tower rising above the Main Hall (Like Storrskog Keep in images_2.jpg!) */}
          <mesh castShadow position={[0, 34, 4]} material={medievalStoneMat}><boxGeometry args={[22, 16, 18]} /></mesh>
          <mesh castShadow position={[0, 46, 4]} rotation={[0, Math.PI / 4, 0]} material={darkTileRoofMat}><coneGeometry args={[17, 9.0, 4]} /></mesh>

          {/* 4 Flanking Citadel Keep Turrets with Blue/White Banners & Red Conical Roofs */}
          <BastionTower x={-32} z={-18} h={32} r={5.0} hasRoof={true} hasBanner={true} />
          <BastionTower x={32}  z={-18} h={32} r={5.0} hasRoof={true} hasBanner={true} />
          <BastionTower x={-12} z={-19} h={38} r={4.2} hasRoof={true} hasBanner={true} />
          <BastionTower x={12}  z={-19} h={38} r={4.2} hasRoof={true} hasBanner={true} />

          {/* Interactive Grand Palace Double Doors at Front (Z = -17 -> World Z = 428) */}
          <group ref={palaceDoorLeftRef} position={[-4.8, 0.3, -17]}>
            <mesh position={[2.4, 5.5, 0]} material={woodDoorMat}><boxGeometry args={[4.8, 11.0, 0.45]} /></mesh>
          </group>
          <group ref={palaceDoorRightRef} position={[4.8, 0.3, -17]}>
            <mesh position={[-2.4, 5.5, 0]} material={woodDoorMat}><boxGeometry args={[4.8, 11.0, 0.45]} /></mesh>
          </group>

          {/* Throne Room Interior */}
          <group position={[0, 0.3, 10]}>
            <mesh receiveShadow position={[0, 0.9, 0]} material={marbleMat}><boxGeometry args={[16, 1.8, 9]} /></mesh>
            <mesh position={[0, 1.82, 0]} material={velvetMat}><boxGeometry args={[8, 0.1, 8.8]} /></mesh>
            <mesh position={[0, 3.2, 2.2]} material={goldMat}><boxGeometry args={[3.2, 2.8, 2.4]} /></mesh>
            <mesh position={[0, 5.4, 3.1]} material={goldMat}><boxGeometry args={[3.4, 4.8, 0.45]} /></mesh>
            <mesh position={[0, 3.3, 2.3]} material={velvetMat}><boxGeometry args={[2.6, 0.4, 2.2]} /></mesh>
            <mesh position={[0, 5.2, 2.85]} material={velvetMat}><boxGeometry args={[2.6, 3.6, 0.2]} /></mesh>
          </group>

          {[-12, 12].map((cx, cSide) =>
            [-12, -5, 2, 9].map((cz, cIdx) => (
              <group key={cSide + "_" + cIdx} position={[cx, 0.3, cz]}>
                <mesh position={[0, 8.0, 0]} material={marbleMat}><cylinderGeometry args={[0.85, 1.05, 16.0, 10]} /></mesh>
                <mesh position={[0, 12.5, cx < 0 ? 1.0 : -1.0]} material={bannerBlueMat}><boxGeometry args={[0.15, 5.5, 1.8]} /></mesh>
              </group>
            ))
          )}

          {[-18, 18].map((bx, tIdx) => (
            <group key={"banquet_" + tIdx} position={[bx, 0.3, -4]}>
              <mesh position={[0, 1.1, 0]} material={woodDoorMat}><boxGeometry args={[3.4, 1.2, 16.0]} /></mesh>
              {[-6, -2, 2, 6].map((gz, gIdx) => (
                <group key={gIdx} position={[0, 1.85, gz]}>
                  <mesh material={goldMat}><cylinderGeometry args={[0.35, 0.25, 0.35, 8]} /></mesh>
                  <mesh position={[0, 0.45, 0]} material={warmWindowMat}><sphereGeometry args={[0.22, 6, 6]} /></mesh>
                </group>
              ))}
            </group>
          ))}

          {[-26, 26].map((sx, sIdx) => (
            <mesh key={"istair_" + sIdx} receiveShadow position={[sx, 4.4, -5]} rotation={[Math.PI * 0.16, 0, 0]} material={marbleMat}>
              <boxGeometry args={[5.5, 0.8, 17.5]} />
            </mesh>
          ))}
          {[-22, 22].map((mx, mIdx) => (
            <mesh key={"mezz_" + mIdx} receiveShadow position={[mx, 8.5, 9.5]} material={marbleMat}>
              <boxGeometry args={[18, 0.6, 13]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Southern Harbor Pier */}
      <group position={[0, 0, 555]}>
        <mesh receiveShadow position={[0, 1.6, 8]}><boxGeometry args={[12.4, 0.5, 56]} /><meshStandardMaterial map={textures.woodPlanks} color="#7c4d2b" /></mesh>
        <group position={[24, getExactMeshTerrainHeight(24, 548), -7]}>
          <mesh castShadow position={[0, 8.5, 0]} material={medievalStoneMat}><cylinderGeometry args={[2.3, 3.5, 17, 12]} /></mesh>
          <mesh position={[0, 17.8, 0]} material={warmWindowMat}><cylinderGeometry args={[2.1, 2.1, 2.4, 10]} /></mesh>
          <mesh position={[0, 20.2, 0]} material={terracottaRoofMat}><coneGeometry args={[2.8, 2.8, 12]} /></mesh>
        </group>
      </group>
    </group>
  );
}
