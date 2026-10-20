"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

const GRASS_COUNT = 9500;
const GRASS_RADIUS = 58; // PRD 8.3: Render grass within ~60m of player with smooth edge fade

export default function Vegetation() {
  const grassMeshRef = useRef<THREE.InstancedMesh>(null);
  const oakTrunkRef = useRef<THREE.InstancedMesh>(null);
  const oakCrownRef = useRef<THREE.InstancedMesh>(null);
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineConeRef = useRef<THREE.InstancedMesh>(null);
  const snowPineRef = useRef<THREE.InstancedMesh>(null);
  const mapleTrunkRef = useRef<THREE.InstancedMesh>(null);
  const mapleCrownRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);

  // 1. Pre-compute deterministic tree & wildflower positions across the island
  const { oaks, pines, snowPines, maples, flowers } = useMemo(() => {
    const oakList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const pineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const snowPineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const mapleList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const flowerList: { x: number; y: number; z: number; s: number; color: THREE.Color }[] = [];

    let seed = 4042026;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const flowerColors = [
      new THREE.Color("#f43f5e"),
      new THREE.Color("#fbbf24"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#38bdf8"),
      new THREE.Color("#f8fafc"),
    ];

    // Central & Southern Forest Oaks (220 trees)
    for (let i = 0; i < 340; i++) {
      const x = (rand() - 0.5) * 900;
      const z = (rand() - 0.5) * 760;
      if (Math.sqrt(x * x + z * z) > 540) continue;
      // Keep village center & kingdom center clear for buildings
      if (Math.sqrt(Math.pow(x - 360, 2) + z * z) < 110) continue;
      if (Math.sqrt(x * x + Math.pow(z - 390, 2)) < 140) continue;
      if (z < -160) continue;
      const y = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);
      if (y > 4.5 && y < 24 && slope < 0.65) {
        oakList.push({ x, y, z, s: 0.85 + rand() * 0.95, r: rand() * Math.PI * 2 });
      }
    }

    // Northern Pine Forest & Snowy Mountain Pines (520 trees - Reference Image 2)
    for (let i = 0; i < 650; i++) {
      const x = (rand() - 0.5) * 1050;
      const z = -120 - rand() * 480;
      if (Math.sqrt(x * x + z * z) > 610) continue;
      // Keep NW Shrine terrace clear for Maple trees
      if (Math.sqrt(Math.pow(x + 310, 2) + Math.pow(z + 310, 2)) < 115) continue;
      const y = getTerrainHeight(x, z);
      const slope = getTerrainSlope(x, z);
      if (y > 6 && slope < 0.78) {
        const s = 0.75 + rand() * 0.75;
        if (y > 26 || z < -310) {
          snowPineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
        } else {
          pineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
        }
      }
    }

    // NW Shrine Red Maple Trees (95 trees - Reference Image 3)
    for (let i = 0; i < 120; i++) {
      const angle = rand() * Math.PI * 2;
      const rad = 18 + rand() * 115;
      const x = -310 + Math.cos(angle) * rad;
      const z = -310 + Math.sin(angle) * rad;
      const y = getTerrainHeight(x, z);
      if (y > 8) {
        mapleList.push({ x, y, z, s: 0.85 + rand() * 0.65, r: rand() * Math.PI * 2 });
      }
    }

    // Wildflowers across Meadows & Village outskirts (600 clusters)
    for (let i = 0; i < 600; i++) {
      const x = (rand() - 0.5) * 950;
      const z = (rand() - 0.4) * 750;
      if (Math.sqrt(x * x + z * z) > 560) continue;
      const y = getTerrainHeight(x, z);
      if (y > 4.2 && y < 20) {
        flowerList.push({
          x,
          y,
          z,
          s: 0.7 + rand() * 0.6,
          color: flowerColors[Math.floor(rand() * flowerColors.length)],
        });
      }
    }

    return { oaks: oakList, pines: pineList, snowPines: snowPineList, maples: mapleList, flowers: flowerList };
  }, []);

  // 2. Populate static tree & flower InstancedMeshes once
  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (oakTrunkRef.current && oakCrownRef.current) {
      oaks.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 2.2 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        oakTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 5.2 * t.s, t.z);
        dummy.scale.set(t.s * 1.35, t.s * 1.15, t.s * 1.35);
        dummy.updateMatrix();
        oakCrownRef.current!.setMatrixAt(i, dummy.matrix);
      });
      oakTrunkRef.current.instanceMatrix.needsUpdate = true;
      oakCrownRef.current.instanceMatrix.needsUpdate = true;
    }

    if (pineTrunkRef.current && pineConeRef.current) {
      pines.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 1.8 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        pineTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 5.0 * t.s, t.z);
        dummy.updateMatrix();
        pineConeRef.current!.setMatrixAt(i, dummy.matrix);
      });
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
      pineConeRef.current.instanceMatrix.needsUpdate = true;
    }

    if (snowPineRef.current) {
      snowPines.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 3.6 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        snowPineRef.current!.setMatrixAt(i, dummy.matrix);
      });
      snowPineRef.current.instanceMatrix.needsUpdate = true;
    }

    if (mapleTrunkRef.current && mapleCrownRef.current) {
      maples.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 2.0 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        mapleTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 4.4 * t.s, t.z);
        dummy.scale.set(t.s * 1.4, t.s * 0.95, t.s * 1.4);
        dummy.updateMatrix();
        mapleCrownRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mapleTrunkRef.current.instanceMatrix.needsUpdate = true;
      mapleCrownRef.current.instanceMatrix.needsUpdate = true;
    }

    if (flowerRef.current) {
      flowers.forEach((f, i) => {
        dummy.position.set(f.x, f.y + 0.18, f.z);
        dummy.rotation.set(0, i * 1.1, 0);
        dummy.scale.set(f.s, f.s, f.s);
        dummy.updateMatrix();
        flowerRef.current!.setMatrixAt(i, dummy.matrix);
        flowerRef.current!.setColorAt(i, f.color);
      });
      flowerRef.current.instanceMatrix.needsUpdate = true;
      if (flowerRef.current.instanceColor) flowerRef.current.instanceColor.needsUpdate = true;
    }
  }, [oaks, pines, snowPines, maples, flowers]);

  // 3. Setup 9,500 GPU-instanced grass blades that wrap infinitely around player within 58m radius
  const grassMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: globalUniforms.uTime,
        uWindStrength: globalUniforms.uWindStrength,
        uNightFactor: globalUniforms.uNightFactor,
        uPlayerPos: globalUniforms.uPlayerPos,
      },
      side: THREE.DoubleSide,
      vertexShader: [
        "uniform float uTime;",
        "uniform float uWindStrength;",
        "uniform vec3 uPlayerPos;",
        "varying float vHeightFrac;",
        "varying float vFade;",
        "varying float vColorVar;",

        "void main() {",
        "  vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);",
        "  vHeightFrac = clamp(position.y / 0.85, 0.0, 1.0);",
        "  float dist = distance(instPos.xz, uPlayerPos.xz);",
        "  vFade = 1.0 - smoothstep(42.0, 58.0, dist);",
        "  vColorVar = fract(sin(dot(instPos.xz, vec2(12.9898, 78.233))) * 43758.5453);",

        "  vec3 pos = position;",
        "  // Scale down smoothly at outer radius edge (PRD 8.3)",
        "  pos *= vFade;",
        "  float windWave = sin(instPos.x * 0.18 + instPos.z * 0.14 + uTime * 2.6) * uWindStrength;",
        "  pos.x += windWave * vHeightFrac * vHeightFrac * 0.38;",
        "  pos.z += cos(instPos.z * 0.15 + uTime * 2.1) * uWindStrength * vHeightFrac * 0.22;",

        "  vec4 worldPos = instanceMatrix * vec4(pos, 1.0);",
        "  gl_Position = projectionMatrix * viewMatrix * worldPos;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uNightFactor;",
        "varying float vHeightFrac;",
        "varying float vFade;",
        "varying float vColorVar;",
        "void main() {",
        "  if (vFade < 0.05) discard;",
        "  vec3 baseGreen = mix(vec3(0.18, 0.42, 0.16), vec3(0.24, 0.52, 0.20), vColorVar);",
        "  vec3 tipGreen = mix(vec3(0.46, 0.78, 0.28), vec3(0.62, 0.84, 0.34), vColorVar);",
        "  vec3 col = mix(baseGreen, tipGreen, vHeightFrac);",
        "  col = mix(col, col * vec3(0.22, 0.32, 0.48), uNightFactor * 0.82);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n"),
    });
  }, []);

  // Reposition grass ring around player cleanly whenever player moves > 6m
  const lastGrassCenter = useRef({ x: -9999, z: -9999 });
  const dummyRef = useRef(new THREE.Object3D());

  useFrame(() => {
    globalUniforms.uPlayerPos.value.set(playerFrameState.x, playerFrameState.y, playerFrameState.z);

    const dx = playerFrameState.x - lastGrassCenter.current.x;
    const dz = playerFrameState.z - lastGrassCenter.current.z;
    if (dx * dx + dz * dz > 36 && grassMeshRef.current) {
      lastGrassCenter.current = { x: playerFrameState.x, z: playerFrameState.z };
      const dummy = dummyRef.current;
      const snapX = Math.floor(playerFrameState.x / 4) * 4;
      const snapZ = Math.floor(playerFrameState.z / 4) * 4;

      for (let i = 0; i < GRASS_COUNT; i++) {
        // Deterministic golden-angle spiral distribution around snapped center
        const r = Math.sqrt((i + 0.5) / GRASS_COUNT) * GRASS_RADIUS;
        const theta = i * 2.3999632;
        const gx = snapX + Math.cos(theta) * r;
        const gz = snapZ + Math.sin(theta) * r;
        const gy = getTerrainHeight(gx, gz);
        const slope = getTerrainSlope(gx, gz);

        // Only grow grass on meadow/forest soil (not underwater, on steep cliffs, or high snow)
        if (gy > 3.3 && gy < 27.0 && slope < 0.72) {
          dummy.position.set(gx, gy, gz);
          dummy.rotation.set(0, (i % 12) * 0.52, 0);
          const s = 0.75 + (i % 5) * 0.14;
          dummy.scale.set(s, s, s);
        } else {
          dummy.position.set(0, -100, 0);
          dummy.scale.set(0, 0, 0);
        }
        dummy.updateMatrix();
        grassMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      grassMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const grassBladeGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.11, 0.85, 3, 2);
    geo.translate(0, 0.42, 0);
    return geo;
  }, []);

  return (
    <group name="world-vegetation">
      {/* 9,500 Wind-Animated Instanced Grass Blades */}
      <instancedMesh
        ref={grassMeshRef}
        args={[grassBladeGeo, grassMaterial, GRASS_COUNT]}
        frustumCulled={false}
      />

      {/* Broadleaf Forest Oaks */}
      <instancedMesh ref={oakTrunkRef} args={[undefined, undefined, oaks.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.45, 4.5, 7]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={oakCrownRef} args={[undefined, undefined, oaks.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshStandardMaterial color="#2d6a3e" roughness={0.8} />
      </instancedMesh>

      {/* Northern Green Pines */}
      <instancedMesh ref={pineTrunkRef} args={[undefined, undefined, pines.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.30, 3.6, 6]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={pineConeRef} args={[undefined, undefined, pines.length]} castShadow receiveShadow>
        <coneGeometry args={[2.1, 6.4, 7]} />
        <meshStandardMaterial color="#1b4332" roughness={0.85} />
      </instancedMesh>

      {/* Snow-Covered Mountain Pines (Reference Image 2) */}
      <instancedMesh ref={snowPineRef} args={[undefined, undefined, snowPines.length]} castShadow receiveShadow>
        <coneGeometry args={[1.85, 5.8, 7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
      </instancedMesh>

      {/* Red Maple Trees at NW Shrine (Reference Image 3) */}
      <instancedMesh ref={mapleTrunkRef} args={[undefined, undefined, maples.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.34, 4.0, 7]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={mapleCrownRef} args={[undefined, undefined, maples.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.75} />
      </instancedMesh>

      {/* Wildflower Clusters */}
      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowers.length]}>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
