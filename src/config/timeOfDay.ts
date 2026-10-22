import * as THREE from "three";

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

export interface TimeSample {
  hour: number;
  phase: DayPhase;
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

// Disney/Pixar Stylized Lighting: Warm balanced daylight (Never harsh or washed-out in villages!)
export const TIME_KEYFRAMES: TimeKeyframe[] = [
  { hour: 0.0, phase: "night", labelId: "Malam", skyTop: "#0b1528", skyHorizon: "#1e3a5f", sunColor: "#93c5fd", sunIntensity: 0.45, ambientColor: "#60a5fa", ambientGround: "#1e293b", ambientIntensity: 0.52, fogColor: "#0f1e36", fogDensity: 0.00055, exposure: 0.94, windowGlow: 1.0, nightFactor: 1.0 },
  { hour: 5.0, phase: "dawn", labelId: "Fajar", skyTop: "#312e81", skyHorizon: "#fb923c", sunColor: "#fdba74", sunIntensity: 0.92, ambientColor: "#e9d5ff", ambientGround: "#581c87", ambientIntensity: 0.60, fogColor: "#f3e8ff", fogDensity: 0.0006, exposure: 0.95, windowGlow: 0.45, nightFactor: 0.35 },
  { hour: 7.5, phase: "morning", labelId: "Pagi", skyTop: "#1d63b8", skyHorizon: "#bae6fd", sunColor: "#ffedd5", sunIntensity: 1.18, ambientColor: "#e0f2fe", ambientGround: "#78350f", ambientIntensity: 0.62, fogColor: "#cfe8fc", fogDensity: 0.00045, exposure: 0.94, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 12.0, phase: "noon", labelId: "Siang", skyTop: "#1e56a0", skyHorizon: "#bae6fd", sunColor: "#fff7ed", sunIntensity: 1.24, ambientColor: "#e0f2fe", ambientGround: "#713f12", ambientIntensity: 0.65, fogColor: "#cfe8fc", fogDensity: 0.0004, exposure: 0.95, windowGlow: 0.0, nightFactor: 0.0 },
  { hour: 15.5, phase: "afternoon", labelId: "Sore", skyTop: "#1e3a8a", skyHorizon: "#fdba74", sunColor: "#fed7aa", sunIntensity: 1.18, ambientColor: "#fef3c7", ambientGround: "#78350f", ambientIntensity: 0.64, fogColor: "#fed7aa", fogDensity: 0.0005, exposure: 0.95, windowGlow: 0.35, nightFactor: 0.12 },
  { hour: 18.0, phase: "dusk", labelId: "Senja", skyTop: "#3b0764", skyHorizon: "#f97316", sunColor: "#fb923c", sunIntensity: 0.85, ambientColor: "#c084fc", ambientGround: "#4c1d95", ambientIntensity: 0.56, fogColor: "#ea580c", fogDensity: 0.0006, exposure: 0.94, windowGlow: 0.9, nightFactor: 0.65 },
  { hour: 20.0, phase: "night", labelId: "Malam", skyTop: "#0b1528", skyHorizon: "#1e3a5f", sunColor: "#93c5fd", sunIntensity: 0.45, ambientColor: "#60a5fa", ambientGround: "#1e293b", ambientIntensity: 0.52, fogColor: "#0f1e36", fogDensity: 0.00055, exposure: 0.94, windowGlow: 1.0, nightFactor: 1.0 },
  { hour: 24.0, phase: "night", labelId: "Malam", skyTop: "#0b1528", skyHorizon: "#1e3a5f", sunColor: "#93c5fd", sunIntensity: 0.45, ambientColor: "#60a5fa", ambientGround: "#1e293b", ambientIntensity: 0.52, fogColor: "#0f1e36", fogDensity: 0.00055, exposure: 0.94, windowGlow: 1.0, nightFactor: 1.0 },
];

const _cA = new THREE.Color();
const _cB = new THREE.Color();

export function createTimeSample(initialHour = 8.0): TimeSample {
  const s: TimeSample = {
    hour: initialHour,
    phase: "morning",
    labelId: "Pagi",
    skyTop: new THREE.Color("#1d63b8"),
    skyHorizon: new THREE.Color("#bae6fd"),
    sunColor: new THREE.Color("#ffedd5"),
    sunIntensity: 1.18,
    ambientColor: new THREE.Color("#e0f2fe"),
    ambientGround: new THREE.Color("#78350f"),
    ambientIntensity: 0.62,
    fogColor: new THREE.Color("#cfe8fc"),
    fogDensity: 0.00045,
    exposure: 0.94,
    windowGlow: 0.0,
    nightFactor: 0.0,
  };
  return sampleTimeOfDay(initialHour, s);
}

export const createInitialTimeSample = createTimeSample;

function assignInterpColor(targetObj: any, key: string, hexA: string, hexB: string, t: number) {
  _cA.set(hexA).lerp(_cB.set(hexB), t);
  const cur = targetObj[key];
  if (cur && typeof cur === 'object' && typeof cur.copy === 'function') {
    cur.copy(_cA);
  } else if (typeof cur === 'string') {
    targetObj[key] = "#" + _cA.getHexString();
  } else {
    targetObj[key] = _cA.clone();
  }
}

export function sampleTimeOfDay(hour: number, out?: any): TimeSample {
  const target = out || createTimeSample(hour);
  const h = ((hour % 24) + 24) % 24;
  let k0 = TIME_KEYFRAMES[0];
  let k1 = TIME_KEYFRAMES[TIME_KEYFRAMES.length - 1];

  for (let i = 0; i < TIME_KEYFRAMES.length - 1; i++) {
    if (h >= TIME_KEYFRAMES[i].hour && h <= TIME_KEYFRAMES[i + 1].hour) {
      k0 = TIME_KEYFRAMES[i];
      k1 = TIME_KEYFRAMES[i + 1];
      break;
    }
  }

  const span = Math.max(0.0001, k1.hour - k0.hour);
  const rawT = Math.max(0, Math.min(1, (h - k0.hour) / span));
  const t = rawT * rawT * (3 - 2 * rawT);

  target.hour = h;
  target.phase = t < 0.5 ? k0.phase : k1.phase;
  target.labelId = t < 0.5 ? k0.labelId : k1.labelId;

  assignInterpColor(target, "skyTop", k0.skyTop, k1.skyTop, t);
  assignInterpColor(target, "skyHorizon", k0.skyHorizon, k1.skyHorizon, t);
  assignInterpColor(target, "sunColor", k0.sunColor, k1.sunColor, t);
  assignInterpColor(target, "ambientColor", k0.ambientColor, k1.ambientColor, t);
  assignInterpColor(target, "ambientGround", k0.ambientGround, k1.ambientGround, t);
  assignInterpColor(target, "fogColor", k0.fogColor, k1.fogColor, t);

  target.sunIntensity = THREE.MathUtils.lerp(k0.sunIntensity, k1.sunIntensity, t);
  target.ambientIntensity = THREE.MathUtils.lerp(k0.ambientIntensity, k1.ambientIntensity, t);
  target.fogDensity = THREE.MathUtils.lerp(k0.fogDensity, k1.fogDensity, t);
  target.exposure = THREE.MathUtils.lerp(k0.exposure, k1.exposure, t);
  target.windowGlow = THREE.MathUtils.lerp(k0.windowGlow, k1.windowGlow, t);
  target.nightFactor = THREE.MathUtils.lerp(k0.nightFactor, k1.nightFactor, t);

  return target;
}
