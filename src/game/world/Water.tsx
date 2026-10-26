"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { getRiverCenterX, getTerrainHeight, noise2D } from "@/utils/noise";
import { addBoxCollider, addCylinderCollider, clearCollidersByTag } from "@/game/systems/Physics";

interface BatchItem {
  geo: THREE.BufferGeometry;
  matrix: THREE.Matrix4;
  color: THREE.Color;
}

function mergeColoredGeos(items: BatchItem[]): THREE.BufferGeometry {
  let totalVerts = 0;
  const prepared = items.map((item) => {
    const g = item.geo.index ? item.geo.toNonIndexed() : item.geo.clone();
    g.applyMatrix4(item.matrix);
    totalVerts += g.attributes.position.count;
    return { g, col: item.color };
  });

  const positions = new Float32Array(totalVerts * 3);
  const normals = new Float32Array(totalVerts * 3);
  const colors = new Float32Array(totalVerts * 3);
  let offset = 0;

  for (let k = 0; k < prepared.length; k++) {
    const { g, col } = prepared[k];
    const pos = g.attributes.position;
    const norm = g.attributes.normal;
    positions.set(pos.array as Float32Array, offset * 3);
    if (norm) normals.set(norm.array as Float32Array, offset * 3);
    for (let i = 0; i < pos.count; i++) {
      const cIdx = (offset + i) * 3;
      colors[cIdx] = col.r;
      colors[cIdx + 1] = col.g;
      colors[cIdx + 2] = col.b;
    }
    offset += pos.count;
    g.dispose();
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  merged.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return merged;
}

let cachedNaturalCliffTex: THREE.CanvasTexture | null = null;
function getNaturalCliffRockTexture(): THREE.CanvasTexture {
  if (cachedNaturalCliffTex) return cachedNaturalCliffTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#5c6460";
  ctx.fillRect(0, 0, 256, 256);

  let seed = 918273;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  for (let i = 0; i < 220; i++) {
    const cx = rand() * 256;
    const cy = rand() * 256;
    const rx = 10 + rand() * 32;
    const ry = 5 + rand() * 14;
    const shade = Math.floor(62 + rand() * 68);
    const greenTint = rand() > 0.72 ? 12 : 0;
    ctx.fillStyle = `rgba(${shade - greenTint}, ${shade + greenTint}, ${shade - 4}, 0.36)`;
    ctx.beginPath();
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      const jitter = 0.75 + rand() * 0.45;
      const px = cx + Math.cos(ang) * rx * jitter;
      const py = cy + Math.sin(ang) * ry * jitter;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.lineWidth = 1.6;
  for (let i = 0; i < 55; i++) {
    let x = rand() * 256;
    let y = rand() * 256;
    ctx.strokeStyle = rand() > 0.3 ? "rgba(28, 33, 30, 0.55)" : "rgba(45, 85, 38, 0.45)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += (rand() - 0.35) * 24;
      y += (rand() - 0.5) * 12;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.needsUpdate = true;
  cachedNaturalCliffTex = tex;
  return tex;
}

const oceanVertexShader = [
  "uniform float uTime;",
  "varying vec3 vWorldPos;",
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  vec4 wp = modelMatrix * vec4(position, 1.0);",
  "  float w1 = sin(wp.x * 0.045 + uTime * 1.3) * cos(wp.z * 0.045 + uTime * 1.0) * 0.22;",
  "  float w2 = sin(wp.x * 0.11 - uTime * 1.7 + wp.z * 0.09) * 0.09;",
  "  wp.y += w1 + w2;",
  "  vWorldPos = wp.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * wp;",
  "}"
].join("\n");

const oceanFragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "varying vec3 vWorldPos;",
  "float hashW(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noiseW(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hashW(i), hashW(i + vec2(1.0, 0.0)), f.x), mix(hashW(i + vec2(0.0, 1.0)), hashW(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",
  "void main() {",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  vec2 uv1 = vWorldPos.xz * 0.07 + vec2(uTime * 0.04, uTime * 0.03);",
  "  vec2 uv2 = vWorldPos.xz * 0.14 - vec2(uTime * 0.05, -uTime * 0.04);",
  "  float n = noiseW(uv1) * 0.6 + noiseW(uv2) * 0.4;",
  "  vec3 norm = normalize(vec3((n - 0.5) * 0.42, 1.0, (noiseW(uv1 + 3.1) - 0.5) * 0.42));",
  "  vec3 deepCol = mix(vec3(0.02, 0.28, 0.52), vec3(0.01, 0.08, 0.18), uNightFactor);",
  "  vec3 shallowCol = mix(vec3(0.08, 0.62, 0.78), vec3(0.03, 0.18, 0.32), uNightFactor);",
  "  float fresnel = pow(1.0 - max(dot(norm, viewDir), 0.0), 3.0);",
  "  vec3 waterCol = mix(shallowCol, deepCol, fresnel * 0.65);",
  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float specCore = pow(max(dot(norm, halfVec), 0.0), 140.0) * 1.8;",
  "  float specPath = pow(max(dot(norm, halfVec), 0.0), 26.0) * 0.5;",
  "  waterCol += uSunColor * (specCore + specPath) * (1.0 - uNightFactor * 0.5);",
  "  gl_FragColor = vec4(waterCol, 0.90);",
  "}"
].join("\n");

// Dynamic 3D Flowing River Shader: Grounded shoreline, active 3D ripples, flowing rapids, & natural sky reflection!
const riverVertexShader = [
  "uniform float uTime;",
  "varying vec3 vWorldPos;",
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  vec4 wp = modelMatrix * vec4(position, 1.0);",
  "  // Taper wave height to 0 at riverbanks (uv.x = 0 or 1) so edges NEVER lift off the ground!",
  "  float centerMask = sin(uv.x * 3.14159265);",
  "  float wave1 = sin(wp.z * 0.28 + uTime * 3.8) * cos(wp.x * 0.22 - uTime * 2.4) * 0.065;",
  "  float wave2 = sin(wp.z * 0.65 + wp.x * 0.45 + uTime * 5.2) * 0.028;",
  "  wp.y += (wave1 + wave2) * centerMask;",
  "  vWorldPos = wp.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * wp;",
  "}"
].join("\n");

const riverFragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "uniform vec3 uSkyHorizon;",
  "varying vec3 vWorldPos;",
  "varying vec2 vUv;",
  "float hashR(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noiseR(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hashR(i), hashR(i + vec2(1.0, 0.0)), f.x), mix(hashR(i + vec2(0.0, 1.0)), hashR(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",
  "float fbmRiver(vec2 p) {",
  "  return noiseR(p) * 0.55 + noiseR(p * 2.1 + vec2(1.7, 3.2)) * 0.30 + noiseR(p * 4.3) * 0.15;",
  "}",
  "void main() {",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  // Continuous downstream current flow (+uTime flows from South Waterfall toward North)",
  "  vec2 flowUv1 = vec2(vWorldPos.x * 0.16, vWorldPos.z * 0.14 + uTime * 1.15);",
  "  vec2 flowUv2 = vec2(vWorldPos.x * 0.32 - uTime * 0.25, vWorldPos.z * 0.28 + uTime * 1.75);",
  "  float n1 = fbmRiver(flowUv1);",
  "  float n2 = fbmRiver(flowUv2);",
  "  float n = n1 * 0.55 + n2 * 0.45;",

  "  // Organic noise-warped shoreline distance (Eliminates straight floating white line!)",
  "  float rawBankDist = 1.0 - abs(vUv.x - 0.5) * 2.0;",
  "  float shorelineNoise = (n1 - 0.5) * 0.22;",
  "  float organicBankDist = clamp(rawBankDist + shorelineNoise, 0.0, 1.0);",

  "  // Natural River Color Palette: Warm muddy-sand shallow edge -> Emerald-Teal -> Deep River Blue",
  "  vec3 wetShoreCol = mix(vec3(0.24, 0.42, 0.38), vec3(0.05, 0.12, 0.16), uNightFactor);",
  "  vec3 midEmerald = mix(vec3(0.07, 0.52, 0.62), vec3(0.03, 0.18, 0.28), uNightFactor);",
  "  vec3 deepRiver = mix(vec3(0.03, 0.34, 0.54), vec3(0.01, 0.10, 0.20), uNightFactor);",

  "  vec3 waterCol = mix(wetShoreCol, midEmerald, smoothstep(0.04, 0.32, organicBankDist));",
  "  waterCol = mix(waterCol, deepRiver, smoothstep(0.32, 0.78, organicBankDist));",

  "  // Animated 3D Wave Normals & Sky Fresnel Reflection",
  "  vec3 norm = normalize(vec3((n1 - 0.5) * 0.65, 1.0, (n2 - 0.5) * 0.65));",
  "  float fresnel = pow(1.0 - max(dot(norm, viewDir), 0.0), 2.8);",
  "  waterCol = mix(waterCol, uSkyHorizon * (1.0 - uNightFactor * 0.65), fresnel * 0.42);",

  "  // Flowing White-Cyan Rapids & Current Streaks in the Center Channel (Never on the outer bank edge!)",
  "  float centerStreamMask = smoothstep(0.18, 0.45, organicBankDist);",
  "  float rapidStreaks = smoothstep(0.64, 0.84, n1 * 0.6 + n2 * 0.5) * centerStreamMask;",
  "  float causticSparkle = smoothstep(0.72, 0.92, n1 * n2 * 2.1) * centerStreamMask;",
  "  waterCol += vec3(0.75, 0.96, 1.0) * (rapidStreaks * 0.32 + causticSparkle * 0.38) * (1.0 - uNightFactor * 0.5);",

  "  // Sun Specular Glint",
  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float spec = pow(max(dot(norm, halfVec), 0.0), 90.0) * 1.4 + pow(max(dot(norm, halfVec), 0.0), 20.0) * 0.35;",
  "  waterCol += uSunColor * spec * centerStreamMask * (1.0 - uNightFactor * 0.5);",

  "  // Soft Feathered Shoreline Alpha so Water Melts Seamlessly into the Ground Bank!",
  "  float shoreAlpha = smoothstep(0.02, 0.22, organicBankDist);",
  "  gl_FragColor = vec4(waterCol, shoreAlpha * 0.94);",
  "}"
].join("\n");

const waterfallVertexShader = [
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
  "}"
].join("\n");

const waterfallFragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "varying vec2 vUv;",
  "float hashWf(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noiseWf(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hashWf(i), hashWf(i + vec2(1.0, 0.0)), f.x), mix(hashWf(i + vec2(0.0, 1.0)), hashWf(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",
  "void main() {",
  "  vec2 flow1 = vec2(vUv.x * 9.0, vUv.y * 4.5 + uTime * 3.8);",
  "  vec2 flow2 = vec2(vUv.x * 20.0, vUv.y * 9.0 + uTime * 5.6);",
  "  float n1 = noiseWf(flow1);",
  "  float n2 = noiseWf(flow2);",
  "  float streaks = smoothstep(0.25, 0.75, n1 * 0.55 + n2 * 0.45);",
  "  float crestFoam = smoothstep(0.80, 1.0, vUv.y) * 0.95;",
  "  float plungeFoam = (1.0 - smoothstep(0.0, 0.25, vUv.y)) * 0.95;",
  "  float sideSoft = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));",
  "  vec3 aquaBase = mix(vec3(0.14, 0.62, 0.82), vec3(0.04, 0.22, 0.40), uNightFactor * 0.7);",
  "  vec3 pureFoam = mix(vec3(0.98, 0.99, 1.0), vec3(0.65, 0.84, 0.96), uNightFactor * 0.5);",
  "  vec3 finalCol = mix(aquaBase, pureFoam, clamp(streaks * 0.85 + crestFoam + plungeFoam, 0.0, 1.0));",
  "  gl_FragColor = vec4(finalCol, sideSoft * 0.96);",
  "}"
].join("\n");

