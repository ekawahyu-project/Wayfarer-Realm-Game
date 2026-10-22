"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, getRiverDistance, noise2D, BIOME_CENTERS } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { WORLD_CONFIG } from "@/config/world";

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export default function Terrain() {
  const textures = useMemo(() => getWorldTextures(), []);

  const geometry = useMemo(() => {
    const size = WORLD_CONFIG.size;
    const segments = WORLD_CONFIG.segments;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cSand = new THREE.Color("#ebd5a7");
    const cLushGrass = new THREE.Color("#4f9932");
    const cMeadowGrass = new THREE.Color("#66ad40");
    const cForestFloor = new THREE.Color("#3b7524");
    const cAutumnGrass = new THREE.Color("#a87934");
    const cDirtPath = new THREE.Color("#a6865a");
    const cRiverBed = new THREE.Color("#2d7780");
    const cPlazaStone = new THREE.Color("#c8c2b8");
    const cRock = new THREE.Color("#64748b");
    const cSnow = new THREE.Color("#f4f8fc");
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

      const distShrine = Math.hypot(x - shX, z - shZ);
      if (distShrine < 110) {
        temp.lerp(cAutumnGrass, Math.min(1, (1 - distShrine / 110) * 0.75));
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

      if (z < -150 || y > 18) {
        const snowFactor = Math.max(
          z < -150 ? Math.min(1, (-150 - z) / 110) : 0,
          y > 18 ? Math.min(1, (y - 18) / 14) : 0
        );
        if (y > 14 && y <= 24) temp.lerp(cRock, 0.55);
        temp.lerp(cSnow, snowFactor);
      }

      colors[i * 3] = temp.r;
      colors[i * 3 + 1] = temp.g;
      colors[i * 3 + 2] = temp.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const terrainMat = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map: textures.terrainDetail,
      bumpMap: textures.terrainDetail,
      bumpScale: 0.08,
      roughness: 0.84,
      metalness: 0.02,
    });

    mat.customProgramCacheKey = () => "terrain-shoreline-perpixel-v4";
    mat.onBeforeCompile = (shader) => {
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
          "varying vec3 vWorldPosTerrain;",
          "float hashTerrain(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }",
          "float noiseTerrain(vec2 p) {",
          "  vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);",
          "  return mix(mix(hashTerrain(i), hashTerrain(i + vec2(1.0, 0.0)), f.x), mix(hashTerrain(i + vec2(0.0, 1.0)), hashTerrain(i + vec2(1.0, 1.0)), f.x), f.y);",
          "}",
        ].join("\n")
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        [
          "#include <color_fragment>",
          "float coastWest = smoothstep(-330.0, -415.0, vWorldPosTerrain.x);",
          "float coastSouth = smoothstep(390.0, 460.0, vWorldPosTerrain.z);",
          "float coastMask = max(coastWest, coastSouth);",
          "if (coastMask > 0.001) {",
          "  float n1 = noiseTerrain(vWorldPosTerrain.xz * 0.038) * 1.45;",
          "  float n2 = noiseTerrain(vWorldPosTerrain.xz * 0.15) * 0.48;",
          "  float organicH = vWorldPosTerrain.y + n1 + n2 - 0.55;",
          "  float sandFactor = (1.0 - smoothstep(2.1, 5.8, organicH)) * coastMask;",
          "  float texLum = dot(diffuseColor.rgb, vec3(0.333)) / max(0.15, dot(vColor.rgb, vec3(0.333)));",
          "  texLum = clamp(texLum, 0.80, 1.16);",
          "  vec3 drySand = vec3(0.94, 0.85, 0.67) * texLum;",
          "  vec3 wetSand = vec3(0.76, 0.66, 0.50) * texLum;",
          "  float wetMask = 1.0 - smoothstep(-0.2, 1.5, vWorldPosTerrain.y);",
          "  vec3 targetSand = mix(drySand, wetSand, wetMask);",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, targetSand, clamp(sandFactor, 0.0, 1.0));",
          "}",
        ].join("\n")
      );
    };
    return mat;
  }, [textures]);

  return <mesh geometry={geometry} material={terrainMat} receiveShadow />;
}
