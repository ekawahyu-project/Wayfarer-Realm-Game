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
  "  // Waves are calm near the beach and larger in the open ocean (PRD 8.1)",
  "  float openSeaFactor = smoothstep(560.0, 820.0, dist);",
  "  float amp = mix(0.05, 0.32, openSeaFactor);",
  "  float wave1 = sin(worldPosition.x * 0.07 + uTime * 1.8) * amp;",
  "  float wave2 = cos(worldPosition.z * 0.06 + uTime * 1.4) * amp * 0.85;",
  "  worldPosition.y += wave1 + wave2;",
  "  vElevation = wave1 + wave2;",
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

  "// Procedural Voronoi-like caustic web pattern matching Reference Image 1",
  "float causticPattern(vec2 uv, float t) {",
  "  vec2 p1 = uv * 0.38 + vec2(t * 0.18, -t * 0.14);",
  "  vec2 p2 = uv * 0.42 + vec2(-t * 0.15, t * 0.21);",
  "  float n1 = abs(noise(p1) - 0.5);",
  "  float n2 = abs(noise(p2) - 0.5);",
  "  float web = smoothstep(0.14, 0.0, min(n1, n2));",
  "  return web;",
  "}",

  "void main() {",
  "  // Estimate water depth around the island coastline (island radius ~700m, shore ~615m)",
  "  float coastEdge = 615.0;",
  "  float distFromShore = max(0.0, vDistFromCenter - coastEdge);",
  "  float shallowMask = 1.0 - smoothstep(0.0, 95.0, distFromShore);",
  "  float veryShallowMask = 1.0 - smoothstep(0.0, 26.0, distFromShore);",

  "  // Color gradient matching Reference Image 1: sandy yellow -> crystal turquoise -> deep ocean blue",
  "  vec3 sandTint = vec3(0.86, 0.80, 0.58);",
  "  vec3 turquoise = vec3(0.18, 0.82, 0.78);",
  "  vec3 deepBlue = vec3(0.03, 0.42, 0.72);",
  "  vec3 waterCol = mix(deepBlue, turquoise, shallowMask);",
  "  waterCol = mix(waterCol, sandTint, veryShallowMask * 0.65);",

  "  // Dual scrolling normal ripples + Caustic light net on shallow seabed",
  "  float caustics = causticPattern(vWorldPos.xz, uTime);",
  "  waterCol += vec3(0.95, 0.98, 0.88) * caustics * shallowMask * (1.0 - uNightFactor * 0.75) * 0.42;",

  "  // Animated shoreline foam",
  "  float foamWave = sin(distFromShore * 0.55 - uTime * 2.8) * 0.5 + 0.5;",
  "  float foamMask = smoothstep(14.0, 0.0, distFromShore) * step(0.42, foamWave + noise(vWorldPos.xz * 0.25) * 0.35);",
  "  waterCol = mix(waterCol, vec3(0.96, 0.99, 1.0), foamMask * 0.85);",

  "  // Night darkening",
  "  waterCol = mix(waterCol, vec3(0.03, 0.09, 0.18), uNightFactor * 0.82);",

  "  // Fresnel sky reflection & sun specular highlights",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  float rippleNx = (noise(vWorldPos.xz * 0.45 + uTime * 0.6) - 0.5) * 0.16;",
  "  float rippleNz = (noise(vWorldPos.xz * 0.45 - uTime * 0.5) - 0.5) * 0.16;",
  "  vec3 normal = normalize(vec3(rippleNx, 1.0, rippleNz));",
  "  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.2);",
  "  waterCol = mix(waterCol, uSkyHorizon, fresnel * 0.38);",

  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float spec = pow(max(dot(normal, halfVec), 0.0), 72.0);",
  "  waterCol += uSunColor * spec * (1.0 - uNightFactor * 0.6) * 0.55;",

  "  // Transparent in shallow water so real sandy seabed shows through (Image 1)",
  "  float alpha = mix(0.92, 0.52, veryShallowMask);",
  "  gl_FragColor = vec4(waterCol, alpha);",
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[2600, 2600, 180, 180]} />
      <shaderMaterial transparent depthWrite={false} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
