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

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Koordinat kompak & proporsional (Radius pulau 700m -> Diameter 1.400m)
export const BIOME_CENTERS = {
  westBeach: { x: -585, z: 0, label: "Pantai Barat & Dermaga (Titik Awal)" },
  centralMeadow: { x: 0, z: 0, label: "Padang Rumput & Hutan Tengah" },
  eastVillage: { x: 360, z: 0, label: "Desa Pedesaan (Timur)" },
  southKingdom: { x: 0, z: 390, label: "Kastil & Kota Kerajaan (Selatan)" },
  southHarbor: { x: 0, z: 620, label: "Pelabuhan Selatan" },
  northMountains: { x: 0, z: -460, label: "Pegunungan Salju (Utara)" },
  nwShrine: { x: -310, z: -310, label: "Kuil Maple Merah (Barat Laut)" },
};

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 700; // Diameter pulau 1.400m (pas sesuai PRD)
  const dist = Math.sqrt(x * x + z * z);
  const normDist = dist / islandRadius;

  // Garis pantai organik tetapi di bagian Pantai Barat (-X, Z dekat 0) dibuat rata agar dermaga rapi
  const westDockMask = Math.exp(-Math.pow(z / 120, 2)) * (x < -400 ? 1 : 0);
  const coastNoise = fbm(x * 0.002, z * 0.002, 3) * 0.09 * (1 - westDockMask * 0.85);
  const effectiveDist = normDist - coastNoise;

  // 1. Laut Lepas & Pantai Dangkal di Luar Pulau (effectiveDist >= 0.88)
  if (effectiveDist >= 0.88) {
    // Transisi sangat landai di pantai barat agar air dangkal turquoise terlihat luas (Gambar 1)
    const shallowSpan = 0.14 + westDockMask * 0.08;
    const shoreT = smoothstep(0.88, 0.88 + shallowSpan, effectiveDist);
    const deepT = smoothstep(0.88 + shallowSpan, 1.35, effectiveDist);
    const sandRipples = fbm(x * 0.015, z * 0.015, 2) * 0.25;
    const shallowHeight = 3.2 * (1 - shoreT) + (-2.2 + sandRipples) * shoreT;
    return shallowHeight - deepT * 18.0;
  }

  // 2. Daratan Utama (effectiveDist < 0.88) -> DIJAMIN > +3.2m (TIDAK ADA AIR DI DALAM PULAU)
  const inlandFactor = smoothstep(0.88, 0.70, effectiveDist);
  const rollingNoise = (fbm(x * 0.0025, z * 0.0025, 4) + 1.0) * 0.5;
  let height = 3.5 + rollingNoise * 13.0 * inlandFactor;

  // A. Zona Desa Pedesaan di Timur (X: +360, Z: 0, Radius 170m) -> Dataran rata +8.5m
  const distVillage = Math.sqrt(Math.pow(x - 360, 2) + Math.pow(z, 2));
  const villageMask = 1.0 - smoothstep(95, 185, distVillage);
  height = height * (1 - villageMask) + 8.5 * villageMask;

  // B. Zona Kastil & Kota Kerajaan di Selatan (X: 0, Z: +390, Radius 210m) -> Bukit rata +25m
  const distKingdom = Math.sqrt(Math.pow(x, 2) + Math.pow(z - 390, 2));
  const kingdomMask = 1.0 - smoothstep(125, 225, distKingdom);
  height = height * (1 - kingdomMask) + 25.0 * kingdomMask;

  // C. Zona Kuil Maple Merah di Barat Laut (X: -310, Z: -310, Radius 130m) -> Teras bukit +19m
  const distShrine = Math.sqrt(Math.pow(x + 310, 2) + Math.pow(z + 310, 2));
  const shrineMask = 1.0 - smoothstep(70, 145, distShrine);
  height = height * (1 - shrineMask) + 19.0 * shrineMask;

  // D. Pegunungan Salju di Utara (Z < -180)
  if (z < -180) {
    const northT = smoothstep(-180, -520, z);
    const ridge = Math.pow(Math.abs(fbm(x * 0.0045, z * 0.0045, 5)), 1.25) * 95.0;
    height += (20.0 + ridge) * northT * inlandFactor * (1 - shrineMask * 0.8);
  }

  // E. Pantai Barat Landai (X < -380)
  if (x < -380) {
    const westBeachT = smoothstep(-380, -610, x);
    height = height * (1 - westBeachT * 0.62);
  }

  return Math.max(3.2, height);
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
