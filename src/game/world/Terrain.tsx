"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, getRiverDistance, noise2D, BIOME_CENTERS } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { WORLD_CONFIG } from "@/config/world";
import { globalUniforms } from "@/game/systems/globalUniforms";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function Terrain() {
  const textures = useMemo(() => getWorldTextures(), []);

  const { geometry, mountainVistaGeo } = useMemo(() => {
    const size = WORLD_CONFIG.size;
    const segments = WORLD_CONFIG.segments;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cSand = new THREE.Color("#ebd5a7");
    const cLushGrass = new THREE.Color("#529e34");
    const cMeadowGrass = new THREE.Color("#6cb543");
    const cForestFloor = new THREE.Color("#3b7524");
    const cAutumnGrass = new THREE.Color("#c27828");
    const cFarmlandSoil = new THREE.Color("#6e4726");
    const cDirtPath = new THREE.Color("#a8895e");
    const cRiverBed = new THREE.Color("#2d7780");
    const cPlazaStone = new THREE.Color("#9e9284");
    const cRock = new THREE.Color("#788696");
    const cSnow = new THREE.Color("#f8fbff");
    const temp = new THREE.Color();

    const eastX = BIOME_CENTERS?.eastVillage?.x ?? 295;
    const eastZ = BIOME_CENTERS?.eastVillage?.z ?? 0;
    const swX = BIOME_CENTERS?.swVillage?.x ?? -280;
    const swZ = BIOME_CENTERS?.swVillage?.z ?? 175;
    const wfX = BIOME_CENTERS?.westForestVillage?.x ?? -245;
    const wfZ = BIOME_CENTERS?.westForestVillage?.z ?? -32;
    const shX = BIOME_CENTERS?.nwShrine?.x ?? -310;
    const shZ = BIOME_CENTERS?.nwShrine?.z ?? -260;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = getTerrainHeight(x, z);
      pos.setY(i, y);

      const n = noise2D(x * 0.015, z * 0.015) * 0.5 + 0.5;
      temp.copy(cLushGrass).lerp(cMeadowGrass, n);

      if (x > 90 && x < 240 && Math.abs(z) < 170) {
        const fBlend = (1 - Math.abs(x - 165) / 80) * (1 - Math.abs(z) / 170);
        temp.lerp(cForestFloor, Math.max(0, Math.min(1, fBlend * 0.65)));
      }

      // Golden Autumn Maple Shrine Ground (Protected from Snow!)
      const distShrine = Math.hypot(x - shX, z - shZ);
      if (distShrine < 125) {
        temp.lerp(cAutumnGrass, Math.min(1, (1 - distShrine / 125) * 0.88));
      }

      // Farmland & Plantation Rich Soil near River Branch (X=195, Z=85)
      const distFarm = Math.hypot(x - 190, z - 85);
      if (distFarm < 58) {
        temp.lerp(cFarmlandSoil, (1.0 - smoothstep(28, 58, distFarm)) * 0.65);
      }

      const distEast = Math.min(Math.hypot(x - eastX, z - eastZ), Math.hypot(x - 360, z));
      const distSW = Math.min(Math.hypot(x - swX, z - swZ), Math.hypot(x - -280, z - 240));
      const distWest = Math.min(Math.hypot(x - wfX, z - wfZ), Math.hypot(x - -245, z - -95));
      const distKingdom = Math.hypot(x - 0, z - 400);
      const minPlazaDist = Math.min(distEast, distSW, distWest, distKingdom * 0.70);
      if (minPlazaDist < 84) {
        const pBlend = 1.0 - smoothstep(50, 84, minPlazaDist);
        temp.lerp(cPlazaStone, pBlend * 0.92);
      }

      const distPathEW = Math.abs(z) < 28 && x > -460 && x < 420 ? 1 - Math.abs(z) / 28 : 0;
      const distPathNS = Math.abs(x) < 28 && z > -360 && z < 520 ? 1 - Math.abs(x) / 28 : 0;
      const pathFactor = Math.max(distPathEW, distPathNS);
      if (pathFactor > 0.25 && minPlazaDist >= 68) {
        temp.lerp(cDirtPath, (pathFactor - 0.25) * 0.75);
      }

      const rDist = getRiverDistance(x, z);
      if (rDist < 24.0) {
        const rBlend = 1.0 - smoothstep(8.0, 24.0, rDist);
        temp.lerp(cRiverBed, rBlend * 0.95);
      }

      if (y < 6.0 && rDist >= 22.0) {
        const sandBlend = 1.0 - smoothstep(1.5, 6.0, y);
        temp.lerp(cSand, sandBlend * 0.55);
      }

      // STRICT SNOW BIOME MASK: ONLY in the Northern Snow Mountains (z < -230 AND x > -175 so NW Shrine & South Kingdom NEVER turn into snow!)
      if (z < -220 && x > -185) {
        const northMask = smoothstep(-220, -295, z);
        const eastOfShrineMask = smoothstep(-185, -125, x);
        const snowFactor = northMask * eastOfShrineMask;
        if (y > 14 && y <= 24) temp.lerp(cRock, snowFactor * 0.45);
        temp.lerp(cSnow, snowFactor);
      }

      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const vistaGeo = new THREE.CylinderGeometry(770, 795, 110, 160, 12, true);
    const vPos = vistaGeo.attributes.position;
    const vCols = new Float32Array(vPos.count * 3);
    for (let i = 0; i < vPos.count; i++) {
      const vx = vPos.getX(i);
      const vy = vPos.getY(i);
      const vz = vPos.getZ(i);
      const angle = Math.atan2(vz, vx);
      const hNorm = Math.max(0, (vy + 55.0) / 110.0);
      const oceanMask = smoothstep(-0.85, -0.25, Math.cos(angle - 2.35));
      const wave = 0.5 + 0.25 * Math.sin(angle * 4.0 + 0.8) + 0.15 * Math.cos(angle * 9.0) + 0.10 * Math.sin(angle * 15.0);
      const ridgeH = (12.0 + wave * 38.0) * oceanMask;
      const finalY = Math.pow(hNorm, 1.15) * ridgeH - 4.0;
      vPos.setY(i, finalY);
      vCols[i * 3] = hNorm;
      vCols[i * 3 + 1] = hNorm;
      vCols[i * 3 + 2] = hNorm;
    }
    vistaGeo.setAttribute("color", new THREE.BufferAttribute(vCols, 3));
    vistaGeo.computeVertexNormals();

    return { geometry: geo, mountainVistaGeo: vistaGeo };
  }, []);

  const terrainMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: textures.terrainDetail,
      bumpMap: textures.terrainDetail,
      bumpScale: 0.04,
      roughness: 0.85,
      metalness: 0.02,
    });

    mat.customProgramCacheKey = () => "terrain-strict-snow-no-kingdom-bug-v8";
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uSkyHorizon = globalUniforms.uSkyHorizon;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vWorldPosTerrain;"
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        "#include <worldpos_vertex>\nvWorldPosTerrain = (modelMatrix * vec4(transformed, 1.0)).xyz;"
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        [
          "#include <common>",
          "uniform vec3 uSkyHorizon;",
          "varying vec3 vWorldPosTerrain;",
          "float hashTerrain(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
          "float noiseTerrain(vec2 p) {",
          "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
          "  return mix(mix(hashTerrain(i), hashTerrain(i + vec2(1.0, 0.0)), f.x), mix(hashTerrain(i + vec2(0.0, 1.0)), hashTerrain(i + vec2(1.0, 1.0)), f.x), f.y);",
          "}",
        ].join("\n")
      );
      // Strict Snow Mask ONLY in North Snow Biome (z < -225 && x > -180) so Kingdom & Shrine NEVER get snow!
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        [
          "#ifdef USE_MAP",
          "  vec4 sampledDiffuseColor = texture2D( map, vMapUv );",
          "  float snowBiomeMask = smoothstep(-220.0, -290.0, vWorldPosTerrain.z) * smoothstep(-185.0, -125.0, vWorldPosTerrain.x);",
          "  float coastMask = max(smoothstep(-330.0, -415.0, vWorldPosTerrain.x), smoothstep(390.0, 460.0, vWorldPosTerrain.z));",
          "  float nonGrassMask = clamp(max(snowBiomeMask, coastMask), 0.0, 1.0);",
          "  sampledDiffuseColor.rgb = mix(sampledDiffuseColor.rgb, vec3(0.99), nonGrassMask);",
          "  diffuseColor *= sampledDiffuseColor;",
          "#endif",
        ].join("\n")
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        [
          "#include <color_fragment>",
          "float snowBiomeMask2 = smoothstep(-220.0, -290.0, vWorldPosTerrain.z) * smoothstep(-185.0, -125.0, vWorldPosTerrain.x);",
          "if (snowBiomeMask2 > 0.01) {",
          "  float snowSparkle = smoothstep(0.82, 0.98, noiseTerrain(vWorldPosTerrain.xz * 1.8)) * 0.07;",
          "  vec3 pureSnowCol = vec3(0.95, 0.97, 1.0) * (0.97 + 0.03 * noiseTerrain(vWorldPosTerrain.xz * 0.12)) + snowSparkle;",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, pureSnowCol, snowBiomeMask2);",
          "}",
          "float coastWest = smoothstep(-330.0, -415.0, vWorldPosTerrain.x);",
          "float coastSouth = smoothstep(390.0, 460.0, vWorldPosTerrain.z);",
          "float coastMask2 = max(coastWest, coastSouth);",
          "if (coastMask2 > 0.001) {",
          "  float n1 = noiseTerrain(vWorldPosTerrain.xz * 0.038) * 1.45;",
          "  float n2 = noiseTerrain(vWorldPosTerrain.xz * 0.15) * 0.48;",
          "  float organicH = vWorldPosTerrain.y + n1 + n2 - 0.55;",
          "  float sandFactor = (1.0 - smoothstep(2.1, 5.8, organicH)) * coastMask2;",
          "  vec3 drySand = vec3(0.93, 0.84, 0.66);",
          "  vec3 wetSand = vec3(0.76, 0.66, 0.50);",
          "  float wetMask = 1.0 - smoothstep(-0.2, 1.5, vWorldPosTerrain.y);",
          "  vec3 targetSand = mix(drySand, wetSand, wetMask);",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, targetSand, clamp(sandFactor, 0.0, 1.0));",
          "}",
        ].join("\n")
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <fog_fragment>",
        [
          "#include <fog_fragment>",
          "float camDist = length(vWorldPosTerrain - cameraPosition);",
          "float aerialHaze = smoothstep(260.0, 740.0, camDist) * 0.65;",
          "gl_FragColor.rgb = mix(gl_FragColor.rgb, uSkyHorizon, aerialHaze);",
        ].join("\n")
      );
    };
    return mat;
  }, [textures]);

  return (
    <group>
      <mesh geometry={geometry} material={terrainMat} receiveShadow />
      <mesh geometry={mountainVistaGeo} position={[0, 0, 0]} frustumCulled={false}>
        <shaderMaterial
          side={THREE.BackSide}
          transparent
          depthWrite={false}
          uniforms={globalUniforms}
          vertexShader={[
            "attribute vec3 color;",
            "varying float vH;",
            "void main() {",
            "  vH = color.r;",
            "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
            "}"
          ].join("\n")}
          fragmentShader={[
            "uniform vec3 uSkyHorizon;",
            "uniform vec3 uSkyTop;",
            "varying float vH;",
            "void main() {",
            "  vec3 baseRidge = mix(uSkyHorizon * 0.72, uSkyTop * 0.85, 0.45);",
            "  vec3 col = mix(uSkyHorizon, baseRidge, smoothstep(0.0, 0.55, vH));",
            "  float alpha = smoothstep(0.0, 0.18, vH) * (1.0 - smoothstep(0.75, 1.0, vH));",
            "  gl_FragColor = vec4(col, alpha * 0.82);",
            "}"
          ].join("\n")}
        />
      </mesh>
    </group>
  );
}
