"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope, getRoadFactor, fbm } from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";

const CHUNK_SIZE = 100;
const SEGMENTS = 28;
const VIEW_RADIUS = 4;

interface ChunkCoord {
  cx: number;
  cz: number;
  key: string;
}

const COLOR_WET_SAND = new THREE.Color("#b89758");
const COLOR_DRY_SAND = new THREE.Color("#e6cf93");
const COLOR_MEADOW = new THREE.Color("#4d8c40");
const COLOR_MEADOW_LUSH = new THREE.Color("#63a649");
const COLOR_ROAD_COBaza = new THREE.Color("#7c7265");
const COLOR_ROAD_STONE = new THREE.Color("#6b6878");
const COLOR_SHRINE_SOIL = new THREE.Color("#7a3731");
const COLOR_FOREST = new THREE.Color("#2e6130");
const COLOR_ROCK = new THREE.Color("#575c66");
const COLOR_SNOW = new THREE.Color("#eef5fc");

function TerrainChunk({ cx, cz }: { cx: number; cz: number }) {
  const geometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, SEGMENTS, SEGMENTS);
    geom.rotateX(-Math.PI / 2);
    const posAttr = geom.attributes.position;
    const colors = new Float32Array(posAttr.count * 3);
    const tempColor = new THREE.Color();
    const worldOffsetX = cx * CHUNK_SIZE;
    const worldOffsetZ = cz * CHUNK_SIZE;

    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i) + worldOffsetX;
      const vz = posAttr.getZ(i) + worldOffsetZ;
      const vy = getTerrainHeight(vx, vz);
      posAttr.setY(i, vy);

      const slope = getTerrainSlope(vx, vz);
      const road = getRoadFactor(vx, vz);
      const microNoise = (fbm(vx * 0.04, vz * 0.04, 2) + 1) * 0.5;

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

      // Cat jalan setapak batu/tanah di atas terrain
      if (road > 0.05 && vy >= 3.2) {
        const isKingdomRoad = vz > 180;
        const roadCol = isKingdomRoad ? COLOR_ROAD_STONE : COLOR_ROAD_COBaza;
        tempColor.lerp(roadCol, road * 0.92);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geom.computeVertexNormals();
    return geom;
  }, [cx, cz]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <mesh geometry={geometry} position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.88} metalness={0.04} />
    </mesh>
  );
}

export default function Terrain() {
  const [chunks, setChunks] = useState<ChunkCoord[]>([]);
  const lastCenterChunk = useRef<{ cx: number; cz: number }>({ cx: -999, cz: -999 });
  const setActiveChunks = usePlayerStore((s) => s.setActiveChunks);

  useFrame(() => {
    const currentCx = Math.round(playerFrameState.x / CHUNK_SIZE);
    const currentCz = Math.round(playerFrameState.z / CHUNK_SIZE);
    if (currentCx !== lastCenterChunk.current.cx || currentCz !== lastCenterChunk.current.cz) {
      lastCenterChunk.current = { cx: currentCx, cz: currentCz };
      const nextChunks: ChunkCoord[] = [];
      for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
        for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
          if (dx * dx + dz * dz <= VIEW_RADIUS * VIEW_RADIUS + 1) {
            const cx = currentCx + dx;
            const cz = currentCz + dz;
            if (Math.abs(cx) <= 10 && Math.abs(cz) <= 10) {
              nextChunks.push({ cx, cz, key: String(cx) + "," + String(cz) });
            }
          }
        }
      }
      setChunks(nextChunks);
      setActiveChunks(nextChunks.length);
    }
  });

  return (
    <group name="terrain-chunks">
      {chunks.map((c) => (
        <TerrainChunk key={c.key} cx={c.cx} cz={c.cz} />
      ))}
    </group>
  );
}
