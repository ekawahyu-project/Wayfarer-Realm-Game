import { create } from "zustand";

export type QualityPreset = "low" | "medium" | "high";

interface GameState {
  isPaused: boolean;
  qualityPreset: QualityPreset;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setQualityPreset: (preset: QualityPreset) => void;
}

export const useGameStore = create<GameState>((set) => ({
  isPaused: false,
  qualityPreset: "medium",
  setPaused: (paused) => set({ isPaused: paused }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setQualityPreset: (preset) => set({ qualityPreset: preset }),
}));
