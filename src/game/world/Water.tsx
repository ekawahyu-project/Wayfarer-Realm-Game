"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { getRiverCenterX, getExactMeshTerrainHeight } from "@/utils/noise";

const oceanVertexShader = [
  "uniform float uTime;",
  "varying vec3 vWorldPos;",
  "varying float vDistFromCenter;",
  "void main() {",
  "  vec4 worldPosition = modelMatrix * vec4(position, 1.0);",
  "  float dist = length(worldPosition.xz);",
  "  vDistFromCenter = dist;",
  "  float openSea = smoothstep(535.0, 680.0, dist);",
  "  float amp = mix(0.02, 0.24, openSea);",
  "  float w = sin(worldPosition.x * 0.06 + uTime * 1.8) * amp + cos(worldPosition.z * 0.05 + uTime * 1.4) * amp;",
  "  worldPosition.y += w;",
  "  vWorldPos = worldPosition.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * worldPosition;",
  "}"
].join("\n");

const oceanFragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "uniform vec3 uSkyHorizon;",
  "varying vec3 vWorldPos;",
  "varying float vDistFromCenter;",

  "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",

  "void main() {",
  "  float distFromShore = max(0.0, vDistFromCenter - 542.0);",
  "  float shallowMask = 1.0 - smoothstep(0.0, 68.0, distFromShore);",
  "  vec3 crystalAqua = vec3(0.10, 0.78, 0.84);",
  "  vec3 deepOcean = vec3(0.02, 0.36, 0.68);",
  "  vec3 waterCol = mix(deepOcean, crystalAqua, shallowMask);",
  "  vec2 uv1 = vWorldPos.xz * 0.32 + vec2(uTime * 0.24, -uTime * 0.18);",
  "  vec2 uv2 = vWorldPos.xz * 0.36 + vec2(-uTime * 0.20, uTime * 0.26);",
  "  float n1 = abs(noise(uv1) - 0.5);",
  "  float n2 = abs(noise(uv2) - 0.5);",
  "  float causticWeb = smoothstep(0.14, 0.0, min(n1, n2));",
  "  float n = noise(uv1 * 0.6) * 0.5 + noise(uv2 * 0.8) * 0.5;",
  "  waterCol += vec3(0.72, 0.98, 1.0) * causticWeb * 0.42 * (1.0 - uNightFactor * 0.6);",
  "  waterCol = mix(waterCol, vec3(0.04, 0.12, 0.26), uNightFactor * 0.65);",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  vec3 norm = normalize(vec3((n - 0.5) * 0.18, 1.0, (n - 0.5) * 0.18));",
  "  float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);",
  "  waterCol = mix(waterCol, uSkyHorizon, fresnel * 0.45);",
  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float specCore = pow(max(dot(norm, halfVec), 0.0), 160.0) * 2.0;",
  "  float specPath = pow(max(dot(norm, halfVec), 0.0), 28.0) * 0.5;",
  "  waterCol += uSunColor * (specCore + specPath) * (1.0 - uNightFactor * 0.5);",
  "  gl_FragColor = vec4(waterCol, 0.85);",
  "}"
].join("\n");

// Dedicated Crystal-Clear Flowing River Shader with Soft Bank Alpha Fade & Flowing Ripples!
const riverVertexShader = [
  "uniform float uTime;",
  "varying vec2 vUv;",
  "varying vec3 vWorldPos;",
  "void main() {",
  "  vUv = uv;",
  "  vec4 worldPosition = modelMatrix * vec4(position, 1.0);",
  "  float ripple = sin(worldPosition.z * 0.35 - uTime * 3.2) * 0.025 + cos(worldPosition.x * 0.4 + uTime * 2.4) * 0.02;",
  "  worldPosition.y += ripple;",
  "  vWorldPos = worldPosition.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * worldPosition;",
  "}"
].join("\n");

const riverFragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "uniform vec3 uSkyHorizon;",
  "varying vec2 vUv;",
  "varying vec3 vWorldPos;",

  "float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noise(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p);",
  "  f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",

  "void main() {",
  "  // Distance from center of river (0 at center, 1 at banks)",
  "  float bankDist = abs(vUv.x - 0.5) * 2.0;",
  "  // Softly fade alpha at riverbanks so water blends naturally into grass/pebbles!",
  "  float bankAlpha = 1.0 - smoothstep(0.68, 0.98, bankDist);",
  "  if (bankAlpha < 0.02) discard;",

  "  // Crystal emerald-turquoise center to warm sandy-aqua shallow banks",
  "  vec3 centerCol = vec3(0.06, 0.58, 0.72);",
  "  vec3 bankCol = vec3(0.18, 0.76, 0.74);",
  "  vec3 waterCol = mix(centerCol, bankCol, bankDist * 0.75);",

  "  // Downstream flowing current & caustic web",
  "  vec2 flowUv1 = vec2(vWorldPos.x * 0.45, vWorldPos.z * 0.28 - uTime * 0.85);",
  "  vec2 flowUv2 = vec2(vWorldPos.x * 0.52, vWorldPos.z * 0.35 - uTime * 0.65);",
  "  float n1 = abs(noise(flowUv1) - 0.5);",
  "  float n2 = abs(noise(flowUv2) - 0.5);",
  "  float caustics = smoothstep(0.13, 0.0, min(n1, n2));",
  "  float n = noise(flowUv1 * 0.8);",
  "  waterCol += vec3(0.78, 0.98, 1.0) * caustics * 0.48 * (1.0 - uNightFactor * 0.55);",

  "  // Subtle white water foam streaks near banks",
  "  float bankFoam = smoothstep(0.62, 0.85, bankDist) * smoothstep(0.55, 0.75, n);",
  "  waterCol = mix(waterCol, vec3(0.95, 0.99, 1.0), bankFoam * 0.55);",

  "  // Sky reflection & Sun sparkles",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  vec3 norm = normalize(vec3((n - 0.5) * 0.22, 1.0, (n1 - 0.25) * 0.22));",
  "  float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 2.6);",
  "  waterCol = mix(waterCol, uSkyHorizon, fresnel * 0.48);",
  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float specCore = pow(max(dot(norm, halfVec), 0.0), 140.0) * 1.8;",
  "  float specShimmer = pow(max(dot(norm, halfVec), 0.0), 24.0) * 0.55;",
  "  waterCol += uSunColor * (specCore + specShimmer) * (1.0 - uNightFactor * 0.5);",

  "  waterCol = mix(waterCol, vec3(0.05, 0.16, 0.32), uNightFactor * 0.6);",
  "  gl_FragColor = vec4(waterCol, bankAlpha * 0.78);",
  "}"
].join("\n");

