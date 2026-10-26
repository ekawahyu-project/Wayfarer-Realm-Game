"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playerFrameState, usePlayerStore } from "@/game/state/usePlayerStore";
import { getWalkableHeight, getRiverCenterX } from "@/utils/noise";

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#140c06] text-[#fef3c7]">
      <div className="mb-4 h-14 w-14 animate-spin rounded-full border-4 border-[#f59e0b] border-t-transparent" />
      <h2 className="text-xl font-black tracking-wider text-[#fef08a] uppercase">Memuat Wayfarer Realm...</h2>
      <p className="mt-1 text-xs text-[#fde68a]/80">Menyiapkan dunia petualangan 3D...</p>
    </div>
  ),
});

interface TeleportLocation {
  label: string;
  sub: string;
  icon: string;
  x: number;
  z: number;
  accent: string;
}

const TELEPORT_LOCATIONS: TeleportLocation[] = [
  { label: "Pantai Barat", sub: "Dermaga & Pasir", icon: "🏖️", x: -510, z: 0, accent: "border-amber-500/50 hover:border-amber-400 bg-amber-950/60" },
  { label: "Hutan Birch", sub: "Jembatan Sungai", icon: "🌳", x: 228, z: 0, accent: "border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/60" },
  { label: "Desa & Pasar Timur", sub: "Alun-Alun & Blacksmith", icon: "🏪", x: 342, z: -2, accent: "border-teal-500/50 hover:border-teal-400 bg-teal-950/60" },
  { label: "Pertanian & Kincir", sub: "Kincir Sungai & Ladang", icon: "🌾", x: 225, z: 106, accent: "border-yellow-500/50 hover:border-yellow-400 bg-yellow-950/60" },
  { label: "Air Terjun Hulu", sub: "Ngarai Tebing & Laguna", icon: "🌊", x: 238, z: 192, accent: "border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/60" },
  { label: "Kerajaan Besar", sub: "Benteng & Istana", icon: "🏰", x: 0, z: 305, accent: "border-purple-500/50 hover:border-purple-400 bg-purple-950/60" },
  { label: "Desa Barat Daya", sub: "Pesisir & Blacksmith", icon: "🏡", x: -280, z: 225, accent: "border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/60" },
  { label: "Desa Hutan Barat", sub: "Lembah & Blacksmith", icon: "🌲", x: -245, z: -80, accent: "border-green-500/50 hover:border-green-400 bg-green-950/60" },
  { label: "Kuil Maple", sub: "Bukit Musim Gugur", icon: "⛩️", x: -310, z: -245, accent: "border-orange-500/50 hover:border-orange-400 bg-orange-950/60" },
  { label: "Pegunungan Salju", sub: "Puncak Utara", icon: "🏔️", x: 20, z: -360, accent: "border-sky-500/50 hover:border-sky-400 bg-sky-950/60" },
  { label: "Pelabuhan Selatan", sub: "Kapal & Mercusuar", icon: "⚓", x: 0, z: 520, accent: "border-blue-500/50 hover:border-blue-400 bg-blue-950/60" },
];

const TIME_PRESETS = [
  { id: "morning", label: "Pagi Cerah", icon: "☀️", hour: 8.0, weather: "Cerah", cls: "border-sky-400/50 bg-sky-950/70 hover:bg-sky-900/80" },
  { id: "afternoon", label: "Sore Hangat", icon: "🌅", hour: 16.0, weather: "Cerah", cls: "border-amber-400/50 bg-amber-950/70 hover:bg-amber-900/80" },
  { id: "dusk", label: "Senja Ungu", icon: "🌆", hour: 18.2, weather: "Cerah", cls: "border-purple-400/50 bg-purple-950/70 hover:bg-purple-900/80" },
  { id: "aurora", label: "Malam Aurora", icon: "🌌", hour: 22.0, weather: "Cerah", cls: "border-indigo-400/50 bg-indigo-950/70 hover:bg-indigo-900/80" },
  { id: "bloodmoon", label: "Bulan Merah", icon: "🩸", hour: 23.0, weather: "Bulan Merah", cls: "border-rose-500/50 bg-rose-950/70 hover:bg-rose-900/80" },
];

