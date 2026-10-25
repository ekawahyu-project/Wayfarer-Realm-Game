import * as OrigPhysics from "@/utils/noise";

const localBoxes: Array<{ x: number; z: number; w: number; d: number; tag: string }> = [];
const localCylinders: Array<{ x: number; z: number; r: number; tag: string }> = [];

export function addBoxCollider(x: number, z: number, w: number, d: number, tag = 'default'): void {
  const fn = (OrigPhysics as any).addBoxCollider;
  if (typeof fn === 'function') {
    fn(x, z, w, d, tag);
  } else {
    localBoxes.push({ x, z, w, d, tag });
  }
}

export function addCylinderCollider(x: number, z: number, r: number, tag = 'default'): void {
  const fn = (OrigPhysics as any).addCylinderCollider;
  if (typeof fn === 'function') {
    fn(x, z, r, tag);
  } else if (typeof (OrigPhysics as any).addBoxCollider === 'function') {
    (OrigPhysics as any).addBoxCollider(x, z, r * 2, r * 2, tag);
  } else {
    localCylinders.push({ x, z, r, tag });
  }
}

export function clearCollidersByTag(tag = 'default'): void {
  const fn = (OrigPhysics as any).clearCollidersByTag || (OrigPhysics as any).removeCollidersByTag || (OrigPhysics as any).clearColliders;
  if (typeof fn === 'function') {
    fn(tag);
  }
  for (let i = localBoxes.length - 1; i >= 0; i--) {
    if (localBoxes[i].tag === tag) localBoxes.splice(i, 1);
  }
  for (let i = localCylinders.length - 1; i >= 0; i--) {
    if (localCylinders[i].tag === tag) localCylinders.splice(i, 1);
  }
}
