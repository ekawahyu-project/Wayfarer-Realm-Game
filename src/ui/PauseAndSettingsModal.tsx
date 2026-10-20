"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGameStore, QualityPreset } from "@/game/state/useGameStore";
import { useWeatherStore } from "@/game/state/useWeatherStore";
import { useTimeStore } from "@/game/state/useTimeStore";
import { saveGameProgress, loadGameProgress } from "@/game/core/save";

export default function PauseAndSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const qualityPreset = useGameStore((s) => s.qualityPreset);
  const setQualityPreset = useGameStore((s) => s.setQualityPreset);

  const masterVolume = useWeatherStore((s) => s.masterVolume);
  const musicVolume = useWeatherStore((s) => s.musicVolume);
  const sfxVolume = useWeatherStore((s) => s.sfxVolume);
  const ambientVolume = useWeatherStore((s) => s.ambientVolume);
  const setMasterVolume = useWeatherStore((s) => s.setMasterVolume);
  const setMusicVolume = useWeatherStore((s) => s.setMusicVolume);
  const setSfxVolume = useWeatherStore((s) => s.setSfxVolume);
  const setAmbientVolume = useWeatherStore((s) => s.setAmbientVolume);

  const dayLengthMinutes = useTimeStore((s) => s.dayLengthMinutes);
  const setDayLengthMinutes = useTimeStore((s) => s.setDayLengthMinutes);

  // Load saved game on initial mount & start 60-second auto-save timer (PRD 6.9)
  useEffect(() => {
    loadGameProgress();
    const interval = setInterval(() => {
      saveGameProgress(false);
    }, 60000);
    const onBeforeUnload = () => saveGameProgress(false);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyO") {
        setIsOpen((prev) => !prev);
        if (document.pointerLockElement) document.exitPointerLock?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {/* Quick Settings Button on Top-Left under Perf */}
      <button
        onClick={() => {
          if (document.pointerLockElement) document.exitPointerLock?.();
          setIsOpen(true);
        }}
        className="absolute bottom-4 right-4 z-20 px-4 py-2 text-xs font-bold text-amber-100 bg-amber-950/90 hover:bg-amber-800 border-2 border-amber-500/70 rounded-xl shadow-lg transition"
      >
        ⚙️ Pengaturan & Simpan (O)
      </button>

      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-6">
          <div className="w-full max-w-xl bg-amber-950/95 border-2 border-amber-500 rounded-2xl p-6 text-amber-100 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-amber-700 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-amber-300">⚙️ Menu Jeda & Pengaturan</h2>
                <p className="text-xs text-amber-200/75">Atur kualitas grafis, volume suara, dan simpan progres petualanganmu</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="px-3.5 py-1.5 text-xs font-bold bg-amber-800 hover:bg-amber-700 rounded-lg">
                Lanjutkan (O)
              </button>
            </div>

            {/* Graphics Preset Selector (PRD 8.6) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400">Preset Kualitas Grafis</label>
              <div className="grid grid-cols-3 gap-2.5">
                {([
                  { id: "low", label: "Rendah (30+ FPS)", desc: "0.75x DPR • Tanpa Efek Berat" },
                  { id: "medium", label: "Sedang (60 FPS)", desc: "1.0x DPR • Bloom & Vignette" },
                  { id: "high", label: "Tinggi (Ultra)", desc: "1.5x DPR • MSAA + Bloom Penuh" },
                ] as { id: QualityPreset; label: string; desc: string }[]).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setQualityPreset(p.id)}
                    className={"p-3 rounded-xl border text-left transition " + (qualityPreset === p.id ? "bg-amber-400 text-slate-950 border-amber-200 font-bold" : "bg-slate-900/80 border-amber-700/50 text-amber-100 hover:bg-slate-800")}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className={"text-[10px] mt-0.5 " + (qualityPreset === p.id ? "text-slate-800" : "text-amber-200/70")}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Sliders (PRD 9.3) */}
            <div className="space-y-3 bg-slate-900/75 p-4 rounded-xl border border-amber-800/50">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Pengaturan Audio</div>
              {[
                { label: "Volume Utama (Master)", val: masterVolume, set: setMasterVolume },
                { label: "Volume Musik Latar", val: musicVolume, set: setMusicVolume },
                { label: "Volume Efek Langkah Kaki", val: sfxVolume, set: setSfxVolume },
                { label: "Volume Lingkungan (Ombak/Hujan)", val: ambientVolume, set: setAmbientVolume },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                  <span>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={item.val}
                      onChange={(e) => item.set(Number(e.target.value))}
                      className="w-36 accent-amber-400"
                    />
                    <span className="w-9 text-right font-mono text-amber-300">{Math.round(item.val * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Day Length Setting (PRD 7.1) */}
            <div className="flex items-center justify-between text-xs bg-slate-900/75 p-3.5 rounded-xl border border-amber-800/50">
              <span>Durasi 1 Hari Dunia ({dayLengthMinutes} Menit Nyata)</span>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={dayLengthMinutes}
                onChange={(e) => setDayLengthMinutes(Number(e.target.value))}
                className="w-36 accent-amber-400"
              />
            </div>

            {/* Save & Exit Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  saveGameProgress(true);
                  setIsOpen(false);
                }}
                className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition"
              >
                💾 Simpan Progres Sekarang
              </button>
              <Link
                href="/"
                onClick={() => saveGameProgress(false)}
                className="py-2.5 px-5 bg-amber-900 hover:bg-amber-800 border border-amber-600 text-amber-100 font-semibold text-xs rounded-xl transition"
              >
                Keluar ke Menu Utama
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
