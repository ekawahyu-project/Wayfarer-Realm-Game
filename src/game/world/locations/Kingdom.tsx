"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
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

  const gothicWindowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#eab308", emissiveIntensity: 1.8 }), []);
  const clockFaceMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef9c3", emissive: "#facc15", emissiveIntensity: 2.5 }), []);
  const torchFlameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffedd5", emissive: "#f97316", emissiveIntensity: 3.0 }), []);

  useFrame((state) => {
    const night = globalUniforms.uNightFactor.value;
    const pulse = 0.92 + 0.08 * Math.sin(state.clock.elapsedTime * 7.0);
    gothicWindowMat.emissiveIntensity = 0.45 + night * 3.2;
    clockFaceMat.emissiveIntensity = 0.8 + night * 3.8;
    torchFlameMat.emissiveIntensity = (0.8 + night * 4.0) * pulse;
  });

  return (
    <group name="kingdom-and-harbor-biome">
      <group position={[KINGDOM_X, baseY, KINGDOM_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]} receiveShadow>
          <circleGeometry args={[68, 48]} />
          <meshStandardMaterial color="#6b6375" roughness={0.85} />
        </mesh>
        <RigidBody type="fixed" colliders="cuboid" position={[-18, 0, -24]}>
          <group>
            <mesh castShadow receiveShadow position={[-9, 13, 0]}><boxGeometry args={[7.5, 26, 7.5]} /><meshStandardMaterial color="#8b7d99" /></mesh>
            <mesh castShadow receiveShadow position={[-9, 29, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[6.2, 7.5, 4]} /><meshStandardMaterial color="#9f1239" /></mesh>
            <mesh castShadow receiveShadow position={[9, 13, 0]}><boxGeometry args={[7.5, 26, 7.5]} /><meshStandardMaterial color="#8b7d99" /></mesh>
            <mesh castShadow receiveShadow position={[9, 29, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[6.2, 7.5, 4]} /><meshStandardMaterial color="#9f1239" /></mesh>
            <mesh castShadow receiveShadow position={[0, 20.5, 0]}><boxGeometry args={[12, 4.2, 5.5]} /><meshStandardMaterial color="#7c6f8a" /></mesh>
            {[-3.6, -1.2, 1.2, 3.6].map((bx, idx) => (
              <mesh key={idx} castShadow position={[bx, 14.5, 0]}><boxGeometry args={[1.3, 7.2, 0.12]} /><meshStandardMaterial color="#b91c1c" /></mesh>
            ))}
          </group>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[16, 0, -8]}>
          <group>
            <mesh castShadow receiveShadow position={[0, 12, 0]}><boxGeometry args={[9.5, 24, 9.5]} /><meshStandardMaterial color="#9584a1" /></mesh>
            <mesh castShadow receiveShadow position={[0, 27.5, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[7.8, 8.5, 4]} /><meshStandardMaterial color="#881337" /></mesh>
            <mesh position={[0, 17.5, -4.82]} rotation={[0, Math.PI, 0]} material={clockFaceMat}><circleGeometry args={[3.1, 24]} /></mesh>
            <mesh position={[-4.82, 17.5, 0]} rotation={[0, -Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.1, 24]} /></mesh>
            <mesh position={[4.82, 17.5, 0]} rotation={[0, Math.PI / 2, 0]} material={clockFaceMat}><circleGeometry args={[3.1, 24]} /></mesh>
          </group>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[34, 0, -16]}>
          <group>
            <mesh castShadow receiveShadow position={[0, 7, 0]}><cylinderGeometry args={[6.8, 7.2, 14, 16]} /><meshStandardMaterial color="#8b7d99" /></mesh>
            <mesh castShadow receiveShadow position={[0, 14.5, 0]}><sphereGeometry args={[6.8, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#92400e" metalness={0.45} roughness={0.45} /></mesh>
          </group>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0, 32]}>
          <group>
            <mesh castShadow receiveShadow position={[0, 14, 0]}><boxGeometry args={[42, 28, 18]} /><meshStandardMaterial color="#8b7d99" /></mesh>
            <mesh castShadow receiveShadow position={[0, 32, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[28, 10, 4]} /><meshStandardMaterial color="#9f1239" /></mesh>
            {[-15, -9, -3, 3, 9, 15].map((wx, i) => (
              <mesh key={i} position={[wx, 14, -9.1]} rotation={[0, Math.PI, 0]} material={gothicWindowMat}><planeGeometry args={[2.4, 12.0]} /></mesh>
            ))}
          </group>
        </RigidBody>
        {[[-8, -42], [8, -42], [-8, -16], [8, -16], [-16, 14], [16, 14]].map(([bx, bz], idx) => (
          <group key={idx} position={[bx, 0, bz]}>
            <mesh castShadow position={[0, 1.8, 0]}><cylinderGeometry args={[0.18, 0.28, 3.6, 8]} /><meshStandardMaterial color="#1e293b" /></mesh>
            <mesh position={[0, 3.8, 0]} material={torchFlameMat}><sphereGeometry args={[0.48, 10, 10]} /></mesh>
          </group>
        ))}
      </group>
      <group position={[HARBOR_X, harborY, HARBOR_Z]}>
        <RigidBody type="fixed" colliders="cuboid" position={[0, 0.5, 16]}>
          <mesh castShadow receiveShadow><boxGeometry args={[10, 1.2, 36]} /><meshStandardMaterial color="#5c3a21" /></mesh>
        </RigidBody>
        <RigidBody type="fixed" colliders="cuboid" position={[28, 0, 5]}>
          <group>
            <mesh castShadow receiveShadow position={[0, 8, 0]}><cylinderGeometry args={[2.2, 3.4, 16, 14]} /><meshStandardMaterial color="#f8fafc" /></mesh>
            <mesh position={[0, 16.8, 0]} material={clockFaceMat}><cylinderGeometry args={[2.0, 2.0, 2.2, 12]} /></mesh>
            <mesh castShadow position={[0, 19.0, 0]}><coneGeometry args={[2.6, 2.5, 14]} /><meshStandardMaterial color="#dc2626" /></mesh>
          </group>
        </RigidBody>
      </group>
    </group>
  );
}
