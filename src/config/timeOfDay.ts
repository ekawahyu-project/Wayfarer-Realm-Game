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
  { hour: 0.0, phase: "night", labelId: "Malam", skyTop: "#060b19", skyHorizon: "#0f2537", sunColor: "#93c5fd", sunIntensity: 0.25, ambientColor: "#1e293b", ambientGround: "#090d16", ambientIntensity: 0.18, fogColor: "#0c192c", fogDensity: 0.0014, exposure: 0.82, windowGlow: 1.0, nightFactor: 1.0 },
  { hour: 5.0, phase: "dawn", labelId: "Fajar", skyTop: "#3b2d54", skyHorizon: "#f97316", sunColor: "#fdba74", sunIntensity: 0.45, ambientColor: "#7c3aed", ambientGround: "#2e1065", ambientIntensity: 0.35, fogColor: "#c084fc", fogDensity: 0.0022, exposure: 0.9, windowGlow: 0.8, nightFactor: 0.6 },
  { hour: 7.0, phase: "morning", labelId: "Pagi", skyTop: "#1d4ed8", skyHorizon: "#93c5fd", sunColor: "#fef08a", sunIntensity: 1.05, ambientColor: "#bae6fd", ambientGround: "#3f6212", ambientIntensity: 0.52, fogColor: "#bae6fd", fogDensity: 0.0013, exposure: 1.0, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 12.0, phase: "noon", labelId: "Siang", skyTop: "#0284c7", skyHorizon: "#e0f2fe", sunColor: "#ffffff", sunIntensity: 1.35, ambientColor: "#e0f2fe", ambientGround: "#4d7c0f", ambientIntensity: 0.65, fogColor: "#d8f3dc", fogDensity: 0.0009, exposure: 1.1, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 15.5, phase: "afternoon", labelId: "Sore", skyTop: "#1e40af", skyHorizon: "#f59e0b", sunColor: "#fbbf24", sunIntensity: 1.05, ambientColor: "#fde68a", ambientGround: "#4c1d95", ambientIntensity: 0.5, fogColor: "#fcd34d", fogDensity: 0.0014, exposure: 1.0, windowGlow: 0.3, nightFactor: 0.15 },
  { hour: 18.0, phase: "dusk", labelId: "Senja", skyTop: "#3b0764", skyHorizon: "#ea580c", sunColor: "#f97316", sunIntensity: 0.5, ambientColor: "#86198f", ambientGround: "#1e1b4b", ambientIntensity: 0.32, fogColor: "#9a3412", fogDensity: 0.0019, exposure: 0.9, windowGlow: 0.95, nightFactor: 0.7 },
  { hour: 20.0, phase: "night", labelId: "Malam", skyTop: "#060b19", skyHorizon: "#0f2537", sunColor: "#93c5fd", sunIntensity: 0.25, ambientColor: "#1e293b", ambientGround: "#090d16", ambientIntensity: 0.18, fogColor: "#0c192c", fogDensity: 0.0014, exposure: 0.82, windowGlow: 1.0, nightFactor: 1.0 },
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
  let k0 = TIME_KEYFRAMES[0];
  let k1 = TIME_KEYFRAMES[0];
  let span = 24;
  for (let i = 0; i < TIME_KEYFRAMES.length; i++) {
    const curr = TIME_KEYFRAMES[i];
    const next = TIME_KEYFRAMES[(i + 1) % TIME_KEYFRAMES.length];
    const nextHour = i === TIME_KEYFRAMES.length - 1 ? next.hour + 24 : next.hour;
    if (h >= curr.hour && h <= nextHour) {
      k0 = curr;
      k1 = next;
      span = nextHour - curr.hour;
      break;
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
