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

  "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",
  "float fbm(vec2 p) {",
  "  float v = 0.0; float a = 0.5;",
  "  for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }",
  "  return v;",
  "}",

  "void main() {",
  "  vec3 dir = normalize(vWorldDir);",
  "  float y = clamp(dir.y, 0.0, 1.0);",
  "  vec3 skyColor = mix(uSkyHorizon, uSkyTop, pow(y, 0.55));",
  "  vec3 bloodTint = vec3(0.32, 0.04, 0.08);",
  "  skyColor = mix(skyColor, bloodTint, uNightFactor * uBloodMoon * 0.65);",

  "  // Sun disc & halo",
  "  float sunAlignment = max(dot(dir, normalize(uSunDir)), 0.0);",
  "  float sunDisc = smoothstep(0.9982, 0.9994, sunAlignment);",
  "  float sunHalo = pow(sunAlignment, 10.0) * 0.45 + pow(sunAlignment, 64.0) * 0.6;",
  "  float sunVisible = smoothstep(-0.15, 0.08, uSunDir.y);",
  "  skyColor += uSunColor * (sunDisc * 2.2 + sunHalo) * sunVisible;",

  "  // Moon disc with craters",
  "  float moonAlignment = max(dot(dir, normalize(uMoonDir)), 0.0);",
  "  float moonRadius = mix(0.9975, 0.9955, uBloodMoon);",
  "  float moonDisc = smoothstep(moonRadius, moonRadius + 0.0008, moonAlignment);",
  "  float moonHalo = pow(moonAlignment, 18.0) * 0.4;",
  "  vec2 craterUv = dir.xy * 28.0 + dir.z * 14.0;",
  "  float craters = fbm(craterUv);",
  "  vec3 normalMoonCol = vec3(0.85, 0.92, 1.0) * mix(0.72, 1.05, craters);",
  "  vec3 bloodMoonCol = vec3(0.95, 0.28, 0.32) * mix(0.55, 1.08, craters);",
  "  vec3 moonCol = mix(normalMoonCol, bloodMoonCol, uBloodMoon);",
  "  skyColor += moonCol * moonDisc * uNightFactor * 1.6;",
  "  skyColor += mix(vec3(0.35, 0.55, 0.85), vec3(0.85, 0.15, 0.2), uBloodMoon) * moonHalo * uNightFactor;",

  "  // Twinkling Stars",
  "  if (uNightFactor > 0.02 && dir.y > 0.02) {",
  "    vec2 starGrid = floor(dir.xz / (dir.y + 0.15) * 260.0);",
  "    float starSeed = hash(starGrid);",
  "    if (starSeed > 0.9932) {",
  "      float twinkle = 0.55 + 0.45 * sin(uTime * 2.8 + starSeed * 120.0);",
  "      float horizonFade = smoothstep(0.02, 0.25, dir.y);",
  "      skyColor += vec3(0.9, 0.95, 1.0) * twinkle * uNightFactor * horizonFade * 1.4;",
  "    }",
  "  }",

  "  // Milestone M4: Aurora Borealis ribbons at night (Reference Image 2)",
  "  if (uNightFactor > 0.05 && dir.y > 0.06 && uBloodMoon < 0.5) {",
  "    // Stronger toward North (-Z), with vertical curtains",
    "  float northBias = smoothstep(0.45, -0.55, dir.z);",
    "  float waveX = dir.x * 4.5 + sin(dir.z * 3.0 + uTime * 0.18) * 0.8;",
    "  float curtain1 = sin(waveX * 3.2 + fbm(vec2(waveX * 1.8, uTime * 0.12)) * 4.5) * 0.5 + 0.5;",
    "  float curtain2 = sin(waveX * 5.5 - uTime * 0.22 + noise(dir.xz * 4.0) * 3.0) * 0.5 + 0.5;",
    "  float ribbon = pow(curtain1 * curtain2, 1.6);",
    "  float vertBand = smoothstep(0.06, 0.24, dir.y) * smoothstep(0.78, 0.28, dir.y);",
    "  float bottomMagentaMask = smoothstep(0.32, 0.08, dir.y);",
    "  vec3 auroraGreen = vec3(0.12, 0.92, 0.52);",
    "  vec3 auroraMagenta = vec3(0.78, 0.22, 0.58);",
    "  vec3 auroraCol = mix(auroraGreen, auroraMagenta, bottomMagentaMask * 0.72);",
    "  float auroraAlpha = ribbon * vertBand * (0.35 + northBias * 0.65) * uNightFactor * uAuroraStrength;",
    "  skyColor += auroraCol * auroraAlpha * 1.35;",
  "  }",

  "  // Soft clouds",
  "  if (dir.y > 0.04) {",
  "    vec2 cloudUv = dir.xz / (dir.y + 0.18) * 1.4 + vec2(uTime * 0.012, uTime * 0.006);",
  "    float cNoise = fbm(cloudUv);",
  "    float cloudMask = smoothstep(0.54, 0.80, cNoise) * smoothstep(0.04, 0.25, dir.y);",
  "    vec3 cloudDay = mix(uSkyHorizon, vec3(1.0, 0.98, 0.95), 0.7);",
  "    vec3 cloudNight = mix(vec3(0.07, 0.11, 0.20), vec3(0.35, 0.08, 0.12), uBloodMoon);",
  "    vec3 cloudColor = mix(cloudDay, cloudNight, uNightFactor);",
  "    skyColor = mix(skyColor, cloudColor, cloudMask * 0.45);",
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
