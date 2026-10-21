"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { globalUniforms } from "./globalUniforms";

const MAX_ACTIVE_LIGHTS = 4;

interface StreetLamp {
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
  distance: number;
}

export default function LightPool() {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);
  const postRef = useRef<THREE.InstancedMesh>(null);
  const bulbRef = useRef<THREE.InstancedMesh>(null);

  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 2.5 }), []);

  // Street lamps ONLY inside the 3 Villages and the Royal Kingdom (Zero lamps in wilderness/roads!)
  const lamps = useMemo<StreetLamp[]>(() => {
    const list: StreetLamp[] = [];
    const addLamp = (x: number, z: number, color = "#fbbf24", intensity = 5.5, distance = 42) => {
      list.push({ x, y: getExactMeshTerrainHeight(x, z), z, color, intensity, distance });
    };

    // 1. East Grand Market Village Street Lamps (X: 300..430, Z: -45..45)
    for (let x = 310; x <= 425; x += 22) {
      addLamp(x, -10); addLamp(x, 10);
    }
    // 2. SW Expanded Village Street Lamps (X: -335..-225, Z: 200..280)
    for (let x = -325; x <= -235; x += 22) {
      addLamp(x, 230); addLamp(x, 250);
    }
    // 3. West Forest Expanded Village Street Lamps (X: -300..-190, Z: -135..-55)
    for (let x = -290; x <= -200; x += 22) {
      addLamp(x, -105); addLamp(x, -85);
    }
    // 4. Royal Kingdom Interior Avenues & Plaza (X: -55..55, Z: 325..455)
    for (let z = 330; z <= 445; z += 22) {
      addLamp(-14, z, "#f97316", 6.5, 45);
      addLamp(14, z, "#f97316", 6.5, 45);
    }

    return list;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (postRef.current && bulbRef.current) {
      lamps.forEach((l, i) => {
        dummy.position.set(l.x, l.y + 2.1, l.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(l.x, l.y + 4.35, l.z);
        dummy.updateMatrix();
        bulbRef.current!.setMatrixAt(i, dummy.matrix);
      });
      postRef.current.instanceMatrix.needsUpdate = true;
      bulbRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [lamps]);

  const lastSortTime = useRef(0);
  const activeIndices = useRef<number[]>(Array.from({ length: MAX_ACTIVE_LIGHTS }, (_, i) => i));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const night = globalUniforms.uNightFactor.value;
    bulbMat.emissiveIntensity = 0.5 + night * 4.0;

    if (t - lastSortTime.current > 0.35) {
      lastSortTime.current = t;
      const px = playerFrameState.x, pz = playerFrameState.z;
      const scored = lamps.map((a, idx) => ({ idx, distSq: (a.x - px) * (a.x - px) + (a.z - pz) * (a.z - pz) }));
      scored.sort((a, b) => a.distSq - b.distSq);
      for (let i = 0; i < MAX_ACTIVE_LIGHTS; i++) {
        activeIndices.current[i] = scored[i] ? scored[i].idx : 0;
      }
    }

    const nightGlow = THREE.MathUtils.smoothstep(night, 0.1, 0.6);
    for (let i = 0; i < MAX_ACTIVE_LIGHTS; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;
      const anchor = lamps[activeIndices.current[i]];
      if (anchor && nightGlow > 0.01) {
        light.position.set(anchor.x, anchor.y + 4.2, anchor.z);
        light.color.set(anchor.color);
        light.distance = anchor.distance;
        light.intensity = anchor.intensity * nightGlow;
      } else {
        light.intensity = 0;
      }
    }
  });

  return (
    <group name="settlement-street-lamps">
      <instancedMesh ref={postRef} args={[undefined, undefined, lamps.length]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.10, 0.16, 4.2, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={bulbRef} args={[undefined, undefined, lamps.length]} frustumCulled={false} material={bulbMat}>
        <cylinderGeometry args={[0.32, 0.22, 0.65, 6]} />
      </instancedMesh>
      {Array.from({ length: MAX_ACTIVE_LIGHTS }).map((_, i) => (
        <pointLight key={i} ref={(el) => { lightRefs.current[i] = el; }} intensity={0} distance={42} decay={1.4} />
      ))}
    </group>
  );
}