export default function Water() {
  const lilyPadRef = useRef<THREE.InstancedMesh>(null);
  const lotusOuterRef = useRef<THREE.InstancedMesh>(null);
  const lotusCenterRef = useRef<THREE.InstancedMesh>(null);
  const bankBushRef = useRef<THREE.InstancedMesh>(null);
  const bankRockRef = useRef<THREE.InstancedMesh>(null);

  const uniforms = useMemo(() => ({
    uTime: globalUniforms.uTime,
    uNightFactor: globalUniforms.uNightFactor,
    uSunDir: globalUniforms.uSunDir,
    uSunColor: globalUniforms.uSunColor,
    uSkyHorizon: globalUniforms.uSkyHorizon,
  }), []);

  const RIVER_Y = 7.55;

  const lotusPetalGeo = useMemo(() => {
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];
    let vOff = 0;
    const petals = 8;
    for (let p = 0; p < petals; p++) {
      const a = (p / petals) * Math.PI * 2;
      const cone = new THREE.ConeGeometry(0.11, 0.28, 5);
      cone.rotateZ(-0.65);
      cone.rotateY(a);
      cone.translate(Math.cos(a) * 0.10, 0.08, -Math.sin(a) * 0.10);
      const pos = cone.attributes.position.array as Float32Array;
      const nor = cone.attributes.normal.array as Float32Array;
      for (let i = 0; i < pos.length; i++) { positions.push(pos[i]); normals.push(nor[i]); }
      const idx = cone.index!.array;
      for (let i = 0; i < idx.length; i++) indices.push(idx[i] + vOff);
      vOff += cone.attributes.position.count;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    g.setIndex(indices);
    return g;
  }, []);

  const { riverGeo, lilies, bankBushes, bankRocks } = useMemo(() => {
    const segsZ = 80;
    const halfWidth = 13.5;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= segsZ; i++) {
      const t = i / segsZ;
      const z = -235 + t * 450;
      const cx = getRiverCenterX(z);
      positions.push(cx - halfWidth, RIVER_Y, z, cx + halfWidth, RIVER_Y, z);
      uvs.push(0, t * 25, 1, t * 25);
      if (i < segsZ) {
        const r0 = i * 2, r1 = r0 + 2;
        indices.push(r0, r1, r0 + 1, r0 + 1, r1, r1 + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const lilyList: { x: number; z: number; s: number; rot: number; color: THREE.Color }[] = [];
    const bushList: { x: number; y: number; z: number; s: number }[] = [];
    const rockList: { x: number; y: number; z: number; sx: number; sy: number; sz: number; rot: number }[] = [];
    let seed = 778899;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const lotusColors = [new THREE.Color("#f472b6"), new THREE.Color("#fbcfe8"), new THREE.Color("#fff1f2"), new THREE.Color("#fb7185")];

    for (let i = 0; i < 110; i++) {
      const z = -215 + rand() * 410;
      if (Math.abs(z) < 8) continue;
      const cx = getRiverCenterX(z) + (rand() - 0.5) * 11.0;
      lilyList.push({
        x: cx, z,
        s: 0.75 + rand() * 0.55,
        rot: rand() * Math.PI * 2,
        color: lotusColors[Math.floor(rand() * lotusColors.length)],
      });
    }

    for (let i = 0; i < 95; i++) {
      const z = -220 + rand() * 420;
      if (Math.abs(z) < 10) continue;
      const side = rand() > 0.5 ? 1 : -1;
      const x = getRiverCenterX(z) + side * (12.5 + rand() * 4.5);
      const y = getExactMeshTerrainHeight(x, z);
      bushList.push({ x, y: y + 0.15, z, s: 0.75 + rand() * 0.65 });
      if (i % 2 === 0) {
        const rx = getRiverCenterX(z) + side * (11.2 + rand() * 2.5);
        const ry = getExactMeshTerrainHeight(rx, z);
        rockList.push({ x: rx, y: ry - 0.1, z, sx: 0.9 + rand() * 1.2, sy: 0.5 + rand() * 0.6, sz: 0.9 + rand() * 1.2, rot: rand() * Math.PI });
      }
    }

    return { riverGeo: geo, lilies: lilyList, bankBushes: bushList, bankRocks: rockList };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();
    if (lilyPadRef.current && lotusOuterRef.current && lotusCenterRef.current) {
      lilies.forEach((l, i) => {
        dummy.position.set(l.x, RIVER_Y + 0.03, l.z);
        dummy.rotation.set(0, l.rot, 0);
        dummy.scale.set(l.s, 1, l.s);
        dummy.updateMatrix();
        lilyPadRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(l.x, RIVER_Y + 0.05, l.z);
        dummy.scale.set(l.s, l.s, l.s);
        dummy.updateMatrix();
        lotusOuterRef.current!.setMatrixAt(i, dummy.matrix);
        lotusOuterRef.current!.setColorAt(i, l.color);

        dummy.position.set(l.x, RIVER_Y + 0.11, l.z);
        dummy.scale.set(l.s, l.s, l.s);
        dummy.updateMatrix();
        lotusCenterRef.current!.setMatrixAt(i, dummy.matrix);
      });
      lilyPadRef.current.instanceMatrix.needsUpdate = true;
      lotusOuterRef.current.instanceMatrix.needsUpdate = true;
      lotusCenterRef.current.instanceMatrix.needsUpdate = true;
      if (lotusOuterRef.current.instanceColor) lotusOuterRef.current.instanceColor.needsUpdate = true;
    }
    if (bankBushRef.current) {
      bankBushes.forEach((b, i) => {
        dummy.position.set(b.x, b.y, b.z);
        dummy.rotation.set(0, i * 1.3, 0);
        dummy.scale.set(b.s * 1.3, b.s * 0.85, b.s * 1.3);
        dummy.updateMatrix();
        bankBushRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bankBushRef.current.instanceMatrix.needsUpdate = true;
    }
    if (bankRockRef.current) {
      bankRocks.forEach((r, i) => {
        dummy.position.set(r.x, r.y, r.z);
        dummy.rotation.set(0, r.rot, 0);
        dummy.scale.set(r.sx, r.sy, r.sz);
        dummy.updateMatrix();
        bankRockRef.current!.setMatrixAt(i, dummy.matrix);
      });
      bankRockRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [lilies, bankBushes, bankRocks]);

  return (
    <group name="ocean-and-lotus-river">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 0]} frustumCulled={false}>
        <planeGeometry args={[2600, 2600, 64, 64]} />
        <shaderMaterial transparent depthWrite={false} uniforms={uniforms} vertexShader={oceanVertexShader} fragmentShader={oceanFragmentShader} />
      </mesh>

      {/* Custom Flowing River Water Shader with Soft Alpha Edges & Caustic Shimmer */}
      <mesh geometry={riverGeo} frustumCulled={false}>
        <shaderMaterial side={THREE.DoubleSide} transparent depthWrite={true} polygonOffset polygonOffsetFactor={-2} uniforms={uniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
      </mesh>

      <instancedMesh ref={lilyPadRef} args={[undefined, undefined, lilies.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.52, 0.52, 0.025, 12, 1, false, 0, Math.PI * 1.85]} />
        <meshStandardMaterial color="#16a34a" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lotusOuterRef} args={[lotusPetalGeo, undefined, lilies.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={lotusCenterRef} args={[undefined, undefined, lilies.length]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color="#facc15" emissive="#eab308" emissiveIntensity={0.4} />
      </instancedMesh>
      <instancedMesh ref={bankBushRef} args={[undefined, undefined, bankBushes.length]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={bankRockRef} args={[undefined, undefined, bankRocks.length]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.65, 1]} />
        <meshStandardMaterial color="#64748b" roughness={0.88} />
      </instancedMesh>
    </group>
  );
}
