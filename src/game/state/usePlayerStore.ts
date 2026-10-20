import { create } from "zustand";

interface PlayerState {
  position: [number, number, number];
  activeChunks: number;
  isGrounded: boolean;
  isRunning: boolean;
  setPosition: (pos: [number, number, number]) => void;
  setActiveChunks: (count: number) => void;
  setGrounded: (grounded: boolean) => void;
  setRunning: (running: boolean) => void;
}

export const playerFrameState = {
  x: -360,
  y: 6,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  speed: 0,
  yaw: 0,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  position: [-360, 6, 0],
  activeChunks: 0,
  isGrounded: true,
  isRunning: false,
  setPosition: (position) => set({ position }),
  setActiveChunks: (activeChunks) => set({ activeChunks }),
  setGrounded: (isGrounded) => set({ isGrounded }),
  setRunning: (isRunning) => set({ isRunning }),
}));
