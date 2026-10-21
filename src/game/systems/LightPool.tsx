"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight } from "@/utils/noise";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { globalUniforms } from "./globalUniforms";

const MAX_ACTIVE_LIGHTS = 12;

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
  const reflectionRef = useRef<THREE.InstancedMesh>(null);

  const bulbMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fef08a", emissive: "#f59e0b", emissiveIntensity: 3.0 }), []);
  const reflectMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f59e0b", transparent: true, opacity: 0.35, depthWrite: false }), []);

  // 85 Wrought-Iron Street Lamps across all 3 Villages, Roads, and Royal Kingdom
  const lamps = useMemo<StreetLamp[]>(() => {
    const list: StreetLamp[] = [];
    const addLamp = (x: number, z: number, color = "#fbbf24", intensity = 5.5, distance = 38) => {
      list.push({ x, y: getExactMeshTerrainHeight(x, z), z, color, intensity, distance });
    };

    // 1. East Grand Market Village Street Lamps (Grid of streets & market square)
    for (let x = 295; x <= 435; x += 18) {
      addLamp(x, -10, "#fbbf24", 6.0, 40);
      addLamp(x, 10, "#fbbf24", 6.0, 40);
    }
    for (let z = -56; z <= 56; z += 20) {
      addLamp(340, z, "#f59e0b", 5.5, 36);
      addLamp(390, z, "#f59e0b", 5.5, 36);
    }

    // 2. SW Fishing Village Street Lamps (-280, 240)
    for (let x = -315; x <= -245; x += 16) {
      addLamp(x, 232, "#fbbf24", 5.5, 36);
      addLamp(x, 248, "#fbbf24", 5.5, 36);
    }

    // 3. West Forest Village Street Lamps (-245, -95)
    for (let x = -275; x <= -215; x += 16) {
      addLamp(x, -102, "#fbbf24", 5.5, 36);
      addLamp(x, -88, "#fbbf24", 5.5, 36);
    }

    // 4. Royal Kingdom Grand Avenues & Plaza Street Lamps (0, 395)
    for (let z = 310; z <= 445; z += 20) {
      addLamp(-14, z, "#f97316", 6.5, 45);
      addLamp(14, z, "#f97316", 6.5, 45);
    }
    for (let x = -56; x <= 56; x += 22) {
      addLamp(x, 375, "#fbbf24", 6.0, 42);
      addLamp(x, 415, "#fbbf24", 6.0, 42);
    }

    // 5. Main Roads & Harbor / West Pier Lamps
    for (let x = -520; x <= 260; x += 65) addLamp(x, 6, "#fbbf24", 5.0, 35);
    for (let z = -320; z <= 280; z += 65) addLamp(6, z, "#fbbf24", 5.0, 35);
    addLamp(-560, 2, "#fbbf24", 5.5, 36);
    addLamp(0, 545, "#fbbf24", 5.5, 36);

    return list;
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (postRef.current && bulbRef.current && reflectionRef.current) {
      lamps.forEach((l, i) => {
        // Wrought-iron lamp post
        dummy.position.set(l.x, l.y + 2.1, l.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        postRef.current!.setMatrixAt(i, dummy.matrix);

        // Glowing Lantern Housing at Top
        dummy.position.set(l.x, l.y + 4.35, l.z);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        bulbRef.current!.setMatrixAt(i, dummy.matrix);

        // Ground Specular Light Reflection Pool (Pantulan Cahaya Lampu di Tanah!)
        dummy.position.set(l.x, l.y + 0.07, l.z);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        reflectionRef.current!.setMatrixAt(i, dummy.matrix);
      });
      postRef.current.instanceMatrix.needsUpdate = true;
      bulbRef.current.instanceMatrix.needsUpdate = true;
      reflectionRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [lamps]);

  const lastSortTime = useRef(0);
  const activeIndices = useRef<number[]>(Array.from({ length: MAX_ACTIVE_LIGHTS }, (_, i) => i));

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const night = globalUniforms.uNightFactor.value;

    bulbMat.emissiveIntensity = 0.6 + night * 4.2;
    reflectMat.opacity = night * 0.38;

    if (t - lastSortTime.current > 0.35) {
      lastSortTime.current = t;
      const px = playerFrameState.x;
      const pz = playerFrameState.z;
      const scored = lamps.map((a, idx) => ({
        idx,
        distSq: (a.x - px) * (a.x - px) + (a.z - pz) * (a.z - pz),
      }));
      scored.sort((a, b) => a.distSq - b.distSq);
      for (let i = 0; i < MAX_ACTIVE_LIGHTS; i++) {
        activeIndices.current[i] = scored[i] ? scored[i].idx : 0;
      }
    }

    const nightGlow = Math.max(0.15, THREE.MathUtils.smoothstep(night, 0.05, 0.5));
    for (let i = 0; i < MAX_ACTIVE_LIGHTS; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;
      const anchor = lamps[activeIndices.current[i]];
      if (anchor) {
        light.position.set(anchor.x, anchor.y + 4.2, anchor.z);
        light.color.set(anchor.color);
        light.distance = anchor.distance;
        const flicker = 0.92 + 0.08 * Math.sin(t * 9.0 + i * 1.7);
        light.intensity = anchor.intensity * nightGlow * flicker;
      }
    }
  });

  return (
    <group name="street-lamps-and-lightpool">
      {/* Instanced Wrought-Iron Street Lamp Posts */}
      <instancedMesh ref={postRef} args={[undefined, undefined, lamps.length]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.10, 0.16, 4.2, 8]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </instancedMesh>

      {/* Instanced Glowing Lantern Glass Housings */}
      <instancedMesh ref={bulbRef} args={[undefined, undefined, lamps.length]} frustumCulled={false} material={bulbMat}>
        <cylinderGeometry args={[0.32, 0.22, 0.65, 6]} />
      </instancedMesh>

      {/* Instanced Ground Light Bounce Reflection Rings */}
      <instancedMesh ref={reflectionRef} args={[undefined, undefined, lamps.length]} frustumCulled={false} material={reflectMat}>
        <circleGeometry args={[5.8, 16]} />
      </instancedMesh>

      {Array.from({ length: MAX_ACTIVE_LIGHTS }).map((_, i) => (
        <pointLight key={i} ref={(el) => { lightRefs.current[i] = el; }} intensity={0} distance={38} decay={1.4} />
      ))}
    </group>
  );
}
