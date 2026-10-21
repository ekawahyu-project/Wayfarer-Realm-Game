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

  // Shared materials across the entire Kingdom so 36+ buildings + Fortress Walls render at 60 FPS!
  const stoneWallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#d8b4e2", roughness: 0.82 }), [textures.kingdomStone]);
  const stoneAltMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#c4b5fd", roughness: 0.84 }), [textures.kingdomStone]);
  const fortressMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.kingdomStone, color: "#94a3b8", roughness: 0.88 }), [textures.kingdomStone]);
  const redRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#e11d48", roughness: 0.75 }), [textures.redRoof]);
  const darkRoofMat = useMemo(() => new THREE.MeshStandardMaterial({ map: textures.redRoof, color: "#be123c", roughness: 0.76 }), [textures.redRoof]);
  const gothicWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#eab308", emissiveIntensity: 2.2 }), []);
  const roseWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fed7aa", emissive: "#f97316", emissiveIntensity: 2.4 }), []);
  const clockFaceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef9c3", emissive: "#facc15", emissiveIntensity: 3.0 }), []);

  useFrame(() => {
    const night = globalUniforms.uNightFactor.value;
    gothicWindowMat.emissiveIntensity = 0.75 + night * 3.4;
    roseWindowMat.emissiveIntensity = 0.85 + night * 3.2;
    clockFaceMat.emissiveIntensity = 1.0 + night * 3.8;
  });

  useEffect(() => {
    // Outer Fortress Walls (Leaving North Gate & South Harbor Gate open for road!)
    addBoxCollider(-52, 315, 68, 5);
    addBoxCollider(52,  315, 68, 5);
    addBoxCollider(-84, 395, 5, 160);
    addBoxCollider(84,  395, 5, 160);
    addBoxCollider(-52, 472, 68, 5);
    addBoxCollider(52,  472, 68, 5);

    // Inner Gatehouse, Clocktower, Observatory & Cathedral Keep
    addBoxCollider(-27, 371, 9, 9);
    addBoxCollider(-9,  371, 9, 9);
    addBoxCollider(20,  387, 11, 11);
    addCircleCollider(38, 379, 8.2);
    addBoxCollider(0, 442, 68, 22);

    // Inner & Outer Gothic Building Rows
    addBoxCollider(-42, 405, 13, 108);
    addBoxCollider(42,  405, 13, 108);
    addBoxCollider(-66, 405, 13, 96);
    addBoxCollider(66,  405, 13, 96);

    // Statues, Crates, Harbor Lighthouse & Galleon
    addBoxCollider(-11, 397, 4.2, 4.2);
    addBoxCollider(11,  397, 4.2, 4.2);
    addBoxCollider(-21, 400, 3.6, 3.6);
    addCircleCollider(24, 548, 4.2);
    addBoxCollider(-14, 578, 8.0, 20.0);
    addBoxCollider(-310, -315, 26.0, 16.0);
  }, []);

  return (
    <group name="walled-fortress-kingdom">
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        {/* Massive Cobblestone Royal Citadel Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
          <circleGeometry args={[128, 48]} />
          <meshStandardMaterial map={textures.cobblestone} color="#a89bb5" roughness={0.85} />
        </mesh>

        {/* --- 1. OUTER FORTRESS CURTAIN WALLS & BATTLEMENT TOWERS (Tembok & Benteng Kerajaan) --- */}
        {/* North Fortress Walls (Flanking the Main Entrance Road at Z = -80) */}
        {[-50, 50].map((wx, i) => (
          <group key={"nw" + i} position={[wx, 0, -80]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={fortressMat}><boxGeometry args={[68, 16, 4.5]} /></mesh>
            {/* Battlement Crenellations on Top of Wall */}
            {[-28, -20, -12, -4, 4, 12, 20, 28].map((cx, j) => (
              <mesh key={j} castShadow position={[cx, 17.2, 0]} material={fortressMat}><boxGeometry args={[4.2, 2.4, 5.0]} /></mesh>
            ))}
          </group>
        ))}
        {/* South Fortress Walls (Flanking the Harbor Road at Z = +77) */}
        {[-50, 50].map((wx, i) => (
          <group key={"sw" + i} position={[wx, 0, 77]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={fortressMat}><boxGeometry args={[68, 16, 4.5]} /></mesh>
            {[-28, -20, -12, -4, 4, 12, 20, 28].map((cx, j) => (
              <mesh key={j} castShadow position={[cx, 17.2, 0]} material={fortressMat}><boxGeometry args={[4.2, 2.4, 5.0]} /></mesh>
            ))}
          </group>
        ))}
        {/* West & East Fortress Side Walls (X = -84 and X = +84) */}
        {[-84, 84].map((wx, i) => (
          <group key={"ew" + i} position={[wx, 0, -1.5]}>
            <mesh castShadow receiveShadow position={[0, 8, 0]} material={fortressMat}><boxGeometry args={[4.5, 16, 158]} /></mesh>
            {[-64, -48, -32, -16, 0, 16, 32, 48, 64].map((cz, j) => (
              <mesh key={j} castShadow position={[0, 17.2, cz]} material={fortressMat}><boxGeometry args={[5.0, 2.4, 5.5]} /></mesh>
            ))}
          </group>
        ))}
        {/* 8 Massive Fortress Bastion Corner & Gate Watchtowers */}
        {[
          [-16, -80], [16, -80], [-84, -80], [84, -80],
          [-84, 0],   [84, 0],   [-84, 77],  [84, 77],
        ].map(([tx, tz], idx) => (
          <group key={"ft" + idx} position={[tx, 0, tz]}>
            <mesh castShadow receiveShadow position={[0, 12, 0]} material={fortressMat}>
              <cylinderGeometry args={[5.2, 5.8, 24, 14]} />
            </mesh>
            <mesh castShadow position={[0, 27.5, 0]} material={redRoofMat}>
              <coneGeometry args={[6.2, 8.0, 14]} />
            </mesh>
            <mesh position={[0, 16, tz < 0 ? -5.3 : 5.3]} rotation={[0, tz < 0 ? Math.PI : 0, 0]} material={gothicWindowMat}>
              <planeGeometry args={[1.6, 4.5]} />
            </mesh>
          </group>
        ))}
        {/* Overhead Fortress Entrance Archway at North Gate (Z = -80) */}
        <mesh castShadow receiveShadow position={[0, 18.5, -80]} material={fortressMat}>
          <boxGeometry args={[24, 5.5, 5.5]} />
        </mesh>

        {/* --- 2. FOUR DENSE AVENUES OF CONNECTED GOTHIC BUILDINGS (36 Buildings Total!) --- */}
        {[-66, -42, 42, 66].map((wx, wingIdx) => (
          <group key={"wing" + wingIdx} position={[wx, 0, 4]} rotation={[0, wx < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            {[-48, -36, -24, -12, 0, 12, 24, 36, 48].map((offsetX, hIdx) => (
              <group key={hIdx} position={[offsetX, 0, 0]}>
                <mesh castShadow receiveShadow position={[0, 10.5, 0]} material={hIdx % 2 === 0 ? stoneWallMat : stoneAltMat}>
                  <boxGeometry args={[12.4, 21 + (hIdx % 3) * 3, 11.5]} />
                </mesh>
                <mesh castShadow position={[0, 25.0 + (hIdx % 3) * 1.5, 0]} rotation={[0, Math.PI / 4, 0]} material={hIdx % 2 === 0 ? redRoofMat : darkRoofMat}>
                  <coneGeometry args={[8.8, 8.5, 4]} />
                </mesh>
                <mesh position={[0, 21.5, 5.82]} material={roseWindowMat}><circleGeometry args={[1.4, 12]} /></mesh>
                <mesh position={[-2.6, 11.5, 5.82]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.5]} /></mesh>
                <mesh position={[2.6, 11.5, 5.82]} material={gothicWindowMat}><planeGeometry args={[1.9, 6.5]} /></mesh>
                {hIdx % 2 === 1 && (
                  <group position={[5.2, 4.0, 5.2]}>
                    <mesh castShadow position={[0, 9.0, 0]} material={stoneWallMat}><cylinderGeometry args={[2.8, 3.0, 18, 12]} /></mesh>
                    <mesh castShadow position={[0, 21.0, 0]} material={redRoofMat}><coneGeometry args={[3.3, 6.5, 12]} /></mesh>
                  </group>
                )}
              </group>
            ))}
          </group>
        ))}

        {/* --- 3. INNER ROYAL GATEHOUSE, CLOCKTOWER, OBSERVATORY & GRAND CATHEDRAL KEEP --- */}
        <group position={[-18, 0, -24]}>
          {[-9, 9].map((tx, idx) => (
            <group key={idx} position={[tx, 0, 0]}>
              <mesh castShadow receiveShadow position={[0, 15, 0]} material={stoneWallMat}><boxGeometry args={[8.2, 30, 8.2]} /></mesh>
              <mesh castShadow position={[0, 34, 0]} rotation={[0, Math.PI / 4, 0]} material={redRoofMat}><coneGeometry args={[6.8, 9.0, 4]} /></mesh>
              <mesh position={[0, 23, -4.15]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[1.7, 12]} /></mesh>
            </group>
          ))}
          <mesh castShadow position={[0, 22.5, 0]} material={stoneAltMat}><boxGeometry args={[12, 4.8, 6.0]} /></mesh>
          {[-3.6, -1.2, 1.2, 3.6].map((bx, idx) => (
            <mesh key={idx} castShadow position={[bx, 15.5, 0]}><boxGeometry args={[1.4, 8.2, 0.15]} /><meshStandardMaterial color="#b91c1c" /></mesh>
          ))}
        </group>

        <group position={[20, 0, -8]}>
          <mesh castShadow receiveShadow position={[0, 14, 0]} material={stoneWallMat}><boxGeometry args={[10.5, 28, 10.5]} /></mesh>
          <mesh castShadow position={[0, 32.5, 0]} rotation={[0, Math.PI / 4, 0]} material={darkRoofMat}><coneGeometry args={[8.6, 10.0, 4]} /></mesh>
          <mesh position={[0, 19.5, -5.3]} rotation={[0, Math.PI, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 20]} /></mesh>
          <mesh position={[-5.3, 19.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 20]} /></mesh>
          <mesh position={[5.3, 19.5, 0]} rotation={[0, Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.5, 20]} /></mesh>
        </group>

        <group position={[38, 0, -16]}>
          <mesh castShadow receiveShadow position={[0, 8, 0]} material={stoneWallMat}><cylinderGeometry args={[7.5, 8.0, 16, 16]} /></mesh>
          <mesh castShadow position={[0, 16.0, 0]}>
            <sphereGeometry args={[7.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#9a4a1a" metalness={0.55} roughness={0.4} />
          </mesh>
        </group>

        <group position={[0, 0, 47]}>
          <mesh castShadow receiveShadow position={[0, 18, 0]} material={stoneWallMat}><boxGeometry args={[66, 36, 22]} /></mesh>
          <mesh castShadow position={[0, 41, 0]} rotation={[0, Math.PI / 4, 0]} material={redRoofMat}><coneGeometry args={[42, 13, 4]} /></mesh>
          <mesh position={[0, 27, -11.1]} rotation={[0, Math.PI, 0]} material={roseWindowMat}><circleGeometry args={[4.0, 16]} /></mesh>
          {[-22, -15, -8, 8, 15, 22].map((wx, i) => (
            <mesh key={i} position={[wx, 14.5, -11.1]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[2.8, 14.5]} /></mesh>
          ))}
          {[-28, 28].map((tx, i) => (
            <group key={i} position={[tx, 0, -6]}>
              <mesh castShadow receiveShadow position={[0, 20, 0]} material={stoneAltMat}><cylinderGeometry args={[5.5, 6.2, 40, 16]} /></mesh>
              <mesh castShadow position={[0, 45, 0]} material={redRoofMat}><coneGeometry args={[6.6, 11.0, 16]} /></mesh>
            </group>
          ))}
        </group>

        {[
          { x: -11, z: 2, color: "#57534e", staffCrystal: "#ef4444" },
          { x: 11,  z: 2, color: "#f8fafc", staffCrystal: "#38bdf8" },
        ].map((st, idx) => (
          <group key={idx} position={[st.x, 0, st.z]}>
            <mesh castShadow receiveShadow position={[0, 2.8, 0]} material={fortressMat}><boxGeometry args={[3.6, 5.6, 3.6]} /></mesh>
            <mesh castShadow position={[0, 7.4, 0]}><cylinderGeometry args={[0.65, 1.1, 4.0, 10]} /><meshStandardMaterial color={st.color} /></mesh>
            <mesh castShadow position={[0, 9.8, 0]}><sphereGeometry args={[0.52, 10, 10]} /><meshStandardMaterial color={st.color} /></mesh>
            <mesh position={[0.95, 10.4, 0.4]}>
              <octahedronGeometry args={[0.45, 0]} />
              <meshStandardMaterial color={st.staffCrystal} emissive={st.staffCrystal} emissiveIntensity={3.0} />
            </mesh>
          </group>
        ))}

        <group position={[-21, 0, 5]}>
          <mesh castShadow receiveShadow position={[0, 1.3, 0]}><boxGeometry args={[2.8, 2.6, 2.8]} /><meshStandardMaterial color="#7f1d1d" /></mesh>
          <mesh castShadow receiveShadow position={[0.1, 3.8, 0]}><boxGeometry args={[2.6, 2.5, 2.6]} /><meshStandardMaterial color="#991b1b" /></mesh>
        </group>
      </group>

      {/* Southern Harbor Pier (Top at exact Y = 2.4m) */}
      <group position={[0, 0, 555]}>
        <mesh castShadow receiveShadow position={[0, 2.15, 8]}><boxGeometry args={[12.4, 0.5, 56]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        {[-12, -2, 8, 18, 28].map((pz, i) => (
          <group key={i} position={[0, 0.2, pz]}>
            <mesh castShadow position={[-5.4, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 4.2, 8]} /><meshStandardMaterial color="#3e2723" /></mesh>
            <mesh castShadow position={[5.4, 0, 0]}><cylinderGeometry args={[0.28, 0.28, 4.2, 8]} /><meshStandardMaterial color="#3e2723" /></mesh>
          </group>
        ))}
        <group position={[24, getExactMeshTerrainHeight(24, 548), -7]}>
          <mesh castShadow receiveShadow position={[0, 8.5, 0]}><cylinderGeometry args={[2.3, 3.5, 17, 14]} /><meshStandardMaterial color="#f8fafc" /></mesh>
          <mesh position={[0, 17.8, 0]} material={clockFaceMat}><cylinderGeometry args={[2.1, 2.1, 2.4, 12]} /></mesh>
          <mesh castShadow position={[0, 20.2, 0]}><coneGeometry args={[2.8, 2.8, 14]} /><meshStandardMaterial color="#dc2626" /></mesh>
        </group>
        <group position={[-14, 0.2, 23]} rotation={[0, 0.15, 0]}>
          <mesh castShadow receiveShadow position={[0, 1.8, 0]}><boxGeometry args={[6.8, 3.8, 19]} /><meshStandardMaterial color="#451a03" /></mesh>
          <mesh castShadow position={[0, 8.5, -2]}><cylinderGeometry args={[0.24, 0.30, 14, 8]} /><meshStandardMaterial color="#78350f" /></mesh>
          <mesh castShadow position={[0, 9.5, -1.6]}><boxGeometry args={[8.8, 6.8, 0.25]} /><meshStandardMaterial color="#fef3c7" /></mesh>
        </group>
      </group>
    </group>
  );
}
