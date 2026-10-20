"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { globalUniforms } from "@/game/systems/globalUniforms";

const vertexShader = [
  "uniform float uTime;",
  "varying float vElevation;",
  "varying vec3 vWorldPos;",
  "void main() {",
  "  vec3 pos = position;",
  "  float wave1 = sin(pos.x * 0.08 + uTime * 1.6) * 0.18;",
  "  float wave2 = cos(pos.y * 0.06 + uTime * 1.2) * 0.15;",
  "  pos.z += wave1 + wave2;",
  "  vElevation = wave1 + wave2;",
  "  vec4 worldPosition = modelMatrix * vec4(pos, 1.0);",
  "  vWorldPos = worldPosition.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * worldPosition;",
  "}"
].join("\n");

const fragmentShader = [
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "uniform vec3 uShallowColor;",
  "uniform vec3 uDeepColor;",
  "uniform vec3 uNightWaterColor;",
  "varying float vElevation;",
  "varying vec3 vWorldPos;",
  "void main() {",
  "  float mixFactor = smoothstep(-0.3, 0.35, vElevation);",
  "  vec3 dayWater = mix(uDeepColor, uShallowColor, mixFactor);",
  "  vec3 baseColor = mix(dayWater, uNightWaterColor, uNightFactor * 0.85);",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float spec = pow(max(dot(vec3(0.0, 1.0, 0.0), halfVec), 0.0), 48.0);",
  "  baseColor += uSunColor * spec * (1.0 - uNightFactor * 0.6) * 0.35;",
  "  gl_FragColor = vec4(baseColor, 0.86);",
  "}"
].join("\n");

export default function Water() {
  const uniforms = useMemo(() => ({
    uTime: globalUniforms.uTime,
    uNightFactor: globalUniforms.uNightFactor,
    uSunDir: globalUniforms.uSunDir,
    uSunColor: globalUniforms.uSunColor,
    uShallowColor: { value: new THREE.Color("#2dd4bf") },
    uDeepColor: { value: new THREE.Color("#0284c7") },
    uNightWaterColor: { value: new THREE.Color("#081c30") },
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[2200, 2200, 128, 128]} />
      <shaderMaterial transparent uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}
