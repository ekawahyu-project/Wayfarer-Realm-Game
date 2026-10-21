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

function distToSegment(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const l2 = (bx - ax) * (bx - ax) + (bz - az) * (bz - az);
  if (l2 === 0) return Math.hypot(px - ax, pz - az);
  let t = ((px - ax) * (bx - ax) + (pz - az) * (bz - az)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * (bx - ax)), pz - (az + t * (bz - az)));
}

export const BIOME_CENTERS = {
  westBeach: { x: -535, z: 0, label: "Pantai Barat & Dermaga" },
  centralMeadow: { x: 0, z: 0, label: "Persimpangan Padang Rumput" },
  eastVillage: { x: 310, z: 0, label: "Desa Medieval (Timur)" },
  southKingdom: { x: 0, z: 325, label: "Kota Kerajaan (Selatan)" },
  southHarbor: { x: 0, z: 545, label: "Pelabuhan Selatan" },
  nwShrine: { x: -310, z: -252, label: "Kuil Maple (Barat Laut)" },
  northMountains: { x: 0, z: -365, label: "Pegunungan Salju (Utara)" },
};

export function getRoadFactor(x: number, z: number): number {
  const wobbleX = noise2D(x * 0.014, z * 0.014) * 6.5;
  const wobbleZ = noise2D(x * 0.014 + 100, z * 0.014 + 100) * 6.5;
  const wx = x + wobbleX;
  const wz = z + wobbleZ;

  const dWestEast = distToSegment(wx, wz, -545, 0, 410, 0);
  const dNorthSouth = distToSegment(wx, wz, 0, -440, 0, 560);
  const dShrine = distToSegment(wx, wz, -60, -60, -310, -265);
  const minRoadDist = Math.min(dWestEast, dNorthSouth, dShrine);

  const dVillagePlaza = Math.hypot(x - 360, z) - 46;
  const dKingdomPlaza = Math.hypot(x, z - 390) - 82;

  const d = Math.min(minRoadDist, Math.max(0, dVillagePlaza), Math.max(0, dKingdomPlaza));
  return 1.0 - smoothstep(4.2, 8.0, d);
}

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 640; // Shoreline sits cleanly around ~555m so piers & boats are in deep water!
  const dist = Math.hypot(x, z);
  const normDist = dist / islandRadius;

  const westDockMask = Math.exp(-Math.pow(z / 110, 2)) * (x < -380 ? 1 : 0);
  const southHarborMask = Math.exp(-Math.pow(x / 100, 2)) * (z > 380 ? 1 : 0);
  const coastNoise = fbm(x * 0.002, z * 0.002, 3) * 0.07 * (1 - Math.max(westDockMask, southHarborMask) * 0.9);
  const effectiveDist = normDist - coastNoise;

  // Laut & Pantai Dangkal (effectiveDist >= 0.85 -> shoreline at ~555m)
  if (effectiveDist >= 0.85) {
    const shallowSpan = 0.14;
    const shoreT = smoothstep(0.85, 0.85 + shallowSpan, effectiveDist);
    const deepT = smoothstep(0.85 + shallowSpan, 1.30, effectiveDist);
    const shallowHeight = 3.2 * (1 - shoreT) - 2.6 * shoreT;
    return shallowHeight - deepT * 16.0;
  }

  const inlandFactor = smoothstep(0.85, 0.68, effectiveDist);
  const rollingNoise = (fbm(x * 0.0025, z * 0.0025, 4) + 1.0) * 0.5;
  let height = 3.5 + rollingNoise * 10.5 * inlandFactor;

  // Dataran Rata Desa Medieval Timur (+8.5m)
  const distVillage = Math.hypot(x - 360, z);
  const villageMask = 1.0 - smoothstep(115, 200, distVillage);
  height = height * (1 - villageMask) + 8.5 * villageMask;

  // Dataran Rata Kota Kerajaan Selatan (+24m)
  const distKingdom = Math.hypot(x, z - 390);
  const kingdomMask = 1.0 - smoothstep(135, 230, distKingdom);
  height = height * (1 - kingdomMask) + 24.0 * kingdomMask;

  // Teras Kuil Maple Barat Laut (+18.5m)
  const distShrine = Math.hypot(x + 310, z + 310);
  const shrineMask = 1.0 - smoothstep(75, 145, distShrine);
  height = height * (1 - shrineMask) + 18.5 * shrineMask;

  // Pegunungan Salju Utara (Hanya di Z < -260 & X > -210 agar Kuil Maple bebas salju!)
  if (z < -220 && x > -220) {
    const northT = smoothstep(-220, -490, z) * smoothstep(-220, -140, x);
    const valleyPassMask = Math.exp(-Math.pow(x / 52, 2));
    const ridge = Math.pow(Math.abs(fbm(x * 0.0045, z * 0.0045, 5)), 1.25) * 90.0 * (1 - valleyPassMask * 0.78);
    height += (16.0 + ridge) * northT * inlandFactor;
  }

  if (x < -360) {
    const westBeachT = smoothstep(-360, -550, x);
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
  return Math.hypot((hR - hL) / (2 * eps), (hU - hD) / (2 * eps));
}

