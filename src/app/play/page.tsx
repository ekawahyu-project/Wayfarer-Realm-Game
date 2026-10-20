"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePlayerStore } from "@/game/state/usePlayerStore";
import { useTimeStore, formatGameClock } from "@/game/state/useTimeStore";
import { useJournalStore } from "@/game/state/useJournalStore";
import GameOverlayUI from "@/ui/GameOverlayUI";

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
  const interactionPrompt = usePlayerStore((s) => s.interactionPrompt);

  const hour = useTimeStore((s) => s.hour);
  const day = useTimeStore((s) => s.day);
  const phaseLabel = useTimeStore((s) => s.phaseLabel);
  const timeScale = useTimeStore((s) => s.timeScale);
  const isBloodMoon = useTimeStore((s) => s.isBloodMoon);

  const isHudHidden = useJournalStore((s) => s.isHudHidden);
  const toggleMap = useJournalStore((s) => s.toggleMap);
  const toggleJournal = useJournalStore((s) => s.toggleJournal);
  const isNight = hour >= 19 || hour < 5;

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <GameCanvas />

      {!isHudHidden && (
        <>
          <GameOverlayUI />

          {/* Top-Center World Clock HUD */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-5 py-2 bg-amber-950/90 border-2 border-amber-500/70 rounded-2xl text-amber-100 shadow-xl backdrop-blur-md">
            <span className="text-xl" role="img" aria-label="phase">
              {isNight ? (isBloodMoon ? "🩸" : "🌙") : "☀️"}
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-amber-300">{formatGameClock(hour)}</span>
                <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-800/80 text-amber-200">{phaseLabel}</span>
                {timeScale > 1 && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">{timeScale}x Cepat</span>}
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
            <div className="font-semibold text-amber-300">Milestone M6: NPC, Peta & Jurnal</div>
            <div>Posisi: X: {position[0]}m | Y: {position[1]}m | Z: {position[2]}m</div>
            <div className="flex gap-2 pt-1">
              <button onClick={toggleMap} className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded font-semibold">
                🗺️ Peta (M)
              </button>
              <button onClick={toggleJournal} className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 rounded font-semibold">
                📖 Jurnal (J)
              </button>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-amber-100 bg-amber-950/85 border border-amber-600/60 rounded-lg hover:bg-amber-900 transition">
              Kembali ke Menu
            </Link>
            <div className="px-3.5 py-2 text-xs text-amber-100/90 bg-slate-900/85 rounded-lg border border-slate-700/80">
              <b>WASD</b> Gerak • <b>E</b> Bicara/Ambil/Perahu • <b>M</b> Peta • <b>J</b> Jurnal & Quest • <b>H</b> Sembunyikan HUD • <b>T</b> Waktu 30x
            </div>
          </div>
        </>
      )}
    </main>
  );
}
