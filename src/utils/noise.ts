import { createNoise2D } from "simplex-noise";

function createSeededRandom(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise2D = createNoise2D(createSeededRandom(20261020));

export function fbm(x: number, z: number, octaves = 4, lacunarity = 2.0, gain = 0.5): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return total / maxValue;
}

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 600;
  const dist = Math.sqrt(x * x + z * z);
  const normDist = dist / islandRadius;
  const coastNoise = fbm(x * 0.0025, z * 0.0025, 3) * 0.16;
  const effectiveDist = normDist - coastNoise;
  if (effectiveDist > 1.25) return -18;
  const falloff = Math.cos(Math.min(effectiveDist, 1.25) * (Math.PI / 2));
  const baseHills = (fbm(x * 0.003, z * 0.003, 4) + 0.35) * 14;
  const northFactor = Math.max(0, -z / 480);
  const mountainRidge = Math.pow(Math.abs(fbm(x * 0.0045, z * 0.0045, 5)), 1.35) * 95 * Math.pow(northFactor, 1.4);
  const southHillDist = Math.sqrt(x * x + Math.pow(z - 260, 2));
  const southPlateau = Math.max(0, 1 - southHillDist / 220) * 28;
  const westBeachMask = x < -120 ? Math.min(1, (-x - 120) / 320) : 0;
  let height = (baseHills + mountainRidge + southPlateau) * falloff;
  height = height * (1 - westBeachMask * 0.65);
  if (effectiveDist > 0.92) {
    const shoreT = (effectiveDist - 0.92) / 0.33;
    height = height * (1 - shoreT) - shoreT * 16;
  }
  return height;
}

export function getTerrainSlope(x: number, z: number): number {
  const eps = 1.0;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);
  return Math.sqrt(dx * dx + dz * dz);
}
