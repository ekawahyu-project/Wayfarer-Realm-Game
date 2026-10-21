"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useWeatherStore, weatherFrameState } from "@/game/state/useWeatherStore";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getTerrainHeight } from "@/utils/noise";

const DAY_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

export default function AudioManager() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lastStepTimeRef = useRef(0);
  const lastNoteTimeRef = useRef(0);

  useEffect(() => {
    const initAudio = () => {
      try {
        if (ctxRef.current) {
          if (ctxRef.current.state === "suspended") ctxRef.current.resume();
          return;
        }
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        ctxRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.997 * b0 + white * 0.029;
          b1 = 0.985 * b1 + white * 0.032;
          b2 = 0.950 * b2 + white * 0.048;
          output[i] = (b0 + b1 + b2 + white * 0.02) * 0.2;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 300;
        filterRef.current = filter;

        const gain = ctx.createGain();
        gain.gain.value = 0.0;
        ambientGainRef.current = gain;

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        whiteNoise.start(0);
      } catch {}
    };

    window.addEventListener("pointerdown", initAudio);
    window.addEventListener("keydown", initAudio);
    return () => {
      window.removeEventListener("pointerdown", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
  }, []);

  useFrame((state) => {
    try {
      const ctx = ctxRef.current;
      if (!ctx || ctx.state !== "running") return;

      const store = useWeatherStore.getState();
      if (store.isMuted) {
        if (ambientGainRef.current) ambientGainRef.current.gain.value = 0;
        return;
      }

      const t = state.clock.elapsedTime;
      const master = store.masterVolume;

      if (ambientGainRef.current && filterRef.current) {
        const distFromCenter = Math.hypot(playerFrameState.x, playerFrameState.z);
        const nearCoast = THREE.MathUtils.smoothstep(distFromCenter, 480, 620);
        const waveSurge = 0.65 + 0.35 * Math.sin(t * 0.9);
        const rainBoost = weatherFrameState.rainIntensity * 0.8;
        filterRef.current.frequency.value = 220 + nearCoast * 260 * waveSurge + rainBoost * 800;
        ambientGainRef.current.gain.value = master * store.ambientVolume * (0.03 + nearCoast * 0.07 * waveSurge + rainBoost * 0.08);
      }

      const stepInterval = playerFrameState.isRunning ? 0.28 : 0.45;
      if (playerFrameState.isMoving && (playerFrameState.isGrounded || playerFrameState.isSwimming) && !playerFrameState.isInBoat) {
        if (t - lastStepTimeRef.current > stepInterval) {
          lastStepTimeRef.current = t;
          const h = getTerrainHeight(playerFrameState.x, playerFrameState.z);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = h < 0.3 ? "triangle" : "sine";
          osc.frequency.setValueAtTime(h < 0.3 ? 220 : 125, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(master * store.sfxVolume * 0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        }
      }

      if (t - lastNoteTimeRef.current > 4.5) {
        lastNoteTimeRef.current = t + Math.random() * 2.0;
        if (store.musicVolume > 0.02) {
          const freq = DAY_NOTES[Math.floor(Math.random() * DAY_NOTES.length)];
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(master * store.musicVolume * 0.05, ctx.currentTime + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 3.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 3.1);
        }
      }
    } catch {}
  });

  return null;
}
