"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalUniforms } from "./globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

const vertexShader = [
  "varying vec3 vWorldDir;",
  "void main() {",
  "  vec4 worldPos = modelMatrix * vec4(position, 1.0);",
  "  vWorldDir = normalize(position);",
  "  gl_Position = projectionMatrix * viewMatrix * worldPos;",
  "}"
].join("\n");

const fragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uMoonDir;",
  "uniform vec3 uSunColor;",
  "uniform vec3 uSkyTop;",
  "uniform vec3 uSkyHorizon;",
  "uniform float uBloodMoon;",
  "uniform float uAuroraStrength;",
  "varying vec3 vWorldDir;",

  "float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",
  "vec2 hash22(vec2 p) {",
  "  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));",
  "  return fract(sin(p) * 43758.5453);",
  "}",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",
  "float fbm(vec2 p) {",
  "  float v = 0.0; float a = 0.5;",
  "  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }",
  "  return v;",
  "}",

  "float starLayer(vec2 uv, float scale, float density) {",
  "  vec2 gv = fract(uv * scale) - 0.5;",
  "  vec2 id = floor(uv * scale);",
  "  vec2 randOffset = (hash22(id) - 0.5) * 0.7;",
  "  float d = length(gv - randOffset);",
  "  float seed = hash2(id);",
  "  if (seed < density) return 0.0;",
  "  float radius = mix(0.025, 0.08, fract(seed * 31.7));",
  "  float star = smoothstep(radius, 0.0, d);",
  "  float twinkle = 0.65 + 0.35 * sin(uTime * (1.8 + fract(seed * 17.3) * 2.5) + seed * 90.0);",
  "  return star * twinkle;",
  "}",

  "void main() {",
  "  vec3 dir = normalize(vWorldDir);",
  "  float y = clamp(dir.y, 0.0, 1.0);",
  "  vec3 skyColor = mix(uSkyHorizon, uSkyTop, pow(y, 0.55));",
  "  vec3 bloodTint = vec3(0.30, 0.03, 0.07);",
  "  skyColor = mix(skyColor, bloodTint, uNightFactor * uBloodMoon * 0.65);",

  "  // Sun disc & warm glow",
  "  float sunAlignment = max(dot(dir, normalize(uSunDir)), 0.0);",
  "  float sunDisc = smoothstep(0.9982, 0.9994, sunAlignment);",
  "  float sunHalo = pow(sunAlignment, 10.0) * 0.42 + pow(sunAlignment, 64.0) * 0.55;",
  "  float sunVisible = smoothstep(-0.15, 0.08, uSunDir.y);",
  "  skyColor += uSunColor * (sunDisc * 2.2 + sunHalo) * sunVisible;",

  "  // Moon disc with craters",
  "  float moonAlignment = max(dot(dir, normalize(uMoonDir)), 0.0);",
  "  float moonRadius = mix(0.9972, 0.9942, uBloodMoon);",
  "  float moonDisc = smoothstep(moonRadius, moonRadius + 0.0007, moonAlignment);",
  "  float moonHalo = pow(moonAlignment, 20.0) * 0.45;",
  "  vec2 craterUv = dir.xy * 26.0 + dir.z * 14.0;",
  "  float craters = fbm(craterUv);",
  "  vec3 normalMoonCol = vec3(0.88, 0.94, 1.0) * mix(0.68, 1.06, craters);",
  "  vec3 bloodMoonCol = vec3(0.94, 0.30, 0.34) * mix(0.50, 1.10, craters);",
  "  vec3 moonCol = mix(normalMoonCol, bloodMoonCol, uBloodMoon);",
  "  skyColor += moonCol * moonDisc * uNightFactor * 1.65;",
  "  skyColor += mix(vec3(0.32, 0.52, 0.82), vec3(0.82, 0.14, 0.18), uBloodMoon) * moonHalo * uNightFactor;",

  "  // Stars at night",
  "  if (uNightFactor > 0.02 && dir.y > 0.05) {",
  "    float theta = atan(dir.z, dir.x);",
  "    float phi = acos(clamp(dir.y, -1.0, 1.0));",
  "    vec2 sphereUv = vec2(theta / 6.283185 + 0.5, phi / 3.14159);",
  "    float s1 = starLayer(sphereUv, 95.0, 0.92);",
  "    float s2 = starLayer(sphereUv + 0.37, 175.0, 0.95) * 0.65;",
  "    float horizonFade = smoothstep(0.05, 0.24, dir.y);",
  "    skyColor += vec3(0.92, 0.96, 1.0) * (s1 + s2) * uNightFactor * horizonFade * 1.5;",
  "  }",

  "  // Natural Aurora Borealis",
  "  if (uNightFactor > 0.05 && dir.y > 0.05 && uBloodMoon < 0.5) {",
  "    float northMask = smoothstep(0.35, -0.35, dir.z);",
  "    float azim = atan(dir.x, -dir.z);",
  "    float fold = sin(azim * 5.0 + uTime * 0.08) * 0.35 + fbm(vec2(azim * 3.2, uTime * 0.05)) * 0.65;",
  "    float rays = noise(vec2(azim * 26.0 + fold * 4.0, uTime * 0.14));",
  "    float rayPillars = smoothstep(0.28, 0.82, rays) * (0.45 + 0.55 * sin(azim * 9.0 - uTime * 0.1));",
  "    float baseCurve = 0.12 + 0.05 * sin(azim * 3.5 + fold * 2.5);",
  "    float hNorm = (dir.y - baseCurve) / 0.46;",
  "    float vertProfile = smoothstep(0.0, 0.14, hNorm) * exp(-max(0.0, hNorm - 0.12) * 2.8);",
  "    vec3 auroraCol = mix(vec3(0.76, 0.24, 0.52), vec3(0.14, 0.86, 0.54), smoothstep(0.0, 0.22, hNorm));",
  "    auroraCol = mix(auroraCol, vec3(0.06, 0.48, 0.42), smoothstep(0.35, 0.9, hNorm));",
  "    float intensity = rayPillars * vertProfile * northMask * uNightFactor * uAuroraStrength;",
  "    skyColor += auroraCol * intensity * 1.2;",
  "  }",

  "  // Soft Natural Billowy Cumulus Clouds (Only high in the sky, subtle at night so Aurora is crystal clear!)",
  "  if (dir.y > 0.12) {",
  "    vec2 cloudUv = dir.xz / (dir.y + 0.28) * 1.15 + vec2(uTime * 0.008, uTime * 0.004);",
  "    float c1 = fbm(cloudUv);",
  "    float c2 = fbm(cloudUv * 2.1 - vec2(uTime * 0.005, 0.0));",
  "    float cloudShape = smoothstep(0.50, 0.78, c1 * 0.65 + c2 * 0.35);",
  "    float skyFade = smoothstep(0.12, 0.32, dir.y);",
  "    vec3 cloudDay = mix(uSkyHorizon, vec3(1.0, 0.99, 0.97), 0.75);",
  "    vec3 cloudNight = vec3(0.09, 0.14, 0.24);",
  "    vec3 cloudCol = mix(cloudDay, cloudNight, uNightFactor);",
  "    float nightCloudOpacity = mix(0.65, 0.15, uNightFactor);",
  "    skyColor = mix(skyColor, cloudCol, cloudShape * skyFade * nightCloudOpacity);",
  "  }",

  "  gl_FragColor = vec4(skyColor, 1.0);",
  "}"
].join("\n");

export default function Sky() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(playerFrameState.x, 0, playerFrameState.z);
    }
  });
  return (
    <mesh ref={meshRef} scale={[1600, 1600, 1600]} frustumCulled={false}>
      <sphereGeometry args={[1, 48, 32]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={globalUniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
