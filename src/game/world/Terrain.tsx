"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope, getRoadFactor, fbm } from "@/utils/noise";
import { getWorldTextures } from "@/utils/proceduralTextures";
import { usePlayerStore } from "@/game/state/usePlayerStore";

const ISLAND_SPAN = 1600;
const ISLAND_SEGMENTS = 200;

const COLOR_WET_SAND = new THREE.Color("#a8894c");
const COLOR_DRY_SAND = new THREE.Color("#dec484");
const COLOR_MEADOW_DARK = new THREE.Color("#366628");
const COLOR_MEADOW_BRIGHT = new THREE.Color("#5c9433");
const COLOR_MOSS = new THREE.Color("#457531");
const COLOR_ROAD_STONE = new THREE.Color("#857c70");
const COLOR_ROAD_BORDER = new THREE.Color("#63523f");
const COLOR_SHRINE_SOIL = new THREE.Color("#73342e");
const COLOR_ROCK = new THREE.Color("#525864");
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
      const macroPatch = (fbm(vx * 0.025, vz * 0.025, 3) + 1) * 0.5;
      const microPatch = (fbm(vx * 0.09, vz * 0.09, 2) + 1) * 0.5;
      const distShrine = Math.hypot(vx + 310, vz + 310);

      if (vy < 1.2) {
        tempColor.copy(COLOR_WET_SAND).lerp(COLOR_DRY_SAND, microPatch * 0.35);
      } else if (vy < 3.6) {
        tempColor.copy(COLOR_DRY_SAND).lerp(COLOR_WET_SAND, (1 - microPatch) * 0.25);
      } else if (slope > 0.78) {
        tempColor.copy(COLOR_ROCK).multiplyScalar(0.85 + microPatch * 0.3);
      } else if (vy > 36 && vz < -210) {
        tempColor.copy(COLOR_SNOW);
      } else if (vy > 24 && vz < -210) {
        const t = (vy - 24) / 12;
        tempColor.copy(COLOR_ROCK).lerp(COLOR_SNOW, t);
      } else if (distShrine < 115) {
        tempColor.copy(COLOR_MEADOW_DARK).lerp(COLOR_SHRINE_SOIL, 0.55);
      } else {
        tempColor.copy(COLOR_MEADOW_DARK).lerp(COLOR_MEADOW_BRIGHT, macroPatch * 0.8);
        tempColor.lerp(COLOR_MOSS, microPatch * 0.4);
      }

      if (road > 0.05 && vy >= 3.0) {
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
        bumpMap={textures.terrainDetail}
        bumpScale={0.08}
        roughness={0.85}
        metalness={0.04}
      />
    </mesh>
  );
}
