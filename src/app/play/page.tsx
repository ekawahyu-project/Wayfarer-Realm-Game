import dynamic from "next/dynamic";
import Link from "next/link";

const GameCanvas = dynamic(() => import("@/game/GameCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center w-screen h-screen bg-slate-950 text-amber-100">
      <div className="w-12 h-12 mb-4 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-lg font-medium tracking-wide">Memuat Dunia Wayfarer Realm...</p>
    </div>
  ),
});

export default function PlayPage() {
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      <GameCanvas />
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3">
        <Link
          href="/"
          className="px-4 py-2 text-sm font-medium text-amber-100 bg-amber-950/80 border border-amber-700/60 rounded-lg hover:bg-amber-900 transition"
        >
          Kembali ke Menu
        </Link>
        <span className="px-3 py-1.5 text-xs text-amber-200/80 bg-slate-900/70 rounded-md border border-slate-700">
          Milestone M0: Gunakan klik kiri + geser mouse untuk memutar kamera
        </span>
      </div>
    </main>
  );
}
