"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { getRiverCenterX, noise2D } from "@/utils/noise";
import { addBoxCollider, addCylinderCollider, clearCollidersByTag } from "@/game/systems/Physics";

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
  "  wp.y += sin(wp.z * 0.15 + uTime * 2.4) * 0.035;",
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
  "  vec2 flowUv = vWorldPos.xz * 0.16 + vec2(0.0, uTime * 0.55);",
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
  "  gl_FragColor = vec4(waterCol, 0.88);",
  "}"
].join("\n");

const waterfallVertexShader = [
  "varying vec2 vUv;",
  "varying vec3 vWorldPos;",
  "void main() {",
  "  vUv = uv;",
  "  vec4 wp = modelMatrix * vec4(position, 1.0);",
  "  vWorldPos = wp.xyz;",
  "  gl_Position = projectionMatrix * viewMatrix * wp;",
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
  "  // Downward rushing water streaks (vUv.y goes 0 at bottom to 1 at top, so +uTime flows DOWN!)",
  "  vec2 flow1 = vec2(vUv.x * 8.0, vUv.y * 4.0 + uTime * 3.4);",
  "  vec2 flow2 = vec2(vUv.x * 18.0, vUv.y * 8.5 + uTime * 5.2);",
  "  float n1 = noiseWf(flow1);",
  "  float n2 = noiseWf(flow2);",
  "  float streaks = smoothstep(0.28, 0.76, n1 * 0.55 + n2 * 0.45);",
  "  float crestFoam = smoothstep(0.78, 1.0, vUv.y) * 0.95;",
  "  float plungeFoam = (1.0 - smoothstep(0.0, 0.30, vUv.y)) * 0.95;",
  "  float sideSoft = smoothstep(0.0, 0.14, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x));",
  "  vec3 aquaBase = mix(vec3(0.22, 0.72, 0.92), vec3(0.06, 0.28, 0.48), uNightFactor * 0.7);",
  "  vec3 pureFoam = mix(vec3(0.97, 0.99, 1.0), vec3(0.62, 0.82, 0.96), uNightFactor * 0.5);",
  "  vec3 finalCol = mix(aquaBase, pureFoam, clamp(streaks * 0.85 + crestFoam + plungeFoam, 0.0, 1.0));",
  "  gl_FragColor = vec4(finalCol, sideSoft * 0.95);",
  "}"
].join("\n");

