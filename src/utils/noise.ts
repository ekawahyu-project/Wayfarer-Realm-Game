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

// Koordinat Teleport Lengkap (Termasuk 3 Desa & Pasar, Hutan Birch, dan Kerajaan Besar)
export const BIOME_CENTERS = {
  westBeach: { x: -535, z: 0, label: "Pantai Barat & Dermaga" },
  centralMeadow: { x: 0, z: 0, label: "Hutan Birch & Padang Rumput" },
  eastVillage: { x: 318, z: 0, label: "Desa Pasar Utama (Timur)" },
  swVillage: { x: -255, z: 240, label: "Desa Nelayan (Barat Daya)" },
  westForestVillage: { x: -245, z: -85, label: "Desa Lembah Hutan (Barat)" },
  southKingdom: { x: 0, z: 312, label: "Kota Kerajaan Besar (Selatan)" },
  southHarbor: { x: 0, z: 525, label: "Pelabuhan Selatan" },
  nwShrine: { x: -310, z: -252, label: "Kuil Maple (Barat Laut)" },
  northMountains: { x: 0, z: -365, label: "Pegunungan Salju (Utara)" },
};

export function getRoadFactor(x: number, z: number): number {
  const wobbleX = noise2D(x * 0.014, z * 0.014) * 5.5;
  const wobbleZ = noise2D(x * 0.014 + 100, z * 0.014 + 100) * 5.5;
  const wx = x + wobbleX;
  const wz = z + wobbleZ;

  const dWestEast = distToSegment(wx, wz, -545, 0, 425, 0);
  const dNorthSouth = distToSegment(wx, wz, 0, -440, 0, 540);
  const dShrine = distToSegment(wx, wz, -60, -60, -310, -265);
  const dSwVillage = distToSegment(wx, wz, 0, 120, -280, 240);
  const dWestVillage = distToSegment(wx, wz, -245, 0, -245, -110);
  const minRoadDist = Math.min(dWestEast, dNorthSouth, dShrine, dSwVillage, dWestVillage);

  const dVillage1 = Math.hypot(x - 365, z) - 58;
  const dVillage2 = Math.hypot(x + 280, z - 240) - 42;
  const dVillage3 = Math.hypot(x + 245, z + 95) - 40;
  const dKingdomPlaza = Math.hypot(x, z - 395) - 96;

  const d = Math.min(minRoadDist, Math.max(0, dVillage1), Math.max(0, dVillage2), Math.max(0, dVillage3), Math.max(0, dKingdomPlaza));
  return 1.0 - smoothstep(4.2, 8.2, d);
}

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 640;
  const dist = Math.hypot(x, z);
  const normDist = dist / islandRadius;

  const westDockMask = Math.exp(-Math.pow(z / 110, 2)) * (x < -380 ? 1 : 0);
  const southHarborMask = Math.exp(-Math.pow(x / 120, 2)) * (z > 380 ? 1 : 0);
  const coastNoise = fbm(x * 0.002, z * 0.002, 3) * 0.07 * (1 - Math.max(westDockMask, southHarborMask) * 0.92);
  const effectiveDist = normDist - coastNoise;

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

  // 1. Dataran Rata Desa Pasar Utama Timur (+8.5m)
  const v1Mask = 1.0 - smoothstep(125, 205, Math.hypot(x - 365, z));
  height = height * (1 - v1Mask) + 8.5 * v1Mask;

  // 2. Dataran Rata Desa Nelayan Barat Daya (+6.0m)
  const v2Mask = 1.0 - smoothstep(75, 135, Math.hypot(x + 280, z - 240));
  height = height * (1 - v2Mask) + 6.0 * v2Mask;

  // 3. Dataran Rata Desa Lembah Hutan Barat (+7.5m)
  const v3Mask = 1.0 - smoothstep(70, 130, Math.hypot(x + 245, z + 95));
  height = height * (1 - v3Mask) + 7.5 * v3Mask;

  // 4. Dataran Rata Kota Kerajaan Raksasa Selatan (+22.0m, tetapi melandai halus ke Pelabuhan Selatan di Z > 485)
  const distKingdom = Math.hypot(x, z - 390);
  const southHarborSlope = z > 475 ? smoothstep(475, 535, z) : 0;
  const kingdomMask = (1.0 - smoothstep(140, 225, distKingdom)) * (1.0 - southHarborSlope);
  height = height * (1 - kingdomMask) + 22.0 * kingdomMask;

  // 5. Teras Kuil Maple Barat Laut (+18.5m)
  const shrineMask = 1.0 - smoothstep(75, 145, Math.hypot(x + 310, z + 310));
  height = height * (1 - shrineMask) + 18.5 * shrineMask;

  // 6. Pegunungan Salju Utara
  if (z < -220 && x > -220) {
    const northT = smoothstep(-220, -490, z) * smoothstep(-220, -140, x);
    const valleyPassMask = Math.exp(-Math.pow(x / 52, 2));
    const ridge = Math.pow(Math.abs(fbm(x * 0.0045, z * 0.0045, 5)), 1.25) * 90.0 * (1 - valleyPassMask * 0.78);
    height += (16.0 + ridge) * northT * inlandFactor;
  }

  if (x < -360) {
    const westBeachT = smoothstep(-360, -545, x);
    height = height * (1 - westBeachT * 0.62);
  }
  if (z > 480 && Math.abs(x) < 120) {
    const southBeachT = smoothstep(480, 545, z);
    height = height * (1 - southBeachT * 0.62);
  }

  return Math.max(3.2, height);
}

