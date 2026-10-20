"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import * as THREE from "three";

export default function Experience() {
  const cubeRef = useRef<THREE.Mesh>(null);

  const { rotationSpeed, cubeColor, wireframe } = useControls("M0 Debug Cube", {
    rotationSpeed: { value: 1.0, min: 0, max: 5, step: 0.1 },
    cubeColor: "#38bdf8",
    wireframe: false,
  });

  useFrame((_state, delta) => {
    const clampedDelta = Math.min(delta, 0.05);
    if (cubeRef.current) {
      cubeRef.current.rotation.y += clampedDelta * rotationSpeed;
      cubeRef.current.rotation.x += clampedDelta * (rotationSpeed * 0.5);
    }
  });

  return (
    <>
      <OrbitControls makeDefault />

      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />

      <mesh ref={cubeRef} position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={cubeColor} wireframe={wireframe} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      <gridHelper args={[20, 20, "#475569", "#334155"]} />
    </>
  );
}
