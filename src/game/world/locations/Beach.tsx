"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { playerFrameState } from "@/game/state/usePlayerStore";

export default function Beach() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const bushRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const boatGroupRef = useRef<THREE.Group>(null);
  const wakeRef = useRef<THREE.Mesh>(null);
  const textures = useMemo(() => getWorldTextures(), []);

  const { palms, bushes, rocks } = useMemo(() => {
    const palmList: { x: number; y: number; z: number; scale: number; rotY: number; tiltZ: number }[] = [];
    const bushList: { x: number; y: number; z: number; scale: number }[] = [];
    const rockList: { x: number; y: number; z: number; scaleX: number; scaleY: number; scaleZ: number; rotY: number }[] = [];

    let seed = 10202026;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

    for (let i = 0; i < 85; i++) {
      const angle = Math.PI + (rand() - 0.5) * 1.4;
      const radius = 475 + rand() * 62;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      if (Math.abs(z) < 16 && x < -480) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 1.2 && y < 9.5) {
        const scale = 0.85 + rand() * 0.55;
        palmList.push({ x, y, z, scale, rotY: rand() * Math.PI * 2, tiltZ: (rand() - 0.5) * 0.24 });
        bushList.push({ x: x + (rand() - 0.5) * 3, y, z: z + (rand() - 0.5) * 3, scale: 0.8 + rand() * 0.7 });
      }
    }

    for (let i = 0; i < 45; i++) {
      const angle = Math.PI + (rand() - 0.5) * 1.7;
      const radius = 505 + rand() * 75;
      const x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
      if (Math.abs(z) < 20) continue;
      const y = getExactMeshTerrainHeight(x, z);
      rockList.push({ x, y: y - 0.3, z, scaleX: 1.5 + rand() * 3.5, scaleY: 1.0 + rand() * 2.4, scaleZ: 1.5 + rand() * 3.5, rotY: rand() * Math.PI });
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
      const waveY = Math.sin(bx * 0.09 + t * 2.0) * 0.08 + Math.cos(bz * 0.08 + t * 1.6) * 0.06;
      boatGroupRef.current.position.set(bx, waveY + 0.45, bz);
      boatGroupRef.current.rotation.y = playerFrameState.boatYaw;
      boatGroupRef.current.rotation.z = Math.sin(t * 2.1) * 0.035;
      boatGroupRef.current.rotation.x = Math.cos(t * 1.7) * 0.025;
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
        <meshStandardMaterial map={textures.oakBark} color="#855836" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={crownRef} args={[undefined, undefined, palms.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#4ead3b" roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={bushRef} args={[undefined, undefined, bushes.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#2e7d32" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial map={textures.terrainDetail} color="#787c82" roughness={0.92} />
      </instancedMesh>

      {/* Textured Wooden Pier extending into Deep Ocean */}
      <group position={[-555, 1.6, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[58, 0.4, 5.4]} />
          <meshStandardMaterial map={textures.woodPlanks} color="#8c5830" roughness={0.85} />
        </mesh>
        {[-24, -16, -8, 0, 8, 16, 24].map((px, i) => (
          <group key={i} position={[px, -2.2, 0]}>
            <mesh castShadow position={[0, 0, 2.3]}><cylinderGeometry args={[0.24, 0.24, 4.8, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
            <mesh castShadow position={[0, 0, -2.3]}><cylinderGeometry args={[0.24, 0.24, 4.8, 8]} /><meshStandardMaterial color="#4a2c18" /></mesh>
          </group>
        ))}
      </group>

      {/* Realistic Detailed Tugboat with Curved Bow, Planked Deck, Cabin Windows, Tires & Lifebuoy */}
      <group ref={boatGroupRef} position={[-596, 0.45, 0]}>
        {/* Lower Red Anti-Fouling Steel Hull & Curved Bow */}
        <mesh castShadow receiveShadow position={[0, -0.05, 0.4]}>
          <boxGeometry args={[3.6, 0.75, 6.8]} />
          <meshStandardMaterial map={textures.villageStone} color="#b91c1c" roughness={0.5} metalness={0.2} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.35, -3.5]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[1.85, 2.6, 12]} />
          <meshStandardMaterial map={textures.villageStone} color="#18181b" roughness={0.45} metalness={0.3} />
        </mesh>
        {/* Upper Black Steel Hull & Textured Wooden Plank Deck */}
        <mesh castShadow receiveShadow position={[0, 0.65, 0.4]}>
          <boxGeometry args={[3.8, 0.85, 7.0]} />
          <meshStandardMaterial map={textures.villageStone} color="#1e293b" roughness={0.45} metalness={0.3} />
        </mesh>
        <mesh receiveShadow position={[0, 1.10, 0.4]}>
          <boxGeometry args={[3.4, 0.1, 6.6]} />
          <meshStandardMaterial map={textures.woodPlanks} color="#a16207" roughness={0.8} />
        </mesh>
        {/* Side Rubber Fender Tires */}
        {[-2.0, 0, 2.0].map((tz, i) => (
          <group key={i}>
            <mesh position={[-1.92, 0.65, tz]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.32, 0.12, 8, 12]} /><meshStandardMaterial color="#090d16" roughness={0.9} /></mesh>
            <mesh position={[1.92, 0.65, tz]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[0.32, 0.12, 8, 12]} /><meshStandardMaterial color="#090d16" roughness={0.9} /></mesh>
          </group>
        ))}
        {/* Detailed Wheelhouse Cabin with Glass Windows & Roof */}
        <mesh castShadow receiveShadow position={[0, 1.9, -0.5]}>
          <boxGeometry args={[2.5, 1.7, 2.8]} />
          <meshStandardMaterial map={textures.woodPlanks} color="#f59e0b" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 2.8, -0.5]}>
          <boxGeometry args={[2.8, 0.18, 3.1]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
        <mesh position={[0, 2.1, -1.92]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.9, 0.75]} />
          <meshPhysicalMaterial color="#bae6fd" roughness={0.1} metalness={0.2} clearcoat={1} />
        </mesh>
        {/* Lifebuoy Ring on Cabin Side */}
        <mesh position={[1.3, 1.8, -0.5]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.32, 0.09, 8, 14]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        {/* Smokestack & Navigation Mast */}
        <mesh castShadow position={[0, 2.6, 1.5]}>
          <cylinderGeometry args={[0.35, 0.42, 1.9, 12]} />
          <meshStandardMaterial color="#d97706" metalness={0.4} roughness={0.4} />
        </mesh>
        <mesh castShadow position={[0, 3.6, -1.2]}>
          <cylinderGeometry args={[0.08, 0.11, 3.4, 8]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh ref={wakeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 5.4]} visible={false}>
          <planeGeometry args={[3.2, 6.2]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.65} />
        </mesh>
      </group>
    </group>
  );
}
