"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import { getWalkableHeight } from "@/utils/noise";
import { timeFrameState } from "@/game/state/useTimeStore";
import { useTimeStore, formatGameClock } from "@/game/state/useTimeStore";
import { useJournalStore } from "@/game/state/useJournalStore";
import { useWeatherStore } from "@/game/state/useWeatherStore";
import GameOverlayUI from "@/ui/GameOverlayUI";
import PhotoMode from "@/ui/PhotoMode";
import PauseAndSettingsModal from "@/ui/PauseAndSettingsModal";

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#1a0f08] text-[#fef3c7]">
      <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-[#f59e0b] border-t-transparent" />
      <h2 className="text-xl font-black tracking-wider text-[#fef08a] uppercase">Memuat Wayfarer Realm...</h2>
      <p className="mt-1 text-xs text-[#fde68a]/80">Menyiapkan dunia petualangan 3D...</p>
    </div>
  ),
});

interface TeleportLocation {
  label: string;
  icon: string;
  x: number;
  z: number;
  badgeClass: string;
}

const TELEPORT_LOCATIONS: TeleportLocation[] = [
  { label: "Pantai", icon: "🏖️", x: -510, z: 0, badgeClass: "from-[#d97706] to-[#92400e]" },
  { label: "Hutan Birch", icon: "🌳", x: 185, z: 0, badgeClass: "from-[#b45309] to-[#78350f]" },
  { label: "Desa & Pasar Timur", icon: "🏪", x: 340, z: 0, badgeClass: "from-[#059669] to-[#065f46]" },
  { label: "Desa Barat Daya", icon: "🏡", x: -280, z: 225, badgeClass: "from-[#0d9488] to-[#115e59]" },
  { label: "Desa Hutan Barat", icon: "🌾", x: -245, z: -80, badgeClass: "from-[#16a34a] to-[#166534]" },
  { label: "Kerajaan Besar", icon: "🏰", x: 0, z: 305, badgeClass: "from-[#7c3aed] to-[#4c1d95]" },
  { label: "Kuil", icon: "⛩️", x: -310, z: -260, badgeClass: "from-[#c2410c] to-[#7c2d12]" },
  { label: "Salju", icon: "🏔️", x: 20, z: -360, badgeClass: "from-[#0284c7] to-[#075985]" },
  { label: "Pelabuhan", icon: "⚓", x: 0, z: 520, badgeClass: "from-[#b45309] to-[#78350f]" },
  { label: "Air Terjun", icon: "🌊", x: 235, z: 212, badgeClass: "from-[#0891b2] to-[#155e75]" },
];

const TIME_PRESETS = [
  { id: "morning", label: "Pagi", icon: "☀️", hour: 8.0, weather: "Cerah", cls: "from-[#0284c7] to-[#0369a1]" },
  { id: "afternoon", label: "Sore", icon: "🌅", hour: 16.2, weather: "Cerah", cls: "from-[#ea580c] to-[#9a3412]" },
  { id: "dusk", label: "Senja", icon: "🌆", hour: 18.2, weather: "Cerah", cls: "from-[#7c3aed] to-[#4c1d95]" },
  { id: "aurora", label: "Malam Aurora", icon: "🌌", hour: 22.0, weather: "Cerah", cls: "from-[#1d4ed8] to-[#1e1b4b]" },
  { id: "bloodmoon", label: "Bulan Merah", icon: "🩸", hour: 23.0, weather: "Bulan Merah", cls: "from-[#be123c] to-[#4c0519]" },
];

