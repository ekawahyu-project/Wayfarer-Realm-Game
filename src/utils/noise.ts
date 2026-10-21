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
  let total = 0, frequency = 1, amplitude = 1, maxValue = 0;
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
  westBeach: { x: -532, z: 0, label: "Pantai Barat & Dermaga" },
  centralMeadow: { x: 0, z: 0, label: "Hutan Birch & Padang Rumput" },
  eastVillage: { x: 305, z: 0, label: "Desa Pasar Utama (Timur)" },
  swVillage: { x: -280, z: 185, label: "Desa Pasar Barat Daya" },
  westForestVillage: { x: -245, z: -42, label: "Desa Pasar Hutan Barat" },
  southKingdom: { x: 0, z: 305, label: "Gerbang Benteng Kerajaan" },
  southHarbor: { x: 0, z: 530, label: "Pelabuhan Selatan" },
  nwShrine: { x: -310, z: -252, label: "Kuil Maple (Barat Laut)" },
  northMountains: { x: 0, z: -365, label: "Desa Lembah Salju (Utara)" },
};

export function getRoadFactor(x: number, z: number): number {
  const wobbleX = noise2D(x * 0.014, z * 0.014) * 5.0;
  const wobbleZ = noise2D(x * 0.014 + 100, z * 0.014 + 100) * 5.0;
  const wx = x + wobbleX, wz = z + wobbleZ;

  const dWestEast = distToSegment(wx, wz, -535, 0, 435, 0);
  const dNorthSouth = distToSegment(wx, wz, 0, -450, 0, 540);
  const dShrine = distToSegment(wx, wz, -60, -60, -310, -265);
  const dSwVillage = distToSegment(wx, wz, 0, 120, -280, 240);
  const dWestVillage = distToSegment(wx, wz, -245, 0, -245, -110);
  const minRoadDist = Math.min(dWestEast, dNorthSouth, dShrine, dSwVillage, dWestVillage);

  const dVillage1 = Math.hypot(x - 365, z) - 76;
  const dVillage2 = Math.hypot(x + 280, z - 240) - 76;
  const dVillage3 = Math.hypot(x + 245, z + 95) - 74;
  const dKingdomPlaza = Math.hypot(x, z - 395) - 105;

  const d = Math.min(minRoadDist, Math.max(0, dVillage1), Math.max(0, dVillage2), Math.max(0, dVillage3), Math.max(0, dKingdomPlaza));
  return 1.0 - smoothstep(4.2, 8.2, d);
}

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 640;
  const dist = Math.hypot(x, z);
  const normDist = dist / islandRadius;

  const westDockMask = Math.exp(-Math.pow(z / 110, 2)) * (x < -380 ? 1 : 0);
  const southHarborMask = Math.exp(-Math.pow(x / 120, 2)) * (z > 380 ? 1 : 0);
  const coastNoise = fbm(x * 0.002, z * 0.002, 3) * 0.06 * (1 - Math.max(westDockMask, southHarborMask) * 0.92);
  const effectiveDist = normDist - coastNoise;

  // Deep Ocean immediately beyond shoreline (effectiveDist >= 0.84 -> drops smoothly to -6m .. -24m so water is real water, not sand!)
  if (effectiveDist >= 0.84) {
    const beachSlope = smoothstep(0.84, 0.89, effectiveDist);
    const deepOcean = smoothstep(0.89, 1.25, effectiveDist);
    return 3.0 * (1.0 - beachSlope) - 5.5 * beachSlope - deepOcean * 18.0;
  }

  const inlandFactor = smoothstep(0.84, 0.68, effectiveDist);
  const rollingNoise = (fbm(x * 0.0022, z * 0.0022, 4) + 1.0) * 0.5;
  let height = 3.5 + rollingNoise * 10.0 * inlandFactor;

  // 1. Wide Flat Terraces for ALL 3 Expanded Villages
  const v1Mask = 1.0 - smoothstep(105, 195, Math.hypot(x - 365, z));
  height = height * (1 - v1Mask) + 8.5 * v1Mask;

  const v2Mask = 1.0 - smoothstep(105, 190, Math.hypot(x + 280, z - 240));
  height = height * (1 - v2Mask) + 7.5 * v2Mask;

  const v3Mask = 1.0 - smoothstep(100, 185, Math.hypot(x + 245, z + 95));
  height = height * (1 - v3Mask) + 8.0 * v3Mask;

  // 2. Flat Terrace for Expanded Walled Royal Kingdom (+22.0m)
  const distKingdom = Math.hypot(x, z - 395);
  const southHarborSlope = z > 480 ? smoothstep(480, 535, z) : 0;
  const kingdomMask = (1.0 - smoothstep(135, 220, distKingdom)) * (1.0 - southHarborSlope);
  height = height * (1 - kingdomMask) + 22.0 * kingdomMask;

  // 3. Flat Terrace for NW Maple Shrine (+18.5m)
  const shrineMask = 1.0 - smoothstep(75, 145, Math.hypot(x + 310, z + 310));
  height = height * (1 - shrineMask) + 18.5 * shrineMask;

  // 4. Smooth Alpine Snow Mountains & Level Snow-Village Basin (No jagged spikes or floating cabins!)
  if (z < -210 && x > -220) {
    const northT = smoothstep(-210, -480, z) * smoothstep(-220, -130, x);
    const smoothWave = (fbm(x * 0.0032, z * 0.0032, 3) + 1.0) * 0.5;
    const valleyPassMask = Math.exp(-Math.pow(x / 68, 2)); // Wide smooth valley for snow cabins
    const alpineElevation = 18.0 + smoothWave * 68.0 * (1.0 - valleyPassMask * 0.72);
    height += alpineElevation * northT * inlandFactor;
  }

  if (x < -360) {
    const westBeachT = smoothstep(-360, -535, x);
    height = height * (1 - westBeachT * 0.62);
  }
  if (z > 480 && Math.abs(x) < 120) {
    const southBeachT = smoothstep(480, 535, z);
    height = height * (1 - southBeachT * 0.62);
  }

  return Math.max(3.0, height);
}

