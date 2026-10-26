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

// Multi-Pass Swept OBB & Cylinder Collision Solver (3 iterations prevent corner & high-speed horse clipping!)
export function resolveWorldCollisions(x: number, z: number, radius = 0.58, prevX?: number, prevZ?: number): [number, number] {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return [228, 0];
  let nx = x;
  let nz = z;

  // Clamp sub-step if moving fast on horseback to prevent tunneling through thin walls
  if (typeof prevX === 'number' && typeof prevZ === 'number' && Number.isFinite(prevX) && Number.isFinite(prevZ)) {
    const stepDist = Math.hypot(nx - prevX, nz - prevZ);
    if (stepDist > 0.65 && stepDist < 15.0) {
      const midX = (prevX + nx) * 0.5;
      const midZ = (prevZ + nz) * 0.5;
      const [resolvedMidX, resolvedMidZ] = resolveSinglePass(midX, midZ, radius);
      nx = resolvedMidX + (nx - midX);
      nz = resolvedMidZ + (nz - midZ);
    }
  }

  for (let pass = 0; pass < 3; pass++) {
    const res = resolveSinglePass(nx, nz, radius);
    nx = res[0];
    nz = res[1];
  }

  return [nx, nz];
}

function resolveSinglePass(x: number, z: number, radius: number): [number, number] {
  let nx = x;
  let nz = z;

  for (let i = 0; i < globalCylinderColliders.length; i++) {
    const c = globalCylinderColliders[i];
    const dx = nx - c.x;
    const dz = nz - c.z;
    if (Math.abs(dx) > c.r + radius + 2 || Math.abs(dz) > c.r + radius + 2) continue;
    const minDist = c.r + radius;
    const distSq = dx * dx + dz * dz;
    if (distSq < minDist * minDist && distSq > 0.000001) {
      const dist = Math.sqrt(distSq);
      nx = c.x + (dx / dist) * minDist;
      nz = c.z + (dz / dist) * minDist;
    }
  }

  for (let i = 0; i < globalBoxColliders.length; i++) {
    const b = globalBoxColliders[i];
    const dx = nx - b.x;
    const dz = nz - b.z;
    const maxBound = Math.max(b.w, b.d) + radius + 2;
    if (Math.abs(dx) > maxBound || Math.abs(dz) > maxBound) continue;

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
