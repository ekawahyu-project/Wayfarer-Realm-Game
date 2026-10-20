"use client";

import { Physics } from "@react-three/rapier";
import { useControls } from "leva";
import Terrain from "./world/Terrain";
import Water from "./world/Water";
import Beach from "./world/locations/Beach";
import PlayerController from "./player/PlayerController";
import TimeOfDay from "./systems/TimeOfDay";
import Sky from "./systems/Sky";
import Effects from "./post/Effects";
import { usePlayerStore } from "./state/usePlayerStore";

export default function Experience() {
  const position = usePlayerStore((s) => s.position);
  const activeChunks = usePlayerStore((s) => s.activeChunks);

  const { showPhysicsDebug } = useControls("World Debug", {
    showPhysicsDebug: false,
    playerPos: {
      value: String(position[0]) + ", " + String(position[1]) + ", " + String(position[2]),
      editable: false,
    },
    loadedChunks: {
      value: activeChunks,
      editable: false,
    },
  });

  return (
    <>
      <Sky />
      <TimeOfDay />
      <Physics debug={showPhysicsDebug} gravity={[0, -9.81, 0]}>
        <Terrain />
        <Beach />
        <PlayerController />
      </Physics>
      <Water />
      <Effects />
    </>
  );
}
