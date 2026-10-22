export type DayPhase = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'night';

export interface TimeKeyframe {
  hour: number;
  phase: DayPhase;
  labelId: string;
  skyTop: string;
  skyHorizon: string;
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientGround: string;
  ambientIntensity: number;
  fogColor: string;
  fogDensity: number;
  exposure: number;
  windowGlow: number;
  nightFactor: number;
}

// Disney/Pixar Stylized Lighting: Warm Golden Key Light + Soft Sky-Blue Fill Shadows (Never harsh or washed-out!)
export const TIME_KEYFRAMES: TimeKeyframe[] = [
  { hour: 0.0, phase: "night", labelId: "Malam", skyTop: "#0b1528", skyHorizon: "#1e3a5f", sunColor: "#93c5fd", sunIntensity: 0.45, ambientColor: "#60a5fa", ambientGround: "#1e293b", ambientIntensity: 0.52, fogColor: "#0f1e36", fogDensity: 0.00055, exposure: 0.96, windowGlow: 1.0, nightFactor: 1.0 },
  { hour: 5.0, phase: "dawn", labelId: "Fajar", skyTop: "#312e81", skyHorizon: "#fb923c", sunColor: "#fdba74", sunIntensity: 0.95, ambientColor: "#e9d5ff", ambientGround: "#581c87", ambientIntensity: 0.62, fogColor: "#f3e8ff", fogDensity: 0.0006, exposure: 0.98, windowGlow: 0.45, nightFactor: 0.35 },
  { hour: 7.5, phase: "morning", labelId: "Pagi", skyTop: "#1d63b8", skyHorizon: "#bae6fd", sunColor: "#ffedd5", sunIntensity: 1.25, ambientColor: "#e0f2fe", ambientGround: "#854d0e", ambientIntensity: 0.68, fogColor: "#cfe8fc", fogDensity: 0.00045, exposure: 0.98, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 12.0, phase: "noon", labelId: "Siang", skyTop: "#1e56a0", skyHorizon: "#bae6fd", sunColor: "#fff7ed", sunIntensity: 1.32, ambientColor: "#e0f2fe", ambientGround: "#713f12", ambientIntensity: 0.72, fogColor: "#cfe8fc", fogDensity: 0.0004, exposure: 1.00, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 15.5, phase: "afternoon", labelId: "Sore", skyTop: "#1e3a8a", skyHorizon: "#fdba74", sunColor: "#fed7aa", sunIntensity: 1.22, ambientColor: "#fef3c7", ambientGround: "#78350f", ambientIntensity: 0.68, fogColor: "#fed7aa", fogDensity: 0.0005, exposure: 0.98, windowGlow: 0.35, nightFactor: 0.12 },
  { hour: 18.0, phase: "dusk", labelId: "Senja", skyTop: "#3b0764", skyHorizon: "#f97316", sunColor: "#fb923c", sunIntensity: 0.88, ambientColor: "#c084fc", ambientGround: "#4c1d95", ambientIntensity: 0.58, fogColor: "#ea580c", fogDensity: 0.0006, exposure: 0.96, windowGlow: 0.9, nightFactor: 0.65 },
  { hour: 20.0, phase: "night", labelId: "Malam", skyTop: "#0b1528", skyHorizon: "#1e3a5f", sunColor: "#93c5fd", sunIntensity: 0.45, ambientColor: "#60a5fa", ambientGround: "#1e293b", ambientIntensity: 0.52, fogColor: "#0f1e36", fogDensity: 0.00055, exposure: 0.96, windowGlow: 1.0, nightFactor: 1.0 },
];
