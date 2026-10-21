"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useWeatherStore, weatherFrameState, WeatherType } from "@/game/state/useWeatherStore";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getTerrainHeight } from "@/utils/noise";

const RAIN_COUNT = 1400;
const SNOW_COUNT = 900;
const RIPPLE_COUNT = 110;
const BOX_SPAN = 72;

export default function Weather() {
  const { scene } = useThree();
  const weather = useWeatherStore((s) => s.weather);
  const autoWeather = useWeatherStore((s) => s.autoWeather);
  const setWeather = useWeatherStore((s) => s.setWeather);

  const rainRef = useRef<THREE.InstancedMesh>(null);
  const snowRef = useRef<THREE.InstancedMesh>(null);
  const rippleRef = useRef<THREE.InstancedMesh>(null);
  const timerRef = useRef(0);

  // Fixed world-space seed offsets so raindrops & ripples NEVER follow the character!
  const particles = useMemo(() => {
    let s = 918273;
    const rand = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const rain = Array.from({ length: RAIN_COUNT }).map(() => ({
      wx: rand() * BOX_SPAN,
      wy: rand() * 28,
      wz: rand() * BOX_SPAN,
      speed: 24 + rand() * 8,
      len: 0.7 + rand() * 0.7,
    }));
    const snow = Array.from({ length: SNOW_COUNT }).map(() => ({
      wx: rand() * BOX_SPAN,
      wy: rand() * 24,
      wz: rand() * BOX_SPAN,
      speed: 2.0 + rand() * 1.2,
      phase: rand() * Math.PI * 2,
    }));
    const ripples = Array.from({ length: RIPPLE_COUNT }).map(() => ({
      wx: rand() * 48,
      wz: rand() * 48,
      phase: rand(),
    }));
    return { rain, snow, ripples };
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const px = playerFrameState.x;
    const py = playerFrameState.y;
    const pz = playerFrameState.z;

    // Strictly check if player is inside the Northern Snow Mountains biome (Z < -290 and X > -190)
    const inSnowMountains = pz < -205 && px > -210 && getTerrainHeight(px, pz) > 14.5;

    if (inSnowMountains && weather !== "snow") {
      setWeather("snow");
    } else if (!inSnowMountains && weather === "snow") {
      setWeather("clear");
    }

    timerRef.current += dt;
    if (autoWeather && !inSnowMountains && timerRef.current > 65) {
      timerRef.current = 0;
      const pool: WeatherType[] = ["clear", "clear", "clear", "cloudy", "rain"];
      setWeather(pool[Math.floor(Math.random() * pool.length)]);
    }

    const targetRain = weather === "rain" && !inSnowMountains ? 1.0 : 0.0;
    const targetSnow = inSnowMountains ? 1.0 : 0.0;
    const targetFogMult = weather === "fog" ? 2.4 : weather === "rain" ? 1.45 : weather === "cloudy" ? 1.25 : 1.0;

    weatherFrameState.rainIntensity = THREE.MathUtils.lerp(weatherFrameState.rainIntensity, targetRain, dt * 2.0);
    weatherFrameState.snowIntensity = THREE.MathUtils.lerp(weatherFrameState.snowIntensity, targetSnow, dt * 2.0);
    weatherFrameState.fogMultiplier = THREE.MathUtils.lerp(weatherFrameState.fogMultiplier, targetFogMult, dt * 1.5);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density *= Math.pow(weatherFrameState.fogMultiplier, dt * 3);
    }

    // 1. World-Locked Realistic Rain Streaks (Wrapped in world space so they NEVER slide with player!)
    if (rainRef.current) {
      const rInt = weatherFrameState.rainIntensity;
      rainRef.current.visible = rInt > 0.02;
      if (rInt > 0.02) {
        const half = BOX_SPAN * 0.5;
        for (let i = 0; i < RAIN_COUNT; i++) {
          const p = particles.rain[i];
          const windDrift = t * 3.2;
          const wx = px - half + (((p.wx + windDrift - (px - half)) % BOX_SPAN + BOX_SPAN) % BOX_SPAN);
          const wz = pz - half + (((p.wz - (pz - half)) % BOX_SPAN + BOX_SPAN) % BOX_SPAN);
          const wy = py - 4 + (((p.wy - t * p.speed) % 28 + 28) % 28);
          dummy.position.set(wx, wy, wz);
          dummy.rotation.set(0.04, 0, -0.14);
          dummy.scale.set(1, p.len * rInt, 1);
          dummy.updateMatrix();
          rainRef.current.setMatrixAt(i, dummy.matrix);
        }
        rainRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // 2. World-Locked Splash Ripples
    if (rippleRef.current) {
      const rInt = weatherFrameState.rainIntensity;
      rippleRef.current.visible = rInt > 0.05;
      if (rInt > 0.05) {
        const span = 48;
        const half = 24;
        for (let i = 0; i < RIPPLE_COUNT; i++) {
          const rp = particles.ripples[i];
          const wx = px - half + (((rp.wx - (px - half)) % span + span) % span);
          const wz = pz - half + (((rp.wz - (pz - half)) % span + span) % span);
          const wy = Math.max(0.05, getTerrainHeight(wx, wz) + 0.04);
          const cycle = (t * 2.2 + rp.phase) % 1.0;
          const s = cycle * 0.45 * (1 - cycle) * 4 * rInt;
          dummy.position.set(wx, wy, wz);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          rippleRef.current.setMatrixAt(i, dummy.matrix);
        }
        rippleRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // 3. World-Locked Snowflakes (ONLY in Northern Snow Mountains!)
    if (snowRef.current) {
      const sInt = weatherFrameState.snowIntensity;
      snowRef.current.visible = sInt > 0.02;
      if (sInt > 0.02) {
        const half = BOX_SPAN * 0.5;
        for (let i = 0; i < SNOW_COUNT; i++) {
          const p = particles.snow[i];
          const swayX = Math.sin(t * 1.3 + p.phase) * 1.4;
          const swayZ = Math.cos(t * 1.1 + p.phase) * 1.4;
          const wx = px - half + (((p.wx + swayX - (px - half)) % BOX_SPAN + BOX_SPAN) % BOX_SPAN);
          const wz = pz - half + (((p.wz + swayZ - (pz - half)) % BOX_SPAN + BOX_SPAN) % BOX_SPAN);
          const wy = py - 3 + (((p.wy - t * p.speed) % 24 + 24) % 24);
          dummy.position.set(wx, wy, wz);
          const scale = 0.075 * sInt;
          dummy.scale.set(scale, scale, scale);
          dummy.updateMatrix();
          snowRef.current.setMatrixAt(i, dummy.matrix);
        }
        snowRef.current.instanceMatrix.needsUpdate = true;
      }
    }
  });

  return (
    <group name="weather-particles">
      <instancedMesh ref={rainRef} args={[undefined, undefined, RAIN_COUNT]} frustumCulled={false} visible={false}>
        <cylinderGeometry args={[0.008, 0.008, 1.15, 4]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.42} />
      </instancedMesh>
      <instancedMesh ref={rippleRef} args={[undefined, undefined, RIPPLE_COUNT]} frustumCulled={false} visible={false}>
        <ringGeometry args={[0.22, 0.28, 12]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.38} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={snowRef} args={[undefined, undefined, SNOW_COUNT]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} />
      </instancedMesh>
    </group>
  );
}
