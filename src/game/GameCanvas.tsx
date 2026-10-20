"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Leva } from "leva";
import { Perf } from "r3f-perf";
import * as THREE from "three";
import Experience from "./Experience";
import { useGameStore } from "./state/useGameStore";

export default function GameCanvas() {
  const qualityPreset = useGameStore((state) => state.qualityPreset);
  const setQualityPreset = useGameStore((state) => state.setQualityPreset);
  const [webglSupported, setWebglSupported] = useState(true);
  const [contextLost, setContextLost] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  // Check WebGL2 availability & initial hardware preset detection (PRD 8.6 & 12.2)
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl2 = canvas.getContext("webgl2");
      if (!gl2) {
        setWebglSupported(false);
        return;
      }
      const cores = navigator.hardwareConcurrency || 4;
      if (cores <= 4) {
        setQualityPreset("medium");
      }
    } catch {
      setWebglSupported(false);
    }
  }, [setQualityPreset]);

  if (!webglSupported) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-slate-950 text-amber-100 p-6 text-center">
        <h2 className="text-2xl font-bold text-amber-400 mb-2">WebGL2 Tidak Tersedia</h2>
        <p className="max-w-md text-sm text-amber-200/80">
          Browser atau perangkat Anda belum mengaktifkan dukungan WebGL2. Silakan gunakan Chrome, Edge, Firefox, atau Safari versi terbaru dengan akselerasi perangkat keras aktif.
        </p>
      </div>
    );
  }

  const dpr: [number, number] = qualityPreset === "low" ? [0.75, 0.75] : qualityPreset === "medium" ? [1, 1] : [1, 1.5];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <Leva hidden={!isDev} collapsed={true} />
      {contextLost && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/90 text-amber-200 text-sm font-semibold">
          Memulihkan Konteks Grafis WebGL... Silakan tunggu sebentar.
        </div>
      )}
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
        onCreated={({ gl }) => {
          const dom = gl.domElement;
          dom.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            setContextLost(true);
          });
          dom.addEventListener("webglcontextrestored", () => {
            setContextLost(false);
          });
        }}
      >
        {isDev && <Perf position="top-left" />}
        <Experience />
      </Canvas>
    </div>
  );
}
