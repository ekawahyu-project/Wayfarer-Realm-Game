"use client";

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

const KINGDOM_X = 0;
const KINGDOM_Z = 395;

export default function Kingdom() {
  const baseY = useMemo(() => getExactMeshTerrainHeight(KINGDOM_X, KINGDOM_Z), []);
  const textures = useMemo(() => getWorldTextures(), []);

  const fortressGateLeftRef = useRef<THREE.Group>(null);
  const fortressGateRightRef = useRef<THREE.Group>(null);
  const palaceDoorLeftRef = useRef<THREE.Group>(null);
  const palaceDoorRightRef = useRef<THREE.Group>(null);

  const stoneWallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#d8b4e2", roughness: 0.82 }), [textures.kingdomStone]);
  const stoneAltMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#c4b5fd", roughness: 0.84 }), [textures.kingdomStone]);
  const fortressMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#94a3b8", roughness: 0.88 }), [textures.kingdomStone]);
  const redRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#e11d48", roughness: 0.75 }), [textures.redRoof]);
  const darkRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#be123c", roughness: 0.76 }), [textures.redRoof]);
  const woodDoorMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.woodPlanks, color: "#5c3818", roughness: 0.8 }), [textures.woodPlanks]);
  const marbleMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.royalMarble, roughness: 0.25, metalness: 0.1 }), [textures.royalMarble]);
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fbbf24", metalness: 0.85, roughness: 0.2 }), []);
  const velvetMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#991b1b", roughness: 0.7 }), []);
  const gothicWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#eab308", emissiveIntensity: 2.2 }), []);
  const roseWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fed7aa", emissive: "#f97316", emissiveIntensity: 2.4 }), []);
  const clockFaceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef9c3", emissive: "#facc15", emissiveIntensity: 3.0 }), []);

  useEffect(() => {
    clearGroupColliders("kingdom");

    // Outer Fortress Walls with maxY = 36.5m so player can walk freely on top of the battlements (Y = 38.0m)!
    addBoxCollider(-50, 315, 68, 5.5, "kingdom", 36.5);
    addBoxCollider(50,  315, 68, 5.5, "kingdom", 36.5);
    addBoxCollider(-84, 395, 5.5, 160, "kingdom", 36.5);
    addBoxCollider(84,  395, 5.5, 160, "kingdom", 36.5);
    addBoxCollider(-50, 472, 68, 5.5, "kingdom", 36.5);
    addBoxCollider(50,  472, 68, 5.5, "kingdom", 36.5);

    // Symmetrical Inner Twin Gatehouse Towers (Centered at X = -14 and X = +14 so X = 0 Main Avenue is 100% clear!)
    addBoxCollider(-14, 371, 8.2, 8.2, "kingdom");
    addBoxCollider(14,  371, 8.2, 8.2, "kingdom");

    // Clocktower & Observatory (Placed on East Plaza Side)
    addBoxCollider(25, 387, 10.5, 10.5, "kingdom");
    addCircleCollider(-26, 387, 7.5, "kingdom");

    // Enterable Royal Palace Cathedral Keep (Z = 428 to 463)
    addBoxCollider(0,   463, 66, 2.5, "kingdom");
    addBoxCollider(-33, 445, 2.5, 36, "kingdom");
    addBoxCollider(33,  445, 2.5, 36, "kingdom");
    addBoxCollider(-19, 428, 28, 2.5, "kingdom");
    addBoxCollider(19,  428, 28, 2.5, "kingdom");

    // Interactive Fortress Gate & Palace Grand Doors
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
      label: "Gerbang Benteng Kerajaan",
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
      label: "Pintu Agung Istana Kerajaan",
    });

    // 4 Gothic Townhouse Avenues
    addBoxCollider(-42, 399, 12.5, 108, "kingdom");
    addBoxCollider(42,  399, 12.5, 108, "kingdom");
    addBoxCollider(-66, 399, 12.5, 96, "kingdom");
    addBoxCollider(66,  399, 12.5, 96, "kingdom");

    // Statues, Harbor Lighthouse, Ship & NW Shrine
    addBoxCollider(-11, 397, 3.8, 3.8, "kingdom");
    addBoxCollider(11,  397, 3.8, 3.8, "kingdom");
    addCircleCollider(24, 548, 4.2, "kingdom");
    addBoxCollider(-14, 578, 8.0, 20.0, "kingdom");
    addBoxCollider(-310, -315, 26.0, 16.0, "kingdom");
  }, [baseY]);

  useFrame((_state, delta) => {
    const dt = Math.min(delta, 0.05);
    const night = globalUniforms.uNightFactor.value;
    gothicWindowMat.emissiveIntensity = 0.75 + night * 3.4;
    roseWindowMat.emissiveIntensity = 0.85 + night * 3.2;
    clockFaceMat.emissiveIntensity = 1.0 + night * 3.8;

    const fGate = INTERACTIVE_DOORS.find((d) => d.id === "kingdom_fortress_gate");
    if (fGate && fortressGateLeftRef.current && fortressGateRightRef.current) {
      const target = fGate.isOpen ? Math.PI * 0.48 : 0;
      fortressGateLeftRef.current.rotation.y = THREE.MathUtils.lerp(fortressGateLeftRef.current.rotation.y, target, dt * 6);
      fortressGateRightRef.current.rotation.y = THREE.MathUtils.lerp(fortressGateRightRef.current.rotation.y, -target, dt * 6);
    }

    const pDoor = INTERACTIVE_DOORS.find((d) => d.id === "kingdom_palace_door");
    if (pDoor && palaceDoorLeftRef.current && palaceDoorRightRef.current) {
      const target = pDoor.isOpen ? Math.PI * 0.52 : 0;
      palaceDoorLeftRef.current.rotation.y = THREE.MathUtils.lerp(palaceDoorLeftRef.current.rotation.y, target, dt * 6);
      palaceDoorRightRef.current.rotation.y = THREE.MathUtils.lerp(palaceDoorRightRef.current.rotation.y, -target, dt * 6);
    }
  });

  return (
    <group name="walled-fortress-kingdom-with-interior">
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
          <circleGeometry args={[128, 48]} />
          <meshStandardMaterial map={textures.cobblestone} color="#a89bb5" roughness={0.85} />
        </mesh>

        {/* --- 1. OUTER FORTRESS WALLS, WALKABLE RAMPARTS, STAIRS & GATES --- */}
        {[-50, 50].map((wx, i) => (
          <group key={"nw" + i} position={[wx, 0, -80]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={fortressMat}><boxGeometry args={[68, 16, 6.0]} /></mesh>
            {[-28, -20, -12, -4, 4, 12, 20, 28].map((cx, j) => (
              <mesh key={j} position={[cx, 17.2, -2.2]} material={fortressMat}><boxGeometry args={[4.2, 2.4, 1.5]} /></mesh>
            ))}
          </group>
        ))}
        {/* Wide Walkable Stone Rampart Staircases (Z = -74 -> World Z = 321, |X| = 18..36) */}
        {[-1, 1].map((dir, sIdx) => (
          <mesh key={"stair" + sIdx} receiveShadow position={[dir * 27, 8.0, -74]} rotation={[0, 0, dir * Math.atan2(16, 18)]} material={fortressMat}>
            <boxGeometry args={[24.0, 1.5, 6.0]} />
          </mesh>
        ))}
        {/* Interactive Double Fortress Gates at North Entrance (Z = -80) */}
        <group ref={fortressGateLeftRef} position={[-6.5, 0, -80]}>
          <mesh position={[3.25, 6.5, 0]} material={woodDoorMat}><boxGeometry args={[6.5, 13.0, 0.6]} /></mesh>
        </group>
        <group ref={fortressGateRightRef} position={[6.5, 0, -80]}>
          <mesh position={[-3.25, 6.5, 0]} material={woodDoorMat}><boxGeometry args={[6.5, 13.0, 0.6]} /></mesh>
        </group>

        {[-50, 50].map((wx, i) => (
          <group key={"sw" + i} position={[wx, 0, 77]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={fortressMat}><boxGeometry args={[68, 16, 6.0]} /></mesh>
            {[-28, -20, -12, -4, 4, 12, 20, 28].map((cx, j) => (
              <mesh key={j} position={[cx, 17.2, 2.2]} material={fortressMat}><boxGeometry args={[4.2, 2.4, 1.5]} /></mesh>
            ))}
          </group>
        ))}
        {[-84, 84].map((wx, i) => (
          <group key={"ew" + i} position={[wx, 0, -1.5]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={fortressMat}><boxGeometry args={[6.0, 16, 158]} /></mesh>
            {[-64, -48, -32, -16, 0, 16, 32, 48, 64].map((cz, j) => (
              <mesh key={j} position={[wx < 0 ? -2.2 : 2.2, 17.2, cz]} material={fortressMat}><boxGeometry args={[1.5, 2.4, 5.5]} /></mesh>
            ))}
          </group>
        ))}
        {[
          [-16, -80], [16, -80], [-84, -80], [84, -80],
          [-84, 0],   [84, 0],   [-84, 77],  [84, 77],
        ].map(([tx, tz], idx) => (
          <group key={"ft" + idx} position={[tx, 0, tz]}>
            <mesh castShadow receiveShadow position={[0, 12, 0]} material={fortressMat}><cylinderGeometry args={[5.2, 5.8, 24, 12]} /></mesh>
            <mesh position={[0, 27.5, 0]} material={redRoofMat}><coneGeometry args={[6.2, 8.0, 12]} /></mesh>
          </group>
        ))}
        <mesh position={[0, 18.5, -80]} material={fortressMat}><boxGeometry args={[24, 5.5, 6.0]} /></mesh>

        {/* --- 2. FOUR DENSE AVENUES OF CONNECTED GOTHIC BUILDINGS (36 Buildings) --- */}
        {[-66, -42, 42, 66].map((wx, wingIdx) => (
          <group key={"wing" + wingIdx} position={[wx, 0, 4]} rotation={[0, wx < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            {[-48, -36, -24, -12, 0, 12, 24, 36, 48].map((offsetX, hIdx) => (
              <group key={hIdx} position={[offsetX, 0, 0]}>
                <mesh castShadow receiveShadow position={[0, 10.5, 0]} material={hIdx % 2 === 0 ? stoneWallMat : stoneAltMat}>
                  <boxGeometry args={[12.4, 21 + (hIdx % 3) * 3, 11.5]} />
                </mesh>
                <mesh position={[0, 25.0 + (hIdx % 3) * 1.5, 0]} rotation={[0, Math.PI / 4, 0]} material={hIdx % 2 === 0 ? redRoofMat : darkRoofMat}>
                  <coneGeometry args={[8.8, 8.5, 4]} />
                </mesh>
                <mesh position={[0, 21.5, 5.82]} material={roseWindowMat}><circleGeometry args={[1.4, 10]} /></mesh>
                <mesh position={[-2.6, 11.5, 5.82]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.5]} /></mesh>
                <mesh position={[2.6, 11.5, 5.82]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.5]} /></mesh>
                {hIdx % 2 === 1 && (
                  <group position={[5.2, 4.0, 5.2]}>
                    <mesh position={[0, 9.0, 0]} material={stoneWallMat}><cylinderGeometry args={[2.8, 3.0, 18, 10]} /></mesh>
                    <mesh position={[0, 21.0, 0]} material={redRoofMat}><coneGeometry args={[3.3, 6.5, 10]} /></mesh>
                  </group>
                )}
              </group>
            ))}
          </group>
        ))}

        {/* --- 3. SYMMETRICAL INNER ROYAL GATEHOUSE (Centered at X = 0 so road is wide open!), CLOCKTOWER & OBSERVATORY --- */}
        <group position={[0, 0, -24]}>
          {[-14, 14].map((tx, idx) => (
            <group key={idx} position={[tx, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 15, 0]} material={stoneWallMat}><boxGeometry args={[8.2, 30, 8.2]} /></mesh>
              <mesh position={[0, 34, 0]} rotation={[0, Math.PI / 4, 0]} material={redRoofMat}><coneGeometry args={[6.8, 9.0, 4]} /></mesh>
            </group>
          ))}
          <mesh position={[0, 22.5, 0]} material={stoneAltMat}><boxGeometry args={[20, 4.8, 6.0]} /></mesh>
          {[-6, -2, 2, 6].map((bx, idx) => (
            <mesh key={idx} position={[bx, 15.5, 0]}><boxGeometry args={[1.4, 8.2, 0.15]} /><meshStandardMaterial color="#b91c1c" /></mesh>
          ))}
        </group>

        {/* Clocktower on East Side (+25) & Observatory on West Side (-26) */}
        <group position={[25, 0, -8]}>
          <mesh castShadow receiveShadow position={[0, 14, 0]} material={stoneWallMat}><boxGeometry args={[10.5, 28, 10.5]} /></mesh>
          <mesh position={[0, 32.5, 0]} rotation={[0, Math.PI / 4, 0]} material={darkRoofMat}><coneGeometry args={[8.6, 10.0, 4]} /></mesh>
          <mesh position={[0, 19.5, -5.3]} rotation={[0, Math.PI, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 16]} /></mesh>
          <mesh position={[-5.3, 19.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 16]} /></mesh>
        </group>

        <group position={[-26, 0, -8]}>
          <mesh castShadow receiveShadow position={[0, 8, 0]} material={stoneWallMat}><cylinderGeometry args={[7.2, 7.6, 16, 14]} /></mesh>
          <mesh position={[0, 16.0, 0]}><sphereGeometry args={[7.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#9a4a1a" metalness={0.55} roughness={0.4} /></mesh>
        </group>

        {/* --- 4. ENTERABLE ROYAL PALACE & GREAT THRONE ROOM INTERIOR (Z = +33 to +68) --- */}
        <group position={[0, 0, 50]}>
          <mesh position={[0, 0.2, 0]} receiveShadow material={marbleMat}><boxGeometry args={[64, 0.3, 34]} /></mesh>
          <mesh position={[0, 0.38, 0]} receiveShadow material={velvetMat}><boxGeometry args={[6.5, 0.08, 32]} /></mesh>

          <mesh castShadow receiveShadow position={[0, 16, 17]} material={stoneWallMat}><boxGeometry args={[66, 32, 1.8]} /></mesh>
          <mesh castShadow receiveShadow position={[-32.5, 16, 0]} material={stoneWallMat}><boxGeometry args={[1.8, 32, 35]} /></mesh>
          <mesh castShadow receiveShadow position={[32.5, 16, 0]} material={stoneWallMat}><boxGeometry args={[1.8, 32, 35]} /></mesh>
          <mesh castShadow receiveShadow position={[-19, 16, -17]} material={stoneWallMat}><boxGeometry args={[28, 32, 1.8]} /></mesh>
          <mesh castShadow receiveShadow position={[19, 16, -17]} material={stoneWallMat}><boxGeometry args={[28, 32, 1.8]} /></mesh>
          <mesh position={[0, 22, -17]} material={stoneWallMat}><boxGeometry args={[10, 20, 1.8]} /></mesh>

          <group ref={palaceDoorLeftRef} position={[-4.8, 0.3, -17]}>
            <mesh position={[2.4, 5.5, 0]} material={woodDoorMat}><boxGeometry args={[4.8, 11.0, 0.45]} /></mesh>
          </group>
          <group ref={palaceDoorRightRef} position={[4.8, 0.3, -17]}>
            <mesh position={[-2.4, 5.5, 0]} material={woodDoorMat}><boxGeometry args={[4.8, 11.0, 0.45]} /></mesh>
          </group>

          <mesh position={[0, 38, 0]} rotation={[0, Math.PI / 4, 0]} material={redRoofMat}><coneGeometry args={[44, 13, 4]} /></mesh>
          {[-28, 28].map((tx, i) => (
            <group key={i} position={[tx, 0, -21]}>
              <mesh castShadow receiveShadow position={[0, 20, 0]} material={stoneAltMat}><cylinderGeometry args={[5.2, 5.8, 40, 12]} /></mesh>
              <mesh position={[0, 45, 0]} material={redRoofMat}><coneGeometry args={[6.2, 11.0, 12]} /></mesh>
            </group>
          ))}

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
                <mesh position={[0, 12.5, cx < 0 ? 1.0 : -1.0]} material={velvetMat}><boxGeometry args={[0.15, 5.5, 1.8]} /></mesh>
              </group>
            ))
          )}

          {[-18, 18].map((bx, tIdx) => (
            <group key={"banquet_" + tIdx} position={[bx, 0.3, -4]}>
              <mesh position={[0, 1.1, 0]} material={woodDoorMat}><boxGeometry args={[3.4, 1.2, 16.0]} /></mesh>
              {[-6, -2, 2, 6].map((gz, gIdx) => (
                <group key={gIdx} position={[0, 1.85, gz]}>
                  <mesh material={goldMat}><cylinderGeometry args={[0.35, 0.25, 0.35, 8]} /></mesh>
                  <mesh position={[0, 0.45, 0]} material={clockFaceMat}><sphereGeometry args={[0.22, 6, 6]} /></mesh>
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

          {[-6, 4].map((cz, chIdx) => (
            <group key={"chand_" + chIdx} position={[0, 18.5, cz]}>
              <mesh material={goldMat} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[3.2, 0.22, 6, 16]} /></mesh>
              <mesh position={[0, 0, 0]} material={clockFaceMat}><sphereGeometry args={[0.85, 8, 8]} /></mesh>
            </group>
          ))}
        </group>
      </group>

      {/* Southern Harbor Pier */}
      <group position={[0, 0, 555]}>
        <mesh receiveShadow position={[0, 2.15, 8]}><boxGeometry args={[12.4, 0.5, 56]} /><meshStandardMaterial map={textures.woodPlanks} color="#7c4d2b" /></mesh>
        <group position={[24, getExactMeshTerrainHeight(24, 548), -7]}>
          <mesh castShadow position={[0, 8.5, 0]}><cylinderGeometry args={[2.3, 3.5, 17, 12]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0, 17.8, 0]} material={clockFaceMat}><cylinderGeometry args={[2.1, 2.1, 2.4, 10]} /></mesh>
          <mesh position={[0, 20.2, 0]}><coneGeometry args={[2.8, 2.8, 12]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
      </group>
    </group>
  );
}