export function getExactMeshTerrainHeight(x: number, z: number): number {
  const step = 8.0;
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

// Walkable surface height including Piers, Fortress Rampart Stairs/Walls, and Royal Palace Interior Stairs/Balcony!
export function getWalkableHeight(x: number, z: number): number {
  let h = getExactMeshTerrainHeight(x, z);

  // 1. West Beach Pier (X: -528 to -586, Z: -2.8 to +2.8)
  if (x >= -586 && x <= -528 && Math.abs(z) <= 2.8) {
    return Math.max(h, 2.4);
  }
  // 2. South Harbor Pier (X: -6.2 to +6.2, Z: 525 to 592)
  if (Math.abs(x) <= 6.2 && z >= 525 && z <= 592) {
    return Math.max(h, 2.4);
  }

  // 3. Royal Kingdom Fortress Ramparts & Stairs (Base Y = 22.0m)
  const kBase = 22.0;
  // Rampart Access Stairs inside North Wall (X: -24 to -38 or +24 to +38, Z: 317 to 322)
  if (z >= 316 && z <= 322) {
    if (x >= -38 && x <= -22) {
      const t = (Math.abs(x) - 22) / 16;
      return kBase + t * 16.0;
    }
    if (x >= 22 && x <= 38) {
      const t = (x - 22) / 16;
      return kBase + t * 16.0;
    }
  }
  // Top of North & South Fortress Walls (Walkable Battlements at Y = kBase + 16m = 38.0m)
  if ((Math.abs(z - 315) <= 3.2 && Math.abs(x) >= 36 && Math.abs(x) <= 86) ||
      (Math.abs(z - 472) <= 3.2 && Math.abs(x) >= 18 && Math.abs(x) <= 86) ||
      (Math.abs(Math.abs(x) - 84) <= 3.2 && z >= 312 && z <= 475)) {
    return kBase + 16.0;
  }

  // 4. Inside Royal Palace Great Hall (X: -32 to +32, Z: 428 to 462)
  if (Math.abs(x) <= 32 && z >= 428 && z <= 462) {
    // Royal Throne Dais at Back of Hall (Z: 452 to 461, X: -9 to +9)
    if (Math.abs(x) <= 9 && z >= 452 && z <= 461) {
      const stepT = Math.min(1, (z - 452) / 3.5);
      return kBase + 0.3 + stepT * 1.8;
    }
    // Grand Interior Side Staircases to 2nd Floor Royal Mezzanine Balcony (X: -29 to -22 or +22 to +29, Z: 432 to 448)
    if (Math.abs(x) >= 22 && Math.abs(x) <= 30 && z >= 432 && z <= 448) {
      const stairT = (z - 432) / 16.0;
      return kBase + 0.3 + stairT * 8.2;
    }
    // 2nd Floor Royal Mezzanine Balcony at Back & Sides (Z: 448 to 461, |X| >= 14)
    if (Math.abs(x) >= 14 && z >= 448 && z <= 461) {
      return kBase + 8.5;
    }
    return kBase + 0.3;
  }

  return h;
}

// --- COLLISION & INTERACTIVE DOOR SYSTEM ---
export interface SolidBox { minX: number; maxX: number; minZ: number; maxZ: number; }
export interface SolidCircle { x: number; z: number; r: number; }
export interface InteractiveDoor {
  id: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  width: number;
  height: number;
  isOpen: boolean;
  label: string;
}

export const SOLID_BOXES: SolidBox[] = [];
export const SOLID_CIRCLES: SolidCircle[] = [];
export const INTERACTIVE_DOORS: InteractiveDoor[] = [];

export function clearWorldColliders() {
  SOLID_BOXES.length = 0;
  SOLID_CIRCLES.length = 0;
  INTERACTIVE_DOORS.length = 0;
}

export function addBoxCollider(cx: number, cz: number, widthX: number, depthZ: number) {
  const hx = widthX * 0.5, hz = depthZ * 0.5;
  SOLID_BOXES.push({ minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz });
}

// Adds a hollow enterable building with solid Back, Left, Right walls & a Front Wall with a Doorway Gap!
export function addEnterableHouseColliders(
  id: string,
  cx: number,
  wy: number,
  cz: number,
  rotY: number,
  width: number,
  depth: number,
  doorLabel = "Pintu Rumah"
) {
  const cos = Math.cos(rotY), sin = Math.sin(rotY);
  const toWorld = (lx: number, lz: number): [number, number] => [
    cx + lx * cos + lz * sin,
    cz - lx * sin + lz * cos,
  ];
  const hw = width * 0.5, hd = depth * 0.5;
  // Back wall, Left wall, Right wall
  const [bx, bz] = toWorld(0, -hd);
  const [lx, lz] = toWorld(-hw, 0);
  const [rx, rz] = toWorld(hw, 0);
  const isNS = Math.abs(cos) > 0.7;
  addBoxCollider(bx, bz, isNS ? width : 0.8, isNS ? 0.8 : width);
  addBoxCollider(lx, lz, isNS ? 0.8 : depth, isNS ? depth : 0.8);
  addBoxCollider(rx, rz, isNS ? 0.8 : depth, isNS ? depth : 0.8);
  // Front wall left & right of doorway
  const sideW = (width - 2.2) * 0.5;
  const [flx, flz] = toWorld(-hw + sideW * 0.5, hd);
  const [frx, frz] = toWorld(hw - sideW * 0.5, hd);
  addBoxCollider(flx, flz, isNS ? sideW : 0.8, isNS ? 0.8 : sideW);
  addBoxCollider(frx, frz, isNS ? sideW : 0.8, isNS ? 0.8 : sideW);

  // Register Interactive Door at Front Center
  const [dx, dz] = toWorld(0, hd);
  INTERACTIVE_DOORS.push({
    id,
    x: dx,
    y: wy,
    z: dz,
    rotY,
    width: 1.85,
    height: 2.7,
    isOpen: false,
    label: doorLabel,
  });
}

export function addCircleCollider(x: number, z: number, r: number) {
  SOLID_CIRCLES.push({ x, z, r });
}

export function resolveObstacleCollisions(x: number, z: number, radius = 0.55): [number, number] {
  let nx = x, nz = z;

  for (let i = 0; i < SOLID_CIRCLES.length; i++) {
    const c = SOLID_CIRCLES[i];
    const dx = nx - c.x, dz = nz - c.z;
    const dist = Math.hypot(dx, dz);
    const minDist = c.r + radius;
    if (dist < minDist && dist > 0.0001) {
      const push = (minDist - dist) / dist;
      nx += dx * push; nz += dz * push;
    }
  }

  // Closed Doors act as solid colliders; Open Doors let player & NPCs walk right through!
  for (let i = 0; i < INTERACTIVE_DOORS.length; i++) {
    const d = INTERACTIVE_DOORS[i];
    if (d.isOpen) continue;
    const dx = nx - d.x, dz = nz - d.z;
    const dist = Math.hypot(dx, dz);
    const minDist = d.width * 0.5 + radius;
    if (dist < minDist && dist > 0.0001) {
      const push = (minDist - dist) / dist;
      nx += dx * push; nz += dz * push;
    }
  }

  for (let i = 0; i < SOLID_BOXES.length; i++) {
    const b = SOLID_BOXES[i];
    const exMinX = b.minX - radius, exMaxX = b.maxX + radius;
    const exMinZ = b.minZ - radius, exMaxZ = b.maxZ + radius;
    if (nx > exMinX && nx < exMaxX && nz > exMinZ && nz < exMaxZ) {
      const dLeft = nx - exMinX, dRight = exMaxX - nx;
      const dTop = nz - exMinZ, dBottom = exMaxZ - nz;
      const minPen = Math.min(dLeft, dRight, dTop, dBottom);
      if (minPen === dLeft) nx = exMinX;
      else if (minPen === dRight) nx = exMaxX;
      else if (minPen === dTop) nz = exMinZ;
      else nz = exMaxZ;
    }
  }

  return [nx, nz];
}
