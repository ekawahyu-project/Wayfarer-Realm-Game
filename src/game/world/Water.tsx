"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { getRiverCenterX, getTerrainHeight, noise2D } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { addBoxCollider, addCylinderCollider, clearCollidersByTag } from "@/game/systems/Physics";

// Generate 100% Natural Craggy Mountain Rock Texture (Organic Granite Strata, Crevices & Moss — ZERO Brick Lines!)
function createNaturalCliffRockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Base granite tone
  ctx.fillStyle = "#5c6460";
  ctx.fillRect(0, 0, 512, 512);

  let seed = 918273;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  // 1. Organic Geological Rock Strata & Irregular Boulders (No rectangles!)
  for (let i = 0; i < 420; i++) {
    const cx = rand() * 512;
    const cy = rand() * 512;
    const rx = 18 + rand() * 55;
    const ry = 8 + rand() * 24;
    const shade = Math.floor(62 + rand() * 68);
    const greenTint = rand() > 0.72 ? 12 : 0;
    ctx.fillStyle = `rgba(${shade - greenTint}, ${shade + greenTint}, ${shade - 4}, 0.35)`;
    ctx.beginPath();
    for (let a = 0; a < 7; a++) {
      const ang = (a / 7) * Math.PI * 2;
      const jitter = 0.7 + rand() * 0.5;
      const px = cx + Math.cos(ang) * rx * jitter;
      const py = cy + Math.sin(ang) * ry * jitter;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // 2. Natural Jagged Rock Fissures & Cracks
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 95; i++) {
    let x = rand() * 512;
    let y = rand() * 512;
    ctx.strokeStyle = rand() > 0.3 ? "rgba(28, 33, 30, 0.55)" : "rgba(45, 85, 38, 0.45)";
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let s = 0; s < 6; s++) {
      x += (rand() - 0.35) * 38;
      y += (rand() - 0.5) * 18;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 3. Fine Mineral Speckle Grain
  for (let i = 0; i < 2500; i++) {
    const v = Math.floor(45 + rand() * 95);
    ctx.fillStyle = `rgba(${v},${v + 3},${v},0.22)`;
    ctx.fillRect(rand() * 512, rand() * 512, 3, 3);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 4);
  tex.needsUpdate = true;
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

const riverVertexShader = [
  "uniform float uTime;",
  "varying vec3 vWorldPos;",
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  vec4 wp = modelMatrix * vec4(position, 1.0);",
  "  wp.y += sin(wp.z * 0.15 + wp.x * 0.12 + uTime * 2.4) * 0.028;",
  "  vWorldPos = wp.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * wp;",
  "}"
].join("\n");

const riverFragmentShader = [
  "uniform float uTime;",
  "uniform float uNightFactor;",
  "uniform vec3 uSunDir;",
  "uniform vec3 uSunColor;",
  "varying vec3 vWorldPos;",
  "varying vec2 vUv;",
  "float hashR(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
  "float noiseR(vec2 p) {",
  "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
  "  return mix(mix(hashR(i), hashR(i + vec2(1.0, 0.0)), f.x), mix(hashR(i + vec2(0.0, 1.0)), hashR(i + vec2(1.0, 1.0)), f.x), f.y);",
  "}",
  "void main() {",
  "  vec3 viewDir = normalize(cameraPosition - vWorldPos);",
  "  vec2 flowUv = vWorldPos.xz * 0.16 + vec2(uTime * 0.35, uTime * 0.55);",
  "  float n = noiseR(flowUv) * 0.65 + noiseR(flowUv * 2.3 - uTime * 0.3) * 0.35;",
  "  vec3 norm = normalize(vec3((n - 0.5) * 0.35, 1.0, (noiseR(flowUv + 4.2) - 0.5) * 0.35));",
  "  vec3 riverDay = mix(vec3(0.08, 0.68, 0.82), vec3(0.04, 0.45, 0.68), n);",
  "  vec3 riverNight = mix(vec3(0.03, 0.22, 0.36), vec3(0.02, 0.14, 0.26), n);",
  "  vec3 waterCol = mix(riverDay, riverNight, uNightFactor);",
  "  float foam = smoothstep(0.72, 0.92, n) * 0.28;",
  "  waterCol += vec3(0.92, 0.98, 1.0) * foam * (1.0 - uNightFactor * 0.5);",
  "  vec3 halfVec = normalize(normalize(uSunDir) + viewDir);",
  "  float spec = pow(max(dot(norm, halfVec), 0.0), 110.0) * 1.4 + pow(max(dot(norm, halfVec), 0.0), 22.0) * 0.4;",
  "  waterCol += uSunColor * spec * (1.0 - uNightFactor * 0.5);",
  "  gl_FragColor = vec4(waterCol, 0.92);",
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
  "  vec2 flow1 = vec2(vUv.x * 9.0, vUv.y * 4.5 + uTime * 3.6);",
  "  vec2 flow2 = vec2(vUv.x * 20.0, vUv.y * 9.0 + uTime * 5.4);",
  "  float n1 = noiseWf(flow1);",
  "  float n2 = noiseWf(flow2);",
  "  float streaks = smoothstep(0.25, 0.75, n1 * 0.55 + n2 * 0.45);",
  "  float crestFoam = smoothstep(0.80, 1.0, vUv.y) * 0.95;",
  "  float plungeFoam = (1.0 - smoothstep(0.0, 0.25, vUv.y)) * 0.95;",
  "  float sideSoft = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));",
  "  vec3 aquaBase = mix(vec3(0.18, 0.70, 0.90), vec3(0.05, 0.26, 0.45), uNightFactor * 0.7);",
  "  vec3 pureFoam = mix(vec3(0.98, 0.99, 1.0), vec3(0.65, 0.84, 0.96), uNightFactor * 0.5);",
  "  vec3 finalCol = mix(aquaBase, pureFoam, clamp(streaks * 0.85 + crestFoam + plungeFoam, 0.0, 1.0));",
  "  gl_FragColor = vec4(finalCol, sideSoft * 0.96);",
  "}"
].join("\n");

export default function Water() {
  const textures = useMemo(() => getWorldTextures(), []);
  const mainWheelRef = useRef<THREE.Group>(null);

  const rX0 = useMemo(() => getRiverCenterX(0), []);
  const rX95 = useMemo(() => getRiverCenterX(95), []);
  const wfX = 238;
  const wfZ = 224;

  // Natural Craggy Cliff Rock Material (NO BRICKS! Uses procedural granite & moss texture)
  const cliffRockMat = useMemo(() => {
    const naturalTex = createNaturalCliffRockTexture();
    return new THREE.MeshStandardMaterial({
      map: naturalTex,
      bumpMap: naturalTex,
      bumpScale: 0.45,
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.03,
    });
  }, []);

  const foliageMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textures.leafFoliage, color: "#4d9e34", emissive: "#166534", emissiveIntensity: 0.15, roughness: 0.8 }),
    [textures]
  );
  const trunkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ map: textures.oakBark, color: "#6e4726", roughness: 0.88 }),
    [textures]
  );

  const { riverGeo, farmStreamGeo, canyonCliffGeo, curvedWaterfallGeo, lilyPads } = useMemo(() => {
    // 1. Main River Ribbon (Z = -240 to Z = +238)
    const lengthSteps = 160;
    const widthSteps = 8;
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
      const poolBulge = z > 195 ? Math.sin(Math.min(1, (z - 195) / 40) * Math.PI) * 11.5 : 0;
      const halfW = 15.0 + poolBulge;
      for (let j = 0; j <= widthSteps; j++) {
        const u = j / widthSteps;
        const x = cx + (u - 0.5) * 2.0 * halfW;
        verts.push(x, 7.62, z);
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

    // 2. Winding Farmland Irrigation Stream Ribbon (Branches from the Riverbank Waterwheel X=rX95-11, Z=95 -> X=172, Z=95)
    const fsSteps = 48;
    const fsWidthSteps = 4;
    const fsVerts: number[] = [];
    const fsUvs: number[] = [];
    const fsIndices: number[] = [];
    const xStart = rX95 - 10.0;
    const xEnd = 172.0;
    for (let i = 0; i <= fsSteps; i++) {
      const t = i / fsSteps;
      const x = xStart + t * (xEnd - xStart);
      const centerZ = 95.0 + Math.sin((246.0 - x) * 0.085) * 2.6;
      const halfW = 3.4 * (1.0 - t * 0.25);
      for (let j = 0; j <= fsWidthSteps; j++) {
        const u = j / fsWidthSteps;
        const z = centerZ + (u - 0.5) * 2.0 * halfW;
        fsVerts.push(x, 7.60, z);
        fsUvs.push(u, t * 6.0);
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

    // 3. Natural Craggy Mountain Gorge & Mossy Cliff Amphitheater
    const segU = 68;
    const segV = 32;
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
        const finalY = Math.max(-1.8, localY * edgeTaper - 1.2);
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

    // 4. Curved Parabolic Waterfall Sheet
    const wfW = 24;
    const wfH = 32;
    const wfVerts: number[] = [];
    const wfUvs: number[] = [];
    const wfIdx: number[] = [];
    for (let iy = 0; iy <= wfH; iy++) {
      const ty = iy / wfH;
      const y = ty * 17.5;
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

    const pads: [number, number, number][] = [];
    for (let z = -120; z <= 170; z += 20) {
      const cx = getRiverCenterX(z);
      pads.push([cx - 5.5, 7.65, z]);
      pads.push([cx + 5.2, 7.65, z + 8]);
    }

    return { riverGeo: rGeo, farmStreamGeo: fsGeo, canyonCliffGeo: cGeo, curvedWaterfallGeo: wfGeo, lilyPads: pads };
  }, [rX95]);

  // Comprehensive Solid Colliders for Waterfall Cliffs, Bridge Railings, Waterwheel, & Farmland Barn!
  useEffect(() => {
    clearCollidersByTag("waterfall_cliffs");
    // 1. Waterfall Mountain Gorge Colliders (Complete horseshoe barrier)
    addBoxCollider(wfX, wfZ + 16, 94, 24, "waterfall_cliffs");
    addCylinderCollider(wfX - 28, wfZ + 2, 14, "waterfall_cliffs");
    addCylinderCollider(wfX + 28, wfZ + 2, 14, "waterfall_cliffs");
    addCylinderCollider(wfX - 44, wfZ - 6, 13, "waterfall_cliffs");
    addCylinderCollider(wfX + 44, wfZ - 6, 13, "waterfall_cliffs");
    // 2. Main River Bridge Side Handrail Colliders (So player/horse doesn't fall off sides of bridge at Z=0)
    addBoxCollider(rX0, -3.65, 42.0, 0.65, "waterfall_cliffs");
    addBoxCollider(rX0, 3.65, 42.0, 0.65, "waterfall_cliffs");
    // 3. Riverbank Waterwheel & Farmland Granary Barn Colliders
    addBoxCollider(rX95 - 13.2, 95, 5.2, 4.2, "waterfall_cliffs");
    addBoxCollider(rX95 - 42.0, 71, 9.6, 7.6, "waterfall_cliffs");
    return () => clearCollidersByTag("waterfall_cliffs");
  }, [rX0, rX95]);

  useFrame((state) => {
    if (mainWheelRef.current) {
      mainWheelRef.current.rotation.z = -state.clock.elapsedTime * 1.45;
    }
  });

  return (
    <group name="world-water-systems">
      {/* 1. Western & Southern Ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-920, 0.0, 0]} receiveShadow>
        <planeGeometry args={[900, 2400, 48, 48]} />
        <shaderMaterial transparent uniforms={globalUniforms} vertexShader={oceanVertexShader} fragmentShader={oceanFragmentShader} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 960]} receiveShadow>
        <planeGeometry args={[2400, 900, 48, 48]} />
        <shaderMaterial transparent uniforms={globalUniforms} vertexShader={oceanVertexShader} fragmentShader={oceanFragmentShader} />
      </mesh>

      {/* 2. Continuous Main River & Waterfall Plunge Lagoon */}
      <mesh geometry={riverGeo} receiveShadow frustumCulled={false}>
        <shaderMaterial side={THREE.DoubleSide} transparent depthWrite={true} polygonOffset polygonOffsetFactor={-3} uniforms={globalUniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
      </mesh>

      {/* 2B. Connected Winding Irrigation Stream Flowing from the Riverbank Waterwheel Through the Farmland! */}
      <mesh geometry={farmStreamGeo} receiveShadow frustumCulled={false}>
        <shaderMaterial side={THREE.DoubleSide} transparent depthWrite={true} polygonOffset polygonOffsetFactor={-3} uniforms={globalUniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
      </mesh>

      {lilyPads.map(([lx, ly, lz], idx) => (
        <group key={"lily_" + idx} position={[lx, ly, lz]}>
          <mesh rotation={[-Math.PI / 2, 0, idx]}><circleGeometry args={[0.65, 10]} /><meshStandardMaterial color="#4d9e34" roughness={0.8} /></mesh>
          <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.20, 0.20, 6]} /><meshStandardMaterial color="#fdf2f8" emissive="#fbcfe8" emissiveIntensity={0.4} /></mesh>
        </group>
      ))}

      {/* 3. Arched Medieval Timber Bridge Centered Over River at Z=0 */}
      <group name="main-river-arched-bridge" position={[rX0, 0, 0]}>
        {[-18, -9, 9, 18].map((bx, bIdx) => (
          <group key={"pier_" + bIdx} position={[bx, 6.2, 0]}>
            <mesh castShadow receiveShadow position={[0, 0, -2.8]}><cylinderGeometry args={[0.75, 0.95, 5.2, 10]} /><meshStandardMaterial color="#64748b" roughness={0.85} /></mesh>
            <mesh castShadow receiveShadow position={[0, 0, 2.8]}><cylinderGeometry args={[0.75, 0.95, 5.2, 10]} /><meshStandardMaterial color="#64748b" roughness={0.85} /></mesh>
            <mesh position={[0, 2.1, 0]}><boxGeometry args={[1.4, 0.45, 7.2]} /><meshStandardMaterial color="#4a2c14" roughness={0.8} /></mesh>
          </group>
        ))}
        {Array.from({ length: 21 }).map((_, sIdx) => {
          const t = (sIdx - 10) / 10;
          const bx = t * 21.0;
          const archY = 8.0 + (1.0 - t * t) * 1.95;
          const slopeAngle = Math.atan2(-2.0 * t * 1.95, 21.0);
          return (
            <group key={"deck_" + sIdx} position={[bx, archY, 0]} rotation={[0, 0, slopeAngle]}>
              <mesh castShadow receiveShadow><boxGeometry args={[2.25, 0.28, 7.6]} /><meshStandardMaterial color="#8c5228" roughness={0.78} /></mesh>
              <mesh position={[0, 0.02, -3.55]}><boxGeometry args={[2.28, 0.36, 0.35]} /><meshStandardMaterial color="#5c3618" roughness={0.8} /></mesh>
              <mesh position={[0, 0.02, 3.55]}><boxGeometry args={[2.28, 0.36, 0.35]} /><meshStandardMaterial color="#5c3618" roughness={0.8} /></mesh>
              {sIdx % 2 === 0 && (
                <group>
                  <mesh castShadow position={[0, 0.75, -3.55]}><boxGeometry args={[0.26, 1.45, 0.26]} /><meshStandardMaterial color="#4a2c14" roughness={0.8} /></mesh>
                  <mesh castShadow position={[0, 0.75, 3.55]}><boxGeometry args={[0.26, 1.45, 0.26]} /><meshStandardMaterial color="#4a2c14" roughness={0.8} /></mesh>
                </group>
              )}
              <mesh castShadow position={[0, 1.32, -3.55]}><boxGeometry args={[2.32, 0.18, 0.22]} /><meshStandardMaterial color="#5c3618" roughness={0.78} /></mesh>
              <mesh castShadow position={[0, 1.32, 3.55]}><boxGeometry args={[2.32, 0.18, 0.22]} /><meshStandardMaterial color="#5c3618" roughness={0.78} /></mesh>
            </group>
          );
        })}
      </group>

      {/* 4. NATURAL GRANITE MOUNTAIN GORGE & WATERFALL (Zero Brick Pattern!) */}
      <group name="grand-waterfall-sanctuary" position={[wfX, 7.55, wfZ]}>
        <mesh geometry={canyonCliffGeo} material={cliffRockMat} castShadow receiveShadow />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 17.3, 18]}>
          <planeGeometry args={[12.5, 16.0]} />
          <shaderMaterial side={THREE.DoubleSide} transparent uniforms={globalUniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
        </mesh>
        <mesh geometry={curvedWaterfallGeo} frustumCulled={false}>
          <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} uniforms={globalUniforms} vertexShader={waterfallVertexShader} fragmentShader={waterfallFragmentShader} />
        </mesh>
        {[3.8, 7.2, 10.8].map((rad, rIdx) => (
          <mesh key={"wf_foam_" + rIdx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 6.2]}>
            <ringGeometry args={[rad, rad + 0.9, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.75 - rIdx * 0.20} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {[[-9.5, 0.2, 7.5, 2.2], [9.5, 0.2, 7.5, 2.4], [-13.5, 0.4, 3.5, 2.8], [13.5, 0.4, 3.5, 2.6]].map(([rx, ry, rz, rr], rIdx) => (
          <mesh key={"wf_boulder_" + rIdx} castShadow receiveShadow position={[rx, ry, rz]} scale={[1.3, 0.75, 1.1]} material={cliffRockMat}>
            <dodecahedronGeometry args={[rr, 1]} />
          </mesh>
        ))}
        {[
          [-18, 19.5, 14], [18, 19.2, 14], [-32, 16.5, 6], [32, 16.8, 6], [-11, 18.0, 18], [11, 18.0, 18],
        ].map(([tx, ty, tz], tIdx) => (
          <group key={"cliff_tree_" + tIdx} position={[tx, ty, tz]}>
            <mesh castShadow position={[0, 1.8, 0]} material={trunkMat}><cylinderGeometry args={[0.35, 0.52, 3.6, 8]} /></mesh>
            <mesh castShadow position={[0, 4.4, 0]} scale={[1.25, 0.95, 1.25]} material={foliageMat}><dodecahedronGeometry args={[2.6, 1]} /></mesh>
            <mesh castShadow position={[1.2, 3.6, 0.8]} scale={[1.1, 0.85, 1.1]} material={foliageMat}><dodecahedronGeometry args={[1.9, 1]} /></mesh>
          </group>
        ))}
      </group>

      {/* 5. RIVERBANK A-FRAME WATERWHEEL + WINDING IRRIGATION STREAM + STATIC FARMLAND! */}
      <group name="river-watermill-farmland" position={[rX95, 6.85, 95]}>
        {/* SINGLE STANDALONE A-FRAME WATERWHEEL Positioned Right at the Riverbank Edge (X = -13.2) Feeding the Farmland Stream! */}
        <group position={[-13.2, 0.15, 0]}>
          {[-1.45, 1.45].map((sz, sIdx) => (
            <group key={"af_" + sIdx} position={[0, 0, sz]}>
              <mesh castShadow receiveShadow position={[0, 0.25, 0]}><boxGeometry args={[4.4, 0.45, 0.42]} /><meshStandardMaterial color="#9c7a44" roughness={0.85} /></mesh>
              <mesh castShadow receiveShadow position={[-0.92, 2.25, 0]} rotation={[0, 0, -0.34]}><boxGeometry args={[0.36, 4.2, 0.34]} /><meshStandardMaterial color="#8c6836" roughness={0.82} /></mesh>
              <mesh castShadow receiveShadow position={[0.92, 2.25, 0]} rotation={[0, 0, 0.34]}><boxGeometry args={[0.36, 4.2, 0.34]} /><meshStandardMaterial color="#8c6836" roughness={0.82} /></mesh>
              <mesh castShadow position={[0, 1.9, 0]} rotation={[0, 0, 0.58]}><boxGeometry args={[0.20, 3.0, 0.22]} /><meshStandardMaterial color="#78582b" roughness={0.85} /></mesh>
              <mesh castShadow position={[0, 1.9, 0]} rotation={[0, 0, -0.58]}><boxGeometry args={[0.20, 3.0, 0.22]} /><meshStandardMaterial color="#78582b" roughness={0.85} /></mesh>
              <mesh castShadow position={[0, 4.15, 0]}><boxGeometry args={[0.92, 0.60, 0.46]} /><meshStandardMaterial color="#5c401c" roughness={0.85} /></mesh>
            </group>
          ))}
          <mesh castShadow position={[-1.8, 0.25, 0]}><boxGeometry args={[0.40, 0.40, 3.3]} /><meshStandardMaterial color="#8c6836" roughness={0.85} /></mesh>
          <mesh castShadow position={[1.8, 0.25, 0]}><boxGeometry args={[0.40, 0.40, 3.3]} /><meshStandardMaterial color="#8c6836" roughness={0.85} /></mesh>

          <group position={[0, 4.15, 0]} ref={mainWheelRef}>
            <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.40, 0.40, 3.6, 12]} /><meshStandardMaterial color="#5c401c" roughness={0.85} /></mesh>
            {[-0.98, 0.98].map((wz, wIdx) => (
              <group key={"rim_" + wIdx} position={[0, 0, wz]}>
                <mesh><ringGeometry args={[3.05, 3.85, 28]} /><meshStandardMaterial color="#c4a26a" side={THREE.DoubleSide} roughness={0.78} /></mesh>
                <mesh><torusGeometry args={[3.45, 0.36, 8, 28]} /><meshStandardMaterial color="#b08d57" roughness={0.80} /></mesh>
                {Array.from({ length: 8 }).map((_, spkIdx) => (
                  <mesh key={"spk_" + spkIdx} rotation={[0, 0, (spkIdx / 8) * Math.PI]}>
                    <boxGeometry args={[0.24, 8.0, 0.16]} />
                    <meshStandardMaterial color="#9c7a44" roughness={0.82} />
                  </mesh>
                ))}
              </group>
            ))}
            <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[3.08, 3.08, 1.92, 24, 1, true]} /><meshStandardMaterial color="#8c6836" side={THREE.DoubleSide} roughness={0.85} /></mesh>
            {Array.from({ length: 16 }).map((_, bIdx) => (
              <group key={"bkt_" + bIdx} rotation={[0, 0, (bIdx / 16) * Math.PI * 2]}>
                <mesh position={[0, 3.45, 0]} rotation={[0.38, 0, 0]}>
                  <boxGeometry args={[0.14, 0.80, 1.95]} />
                  <meshStandardMaterial color="#b08d57" roughness={0.80} />
                </mesh>
              </group>
            ))}
          </group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.65, 0]}>
            <ringGeometry args={[0.8, 3.2, 20]} />
            <meshBasicMaterial color="#f0f9ff" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Small Wooden Footbridge Crossing the Irrigation Stream at X = 212 (local X = 212 - rX95) */}
        <group position={[212 - rX95, 1.45, 0.5]}>
          <mesh castShadow receiveShadow><boxGeometry args={[4.2, 0.25, 9.5]} /><meshStandardMaterial color="#8c5228" roughness={0.8} /></mesh>
          <mesh castShadow position={[-1.9, 0.6, 0]}><boxGeometry args={[0.22, 1.1, 9.5]} /><meshStandardMaterial color="#5c3618" /></mesh>
          <mesh castShadow position={[1.9, 0.6, 0]}><boxGeometry args={[0.22, 1.1, 9.5]} /><meshStandardMaterial color="#5c3618" /></mesh>
        </group>

        {/* Natural River Boulders Framing the Irrigation Stream Banks */}
        {[-18, -28, -38, -48, -58].map((bx, bIdx) => {
          const worldX = rX95 + bx;
          const cZ = Math.sin((246.0 - worldX) * 0.085) * 2.6;
          return (
            <group key={"stream_rock_" + bIdx}>
              <mesh castShadow receiveShadow position={[bx, 0.75, cZ - 3.6]} scale={[1.3, 0.65, 1.0]} material={cliffRockMat}><dodecahedronGeometry args={[0.95, 1]} /></mesh>
              <mesh castShadow receiveShadow position={[bx + 3, 0.75, cZ + 3.6]} scale={[1.3, 0.65, 1.0]} material={cliffRockMat}><dodecahedronGeometry args={[0.95, 1]} /></mesh>
            </group>
          );
        })}

        {/* STATIC RIVERSIDE FARMLAND FLANKING BOTH SIDES OF THE IRRIGATION STREAM! */}
        {(() => {
          const farmBaseY = getTerrainHeight(rX95 - 42, 82) - 6.85;
          return (
            <group position={[-42, farmBaseY, 0]}>
              {/* Rustic Timber Granary Barn */}
              <group position={[0, 0, -24]}>
                <mesh castShadow receiveShadow position={[0, 0.3, 0]}><boxGeometry args={[9.2, 0.6, 7.2]} /><meshStandardMaterial color="#64748b" roughness={0.9} /></mesh>
                <mesh castShadow receiveShadow position={[0, 2.3, 0]}><boxGeometry args={[8.6, 3.6, 6.6]} /><meshStandardMaterial color="#9a3412" roughness={0.82} /></mesh>
                <mesh castShadow position={[0, 5.2, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[6.8, 3.0, 4]} /><meshStandardMaterial color="#78350f" roughness={0.85} /></mesh>
                <mesh position={[0, 1.6, 3.35]}><boxGeometry args={[2.4, 2.6, 0.15]} /><meshStandardMaterial color="#451a03" /></mesh>
              </group>

              {/* 4 Neat Plowed Soil Plots Placed North (-13, -22) & South (+13, +22) of the Winding Irrigation Stream! */}
              {[-13, -22, 13, 22].map((fz, fIdx) => (
                <group key={"static_plot_" + fIdx} position={[0, 0, fz]}>
                  {[-12, -7, -2, 3, 8, 13].map((rx, rIdx) => (
                    <group key={"row_" + rIdx} position={[rx, 0.08, 0]}>
                      <mesh receiveShadow rotation={[Math.PI / 2, 0, 0]} scale={[1.1, 1.0, 0.32]}>
                        <cylinderGeometry args={[0.95, 1.15, 6.8, 8]} />
                        <meshStandardMaterial color="#4a2e16" roughness={0.95} />
                      </mesh>
                      {[-2.2, -0.7, 0.7, 2.2].map((cz, zIdx) => (
                        <group key={"crop_" + zIdx} position={[0, 0.25, cz]}>
                          {fIdx < 2 ? (
                            <group>
                              <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.32, 0.14, 0.9, 6]} /><meshStandardMaterial color="#eab308" roughness={0.75} /></mesh>
                              <mesh position={[0, 0.95, 0]} scale={[1.1, 1.4, 1.1]}><dodecahedronGeometry args={[0.28, 0]} /><meshStandardMaterial color="#facc15" emissive="#a16207" emissiveIntensity={0.18} roughness={0.65} /></mesh>
                            </group>
                          ) : (rIdx + zIdx) % 2 === 0 ? (
                            <group position={[0, 0.18, 0]}>
                              <mesh scale={[1.15, 0.8, 1.15]}><dodecahedronGeometry args={[0.40, 1]} /><meshStandardMaterial color="#ea580c" roughness={0.55} /></mesh>
                              <mesh position={[0, 0.34, 0]}><cylinderGeometry args={[0.04, 0.06, 0.18, 5]} /><meshStandardMaterial color="#365314" /></mesh>
                            </group>
                          ) : (
                            <mesh position={[0, 0.16, 0]} scale={[1.2, 0.65, 1.2]}>
                              <dodecahedronGeometry args={[0.38, 1]} />
                              <meshStandardMaterial color="#4d9e34" emissive="#15803d" emissiveIntensity={0.14} roughness={0.78} />
                            </mesh>
                          )}
                        </group>
                      ))}
                    </group>
                  ))}
                </group>
              ))}
            </group>
          );
        })()}
      </group>
    </group>
  );
}
