"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getExactMeshTerrainHeight, getRoadFactor } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

export default function Vegetation() {
  const grassMeshRef = useRef<THREE.InstancedMesh>(null);
  const oakTrunkRef = useRef<THREE.InstancedMesh>(null);
  const oakCrown1Ref = useRef<THREE.InstancedMesh>(null);
  const oakCrown2Ref = useRef<THREE.InstancedMesh>(null);
  const birchTrunkRef = useRef<THREE.InstancedMesh>(null);
  const birchCrownRef = useRef<THREE.InstancedMesh>(null);
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineCone1Ref = useRef<THREE.InstancedMesh>(null);
  const pineCone2Ref = useRef<THREE.InstancedMesh>(null);
  const snowPineRef = useRef<THREE.InstancedMesh>(null);
  const mapleTrunkRef = useRef<THREE.InstancedMesh>(null);
  const mapleCrownRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);

  const textures = useMemo(() => getWorldTextures(), []);

  const { oaks, birches, pines, snowPines, maples, flowers, grassList } = useMemo(() => {
    const oakList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const birchList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const pineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const snowPineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const mapleList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const flowerList: { x: number; y: number; z: number; s: number; color: THREE.Color }[] = [];
    const gList: { x: number; y: number; z: number; s: number; r: number }[] = [];

    let seed = 4042026;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

    const isInsideSettlement = (x: number, z: number) => {
      if (Math.hypot(x - 365, z) < 115) return true;
      if (Math.hypot(x + 280, z - 240) < 88) return true;
      if (Math.hypot(x + 245, z + 95) < 85) return true;
      if (Math.hypot(x, z - 395) < 165) return true;
      return false;
    };

    const flowerColors = [
      new THREE.Color("#f43f5e"),
      new THREE.Color("#facc15"),
      new THREE.Color("#c084fc"),
      new THREE.Color("#38bdf8"),
      new THREE.Color("#ffffff"),
    ];

    for (let i = 0; i < 820; i++) {
      const x = (rand() - 0.5) * 960;
      const z = (rand() - 0.5) * 820;
      if (Math.hypot(x, z) > 515 || isInsideSettlement(x, z)) continue;
      if (z < -190 || getRoadFactor(x, z) > 0.14) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 4.0 && y < 26) {
        if (i % 3 === 0) birchList.push({ x, y, z, s: 0.95 + rand() * 0.9, r: rand() * Math.PI * 2 });
        else oakList.push({ x, y, z, s: 1.05 + rand() * 1.2, r: rand() * Math.PI * 2 });
      }
    }

    for (let i = 0; i < 780; i++) {
      const x = (rand() - 0.5) * 980;
      const z = -160 + (rand() - 0.65) * 600;
      if (Math.hypot(x, z) > 545 || isInsideSettlement(x, z)) continue;
      if (Math.hypot(x + 310, z + 310) < 115 || getRoadFactor(x, z) > 0.14) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 5.0) {
        const s = 0.85 + rand() * 0.85;
        if (z < -280 && x > -190) snowPineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
        else pineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
      }
    }

    for (let i = 0; i < 140; i++) {
      const angle = rand() * Math.PI * 2;
      const rad = 22 + rand() * 110;
      const x = -310 + Math.cos(angle) * rad;
      const z = -310 + Math.sin(angle) * rad;
      if (Math.abs(x + 310) < 11 && z > -325 && z < -250) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 8) mapleList.push({ x, y, z, s: 0.95 + rand() * 0.7, r: rand() * Math.PI * 2 });
    }

    for (let i = 0; i < 550; i++) {
      const x = (rand() - 0.5) * 860;
      const z = (rand() - 0.4) * 720;
      if (Math.hypot(x, z) > 500 || isInsideSettlement(x, z) || getRoadFactor(x, z) > 0.2) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 4.0 && y < 20) {
        flowerList.push({ x, y, z, s: 0.7 + rand() * 0.6, color: flowerColors[Math.floor(rand() * flowerColors.length)] });
      }
    }

    // 18,000 Optimized Curved Grass Clumps (Ultra-fast GPU vertex count!)
    for (let i = 0; i < 18000; i++) {
      const x = (rand() - 0.5) * 960;
      const z = (rand() - 0.5) * 860;
      if (Math.hypot(x, z) > 515) continue;
      if (z < -260 && x > -190) continue;
      if (getRoadFactor(x, z) > 0.32 || isInsideSettlement(x, z)) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 3.5 && y < 22.0) {
        gList.push({ x, y, z, s: 0.85 + rand() * 0.65, r: rand() * Math.PI * 2 });
      }
    }

    return { oaks: oakList, birches: birchList, pines: pineList, snowPines: snowPineList, maples: mapleList, flowers: flowerList, grassList: gList };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (grassMeshRef.current) {
      grassList.forEach((g, i) => {
        dummy.position.set(g.x, g.y - 0.02, g.z);
        dummy.rotation.set(0, g.r, 0);
        dummy.scale.set(g.s, g.s, g.s);
        dummy.updateMatrix();
        grassMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      grassMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (oakTrunkRef.current && oakCrown1Ref.current && oakCrown2Ref.current) {
      oaks.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 2.5 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        oakTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 5.2 * t.s, t.z);
        dummy.scale.set(t.s * 1.6, t.s * 1.15, t.s * 1.6);
        dummy.updateMatrix();
        oakCrown1Ref.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x + 0.7 * t.s, t.y + 6.4 * t.s, t.z - 0.4 * t.s);
        dummy.scale.set(t.s * 1.25, t.s * 1.0, t.s * 1.25);
        dummy.updateMatrix();
        oakCrown2Ref.current!.setMatrixAt(i, dummy.matrix);
      });
      oakTrunkRef.current.instanceMatrix.needsUpdate = true;
      oakCrown1Ref.current.instanceMatrix.needsUpdate = true;
      oakCrown2Ref.current.instanceMatrix.needsUpdate = true;
    }

    if (birchTrunkRef.current && birchCrownRef.current) {
      birches.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 2.8 * t.s, t.z);
        dummy.rotation.set(0.03, t.r, -0.02);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        birchTrunkRef.current!.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x, t.y + 6.0 * t.s, t.z);
        dummy.scale.set(t.s * 1.35, t.s * 1.5, t.s * 1.35);
        dummy.updateMatrix();
        birchCrownRef.current!.setMatrixAt(i, dummy.matrix);
      });
      birchTrunkRef.current.instanceMatrix.needsUpdate = true;
      birchCrownRef.current.instanceMatrix.needsUpdate = true;
    }

    if (pineTrunkRef.current && pineCone1Ref.current && pineCone2Ref.current) {
      pines.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 1.6 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        pineTrunkRef.current!.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x, t.y + 3.8 * t.s, t.z);
        dummy.scale.set(t.s * 1.2, t.s, t.s * 1.2);
        dummy.updateMatrix();
        pineCone1Ref.current!.setMatrixAt(i, dummy.matrix);
        dummy.position.set(t.x, t.y + 5.8 * t.s, t.z);
        dummy.scale.set(t.s * 0.88, t.s * 0.92, t.s * 0.88);
        dummy.updateMatrix();
        pineCone2Ref.current!.setMatrixAt(i, dummy.matrix);
      });
      pineTrunkRef.current.instanceMatrix.needsUpdate = true;
      pineCone1Ref.current.instanceMatrix.needsUpdate = true;
      pineCone2Ref.current.instanceMatrix.needsUpdate = true;
    }

    if (snowPineRef.current) {
      snowPines.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 3.4 * t.s, t.z);
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
        dummy.scale.set(t.s * 1.5, t.s * 0.95, t.s * 1.5);
        dummy.updateMatrix();
        mapleCrownRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mapleTrunkRef.current.instanceMatrix.needsUpdate = true;
      mapleCrownRef.current.instanceMatrix.needsUpdate = true;
    }

    if (flowerRef.current) {
      flowers.forEach((f, i) => {
        dummy.position.set(f.x, f.y + 0.14, f.z);
        dummy.rotation.set(0, i * 1.1, 0);
        dummy.scale.set(f.s, f.s, f.s);
        dummy.updateMatrix();
        flowerRef.current!.setMatrixAt(i, dummy.matrix);
        flowerRef.current!.setColorAt(i, f.color);
      });
      flowerRef.current.instanceMatrix.needsUpdate = true;
      if (flowerRef.current.instanceColor) flowerRef.current.instanceColor.needsUpdate = true;
    }
  }, [grassList, oaks, birches, pines, snowPines, maples, flowers]);

  useFrame(() => {
    globalUniforms.uPlayerPos.value.set(playerFrameState.x, playerFrameState.y, playerFrameState.z);
  });

  // Lightweight 6-Blade 2-Segment Curved Grass Clump (6x Faster GPU rendering, identical arched look!)
  const curvedGrassClumpGeo = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const bladeCount = 6;
    const segs = 2;
    let vOffset = 0;
    for (let b = 0; b < bladeCount; b++) {
      const angle = (b / bladeCount) * Math.PI * 2 + (b % 2) * 0.3;
      const radOffset = 0.04 + (b % 3) * 0.04;
      const bx = Math.cos(angle) * radOffset;
      const bz = Math.sin(angle) * radOffset;
      const bladeHeight = 0.40 + (b % 3) * 0.12;
      const archDist = 0.22 + (b % 2) * 0.08;
      const baseHalfWidth = 0.032;
      const dirX = Math.cos(angle), dirZ = Math.sin(angle);
      const perpX = -dirZ, perpZ = dirX;
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const y = bladeHeight * (t - 0.18 * t * t);
        const out = archDist * (t * t);
        const w = baseHalfWidth * (1.0 - t * 0.92);
        const cx = bx + dirX * out, cz = bz + dirZ * out;
        positions.push(cx - perpX * w, y, cz - perpZ * w, cx + perpX * w, y, cz + perpZ * w);
      }
      for (let s = 0; s < segs; s++) {
        const r0 = vOffset + s * 2, r1 = r0 + 2;
        indices.push(r0, r0 + 1, r1, r0 + 1, r1 + 1, r1);
      }
      vOffset += (segs + 1) * 2;
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();
    return geom;
  }, []);

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
        "  vDistFade = 1.0 - smoothstep(65.0, 92.0, dist);",
        "  vHeightFrac = clamp(position.y / 0.45, 0.0, 1.0);",
        "  vColorVar = fract(sin(dot(instPos.xz, vec2(12.9898, 78.233))) * 43758.5453);",
        "  vec3 pos = position * vDistFade;",
        "  float windWave = sin(instPos.x * 0.25 + instPos.z * 0.20 + uTime * 2.5) * uWindStrength;",
        "  pos.x += windWave * vHeightFrac * vHeightFrac * 0.22;",
        "  pos.z += cos(instPos.z * 0.18 + uTime * 2.0) * uWindStrength * vHeightFrac * 0.15;",
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
        "  vec3 rootGreen = mix(vec3(0.20, 0.42, 0.14), vec3(0.26, 0.50, 0.18), vColorVar);",
        "  vec3 tipGreen = mix(vec3(0.52, 0.82, 0.24), vec3(0.66, 0.90, 0.30), vColorVar);",
        "  vec3 col = mix(rootGreen, tipGreen, pow(vHeightFrac, 0.75));",
        "  col = mix(col, col * vec3(0.38, 0.48, 0.65), uNightFactor * 0.68);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n"),
    });
  }, []);

  return (
    <group name="world-vegetation">
      <instancedMesh ref={grassMeshRef} args={[curvedGrassClumpGeo, grassMaterial, grassList.length]} frustumCulled={false} />

      <instancedMesh ref={oakTrunkRef} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.34, 0.65, 5.0, 7]} />
        <meshStandardMaterial map={textures.oakBark} color="#7c5333" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={oakCrown1Ref} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[2.7, 1]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#529e3e" roughness={0.78} />
      </instancedMesh>
      <instancedMesh ref={oakCrown2Ref} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#68b849" roughness={0.75} />
      </instancedMesh>

      <instancedMesh ref={birchTrunkRef} args={[undefined, undefined, birches.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.25, 5.6, 7]} />
        <meshStandardMaterial map={textures.birchBark} color="#f8fafc" roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={birchCrownRef} args={[undefined, undefined, birches.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[2.2, 1]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#84cc16" roughness={0.74} />
      </instancedMesh>

      <instancedMesh ref={pineTrunkRef} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.30, 3.2, 6]} />
        <meshStandardMaterial map={textures.oakBark} color="#4a2f1b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={pineCone1Ref} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[2.2, 4.5, 7]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#2d6a31" roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={pineCone2Ref} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[1.7, 3.8, 7]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#3d823b" roughness={0.82} />
      </instancedMesh>

      <instancedMesh ref={snowPineRef} args={[undefined, undefined, snowPines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[2.1, 6.2, 8]} />
        <meshStandardMaterial map={textures.snowFrost} bumpMap={textures.snowFrost} bumpScale={0.08} color="#f1f5f9" roughness={0.72} />
      </instancedMesh>

      <instancedMesh ref={mapleTrunkRef} args={[undefined, undefined, maples.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.34, 4.0, 6]} />
        <meshStandardMaterial map={textures.oakBark} color="#3e2723" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={mapleCrownRef} args={[undefined, undefined, maples.length]} frustumCulled={false} castShadow receiveShadow>
        <icosahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial map={textures.leafFoliage} color="#ef4444" roughness={0.75} />
      </instancedMesh>

      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowers.length]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
