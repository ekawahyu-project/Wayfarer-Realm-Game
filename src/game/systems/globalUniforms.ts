import * as THREE from "three";

export const globalUniforms = {
  uTime: { value: 0 },
  uNightFactor: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
  uMoonDir: { value: new THREE.Vector3(-0.5, -0.8, -0.3) },
  uSunColor: { value: new THREE.Color("#fff4e0") },
  uSkyTop: { value: new THREE.Color("#2563eb") },
  uSkyHorizon: { value: new THREE.Color("#93c5fd") },
  uWindStrength: { value: 0.7 },
  uBloodMoon: { value: 0 },
  uAuroraStrength: { value: 1.0 },
  uPlayerPos: { value: new THREE.Vector3(-575, 5, 0) },
};
