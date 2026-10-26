"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { playerFrameState } from "@/game/state/usePlayerStore";
import { getWalkableHeight } from "@/utils/noise";

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
  { label: "Pantai Barat", sub: "Dermaga & Pasir", icon: "🏖️", x: -510, z: 0, accent: "border-amber-500/40 hover:border-amber-400 bg-amber-950/55" },
  { label: "Hutan Birch", sub: "Jembatan Sungai", icon: "🌳", x: 228, z: 0, accent: "border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/55" },
  { label: "Desa & Pasar Timur", sub: "Alun-Alun & Blacksmith", icon: "🏪", x: 342, z: -2, accent: "border-teal-500/40 hover:border-teal-400 bg-teal-950/55" },
  { label: "Pertanian & Kincir", sub: "Kincir Sungai & Ladang", icon: "🌾", x: 225, z: 106, accent: "border-yellow-500/40 hover:border-yellow-400 bg-yellow-950/55" },
  { label: "Air Terjun Hulu", sub: "Ngarai Tebing & Laguna", icon: "🌊", x: 238, z: 192, accent: "border-cyan-500/40 hover:border-cyan-400 bg-cyan-950/55" },
  { label: "Kerajaan Besar", sub: "Benteng & Istana", icon: "🏰", x: 0, z: 305, accent: "border-purple-500/40 hover:border-purple-400 bg-purple-950/55" },
  { label: "Desa Barat Daya", sub: "Pesisir & Blacksmith", icon: "🏡", x: -280, z: 225, accent: "border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/55" },
  { label: "Desa Hutan Barat", sub: "Lembah & Blacksmith", icon: "🌲", x: -245, z: -80, accent: "border-green-500/40 hover:border-green-400 bg-green-950/55" },
  { label: "Kuil Maple", sub: "Bukit Musim Gugur", icon: "⛩️", x: -310, z: -245, accent: "border-orange-500/40 hover:border-orange-400 bg-orange-950/55" },
  { label: "Pegunungan Salju", sub: "Puncak Utara", icon: "🏔️", x: 20, z: -360, accent: "border-sky-500/40 hover:border-sky-400 bg-sky-950/55" },
  { label: "Pelabuhan Selatan", sub: "Kapal & Mercusuar", icon: "⚓", x: 0, z: 520, accent: "border-blue-500/40 hover:border-blue-400 bg-blue-950/55" },
];

const TIME_PRESETS = [
  { id: "morning", label: "Pagi Cerah", icon: "☀️", hour: 8.0, weather: "Cerah", cls: "border-sky-400/40 bg-sky-950/65 hover:bg-sky-900/80" },
  { id: "afternoon", label: "Sore Hangat", icon: "🌅", hour: 16.0, weather: "Cerah", cls: "border-amber-400/40 bg-amber-950/65 hover:bg-amber-900/80" },
  { id: "dusk", label: "Senja Ungu", icon: "🌆", hour: 18.2, weather: "Cerah", cls: "border-purple-400/40 bg-purple-950/65 hover:bg-purple-900/80" },
  { id: "aurora", label: "Malam Aurora", icon: "🌌", hour: 22.0, weather: "Cerah", cls: "border-indigo-400/40 bg-indigo-950/65 hover:bg-indigo-900/80" },
  { id: "bloodmoon", label: "Bulan Merah", icon: "🩸", hour: 23.0, weather: "Bulan Merah", cls: "border-rose-500/40 bg-rose-950/65 hover:bg-rose-900/80" },
];

