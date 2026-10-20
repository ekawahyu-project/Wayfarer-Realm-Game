"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls, button } from "leva";
import * as THREE from "three";
import { InterpolatedTimeSample, sampleTimeOfDay } from "@/config/timeOfDay";
import { timeFrameState, useTimeStore } from "@/game/state/useTimeStore";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { globalUniforms } from "./globalUniforms";

const SHADOW_FRUSTUM = 85;
const SHADOW_MAP_SIZE = 2048;

export default function TimeOfDay() {
  const { gl } = useThree();
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const fogRef = useRef<THREE.FogExp2>(null);

  const dayLengthMinutes = useTimeStore((s) => s.dayLengthMinutes);
  const timeScale = useTimeStore((s) => s.timeScale);
  const isBloodMoon = useTimeStore((s) => s.isBloodMoon);
  const setHour = useTimeStore((s) => s.setHour);
  const setTimeScale = useTimeStore((s) => s.setTimeScale);
  const setBloodMoon = useTimeStore((s) => s.setBloodMoon);
  const syncUiTime = useTimeStore((s) => s.syncUiTime);

  const lastUiSync = useRef(0);
  const sampleRef = useRef<InterpolatedTimeSample>({
    phase: "morning",
    labelId: "Pagi",
    skyTop: new THREE.Color(),
    skyHorizon: new THREE.Color(),
    sunColor: new THREE.Color(),
    sunIntensity: 1,
    ambientColor: new THREE.Color(),
    ambientGround: new THREE.Color(),
    ambientIntensity: 0.5,
    fogColor: new THREE.Color(),
    fogDensity: 0.0012,
    exposure: 1,
    windowGlow: 0,
    nightFactor: 0,
  });

  const lightDir = useRef(new THREE.Vector3()).current;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyT") {
        const nextScale = useTimeStore.getState().timeScale === 1 ? 30 : 1;
        setTimeScale(nextScale);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setTimeScale]);

  useControls("M2 Time & Sky", {
    "Jam Pagi (07:30)": button(() => setHour(7.5)),
    "Jam Siang (12:00)": button(() => setHour(12.0)),
    "Golden Hour (16:15)": button(() => setHour(16.25)),
    "Senja (18:15)": button(() => setHour(18.25)),
    "Malam (22:00)": button(() => setHour(22.0)),
    "Fajar (05:30)": button(() => setHour(5.5)),
    kecepatanWaktu: {
      value: timeScale,
      min: 0,
      max: 60,
      step: 1,
      onChange: (v: number) => setTimeScale(v),
    },
    bulanMerah: {
      value: isBloodMoon,
      onChange: (v: boolean) => setBloodMoon(v),
    },
  });

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const hoursPerSecond = 24 / (Math.max(1, dayLengthMinutes) * 60);
    timeFrameState.hour += dt * hoursPerSecond * timeScale;
    if (timeFrameState.hour >= 24) {
      timeFrameState.hour -= 24;
      timeFrameState.day += 1;
    }
    const currentHour = timeFrameState.hour;
    const sample = sampleRef.current;
    sampleTimeOfDay(currentHour, sample);

    const sunAngle = ((currentHour - 6) / 24) * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);
    const sunZ = 0.32;

    globalUniforms.uSunDir.value.set(sunX, sunY, sunZ).normalize();
    globalUniforms.uMoonDir.value.set(-sunX, -sunY, -sunZ).normalize();
    globalUniforms.uTime.value = state.clock.elapsedTime;
    globalUniforms.uNightFactor.value = sample.nightFactor;
    globalUniforms.uSunColor.value.copy(sample.sunColor);
    globalUniforms.uSkyTop.value.copy(sample.skyTop);
    globalUniforms.uSkyHorizon.value.copy(sample.skyHorizon);
    globalUniforms.uBloodMoon.value = THREE.MathUtils.lerp(globalUniforms.uBloodMoon.value, isBloodMoon ? 1.0 : 0.0, dt * 3);

    const isNight = sample.nightFactor > 0.65;
    lightDir.copy(isNight ? globalUniforms.uMoonDir.value : globalUniforms.uSunDir.value);
    if (lightDir.y < 0.12) {
      lightDir.y = 0.12;
      lightDir.normalize();
    }

    const texelSize = (SHADOW_FRUSTUM * 2) / SHADOW_MAP_SIZE;
    const snappedX = Math.floor(playerFrameState.x / texelSize) * texelSize;
    const snappedZ = Math.floor(playerFrameState.z / texelSize) * texelSize;

    if (sunLightRef.current) {
      sunLightRef.current.position.set(snappedX + lightDir.x * 140, playerFrameState.y + lightDir.y * 140, snappedZ + lightDir.z * 140);
      sunLightRef.current.target.position.set(snappedX, playerFrameState.y, snappedZ);
      sunLightRef.current.target.updateMatrixWorld();
      sunLightRef.current.color.copy(sample.sunColor);
      if (isBloodMoon && isNight) sunLightRef.current.color.set("#f43f5e");
      sunLightRef.current.intensity = sample.sunIntensity;
    }
    if (moonLightRef.current) moonLightRef.current.intensity = sample.nightFactor * 0.22;
    if (hemiLightRef.current) {
      hemiLightRef.current.color.copy(sample.ambientColor);
      hemiLightRef.current.groundColor.copy(sample.ambientGround);
      hemiLightRef.current.intensity = sample.ambientIntensity;
    }
    if (fogRef.current) {
      fogRef.current.color.copy(sample.fogColor);
      if (isBloodMoon && isNight) fogRef.current.color.lerp(sample.sunColor.set("#4c0519"), 0.5);
      fogRef.current.density = sample.fogDensity;
    }
    gl.toneMappingExposure = sample.exposure;

    if (state.clock.elapsedTime - lastUiSync.current > 0.25) {
      lastUiSync.current = state.clock.elapsedTime;
      syncUiTime(currentHour, timeFrameState.day, sample.phase, sample.labelId);
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={["#bae6fd", 0.0013]} />
      <hemisphereLight ref={hemiLightRef} args={["#bae6fd", "#3f6212", 0.55]} />
      <directionalLight
        ref={sunLightRef}
        castShadow
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-camera-left={-SHADOW_FRUSTUM}
        shadow-camera-right={SHADOW_FRUSTUM}
        shadow-camera-top={SHADOW_FRUSTUM}
        shadow-camera-bottom={-SHADOW_FRUSTUM}
        shadow-camera-near={10}
        shadow-camera-far={380}
        shadow-bias={-0.0005}
      />
      <directionalLight ref={moonLightRef} position={[-80, 120, -60]} color="#93c5fd" intensity={0.15} />
    </>
  );
}
