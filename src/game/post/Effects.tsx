"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { useGameStore } from "@/game/state/useGameStore";

export default function Effects() {
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  if (qualityPreset === "low") return null;

  return (
    <EffectComposer disableNormalPass multisampling={qualityPreset === "high" ? 4 : 0}>
      <Bloom luminanceThreshold={0.88} mipmapBlur intensity={0.55} />
      <Vignette eskil={false} offset={0.15} darkness={0.42} />
    </EffectComposer>
  );
}