// Interpolasi Segitiga Barycentric Eksak (Sama persis dengan jaring PlaneGeometry 1600m / 200 segmen = 8m grid)
// Mencegah karakter tenggelam/tembus pada lereng miring!
export function getExactMeshTerrainHeight(x: number, z: number): number {
  const step = 8.0; // 1600 / 200
  const gx = (x + 800) / step;
  const gz = (z + 800) / step;
  const ix = Math.floor(gx);
  const iz = Math.floor(gz);
  const fx = gx - ix;
  const fz = gz - iz;

  const x0 = ix * step - 800;
  const z0 = iz * step - 800;
  const h00 = getTerrainHeight(x0, z0);
  const h10 = getTerrainHeight(x0 + step, z0);
  const h01 = getTerrainHeight(x0, z0 + step);
  const h11 = getTerrainHeight(x0 + step, z0 + step);

  if (fx + fz <= 1.0) {
    return h00 + fx * (h10 - h00) + fz * (h01 - h00);
  } else {
    return h11 + (1.0 - fx) * (h01 - h11) + (1.0 - fz) * (h10 - h11);
  }
}

export function getTerrainSlope(x: number, z: number): number {
  const eps = 1.5;
  const hL = getTerrainHeight(x - eps, z);
  const hR = getTerrainHeight(x + eps, z);
  const hD = getTerrainHeight(x, z - eps);
  const hU = getTerrainHeight(x, z + eps);
  return Math.hypot((hR - hL) / (2 * eps), (hU - hD) / (2 * eps));
}

// Tinggi Pijakan Kaki Termasuk Dermaga Barat & Dermaga Pelabuhan Selatan (Anti-Tenggelam!)
export function getWalkableHeight(x: number, z: number): number {
  let h = getExactMeshTerrainHeight(x, z);
  // 1. Dermaga Kayu Pantai Barat (X: -538 s/d -588, Z: -2.8 s/d +2.8) -> Lantai Dermaga di Y = 2.4m
  if (x >= -588 && x <= -538 && Math.abs(z) <= 2.8) {
    return Math.max(h, 2.4);
  }
  // 2. Dermaga Pelabuhan Selatan (X: -6.2 s/d +6.2, Z: 535 s/d 592) -> Lantai Dermaga di Y = 2.4m
  if (Math.abs(x) <= 6.2 && z >= 535 && z <= 592) {
    return Math.max(h, 2.4);
  }
  return h;
}

export interface SolidBox { minX: number; maxX: number; minZ: number; maxZ: number; }
export interface SolidCircle { x: number; z: number; r: number; }

export const SOLID_BOXES: SolidBox[] = [];
export const SOLID_CIRCLES: SolidCircle[] = [];

export function clearWorldColliders() {
  SOLID_BOXES.length = 0;
  SOLID_CIRCLES.length = 0;
}

export function addBoxCollider(cx: number, cz: number, widthX: number, depthZ: number) {
  const hx = widthX * 0.5;
  const hz = depthZ * 0.5;
  SOLID_BOXES.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz });
}

export function addCircleCollider(x: number, z: number, r: number) {
  SOLID_CIRCLES.push({ x, z, r });
}

export function resolveObstacleCollisions(x: number, z: number, radius = 0.65): [number, number] {
  let nx = x;
  let nz = z;

  // 1. Resolve Circle Colliders
  for (let i = 0; i < SOLID_CIRCLES.length; i++) {
    const c = SOLID_CIRCLES[i];
    const dx = nx - c.x;
    const dz = nz - c.z;
    const dist = Math.hypot(dx, dz);
    const minDist = c.r + radius;
    if (dist < minDist && dist > 0.0001) {
      const push = (minDist - dist) / dist;
      nx += dx * push;
      nz += dz * push;
    }
  }

  // 2. Resolve AABB Box Colliders (Houses, Market Stalls, Ships, Castle Walls)
  for (let i = 0; i < SOLID_BOXES.length; i++) {
    const b = SOLID_BOXES[i];
    const exMinX = b.minX - radius;
    const exMaxX = b.maxX + radius;
    const exMinZ = b.minZ - radius;
    const exMaxZ = b.maxZ + radius;
    if (nx > exMinX && nx < exMaxX && nz > exMinZ && nz < exMaxZ) {
      const dLeft = nx - exMinX;
      const dRight = exMaxX - nx;
      const dTop = nz - exMinZ;
      const dBottom = exMaxZ - nz;
      const minPen = Math.min(dLeft, dRight, dTop, dBottom);
      if (minPen === dLeft) nx = exMinX;
      else if (minPen === dRight) nx = exMaxX;
      else if (minPen === dTop) nz = exMinZ;
      else nz = exMaxZ;
    }
  }

  return [nx, nz];
}
