"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { clearSavedGame } from "@/game/core/save";

export default function HomePage() {
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    clearSavedGame();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-amber-50 p-6 select-none">
      <div className="max-w-xl w-full text-center space-y-6 bg-amber-950/35 border-2 border-amber-600/60 rounded-3xl p-10 backdrop-blur-md shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400 font-semibold">
          Eksplorasi Dunia Terbuka 3D • Versi 1.0
        </p>
        <h1 className="text-5xl font-serif font-bold tracking-wide text-amber-200 drop-shadow">
          Wayfarer Realm
        </h1>
        <p className="text-amber-100/85 text-sm leading-relaxed">
          Jelajahi pulau fantasi yang hidup, dari pantai berpasir turquoise sampai kastil kerajaan di atas bukit, sambil menyaksikan matahari terbit, senja, bulan merah, dan aurora di malam hari.
        </p>

        <div className="pt-2 flex justify-center">
          <Link
            href="/play"
            className="px-8 py-3.5 text-base font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
          >
            ✨ Mulai Petualangan
          </Link>
        </div>

        <div className="pt-2 flex justify-center gap-4 text-xs text-amber-300/80">
          <button onClick={() => setShowCredits(true)} className="hover:text-amber-200 underline">
            Kredit & Lisensi
          </button>
          <span>•</span>
          <span>7 Biome Terbuka • 24 POI • 30 Koleksi</span>
        </div>
      </div>

      {showCredits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-6">
          <div className="max-w-md w-full bg-amber-950 border-2 border-amber-500 rounded-2xl p-6 text-amber-100 space-y-4 shadow-2xl">
            <h2 className="text-xl font-bold text-amber-300">📜 Kredit Wayfarer Realm</h2>
            <div className="text-xs space-y-2 leading-relaxed text-amber-100/90">
              <p><b>Pemilik Produk & Arahan Visual:</b> Eka</p>
              <p><b>Teknologi Inti:</b> Next.js, React Three Fiber, Three.js, Postprocessing, Zustand, Tailwind CSS, Simplex Noise, Web Audio API.</p>
            </div>
            <button
              onClick={() => setShowCredits(false)}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