export default function PlayPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playerName, setPlayerName] = useState("Eka Wahyu");
  const [nameDraft, setNameDraft] = useState("Eka Wahyu");
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [nameSavedBadge, setNameSavedBadge] = useState(false);

  const [mapOpen, setMapOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [equipped, setEquipped] = useState<'sword' | 'lantern' | 'none'>('sword');

  const [hudState, setHudState] = useState({
    x: Math.round(playerFrameState.x || 228),
    y: Math.round(playerFrameState.y || 8),
    z: Math.round(playerFrameState.z || 0),
    clock: "08:30",
    phase: "PAGI",
    weather: "Cerah",
    day: 1,
  });

  // Muat nama tersimpan dari localStorage saat pertama kali buka
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wayfarer_player_name");
      if (saved && saved.trim()) {
        setPlayerName(saved.trim());
        setNameDraft(saved.trim());
      }
    } catch (_) {}
  }, []);

  // Fungsi Simpan Nama Baru (Langsung mengubah nama di Navbar Kiri Atas & menyimpan ke localStorage!)
  const handleSaveName = useCallback((customDraft?: string) => {
    const raw = typeof customDraft === 'string' ? customDraft : nameDraft;
    const clean = raw.trim() || "Eka Wahyu";
    setPlayerName(clean);
    setNameDraft(clean);
    setIsEditingInline(false);
    setNameSavedBadge(true);
    setTimeout(() => setNameSavedBadge(false), 2000);
    try {
      localStorage.setItem("wayfarer_player_name", clean);
    } catch (_) {}
  }, [nameDraft]);

  const toggleWeapon = useCallback((target: 'sword' | 'lantern') => {
    setEquipped((prev) => {
      const next = prev === target ? 'none' : target;
      (playerFrameState as any).equippedItem = next;
      return next;
    });
  }, []);

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

  useEffect(() => {
    (playerFrameState as any).equippedItem = equipped;
    const timer = setInterval(() => {
      const px = Math.round(playerFrameState.x || 0);
      const py = Math.round(playerFrameState.y || 8);
      const pz = Math.round(playerFrameState.z || 0);
      setHudState((prev) => (prev.x === px && prev.y === py && prev.z === pz ? prev : { ...prev, x: px, y: py, z: pz }));
    }, 250);
    return () => clearInterval(timer);
  }, [equipped]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditingInline || sidebarOpen) return;
      if (e.code === 'Digit1') toggleWeapon('sword');
      if (e.code === 'Digit2') toggleWeapon('lantern');
      if (e.code === 'KeyM') setMapOpen((v) => !v);
      if (e.code === 'KeyJ') setJournalOpen((v) => !v);
      if (e.code === 'KeyP') setPhotoMode((v) => !v);
      if (e.code === 'KeyO') setSettingsOpen((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleWeapon, isEditingInline, sidebarOpen]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      <GameCanvas />

      {!photoMode && (
        <div className="pointer-events-none fixed inset-0 z-20">
          {/* 1. KIRI ATAS: UNIFIED RPG NAVBAR DOCK (Tombol Menu ☰ Terintegrasi + Avatar Petualang + Nama Dinamis yang Bisa Diedit!) */}
          <div className="pointer-events-auto fixed top-4 left-4 flex items-center">
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#fbbf24]/70 bg-gradient-to-b from-[#3b1806]/95 via-[#240e03]/95 to-[#140701]/95 p-1.5 pr-4 backdrop-blur-md shadow-[0_5px_0_#120601,0_10px_24px_rgba(0,0,0,0.55)]">
              {/* Tombol Menu Sidebar Garis Tiga (☰) yang Proporsional & Tegas */}
              <button
                onClick={() => { setNameDraft(playerName); setSidebarOpen(true); }}
                title="Buka Menu Kompas, Teleport & Pengaturan"
                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#fbbf24]/80 bg-gradient-to-b from-[#f59e0b] via-[#d97706] to-[#92400e] text-[#fffbeb] shadow-[0_3px_0_#451a03] transition-all hover:brightness-110 active:translate-y-0.5"
              >
                <svg className="h-6 w-6 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5h16M4 12h16M4 17.5h16" />
                </svg>
              </button>

              {/* Avatar Ilustrasi Karakter Petualang Pixar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#fbbf24]/60 bg-gradient-to-b from-[#ea580c] to-[#7c2d12] shadow-inner overflow-hidden">
                <svg viewBox="0 0 36 36" className="h-10 w-10">
                  <circle cx="18" cy="20" r="10" fill="#ffcaa6" />
                  <path d="M7 17 C7 9, 29 9, 29 17 Z" fill="#d95338" />
                  <rect x="6" y="14" width="24" height="4.5" rx="2.2" fill="#f5ead8" />
                  <circle cx="13.5" cy="12.5" r="3.5" fill="#334155" stroke="#e5a93c" strokeWidth="1.4" />
                  <circle cx="22.5" cy="12.5" r="3.5" fill="#334155" stroke="#e5a93c" strokeWidth="1.4" />
                  <circle cx="14.5" cy="20.5" r="1.5" fill="#3b1d0e" />
                  <circle cx="21.5" cy="20.5" r="1.5" fill="#3b1d0e" />
                  <circle cx="18" cy="22" r="1.4" fill="#f87171" />
                  <path d="M9 28 C12 25, 24 25, 27 28 L29 36 L7 36 Z" fill="#c83223" />
                </svg>
              </div>

              {/* Nama Petualang (Bisa Diklik Langsung untuk Ganti Nama) + Level + Koordinat */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  {isEditingInline ? (
                    <div className="flex items-center gap-1" onKeyDown={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={nameDraft}
                        maxLength={18}
                        autoFocus
                        onChange={(e) => setNameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter") handleSaveName(nameDraft);
                          if (e.key === "Escape") setIsEditingInline(false);
                        }}
                        className="w-28 rounded border border-[#fbbf24] bg-black/80 px-2 py-0.5 text-xs font-black text-[#fef08a] outline-none"
                      />
                      <button
                        onClick={() => handleSaveName(nameDraft)}
                        className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-black text-white hover:bg-emerald-500"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setNameDraft(playerName); setIsEditingInline(true); }}
                      title="Klik untuk mengubah nama petualang"
                      className="group flex items-center gap-1 text-left"
                    >
                      <span className="text-xs font-black tracking-wide text-[#fef08a] group-hover:text-white group-hover:underline">
                        {playerName}
                      </span>
                      <span className="text-[10px] opacity-65 group-hover:opacity-100">✏️</span>
                    </button>
                  )}
                  <span className="rounded-md border border-[#fbbf24]/40 bg-[#78350f] px-1.5 py-0.5 text-[10px] font-extrabold text-[#fde68a]">
                    Lv. 07
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold text-[#fde68a]/85">
                  <span>X: {hudState.x}m • Y: {hudState.y}m • Z: {hudState.z}m</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. TENGAH ATAS: Kompas Waktu, Cuaca & Hari */}
          <div className="pointer-events-auto fixed top-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-3.5 rounded-full border-2 border-[#fbbf24]/65 bg-gradient-to-b from-[#3b1806]/95 via-[#240e03]/95 to-[#140701]/95 px-5 py-2 backdrop-blur-md shadow-[0_5px_0_#120601,0_10px_24px_rgba(0,0,0,0.5)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fbbf24]/50 bg-[#78350f]/60 text-base shadow-inner">
                {hudState.phase === "MALAM" ? "🌙" : "☀️"}
              </div>
              <div className="flex items-center gap-2">
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

          {/* 3. KANAN ATAS: Deretan Ikon RPG Vertikal */}
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

          {/* 4. TENGAH BAWAH: HOTBAR SENJATA INTERAKTIF */}
          <div className="pointer-events-auto fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#fbbf24]/65 bg-gradient-to-b from-[#3b1806]/95 to-[#140701]/95 p-1.5 backdrop-blur-md shadow-[0_4px_0_#120601,0_10px_20px_rgba(0,0,0,0.5)]">
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

      {/* SIDEBAR DRAWER RPG ELEGAN (Simpan Nama Langsung Mengubah Navbar Kiri Atas!) */}
      {sidebarOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10 flex h-full w-[410px] max-w-[92vw] flex-col justify-between overflow-y-auto border-r-2 border-[#fbbf24]/50 bg-gradient-to-b from-[#261105]/98 via-[#180a02]/98 to-[#0f0601]/98 p-5 text-[#fef3c7] shadow-[10px_0_35px_rgba(0,0,0,0.8)] [scrollbar-width:thin] [scrollbar-color:#78350f_#140701]">
            <div className="space-y-4">
              {/* Header Sidebar */}
              <div className="flex items-center justify-between border-b border-[#fbbf24]/25 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#fbbf24]/60 bg-gradient-to-b from-[#d97706] to-[#78350f] text-xl shadow">
                    🧭
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-wider text-[#fef08a] uppercase">Kompas Perjalanan</h2>
                    <p className="text-[11px] text-[#fde68a]/75">Pilih tujuan atau ubah identitas petualang</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/40 bg-red-900/70 text-xs font-black text-white hover:bg-red-700"
                >
                  ✕
                </button>
              </div>

              {/* Kolom Ubah Nama Petualang (Langsung Mengubah Nama di Navbar Kiri Atas!) */}
              <div className="rounded-xl border border-[#fbbf24]/35 bg-black/40 p-3" onKeyDown={(e) => e.stopPropagation()}>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[10px] font-black tracking-wider text-[#fbbf24] uppercase">
                    ✏️ Ubah Nama Petualang:
                  </label>
                  {nameSavedBadge && (
                    <span className="rounded bg-emerald-700/90 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                      ✓ Nama Tersimpan!
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    maxLength={18}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") handleSaveName(nameDraft);
                    }}
                    placeholder="Ketik nama petualang..."
                    className="flex-1 rounded-lg border border-[#fbbf24]/50 bg-[#1a0901] px-3 py-1.5 text-xs font-bold text-[#fef08a] outline-none focus:border-[#fde047]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveName(nameDraft)}
                    className="rounded-lg border border-amber-400/70 bg-gradient-to-b from-[#f59e0b] to-[#b45309] px-4 py-1.5 text-xs font-black text-white shadow hover:brightness-110 active:translate-y-0.5"
                  >
                    Simpan
                  </button>
                </div>
              </div>

              {/* Teleport Lokasi Cepat */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#fbbf24] uppercase">
                  <span>⚡</span> Teleport Lokasi Cepat (11 Wilayah)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TELEPORT_LOCATIONS.map((loc) => (
                    <button
                      key={loc.label}
                      onClick={() => handleTeleport(loc.x, loc.z)}
                      className={`group flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all hover:scale-[1.02] active:scale-98 ${loc.accent}`}
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

              {/* Ubah Suasana Waktu */}
              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black tracking-wider text-[#fbbf24] uppercase">
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
            </div>

            <div className="mt-4 border-t border-[#fbbf24]/20 pt-3 text-[11px] text-[#fde68a]/75">
              <p className="font-bold text-[#fef08a]">Petualang Aktif: {playerName} • ({hudState.x}m, {hudState.y}m, {hudState.z}m)</p>
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
              📜 Jurnal Petualangan {playerName}
            </div>
            <ul className="space-y-2 text-xs leading-relaxed text-slate-200">
              <li>• Kunjungi <b>🌾 Wilayah Pertanian & Kincir Air</b> di tepi aliran cabang sungai (X: 225m, Z: 106m).</li>
              <li>• Temui <b>🔥 Bengkel Pandai Besi (Blacksmith)</b> yang kini hadir di setiap pedesaan.</li>
              <li>• Jelajahi <b>🌊 Ngarai Pegunungan & Air Terjun Mengalir</b> di hulu sungai selatan (X: 238m, Z: 192m).</li>
              <li>• Tekan <b>[1]</b> untuk memakai Pedang, <b>[2]</b> untuk mengangkat Lentera, atau tekan kembali untuk menyimpan senjata.</li>
            </ul>
            <div className="mt-4 flex items-center gap-4 text-xs font-black">
              <button onClick={() => { handleTeleport(225, 106); setJournalOpen(false); }} className="text-[#fbbf24] hover:underline">▶ Teleport ke Pertanian & Kincir Air</button>
              <span className="text-slate-500">•</span>
              <button onClick={() => { handleTeleport(238, 192); setJournalOpen(false); }} className="text-cyan-400 hover:underline">▶ Teleport ke Air Terjun</button>
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
