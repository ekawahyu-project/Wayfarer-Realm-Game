"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useGameStore } from "@/game/state/useGameStore";

export default function Effects() {
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  if (qualityPreset !== "high") return null;

  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <Bloom luminanceThreshold={0.92} mipmapBlur intensity={0.45} />
    </EffectComposer>
  );
}
