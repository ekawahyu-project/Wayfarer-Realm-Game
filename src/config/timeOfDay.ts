import * as THREE from "three";

export type TimePhase = "dawn" | "morning" | "noon" | "afternoon" | "dusk" | "night";

export interface TimeKeyframe {
  hour: number;
  phase: TimePhase;
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

export const TIME_KEYFRAMES: TimeKeyframe[] = [
  { hour: 0.0, phase: "night", labelId: "Malam", skyTop: "#081226", skyHorizon: "#1e3a5f", sunColor: "#bae6fd", sunIntensity: 0.62, ambientColor: "#64748b", ambientGround: "#334155", ambientIntensity: 0.65, fogColor: "#0f1e36", fogDensity: 0.0005, exposure: 1.08, windowGlow: 1.0, nightFactor: 1.0 },
  { hour: 5.0, phase: "dawn", labelId: "Fajar", skyTop: "#312e81", skyHorizon: "#fb923c", sunColor: "#fed7aa", sunIntensity: 1.15, ambientColor: "#c084fc", ambientGround: "#4c1d95", ambientIntensity: 0.78, fogColor: "#d8b4fe", fogDensity: 0.0006, exposure: 1.12, windowGlow: 0.5, nightFactor: 0.4 },
  { hour: 7.0, phase: "morning", labelId: "Pagi", skyTop: "#0284c7", skyHorizon: "#e0f2fe", sunColor: "#fffbeb", sunIntensity: 1.85, ambientColor: "#f0f9ff", ambientGround: "#65a30d", ambientIntensity: 1.08, fogColor: "#e0f2fe", fogDensity: 0.0004, exposure: 1.24, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 12.0, phase: "noon", labelId: "Siang", skyTop: "#0369a1", skyHorizon: "#e0f2fe", sunColor: "#ffffff", sunIntensity: 1.95, ambientColor: "#ffffff", ambientGround: "#65a30d", ambientIntensity: 1.15, fogColor: "#e0f2fe", fogDensity: 0.00035, exposure: 1.26, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 15.5, phase: "afternoon", labelId: "Sore", skyTop: "#1d4ed8", skyHorizon: "#fbbf24", sunColor: "#fde68a", sunIntensity: 1.65, ambientColor: "#fef3c7", ambientGround: "#78350f", ambientIntensity: 0.98, fogColor: "#fde68a", fogDensity: 0.0005, exposure: 1.20, windowGlow: 0.35, nightFactor: 0.12 },
  { hour: 18.0, phase: "dusk", labelId: "Senja", skyTop: "#3b0764", skyHorizon: "#f97316", sunColor: "#fdba74", sunIntensity: 1.05, ambientColor: "#a855f7", ambientGround: "#3b0764", ambientIntensity: 0.75, fogColor: "#c2410c", fogDensity: 0.0006, exposure: 1.12, windowGlow: 0.9, nightFactor: 0.65 },
  { hour: 20.0, phase: "night", labelId: "Malam", skyTop: "#081226", skyHorizon: "#1e3a5f", sunColor: "#bae6fd", sunIntensity: 0.62, ambientColor: "#64748b", ambientGround: "#334155", ambientIntensity: 0.65, fogColor: "#0f1e36", fogDensity: 0.0005, exposure: 1.08, windowGlow: 1.0, nightFactor: 1.0 },
];

export interface InterpolatedTimeSample {
  phase: TimePhase;
  labelId: string;
  skyTop: THREE.Color;
  skyHorizon: THREE.Color;
  sunColor: THREE.Color;
  sunIntensity: number;
  ambientColor: THREE.Color;
  ambientGround: THREE.Color;
  ambientIntensity: number;
  fogColor: THREE.Color;
  fogDensity: number;
  exposure: number;
  windowGlow: number;
  nightFactor: number;
}

const c1 = new THREE.Color();
const c2 = new THREE.Color();

export function getPhaseFromHour(hour: number): { phase: TimePhase; labelId: string } {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 7) return { phase: "dawn", labelId: "Fajar" };
  if (h >= 7 && h < 11) return { phase: "morning", labelId: "Pagi" };
  if (h >= 11 && h < 15) return { phase: "noon", labelId: "Siang" };
  if (h >= 15 && h < 17.5) return { phase: "afternoon", labelId: "Sore" };
  if (h >= 17.5 && h < 19) return { phase: "dusk", labelId: "Senja" };
  return { phase: "night", labelId: "Malam" };
}

export function sampleTimeOfDay(hour: number, target: InterpolatedTimeSample): void {
  const h = ((hour % 24) + 24) % 24;
  let k0 = TIME_KEYFRAMES[0], k1 = TIME_KEYFRAMES[0], span = 24;
  for (let i = 0; i < TIME_KEYFRAMES.length; i++) {
    const curr = TIME_KEYFRAMES[i];
    const next = TIME_KEYFRAMES[(i + 1) % TIME_KEYFRAMES.length];
    const nextHour = i === TIME_KEYFRAMES.length - 1 ? next.hour + 24 : next.hour;
    if (h >= curr.hour && h <= nextHour) {
      k0 = curr; k1 = next; span = nextHour - curr.hour; break;
    }
  }
  const rawT = span > 0 ? (h - k0.hour) / span : 0;
  const t = rawT * rawT * (3 - 2 * rawT);
  const phaseInfo = getPhaseFromHour(h);
  target.phase = phaseInfo.phase;
  target.labelId = phaseInfo.labelId;
  target.skyTop.copy(c1.set(k0.skyTop)).lerp(c2.set(k1.skyTop), t);
  target.skyHorizon.copy(c1.set(k0.skyHorizon)).lerp(c2.set(k1.skyHorizon), t);
  target.sunColor.copy(c1.set(k0.sunColor)).lerp(c2.set(k1.sunColor), t);
  target.ambientColor.copy(c1.set(k0.ambientColor)).lerp(c2.set(k1.ambientColor), t);
  target.ambientGround.copy(c1.set(k0.ambientGround)).lerp(c2.set(k1.ambientGround), t);
  target.fogColor.copy(c1.set(k0.fogColor)).lerp(c2.set(k1.fogColor), t);
  target.sunIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, t);
  target.ambientIntensity = THREE.MathUtils.lerp(k0.ambientIntensity, k1.ambientIntensity, t);
  target.fogDensity = THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, t);
  target.exposure = THREE.MathUtils.lerp(k0.exposure, k1.exposure, t);
  target.windowGlow = THREE.MathUtils.lerp(k0.windowGlow, k1.windowGlow, t);
  target.nightFactor = THREE.MathUtils.lerp(k0.nightFactor, k1.nightFactor, t);
}
