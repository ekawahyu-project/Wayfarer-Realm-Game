"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePlayerStore } from "@/game/state/usePlayerStore";
import { useTimeStore, formatGameClock } from "@/game/state/useTimeStore";

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
  const activeChunks = usePlayerStore((s) => s.activeChunks);
  const hour = useTimeStore((s) => s.hour);
  const day = useTimeStore((s) => s.day);
  const phaseLabel = useTimeStore((s) => s.phaseLabel);
  const timeScale = useTimeStore((s) => s.timeScale);
  const isBloodMoon = useTimeStore((s) => s.isBloodMoon);
  const isNight = hour >= 19 || hour < 5;

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none">
      <GameCanvas />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-5 py-2 bg-amber-950/85 border-2 border-amber-600/60 rounded-2xl text-amber-100 shadow-xl backdrop-blur-md">
        <span className="text-xl" role="img" aria-label="phase">
          {isNight ? (isBloodMoon ? "🩸" : "🌙") : "☀️"}
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-amber-300">{formatGameClock(hour)}</span>
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-800/70 text-amber-200">{phaseLabel}</span>
            {timeScale > 1 && <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">{timeScale}x Cepat</span>}
          </div>
          <span className="text-[11px] text-amber-200/75">Hari ke-{day} {isBloodMoon && isNight ? "• Event Bulan Merah" : ""}</span>
        </div>
      </div>
      <div className="absolute top-4 right-4 z-10 px-4 py-2.5 text-xs text-amber-100 bg-slate-950/75 border border-amber-700/50 rounded-xl backdrop-blur-sm space-y-1">
        <div className="font-semibold text-amber-400">Milestone M1 & M2 Aktif</div>
        <div>Posisi: X: {position[0]}m | Y: {position[1]}m | Z: {position[2]}m</div>
        <div>Chunk Aktif: {activeChunks} (100x100m)</div>
      </div>
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-3">
        <Link href="/" className="px-4 py-2 text-sm font-medium text-amber-100 bg-amber-950/80 border border-amber-700/60 rounded-lg hover:bg-amber-900 transition">
          Kembali ke Menu
        </Link>
        <div className="px-3.5 py-2 text-xs text-amber-100/90 bg-slate-900/80 rounded-lg border border-slate-700/80">
          <span className="font-semibold text-amber-300">Kontrol:</span> Klik layar (kunci kursor) • <b>WASD</b> Jalan • <b>Shift</b> Lari • <b>Spasi</b> Lompat • <b>T</b> Percepat Waktu (30x)
        </div>
      </div>
    </main>
  );
}
