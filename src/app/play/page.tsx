"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePlayerStore, playerFrameState } from "@/game/state/usePlayerStore";
import { useTimeStore, formatGameClock } from "@/game/state/useTimeStore";
import { useJournalStore } from "@/game/state/useJournalStore";
import { useWeatherStore } from "@/game/state/useWeatherStore";
import { BIOME_CENTERS, getWalkableHeight } from "@/utils/noise";
import GameOverlayUI from "@/ui/GameOverlayUI";
import PhotoMode from "@/ui/PhotoMode";
import PauseAndSettingsModal from "@/ui/PauseAndSettingsModal";

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-slate-950 text-amber-100">
      <div className="w-12 h-12 mb-4 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-lg font-medium tracking-wide">Memuat Pulau Wayfarer Realm...</p>
    </div>
  ),
});

export default function PlayPage() {
  const position = usePlayerStore((s) => s.position);
  const isSwimming = usePlayerStore((s) => s.isSwimming);
  const isInBoat = usePlayerStore((s) => s.isInBoat);
  const setInBoat = usePlayerStore((s) => s.setInBoat);
  const requestTeleport = usePlayerStore((s) => s.requestTeleport);
  const interactionPrompt = usePlayerStore((s) => s.interactionPrompt);

  const hour = useTimeStore((s) => s.hour);
  const day = useTimeStore((s) => s.day);
  const phaseLabel = useTimeStore((s) => s.phaseLabel);
  const timeScale = useTimeStore((s) => s.timeScale);
  const isBloodMoon = useTimeStore((s) => s.isBloodMoon);
  const setHour = useTimeStore((s) => s.setHour);
  const setBloodMoon = useTimeStore((s) => s.setBloodMoon);

  const weatherLabel = useWeatherStore((s) => s.weatherLabel);
  const isMuted = useWeatherStore((s) => s.isMuted);
  const isPhotoMode = useWeatherStore((s) => s.isPhotoMode);
  const toggleMute = useWeatherStore((s) => s.toggleMute);
  const togglePhotoMode = useWeatherStore((s) => s.togglePhotoMode);

  const isHudHidden = useJournalStore((s) => s.isHudHidden);
  const toggleMap = useJournalStore((s) => s.toggleMap);
  const toggleJournal = useJournalStore((s) => s.toggleJournal);
  const isNight = hour >= 19 || hour < 5;

  const jumpTo = (x: number, z: number) => {
    playerFrameState.isInBoat = false;
    setInBoat(false);
    requestTeleport([x, Math.max(0, getWalkableHeight(x, z)), z]);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <GameCanvas />
      <PhotoMode />
      <PauseAndSettingsModal />

      {!isHudHidden && !isPhotoMode && (
        <>
          <GameOverlayUI />

          {/* Top-Left Quick Teleport (Sekarang dengan 3 Desa & Pasar + Hutan Birch + Kastil Besar) */}
          <div className="absolute top-4 left-4 z-10 p-3 bg-slate-950/85 border border-amber-600/60 rounded-2xl text-xs text-amber-100 space-y-2 backdrop-blur-md shadow-xl max-w-sm">
            <div className="font-bold text-amber-300">⚡ Teleport Lokasi Cepat:</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => jumpTo(BIOME_CENTERS.westBeach.x, BIOME_CENTERS.westBeach.z)} className="px-2 py-1 bg-amber-900/90 hover:bg-amber-700 rounded">🏖️ Pantai</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.centralMeadow.x, BIOME_CENTERS.centralMeadow.z)} className="px-2 py-1 bg-amber-900/90 hover:bg-amber-700 rounded">🌳 Hutan Birch</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.eastVillage.x, BIOME_CENTERS.eastVillage.z)} className="px-2 py-1 bg-emerald-800 hover:bg-emerald-600 rounded font-semibold">🏪 Desa & Pasar Timur</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.swVillage.x, BIOME_CENTERS.swVillage.z)} className="px-2 py-1 bg-emerald-900/90 hover:bg-emerald-700 rounded">🏘️ Desa Barat Daya</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.westForestVillage.x, BIOME_CENTERS.westForestVillage.z)} className="px-2 py-1 bg-emerald-900/90 hover:bg-emerald-700 rounded">🌾 Desa Hutan Barat</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.southKingdom.x, BIOME_CENTERS.southKingdom.z)} className="px-2 py-1 bg-purple-900 hover:bg-purple-700 rounded font-semibold">🏰 Kerajaan Besar</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.nwShrine.x, BIOME_CENTERS.nwShrine.z)} className="px-2 py-1 bg-amber-900/90 hover:bg-amber-700 rounded">⛩️ Kuil</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.northMountains.x, BIOME_CENTERS.northMountains.z)} className="px-2 py-1 bg-amber-900/90 hover:bg-amber-700 rounded">🏔️ Salju</button>
              <button onClick={() => jumpTo(BIOME_CENTERS.southHarbor.x, BIOME_CENTERS.southHarbor.z)} className="px-2 py-1 bg-amber-900/90 hover:bg-amber-700 rounded">⚓ Pelabuhan</button>
            </div>
            <div className="font-bold text-amber-300 pt-1">🕒 Ubah Suasana Waktu:</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => { setBloodMoon(false); setHour(8.0); }} className="px-2 py-1 bg-sky-900 hover:bg-sky-700 rounded">☀️ Pagi</button>
              <button onClick={() => { setBloodMoon(false); setHour(16.25); }} className="px-2 py-1 bg-orange-900 hover:bg-orange-700 rounded">🌅 Sore</button>
              <button onClick={() => { setBloodMoon(false); setHour(18.2); }} className="px-2 py-1 bg-purple-900 hover:bg-purple-700 rounded">🌆 Senja</button>
              <button onClick={() => { setBloodMoon(false); setHour(22.0); }} className="px-2 py-1 bg-indigo-950 hover:bg-indigo-800 rounded">🌌 Malam Aurora</button>
              <button onClick={() => { setHour(22.0); setBloodMoon(true); }} className="px-2 py-1 bg-rose-950 hover:bg-rose-800 rounded">🩸 Bulan Merah</button>
            </div>
          </div>

          {/* Top-Center World Clock & Weather HUD */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-5 py-2 bg-amber-950/90 border-2 border-amber-500/70 rounded-2xl text-amber-100 shadow-xl backdrop-blur-md">
            <span className="text-xl" role="img" aria-label="phase">
              {isNight ? (isBloodMoon ? "🩸" : "🌙") : "☀️"}
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-amber-300">{formatGameClock(hour)}</span>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-800/80 text-amber-200">{phaseLabel}</span>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-sky-900/80 text-sky-200 border border-sky-600/40">{weatherLabel}</span>
                {timeScale > 1 && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">{timeScale}x</span>}
              </div>
              <span className="text-[11px] text-amber-200/75">
                Hari ke-{day} {isInBoat ? "• 🚤 Mengemudi Perahu" : isSwimming ? "• 🏊 Berenang" : ""}
              </span>
            </div>
          </div>

          {/* Center-Bottom Interaction Prompt */}
          {interactionPrompt && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 px-6 py-3 bg-amber-950/95 border-2 border-amber-400 rounded-xl text-amber-100 font-semibold text-sm shadow-2xl animate-bounce">
              ✨ {interactionPrompt}
            </div>
          )}

          {/* Top-Right Status & Quick Action Buttons */}
          <div className="absolute top-4 right-4 z-10 px-4 py-2.5 text-xs text-amber-100 bg-amber-950/85 border-2 border-amber-700/60 rounded-xl backdrop-blur-sm space-y-2 shadow-lg">
            <div className="font-semibold text-amber-300">Wayfarer Realm v1.0</div>
            <div>Posisi: X: {position[0]}m | Y: {position[1]}m | Z: {position[2]}m</div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button onClick={toggleMap} className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded font-semibold">🗺️ Peta (M)</button>
              <button onClick={toggleJournal} className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded font-semibold">📖 Jurnal (J)</button>
              <button onClick={togglePhotoMode} className="px-2.5 py-1 bg-sky-700 hover:bg-sky-600 rounded font-semibold">📷 Foto (P)</button>
              <button onClick={toggleMute} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded font-semibold">{isMuted ? "🔇 Bisu" : "🔊 Suara"}</button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-amber-100 bg-amber-950/85 border border-amber-600/60 rounded-lg hover:bg-amber-900 transition">
              Menu Utama
            </Link>
            <div className="px-3.5 py-2 text-xs text-amber-100/90 bg-slate-900/85 rounded-lg border border-slate-700/80">
              <b>WASD</b> Jalan • <b>Shift</b> Lari • <b>Spasi</b> Lompat • <b>E</b> Interaksi • <b>M</b> Peta • <b>J</b> Jurnal • <b>P</b> Foto
            </div>
          </div>
        </>
      )}
    </main>
  );
}
