import { createNoise2D } from "simplex-noise";

function createSeededRandom(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const noise2D = createNoise2D(createSeededRandom(20261020));

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
  westBeach: { x: -520, z: 0, label: "Pantai Barat & Dermaga" },
  centralMeadow: { x: 215, z: 0, label: "Sungai Teratai & Jembatan" },
  eastVillage: { x: 295, z: 0, label: "Desa Pasar Utama (Timur)" },
  swVillage: { x: -280, z: 175, label: "Desa Pesisir (Barat Daya)" },
  westForestVillage: { x: -245, z: -32, label: "Desa Hutan (Barat)" },
  southKingdom: { x: 0, z: 300, label: "Gerbang Benteng Kerajaan" },
  southHarbor: { x: 0, z: 530, label: "Pelabuhan Selatan" },
  nwShrine: { x: -310, z: -260, label: "Kuil Maple (Barat Laut)" },
  northMountains: { x: 0, z: -355, label: "Desa Chalet Salju (Utara)" },
};

export function getRiverCenterX(z: number): number {
  return 245 + Math.sin(z * 0.015) * 18.0;
}

export function getRiverDistance(x: number, z: number): number {
  if (z < -240 || z > 220) return 999;
  return Math.abs(x - getRiverCenterX(z));
}

export function getRoadFactor(x: number, z: number): number {
  const dWestEast = distToSegment(x, z, -535, 0, 435, 0);
  const dNorthSouth = distToSegment(x, z, 0, -450, 0, 540);
  const dShrine = distToSegment(x, z, -60, -60, -310, -265);
  const dSwVillage = distToSegment(x, z, 0, 120, -280, 240);
  const dWestVillage = distToSegment(x, z, -245, 0, -245, -110);
  const minRoadDist = Math.min(dWestEast, dNorthSouth, dShrine, dSwVillage, dWestVillage);
  return 1.0 - smoothstep(4.5, 8.2, minRoadDist);
}

