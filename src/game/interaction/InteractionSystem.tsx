"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { POIS } from "@/config/pois";
import { COLLECTIBLES } from "@/config/collectibles";
import { NPCS, NPCDef } from "@/game/npc/npcData";
import { npcLivePositions } from "@/game/npc/NPCSystem";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import { useJournalStore } from "@/game/state/useJournalStore";

export default function InteractionSystem() {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const nearestNpcRef = useRef<NPCDef | null>(null);
  const nearestCollectibleRef = useRef<string | null>(null);
  const lastCheckRef = useRef(0);

  const collectedItems = useJournalStore((s) => s.collectedItems);
  const setInteractionPrompt = usePlayerStore((s) => s.setInteractionPrompt);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const jStore = useJournalStore.getState();
      if (e.code === "KeyM") {
        jStore.toggleMap();
      } else if (e.code === "KeyJ") {
        jStore.toggleJournal();
      } else if (e.code === "KeyH") {
        jStore.toggleHud();
      } else if (e.code === "Escape") {
        jStore.closePanels();
      } else if (e.code === "KeyE") {
        if (nearestCollectibleRef.current) {
          jStore.collectItem(nearestCollectibleRef.current);
          nearestCollectibleRef.current = null;
        } else if (nearestNpcRef.current) {
          jStore.openDialogue(nearestNpcRef.current);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Rotate floating collectible crystals
    for (let i = 0; i < COLLECTIBLES.length; i++) {
      const m = meshRefs.current[i];
      if (m && m.visible) {
        m.rotation.y = t * 2.2 + i;
        m.position.y = COLLECTIBLES[i].position[1] + Math.sin(t * 3.0 + i) * 0.15;
      }
    }

    if (t - lastCheckRef.current < 0.2) return;
    lastCheckRef.current = t;

    const px = playerFrameState.x;
    const pz = playerFrameState.z;
    const jStore = useJournalStore.getState();

    // 1. Auto-discover POIs within radius
    for (let i = 0; i < POIS.length; i++) {
      const p = POIS[i];
      if (!jStore.discoveredPOIs.includes(p.id)) {
        const dx = px - p.position[0];
        const dz = pz - p.position[2];
        if (dx * dx + dz * dz <= p.discoverRadius * p.discoverRadius) {
          jStore.discoverPOI(p.id);
        }
      }
    }

    // Keep boat prompt priority if near tugboat
    const boatDistSq = Math.pow(px - playerFrameState.boatX, 2) + Math.pow(pz - playerFrameState.boatZ, 2);
    if (playerFrameState.isInBoat || boatDistSq < 90) return;

    // 2. Check nearest uncollected item (< 3.5m)
    let foundCol: string | null = null;
    let foundColName = "";
    for (let i = 0; i < COLLECTIBLES.length; i++) {
      const c = COLLECTIBLES[i];
      if (jStore.collectedItems.includes(c.id)) continue;
      const dx = px - c.position[0];
      const dz = pz - c.position[2];
      if (dx * dx + dz * dz < 12.25) {
        foundCol = c.id;
        foundColName = c.name;
        break;
      }
    }
    nearestCollectibleRef.current = foundCol;

    if (foundCol) {
      nearestNpcRef.current = null;
      setInteractionPrompt("Tekan E untuk Mengambil " + foundColName);
      return;
    }

    // 3. Check nearest NPC (< 4.0m)
    let foundNpc: NPCDef | null = null;
    for (let i = 0; i < NPCS.length; i++) {
      const n = NPCS[i];
      const live = npcLivePositions[n.id] || { x: n.position[0], z: n.position[2] };
      const dx = px - live.x;
      const dz = pz - live.z;
      if (dx * dx + dz * dz < 16.0) {
        foundNpc = n;
        break;
      }
    }
    nearestNpcRef.current = foundNpc;

    if (foundNpc) {
      setInteractionPrompt("Tekan E untuk Bicara dengan " + foundNpc.name);
    } else {
      setInteractionPrompt(null);
    }
  });

  return (
    <group name="world-collectibles">
      {COLLECTIBLES.map((c, idx) => {
        const isCollected = collectedItems.includes(c.id);
        return (
          <mesh
            key={c.id}
            ref={(el) => {
              meshRefs.current[idx] = el;
            }}
            position={c.position}
            visible={!isCollected}
          >
            <octahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color={c.color} emissive={c.color} emissiveIntensity={2.2} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}
