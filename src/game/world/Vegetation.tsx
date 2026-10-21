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
  const mushroomStemRef = useRef<THREE.InstancedMesh>(null);
  const mushroomCapRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);
  const slabRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);

  const textures = useMemo(() => getWorldTextures(), []);

  const { oaks, birches, pines, snowPines, maples, mushrooms, rocks, slabs, flowers, grassList } = useMemo(() => {
    const oakList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const birchList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const pineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const snowPineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const mapleList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const mushList: { x: number; y: number; z: number; s: number }[] = [];
    const rockList: { x: number; y: number; z: number; sx: number; sy: number; sz: number; r: number }[] = [];
    const slabList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const flowerList: { x: number; y: number; z: number; s: number; color: THREE.Color }[] = [];
    const gList: { x: number; y: number; z: number; s: number; r: number }[] = [];

    let seed = 4042026;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

    const isInsideSettlement = (x: number, z: number) => {
      if (Math.hypot(x - 365, z) < 95) return true; // East Market Village
      if (Math.hypot(x + 280, z - 240) < 68) return true; // SW Fishing Village
      if (Math.hypot(x + 245, z + 95) < 65) return true; // West Forest Village
      if (Math.hypot(x, z - 395) < 135) return true; // Royal Kingdom
      return false;
    };

    const flowerColors = [
      new THREE.Color("#f43f5e"),
      new THREE.Color("#facc15"),
      new THREE.Color("#c084fc"),
      new THREE.Color("#38bdf8"),
      new THREE.Color("#ffffff"),
    ];

    // 1. Ancient Forest Oaks & White Birch Trees (Reference Image 073818)
    for (let i = 0; i < 480; i++) {
      const x = (rand() - 0.5) * 860;
      const z = (rand() - 0.5) * 720;
      if (Math.hypot(x, z) > 495 || isInsideSettlement(x, z)) continue;
      if (z < -170 || getRoadFactor(x, z) > 0.12) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 4.2 && y < 23) {
        if (i % 2 === 0) {
          birchList.push({ x, y, z, s: 0.9 + rand() * 0.85, r: rand() * Math.PI * 2 });
        } else {
          oakList.push({ x, y, z, s: 1.0 + rand() * 1.1, r: rand() * Math.PI * 2 });
        }
      }
    }

    // 2. Layered Spruce / Conifers & Northern Snow Pines
    for (let i = 0; i < 650; i++) {
      const x = (rand() - 0.5) * 960;
      const z = -180 + (rand() - 0.65) * 580;
      if (Math.hypot(x, z) > 540 || isInsideSettlement(x, z)) continue;
      if (Math.hypot(x + 310, z + 310) < 115 || getRoadFactor(x, z) > 0.12) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 5.0) {
        const s = 0.85 + rand() * 0.8;
        if (z < -280 && x > -190) snowPineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
        else pineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
      }
    }

    // 3. Red Maple Trees at NW Shrine
    for (let i = 0; i < 130; i++) {
      const angle = rand() * Math.PI * 2;
      const rad = 22 + rand() * 105;
      const x = -310 + Math.cos(angle) * rad;
      const z = -310 + Math.sin(angle) * rad;
      if (Math.abs(x + 310) < 11 && z > -325 && z < -250) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 8) mapleList.push({ x, y, z, s: 0.9 + rand() * 0.65, r: rand() * Math.PI * 2 });
    }

    // 4. Red-Capped Forest Mushroom Clusters & Mossy Boulders (Reference Image 073818)
    for (let i = 0; i < 240; i++) {
      const x = (rand() - 0.5) * 750;
      const z = (rand() - 0.5) * 650;
      if (Math.hypot(x, z) > 460 || isInsideSettlement(x, z) || getRoadFactor(x, z) > 0.25) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 4.2 && y < 20) {
        mushList.push({ x, y, z, s: 0.5 + rand() * 0.65 });
        if (i % 2 === 0) {
          rockList.push({ x: x + 1.5, y: y - 0.15, z: z + 1.0, sx: 0.9 + rand() * 1.6, sy: 0.6 + rand() * 1.0, sz: 0.9 + rand() * 1.6, r: rand() * Math.PI });
        }
      }
    }

    // 5. Stone Path Slabs along Main Roads (Reference Image 073818 Bottom Right)
    for (let d = -520; d <= 310; d += 4.5) {
      const jx = (rand() - 0.5) * 1.8;
      const jz = (rand() - 0.5) * 1.8;
      const y1 = getExactMeshTerrainHeight(d + jx, jz);
      if (y1 > 3.3) slabList.push({ x: d + jx, y: y1 + 0.03, z: jz, s: 1.1 + rand() * 0.7, r: rand() * Math.PI });
    }
    for (let d = -340; d <= 310; d += 4.5) {
      const jx = (rand() - 0.5) * 1.8;
      const jz = (rand() - 0.5) * 1.8;
      const y2 = getExactMeshTerrainHeight(jx, d + jz);
      if (y2 > 3.3) slabList.push({ x: jx, y: y2 + 0.03, z: d + jz, s: 1.1 + rand() * 0.7, r: rand() * Math.PI });
    }

    // 6. Wildflowers
    for (let i = 0; i < 650; i++) {
      const x = (rand() - 0.5) * 860;
      const z = (rand() - 0.4) * 720;
      if (Math.hypot(x, z) > 500 || isInsideSettlement(x, z) || getRoadFactor(x, z) > 0.2) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 4.0 && y < 20) {
        flowerList.push({ x, y, z, s: 0.7 + rand() * 0.6, color: flowerColors[Math.floor(rand() * flowerColors.length)] });
      }
    }

    // 7. 26,000 Curved Arching Grass Clumps (Reference Image 073715)
    for (let i = 0; i < 26000; i++) {
      const x = (rand() - 0.5) * 960;
      const z = (rand() - 0.5) * 860;
      if (Math.hypot(x, z) > 510) continue;
      if (z < -260 && x > -190) continue;
      if (getRoadFactor(x, z) > 0.32 || isInsideSettlement(x, z)) continue;
      const y = getExactMeshTerrainHeight(x, z);
      if (y > 3.5 && y < 22.0) {
        gList.push({ x, y, z, s: 0.75 + rand() * 0.65, r: rand() * Math.PI * 2 });
      }
    }

    return {
      oaks: oakList, birches: birchList, pines: pineList, snowPines: snowPineList,
      maples: mapleList, mushrooms: mushList, rocks: rockList, slabs: slabList, flowers: flowerList, grassList: gList,
    };
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
        dummy.position.set(t.x, t.y + 2.4 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        oakTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 5.2 * t.s, t.z);
        dummy.scale.set(t.s * 1.55, t.s * 1.1, t.s * 1.55);
        dummy.updateMatrix();
        oakCrown1Ref.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x + 0.6 * t.s, t.y + 6.7 * t.s, t.z - 0.4 * t.s);
        dummy.scale.set(t.s * 1.15, t.s * 0.95, t.s * 1.15);
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
        dummy.scale.set(t.s * 1.25, t.s * 1.45, t.s * 1.25);
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
        dummy.scale.set(t.s * 1.15, t.s, t.s * 1.15);
        dummy.updateMatrix();
        pineCone1Ref.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 5.8 * t.s, t.z);
        dummy.scale.set(t.s * 0.85, t.s * 0.9, t.s * 0.85);
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

    if (mushroomStemRef.current && mushroomCapRef.current) {
      mushrooms.forEach((m, i) => {
        dummy.position.set(m.x, m.y + 0.18 * m.s, m.z);
        dummy.rotation.set(0, i, 0);
        dummy.scale.set(m.s, m.s, m.s);
        dummy.updateMatrix();
        mushroomStemRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(m.x, m.y + 0.36 * m.s, m.z);
        dummy.scale.set(m.s * 1.2, m.s * 0.7, m.s * 1.2);
        dummy.updateMatrix();
        mushroomCapRef.current!.setMatrixAt(i, dummy.matrix);
      });
      mushroomStemRef.current.instanceMatrix.needsUpdate = true;
      mushroomCapRef.current.instanceMatrix.needsUpdate = true;
    }

    if (rockRef.current) {
      rocks.forEach((r, i) => {
        dummy.position.set(r.x, r.y, r.z);
        dummy.rotation.set(0.1, r.r, 0.05);
        dummy.scale.set(r.sx, r.sy, r.sz);
        dummy.updateMatrix();
        rockRef.current!.setMatrixAt(i, dummy.matrix);
      });
      rockRef.current.instanceMatrix.needsUpdate = true;
    }

    if (slabRef.current) {
      slabs.forEach((s, i) => {
        dummy.position.set(s.x, s.y, s.z);
        dummy.rotation.set(0, s.r, 0);
        dummy.scale.set(s.s, 1, s.s * 0.85);
        dummy.updateMatrix();
        slabRef.current!.setMatrixAt(i, dummy.matrix);
      });
      slabRef.current.instanceMatrix.needsUpdate = true;
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
  }, [grassList, oaks, birches, pines, snowPines, maples, mushrooms, rocks, slabs, flowers]);

  useFrame(() => {
    globalUniforms.uPlayerPos.value.set(playerFrameState.x, playerFrameState.y, playerFrameState.z);
  });

  // Curved Arching 9-Blade Grass Clump Geometry matching Reference Image 073715!
  const curvedGrassClumpGeo = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const bladeCount = 9;
    const segs = 4;
    let vOffset = 0;

    for (let b = 0; b < bladeCount; b++) {
      const angle = (b / bladeCount) * Math.PI * 2 + (b % 2) * 0.25;
      const radOffset = 0.04 + (b % 3) * 0.05;
      const bx = Math.cos(angle) * radOffset;
      const bz = Math.sin(angle) * radOffset;
      const bladeHeight = 0.36 + (b % 3) * 0.12;
      const archDist = 0.18 + (b % 2) * 0.10;
      const baseHalfWidth = 0.028;

      const dirX = Math.cos(angle);
      const dirZ = Math.sin(angle);
      const perpX = -dirZ;
      const perpZ = dirX;

      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const y = bladeHeight * (t - 0.18 * t * t); // Graceful arch
        const out = archDist * (t * t); // Curves outward like Reference Image 073715
        const w = baseHalfWidth * (1.0 - t * 0.92); // Sharp tapered tip
        const cx = bx + dirX * out;
        const cz = bz + dirZ * out;
        positions.push(cx - perpX * w, y, cz - perpZ * w);
        positions.push(cx + perpX * w, y, cz + perpZ * w);
      }

      for (let s = 0; s < segs; s++) {
        const r0 = vOffset + s * 2;
        const r1 = r0 + 2;
        indices.push(r0, r0 + 1, r1);
        indices.push(r0 + 1, r1 + 1, r1);
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
        "  vDistFade = 1.0 - smoothstep(68.0, 98.0, dist);",
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
        "  // Vibrant lime-yellow-green tips & deep olive-green roots matching Image 073715",
        "  vec3 rootGreen = mix(vec3(0.20, 0.42, 0.14), vec3(0.26, 0.50, 0.18), vColorVar);",
        "  vec3 tipGreen = mix(vec3(0.52, 0.82, 0.24), vec3(0.66, 0.90, 0.30), vColorVar);",
        "  vec3 col = mix(rootGreen, tipGreen, pow(vHeightFrac, 0.75));",
        "  col = mix(col, col * vec3(0.22, 0.32, 0.48), uNightFactor * 0.82);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n"),
    });
  }, []);

  return (
    <group name="world-vegetation">
      <instancedMesh ref={grassMeshRef} args={[curvedGrassClumpGeo, grassMaterial, grassList.length]} frustumCulled={false} />

      {/* Ancient Gnarled Forest Oaks (Reference Image 073818 Left) */}
      <instancedMesh ref={oakTrunkRef} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.62, 4.8, 9]} />
        <meshStandardMaterial map={textures.oakBark} color="#7c5333" roughness={0.92} />
      </instancedMesh>
      <instancedMesh ref={oakCrown1Ref} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.6, 1]} />
        <meshStandardMaterial color="#36692f" roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={oakCrown2Ref} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.2, 1]} />
        <meshStandardMaterial color="#528c3e" roughness={0.78} />
      </instancedMesh>

      {/* White Birch Trees with Dark Bark Bands (Reference Image 073818 Center & Right) */}
      <instancedMesh ref={birchTrunkRef} args={[undefined, undefined, birches.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.24, 5.6, 8]} />
        <meshStandardMaterial map={textures.birchBark} color="#f8fafc" roughness={0.75} />
      </instancedMesh>
      <instancedMesh ref={birchCrownRef} args={[undefined, undefined, birches.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial color="#65a30d" roughness={0.76} />
      </instancedMesh>

      {/* Layered Spruce / Conifers */}
      <instancedMesh ref={pineTrunkRef} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.30, 3.2, 6]} />
        <meshStandardMaterial map={textures.oakBark} color="#4a2f1b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={pineCone1Ref} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#1e4620" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={pineCone2Ref} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[1.7, 3.8, 8]} />
        <meshStandardMaterial color="#2d5a27" roughness={0.85} />
      </instancedMesh>

      {/* Snow Pines */}
      <instancedMesh ref={snowPineRef} args={[undefined, undefined, snowPines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[1.9, 5.8, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
      </instancedMesh>

      {/* Red Maples */}
      <instancedMesh ref={mapleTrunkRef} args={[undefined, undefined, maples.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.34, 4.0, 7]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={mapleCrownRef} args={[undefined, undefined, maples.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.3, 1]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.75} />
      </instancedMesh>

      {/* Forest Red Mushrooms (Reference Image 073818) */}
      <instancedMesh ref={mushroomStemRef} args={[undefined, undefined, mushrooms.length]} frustumCulled={false}>
        <cylinderGeometry args={[0.08, 0.12, 0.36, 7]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={mushroomCapRef} args={[undefined, undefined, mushrooms.length]} frustumCulled={false}>
        <sphereGeometry args={[0.32, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#dc2626" roughness={0.65} />
      </instancedMesh>

      {/* Mossy Forest Boulders */}
      <instancedMesh ref={rockRef} args={[undefined, undefined, rocks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial color="#64748b" roughness={0.92} />
      </instancedMesh>

      {/* Flagstone Stepping Slabs on Paths (Reference Image 073818 Bottom Right) */}
      <instancedMesh ref={slabRef} args={[undefined, undefined, slabs.length]} frustumCulled={false} receiveShadow>
        <cylinderGeometry args={[1.3, 1.4, 0.08, 7]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </instancedMesh>

      {/* Wildflowers */}
      <instancedMesh ref={flowerRef} args={[undefined, undefined, flowers.length]} frustumCulled={false}>
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
