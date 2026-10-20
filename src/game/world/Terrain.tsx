"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { getTerrainHeight, getTerrainSlope } from "@/utils/noise";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";

const CHUNK_SIZE = 100;
const SEGMENTS = 32;
const VIEW_RADIUS = 3;

interface ChunkCoord {
  cx: number;
  cz: number;
  key: string;
}

const COLOR_WET_SAND = new THREE.Color("#c2a36b");
const COLOR_DRY_SAND = new THREE.Color("#e8d29b");
const COLOR_MEADOW = new THREE.Color("#5a9e4b");
const COLOR_FOREST = new THREE.Color("#3b753c");
const COLOR_ROCK = new THREE.Color("#64686e");
const COLOR_SNOW = new THREE.Color("#f0f6fc");

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
      if (vy < 0.4) {
        tempColor.copy(COLOR_WET_SAND);
      } else if (vy < 2.8) {
        tempColor.copy(COLOR_DRY_SAND);
      } else if (slope > 0.85) {
        tempColor.copy(COLOR_ROCK);
      } else if (vy > 36) {
        tempColor.copy(COLOR_SNOW);
      } else if (vy > 24) {
        const t = (vy - 24) / 12;
        tempColor.copy(COLOR_ROCK).lerp(COLOR_SNOW, t);
      } else if (vy > 10) {
        tempColor.copy(COLOR_FOREST);
      } else {
        tempColor.copy(COLOR_MEADOW);
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
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <RigidBody type="fixed" colliders="trimesh" position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]} friction={0.9}>
      <mesh geometry={geometry} receiveShadow castShadow>
        <meshStandardMaterial vertexColors roughness={0.88} metalness={0.05} />
      </mesh>
    </RigidBody>
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
