"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { POIS } from "@/config/pois";
import { COLLECTIBLES } from "@/config/collectibles";
import { NPCS, NPCDef } from "@/game/npc/npcData";
import { npcLivePositions } from "@/game/npc/NPCSystem";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { useJournalStore } from "@/game/state/useJournalStore";

export const interactionTargetState = {
  nearestCollectibleId: null as string | null,
  nearestCollectibleName: "",
  nearestNpc: null as NPCDef | null,
};

export default function InteractionSystem() {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lastCheckRef = useRef(0);
  const collectedItems = useJournalStore((s) => s.collectedItems);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const jStore = useJournalStore.getState();
      if (e.code === "KeyM") jStore.toggleMap();
      else if (e.code === "KeyJ") jStore.toggleJournal();
      else if (e.code === "KeyH") jStore.toggleHud();
      else if (e.code === "Escape") jStore.closePanels();
      else if (e.code === "KeyE") {
        if (interactionTargetState.nearestCollectibleId) {
          jStore.collectItem(interactionTargetState.nearestCollectibleId);
          interactionTargetState.nearestCollectibleId = null;
        } else if (interactionTargetState.nearestNpc) {
          jStore.openDialogue(interactionTargetState.nearestNpc);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < COLLECTIBLES.length; i++) {
      const m = meshRefs.current[i];
      if (m && m.visible) {
        m.rotation.y = t * 2.2 + i;
        m.position.y = COLLECTIBLES[i].position[1] + Math.sin(t * 3.0 + i) * 0.15;
      }
    }

    if (t - lastCheckRef.current < 0.2) return;
    lastCheckRef.current = t;

    const px = playerFrameState.x, pz = playerFrameState.z;
    const jStore = useJournalStore.getState();

    for (let i = 0; i < POIS.length; i++) {
      const p = POIS[i];
      if (!jStore.discoveredPOIs.includes(p.id)) {
        if (Math.hypot(px - p.position[0], pz - p.position[2]) <= p.discoverRadius) {
          jStore.discoverPOI(p.id);
        }
      }
    }

    let foundCol: string | null = null;
    let foundColName = "";
    for (let i = 0; i < COLLECTIBLES.length; i++) {
      const c = COLLECTIBLES[i];
      if (jStore.collectedItems.includes(c.id)) continue;
      if (Math.hypot(px - c.position[0], pz - c.position[2]) < 3.6) {
        foundCol = c.id;
        foundColName = c.name;
        break;
      }
    }
    interactionTargetState.nearestCollectibleId = foundCol;
    interactionTargetState.nearestCollectibleName = foundColName;

    let foundNpc: NPCDef | null = null;
    for (let i = 0; i < NPCS.length; i++) {
      const n = NPCS[i];
      const live = npcLivePositions[n.id] || { x: n.position[0], z: n.position[2] };
      if (Math.hypot(px - live.x, pz - live.z) < 4.0) {
        foundNpc = n;
        break;
      }
    }
    interactionTargetState.nearestNpc = foundNpc;
  });

  return (
    <group name="world-collectibles">
      {COLLECTIBLES.map((c, idx) => (
        <mesh key={c.id} ref={(el) => { meshRefs.current[idx] = el; }} position={c.position} visible={!collectedItems.includes(c.id)}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={2.2} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
