"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getRoadFactor } from "@/utils/noise";
import { globalUniforms } from "@/game/systems/globalUniforms";
import { playerFrameState } from "@/game/state/usePlayerStore";

export default function Vegetation() {
  const grassMeshRef = useRef<THREE.InstancedMesh>(null);
  const oakTrunkRef = useRef<THREE.InstancedMesh>(null);
  const oakCrown1Ref = useRef<THREE.InstancedMesh>(null);
  const oakCrown2Ref = useRef<THREE.InstancedMesh>(null);
  const pineTrunkRef = useRef<THREE.InstancedMesh>(null);
  const pineCone1Ref = useRef<THREE.InstancedMesh>(null);
  const pineCone2Ref = useRef<THREE.InstancedMesh>(null);
  const snowPineRef = useRef<THREE.InstancedMesh>(null);
  const mapleTrunkRef = useRef<THREE.InstancedMesh>(null);
  const mapleCrownRef = useRef<THREE.InstancedMesh>(null);
  const flowerRef = useRef<THREE.InstancedMesh>(null);

  const { oaks, pines, snowPines, maples, flowers, grassList } = useMemo(() => {
    const oakList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const pineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const snowPineList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const mapleList: { x: number; y: number; z: number; s: number; r: number }[] = [];
    const flowerList: { x: number; y: number; z: number; s: number; color: THREE.Color }[] = [];
    const gList: { x: number; y: number; z: number; s: number; r: number }[] = [];

    let seed = 4042026;
    const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

    const flowerColors = [
      new THREE.Color("#f43f5e"),
      new THREE.Color("#fbbf24"),
      new THREE.Color("#a855f7"),
      new THREE.Color("#38bdf8"),
      new THREE.Color("#f8fafc"),
    ];

    for (let i = 0; i < 380; i++) {
      const x = (rand() - 0.5) * 860;
      const z = (rand() - 0.5) * 720;
      if (Math.hypot(x, z) > 500) continue;
      if (Math.hypot(x - 360, z) < 110) continue;
      if (Math.hypot(x, z - 390) < 150) continue;
      if (z < -160 || getRoadFactor(x, z) > 0.08) continue;
      const y = getTerrainHeight(x, z);
      if (y > 4.2 && y < 24) oakList.push({ x, y, z, s: 0.9 + rand() * 0.9, r: rand() * Math.PI * 2 });
    }

    for (let i = 0; i < 650; i++) {
      const x = (rand() - 0.5) * 960;
      const z = -120 - rand() * 440;
      if (Math.hypot(x, z) > 560) continue;
      if (Math.hypot(x + 310, z + 310) < 120) continue;
      if (getRoadFactor(x, z) > 0.08) continue;
      const y = getTerrainHeight(x, z);
      if (y > 5.5) {
        const s = 0.8 + rand() * 0.75;
        if (z < -280 && x > -190) snowPineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
        else pineList.push({ x, y, z, s, r: rand() * Math.PI * 2 });
      }
    }

    for (let i = 0; i < 135; i++) {
      const angle = rand() * Math.PI * 2;
      const rad = 22 + rand() * 105;
      const x = -310 + Math.cos(angle) * rad;
      const z = -310 + Math.sin(angle) * rad;
      if (Math.abs(x + 310) < 11 && z > -325 && z < -250) continue;
      const y = getTerrainHeight(x, z);
      if (y > 8) mapleList.push({ x, y, z, s: 0.9 + rand() * 0.65, r: rand() * Math.PI * 2 });
    }

    for (let i = 0; i < 600; i++) {
      const x = (rand() - 0.5) * 880;
      const z = (rand() - 0.4) * 720;
      if (Math.hypot(x, z) > 510 || getRoadFactor(x, z) > 0.12) continue;
      const y = getTerrainHeight(x, z);
      if (y > 4.0 && y < 20) {
        flowerList.push({ x, y, z, s: 0.7 + rand() * 0.6, color: flowerColors[Math.floor(rand() * flowerColors.length)] });
      }
    }

    // 24,000 Soft Multi-Blade Grass Clumps (Dense, fine, lush meadow coverage)
    for (let i = 0; i < 24000; i++) {
      const x = (rand() - 0.5) * 980;
      const z = (rand() - 0.5) * 880;
      if (Math.hypot(x, z) > 515) continue;
      if (z < -260 && x > -190) continue; // No green grass on snow mountain
      const road = getRoadFactor(x, z);
      if (road > 0.35) continue;
      const y = getTerrainHeight(x, z);
      if (y > 3.5 && y < 23.5) {
        gList.push({ x, y, z, s: 0.65 + rand() * 0.55, r: rand() * Math.PI * 2 });
      }
    }

    return { oaks: oakList, pines: pineList, snowPines: snowPineList, maples: mapleList, flowers: flowerList, grassList: gList };
  }, []);

  useEffect(() => {
    const dummy = new THREE.Object3D();

    if (grassMeshRef.current) {
      grassList.forEach((g, i) => {
        dummy.position.set(g.x, g.y - 0.03, g.z);
        dummy.rotation.set(0, g.r, 0);
        dummy.scale.set(g.s, g.s, g.s);
        dummy.updateMatrix();
        grassMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      grassMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (oakTrunkRef.current && oakCrown1Ref.current && oakCrown2Ref.current) {
      oaks.forEach((t, i) => {
        dummy.position.set(t.x, t.y + 2.2 * t.s, t.z);
        dummy.rotation.set(0, t.r, 0);
        dummy.scale.set(t.s, t.s, t.s);
        dummy.updateMatrix();
        oakTrunkRef.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x, t.y + 4.9 * t.s, t.z);
        dummy.scale.set(t.s * 1.45, t.s * 1.05, t.s * 1.45);
        dummy.updateMatrix();
        oakCrown1Ref.current!.setMatrixAt(i, dummy.matrix);

        dummy.position.set(t.x + 0.5 * t.s, t.y + 6.3 * t.s, t.z - 0.3 * t.s);
        dummy.scale.set(t.s * 1.05, t.s * 0.9, t.s * 1.05);
        dummy.updateMatrix();
        oakCrown2Ref.current!.setMatrixAt(i, dummy.matrix);
      });
      oakTrunkRef.current.instanceMatrix.needsUpdate = true;
      oakCrown1Ref.current.instanceMatrix.needsUpdate = true;
      oakCrown2Ref.current.instanceMatrix.needsUpdate = true;
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
  }, [grassList, oaks, pines, snowPines, maples, flowers]);

  useFrame(() => {
    globalUniforms.uPlayerPos.value.set(playerFrameState.x, playerFrameState.y, playerFrameState.z);
  });

  // Soft crossed grass tuft geometry (3 delicate thin blades per clump instead of fat triangle cones!)
  const softGrassGeo = useMemo(() => {
    const b1 = new THREE.PlaneGeometry(0.16, 0.42, 1, 2);
    b1.translate(0, 0.21, 0);
    const b2 = b1.clone().rotateY(Math.PI / 3);
    const b3 = b1.clone().rotateY(-Math.PI / 3);
    const merged = new THREE.BufferGeometry();
    const pos1 = b1.attributes.position.array as Float32Array;
    const pos2 = b2.attributes.position.array as Float32Array;
    const pos3 = b3.attributes.position.array as Float32Array;
    const combined = new Float32Array(pos1.length * 3);
    combined.set(pos1, 0);
    combined.set(pos2, pos1.length);
    combined.set(pos3, pos1.length * 2);
    merged.setAttribute("position", new THREE.BufferAttribute(combined, 3));
    const idx1 = Array.from(b1.index!.array);
    const vCount = b1.attributes.position.count;
    const indices = [...idx1, ...idx1.map((n) => n + vCount), ...idx1.map((n) => n + vCount * 2)];
    merged.setIndex(indices);
    return merged;
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
        "  vDistFade = 1.0 - smoothstep(65.0, 95.0, dist);",
        "  vHeightFrac = clamp(position.y / 0.42, 0.0, 1.0);",
        "  vColorVar = fract(sin(dot(instPos.xz, vec2(12.9898, 78.233))) * 43758.5453);",
        "  vec3 pos = position * vDistFade;",
        "  // Taper blade width at the top so each blade has a fine natural tip",
        "  pos.x *= (1.0 - vHeightFrac * 0.72);",
        "  pos.z *= (1.0 - vHeightFrac * 0.72);",
        "  float windWave = sin(instPos.x * 0.25 + instPos.z * 0.20 + uTime * 2.4) * uWindStrength;",
        "  pos.x += windWave * vHeightFrac * vHeightFrac * 0.22;",
        "  pos.z += cos(instPos.z * 0.18 + uTime * 1.9) * uWindStrength * vHeightFrac * 0.14;",
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
        "  // Base color matches terrain #4d8c40 seamlessly!",
        "  vec3 baseGreen = mix(vec3(0.26, 0.48, 0.22), vec3(0.30, 0.55, 0.25), vColorVar);",
        "  vec3 tipGreen = mix(vec3(0.42, 0.68, 0.28), vec3(0.54, 0.76, 0.34), vColorVar);",
        "  vec3 col = mix(baseGreen, tipGreen, vHeightFrac);",
        "  col = mix(col, col * vec3(0.22, 0.32, 0.48), uNightFactor * 0.82);",
        "  gl_FragColor = vec4(col, 1.0);",
        "}"
      ].join("\n"),
    });
  }, []);

  return (
    <group name="world-vegetation">
      <instancedMesh ref={grassMeshRef} args={[softGrassGeo, grassMaterial, grassList.length]} frustumCulled={false} />

      <instancedMesh ref={oakTrunkRef} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.26, 0.46, 4.5, 8]} />
        <meshStandardMaterial color="#5c3a21" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={oakCrown1Ref} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.5, 1]} />
        <meshStandardMaterial color="#2d6a3e" roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={oakCrown2Ref} args={[undefined, undefined, oaks.length]} frustumCulled={false} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.1, 1]} />
        <meshStandardMaterial color="#3b8246" roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={pineTrunkRef} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.30, 3.2, 6]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={pineCone1Ref} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[2.2, 4.5, 8]} />
        <meshStandardMaterial color="#1b4332" roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={pineCone2Ref} args={[undefined, undefined, pines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[1.7, 3.8, 8]} />
        <meshStandardMaterial color="#23533d" roughness={0.85} />
      </instancedMesh>

      <instancedMesh ref={snowPineRef} args={[undefined, undefined, snowPines.length]} frustumCulled={false} castShadow receiveShadow>
        <coneGeometry args={[1.9, 5.8, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.75} />
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
        <dodecahedronGeometry args={[0.22, 0]} />
        <meshStandardMaterial roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
