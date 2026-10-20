"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls, button } from "leva";
import * as THREE from "three";
import { useWeatherStore, weatherFrameState, WeatherType } from "@/game/state/useWeatherStore";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { globalUniforms } from "./globalUniforms";
import { getTerrainHeight } from "@/utils/noise";

const RAIN_COUNT = 1200;
const SNOW_COUNT = 900;
const RIPPLE_COUNT = 120;

export default function Weather() {
  const { scene } = useThree();
  const weather = useWeatherStore((s) => s.weather);
  const autoWeather = useWeatherStore((s) => s.autoWeather);
  const setWeather = useWeatherStore((s) => s.setWeather);

  const rainRef = useRef<THREE.InstancedMesh>(null);
  const snowRef = useRef<THREE.InstancedMesh>(null);
  const rippleRef = useRef<THREE.InstancedMesh>(null);
  const timerRef = useRef(0);

  useControls("M7 Weather System", {
    "☀️ Cerah": button(() => setWeather("clear")),
    "⛅ Berawan": button(() => setWeather("cloudy")),
    "🌫️ Kabut Tebal": button(() => setWeather("fog")),
    "🌧️ Hujan Ringan": button(() => setWeather("rain")),
    "❄️ Salju Ringan": button(() => setWeather("snow")),
  });

  const particles = useMemo(() => {
    const rain = Array.from({ length: RAIN_COUNT }).map((_, i) => ({
      dx: ((i * 73) % 70) - 35,
      y: (i * 29) % 28,
      dz: ((i * 47) % 70) - 35,
      speed: 22 + (i % 7) * 2,
    }));
    const snow = Array.from({ length: SNOW_COUNT }).map((_, i) => ({
      dx: ((i * 61) % 70) - 35,
      y: (i * 31) % 26,
      dz: ((i * 83) % 70) - 35,
      speed: 2.2 + (i % 5) * 0.45,
      phase: i * 0.9,
    }));
    const ripples = Array.from({ length: RIPPLE_COUNT }).map((_, i) => ({
      dx: ((i * 43) % 44) - 22,
      dz: ((i * 67) % 44) - 22,
      phase: (i * 0.37) % 1.0,
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

    // Automatic biome/random weather transition every 60 seconds (PRD 7.5)
    timerRef.current += dt;
    if (autoWeather && timerRef.current > 60) {
      timerRef.current = 0;
      if (pz < -280) {
        setWeather("snow");
      } else {
        const pool: WeatherType[] = ["clear", "clear", "cloudy", "rain", "fog"];
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setWeather(pick);
      }
    }

    // Smooth transition of weather intensities
    const inSnowBiome = pz < -300 && weather === "clear";
    const targetRain = weather === "rain" ? 1.0 : 0.0;
    const targetSnow = weather === "snow" || inSnowBiome ? 1.0 : 0.0;
    const targetFogMult = weather === "fog" ? 2.8 : weather === "rain" ? 1.65 : weather === "cloudy" ? 1.35 : 1.0;

    weatherFrameState.rainIntensity = THREE.MathUtils.lerp(weatherFrameState.rainIntensity, targetRain, dt * 1.5);
    weatherFrameState.snowIntensity = THREE.MathUtils.lerp(weatherFrameState.snowIntensity, targetSnow, dt * 1.5);
    weatherFrameState.fogMultiplier = THREE.MathUtils.lerp(weatherFrameState.fogMultiplier, targetFogMult, dt * 1.2);

    // Apply fog density multiplier & wind boost during rain
    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.density *= Math.pow(weatherFrameState.fogMultiplier, dt * 4);
    }

    // 1. Update Rain Streaks & Ground Ripples
    if (rainRef.current) {
      const rInt = weatherFrameState.rainIntensity;
      rainRef.current.visible = rInt > 0.02;
      if (rInt > 0.02) {
        for (let i = 0; i < RAIN_COUNT; i++) {
          const p = particles.rain[i];
          const ry = ((p.y - t * p.speed) % 26 + 26) % 26;
          dummy.position.set(px + p.dx, py + ry - 4, pz + p.dz);
          dummy.rotation.set(0, 0, -0.12 * globalUniforms.uWindStrength.value);
          dummy.scale.set(1, rInt, 1);
          dummy.updateMatrix();
          rainRef.current.setMatrixAt(i, dummy.matrix);
        }
        rainRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    if (rippleRef.current) {
      const rInt = weatherFrameState.rainIntensity;
      rippleRef.current.visible = rInt > 0.05;
      if (rInt > 0.05) {
        for (let i = 0; i < RIPPLE_COUNT; i++) {
          const rp = particles.ripples[i];
          const wx = px + rp.dx;
          const wz = pz + rp.dz;
          const wy = Math.max(0.05, getTerrainHeight(wx, wz) + 0.04);
          const cycle = (t * 1.8 + rp.phase) % 1.0;
          const s = cycle * 0.65 * rInt;
          dummy.position.set(wx, wy, wz);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.scale.set(s, s, s);
          dummy.updateMatrix();
          rippleRef.current.setMatrixAt(i, dummy.matrix);
        }
        rippleRef.current.instanceMatrix.needsUpdate = true;
      }
    }

    // 2. Update Snowflakes
    if (snowRef.current) {
      const sInt = weatherFrameState.snowIntensity;
      snowRef.current.visible = sInt > 0.02;
      if (sInt > 0.02) {
        for (let i = 0; i < SNOW_COUNT; i++) {
          const p = particles.snow[i];
          const sy = ((p.y - t * p.speed) % 24 + 24) % 24;
          const swayX = Math.sin(t * 1.4 + p.phase) * 1.2;
          const swayZ = Math.cos(t * 1.1 + p.phase) * 1.2;
          dummy.position.set(px + p.dx + swayX, py + sy - 3, pz + p.dz + swayZ);
          const scale = 0.09 * sInt;
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
      {/* Instanced Rain Streaks */}
      <instancedMesh ref={rainRef} args={[undefined, undefined, RAIN_COUNT]} frustumCulled={false} visible={false}>
        <cylinderGeometry args={[0.012, 0.012, 0.95, 4]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.55} />
      </instancedMesh>

      {/* Instanced Rain Ground/Water Ripples */}
      <instancedMesh ref={rippleRef} args={[undefined, undefined, RIPPLE_COUNT]} frustumCulled={false} visible={false}>
        <ringGeometry args={[0.35, 0.45, 12]} />
        <meshBasicMaterial color="#e0f2fe" transparent opacity={0.45} side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Instanced Snowflakes */}
      <instancedMesh ref={snowRef} args={[undefined, undefined, SNOW_COUNT]} frustumCulled={false} visible={false}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#f8fafc" transparent opacity={0.85} />
      </instancedMesh>
    </group>
  );
}
