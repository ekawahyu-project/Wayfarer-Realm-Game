"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight } from "@/utils/noise";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { globalUniforms } from "./globalUniforms";

const MAX_ACTIVE_LIGHTS = 8;

interface LightAnchor {
  x: number;
  y: number;
  z: number;
  color: string;
  intensity: number;
  distance: number;
}

export default function LightPool() {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  const anchors = useMemo<LightAnchor[]>(() => {
    const list: LightAnchor[] = [];
    const add = (x: number, yOffset: number, z: number, color = "#f97316", intensity = 3.2, distance = 22) => {
      list.push({ x, y: getTerrainHeight(x, z) + yOffset, z, color, intensity, distance });
    };

    // NW Shrine
    add(-310, 3.0, -268, "#fb923c", 3.5, 24);
    add(-310, 3.5, -285, "#fb923c", 3.5, 24);
    add(-302, 3.5, -302, "#f97316", 4.0, 26);
    add(-318, 3.5, -302, "#f97316", 4.0, 26);
    add(-310, 5.0, -315, "#ef4444", 4.5, 30);

    // East Village
    add(360, 3.2, 0, "#fbbf24", 3.5, 25);
    add(342, 3.2, 14, "#f59e0b", 3.0, 22);
    add(378, 3.2, -12, "#f59e0b", 3.0, 22);
    add(355, 3.2, -28, "#f59e0b", 3.0, 22);
    add(385, 3.2, 22, "#f59e0b", 3.0, 22);
    add(325, 3.2, -5, "#fbbf24", 3.0, 22);

    // South Kingdom
    add(-8, 3.8, 345, "#f97316", 4.2, 28);
    add(8, 3.8, 345, "#f97316", 4.2, 28);
    add(-12, 3.8, 372, "#f97316", 4.2, 28);
    add(12, 3.8, 372, "#f97316", 4.2, 28);
    add(0, 4.5, 392, "#fbbf24", 4.8, 32);
    add(-26, 4.0, 395, "#f59e0b", 3.8, 26);
    add(26, 4.0, 395, "#f59e0b", 3.8, 26);
    add(0, 6.0, 425, "#fbbf24", 5.0, 35);

    // South Harbor & West Dock
    add(-608, 3.0, 0, "#fbbf24", 3.0, 20);
    add(0, 4.0, 615, "#fbbf24", 3.8, 26);
    add(28, 16.0, 625, "#fef08a", 6.0, 45);

    return list;
  }, []);

  const lastSortTime = useRef(0);
  const activeIndices = useRef<number[]>([0, 1, 2, 3, 4, 5, 6, 7]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const night = globalUniforms.uNightFactor.value;

    if (t - lastSortTime.current > 0.33) {
      lastSortTime.current = t;
      const px = playerFrameState.x;
      const pz = playerFrameState.z;
      const scored = anchors.map((a, idx) => ({
        idx,
        distSq: (a.x - px) * (a.x - px) + (a.z - pz) * (a.z - pz),
      }));
      scored.sort((a, b) => a.distSq - b.distSq);
      for (let i = 0; i < MAX_ACTIVE_LIGHTS; i++) {
        activeIndices.current[i] = scored[i] ? scored[i].idx : 0;
      }
    }

    const nightGlow = THREE.MathUtils.smoothstep(night, 0.08, 0.55);
    for (let i = 0; i < MAX_ACTIVE_LIGHTS; i++) {
      const light = lightRefs.current[i];
      if (!light) continue;
      if (nightGlow <= 0.01) {
        light.intensity = 0;
        continue;
      }
      const anchor = anchors[activeIndices.current[i]];
      if (anchor) {
        light.position.set(anchor.x, anchor.y, anchor.z);
        light.color.set(anchor.color);
        light.distance = anchor.distance;
        const flicker = 0.88 + 0.12 * Math.sin(t * 11.0 + i * 2.1) * Math.cos(t * 6.3 + i);
        light.intensity = anchor.intensity * nightGlow * flicker;
      }
    }
  });

  return (
    <group name="dynamic-pointlight-pool">
      {Array.from({ length: MAX_ACTIVE_LIGHTS }).map((_, i) => (
        <pointLight key={i} ref={(el) => { lightRefs.current[i] = el; }} intensity={0} distance={24} decay={1.6} />
      ))}
    </group>
  );
}
