"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope, getRoadFactor, fbm } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { usePlayerStore } from "@/game/state/usePlayerStore";

const ISLAND_SPAN = 1600;
const ISLAND_SEGMENTS = 200;

const COLOR_WET_SAND = new THREE.Color("#b89758");
const COLOR_DRY_SAND = new THREE.Color("#e2ca8c");
const COLOR_MEADOW_DARK = new THREE.Color("#3b6e2c");
const COLOR_MEADOW_BRIGHT = new THREE.Color("#689f38");
const COLOR_MOSS = new THREE.Color("#4a7c36");
const COLOR_ROAD_STONE = new THREE.Color("#8d8478");
const COLOR_ROAD_BORDER = new THREE.Color("#6d5b47");
const COLOR_SHRINE_SOIL = new THREE.Color("#7a3731");
const COLOR_ROCK = new THREE.Color("#575c66");
const COLOR_SNOW = new THREE.Color("#f1f5f9");

export default function Terrain() {
  const setActiveChunks = usePlayerStore((s) => s.setActiveChunks);
  const textures = useMemo(() => getWorldTextures(), []);

  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(ISLAND_SPAN, ISLAND_SPAN, ISLAND_SEGMENTS, ISLAND_SEGMENTS);
    geom.rotateX(-Math.PI / 2);
    const posAttr = geom.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const tempColor = new THREE.Color();

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getZ(i);
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      const slope = getTerrainSlope(vx, vz);
      const road = getRoadFactor(vx, vz);
      const macroPatch = (fbm(vx * 0.022, vz * 0.022, 3) + 1) * 0.5;
      const microPatch = (fbm(vx * 0.08, vz * 0.08, 2) + 1) * 0.5;
      const distShrine = Math.hypot(vx + 310, vz + 310);

      if (vy < 0.8) {
        tempColor.copy(COLOR_WET_SAND);
      } else if (vy < 3.6) {
        tempColor.copy(COLOR_DRY_SAND);
      } else if (slope > 0.82) {
        tempColor.copy(COLOR_ROCK);
      } else if (vy > 42 && vz < -220) {
        tempColor.copy(COLOR_SNOW);
      } else if (vy > 28 && vz < -220) {
        const t = (vy - 28) / 14;
        tempColor.copy(COLOR_ROCK).lerp(COLOR_SNOW, t);
      } else if (distShrine < 115) {
        tempColor.copy(COLOR_MEADOW_DARK).lerp(COLOR_SHRINE_SOIL, 0.55);
      } else {
        // Rich mottled forest/meadow ground matching Reference Image 073818
        tempColor.copy(COLOR_MEADOW_DARK).lerp(COLOR_MEADOW_BRIGHT, macroPatch * 0.75);
        tempColor.lerp(COLOR_MOSS, microPatch * 0.35);
      }

      if (road > 0.05 && vy >= 3.2) {
        tempColor.lerp(COLOR_ROAD_BORDER, Math.min(1, road * 1.4));
        if (road > 0.35) {
          tempColor.lerp(COLOR_ROAD_STONE, (road - 0.35) / 0.65);
        }
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, []);

  useEffect(() => {
    setActiveChunks(1);
    return () => geometry.dispose();
  }, [geometry, setActiveChunks]);

  return (
    <mesh geometry={geometry} receiveShadow frustumCulled={false}>
      <meshStandardMaterial
        vertexColors
        map={textures.terrainDetail}
        roughness={0.86}
        metalness={0.03}
      />
    </mesh>
  );
}
