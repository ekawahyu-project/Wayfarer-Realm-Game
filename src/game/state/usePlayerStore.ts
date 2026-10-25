import { create } from "zustand";

interface PlayerState {
  position: [number, number, number];
  activeChunks: number;
  isGrounded: boolean;
  isRunning: boolean;
  isSwimming: boolean;
  isInBoat: boolean;
  interactionPrompt: string | null;
  teleportTarget: [number, number, number] | null;
  setPosition: (pos: [number, number, number]) => void;
  setActiveChunks: (count: number) => void;
  setGrounded: (grounded: boolean) => void;
  setRunning: (running: boolean) => void;
  setSwimming: (swimming: boolean) => void;
  setInBoat: (inBoat: boolean) => void;
  setInteractionPrompt: (prompt: string | null) => void;
  requestTeleport: (target: [number, number, number]) => void;
  clearTeleport: () => void;
}

export const playerFrameState: Record<string, any> = {
  equippedItem: "sword" as "sword" | "lantern" | "none",
  pendingTeleport: null as { x: number; y: number; z: number } | null,
  x: -532,
  y: 4,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  speed: 0,
  yaw: -Math.PI / 2,
  isMoving: false,
  isRunning: false,
  isGrounded: true,
  isSwimming: false,
  isInBoat: false,
  mountedHorseIndex: -1,
  horseYaw: 0,
  boatX: -596,
  boatZ: 0,
  boatYaw: -Math.PI / 2,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  position: [-532, 4, 0],
  activeChunks: 1,
  isGrounded: true,
  isRunning: false,
  isSwimming: false,
  isInBoat: false,
  interactionPrompt: null,
  teleportTarget: null,
  setPosition: (position) => set({ position }),
  setActiveChunks: (activeChunks) => set({ activeChunks }),
  setGrounded: (isGrounded) => set({ isGrounded }),
  setRunning: (isRunning) => set({ isRunning }),
  setSwimming: (isSwimming) => set({ isSwimming }),
  setInBoat: (isInBoat) => set({ isInBoat }),
  setInteractionPrompt: (interactionPrompt) => set({ interactionPrompt }),
  requestTeleport: (teleportTarget) => set({ teleportTarget }),
  clearTeleport: () => set({ teleportTarget: null }),
}));
