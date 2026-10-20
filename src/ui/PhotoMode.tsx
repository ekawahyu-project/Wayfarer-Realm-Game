"use client";

import { useEffect } from "react";
import { useWeatherStore, PhotoFilter } from "@/game/state/useWeatherStore";
import { useTimeStore, formatGameClock } from "@/game/state/useTimeStore";

const FILTER_CLASSES: Record<PhotoFilter, string> = {
  none: "",
  warm: "sepia-[0.25] saturate-150 contrast-105",
  vintage: "sepia-[0.65] contrast-110 brightness-95",
  cool: "hue-rotate-15 saturate-125 contrast-110",
  dreamy: "saturate-150 brightness-105 contrast-95",
};

export default function PhotoMode() {
  const isPhotoMode = useWeatherStore((s) => s.isPhotoMode);
  const photoFov = useWeatherStore((s) => s.photoFov);
  const photoFilter = useWeatherStore((s) => s.photoFilter);
  const togglePhotoMode = useWeatherStore((s) => s.togglePhotoMode);
  const setPhotoFov = useWeatherStore((s) => s.setPhotoFov);
  const setPhotoFilter = useWeatherStore((s) => s.setPhotoFilter);

  const hour = useTimeStore((s) => s.hour);
  const setHour = useTimeStore((s) => s.setHour);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyP") {
        togglePhotoMode();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [togglePhotoMode]);

  const capturePNG = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "wayfarer-realm-photo-" + Date.now() + ".png";
    a.click();
  };

  if (!isPhotoMode) return null;

  return (
    <div className={"pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-6 " + FILTER_CLASSES[photoFilter]}>
      {/* Camera Viewfinder Corners */}
      <div className="flex justify-between">
        <div className="w-12 h-12 border-t-4 border-l-4 border-amber-300/80 rounded-tl-lg" />
        <div className="pointer-events-auto px-4 py-1.5 bg-slate-950/85 border border-amber-500/70 rounded-full text-xs font-bold text-amber-300 tracking-wider">
          📷 MODE FOTO • Tekan P untuk Keluar
        </div>
        <div className="w-12 h-12 border-t-4 border-r-4 border-amber-300/80 rounded-tr-lg" />
      </div>

      <div className="flex justify-between items-end">
        <div className="w-12 h-12 border-b-4 border-l-4 border-amber-300/80 rounded-bl-lg" />

        {/* Photo Controls Bar */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-4 px-6 py-4 bg-amber-950/95 border-2 border-amber-500 rounded-2xl text-amber-100 text-xs shadow-2xl backdrop-blur-md">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-amber-300 font-semibold">Zoom FOV ({photoFov}°)</label>
            <input
              type="range"
              min={30}
              max={90}
              value={photoFov}
              onChange={(e) => setPhotoFov(Number(e.target.value))}
              className="w-28 accent-amber-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-amber-300 font-semibold">Jam Dunia ({formatGameClock(hour)})</label>
            <input
              type="range"
              min={0}
              max={23.9}
              step={0.25}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              className="w-28 accent-amber-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-amber-300 font-semibold">Filter Warna</label>
            <div className="flex gap-1.5">
              {(["none", "warm", "vintage", "cool", "dreamy"] as PhotoFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setPhotoFilter(f)}
                  className={"px-2.5 py-1 rounded capitalize font-semibold " + (photoFilter === f ? "bg-amber-400 text-slate-950" : "bg-slate-900 text-amber-200 hover:bg-slate-800")}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={capturePNG}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition"
          >
            💾 Simpan PNG
          </button>

          <button
            onClick={togglePhotoMode}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-200 font-semibold rounded-xl"
          >
            Tutup
          </button>
        </div>

        <div className="w-12 h-12 border-b-4 border-r-4 border-amber-300/80 rounded-br-lg" />
      </div>
    </div>
  );
}
