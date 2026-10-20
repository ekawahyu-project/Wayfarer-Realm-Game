"use client";

import { useControls } from "leva";
import Terrain from "./world/Terrain";
import Water from "./world/Water";
import Beach from "./world/locations/Beach";
import Mountains from "./world/locations/Mountains";
import Shrine from "./world/locations/Shrine";
import Village from "./world/locations/Village";
import Kingdom from "./world/locations/Kingdom";
import Vegetation from "./world/Vegetation";
import Wildlife from "./world/Wildlife";
import PlayerController from "./player/PlayerController";
import NPCSystem from "./npc/NPCSystem";
import InteractionSystem from "./interaction/InteractionSystem";
import TimeOfDay from "./systems/TimeOfDay";
import Sky from "./systems/Sky";
import Weather from "./systems/Weather";
import AudioManager from "./systems/AudioManager";
import LightPool from "./systems/LightPool";
import Effects from "./post/Effects";
import { usePlayerStore } from "./state/usePlayerStore";
import { globalUniforms } from "./systems/globalUniforms";

export default function Experience() {
  const position = usePlayerStore((s) => s.position);
  const activeChunks = usePlayerStore((s) => s.activeChunks);

  useControls("World & Wind", {
    kekuatanAngin: { value: 0.7, min: 0.0, max: 2.0, step: 0.1, onChange: (v: number) => { globalUniforms.uWindStrength.value = v; } },
    intensitasAurora: { value: 1.3, min: 0.0, max: 2.5, step: 0.1, onChange: (v: number) => { globalUniforms.uAuroraStrength.value = v; } },
    playerPos: { value: String(position[0]) + ", " + String(position[1]) + ", " + String(position[2]), editable: false },
    loadedChunks: { value: activeChunks, editable: false },
  });

  return (
    <>
      <Sky />
      <TimeOfDay />
      <Weather />
      <AudioManager />
      <LightPool />
      <Terrain />
      <Beach />
      <Mountains />
      <Shrine />
      <Village />
      <Kingdom />
      <PlayerController />
      <NPCSystem />
      <InteractionSystem />
      <Vegetation />
      <Wildlife />
      <Water />
      <Effects />
    </>
  );
}