export default function Water() {
  const mainWheelRef = useRef<THREE.Group>(null);
  const lotusGroupRef = useRef<THREE.Mesh>(null);

  const rX0 = useMemo(() => getRiverCenterX(0), []);
  const rX95 = useMemo(() => getRiverCenterX(95), []);
  const wfX = 238;
  const wfZ = 224;
  const WATER_LEVEL = 7.24;

  // Dedicated ShaderMaterial instances whose uTime is updated directly every frame in useFrame!
  const oceanShaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        uniforms: globalUniforms,
        vertexShader: oceanVertexShader,
        fragmentShader: oceanFragmentShader,
      }),
    []
  );

  const riverShaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        uniforms: globalUniforms,
        vertexShader: riverVertexShader,
        fragmentShader: riverFragmentShader,
      }),
    []
  );

  const waterfallShaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        uniforms: globalUniforms,
        vertexShader: waterfallVertexShader,
        fragmentShader: waterfallFragmentShader,
      }),
    []
  );

  const cliffRockMat = useMemo(() => {
    const naturalTex = getNaturalCliffRockTexture();
    return new THREE.MeshStandardMaterial({
      map: naturalTex,
      bumpMap: naturalTex,
      bumpScale: 0.42,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.03,
    });
  }, []);

  const mergedVertexColorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.04, side: THREE.DoubleSide }),
    []
  );

  const { riverGeo, farmStreamGeo, farmStreamBedGeo, canyonCliffGeo, curvedWaterfallGeo, mergedLotusGeo, mergedBankFloraGeo, mergedBridgeAndFarmGeo } = useMemo(() => {
    // 1. Ground-Conforming Main River Ribbon (Edges tuck cleanly into the earthen riverbanks — ZERO Floating!)
    const lengthSteps = 120;
    const widthSteps = 10;
    const zStart = -240;
    const zEnd = 238;
    const verts: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= lengthSteps; i++) {
      const v = i / lengthSteps;
      const z = zStart + v * (zEnd - zStart);
      const rawCx = getRiverCenterX(Math.min(165, z));
      const blendToWf = Math.max(0, Math.min(1, (z - 160) / 55));
      const cx = rawCx * (1 - blendToWf) + wfX * blendToWf;
      const poolBulge = z > 195 ? Math.sin(Math.min(1, (z - 195) / 40) * Math.PI) * 12.0 : 0;
      // Organic meandering width variation so riverbanks are never ruler-straight!
      const organicW = Math.sin(z * 0.08) * 1.4 + Math.cos(z * 0.19) * 0.8;
      const halfW = 16.8 + poolBulge + organicW;
      for (let j = 0; j <= widthSteps; j++) {
        const u = j / widthSteps;
        const x = cx + (u - 0.5) * 2.0 * halfW;
        const terrainY = getTerrainHeight(x, z);
        // Outer vertices (j === 0 or j === widthSteps) tuck slightly down into the terrain bank so there is NEVER a floating gap!
        const isEdge = j === 0 || j === widthSteps;
        const y = isEdge ? Math.min(WATER_LEVEL - 0.08, terrainY - 0.05) : WATER_LEVEL;
        verts.push(x, y, z);
        uvs.push(u, v * 18);
      }
    }
    for (let i = 0; i < lengthSteps; i++) {
      for (let j = 0; j < widthSteps; j++) {
        const r0 = i * (widthSteps + 1) + j;
        const r1 = (i + 1) * (widthSteps + 1) + j;
        indices.push(r0, r1, r0 + 1, r0 + 1, r1, r1 + 1);
      }
    }
    const rGeo = new THREE.BufferGeometry();
    rGeo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    rGeo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    rGeo.setIndex(indices);
    rGeo.computeVertexNormals();

    // 2. Winding Farmland Irrigation Stream Water + Stream Bed
    const fsSteps = 40;
    const fsWidthSteps = 6;
    const fsVerts: number[] = [];
    const fsBedVerts: number[] = [];
    const fsUvs: number[] = [];
    const fsIndices: number[] = [];
    const xStart = rX95 - 9.5;
    const xEnd = 170.0;
    for (let i = 0; i <= fsSteps; i++) {
      const t = i / fsSteps;
      const x = xStart + t * (xEnd - xStart);
      const centerZ = 95.0 + Math.sin((246.0 - x) * 0.075) * 2.4;
      const halfW = 4.5 * (1.0 - t * 0.16);
      const bedHalfW = halfW + 1.6;
      const baseWaterY = Math.max(WATER_LEVEL + 0.12, getTerrainHeight(x, centerZ) + 0.28);
      for (let j = 0; j <= fsWidthSteps; j++) {
        const u = j / fsWidthSteps;
        const z = centerZ + (u - 0.5) * 2.0 * halfW;
        const bedZ = centerZ + (u - 0.5) * 2.0 * bedHalfW;
        const isEdge = j === 0 || j === fsWidthSteps;
        fsVerts.push(x, isEdge ? baseWaterY - 0.12 : baseWaterY, z);
        fsBedVerts.push(x, baseWaterY - 0.08, bedZ);
        fsUvs.push(u, t * 7.0);
      }
    }
    for (let i = 0; i < fsSteps; i++) {
      for (let j = 0; j < fsWidthSteps; j++) {
        const a = i * (fsWidthSteps + 1) + j;
        const b = (i + 1) * (fsWidthSteps + 1) + j;
        fsIndices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const fsGeo = new THREE.BufferGeometry();
    fsGeo.setAttribute("position", new THREE.Float32BufferAttribute(fsVerts, 3));
    fsGeo.setAttribute("uv", new THREE.Float32BufferAttribute(fsUvs, 2));
    fsGeo.setIndex(fsIndices);
    fsGeo.computeVertexNormals();

    const fsBedGeo = new THREE.BufferGeometry();
    fsBedGeo.setAttribute("position", new THREE.Float32BufferAttribute(fsBedVerts, 3));
    fsBedGeo.setAttribute("uv", new THREE.Float32BufferAttribute(fsUvs, 2));
    fsBedGeo.setIndex(fsIndices);
    fsBedGeo.computeVertexNormals();

    // 3. Natural Craggy Mountain Gorge
    const segU = 54;
    const segV = 24;
    const cVerts: number[] = [];
    const cUvs: number[] = [];
    const cCols: number[] = [];
    const cIndices: number[] = [];
    const colWetGranite = new THREE.Color("#6e7872");
    const colCragStone = new THREE.Color("#9aa39c");
    const colMossLedge = new THREE.Color("#4a8f2e");
    const tmpCol = new THREE.Color();

    for (let iv = 0; iv <= segV; iv++) {
      const v = iv / segV;
      for (let iu = 0; iu <= segU; iu++) {
        const u = (iu / segU) * 2.0 - 1.0;
        const spreadX = u * 64.0;
        const horseshoeZ = 10.0 - Math.pow(Math.abs(u), 1.35) * 24.0;
        const isCenterNotch = Math.exp(-(u * u) / 0.038);
        const maxPeakH = (28.0 + Math.sin(u * 8.0) * 5.0 + Math.cos(u * 4.0) * 4.5) * (1.0 - isCenterNotch * 0.38);
        let localY = 0;
        let depthOffsetZ = 0;
        if (v < 0.62) {
          const tFace = v / 0.62;
          localY = tFace * maxPeakH;
          depthOffsetZ = tFace * 3.5 - Math.sin(tFace * Math.PI) * 1.6;
        } else if (v < 0.80) {
          const tCrest = (v - 0.62) / 0.18;
          localY = maxPeakH + Math.sin(tCrest * Math.PI) * 2.0;
          depthOffsetZ = 3.5 + tCrest * 15.0;
        } else {
          const tBack = (v - 0.80) / 0.20;
          localY = maxPeakH * (1.0 - tBack);
          depthOffsetZ = 18.5 + tBack * 24.0;
        }
        const nLarge = noise2D(spreadX * 0.09, localY * 0.14 + u * 2.5) * 2.5;
        const nCrag = noise2D(spreadX * 0.26, localY * 0.38) * 1.1;
        const edgeTaper = 1.0 - Math.pow(Math.abs(u), 3.8) * 0.78;
        const finalX = spreadX + nLarge * 0.55;
        const finalY = Math.max(-2.2, localY * edgeTaper - 1.5);
        const finalZ = horseshoeZ + depthOffsetZ + (nLarge + nCrag) * (v < 0.78 ? 0.95 : 0.25);
        cVerts.push(finalX, finalY, finalZ);
        cUvs.push(iu / segU, iv / segV);
        const mossMask = (v > 0.58 && v < 0.86 && Math.abs(u) > 0.13) || (nLarge > 1.1 && Math.abs(u) > 0.2) ? 0.78 : 0.0;
        tmpCol.copy(colCragStone).lerp(colWetGranite, isCenterNotch * 0.6);
        tmpCol.lerp(colMossLedge, mossMask);
        cCols.push(tmpCol.r, tmpCol.g, tmpCol.b);
      }
    }
    for (let iv = 0; iv < segV; iv++) {
      for (let iu = 0; iu < segU; iu++) {
        const a = iv * (segU + 1) + iu;
        const b = (iv + 1) * (segU + 1) + iu;
        cIndices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const cGeo = new THREE.BufferGeometry();
    cGeo.setAttribute("position", new THREE.Float32BufferAttribute(cVerts, 3));
    cGeo.setAttribute("uv", new THREE.Float32BufferAttribute(cUvs, 2));
    cGeo.setAttribute("color", new THREE.Float32BufferAttribute(cCols, 3));
    cGeo.setIndex(cIndices);
    cGeo.computeVertexNormals();

    // 4. Curved Waterfall Sheet
    const wfW = 18;
    const wfH = 24;
    const wfVerts: number[] = [];
    const wfUvs: number[] = [];
    const wfIdx: number[] = [];
    for (let iy = 0; iy <= wfH; iy++) {
      const ty = iy / wfH;
      const y = ty * 17.8 - 0.3;
      const z = 6.2 + Math.pow(ty, 2.0) * 6.5;
      const widthAtHeight = 13.5 - ty * 2.0;
      for (let ix = 0; ix <= wfW; ix++) {
        const tx = ix / wfW;
        const x = (tx - 0.5) * widthAtHeight;
        const rippleZ = Math.sin(tx * Math.PI) * 0.55;
        wfVerts.push(x, y, z - rippleZ);
        wfUvs.push(tx, ty);
      }
    }
    for (let iy = 0; iy < wfH; iy++) {
      for (let ix = 0; ix < wfW; ix++) {
        const a = iy * (wfW + 1) + ix;
        const b = (iy + 1) * (wfW + 1) + ix;
        wfIdx.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const wfGeo = new THREE.BufferGeometry();
    wfGeo.setAttribute("position", new THREE.Float32BufferAttribute(wfVerts, 3));
    wfGeo.setAttribute("uv", new THREE.Float32BufferAttribute(wfUvs, 2));
    wfGeo.setIndex(wfIdx);
    wfGeo.computeVertexNormals();

    // 5. MERGED LOTUS CLUSTERS (Separate mesh so it gently bobs with the river waves in useFrame!)
    const lotusBatch: BatchItem[] = [];
    const bankBatch: BatchItem[] = [];
    const padGeo = new THREE.CylinderGeometry(0.95, 0.95, 0.03, 10);
    const smallPadGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.03, 8);
    const lotusCrownGeo = new THREE.ConeGeometry(0.38, 0.32, 7);
    const lotusInnerGeo = new THREE.ConeGeometry(0.24, 0.38, 6);
    const boulderGeo = new THREE.DodecahedronGeometry(1.0, 1);
    const reedGeo = new THREE.CylinderGeometry(0.04, 0.06, 2.0, 5);
    const cattailTopGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.42, 6);

    const cPad = new THREE.Color("#3f9e2f");
    const cPink = new THREE.Color("#f472b6");
    const cWhite = new THREE.Color("#fff1f2");
    const cGold = new THREE.Color("#facc15");
    const cRock = new THREE.Color("#64748b");
    const cMossRock = new THREE.Color("#4d7c3f");
    const cReed = new THREE.Color("#4d8c2b");
    const cCattail = new THREE.Color("#5c2d16");

    const m4 = new THREE.Matrix4();
    const posV = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const eul = new THREE.Euler();
    const pushItem = (arr: BatchItem[], geo: THREE.BufferGeometry, px: number, py: number, pz: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number, col: THREE.Color) => {
      eul.set(rx, ry, rz);
      quat.setFromEuler(eul);
      posV.set(px, py, pz);
      scl.set(sx, sy, sz);
      m4.compose(posV, quat, scl);
      arr.push({ geo, matrix: m4.clone(), color: col });
    };

    for (let z = -150; z <= 212; z += 13) {
      if (Math.abs(z) < 7.5) continue;
      const rawCx = getRiverCenterX(Math.min(165, z));
      const blend = Math.max(0, Math.min(1, (z - 160) / 55));
      const cx = rawCx * (1 - blend) + wfX * blend;
      const side = Math.floor(z / 13) % 2 === 0 ? -1 : 1;
      [side * (4.8 + (Math.abs(z * 17) % 4)), -side * (6.2 + (Math.abs(z * 23) % 4))].forEach((off, oIdx) => {
        const lx = cx + off;
        const lz = z + oIdx * 4.5;
        const s = 1.12;
        pushItem(lotusBatch, padGeo, lx, WATER_LEVEL + 0.03, lz, 0, z * 0.4, 0, s, 1, s, cPad);
        pushItem(lotusBatch, smallPadGeo, lx + 0.72 * s, WATER_LEVEL + 0.025, lz + 0.4 * s, 0, 0, 0, s, 1, s, cPad);
        pushItem(lotusBatch, lotusCrownGeo, lx, WATER_LEVEL + 0.16, lz, Math.PI, z * 0.5, 0, s, s, s, oIdx === 0 ? cPink : cWhite);
        pushItem(lotusBatch, lotusInnerGeo, lx, WATER_LEVEL + 0.20, lz, 0, z * 0.8, 0, s, s, s, cGold);
      });
    }

    // Grounded Riverbank Boulders, Cattails & Bushes (Embedded into exact getTerrainHeight(bx, bz) so ZERO floating rocks!)
    for (let z = -175; z <= 205; z += 10) {
      if (Math.abs(z) < 6.5) continue;
      const rawCx = getRiverCenterX(Math.min(165, z));
      const blend = Math.max(0, Math.min(1, (z - 160) / 55));
      const cx = rawCx * (1 - blend) + wfX * blend;
      const poolExtra = z > 195 ? Math.sin(Math.min(1, (z - 195) / 40) * Math.PI) * 10.5 : 0;
      const halfW = 14.8 + poolExtra;
      [-1, 1].forEach((dir, dIdx) => {
        if (dir === -1 && z >= 88 && z <= 102) return;
        const bx = cx + dir * (halfW + ((Math.abs(z * 13 + dIdx * 7) % 10) * 0.18));
        const bz = z + (dIdx === 0 ? -1.5 : 1.5);
        // Embed directly into true terrain height (NO Math.max(7.55, ...) that made rocks float in air!)
        const by = getTerrainHeight(bx, bz);
        const kind = Math.abs(Math.floor(z / 10) + dIdx * 3) % 3;
        if (kind === 0) {
          pushItem(bankBatch, boulderGeo, bx, by + 0.05, bz, 0, z * 0.3, 0, 1.35, 0.68, 1.15, cRock);
          pushItem(bankBatch, boulderGeo, bx + 0.85, by - 0.02, bz + 0.4, 0, z, 0, 0.85, 0.52, 0.85, cMossRock);
        } else {
          pushItem(bankBatch, reedGeo, bx, by + 0.82, bz, 0.06, 0, 0.05, 1, 1, 1, cReed);
          pushItem(bankBatch, cattailTopGeo, bx, by + 1.55, bz, 0.06, 0, 0.05, 1, 1, 1, cCattail);
          pushItem(bankBatch, reedGeo, bx + 0.35, by + 0.68, bz + 0.25, -0.08, 0, 0.06, 0.9, 0.85, 0.9, cReed);
          pushItem(bankBatch, cattailTopGeo, bx + 0.35, by + 1.32, bz + 0.25, -0.08, 0, 0.06, 0.9, 0.85, 0.9, cCattail);
          pushItem(bankBatch, boulderGeo, bx - 0.3, by + 0.15, bz, 0, 0, 0, 0.95, 0.58, 0.95, cReed);
        }
      });
    }

    for (let x = 175; x <= rX95 - 16; x += 8.5) {
      if (x >= 208 && x <= 216) continue;
      const cZ = 95.0 + Math.sin((246.0 - x) * 0.075) * 2.4;
      [-1, 1].forEach((dir, dIdx) => {
        const bz = cZ + dir * 4.0;
        const by = getTerrainHeight(x, bz);
        pushItem(bankBatch, boulderGeo, x, by + 0.05, bz, 0, x * 0.4, 0, 0.95, 0.52, 0.85, cRock);
        if ((Math.floor(x) + dIdx) % 2 === 0) {
          pushItem(bankBatch, reedGeo, x + 0.4, by + 0.72, bz, 0.05, 0, 0, 0.85, 0.85, 0.85, cReed);
          pushItem(bankBatch, cattailTopGeo, x + 0.4, by + 1.35, bz, 0.05, 0, 0, 0.85, 0.85, 0.85, cCattail);
        }
      });
    }

    const mLotus = mergeColoredGeos(lotusBatch);
    const mBankFlora = mergeColoredGeos(bankBatch);

    // 6. MERGED FARMLAND PLOTS
    const farmBatch: BatchItem[] = [];
    const furrowGeo = new THREE.CylinderGeometry(0.95, 1.15, 6.8, 7);
    const stalkGeo = new THREE.CylinderGeometry(0.32, 0.14, 0.9, 5);
    const wheatTopGeo = new THREE.DodecahedronGeometry(0.28, 0);
    const pumpkinGeo = new THREE.DodecahedronGeometry(0.40, 1);

    const cSoil = new THREE.Color("#4a2e16");
    const cStalk = new THREE.Color("#eab308");
    const cWheat = new THREE.Color("#facc15");
    const cPumpkin = new THREE.Color("#ea580c");

    const farmOriginX = rX95 - 42;
    const farmOriginZ = 95;

    [-13, -22, 13, 22].forEach((fz, fIdx) => {
      [-12, -7, -2, 3, 8, 13].forEach((rx, rIdx) => {
        const wx = farmOriginX + rx;
        const wz = farmOriginZ + fz;
        const groundY = getTerrainHeight(wx, wz);
        pushItem(farmBatch, furrowGeo, wx, groundY + 0.04, wz, Math.PI / 2, 0, 0, 1.1, 1.0, 0.32, cSoil);
        [-2.2, -0.7, 0.7, 2.2].forEach((cz, zIdx) => {
          const cx = wx;
          const czWorld = wz + cz;
          const cy = getTerrainHeight(cx, czWorld);
          if (fIdx < 2) {
            pushItem(farmBatch, stalkGeo, cx, cy + 0.55, czWorld, 0, 0, 0, 1, 1, 1, cStalk);
            pushItem(farmBatch, wheatTopGeo, cx, cy + 1.05, czWorld, 0, 0, 0, 1.1, 1.4, 1.1, cWheat);
          } else if ((rIdx + zIdx) % 2 === 0) {
            pushItem(farmBatch, pumpkinGeo, cx, cy + 0.32, czWorld, 0, 0, 0, 1.15, 0.8, 1.15, cPumpkin);
          } else {
            pushItem(farmBatch, pumpkinGeo, cx, cy + 0.30, czWorld, 0, 0, 0, 1.2, 0.65, 1.2, cPad);
          }
        });
      });
    });

    const mFarm = mergeColoredGeos(farmBatch);

    return {
      riverGeo: rGeo,
      farmStreamGeo: fsGeo,
      farmStreamBedGeo: fsBedGeo,
      canyonCliffGeo: cGeo,
      curvedWaterfallGeo: wfGeo,
      mergedLotusGeo: mLotus,
      mergedBankFloraGeo: mBankFlora,
      mergedBridgeAndFarmGeo: mFarm,
    };
  }, [rX95]);

  useEffect(() => {
    clearCollidersByTag("waterfall_cliffs");
    addBoxCollider(wfX, wfZ + 16, 94, 24, "waterfall_cliffs");
    addCylinderCollider(wfX - 28, wfZ + 2, 14, "waterfall_cliffs");
    addCylinderCollider(wfX + 28, wfZ + 2, 14, "waterfall_cliffs");
    addCylinderCollider(wfX - 44, wfZ - 6, 13, "waterfall_cliffs");
    addCylinderCollider(wfX + 44, wfZ - 6, 13, "waterfall_cliffs");
    addBoxCollider(rX0, -3.65, 42.0, 0.65, "waterfall_cliffs");
    addBoxCollider(rX0, 3.65, 42.0, 0.65, "waterfall_cliffs");
    addBoxCollider(rX95 - 13.2, 95, 5.2, 4.2, "waterfall_cliffs");
    addBoxCollider(rX95 - 42.0, 70, 9.6, 7.6, "waterfall_cliffs");
    return () => clearCollidersByTag("waterfall_cliffs");
  }, [rX0, rX95]);

  // Real-Time Animation Loop: Guarantee uTime ticks every frame on all water shaders, wheel rotates, & lotus bobs!
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    globalUniforms.uTime.value = t;
    if (riverShaderMat.uniforms?.uTime) riverShaderMat.uniforms.uTime.value = t;
    if (oceanShaderMat.uniforms?.uTime) oceanShaderMat.uniforms.uTime.value = t;
    if (waterfallShaderMat.uniforms?.uTime) waterfallShaderMat.uniforms.uTime.value = t;

    if (mainWheelRef.current) {
      mainWheelRef.current.rotation.z = -t * 1.45;
    }
    if (lotusGroupRef.current) {
      lotusGroupRef.current.position.y = Math.sin(t * 2.4) * 0.028;
    }
  });

  return (
    <group name="world-water-systems">
      {/* 1. Western & Southern Ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-920, 0.0, 0]} material={oceanShaderMat}>
        <planeGeometry args={[900, 2400, 24, 24]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 960]} material={oceanShaderMat}>
        <planeGeometry args={[2400, 900, 24, 24]} />
      </mesh>

      {/* 2. Ground-Conforming Dynamic Flowing Main River */}
      <mesh geometry={riverGeo} material={riverShaderMat} frustumCulled={false} />

      {/* 2B. Farmland Irrigation Stream Bed & Dynamic Flowing Stream */}
      <mesh geometry={farmStreamBedGeo} frustumCulled={false}>
        <meshStandardMaterial color="#6e5d4b" roughness={0.95} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={farmStreamGeo} material={riverShaderMat} frustumCulled={false} />

      {/* 2C. Gentle Wave-Bobbing Lotus Flowers & Lily Pads */}
      <mesh ref={lotusGroupRef} geometry={mergedLotusGeo} material={mergedVertexColorMat} frustumCulled={false} />

      {/* 2D. Ground-Embedded Riverbank Boulders, Cattails & Ferns (Zero Floating!) */}
      <mesh geometry={mergedBankFloraGeo} material={mergedVertexColorMat} frustumCulled={false} />

      {/* 2E. Ground-Conforming Farmland Plots */}
      <mesh geometry={mergedBridgeAndFarmGeo} material={mergedVertexColorMat} receiveShadow frustumCulled={false} />

      {/* 3. Arched Medieval Timber Bridge Centered Over River at Z=0 */}
      <group name="main-river-arched-bridge" position={[rX0, 0, 0]}>
        {[-18, -9, 9, 18].map((bx, bIdx) => (
          <group key={"pier_" + bIdx} position={[bx, 6.2, 0]}>
            <mesh position={[0, 0, -2.8]}><cylinderGeometry args={[0.75, 0.95, 5.2, 8]} /><meshStandardMaterial color="#64748b" roughness={0.85} /></mesh>
            <mesh position={[0, 0, 2.8]}><cylinderGeometry args={[0.75, 0.95, 5.2, 8]} /><meshStandardMaterial color="#64748b" roughness={0.85} /></mesh>
            <mesh position={[0, 2.1, 0]}><boxGeometry args={[1.4, 0.45, 7.2]} /><meshStandardMaterial color="#4a2c14" roughness={0.8} /></mesh>
          </group>
        ))}
        {Array.from({ length: 15 }).map((_, sIdx) => {
          const t = (sIdx - 7) / 7;
          const bx = t * 21.0;
          const archY = 8.0 + (1.0 - t * t) * 1.95;
          const slopeAngle = Math.atan2(-2.0 * t * 1.95, 21.0);
          return (
            <group key={"deck_" + sIdx} position={[bx, archY, 0]} rotation={[0, 0, slopeAngle]}>
              <mesh receiveShadow><boxGeometry args={[3.1, 0.28, 7.6]} /><meshStandardMaterial color="#8c5228" roughness={0.78} /></mesh>
              <mesh position={[0, 0.75, -3.55]}><boxGeometry args={[0.26, 1.45, 0.26]} /><meshStandardMaterial color="#4a2c14" roughness={0.8} /></mesh>
              <mesh position={[0, 0.75, 3.55]}><boxGeometry args={[0.26, 1.45, 0.26]} /><meshStandardMaterial color="#4a2c14" roughness={0.8} /></mesh>
              <mesh position={[0, 1.32, -3.55]}><boxGeometry args={[3.15, 0.18, 0.22]} /><meshStandardMaterial color="#5c3618" roughness={0.78} /></mesh>
              <mesh position={[0, 1.32, 3.55]}><boxGeometry args={[3.15, 0.18, 0.22]} /><meshStandardMaterial color="#5c3618" roughness={0.78} /></mesh>
            </group>
          );
        })}
      </group>

      {/* 4. NATURAL GRANITE MOUNTAIN GORGE & WATERFALL */}
      <group name="grand-waterfall-sanctuary" position={[wfX, WATER_LEVEL, wfZ]}>
        <mesh geometry={canyonCliffGeo} material={cliffRockMat} receiveShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 17.3, 18]} material={riverShaderMat}>
          <planeGeometry args={[12.5, 16.0]} />
        </mesh>
        <mesh geometry={curvedWaterfallGeo} material={waterfallShaderMat} frustumCulled={false} />
        {[3.8, 7.2, 10.8].map((rad, rIdx) => (
          <mesh key={"wf_foam_" + rIdx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 6.2]}>
            <ringGeometry args={[rad, rad + 0.9, 24]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.75 - rIdx * 0.20} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* 5. RIVERBANK A-FRAME WATERWHEEL + FOOTBRIDGE + BARN */}
      <group name="river-watermill-farmland" position={[rX95, 6.65, 95]}>
        <group position={[-13.2, 0.15, 0]}>
          {[-1.45, 1.45].map((sz, sIdx) => (
            <group key={"af_" + sIdx} position={[0, 0, sz]}>
              <mesh position={[0, 0.25, 0]}><boxGeometry args={[4.4, 0.45, 0.42]} /><meshStandardMaterial color="#9c7a44" roughness={0.85} /></mesh>
              <mesh position={[-0.92, 2.25, 0]} rotation={[0, 0, -0.34]}><boxGeometry args={[0.36, 4.2, 0.34]} /><meshStandardMaterial color="#8c6836" roughness={0.82} /></mesh>
              <mesh position={[0.92, 2.25, 0]} rotation={[0, 0, 0.34]}><boxGeometry args={[0.36, 4.2, 0.34]} /><meshStandardMaterial color="#8c6836" roughness={0.82} /></mesh>
              <mesh position={[0, 1.9, 0]} rotation={[0, 0, 0.58]}><boxGeometry args={[0.20, 3.0, 0.22]} /><meshStandardMaterial color="#78582b" roughness={0.85} /></mesh>
              <mesh position={[0, 1.9, 0]} rotation={[0, 0, -0.58]}><boxGeometry args={[0.20, 3.0, 0.22]} /><meshStandardMaterial color="#78582b" roughness={0.85} /></mesh>
              <mesh position={[0, 4.15, 0]}><boxGeometry args={[0.92, 0.60, 0.46]} /><meshStandardMaterial color="#5c401c" roughness={0.85} /></mesh>
            </group>
          ))}
          <mesh position={[-1.8, 0.25, 0]}><boxGeometry args={[0.40, 0.40, 3.3]} /><meshStandardMaterial color="#8c6836" roughness={0.85} /></mesh>
          <mesh position={[1.8, 0.25, 0]}><boxGeometry args={[0.40, 0.40, 3.3]} /><meshStandardMaterial color="#8c6836" roughness={0.85} /></mesh>

          <group position={[0, 4.15, 0]} ref={mainWheelRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.40, 0.40, 3.6, 10]} /><meshStandardMaterial color="#5c401c" roughness={0.85} /></mesh>
            {[-0.98, 0.98].map((wz, wIdx) => (
              <group key={"rim_" + wIdx} position={[0, 0, wz]}>
                <mesh><ringGeometry args={[3.05, 3.85, 24]} /><meshStandardMaterial color="#c4a26a" side={THREE.DoubleSide} roughness={0.78} /></mesh>
                <mesh><torusGeometry args={[3.45, 0.36, 6, 24]} /><meshStandardMaterial color="#b08d57" roughness={0.80} /></mesh>
                {Array.from({ length: 8 }).map((_, spkIdx) => (
                  <mesh key={"spk_" + spkIdx} rotation={[0, 0, (spkIdx / 8) * Math.PI]}>
                    <boxGeometry args={[0.24, 8.0, 0.16]} />
                    <meshStandardMaterial color="#9c7a44" roughness={0.82} />
                  </mesh>
                ))}
              </group>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[3.08, 3.08, 1.92, 20, 1, true]} /><meshStandardMaterial color="#8c6836" side={THREE.DoubleSide} roughness={0.85} /></mesh>
            {Array.from({ length: 12 }).map((_, bIdx) => (
              <group key={"bkt_" + bIdx} rotation={[0, 0, (bIdx / 12) * Math.PI * 2]}>
                <mesh position={[0, 3.45, 0]} rotation={[0.38, 0, 0]}>
                  <boxGeometry args={[0.14, 0.80, 1.95]} />
                  <meshStandardMaterial color="#b08d57" roughness={0.80} />
                </mesh>
              </group>
            ))}
          </group>
        </group>

        <group position={[212 - rX95, 1.45, 0.2]}>
          <mesh receiveShadow><boxGeometry args={[4.2, 0.25, 9.8]} /><meshStandardMaterial color="#8c5228" roughness={0.8} /></mesh>
          <mesh position={[-1.9, 0.6, 0]}><boxGeometry args={[0.22, 1.1, 9.8]} /><meshStandardMaterial color="#5c3618" /></mesh>
          <mesh position={[1.9, 0.6, 0]}><boxGeometry args={[0.22, 1.1, 9.8]} /><meshStandardMaterial color="#5c3618" /></mesh>
        </group>

        <group position={[-42, getTerrainHeight(rX95 - 42, 78) - 6.65, -25]}>
          <mesh position={[0, 0.3, 0]}><boxGeometry args={[9.2, 0.6, 7.2]} /><meshStandardMaterial color="#64748b" roughness={0.9} /></mesh>
          <mesh castShadow receiveShadow position={[0, 2.3, 0]}><boxGeometry args={[8.6, 3.6, 6.6]} /><meshStandardMaterial color="#9a3412" roughness={0.82} /></mesh>
          <mesh position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[6.8, 3.0, 4]} /><meshStandardMaterial color="#78350f" roughness={0.85} /></mesh>
          <mesh position={[0, 1.6, 3.35]}><boxGeometry args={[2.4, 2.6, 0.15]} /><meshStandardMaterial color="#451a03" /></mesh>
        </group>
      </group>
    </group>
  );
}
