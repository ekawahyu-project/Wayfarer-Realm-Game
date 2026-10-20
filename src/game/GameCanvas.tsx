"use client";

import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Perf } from "r3f-perf";
import Experience from "./Experience";
import { useGameStore } from "./state/useGameStore";

export default function GameCanvas() {
  const qualityPreset = useGameStore((state) => state.qualityPreset);
  const isDev = process.env.NODE_ENV === "development";

  const dpr: [number, number] =
    qualityPreset === "low"
      ? [0.75, 0.75]
      : qualityPreset === "medium"
      ? [1, 1]
      : [1, 1.5];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <Leva hidden={!isDev} collapsed={false} />
      <Canvas
        shadows
        dpr={dpr}
        camera={{ fov: 60, near: 0.1, far: 1000, position: [4, 4, 6] }}
        gl={{ antialias: qualityPreset !== "low", powerPreference: "high-performance" }}
      >
        {isDev && <Perf position="top-left" />}
        <Experience />
      </Canvas>
    </div>
  );
}