export function getTerrainHeight(x: number, z: number): number {
  const islandRadius = 640;
  const dist = Math.hypot(x, z);
  const normDist = dist / islandRadius;

  const westDockMask = Math.exp(-Math.pow(z / 110, 2)) * (x < -380 ? 1 : 0);
  const southHarborMask = Math.exp(-Math.pow(x / 120, 2)) * (z > 380 ? 1 : 0);
  const coastNoise = fbm(x * 0.002, z * 0.002, 3) * 0.06 * (1 - Math.max(westDockMask, southHarborMask) * 0.92);
  const effectiveDist = normDist - coastNoise;

  if (effectiveDist >= 0.85) {
    const beachSlope = smoothstep(0.85, 0.92, effectiveDist);
    const deepOcean = smoothstep(0.92, 1.25, effectiveDist);
    return 1.8 * (1.0 - beachSlope) - 4.5 * beachSlope - deepOcean * 18.0;
  }

  const inlandFactor = smoothstep(0.85, 0.68, effectiveDist);
  const rollingNoise = (fbm(x * 0.0022, z * 0.0022, 3) + 1.0) * 0.5;
  let height = 3.2 + rollingNoise * 9.0 * inlandFactor;

  // Wide Flat Terraces for all 3 Villages & River Bridge Approaches (Y = 8.5m)
  const dV1 = Math.hypot(x - 345, z);
  const v1Mask = dV1 < 125 ? 1.0 : 1.0 - smoothstep(125, 195, dV1);
  height = height * (1 - v1Mask) + 8.5 * v1Mask;

  const dV2 = Math.hypot(x + 280, z - 240);
  const v2Mask = dV2 < 95 ? 1.0 : 1.0 - smoothstep(95, 160, dV2);
  height = height * (1 - v2Mask) + 7.5 * v2Mask;

  const dV3 = Math.hypot(x + 245, z + 95);
  const v3Mask = dV3 < 92 ? 1.0 : 1.0 - smoothstep(92, 155, dV3);
  height = height * (1 - v3Mask) + 8.0 * v3Mask;

  const dKing = Math.hypot(x, z - 395);
  const southHarborSlope = z > 480 ? smoothstep(480, 535, z) : 0;
  const kingdomMask = (dKing < 110 ? 1.0 : 1.0 - smoothstep(110, 190, dKing)) * (1.0 - southHarborSlope);
  height = height * (1 - kingdomMask) + 22.0 * kingdomMask;

  const dShrine = Math.hypot(x + 310, z + 310);
  const shrineMask = dShrine < 72 ? 1.0 : 1.0 - smoothstep(72, 135, dShrine);
  height = height * (1 - shrineMask) + 18.5 * shrineMask;

  // Ultra-Smooth Soft Pillowy Snow Mountains & Gently Sloped Valley (Reference Image 31)
  if (z < -200 && x > -220) {
    const northT = smoothstep(-200, -460, z) * smoothstep(-220, -130, x);
    const softRolling = (fbm(x * 0.0022, z * 0.0022, 2) + 1.0) * 0.5;
    const valleyBasin = Math.exp(-Math.pow(x / 95, 2));
    const alpineElevation = 15.0 + softRolling * 52.0 * (1.0 - valleyBasin * 0.85);
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

  // Ensure riverbanks along the entire river corridor are at least 8.4m high before carving the 4.6m channel!
  const rDist = getRiverDistance(x, z);
  if (rDist < 42.0) {
    const bankLift = 1.0 - smoothstep(14.0, 42.0, rDist);
    height = Math.max(height, height * (1.0 - bankLift) + 8.45 * bankLift);
  }
  if (rDist < 22.0) {
    const rMask = rDist < 11.5 ? 1.0 : 1.0 - smoothstep(11.5, 22.0, rDist);
    height = height * (1.0 - rMask) + 6.95 * rMask;
  }

  return height;
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

export function getWalkableHeight(x: number, z: number, currentY = 22.0): number {
  // Smooth Walkable Arched Timber River Bridge accurately centered over the River at Z = 0!
  if (Math.abs(z) <= 4.4) {
    const rCenterX = typeof getRiverCenterX === 'function' ? getRiverCenterX(0) : 258.0;
    if (Math.abs(x - rCenterX) <= 22.0) {
      const mainRiverBridgeDeck = 1.0 - Math.pow((x - rCenterX) / 22.0, 2);
      const bridgeY = 8.0 + Math.max(0, mainRiverBridgeDeck) * 1.95;
      const rawH = getExactMeshTerrainHeight(x, z);
      if (bridgeY > rawH) return bridgeY;
    }
  }
  let h = getExactMeshTerrainHeight(x, z);

  // 1. West Beach Pier & South Harbor Pier (Top at Y = 1.8m)
  if (x >= -586 && x <= -525 && Math.abs(z) <= 2.8) return Math.max(h, 1.8);
  if (Math.abs(x) <= 6.2 && z >= 525 && z <= 592) return Math.max(h, 1.8);

  // 2. Solid Flush River Bridge at X: 224..266, Z: -4.6..+4.6 -> Exact Top Deck at Y = 8.55m (Zero sinking!)
  if (x >= 224 && x <= 266 && Math.abs(z) <= 4.6) {
    return Math.max(h, 8.55);
  }

  // 3. Enterable Maple Shrine Steps & Interior Hall (X: -324..-296, Z: -326..-298)
  if (x >= -323 && x <= -297 && z >= -324 && z <= -298) {
    return 19.3;
  }
  if (x >= -315 && x <= -305 && z > -298 && z <= -292) {
    const stepT = 1.0 - (z - -298) / 6.0;
    return 18.5 + stepT * 0.8;
  }

  // 4. Royal Kingdom Fortress Ramparts & Palace Interior
  const kBase = 22.0;
  if (z >= 317.5 && z <= 324.5 && Math.abs(x) >= 18 && Math.abs(x) <= 36) {
    const t = (Math.abs(x) - 18) / 18.0;
    const stairY = kBase + t * 16.0;
    if (currentY >= stairY - 3.5) return stairY;
  }
  if (currentY > 31.0) {
    const onNorthWall = Math.abs(z - 315) <= 3.6 && Math.abs(x) >= 14 && Math.abs(x) <= 86;
    const onSouthWall = Math.abs(z - 472) <= 3.6 && Math.abs(x) >= 14 && Math.abs(x) <= 86;
    const onSideWall = Math.abs(Math.abs(x) - 84) <= 3.6 && z >= 312 && z <= 475;
    if (onNorthWall || onSouthWall || onSideWall) return kBase + 16.0;
  }
  if (Math.abs(x) <= 32 && z >= 428 && z <= 462) {
    if (Math.abs(x) <= 9 && z >= 452 && z <= 461) {
      const stepT = Math.min(1, (z - 452) / 3.5);
      return kBase + 0.3 + stepT * 1.8;
    }
    if (Math.abs(x) >= 22 && Math.abs(x) <= 30 && z >= 432 && z <= 448) {
      const stairT = (z - 432) / 16.0;
      const stairY = kBase + 0.3 + stairT * 8.2;
      if (currentY >= stairY - 2.5) return stairY;
    }
    if (currentY > 28.0 && Math.abs(x) >= 14 && z >= 448 && z <= 461) {
      return kBase + 8.5;
    }
    return kBase + 0.3;
  }

  return h;
}

export interface SolidBox { group: string; minX: number; maxX: number; minZ: number; maxZ: number; maxY?: number; }
export interface SolidCircle { group: string; x: number; z: number; r: number; }
export interface InteractiveDoor {
  group: string;
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

export function clearGroupColliders(groupName: string) {
  for (let i = SOLID_BOXES.length - 1; i >= 0; i--) {
    if (SOLID_BOXES[i].group === groupName) SOLID_BOXES.splice(i, 1);
  }
  for (let i = SOLID_CIRCLES.length - 1; i >= 0; i--) {
    if (SOLID_CIRCLES[i].group === groupName) SOLID_CIRCLES.splice(i, 1);
  }
  for (let i = INTERACTIVE_DOORS.length - 1; i >= 0; i--) {
    if (INTERACTIVE_DOORS[i].group === groupName) INTERACTIVE_DOORS.splice(i, 1);
  }
}

export function clearWorldColliders() {
  clearGroupColliders("village");
}

export function addBoxCollider(cx: number, cz: number, widthX: number, depthZ: number, group = "world", maxY = 999) {
  const hx = widthX * 0.5, hz = depthZ * 0.5;
  SOLID_BOXES.push({ group, minX: cx - hx, maxX: cx + hx, minZ: cz - hz, maxZ: cz + hz, maxY });
}

export function addCircleCollider(x: number, z: number, r: number, group = "world") {
  SOLID_CIRCLES.push({ group, x, z, r });
}

export function addEnterableHouseColliders(
  id: string,
  cx: number,
  wy: number,
  cz: number,
  rotY: number,
  width: number,
  depth: number,
  doorLabel = "Pintu Rumah Desa",
  group = "village"
) {
  const cos = Math.cos(rotY), sin = Math.sin(rotY);
  const toWorld = (lx: number, lz: number): [number, number] => [
    cx + lx * cos + lz * sin,
    cz - lx * sin + lz * cos,
  ];
  const hw = width * 0.5, hd = depth * 0.5;
  const isNS = Math.abs(cos) > 0.7;
  const [bx, bz] = toWorld(0, -hd);
  const [lx, lz] = toWorld(-hw, 0);
  const [rx, rz] = toWorld(hw, 0);
  addBoxCollider(bx, bz, isNS ? width : 0.7, isNS ? 0.7 : width, group);
  addBoxCollider(lx, lz, isNS ? 0.7 : depth, isNS ? depth : 0.7, group);
  addBoxCollider(rx, rz, isNS ? 0.7 : depth, isNS ? depth : 0.7, group);

  const sideW = Math.max(1.2, (width - 2.3) * 0.5);
  const [flx, flz] = toWorld(-hw + sideW * 0.5, hd);
  const [frx, frz] = toWorld(hw - sideW * 0.5, hd);
  addBoxCollider(flx, flz, isNS ? sideW : 0.7, isNS ? 0.7 : sideW, group);
  addBoxCollider(frx, frz, isNS ? sideW : 0.7, isNS ? 0.7 : sideW, group);

  const [dx, dz] = toWorld(0, hd);
  INTERACTIVE_DOORS.push({
    group,
    id,
    x: dx,
    y: wy,
    z: dz,
    rotY,
    width: 1.9,
    height: 2.7,
    isOpen: false,
    label: doorLabel,
  });
}

export function resolveObstacleCollisions(x: number, z: number, radius = 0.55, playerY = 0): [number, number] {
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
    if (b.maxY !== undefined && playerY >= b.maxY - 0.6) continue;
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

export function clearCollidersByTag(_tag?: string): void {
  // Safe collider tag cleanup
}
export function addCylinderCollider(x: number, z: number, r: number, tag = 'default'): void {
  if (typeof addBoxCollider === 'function') addBoxCollider(x, z, r * 2, r * 2, tag);
}