export function getWalkableHeight(x: number, z: number): number {
  let h = getTerrainHeight(x, z);
  // Dermaga Kayu Pantai Barat (X: -545 s/d -588, Z: -2.6 s/d +2.6)
  if (x >= -588 && x <= -542 && Math.abs(z) <= 2.7) {
    h = Math.max(h, 1.5);
  }
  // Dermaga Pelabuhan Selatan (X: -6 s/d +6, Z: 545 s/d 595)
  if (Math.abs(x) <= 6.0 && z >= 542 && z <= 595) {
    h = Math.max(h, 1.6);
  }
  return h;
}

export interface SolidObstacle { x: number; z: number; r: number; }
export const SOLID_OBSTACLES: SolidObstacle[] = [
  // Sumur & Rumah-Rumah Desa Medieval
  { x: 360, z: 0, r: 2.3 },
  { x: 336, z: -18, r: 5.5 }, { x: 362, z: -20, r: 5.5 }, { x: 388, z: -18, r: 5.5 },
  { x: 336, z: 18, r: 5.5 },  { x: 362, z: 20, r: 5.5 },  { x: 388, z: 18, r: 5.5 },
  { x: 320, z: -36, r: 5.5 }, { x: 355, z: -42, r: 6.0 }, { x: 392, z: -38, r: 5.5 },
  { x: 320, z: 36, r: 5.5 },  { x: 355, z: 42, r: 6.0 },  { x: 392, z: 38, r: 5.5 },
  { x: 416, z: 0, r: 6.2 },
  // Pohon Raksasa Desa
  { x: 324, z: -8, r: 2.2 },  { x: 376, z: 9, r: 2.2 },   { x: 346, z: -28, r: 2.2 },
  // Pagoda Kuil Maple
  { x: -310, z: -315, r: 12.0 },
  // Bangunan, Menara Jam, Patung & Peti Kota Kerajaan
  { x: -27, z: 366, r: 5.0 }, { x: -9, z: 366, r: 5.0 },
  { x: 20, z: 382, r: 6.2 },  { x: 38, z: 374, r: 7.5 },
  { x: 0, z: 432, r: 18.0 },  { x: -25, z: 428, r: 6.0 }, { x: 25, z: 428, r: 6.0 },
  { x: -36, z: 396, r: 9.0 }, { x: 36, z: 396, r: 9.0 },
  { x: -11, z: 392, r: 2.8 }, { x: 11, z: 392, r: 2.8 },
  { x: -21, z: 395, r: 2.4 },
  // Mercusuar & Kapal Galleon Pelabuhan Selatan (Anti-Tembus!)
  { x: 26, z: 562, r: 4.2 },
  { x: -14, z: 588, r: 8.5 },
];

export function resolveObstacleCollisions(x: number, z: number, playerRadius = 0.6): [number, number] {
  let nx = x;
  let nz = z;
  for (let i = 0; i < SOLID_OBSTACLES.length; i++) {
    const ob = SOLID_OBSTACLES[i];
    const dx = nx - ob.x;
    const dz = nz - ob.z;
    const dist = Math.hypot(dx, dz);
    const minDist = ob.r + playerRadius;
    if (dist < minDist && dist > 0.0001) {
      const push = (minDist - dist) / dist;
      nx += dx * push;
      nz += dz * push;
    }
  }
  return [nx, nz];
}
