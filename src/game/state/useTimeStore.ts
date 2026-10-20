import { create } from "zustand";
import { TimePhase } from "@/config/timeOfDay";

interface TimeState {
  hour: number;
  day: number;
  phase: TimePhase;
  phaseLabel: string;
  dayLengthMinutes: number;
  timeScale: number;
  isBloodMoon: boolean;
  setHour: (hour: number) => void;
  setDayLengthMinutes: (minutes: number) => void;
  setTimeScale: (scale: number) => void;
  setBloodMoon: (active: boolean) => void;
  syncUiTime: (hour: number, day: number, phase: TimePhase, phaseLabel: string) => void;
}

export const timeFrameState = {
  hour: 7.5,
  day: 1,
  exposure: 1.0,
};

export const useTimeStore = create<TimeState>((set) => ({
  hour: 7.5,
  day: 1,
  phase: "morning",
  phaseLabel: "Pagi",
  dayLengthMinutes: 20,
  timeScale: 1,
  isBloodMoon: false,
  setHour: (hour) => {
    const normalized = ((hour % 24) + 24) % 24;
    timeFrameState.hour = normalized;
    set({ hour: normalized });
  },
  setDayLengthMinutes: (dayLengthMinutes) => set({ dayLengthMinutes }),
  setTimeScale: (timeScale) => set({ timeScale }),
  setBloodMoon: (isBloodMoon) => set({ isBloodMoon }),
  syncUiTime: (hour, day, phase, phaseLabel) => set({ hour, day, phase, phaseLabel }),
}));

export function formatGameClock(decimalHour: number): string {
  const h = Math.floor(((decimalHour % 24) + 24) % 24);
  const m = Math.floor((((decimalHour % 1) + 1) % 1) * 60);
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}
