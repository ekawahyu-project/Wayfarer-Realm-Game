"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";

const SHRINE_X = -310;
const SHRINE_Z = -315;
const LEAF_COUNT = 180;
const FIREFLY_COUNT = 95;

function ToriiGate({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh castShadow receiveShadow position={[-2.8, 3.0, 0]}><cylinderGeometry args={[0.28, 0.34, 6.0, 12]} /><meshStandardMaterial color="#b91c1c" roughness={0.55} /></mesh>
      <mesh castShadow receiveShadow position={[2.8, 3.0, 0]}><cylinderGeometry args={[0.28, 0.34, 6.0, 12]} /><meshStandardMaterial color="#b91c1c" roughness={0.55} /></mesh>
      <mesh castShadow position={[-2.8, 0.45, 0]}><cylinderGeometry args={[0.42, 0.46, 0.9, 12]} /><meshStandardMaterial color="#18181b" /></mesh>
      <mesh castShadow position={[2.8, 0.45, 0]}><cylinderGeometry args={[0.42, 0.46, 0.9, 12]} /><meshStandardMaterial color="#18181b" /></mesh>
      <mesh position={[-2.8, 4.6, 0]}><cylinderGeometry args={[0.32, 0.32, 0.4, 12]} /><meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} /></mesh>
      <mesh position={[2.8, 4.6, 0]}><cylinderGeometry args={[0.32, 0.32, 0.4, 12]} /><meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.3} /></mesh>
      <mesh castShadow position={[0, 4.55, 0]}><boxGeometry args={[7.2, 0.35, 0.35]} /><meshStandardMaterial color="#991b1b" /></mesh>
      <mesh castShadow position={[0, 5.75, 0]}><boxGeometry args={[8.8, 0.45, 0.6]} /><meshStandardMaterial color="#dc2626" /></mesh>
      <mesh position={[0, 5.15, 0]}><boxGeometry args={[0.6, 0.95, 0.28]} /><meshStandardMaterial color="#18181b" /></mesh>
    </group>
  );
}

