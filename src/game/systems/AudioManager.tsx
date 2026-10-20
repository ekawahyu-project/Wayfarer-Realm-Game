"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useWeatherStore, weatherFrameState } from "@/game/state/useWeatherStore";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getTerrainHeight } from "@/utils/noise";

// Pentatonic frequencies (Hz) for calm generative acoustic notes (PRD 9.1)
const DAY_NOTES = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const NIGHT_NOTES = [196.0, 220.0, 261.63, 293.66, 329.63, 392.0];

export default function AudioManager() {
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const lastStepTimeRef = useRef(0);
  const lastNoteTimeRef = useRef(0);

  useEffect(() => {
    const initAudio = () => {
      if (ctxRef.current) {
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        return;
      }
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      // Continuous pink-noise buffer for ocean waves, wind, and rain ambient
      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + white * 0.029;
        b1 = 0.985 * b1 + white * 0.032;
        b2 = 0.950 * b2 + white * 0.048;
        output[i] = (b0 + b1 + b2 + white * 0.02) * 0.25;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 320;
      filterRef.current = filter;

      const gain = ctx.createGain();
      gain.gain.value = 0.0;
      ambientGainRef.current = gain;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(0);
    };

    window.addEventListener("pointerdown", initAudio);
    window.addEventListener("keydown", initAudio);
    return () => {
      window.removeEventListener("pointerdown", initAudio);
      window.removeEventListener("keydown", initAudio);
    };
  }, []);

  // Helper to play a soft footstep sound tailored to surface material (PRD 9.2)
  const playFootstep = (ctx: AudioContext, vol: number) => {
    const px = playerFrameState.x;
    const pz = playerFrameState.z;
    const h = getTerrainHeight(px, pz);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Determine surface frequency: water splash, sand, snow, stone, or grass
    if (playerFrameState.isSwimming || h < 0.3) {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.11);
    } else if (h < 3.8) {
      // Sand step
      osc.type = "sine";
      osc.frequency.setValueAtTime(135, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.08);
    } else if (pz > 260 || (px > 260 && Math.abs(pz) < 90)) {
      // Kingdom/Village stone step
      osc.type = "triangle";
      osc.frequency.setValueAtTime(190, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(75, ctx.currentTime + 0.06);
    } else {
      // Soft grass/snow step
      osc.type = "sine";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 0.07);
    }

    gain.gain.setValueAtTime(vol * 0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  // Helper to play a gentle piano/harp-like ambient music note (PRD 9.1)
  const playCalmNote = (ctx: AudioContext, vol: number) => {
    const notes = DAY_NOTES;
    const freq = notes[Math.floor(Math.random() * notes.length)];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol * 0.06, ctx.currentTime + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 3.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 3.3);
  };

  useFrame((state) => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.state !== "running") return;

    const store = useWeatherStore.getState();
    if (store.isMuted) {
      if (ambientGainRef.current) ambientGainRef.current.gain.value = 0;
      return;
    }

    const t = state.clock.elapsedTime;
    const master = store.masterVolume;

    // 1. Modulate ocean waves / wind / rain ambient noise
    if (ambientGainRef.current && filterRef.current) {
      const distFromCenter = Math.sqrt(playerFrameState.x * playerFrameState.x + playerFrameState.z * playerFrameState.z);
      const nearCoast = THREE.MathUtils.smoothstep(distFromCenter, 480, 620);
      const waveSurge = 0.65 + 0.35 * Math.sin(t * 0.9);
      const rainBoost = weatherFrameState.rainIntensity * 0.8;

      filterRef.current.frequency.value = 220 + nearCoast * 280 * waveSurge + rainBoost * 900;
      ambientGainRef.current.gain.value = master * store.ambientVolume * (0.04 + nearCoast * 0.08 * waveSurge + rainBoost * 0.10);
    }

    // 2. Footstep SFX when walking/running
    const stepInterval = playerFrameState.isRunning ? 0.30 : 0.48;
    if (playerFrameState.isMoving && (playerFrameState.isGrounded || playerFrameState.isSwimming) && !playerFrameState.isInBoat) {
      if (t - lastStepTimeRef.current > stepInterval) {
        lastStepTimeRef.current = t;
        playFootstep(ctx, master * store.sfxVolume);
      }
    }

    // 3. Calm generative background music notes every 3.5 - 6 seconds
    if (t - lastNoteTimeRef.current > 4.2) {
      lastNoteTimeRef.current = t + Math.random() * 2.0;
      if (store.musicVolume > 0.02) {
        playCalmNote(ctx, master * store.musicVolume);
      }
    }
  });

  return null;
}
