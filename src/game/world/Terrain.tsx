"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope, getRoadFactor, fbm } from "@/utils/noise";
import { usePlayerStore } from "@/game/state/usePlayerStore";

const ISLAND_SPAN = 1600;
const ISLAND_SEGMENTS = 200; // Single unified mesh: 1 draw call, zero runtime chunk-generation lag!

const COLOR_WET_SAND = new THREE.Color("#b89758");
const COLOR_DRY_SAND = new THREE.Color("#e6cf93");
const COLOR_MEADOW = new THREE.Color("#4d8c40");
const COLOR_MEADOW_LUSH = new THREE.Color("#63a649");
const COLOR_ROAD_COB = new THREE.Color("#8a7e6d");
const COLOR_ROAD_STONE = new THREE.Color("#736e82");
const COLOR_SHRINE_SOIL = new THREE.Color("#7a3731");
const COLOR_FOREST = new THREE.Color("#2e6130");
const COLOR_ROCK = new THREE.Color("#575c66");
const COLOR_SNOW = new THREE.Color("#eef5fc");

export default function Terrain() {
  const setActiveChunks = usePlayerStore((s) => s.setActiveChunks);

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
      const microNoise = (fbm(vx * 0.03, vz * 0.03, 2) + 1) * 0.5;
      const distShrine = Math.hypot(vx + 310, vz + 310);

      if (vy < 0.8) {
        tempColor.copy(COLOR_WET_SAND);
      } else if (vy < 4.2) {
        tempColor.copy(COLOR_DRY_SAND);
      } else if (slope > 0.85) {
        tempColor.copy(COLOR_ROCK);
      } else if (vy > 42) {
        tempColor.copy(COLOR_SNOW);
      } else if (vy > 28) {
        const t = (vy - 28) / 14;
        tempColor.copy(COLOR_ROCK).lerp(COLOR_SNOW, t);
      } else if (distShrine < 115) {
        tempColor.copy(COLOR_FOREST).lerp(COLOR_SHRINE_SOIL, 0.55);
      } else if (vy > 13.5) {
        tempColor.copy(COLOR_FOREST).lerp(COLOR_MEADOW, microNoise * 0.35);
      } else {
        tempColor.copy(COLOR_MEADOW).lerp(COLOR_MEADOW_LUSH, microNoise * 0.6);
      }

      if (road > 0.05 && vy >= 3.2) {
        const isKingdomRoad = vz > 180;
        const roadCol = isKingdomRoad ? COLOR_ROAD_STONE : COLOR_ROAD_COB;
        tempColor.lerp(roadCol, road * 0.92);
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
      <meshStandardMaterial vertexColors roughness={0.88} metalness={0.04} />
    </mesh>
  );
}
