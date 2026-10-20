"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { playerFrameState } from "@/game/state/usePlayerStore";

export default function Beach() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const boatGroupRef = useRef<THREE.Group>(null);
  const wakeRef = useRef<THREE.Mesh>(null);

  const { palms, bushes, rocks } = useMemo(() => {
    const palmList: { x: number; y: number; z: number; scale: number; rotY: number; tiltZ: number }[] = [];
    const bushList: { x: number; y: number; z: number; scale: number }[] = [];
    const rockList: { x: number; y: number; z: number; scaleX: number; scaleY: number; scaleZ: number; rotY: number }[] = [];

    let seed = 10202026;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < 90; i++) {
      const angle = Math.PI + (rand() - 0.5) * 1.45;
      const radius = 535 + rand() * 82;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.abs(z) < 16 && x < -550) continue;
      const y = getTerrainHeight(x, z);
      if (y > 0.6 && y < 9.5) {
        const scale = 0.85 + rand() * 0.55;
        palmList.push({ x, y, z, scale, rotY: rand() * Math.PI * 2, tiltZ: (rand() - 0.5) * 0.24 });
        bushList.push({ x: x + (rand() - 0.5) * 3, y, z: z + (rand() - 0.5) * 3, scale: 0.8 + rand() * 0.7 });
      }
    }

    for (let i = 0; i < 45; i++) {
      const angle = Math.PI + (rand() - 0.5) * 1.8;
      const radius = 570 + rand() * 90;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (Math.abs(z) < 18) continue;
      const y = getTerrainHeight(x, z);
      rockList.push({
        x, y: y - 0.3, z,
        scaleX: 1.5 + rand() * 3.5,
        scaleY: 1.0 + rand() * 2.4,
        scaleZ: 1.5 + rand() * 3.5,
        rotY: rand() * Math.PI,
      });
    }

    return { palms: palmList, bushes: bushList, rocks: rockList };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (trunkRef.current && crownRef.current) {
      palms.forEach((p, i) => {
        dummy.position.set(p.x, p.y + 2.8 * p.scale, p.z);
        dummy.rotation.set(0, p.rotY, p.tiltZ);
        dummy.scale.set(p.scale, p.scale, p.scale);
        dummy.updateMatrix();
        trunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(p.x - Math.sin(p.tiltZ) * 2.6 * p.scale, p.y + 5.5 * p.scale, p.z);
        dummy.rotation.set(0, p.rotY, p.tiltZ * 0.5);
        dummy.scale.set(p.scale * 1.35, p.scale * 0.75, p.scale * 1.35);
        dummy.updateMatrix();
        crownRef.current!.setMatrixAt(i, dummy.matrix);
      });
      trunkRef.current.instanceMatrix.needsUpdate = true;
      crownRef.current.instanceMatrix.needsUpdate = true;
    }
    if (bushRef.current) {
      bushes.forEach((b, i) => {
        dummy.position.set(b.x, b.y + 0.5 * b.scale, b.z);
        dummy.rotation.set(0, i, 0);
        dummy.scale.set(b.scale * 1.4, b.scale * 0.9, b.scale * 1.4);
        dummy.updateMatrix();
        bushRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bushRef.current.instanceMatrix.needsUpdate = true;
    }
    if (rockRef.current) {
      rocks.forEach((r, i) => {
        dummy.position.set(r.x, r.y, r.z);
        dummy.rotation.set(0.1, r.rotY, 0.05);
        dummy.scale.set(r.scaleX, r.scaleY, r.scaleZ);
        dummy.updateMatrix();
        rockRef.current!.setMatrixAt(i, dummy.matrix);
      });
      rockRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [palms, bushes, rocks]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (boatGroupRef.current) {
      const bx = playerFrameState.boatX;
      const bz = playerFrameState.boatZ;
      const waveY = Math.sin(bx * 0.07 + t * 1.8) * 0.08 + Math.cos(bz * 0.06 + t * 1.4) * 0.06;
      boatGroupRef.current.position.set(bx, waveY + 0.28, bz);
      boatGroupRef.current.rotation.y = playerFrameState.boatYaw;
      boatGroupRef.current.rotation.z = Math.sin(t * 2.1) * 0.04;
      boatGroupRef.current.rotation.x = Math.cos(t * 1.7) * 0.03;
    }
    if (wakeRef.current) {
      wakeRef.current.visible = playerFrameState.isInBoat && playerFrameState.isMoving;
      wakeRef.current.scale.x = 1 + Math.sin(t * 12) * 0.15;
    }
  });

  return (
    <group name="beach-biome">
      <instancedMesh ref={trunkRef} args={[undefined, undefined, palms.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.34, 5.8, 7]} />
        <meshStandardMaterial color="#855836" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[undefined, undefined, palms.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial color="#3f9e37" roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={bushRef} args={[undefined, undefined, bushes.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial color="#787c82" roughness={0.92} />
      </instancedMesh>

      {/* Wooden Pier with Support Pillars */}
      <group position={[-608, 1.38, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[30, 0.35, 4.6]} />
          <meshStandardMaterial color="#7c4d2b" roughness={0.88} />
        </mesh>
        {[-12, -6, 0, 6, 12].map((px, i) => (
          <group key={i} position={[px, -1.2, 0]}>
            <mesh castShadow position={[0, 0, 2.0]}><cylinderGeometry args={[0.18, 0.18, 3.2, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
            <mesh castShadow position={[0, 0, -2.0]}><cylinderGeometry args={[0.18, 0.18, 3.2, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          </group>
        ))}
      </group>

      {/* Tugboat (Reference Image 1) */}
      <group ref={boatGroupRef} position={[-628, 0.28, 0]}>
        <mesh castShadow receiveShadow position={[0, -0.1, 0]}>
          <boxGeometry args={[3.2, 0.65, 6.6]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.6} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[3.5, 0.85, 7.0]} />
          <meshStandardMaterial color="#18181b" roughness={0.5} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 1.65, 0.4]}>
          <boxGeometry args={[2.3, 1.5, 2.6]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.45} />
        </mesh>
        <mesh castShadow position={[0, 2.35, -1.3]}>
          <cylinderGeometry args={[0.35, 0.4, 1.7, 12]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        <mesh castShadow position={[0, 3.2, 1.5]}>
          <cylinderGeometry args={[0.08, 0.1, 3.2, 8]} />
          <meshStandardMaterial color="#18181b" />
        </mesh>
        <mesh ref={wakeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 5.0]} visible={false}>
          <planeGeometry args={[2.8, 5.5]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>
      </group>

      {/* Distant Islets (Reference Image 1) */}
      <group position={[-860, 0, -160]}>
        <mesh castShadow receiveShadow position={[0, 1.5, 0]}><cylinderGeometry args={[24, 38, 6, 12]} /><meshStandardMaterial color="#e6cf95" /></mesh>
        <mesh castShadow receiveShadow position={[-4, 8, -2]}><dodecahedronGeometry args={[9, 0]} /><meshStandardMaterial color="#7c8087" /></mesh>
        <mesh castShadow position={[5, 6.5, 4]}><boxGeometry args={[6, 5, 6]} /><meshStandardMaterial color="#92400e" /></mesh>
      </group>
    </group>
  );
}