export default function PlayPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [equipped, setEquipped] = useState<'sword' | 'lantern' | 'none'>('sword');

  const [hudState, setHudState] = useState({
    x: Math.round(playerFrameState.x || 0),
    y: Math.round(playerFrameState.y || 8),
    z: Math.round(playerFrameState.z || 0),
    clock: "08:30",
    phase: "PAGI",
    weather: "Cerah",
    day: 1,
  });

  // Fungsi Ganti Senjata: Klik/Tekan 1 = Pedang, Klik/Tekan 2 = Lentera, Klik lagi tombol yang sedang aktif = Tanpa Senjata ('none')!
  const toggleWeapon = useCallback((target: 'sword' | 'lantern') => {
    setEquipped((prev) => {
      const next = prev === target ? 'none' : target;
      (playerFrameState as any).equippedItem = next;
      return next;
    });
  }, []);

  // Fungsi Teleport Instan yang Terhubung Langsung ke Loop Fisika PlayerController!
  const handleTeleport = useCallback((tx: number, tz: number) => {
    const safeX = Number.isFinite(tx) ? tx : 228;
    const safeZ = Number.isFinite(tz) ? tz : 0;
    const rawY = getWalkableHeight(safeX, safeZ);
    const safeY = (Number.isFinite(rawY) ? Math.max(1.2, rawY) : 8.2) + 0.25;
    playerFrameState.mountedHorseIndex = -1;
    playerFrameState.isInBoat = false;
    playerFrameState.x = safeX;
    playerFrameState.y = safeY;
    playerFrameState.z = safeZ;
    playerFrameState.vx = 0;
    playerFrameState.vy = 0;
    playerFrameState.vz = 0;
    (playerFrameState as any).pendingTeleport = { x: safeX, y: safeY, z: safeZ };
    setHudState((h) => ({ ...h, x: Math.round(safeX), y: Math.round(safeY), z: Math.round(safeZ) }));
    setSidebarOpen(false);
  }, []);

  // Fungsi Ubah Suasana Waktu & Cuaca (Tanpa dynamic import yang memicu error Webpack!)
  const handleSetTimePreset = useCallback((preset: typeof TIME_PRESETS[number]) => {
    const tState: any = (globalThis as any).__wayfarerTimeState;
    if (tState) {
      tState.hour = preset.hour;
      if ('bloodMoon' in tState) tState.bloodMoon = preset.id === 'bloodmoon';
      if ('isBloodMoon' in tState) tState.isBloodMoon = preset.id === 'bloodmoon';
      if ('aurora' in tState) tState.aurora = preset.id === 'aurora';
      if ('weather' in tState) tState.weather = preset.weather;
      if ('weatherLabel' in tState) tState.weatherLabel = preset.weather;
    }
    const pState: any = playerFrameState;
    pState.overrideHour = preset.hour;
    pState.overrideWeather = preset.weather;
    pState.overrideBloodMoon = preset.id === 'bloodmoon';
    window.dispatchEvent(new CustomEvent('wayfarer:timePreset', { detail: preset }));
    const hh = Math.floor(preset.hour);
    const mm = Math.floor((preset.hour - hh) * 60);
    setHudState((h) => ({
      ...h,
      clock: String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0'),
      phase: hh >= 5 && hh < 11 ? 'PAGI' : hh >= 11 && hh < 15 ? 'SIANG' : hh >= 15 && hh < 18 ? 'SORE' : hh >= 18 && hh < 20 ? 'SENJA' : 'MALAM',
      weather: preset.weather,
    }));
    setSidebarOpen(false);
  }, []);

  // Sinkronisasi Posisi & Jam di HUD
  useEffect(() => {
    (playerFrameState as any).equippedItem = equipped;
    const timer = setInterval(() => {
      const px = Math.round(playerFrameState.x || 0);
      const py = Math.round(playerFrameState.y || 8);
      const pz = Math.round(playerFrameState.z || 0);
      setHudState((prev) => (prev.x === px && prev.y === py && prev.z === pz ? prev : { ...prev, x: px, y: py, z: pz }));
    }, 200);
    return () => clearInterval(timer);
  }, [equipped]);

  // Shortcut Keyboard: 1 = Pedang (Toggle), 2 = Lentera (Toggle), M = Peta, J = Jurnal, P = Foto, O = Opsi
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Digit1') toggleWeapon('sword');
      if (e.code === 'Digit2') toggleWeapon('lantern');
      if (e.code === 'KeyM') setMapOpen((v) => !v);
      if (e.code === 'KeyJ') setJournalOpen((v) => !v);
      if (e.code === 'KeyP') setPhotoMode((v) => !v);
      if (e.code === 'KeyO') setSettingsOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleWeapon]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      <GameCanvas />

      {!photoMode && (
        <div className="pointer-events-none fixed inset-0 z-20">
          {/* 1. KIRI ATAS: Tombol Sidebar Garis Tiga (☰) + Kartu Profil Karakter */}
          <div className="pointer-events-auto fixed top-4 left-4 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              title="Buka Menu Navigasi & Pengaturan"
              className="group relative flex h-13 w-13 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-[#fbbf24]/80 bg-gradient-to-b from-[#78350f] via-[#451a03] to-[#290f02] shadow-[0_4px_0_#1a0901,0_8px_16px_rgba(0,0,0,0.5)] transition-all hover:scale-105 hover:border-[#fde047] active:translate-y-0.5"
            >
              <span className="h-0.5 w-6 rounded-full bg-[#fef08a] transition-transform group-hover:scale-x-110" />
              <span className="h-0.5 w-6 rounded-full bg-[#fef08a]" />
              <span className="h-0.5 w-6 rounded-full bg-[#fef08a] transition-transform group-hover:scale-x-110" />
            </button>

            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#fbbf24]/60 bg-gradient-to-b from-[#451a03]/90 to-[#1f0b01]/90 px-3 py-1.5 backdrop-blur-md shadow-[0_4px_0_#1a0901,0_8px_16px_rgba(0,0,0,0.45)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#f59e0b]/60 bg-gradient-to-b from-[#d97706] to-[#78350f] text-xl shadow-inner">
                🧣
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wide text-[#fef08a]">Ekazaki</span>
                  <span className="rounded bg-[#78350f] px-1.5 py-0.5 text-[10px] font-extrabold text-[#fde68a]">Lv. 07</span>
                </div>
                <p className="mt-0.5 text-[10px] font-semibold text-[#fde68a]/80">
                  X: {hudState.x}m • Y: {hudState.y}m • Z: {hudState.z}m
                </p>
              </div>
            </div>
          </div>

          {/* 2. TENGAH ATAS (100% CENTERED!): Kompas Waktu, Cuaca & Hari Bergaya RPG Modern */}
          <div className="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3.5 rounded-full border-2 border-[#fbbf24]/65 bg-gradient-to-b from-[#451a03]/90 via-[#2a1003]/90 to-[#170801]/90 px-5 py-2 backdrop-blur-md shadow-[0_4px_0_#1a0901,0_10px_24px_rgba(0,0,0,0.5)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#fbbf24]/50 bg-[#78350f]/60 text-lg shadow-inner">
                {hudState.phase === "MALAM" ? "🌙" : "☀️"}
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-base font-black tracking-wider text-[#fef08a]">{hudState.clock}</span>
                <span className="rounded-full border border-[#f59e0b]/50 bg-[#92400e] px-2.5 py-0.5 text-[10px] font-black tracking-wider text-[#fffbeb] uppercase">
                  {hudState.phase}
                </span>
                <span className="rounded-full border border-sky-400/50 bg-sky-900/90 px-2.5 py-0.5 text-[10px] font-black text-sky-100">
                  {hudState.weather}
                </span>
              </div>
              <span className="hidden border-l border-[#92400e] pl-3 text-[11px] font-bold text-[#fde68a]/85 sm:inline">
                Hari ke-{hudState.day}
              </span>
            </div>
          </div>

          {/* 3. KANAN ATAS: Deretan Ikon RPG Vertikal Berpita Kayu */}
          <div className="pointer-events-auto fixed top-4 right-4 flex flex-col items-end gap-3">
            {[
              { label: "Peta (M)", icon: "🗺️", bg: "from-[#fbbf24] to-[#b45309]", onClick: () => setMapOpen((v) => !v) },
              { label: "Jurnal (J)", icon: "📜", bg: "from-[#fb923c] to-[#c2410c]", badge: "!", onClick: () => setJournalOpen((v) => !v) },
              { label: "Foto (P)", icon: "📷", bg: "from-[#38bdf8] to-[#0369a1]", onClick: () => setPhotoMode(true) },
              { label: "Opsi (O)", icon: "⚙️", bg: "from-[#a855f7] to-[#6b21a8]", onClick: () => setSettingsOpen((v) => !v) },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                className="group relative flex flex-col items-center transition-transform hover:scale-105 active:translate-y-0.5"
              >
                {btn.badge && (
                  <span className="absolute -top-1 -right-1 z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-[#3b1d08] bg-red-500 text-[10px] font-black text-white shadow">
                    {btn.badge}
                  </span>
                )}
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-[#3b1d08] bg-gradient-to-b ${btn.bg} text-xl shadow-[0_3px_0_#3b1d08]`}>
                  {btn.icon}
                </div>
                <span className="-mt-1.5 rounded-md border border-[#3b1d08] bg-[#451a03] px-2 py-0.5 text-[10px] font-black text-[#fef3c7] shadow">
                  {btn.label}
                </span>
              </button>
            ))}
          </div>

          {/* 4. TENGAH BAWAH: HOTBAR SENJATA INTERAKTIF (1 = Pedang, 2 = Lentera, Klik Lagi = Tanpa Senjata!) */}
          <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#fbbf24]/65 bg-gradient-to-b from-[#451a03]/95 to-[#1a0901]/95 p-1.5 backdrop-blur-md shadow-[0_4px_0_#1a0901,0_10px_20px_rgba(0,0,0,0.5)]">
              {/* Slot 1: Pedang Ksatria */}
              <button
                onClick={() => toggleWeapon('sword')}
                className={`relative flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition-all ${
                  equipped === 'sword'
                    ? 'border-[#fde047] bg-gradient-to-b from-[#d97706] to-[#92400e] text-white shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-105'
                    : 'border-[#78350f] bg-[#290f02]/80 text-[#fde68a]/80 hover:border-[#b45309]'
                }`}
              >
                <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-[#fef08a]">1</span>
                <span className="text-base">⚔️</span>
                <span>Pedang</span>
              </button>

              {/* Slot 2: Lentera Bercahaya (Tangan Diangkat) */}
              <button
                onClick={() => toggleWeapon('lantern')}
                className={`relative flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 text-xs font-black transition-all ${
                  equipped === 'lantern'
                    ? 'border-[#fde047] bg-gradient-to-b from-[#ea580c] to-[#9a3412] text-white shadow-[0_0_12px_rgba(251,146,60,0.5)] scale-105'
                    : 'border-[#78350f] bg-[#290f02]/80 text-[#fde68a]/80 hover:border-[#b45309]'
                }`}
              >
                <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] text-[#fef08a]">2</span>
                <span className="text-base">🏮</span>
                <span>Lentera</span>
              </button>

              {/* Status Tangan Kosong */}
              {equipped !== 'none' && (
                <button
                  onClick={() => { setEquipped('none'); (playerFrameState as any).equippedItem = 'none'; }}
                  title="Simpan Senjata (Tangan Kosong)"
                  className="rounded-xl border-2 border-[#78350f] bg-[#290f02]/80 px-2.5 py-2 text-[11px] font-bold text-[#fde68a]/80 hover:border-red-400 hover:text-white"
                >
                  🤚 Simpan
                </button>
              )}
            </div>

            <div className="rounded-full border border-[#78350f]/80 bg-black/65 px-4 py-1 text-[10px] font-semibold text-[#fde68a]/90 backdrop-blur-xs">
              WASD: Jalan • Shift: Lari • E: Interaksi / Kuda • Tekan [1] Pedang / [2] Lentera (Tekan lagi untuk Tangan Kosong)
            </div>
          </div>

          {/* KIRI & KANAN BAWAH */}
          <Link
            href="/"
            className="pointer-events-auto fixed bottom-4 left-4 rounded-xl border-2 border-[#fbbf24]/50 bg-[#290f02]/90 px-3.5 py-2 text-xs font-black text-[#fef3c7] shadow-lg transition hover:border-[#fbbf24]"
          >
            ⬅ Menu Utama
          </Link>
        </div>
      )}

      {photoMode && (
        <button
          onClick={() => setPhotoMode(false)}
          className="pointer-events-auto fixed top-5 right-5 z-50 rounded-2xl border-2 border-white/40 bg-red-600 px-4 py-2 text-xs font-black text-white shadow-xl"
        >
          ✕ Keluar Mode Foto (P)
        </button>
      )}

      {/* SIDEBAR DRAWER RPG ELEGAN (Teleport 100% Berfungsi & Tanpa Teks Terpotong!) */}
      {sidebarOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex h-full w-[400px] max-w-[92vw] flex-col justify-between overflow-y-auto border-r-2 border-[#fbbf24]/50 bg-gradient-to-b from-[#261105]/95 via-[#180a02]/95 to-[#0f0601]/95 p-5 text-[#fef3c7] backdrop-blur-md shadow-[10px_0_35px_rgba(0,0,0,0.75)]">
            <div className="space-y-5">
              {/* Header Sidebar */}
              <div className="flex items-center justify-between border-b border-[#fbbf24]/25 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#fbbf24]/60 bg-gradient-to-b from-[#d97706] to-[#78350f] text-xl shadow">
                    🧭
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-wider text-[#fef08a] uppercase">Kompas Perjalanan</h2>
                    <p className="text-[11px] text-[#fde68a]/75">Pilih tujuan untuk berpindah seketika</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/40 bg-red-900/70 text-xs font-black text-white hover:bg-red-700"
                >
                  ✕
                </button>
              </div>

              {/* Daftar Kartu Teleport Lokasi Cepat (Termasuk Pertanian & Air Terjun!) */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#fbbf24] uppercase">
                  <span>⚡</span> Teleport Lokasi Cepat (11 Wilayah)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TELEPORT_LOCATIONS.map((loc) => (
                    <button
                      key={loc.label}
                      onClick={() => handleTeleport(loc.x, loc.z)}
                      className={`group flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all hover:scale-[1.02] active:scale-98 ${loc.accent}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/35 text-base shadow-inner">
                        {loc.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black leading-tight text-white group-hover:text-[#fef08a]">{loc.label}</p>
                        <p className="mt-0.5 text-[9px] font-medium text-white/70">{loc.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ubah Suasana Waktu & Cuaca */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#fbbf24] uppercase">
                  <span>🕒</span> Ubah Suasana Waktu & Langit
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_PRESETS.map((tp) => (
                    <button
                      key={tp.id}
                      onClick={() => handleSetTimePreset(tp)}
                      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-xs font-bold text-white transition-all hover:scale-[1.02] ${tp.cls}`}
                    >
                      <span className="text-base">{tp.icon}</span>
                      <span>{tp.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pintasan Peralatan & Pengaturan */}
              <div>
                <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#fbbf24] uppercase">
                  <span>⚔️</span> Pilih Senjata & Menu
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => toggleWeapon('sword')} className={`rounded-xl border py-2 text-xs font-black ${equipped === 'sword' ? 'border-amber-400 bg-amber-700 text-white' : 'border-amber-500/30 bg-amber-950/50 text-amber-200'}`}>⚔️ Pedang (1)</button>
                  <button onClick={() => toggleWeapon('lantern')} className={`rounded-xl border py-2 text-xs font-black ${equipped === 'lantern' ? 'border-orange-400 bg-orange-700 text-white' : 'border-orange-500/30 bg-orange-950/50 text-orange-200'}`}>🏮 Lentera (2)</button>
                  <button onClick={() => { setEquipped('none'); (playerFrameState as any).equippedItem = 'none'; }} className={`rounded-xl border py-2 text-xs font-black ${equipped === 'none' ? 'border-emerald-400 bg-emerald-700 text-white' : 'border-slate-500/30 bg-slate-900/60 text-slate-300'}`}>🤚 Kosong</button>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-[#fbbf24]/20 pt-3 text-[11px] text-[#fde68a]/70">
              <p className="font-bold text-[#fef08a]">Wayfarer Realm • Koordinat Aktif: ({hudState.x}m, {hudState.y}m, {hudState.z}m)</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PETA DUNIA (M) */}
      {mapOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-3xl border-2 border-[#fbbf24]/60 bg-[#1c0d04]/95 p-6 text-[#fef3c7] shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#fbbf24]/25 pb-3">
              <h2 className="text-base font-black text-[#fef08a] uppercase">🗺️ Peta Perjalanan Cepat</h2>
              <button onClick={() => setMapOpen(false)} className="rounded-lg bg-red-700 px-3 py-1 text-xs font-black text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {TELEPORT_LOCATIONS.map((loc) => (
                <button
                  key={loc.label}
                  onClick={() => { handleTeleport(loc.x, loc.z); setMapOpen(false); }}
                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs font-bold text-white transition hover:scale-[1.02] ${loc.accent}`}
                >
                  <span>{loc.icon} {loc.label}</span>
                  <span className="text-[10px] opacity-75">({loc.x}, {loc.z})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL JURNAL (J) */}
      {journalOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-6 backdrop-blur-[1px]">
          <div className="relative w-full max-w-2xl rounded-3xl border-2 border-[#fbbf24]/60 bg-[#1e1b2e]/95 p-6 text-[#fef3c7] shadow-2xl">
            <div className="mb-3 inline-block rounded-xl border border-[#fbbf24]/50 bg-gradient-to-b from-[#fb923c] to-[#c2410c] px-4 py-1 text-xs font-black text-white">
              📜 Jurnal Petualangan Ekazaki
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-200">
              <li>• Kunjungi <b>🌾 Wilayah Pertanian & Kincir Air</b> di tepi aliran cabang sungai (X: 205m, Z: 85m).</li>
              <li>• Temui <b>🔥 Bengkel Pandai Besi (Blacksmith)</b> yang kini hadir di setiap pedesaan.</li>
              <li>• Jelajahi <b>🌊 Ngarai Pegunungan & Air Terjun Mengalir</b> di hulu sungai selatan (X: 235m, Z: 195m).</li>
              <li>• Tekan <b>[1]</b> untuk memakai Pedang, <b>[2]</b> untuk mengangkat Lentera, atau tekan kembali untuk menyimpan senjata.</li>
            </ul>
            <div className="mt-4 flex items-center gap-4 text-xs font-black">
              <button onClick={() => { handleTeleport(205, 85); setJournalOpen(false); }} className="text-[#fbbf24] hover:underline">▶ Teleport ke Pertanian & Kincir Air</button>
              <span className="text-slate-500">•</span>
              <button onClick={() => { handleTeleport(235, 195); setJournalOpen(false); }} className="text-cyan-400 hover:underline">▶ Teleport ke Air Terjun</button>
              <span className="text-slate-500">•</span>
              <button onClick={() => setJournalOpen(false)} className="text-indigo-300 hover:underline">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OPSI (O) */}
      {settingsOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-3xl border-2 border-[#fbbf24]/60 bg-[#1c0d04]/95 p-6 text-[#fef3c7] shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-[#fbbf24]/25 pb-3">
              <h2 className="text-sm font-black text-[#fef08a] uppercase">⚙️ Opsi & Penyimpanan</h2>
              <button onClick={() => setSettingsOpen(false)} className="rounded-lg bg-red-700 px-3 py-1 text-xs font-black text-white">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <button onClick={() => setSoundEnabled((s) => !s)} className="w-full rounded-xl border border-[#fbbf24]/40 bg-[#78350f] py-2.5 font-black text-white">
                {soundEnabled ? '🔊 Suara Permainan: AKTIF' : '🔇 Suara Permainan: SENYAP'}
              </button>
              <button onClick={() => { localStorage.setItem("wayfarer_save", JSON.stringify(hudState)); setSettingsOpen(false); }} className="w-full rounded-xl border border-emerald-400/40 bg-emerald-700 py-2.5 font-black text-white">
                💾 Simpan Posisi Saat Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
