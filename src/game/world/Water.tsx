"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { globalUniforms } from "@/game/systems/globalUniforms";

const vertexShader = [
  "uniform float uTime;",
  "varying float vElevation;",
  "varying vec3 vWorldPos;",
  "varying float vDistFromCenter;",
  "void main() {",
  "  vec3 pos = position;",
  "  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);",
  "  float dist = length(worldPosition.xz);",
  "  vDistFromCenter = dist;",
  "  float openSeaFactor = smoothstep(520.0, 680.0, dist);",
  "  float amp = mix(0.08, 0.38, openSeaFactor);",
  "  float wave1 = sin(worldPosition.x * 0.09 + uTime * 2.0) * amp;",
  "  float wave2 = cos(worldPosition.z * 0.08 + uTime * 1.6) * amp * 0.85;",
  "  float wave3 = sin((worldPosition.x + worldPosition.z) * 0.15 - uTime * 2.4) * amp * 0.35;",
  "  worldPosition.y += wave1 + wave2 + wave3;",
  "  vElevation = wave1 + wave2 + wave3;",
  "  vWorldPos = worldPosition.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * worldPosition;",
  "}"
].join("\n");

const fragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "uniform vec3 uSkyHorizon;",
  "varying float vElevation;",
  "varying vec3 vWorldPos;",
  "varying float vDistFromCenter;",

  "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",

  "void main() {",
  "  float coastEdge = 538.0;",
  "  float distFromShore = max(0.0, vDistFromCenter - coastEdge);",
  "  float shallowMask = 1.0 - smoothstep(0.0, 65.0, distFromShore);",

  "  // True Tropical Turquoise to Deep Ocean Sapphire Blue (Never yellow sand!)",
  "  vec3 shallowTeal = vec3(0.06, 0.68, 0.76);",
  "  vec3 midOceanBlue = vec3(0.02, 0.40, 0.68);",
  "  vec3 abyssBlue = vec3(0.01, 0.22, 0.46);",
  "  vec3 waterCol = mix(abyssBlue, midOceanBlue, 1.0 - smoothstep(60.0, 260.0, distFromShore));",
  "  waterCol = mix(waterCol, shallowTeal, shallowMask);",

  "  // Dual scrolling normal ripples & animated caustic wave crests",
  "  float n1 = noise(vWorldPos.xz * 0.42 + vec2(uTime * 0.7, -uTime * 0.5));",
  "  float n2 = noise(vWorldPos.xz * 0.85 + vec2(-uTime * 0.9, uTime * 0.6));",
  "  float waveShimmer = smoothstep(0.58, 0.88, n1 * 0.6 + n2 * 0.4);",
  "  waterCol += vec3(0.45, 0.88, 0.96) * waveShimmer * (0.25 + shallowMask * 0.35) * (1.0 - uNightFactor * 0.7);",

  "  // Crisp White Shoreline Foam & Wave Whitecaps",
  "  float foamWave = sin(distFromShore * 0.65 - uTime * 3.0 + n1 * 2.5) * 0.5 + 0.5;",
  "  float shoreFoam = smoothstep(11.0, 0.0, distFromShore) * step(0.45, foamWave);",
  "  float crestFoam = smoothstep(0.28, 0.42, vElevation) * 0.45;",
  "  waterCol = mix(waterCol, vec3(0.95, 0.99, 1.0), clamp(shoreFoam + crestFoam, 0.0, 0.9));",

  "  // Night darkening",
  "  waterCol = mix(waterCol, vec3(0.02, 0.08, 0.18), uNightFactor * 0.78);",

  "  // Realistic Fresnel Sky Reflection & Sun Specular Glints",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  vec3 normal = normalize(vec3((n1 - 0.5) * 0.24, 1.0, (n2 - 0.5) * 0.24));",
  "  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);",
  "  waterCol = mix(waterCol, uSkyHorizon, fresnel * 0.42);",

  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float spec = pow(max(dot(normal, halfVec), 0.0), 96.0);",
  "  waterCol += uSunColor * spec * (1.0 - uNightFactor * 0.5) * 0.85;",

  "  gl_FragColor = vec4(waterCol, 0.94);",
  "}"
].join("\n");

export default function Water() {
  const uniforms = useMemo(() => ({
    uTime: globalUniforms.uTime,
    uNightFactor: globalUniforms.uNightFactor,
    uSunDir: globalUniforms.uSunDir,
    uSunColor: globalUniforms.uSunColor,
    uSkyHorizon: globalUniforms.uSkyHorizon,
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.35, 0]} receiveShadow frustumCulled={false}>
      <planeGeometry args={[2800, 2800, 180, 180]} />
      <shaderMaterial transparent depthWrite={true} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