export default function Shrine() {
  const baseY = useMemo(() => getTerrainHeight(SHRINE_X, SHRINE_Z), []);
  const leafMeshRef = useRef<THREE.InstancedMesh>(null);
  const fireflyMeshRef = useRef<THREE.InstancedMesh>(null);

  const sharedShojiMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef3c7", emissive: "#f59e0b", emissiveIntensity: 1.8 }), []);
  const sharedLanternMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffedd5", emissive: "#ea580c", emissiveIntensity: 2.5 }), []);

  const stoneLanterns = useMemo(() => {
    const coords = [[-4.5, -264], [4.5, -264], [-4.5, -276], [4.5, -276], [-4.5, -288], [4.5, -288], [-6.8, -301], [6.8, -301], [-11.5, -308], [11.5, -308]];
    return coords.map(([dx, z]) => ({ x: SHRINE_X + dx, y: getTerrainHeight(SHRINE_X + dx, z), z }));
  }, []);

  const { leaves, fireflies } = useMemo(() => ({
    leaves: Array.from({ length: LEAF_COUNT }).map((_, i) => ({ x: SHRINE_X + ((i * 37) % 70) - 35, y: baseY + ((i * 19) % 18) + 1, z: SHRINE_Z + ((i * 53) % 70) - 25, speed: 0.9 + (i % 7) * 0.22, phase: i * 0.7 })),
    fireflies: Array.from({ length: FIREFLY_COUNT }).map((_, i) => ({ x: SHRINE_X + ((i * 29) % 50) - 25, y: baseY + 0.6 + ((i * 13) % 5), z: SHRINE_Z + ((i * 41) % 60) - 15, phase: i * 1.3 })),
  }), [baseY]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const night = globalUniforms.uNightFactor.value;
    const blood = globalUniforms.uBloodMoon.value;
    sharedShojiMat.emissiveIntensity = 0.45 + night * (2.4 + blood * 1.8);
    sharedLanternMat.emissiveIntensity = 0.6 + night * (3.4 + blood * 2.0);

    if (leafMeshRef.current) {
      for (let i = 0; i < LEAF_COUNT; i++) {
        const l = leaves[i];
        const fallY = ((l.y - t * l.speed) % 16 + 16) % 16;
        dummy.position.set(l.x + Math.sin(t * 1.6 + l.phase) * 1.8, baseY + fallY, l.z + Math.cos(t * 1.3 + l.phase) * 1.4);
        dummy.rotation.set(t * 1.5 + l.phase, t * 1.1, Math.sin(t + l.phase));
        dummy.scale.set(0.28, 0.28, 0.28);
        dummy.updateMatrix();
        leafMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      leafMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (fireflyMeshRef.current) {
      const s = night > 0.1 ? 0.085 : 0.001;
      for (let i = 0; i < FIREFLY_COUNT; i++) {
        const f = fireflies[i];
        const pulse = s * (0.6 + 0.4 * Math.sin(t * 3.5 + f.phase));
        dummy.position.set(f.x + Math.sin(t * 0.8 + f.phase) * 1.5, f.y + Math.sin(t * 1.9 + f.phase) * 0.7, f.z + Math.cos(t * 0.7 + f.phase) * 1.5);
        dummy.scale.set(pulse, pulse, pulse);
        dummy.updateMatrix();
        fireflyMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      fireflyMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="maple-shrine-biome">
      {/* Stone Stairway (Reference Image 3) */}
      <mesh castShadow receiveShadow position={[SHRINE_X, baseY - 0.3, SHRINE_Z + 32]} rotation={[-0.04, 0, 0]}>
        <boxGeometry args={[8.0, 1.2, 38]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      <ToriiGate position={[SHRINE_X, getTerrainHeight(SHRINE_X, SHRINE_Z + 44), SHRINE_Z + 44]} scale={1.15} />
      <ToriiGate position={[SHRINE_X, baseY, SHRINE_Z + 18]} scale={1.05} />
      {stoneLanterns.map((l, idx) => (
        <group key={idx} position={[l.x, l.y, l.z]}>
          <mesh castShadow receiveShadow position={[0, 0.9, 0]}><cylinderGeometry args={[0.22, 0.34, 1.8, 6]} /><meshStandardMaterial color="#4b5563" /></mesh>
          <mesh position={[0, 2.0, 0]} material={sharedLanternMat}><boxGeometry args={[0.5, 0.54, 0.5]} /></mesh>
          <mesh castShadow position={[0, 2.48, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.68, 0.48, 4]} /><meshStandardMaterial color="#374151" /></mesh>
        </group>
      ))}
      {/* Multi-Tiered Japanese Pagoda Temple (Reference Image 3) */}
      <group position={[SHRINE_X, baseY, SHRINE_Z]}>
        <mesh castShadow receiveShadow position={[0, 1.0, 0]}><boxGeometry args={[26, 2.0, 16]} /><meshStandardMaterial color="#334155" /></mesh>
        <mesh castShadow receiveShadow position={[0, 4.2, 0]}><boxGeometry args={[22, 4.4, 12]} /><meshStandardMaterial color="#1e293b" /></mesh>
        {[-8, -5, -2, 2, 5, 8].map((wx, i) => (
          <mesh key={i} position={[wx, 4.1, 6.06]} material={sharedShojiMat}><planeGeometry args={[1.65, 2.45]} /></mesh>
        ))}
        <mesh castShadow receiveShadow position={[0, 7.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[18.2, 3.4, 4]} /><meshStandardMaterial color="#0f172a" /></mesh>
        <mesh castShadow receiveShadow position={[0, 9.8, 0]}><boxGeometry args={[13.5, 3.6, 8.8]} /><meshStandardMaterial color="#1e293b" /></mesh>
        {[-3.4, 0, 3.4].map((wx, i) => (
          <mesh key={i} position={[wx, 9.8, 4.45]} material={sharedShojiMat}><planeGeometry args={[1.9, 2.1]} /></mesh>
        ))}
        <mesh castShadow receiveShadow position={[0, 12.8, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[12.4, 3.6, 4]} /><meshStandardMaterial color="#0f172a" /></mesh>
      </group>
      <instancedMesh ref={leafMeshRef} args={[undefined, undefined, LEAF_COUNT]} frustumCulled={false}>
        <planeGeometry args={[0.7, 0.7]} />
        <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={fireflyMeshRef} args={[undefined, undefined, FIREFLY_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#7dd3fc" />
      </instancedMesh>
    </group>
  );
}
