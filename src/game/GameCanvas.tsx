"use client";

import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import * as THREE from "three";
import Experience from "./Experience";
import { useGameStore } from "./state/useGameStore";

export default function GameCanvas() {
  const qualityPreset = useGameStore((state) => state.qualityPreset);
  const dpr: [number, number] = qualityPreset === "low" ? [0.75, 0.75] : qualityPreset === "medium" ? [1, 1] : [1, 1.5];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <Leva hidden={true} />
      <Canvas
        shadows
        dpr={dpr}
        camera={{ fov: 60, near: 0.1, far: 2200, position: [-580, 6, 0] }}
        gl={{
          antialias: qualityPreset !== "low",
          powerPreference: "high-performance",
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <Experience />
      </Canvas>
    </div>
  );
}