export default function PlayPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeWeapon, setActiveWeapon] = useState<'both' | 'sword' | 'lantern'>('both');

  const [hudState, setHudState] = useState({
    x: Math.round(playerFrameState.x || 0),
    y: Math.round(playerFrameState.y || 8),
    z: Math.round(playerFrameState.z || 0),
    clock: "08:30",
    phase: "PAGI",
    weather: "Cerah",
    day: 1,
    nearHorse: false,
    isRiding: false,
  });

  // Sinkronisasi Telemetri HUD setiap 200ms (Ringan 60FPS!)
  useEffect(() => {
    const timer = setInterval(() => {
      const px = Math.round(playerFrameState.x || 0);
      const py = Math.round(playerFrameState.y || 8);
      const pz = Math.round(playerFrameState.z || 0);
      const tState: any = timeFrameState;
      const rawHour = typeof tState?.hour === 'number' ? tState.hour : 8.5;
      const hh = Math.floor(((rawHour % 24) + 24) % 24);
      const mm = Math.floor((rawHour - Math.floor(rawHour)) * 60);
      const clockStr = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
      const phaseStr =
        hh >= 5 && hh < 11 ? 'PAGI' :
        hh >= 11 && hh < 15 ? 'SIANG' :
        hh >= 15 && hh < 18 ? 'SORE' :
        hh >= 18 && hh < 20 ? 'SENJA' : 'MALAM';
      const weatherStr = tState?.weatherLabel || tState?.weather || 'Cerah';
      const dayNum = tState?.day || 1;

      setHudState({
        x: px,
        y: py,
        z: pz,
        clock: clockStr,
        phase: phaseStr,
        weather: String(weatherStr),
        day: dayNum,
        nearHorse: Boolean((playerFrameState as any).nearHorse),
        isRiding: playerFrameState.mountedHorseIndex !== undefined && playerFrameState.mountedHorseIndex !== -1,
      });
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Fungsi Teleport Lokasi Cepat
  const handleTeleport = useCallback((tx: number, tz: number) => {
    const ty = getWalkableHeight(tx, tz) + 0.15;
    playerFrameState.x = tx;
    playerFrameState.y = ty;
    playerFrameState.z = tz;
    if ((playerFrameState as any).velocity) {
      (playerFrameState as any).velocity.set?.(0, 0, 0);
    }
    const storeState: any = usePlayerStore.getState?.() || {};
    if (typeof storeState.setPosition === 'function') storeState.setPosition(tx, ty, tz);
    if (typeof storeState.teleportTo === 'function') storeState.teleportTo(tx, tz);
    window.dispatchEvent(new CustomEvent('wayfarer:teleport', { detail: { x: tx, y: ty, z: tz } }));
    setSidebarOpen(false);
  }, []);

  // Fungsi Ubah Suasana Waktu
  const handleSetTimePreset = useCallback((preset: typeof TIME_PRESETS[number]) => {
    const tState: any = timeFrameState;
    if (tState) {
      tState.hour = preset.hour;
      if ('bloodMoon' in tState) tState.bloodMoon = preset.id === 'bloodmoon';
      if ('isBloodMoon' in tState) tState.isBloodMoon = preset.id === 'bloodmoon';
      if ('aurora' in tState) tState.aurora = preset.id === 'aurora';
      if ('weatherLabel' in tState) tState.weatherLabel = preset.weather;
    }
    window.dispatchEvent(new CustomEvent('wayfarer:timePreset', { detail: preset }));
    setSidebarOpen(false);
  }, []);

  // Shortcut Keyboard (M = Peta, J = Jurnal, P = Foto, O = Pengaturan)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') setMapOpen((v) => !v);
      if (e.code === 'KeyJ') setJournalOpen((v) => !v);
      if (e.code === 'KeyP') setPhotoMode((v) => !v);
      if (e.code === 'KeyO') setSettingsOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* 3D World Canvas */}
      <GameCanvas />

      {/* HUD OVERLAY BERGAYA RPG 'LOST LEGENDS' (image_086013.jpg) */}
      {!photoMode && (
        <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4">
          {/* BARIS ATAS: Kiri (Sidebar ☰ + Profil Karakter) | Tengah (Banner Waktu Lost Legends) | Kanan (Stack Ikon RPG Berpita Kayu) */}
          <div className="flex items-start justify-between gap-4">
            {/* 1. KIRI ATAS: Tombol Sidebar Garis Tiga (☰) + Kartu Profil Karakter 'Ekazaki Lv. 07' */}
            <div className="pointer-events-auto flex items-center gap-3">
              {/* Tombol Ikon Garis Tiga (☰) Pembuka Sidebar */}
              <button
                onClick={() => setSidebarOpen(true)}
                title="Buka Menu, Teleport & Pengaturan"
                className="group relative flex h-14 w-14 flex-col items-center justify-center gap-1.5 rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#fbbf24] via-[#d97706] to-[#92400e] shadow-[0_5px_0_#3b1d08,0_8px_16px_rgba(0,0,0,0.45)] transition-all hover:scale-105 active:translate-y-1"
              >
                <span className="h-1 w-7 rounded-full bg-[#fffbeb] shadow-sm transition-transform group-hover:scale-x-110" />
                <span className="h-1 w-7 rounded-full bg-[#fffbeb] shadow-sm" />
                <span className="h-1 w-7 rounded-full bg-[#fffbeb] shadow-sm transition-transform group-hover:scale-x-110" />
                <span className="absolute -bottom-2 rounded-md border border-[#3b1d08] bg-[#78350f] px-1.5 py-0.5 text-[9px] font-black tracking-wider text-[#fef3c7] uppercase shadow">
                  Menu
                </span>
              </button>

              {/* Kartu Profil Karakter Bergaya 'Ekazaki Lv. 07' (Persis Referensi image_086013.jpg) */}
              <div className="relative flex items-center">
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#fbbf24] to-[#b45309] shadow-[0_5px_0_#3b1d08]">
                  <div className="flex h-13 w-13 items-center justify-center rounded-xl border border-[#78350f] bg-[#451a03] text-3xl shadow-inner">
                    🧣
                  </div>
                </div>
                <div className="-ml-3 flex flex-col justify-center rounded-r-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#d97706] to-[#78350f] py-1.5 pr-4 pl-5 shadow-[0_5px_0_#3b1d08]">
                  <div className="flex items-center gap-2 rounded-md border border-[#92400e] bg-[#fef3c7] px-2.5 py-0.5 shadow-inner">
                    <span className="text-xs font-black tracking-wide text-[#451a03]">Ekazaki</span>
                    <span className="text-[10px] font-bold text-[#92400e]">({hudState.x}m, {hudState.z}m)</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#fef08a] drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">Lv. 07</span>
                    <div className="h-2.5 w-24 overflow-hidden rounded-full border border-[#1e1b4b] bg-[#1e1b4b] p-0.5">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#a855f7] to-[#ec4899]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TENGAH ATAS: Plakat Jam & Cuaca Bergaya 'LOST LEGENDS' */}
            <div className="pointer-events-auto flex flex-col items-center">
              <div className="flex items-center gap-3 rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#78350f]/95 to-[#451a03]/95 px-5 py-2 shadow-[0_5px_0_#3b1d08,0_10px_20px_rgba(0,0,0,0.45)]">
                <span className="text-2xl drop-shadow">{hudState.phase === "MALAM" ? "🌙" : "☀️"}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-wider text-[#fef08a] drop-shadow-[0_2px_0_#3b1d08]">{hudState.clock}</span>
                    <span className="rounded-md border border-[#3b1d08] bg-[#b45309] px-2 py-0.5 text-[10px] font-black text-[#fffbeb] uppercase shadow-sm">{hudState.phase}</span>
                    <span className="rounded-md border border-[#1e3a8a] bg-[#0284c7] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">{hudState.weather}</span>
                  </div>
                  <p className="text-[11px] font-bold text-[#fde68a]/90">Hari ke-{hudState.day} • Wayfarer Realm</p>
                </div>
              </div>
            </div>

            {/* 3. KANAN ATAS: Deretan Tombol Vertikal Berpita Kayu (Persis Bag / Messages / Quest di image_086013.jpg!) */}
            <div className="pointer-events-auto flex flex-col items-end gap-3.5">
              {/* Tombol Peta (Mirip Bag di image_086013.jpg) */}
              <button
                onClick={() => setMapOpen((v) => !v)}
                className="group relative flex flex-col items-center transition-transform hover:scale-105 active:translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#fbbf24] to-[#d97706] text-2xl shadow-[0_4px_0_#3b1d08]">
                  🗺️
                </div>
                <span className="-mt-2 rounded-lg border-2 border-[#3b1d08] bg-gradient-to-b from-[#b45309] to-[#78350f] px-3 py-0.5 text-[11px] font-black text-[#fef3c7] shadow-[0_2px_0_#3b1d08]">
                  Peta (M)
                </span>
              </button>

              {/* Tombol Jurnal / Quest (Mirip Messages/Quest dengan Notifikasi Merah di image_086013.jpg) */}
              <button
                onClick={() => setJournalOpen((v) => !v)}
                className="group relative flex flex-col items-center transition-transform hover:scale-105 active:translate-y-1"
              >
                <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#3b1d08] bg-[#ef4444] text-[10px] font-black text-white shadow">
                  !
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#fb923c] to-[#c2410c] text-2xl shadow-[0_4px_0_#3b1d08]">
                  📜
                </div>
                <span className="-mt-2 rounded-lg border-2 border-[#3b1d08] bg-gradient-to-b from-[#b45309] to-[#78350f] px-3 py-0.5 text-[11px] font-black text-[#fef3c7] shadow-[0_2px_0_#3b1d08]">
                  Jurnal (J)
                </span>
              </button>

              {/* Tombol Mode Foto */}
              <button
                onClick={() => setPhotoMode(true)}
                className="group relative flex flex-col items-center transition-transform hover:scale-105 active:translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#38bdf8] to-[#0284c7] text-2xl shadow-[0_4px_0_#3b1d08]">
                  📷
                </div>
                <span className="-mt-2 rounded-lg border-2 border-[#3b1d08] bg-gradient-to-b from-[#b45309] to-[#78350f] px-3 py-0.5 text-[11px] font-black text-[#fef3c7] shadow-[0_2px_0_#3b1d08]">
                  Foto (P)
                </span>
              </button>

              {/* Tombol Pengaturan & Suara */}
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                className="group relative flex flex-col items-center transition-transform hover:scale-105 active:translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#a855f7] to-[#6b21a8] text-2xl shadow-[0_4px_0_#3b1d08]">
                  ⚙️
                </div>
                <span className="-mt-2 rounded-lg border-2 border-[#3b1d08] bg-gradient-to-b from-[#b45309] to-[#78350f] px-3 py-0.5 text-[11px] font-black text-[#fef3c7] shadow-[0_2px_0_#3b1d08]">
                  Opsi (O)
                </span>
              </button>
            </div>
          </div>

          {/* BARIS BAWAH: Petunjuk Kontrol Singkat & Tombol Menu Utama */}
          <div className="flex items-end justify-between">
            <Link
              href="/"
              className="pointer-events-auto rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#b45309] to-[#78350f] px-4 py-2 text-xs font-black text-[#fef3c7] shadow-[0_4px_0_#3b1d08] transition hover:brightness-110 active:translate-y-0.5"
            >
              ⬅ Menu Utama
            </Link>

            <div className="pointer-events-auto rounded-2xl border-[3px] border-[#3b1d08] bg-[#1e1b4b]/90 px-4 py-1.5 text-[11px] font-bold text-[#fef3c7] shadow-[0_4px_0_#3b1d08]">
              WASD: Jalan • Shift: Lari • Spasi: Lompat • E: Interaksi / Kuda • Klik ☰ di Kiri Atas untuk Teleport & Cuaca
            </div>

            <button
              onClick={() => setSoundEnabled((s) => !s)}
              className="pointer-events-auto rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#d97706] to-[#78350f] px-4 py-2 text-xs font-black text-[#fef3c7] shadow-[0_4px_0_#3b1d08] transition hover:brightness-110"
            >
              {soundEnabled ? "🔊 Suara: Aktif" : "🔇 Suara: Senyap"}
            </button>
          </div>
        </div>
      )}

      {/* Tombol Keluar dari Mode Foto */}
      {photoMode && (
        <button
          onClick={() => setPhotoMode(false)}
          className="pointer-events-auto fixed top-5 right-5 z-50 rounded-2xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#ef4444] to-[#991b1b] px-4 py-2 text-xs font-black text-white shadow-[0_4px_0_#3b1d08]"
        >
          ✕ Keluar Mode Foto (P)
        </button>
      )}

      {/* DRAWER SIDEBAR GARIS TIGA (☰): Memuat Teleport Lokasi Cepat, Suasana Waktu, & Pengaturan */}
      {sidebarOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex h-full w-96 max-w-[90vw] flex-col justify-between overflow-y-auto border-r-[4px] border-[#3b1d08] bg-gradient-to-b from-[#451a03] via-[#2a1205] to-[#1a0b02] p-5 text-[#fef3c7] shadow-2xl">
            <div className="space-y-5">
              {/* Header Sidebar */}
              <div className="flex items-center justify-between border-b-2 border-[#78350f] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#3b1d08] bg-gradient-to-b from-[#fbbf24] to-[#d97706] text-xl shadow">🧭</span>
                  <div>
                    <h2 className="text-base font-black tracking-wide text-[#fef08a] uppercase drop-shadow">Wayfarer Menu</h2>
                    <p className="text-[11px] text-[#fde68a]/80">Teleportasi, Suasana Waktu & Opsi</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#3b1d08] bg-[#dc2626] font-black text-white shadow hover:bg-[#ef4444]"
                >
                  ✕
                </button>
              </div>

              {/* Bagian 1: Teleport Lokasi Cepat (Termasuk Air Terjun!) */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-black tracking-wider text-[#fef08a] uppercase">
                  <span>⚡</span> Teleport Lokasi Cepat:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TELEPORT_LOCATIONS.map((loc) => (
                    <button
                      key={loc.label}
                      onClick={() => handleTeleport(loc.x, loc.z)}
                      className={`flex items-center gap-2 rounded-xl border-2 border-[#3b1d08] bg-gradient-to-b ${loc.badgeClass} px-3 py-2 text-left text-xs font-black text-white shadow-[0_3px_0_#3b1d08] transition hover:brightness-110 active:translate-y-0.5`}
                    >
                      <span className="text-base">{loc.icon}</span>
                      <span className="truncate">{loc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bagian 2: Ubah Suasana Waktu */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-black tracking-wider text-[#fef08a] uppercase">
                  <span>🕒</span> Ubah Suasana Waktu:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_PRESETS.map((tp) => (
                    <button
                      key={tp.id}
                      onClick={() => handleSetTimePreset(tp)}
                      className={`flex items-center gap-2 rounded-xl border-2 border-[#3b1d08] bg-gradient-to-b ${tp.cls} px-3 py-2 text-left text-xs font-black text-white shadow-[0_3px_0_#3b1d08] transition hover:brightness-110 active:translate-y-0.5`}
                    >
                      <span className="text-base">{tp.icon}</span>
                      <span>{tp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bagian 3: Pintasan Menu & Pengaturan */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-black tracking-wider text-[#fef08a] uppercase">
                  <span>🎒</span> Menu Petualang & Pengaturan:
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setSidebarOpen(false); setMapOpen(true); }} className="rounded-xl border-2 border-[#3b1d08] bg-[#b45309] px-3 py-2 text-xs font-black text-[#fffbeb] shadow-[0_3px_0_#3b1d08]">🗺️ Buka Peta (M)</button>
                  <button onClick={() => { setSidebarOpen(false); setJournalOpen(true); }} className="rounded-xl border-2 border-[#3b1d08] bg-[#b45309] px-3 py-2 text-xs font-black text-[#fffbeb] shadow-[0_3px_0_#3b1d08]">📜 Buka Jurnal (J)</button>
                  <button onClick={() => { setSidebarOpen(false); setPhotoMode(true); }} className="rounded-xl border-2 border-[#3b1d08] bg-[#0284c7] px-3 py-2 text-xs font-black text-white shadow-[0_3px_0_#3b1d08]">📷 Mode Foto (P)</button>
                  <button onClick={() => setSoundEnabled((s) => !s)} className="rounded-xl border-2 border-[#3b1d08] bg-[#6d28d9] px-3 py-2 text-xs font-black text-white shadow-[0_3px_0_#3b1d08]">{soundEnabled ? '🔊 Suara: ON' : '🔇 Suara: OFF'}</button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t-2 border-[#78350f] pt-3 text-[11px] text-[#fde68a]/80">
              <p className="font-bold text-[#fef08a]">Wayfarer Realm v1.0 • RPG Edition</p>
              <p>Posisi Saat Ini: X: {hudState.x}m | Y: {hudState.y}m | Z: {hudState.z}m</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PETA DUNIA (M) */}
      {mapOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border-[4px] border-[#3b1d08] bg-gradient-to-b from-[#78350f] to-[#451a03] p-6 text-[#fef3c7] shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b-2 border-[#92400e] pb-3">
              <h2 className="text-lg font-black text-[#fef08a] uppercase">🗺️ Peta Dunia Wayfarer Realm</h2>
              <button onClick={() => setMapOpen(false)} className="rounded-xl border-2 border-[#3b1d08] bg-[#dc2626] px-3 py-1 font-black text-white">✕</button>
            </div>
            <p className="mb-3 text-xs text-[#fde68a]">Pilih lokasi di bawah untuk langsung melakukan perjalanan cepat (Teleport):</p>
            <div className="grid grid-cols-2 gap-2.5">
              {TELEPORT_LOCATIONS.map((loc) => (
                <button
                  key={loc.label}
                  onClick={() => { handleTeleport(loc.x, loc.z); setMapOpen(false); }}
                  className={`flex items-center justify-between rounded-xl border-2 border-[#3b1d08] bg-gradient-to-b ${loc.badgeClass} px-3.5 py-2.5 text-xs font-black text-white shadow-[0_3px_0_#3b1d08] hover:brightness-110`}
                >
                  <span>{loc.icon} {loc.label}</span>
                  <span className="text-[10px] opacity-85">({loc.x}, {loc.z})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL JURNAL PETUALANG (J) — Bergaya Dialog 'Eve The Witcher' di image_086013.jpg */}
      {journalOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-6 backdrop-blur-[1px]">
          <div className="relative w-full max-w-2xl rounded-3xl border-[4px] border-[#3b1d08] bg-[#1e1b2e]/95 p-6 text-[#fef3c7] shadow-2xl">
            <div className=" -top-5 left-6 inline-block rounded-xl border-[3px] border-[#3b1d08] bg-gradient-to-b from-[#fb923c] to-[#c2410c] px-5 py-1.5 text-sm font-black text-white shadow-[0_4px_0_#3b1d08]">
              📜 Jurnal Misi & Petualangan
            </div>
            <ul className="mt-2 space-y-2 text-xs leading-relaxed text-slate-200">
              <li>• Jelajahi <b>🌊 Air Terjun Hulu Sungai</b> yang baru ditemukan di selatan hutan birch (X: 235m, Z: 212m).</li>
              <li>• Seberangi <b>Jembatan Kayu Lengkung</b> di atas sungai utama menuju <b>Desa & Pasar Timur</b>.</li>
              <li>• Gunakan <b>Lentera Bercahaya</b> di tangan kiri untuk menerangi malam dan <b>Pedang Ksatria</b> di tangan kanan.</li>
            </ul>
            <div className="mt-4 flex items-center gap-4 text-sm font-black">
              <button onClick={() => { handleTeleport(235, 212); setJournalOpen(false); }} className="text-[#fbbf24] hover:underline">▶ Teleport ke Air Terjun</button>
              <span className="text-slate-500">/</span>
              <button onClick={() => setJournalOpen(false)} className="text-indigo-400 hover:underline">Tutup Jurnal</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN & SIMPAN (O) */}
      {settingsOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4">
          <div className="w-full max-w-md rounded-3xl border-[4px] border-[#3b1d08] bg-gradient-to-b from-[#78350f] to-[#451a03] p-6 text-[#fef3c7] shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b-2 border-[#92400e] pb-3">
              <h2 className="text-base font-black text-[#fef08a] uppercase">⚙️ Pengaturan & Simpan Permainan</h2>
              <button onClick={() => setSettingsOpen(false)} className="rounded-xl border-2 border-[#3b1d08] bg-[#dc2626] px-3 py-1 font-black text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <button onClick={() => setSoundEnabled((s) => !s)} className="w-full rounded-xl border-2 border-[#3b1d08] bg-[#b45309] py-2.5 font-black text-white shadow-[0_3px_0_#3b1d08]">
                {soundEnabled ? '🔊 Efek Suara & Musik: AKTIF' : '🔇 Efek Suara & Musik: NONAKTIF'}
              </button>
              <button onClick={() => { localStorage.setItem("wayfarer_save", JSON.stringify(hudState)); setSettingsOpen(false); }} className="w-full rounded-xl border-2 border-[#3b1d08] bg-[#16a34a] py-2.5 font-black text-white shadow-[0_3px_0_#3b1d08]">
                💾 Simpan Posisi Saat Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