export default function Water() {
  const mainWheelRef = useRef<THREE.Group>(null);
  const canalWheelRef = useRef<THREE.Group>(null);
  const mistRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cropGroupRef = useRef<THREE.Group>(null);

  const rX0 = useMemo(() => (typeof getRiverCenterX === 'function' ? getRiverCenterX(0) : 258), []);
  const rX95 = useMemo(() => (typeof getRiverCenterX === 'function' ? getRiverCenterX(95) : 254), []);
  const rX205 = useMemo(() => (typeof getRiverCenterX === 'function' ? getRiverCenterX(185) : 242), []);

  // 1. River & Connected Agricultural Canal Ribbon Geometry + Sculpted 3D Mountain Waterfall Canyon Geometry
  const { riverGeo, canyonCliffGeo, curvedWaterfallGeo, lilyPads } = useMemo(() => {
    // A. Main River Ribbon from Z = -240 to Z = +225
    const lengthSteps = 150;
    const widthSteps = 8;
    const zStart = -240;
    const zEnd = 225;
    const verts: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= lengthSteps; i++) {
      const v = i / lengthSteps;
      const z = zStart + v * (zEnd - zStart);
      const cx = typeof getRiverCenterX === 'function' ? getRiverCenterX(z) : 255 + Math.sin(z * 0.015) * 18;
      const halfW = z > 185 ? 22.0 : 14.5;
      for (let j = 0; j <= widthSteps; j++) {
        const u = j / widthSteps;
        const x = cx + (u - 0.5) * 2.0 * halfW;
        verts.push(x, 7.55, z);
        uvs.push(u, v * 16);
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

    // B. Procedural Sculpted 3D Craggy Mountain Canyon & Mossy Cliff Amphitheater (Replaces ugly blobs in image_3415fc.jpg!)
    //    Builds a horseshoe rocky mountain range around (rX205, Z=225) facing North (-Z) toward the river!
    const segU = 72;
    const segV = 36;
    const cVerts: number[] = [];
    const cCols: number[] = [];
    const cIndices: number[] = [];

    const colDarkWetRock = new THREE.Color("#2b332c");
    const colGraniteCliff = new THREE.Color("#4a554c");
    const colLushMoss = new THREE.Color("#3d8226");
    const colHighPeak = new THREE.Color("#57635a");
    const tmpCol = new THREE.Color();

    for (let iv = 0; iv <= segV; iv++) {
      const v = iv / segV; // 0 = base of cliff (Y = 6.5m) up to 1 = mountain crown/back slope
      for (let iu = 0; iu <= segU; iu++) {
        const u = (iu / segU) * 2.0 - 1.0; // -1 (West wing) to 0 (Waterfall center notch) to +1 (East wing)

        // Horseshoe canyon curve opening toward -Z (North, down the river)
        const spreadX = u * 68.0;
        const horseshoeZ = 18.0 - Math.pow(Math.abs(u), 1.45) * 32.0;

        // Vertical & depth profile: rises steeply from v=0..0.65 (cliff face), then rounds over top (v=0.65..0.85) & slopes down back (v=0.85..1.0)
        const isCenterNotch = Math.exp(- (u * u) / 0.045); // U-shaped notch in center for waterfall!
        const maxPeakH = (32.0 + Math.sin(u * 9.0) * 6.5 + Math.cos(u * 4.5) * 5.0) * (1.0 - isCenterNotch * 0.44);

        let localY = 0;
        let depthOffsetZ = 0;
        if (v < 0.65) {
          const tFace = v / 0.65;
          // Overhanging cliff brow profile (like image_340718.jpg)
          localY = tFace * maxPeakH;
          depthOffsetZ = tFace * 4.5 - Math.sin(tFace * Math.PI) * (2.2 * (1.0 - isCenterNotch * 0.6));
        } else if (v < 0.82) {
          const tCrest = (v - 0.65) / 0.17;
          localY = maxPeakH + Math.sin(tCrest * Math.PI) * 2.5;
          depthOffsetZ = 4.5 + tCrest * 16.0;
        } else {
          const tBack = (v - 0.82) / 0.18;
          localY = maxPeakH * (1.0 - tBack); // Back of mountain grounds cleanly at Y=0
          depthOffsetZ = 20.5 + tBack * 26.0;
        }

        // Multi-octave Craggy Rock Strata Displacement
        const nLarge = noise2D(spreadX * 0.08, localY * 0.12 + u * 3.0) * 2.8;
        const nCrag = noise2D(spreadX * 0.24, localY * 0.35) * 1.15;
        const shelf = Math.sin(localY * 0.85 + nLarge * 0.5) * 0.85; // Horizontal rock strata shelves

        const edgeTaper = 1.0 - Math.pow(Math.abs(u), 4.0) * 0.75;
        const finalX = spreadX + nLarge * 0.6;
        const finalY = Math.max(-1.0, localY * edgeTaper - 0.8);
        const finalZ = horseshoeZ + depthOffsetZ + (nLarge + nCrag + shelf) * (v < 0.8 ? 1.0 : 0.3);

        cVerts.push(finalX, finalY, finalZ);

        // Vertex Coloring: Dark wet slate near waterfall, granite on vertical faces, lush green moss on shelves & top crest!
        const mossMask = Math.max(
          v > 0.58 && v < 0.86 ? 0.85 : 0.0,
          shelf > 0.32 && Math.abs(u) > 0.16 ? 0.75 : 0.0
        );
        tmpCol.copy(colGraniteCliff).lerp(colDarkWetRock, isCenterNotch * 0.7);
        if (finalY > 20.0) tmpCol.lerp(colHighPeak, 0.35);
        tmpCol.lerp(colLushMoss, mossMask);
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
    cGeo.setAttribute("color", new THREE.Float32BufferAttribute(cCols, 3));
    cGeo.setIndex(cIndices);
    cGeo.computeVertexNormals();

    // C. Curved 3D Parabolic Cascading Waterfall Sheet Geometry (Flows from Upper Crest Y=18.2m, Z=21m -> Plunge Pool Y=0m, Z=14.5m facing -Z!)
    const wfW = 24;
    const wfH = 32;
    const wfVerts: number[] = [];
    const wfUvs: number[] = [];
    const wfIdx: number[] = [];
    for (let iy = 0; iy <= wfH; iy++) {
      const ty = iy / wfH; // 0 = bottom plunge pool, 1 = top cliff lip
      const y = ty * 18.4;
      // Natural parabolic water arc curving forward (-Z) as it falls over the lip
      const z = 14.5 + Math.pow(ty, 2.2) * 6.2;
      const widthAtHeight = 14.5 - ty * 2.2; // Slightly wider fan at the bottom splash
      for (let ix = 0; ix <= wfW; ix++) {
        const tx = ix / wfW;
        const x = (tx - 0.5) * widthAtHeight;
        const rippleZ = Math.sin(tx * Math.PI) * 0.65;
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
    for (let z = -120; z <= 170; z += 18) {
      const cx = typeof getRiverCenterX === 'function' ? getRiverCenterX(z) : 255;
      pads.push([cx - 5.5, 7.58, z]);
      pads.push([cx + 5.2, 7.58, z + 7]);
    }

    return { riverGeo: rGeo, canyonCliffGeo: cGeo, curvedWaterfallGeo: wfGeo, lilyPads: pads };
  }, [rX205]);

  // Solid Colliders for Waterfall Canyon & Waterwheels
  useEffect(() => {
    clearCollidersByTag("waterfall_cliffs");
    addBoxCollider(rX205, 244, 96, 26, "waterfall_cliffs");
    addCylinderCollider(rX205 - 28, 226, 14, "waterfall_cliffs");
    addCylinderCollider(rX205 + 28, 226, 14, "waterfall_cliffs");
    addBoxCollider(rX95 - 7.5, 95, 5.5, 4.2, "waterfall_cliffs");
    addBoxCollider(rX95 - 26.0, 95, 5.5, 4.2, "waterfall_cliffs");
    return () => clearCollidersByTag("waterfall_cliffs");
  }, [rX205, rX95]);

  // Animate Rotating Waterwheels, Rising Waterfall Mist, & Wind-Swaying Crops Every Frame!
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (mainWheelRef.current) mainWheelRef.current.rotation.z = -t * 1.65;
    if (canalWheelRef.current) canalWheelRef.current.rotation.z = -t * 1.85;
    if (cropGroupRef.current) {
      cropGroupRef.current.rotation.z = Math.sin(t * 2.2) * 0.045;
      cropGroupRef.current.rotation.x = Math.cos(t * 1.7) * 0.025;
    }
    for (let i = 0; i < mistRefs.current.length; i++) {
      const m = mistRefs.current[i];
      if (!m) continue;
      const phase = (t * 0.55 + i * 0.25) % 1.0;
      m.position.y = 0.8 + phase * 3.8;
      m.scale.setScalar(1.0 + Math.sin(phase * Math.PI) * 0.65);
    }
  });

  // Helper to render an Authentic Standalone A-Frame Wooden Waterwheel (Ref: image_340052.jpg) Standing IN the Water
  const renderAFrameWaterwheel = (wheelRef: React.RefObject<THREE.Group | null>, scale = 1.0) => (
    <group scale={[scale, scale, scale]}>
      {/* Submerged Timber Base & A-Frame Legs */}
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

      {/* Rotating Double-Rim Wooden Waterwheel (Bottom paddles dip directly into the river water!) */}
      <group position={[0, 4.15, 0]} ref={wheelRef}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.40, 0.40, 3.6, 14]} /><meshStandardMaterial color="#5c401c" roughness={0.85} /></mesh>
        {[-0.98, 0.98].map((wz, wIdx) => (
          <group key={"rim_" + wIdx} position={[0, 0, wz]}>
            <mesh castShadow receiveShadow><ringGeometry args={[3.05, 3.85, 32]} /><meshStandardMaterial color="#c4a26a" side={THREE.DoubleSide} roughness={0.78} /></mesh>
            <mesh castShadow><torusGeometry args={[3.45, 0.36, 8, 32]} /><meshStandardMaterial color="#b08d57" roughness={0.80} /></mesh>
            {Array.from({ length: 8 }).map((_, spkIdx) => (
              <mesh key={"spk_" + spkIdx} castShadow rotation={[0, 0, (spkIdx / 8) * Math.PI]}>
                <boxGeometry args={[0.24, 8.0, 0.16]} />
                <meshStandardMaterial color="#9c7a44" roughness={0.82} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[3.08, 3.08, 1.92, 28, 1, true]} /><meshStandardMaterial color="#8c6836" side={THREE.DoubleSide} roughness={0.85} /></mesh>
        {Array.from({ length: 16 }).map((_, bIdx) => (
          <group key={"bkt_" + bIdx} rotation={[0, 0, (bIdx / 16) * Math.PI * 2]}>
            <mesh castShadow receiveShadow position={[0, 3.45, 0]} rotation={[0.38, 0, 0]}>
              <boxGeometry args={[0.14, 0.80, 1.95]} />
              <meshStandardMaterial color="#b08d57" roughness={0.80} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Churning White River Foam right where the wheel blades hit the water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.68, 0]}>
        <ringGeometry args={[0.8, 3.2, 24]} />
        <meshBasicMaterial color="#f0f9ff" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );

  return (
    <group name="world-water-systems">
      {/* 1. Western & Southern Ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-920, 0.0, 0]} receiveShadow>
        <planeGeometry args={[900, 2400, 64, 64]} />
        <shaderMaterial transparent uniforms={globalUniforms} vertexShader={oceanVertexShader} fragmentShader={oceanFragmentShader} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0, 960]} receiveShadow>
        <planeGeometry args={[2400, 900, 64, 64]} />
        <shaderMaterial transparent uniforms={globalUniforms} vertexShader={oceanVertexShader} fragmentShader={oceanFragmentShader} />
      </mesh>

      {/* 2. Main Flowing River Channel */}
      <mesh geometry={riverGeo} receiveShadow frustumCulled={false}>
        <shaderMaterial side={THREE.DoubleSide} transparent depthWrite={true} polygonOffset polygonOffsetFactor={-2} uniforms={globalUniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
      </mesh>

      {/* River Water Lilies */}
      {lilyPads.map(([lx, ly, lz], idx) => (
        <group key={"lily_" + idx} position={[lx, ly, lz]}>
          <mesh rotation={[-Math.PI / 2, 0, idx]}><circleGeometry args={[0.65, 12]} /><meshStandardMaterial color="#4d9e34" roughness={0.8} /></mesh>
          <mesh position={[0, 0.08, 0]}><coneGeometry args={[0.22, 0.22, 6]} /><meshStandardMaterial color="#fdf2f8" emissive="#fbcfe8" emissiveIntensity={0.4} /></mesh>
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

      {/* 4. REALISTIC SCULPTED CRAGGY MOUNTAIN GORGE & WATERFALL (Ref: image_340718.jpg — Directly connected to the Southern River Headwaters!) */}
      <group name="grand-waterfall-sanctuary" position={[rX205, 7.45, 222]}>
        {/* Continuous Sculpted Craggy Canyon & Mossy Mountain Range Mesh */}
        <mesh geometry={canyonCliffGeo} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.90} metalness={0.04} />
        </mesh>
        {/* Upper Mountain Lake Pool Behind the Waterfall Crest */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 18.2, 25]}>
          <circleGeometry args={[14, 24]} />
          <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.3} roughness={0.15} />
        </mesh>
        {/* Curved 3D Parabolic Cascading Waterfall Sheet Pouring Into the River Plunge Pool */}
        <mesh geometry={curvedWaterfallGeo} frustumCulled={false}>
          <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} uniforms={globalUniforms} vertexShader={waterfallVertexShader} fragmentShader={waterfallFragmentShader} />
        </mesh>
        {/* Plunge Pool Turquoise Glow & Foam Rings Connecting Seamlessly into the Main River */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 8]}>
          <circleGeometry args={[18, 32]} />
          <shaderMaterial side={THREE.DoubleSide} transparent uniforms={globalUniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
        </mesh>
        {[4.5, 8.2, 12.0].map((rad, rIdx) => (
          <mesh key={"wf_foam_" + rIdx} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 13.5]}>
            <ringGeometry args={[rad, rad + 0.85, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.72 - rIdx * 0.18} side={THREE.DoubleSide} />
          </mesh>
        ))}
        {/* Animated Rising Mist Spray Billboards at Base of Waterfall */}
        {[-5.5, -2.0, 1.5, 5.0].map((mx, mIdx) => (
          <mesh key={"mist_" + mIdx} ref={(el) => { mistRefs.current[mIdx] = el; }} position={[mx, 1.5, 13.0]}>
            <dodecahedronGeometry args={[2.4, 1]} />
            <meshBasicMaterial color="#f0f9ff" transparent opacity={0.26} depthWrite={false} />
          </mesh>
        ))}
        {/* Lush Hanging Ferns & Trees on Top & Sides of the Mossy Cliff (Matching image_340718.jpg!) */}
        {[
          [-11, 10, 11], [11, 10, 11], [-15, 14, 10], [15, 14, 10],
          [-9, 17, 15], [9, 17, 15], [-22, 8, 4], [22, 8, 4],
        ].map(([fx, fy, fz], fIdx) => (
          <group key={"fern_" + fIdx} position={[fx, fy, fz]}>
            {[0, 1, 2, 3, 4].map((leafI) => (
              <mesh key={leafI} rotation={[0.45, (leafI / 5) * Math.PI * 2, 0.3]} position={[0, 0.2, 0]}>
                <coneGeometry args={[0.85, 3.2, 4]} />
                <meshStandardMaterial color="#4d9e34" emissive="#166534" emissiveIntensity={0.18} roughness={0.75} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 5. CONNECTED AGRICULTURAL RIVER BRANCH, SUBMERGED ROTATING A-FRAME WATERWHEELS (image_340052.jpg) & DYNAMIC ORGANIC FARMLAND! */}
      <group name="river-watermill-farmland" position={[rX95, 6.90, 95]}>
        {/* Flowing Agricultural River Branch Channel Carved into the Ground (X = 0 to -82) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-40, 0.66, 0]} receiveShadow>
          <planeGeometry args={[84, 14.5, 32, 8]} />
          <shaderMaterial side={THREE.DoubleSide} transparent depthWrite={true} polygonOffset polygonOffsetFactor={-2} uniforms={globalUniforms} vertexShader={riverVertexShader} fragmentShader={riverFragmentShader} />
        </mesh>

        {/* WATERWHEEL #1: Standing Directly IN the Main River Current (Submerged Paddles, Rotating Continuously!) */}
        <group position={[-7.5, 0.0, 0]}>
          {renderAFrameWaterwheel(mainWheelRef, 1.05)}
        </group>

        {/* WATERWHEEL #2: Standing Directly IN the Agricultural River Branch Feeding the Wooden Irrigation Flume! */}
        <group position={[-26.0, 0.0, 0]}>
          {renderAFrameWaterwheel(canalWheelRef, 0.92)}
        </group>

        {/* Wooden Irrigation Aqueduct Trough Carrying Water from the Waterwheel to the Crop Fields */}
        <group position={[-42, 2.4, -8.5]}>
          <mesh castShadow><boxGeometry args={[32, 0.45, 1.2]} /><meshStandardMaterial color="#8c6836" roughness={0.85} /></mesh>
          <mesh position={[0, 0.24, 0]}><boxGeometry args={[31.8, 0.12, 0.85]} /><meshBasicMaterial color="#38bdf8" /></mesh>
          {[-14, -7, 0, 7, 14].map((px, pIdx) => (
            <mesh key={"aq_post_" + pIdx} position={[px, -1.1, 0]}><cylinderGeometry args={[0.18, 0.22, 2.2, 8]} /><meshStandardMaterial color="#5c401c" /></mesh>
          ))}
        </group>

        {/* DYNAMIC ORGANIC FARMLAND & PLANTATION (Replaces ugly static green boxes in image_34167b.jpg!) */}
        <group position={[-48, 1.15, 0]}>
          {/* Contoured Plowed Earth Furrows (North & South of the River Branch) */}
          {[-16, -27, 15, 26].map((fz, fIdx) => (
            <group key={"organic_field_" + fIdx} position={[0, 0, fz]}>
              {/* Rounded Soil Mound Ridges */}
              {[-12, -8, -4, 0, 4, 8, 12].map((rx, rIdx) => (
                <mesh key={"furrow_" + rIdx} receiveShadow position={[rx, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.2, 1.0, 0.35]}>
                  <cylinderGeometry args={[1.1, 1.3, 8.8, 10]} />
                  <meshStandardMaterial color="#4a2e16" roughness={0.95} />
                </mesh>
              ))}
            </group>
          ))}

          {/* Wind-Swaying Golden Wheat Sheaves, Leafy Vegetable Rosettes, & Pumpkin Vines */}
          <group ref={cropGroupRef}>
            {/* North Fields: Swaying Golden Wheat Stalks & Tasseled Heads (Clustered Organic Sheaves, NOT boxes!) */}
            {[-16, -27].map((fz, fIdx) => (
              <group key={"wheat_field_" + fIdx} position={[0, 0.2, fz]}>
                {[-12, -8, -4, 0, 4, 8, 12].map((cx, cIdx) => (
                  <group key={"wheat_row_" + cIdx} position={[cx, 0, 0]}>
                    {[-3.2, -1.6, 0, 1.6, 3.2].map((cz, zIdx) => (
                      <group key={"sheaf_" + zIdx} position={[0, 0, cz]} rotation={[0, (cIdx + zIdx) * 0.7, 0]}>
                        {[-0.22, 0, 0.22].map(( tilt, tIdx ) => (
                          <group key={tIdx} rotation={[tilt * 0.6, tIdx * 1.1, -tilt]}>
                            <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[0.04, 0.08, 1.1, 6]} /><meshStandardMaterial color="#eab308" roughness={0.75} /></mesh>
                            <mesh castShadow position={[0, 1.15, 0]} scale={[1.0, 1.8, 1.0]}><dodecahedronGeometry args={[0.18, 0]} /><meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.22} roughness={0.65} /></mesh>
                          </group>
                        ))}
                      </group>
                    ))}
                  </group>
                ))}
              </group>
            ))}

            {/* South Fields: Organic Leafy Cabbage/Lettuce Rosettes, Ripe Ribbed Pumpkins, & Wooden Vine Trellises */}
            {[15, 26].map((fz, fIdx) => (
              <group key={"veg_field_" + fIdx} position={[0, 0.2, fz]}>
                {[-12, -8, -4, 0, 4, 8, 12].map((cx, cIdx) => (
                  <group key={"veg_row_" + cIdx} position={[cx, 0, 0]}>
                    {[-3.0, -1.0, 1.0, 3.0].map((cz, zIdx) => (
                      <group key={"plant_" + zIdx} position={[0, 0, cz]}>
                        {/* Lush Multi-Leaf Rosette */}
                        {[0, 1, 2, 3].map((li) => (
                          <mesh key={li} castShadow position={[Math.cos(li * 1.57) * 0.28, 0.22, Math.sin(li * 1.57) * 0.28]} rotation={[0.5, li * 1.57, 0]} scale={[1.2, 0.4, 0.8]}>
                            <sphereGeometry args={[0.38, 8, 6]} />
                            <meshStandardMaterial color="#4d9e34" emissive="#15803d" emissiveIntensity={0.16} roughness={0.75} />
                          </mesh>
                        ))}
                        {/* Ripe Orange Pumpkin or Red Tomato Cluster */}
                        {(cIdx + zIdx) % 2 === 0 ? (
                          <group position={[0, 0.28, 0]}>
                            <mesh castShadow scale={[1.15, 0.82, 1.15]}><dodecahedronGeometry args={[0.42, 1]} /><meshStandardMaterial color="#ea580c" emissive="#9a3412" emissiveIntensity={0.15} roughness={0.55} /></mesh>
                            <mesh position={[0, 0.36, 0]} rotation={[0, 0, 0.2]}><cylinderGeometry args={[0.04, 0.07, 0.22, 6]} /><meshStandardMaterial color="#365314" /></mesh>
                          </group>
                        ) : (
                          <group position={[0, 0.65, 0]}>
                            <mesh castShadow><cylinderGeometry args={[0.05, 0.06, 1.3, 6]} /><meshStandardMaterial color="#78582b" /></mesh>
                            <mesh castShadow position={[0, 0.1, 0]}><dodecahedronGeometry args={[0.45, 1]} /><meshStandardMaterial color="#3f7d28" roughness={0.8} /></mesh>
                            <mesh position={[0.22, 0.15, 0.18]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color="#dc2626" roughness={0.3} /></mesh>
                            <mesh position={[-0.20, -0.05, -0.15]}><sphereGeometry args={[0.11, 8, 8]} /><meshStandardMaterial color="#dc2626" roughness={0.3} /></mesh>
                          </group>
                        )}
                      </group>
                    ))}
                  </group>
                ))}
              </group>
            ))}
          </group>

          {/* Wooden Scarecrow (Orang-orangan Sawah) Guarding the Fields + Split-Rail Farm Fences & Hay Bales */}
          <group position={[0, 0.1, -21]}>
            <mesh castShadow position={[0, 1.2, 0]}><cylinderGeometry args={[0.08, 0.10, 2.4, 8]} /><meshStandardMaterial color="#5c401c" /></mesh>
            <mesh castShadow position={[0, 1.7, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 1.8, 8]} /><meshStandardMaterial color="#5c401c" /></mesh>
            <mesh castShadow position={[0, 1.5, 0]}><coneGeometry args={[0.48, 0.95, 8]} /><meshStandardMaterial color="#b45309" roughness={0.85} /></mesh>
            <mesh castShadow position={[0, 2.15, 0]}><sphereGeometry args={[0.26, 12, 10]} /><meshStandardMaterial color="#fde68a" roughness={0.85} /></mesh>
            <mesh castShadow position={[0, 2.38, 0]}><coneGeometry args={[0.55, 0.45, 12]} /><meshStandardMaterial color="#eab308" roughness={0.8} /></mesh>
          </group>

          {/* Rustic Split-Rail Wooden Fences Framing the Plantation */}
          {[-14, -7, 0, 7, 14].map((fx, fIdx) => (
            <group key={"fence_" + fIdx} position={[fx * 1.1, 0, -9.5]}>
              <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[0.09, 0.11, 1.1, 6]} /><meshStandardMaterial color="#78582b" /></mesh>
              <mesh castShadow position={[0.8, 0.75, 0]}><boxGeometry args={[1.65, 0.10, 0.08]} /><meshStandardMaterial color="#9c7a44" /></mesh>
              <mesh castShadow position={[0.8, 0.40, 0]}><boxGeometry args={[1.65, 0.10, 0.08]} /><meshStandardMaterial color="#9c7a44" /></mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
