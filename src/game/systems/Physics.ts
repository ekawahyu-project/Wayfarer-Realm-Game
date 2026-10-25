export interface BoxCollider {
  x: number;
  z: number;
  w: number;
  d: number;
  rot: number;
  tag: string;
}

export interface CylinderCollider {
  x: number;
  z: number;
  r: number;
  tag: string;
}

export const globalBoxColliders: BoxCollider[] = [];
export const globalCylinderColliders: CylinderCollider[] = [];

export function addBoxCollider(x: number, z: number, w: number, d: number, tag = 'default', rot = 0): void {
  globalBoxColliders.push({ x, z, w, d, rot, tag });
}

export function addCylinderCollider(x: number, z: number, r: number, tag = 'default'): void {
  globalCylinderColliders.push({ x, z, r, tag });
}

export function clearCollidersByTag(tag = 'default'): void {
  for (let i = globalBoxColliders.length - 1; i >= 0; i--) {
    if (globalBoxColliders[i].tag === tag) globalBoxColliders.splice(i, 1);
  }
  for (let i = globalCylinderColliders.length - 1; i >= 0; i--) {
    if (globalCylinderColliders[i].tag === tag) globalCylinderColliders.splice(i, 1);
  }
}

// Solid OBB (Oriented Bounding Box) & Cylinder Collision Resolver — Zero Wall/Stall Clipping!
export function resolveWorldCollisions(x: number, z: number, radius = 0.52): [number, number] {
  let nx = x;
  let nz = z;

  // 1. Cylinder Colliders (Wells, Pillars, Towers, Trees, Rocks)
  for (let i = 0; i < globalCylinderColliders.length; i++) {
    const c = globalCylinderColliders[i];
    const dx = nx - c.x;
    const dz = nz - c.z;
    const minDist = c.r + radius;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist && distSq > 0.00001) {
      const dist = Math.sqrt(distSq);
      nx = c.x + (dx / dist) * minDist;
      nz = c.z + (dz / dist) * minDist;
    }
  }

  // 2. Oriented Box Colliders (Houses, Market Stalls, Kingdom Walls, Harbor, Shrine)
  for (let i = 0; i < globalBoxColliders.length; i++) {
    const b = globalBoxColliders[i];
    const dx = nx - b.x;
    const dz = nz - b.z;
    const cosR = Math.cos(-b.rot);
    const sinR = Math.sin(-b.rot);
    const localX = dx * cosR - dz * sinR;
    const localZ = dx * sinR + dz * cosR;
    const halfW = b.w * 0.5 + radius;
    const halfD = b.d * 0.5 + radius;

    if (Math.abs(localX) < halfW && Math.abs(localZ) < halfD) {
      const overlapX = halfW - Math.abs(localX);
      const overlapZ = halfD - Math.abs(localZ);
      let pushLocalX = 0;
      let pushLocalZ = 0;
      if (overlapX < overlapZ) {
        pushLocalX = localX >= 0 ? overlapX : -overlapX;
      } else {
        pushLocalZ = localZ >= 0 ? overlapZ : -overlapZ;
      }
      const cosInv = Math.cos(b.rot);
      const sinInv = Math.sin(b.rot);
      nx += pushLocalX * cosInv - pushLocalZ * sinInv;
      nz += pushLocalX * sinInv + pushLocalZ * cosInv;
    }
  }

  return [nx, nz];
}
