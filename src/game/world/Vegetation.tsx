"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope, getRoadFactor } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

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

  // Pre-compute ALL trees, flowers, AND static world grass ONCE at startup (Zero CPU work in useFrame!)
  const { oaks, pines, snowPines, maples, flowers, grassList } = useMemo(() => {
    const oakList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const pineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const snowPineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const mapleList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const flowerList: { x: number; y: number; z: number; s: number; color: THREE.Color }[] = [];
    const gList: { x: number; y: number; z: number; s: number; r: number }[] = [];

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

    // 1. Oaks
    for (let i = 0; i < 340; i++) {
      const x = (rand() - 0.5) * 900;
      const z = (rand() - 0.5) * 760;
      if (Math.hypot(x, z) > 540) continue;
      if (Math.hypot(x - 360, z) < 115) continue;
      if (Math.hypot(x, z - 390) < 145) continue;
      if (z < -160 || getRoadFactor(x, z) > 0.1) continue;
      const y = getTerrainHeight(x, z);
      if (y > 4.5 && y < 24) {
        oakList.push({ x, y, z, s: 0.85 + rand() * 0.95, r: rand() * Math.PI * 2 });
      }
    }

    // 2. Pines & Snow Pines
    for (let i = 0; i < 620; i++) {
      const x = (rand() - 0.5) * 1050;
      const z = -120 - rand() * 480;
      if (Math.hypot(x, z) > 610) continue;
      if (Math.hypot(x + 310, z + 310) < 120) continue;
      if (getRoadFactor(x, z) > 0.1) continue;
      const y = getTerrainHeight(x, z);
      if (y > 6) {
        const s = 0.75 + rand() * 0.75;
        if (y > 26 || z < -310) snowPineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
        else pineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
      }
    }

    // 3. Red Maples at Shrine
    for (let i = 0; i < 125; i++) {
      const angle = rand() * Math.PI * 2;
      const rad = 22 + rand() * 110;
      const x = -310 + Math.cos(angle) * rad;
      const z = -310 + Math.sin(angle) * rad;
      if (Math.abs(x + 310) < 11 && z > -325 && z < -250) continue;
      const y = getTerrainHeight(x, z);
      if (y > 8) mapleList.push({ x, y, z, s: 0.85 + rand() * 0.65, r: rand() * Math.PI * 2 });
    }

    // 4. Wildflowers
    for (let i = 0; i < 550; i++) {
      const x = (rand() - 0.5) * 950;
      const z = (rand() - 0.4) * 750;
      if (Math.hypot(x, z) > 560 || getRoadFactor(x, z) > 0.15) continue;
      const y = getTerrainHeight(x, z);
      if (y > 4.2 && y < 20) {
        flowerList.push({ x, y, z, s: 0.7 + rand() * 0.6, color: flowerColors[Math.floor(rand() * flowerColors.length)] });
      }
    }

    // 5. Static World-Locked Grass Tufts (8,000 tufts placed ONCE at startup -> NEVER moves or lags CPU!)
    for (let i = 0; i < 8000; i++) {
      const x = (rand() - 0.5) * 1180;
      const z = (rand() - 0.5) * 1050;
      if (Math.hypot(x, z) > 590) continue;
      const y = getTerrainHeight(x, z);
      if (y > 3.5 && y < 25.0 && getRoadFactor(x, z) < 0.2) {
        gList.push({ x, y, z, s: 0.85 + rand() * 0.65, r: rand() * Math.PI * 2 });
      }
    }

    return { oaks: oakList, pines: pineList, snowPines: snowPineList, maples: mapleList, flowers: flowerList, grassList: gList };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (grassMeshRef.current) {
      grassList.forEach((g, i) => {
        dummy.position.set(g.x, g.y, g.z);
        dummy.rotation.set(0, g.r, 0);
        dummy.scale.set(g.s, g.s, g.s);
        dummy.updateMatrix();
        grassMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      grassMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (oakTrunkRef.current && oakCrownRef.current) {
      oaks.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 2.2 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        oakTrunkRef.current!.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x, t.y + 5.2 * t.s, t.z);
        dummy.scale.set(t.s * 1.4, t.s * 1.15, t.s * 1.4);
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
        dummy.scale.set(t.s * 1.45, t.s * 0.95, t.s * 1.45);
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
  }, [grassList, oaks, pines, snowPines, maples, flowers]);

  // Only update 1 vector uniform per frame (0.001ms CPU cost!)
  useFrame(() => {
    globalUniforms.uPlayerPos.value.set(playerFrameState.x, playerFrameState.y, playerFrameState.z);
  });

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
        "varying float vColorVar;",
        "varying float vDistFade;",
        "void main() {",
        "  vec4 instPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);",
        "  float dist = distance(instPos.xz, uPlayerPos.xz);",
        "  vDistFade = 1.0 - smoothstep(75.0, 110.0, dist);",
        "  vHeightFrac = clamp(position.y / 0.9, 0.0, 1.0);",
        "  vColorVar = fract(sin(dot(instPos.xz, vec2(12.9898, 78.233))) * 43758.5453);",
        "  vec3 pos = position * vDistFade;",
        "  float windWave = sin(instPos.x * 0.22 + instPos.z * 0.18 + uTime * 2.5) * uWindStrength;",
        "  pos.x += windWave * vHeightFrac * vHeightFrac * 0.35;",
        "  pos.z += cos(instPos.z * 0.16 + uTime * 2.0) * uWindStrength * vHeightFrac * 0.20;",
        "  vec4 worldPos = instanceMatrix * vec4(pos, 1.0);",
        "  gl_Position = projectionMatrix * viewMatrix * worldPos;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uNightFactor;",
        "varying float vHeightFrac;",
        "varying float vColorVar;",
        "varying float vDistFade;",
        "void main() {",
        "  if (vDistFade < 0.05) discard;",
        "  vec3 baseGreen = mix(vec3(0.16, 0.38, 0.15), vec3(0.22, 0.48, 0.18), vColorVar);",
        "  vec3 tipGreen = mix(vec3(0.44, 0.74, 0.26), vec3(0.58, 0.82, 0.32), vColorVar);",
        "  vec3 col = mix(baseGreen, tipGreen, vHeightFrac);",
        "  col = mix(col, col * vec3(0.22, 0.32, 0.48), uNightFactor * 0.82);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n"),
    });
  }, []);

  const grassBladeGeo = useMemo(() => {
    const geo = new THREE.ConeGeometry(0.14, 0.9, 3, 2);
    geo.translate(0, 0.45, 0);
    return geo;
  }, []);

  return (
    <group name="world-vegetation">
      <instancedMesh ref={grassMeshRef} args={[grassBladeGeo, grassMaterial, grassList.length]} frustumCulled={false} />

      <instancedMesh ref={oakTrunkRef} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.45, 4.5, 7]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={oakCrownRef} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshStandardMaterial color="#2d6a3e" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={pineTrunkRef} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.30, 3.6, 6]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={pineConeRef} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[2.1, 6.4, 7]} />
        <meshStandardMaterial color="#1b4332" roughness={0.85} />
      </instancedMesh>

      <instancedMesh ref={snowPineRef} args={[undefined, undefined, snowPines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[1.85, 5.8, 7]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
      </instancedMesh>

      <instancedMesh ref={mapleTrunkRef} args={[undefined, undefined, maples.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.34, 4.0, 7]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={mapleCrownRef} args={[undefined, undefined, maples.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.75} />
      </instancedMesh>

      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowers.length]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.24, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
