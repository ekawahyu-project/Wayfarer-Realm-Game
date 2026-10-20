import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-amber-50 p-6">
      <div className="max-w-xl w-full text-center space-y-6 bg-amber-950/30 border-2 border-amber-700/50 rounded-2xl p-10 backdrop-blur-md shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-400/90 font-semibold">
          Eksplorasi Dunia Terbuka 3D
        </p>
        <h1 className="text-5xl font-serif font-bold tracking-wide text-amber-200 drop-shadow">
          Wayfarer Realm
        </h1>
        <p className="text-amber-100/80 text-base leading-relaxed">
          Jelajahi pulau fantasi yang hidup, dari pantai berpasir sampai kastil di atas bukit,
          sambil menyaksikan matahari terbit, senja, dan aurora di malam hari.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/play"
            className="px-8 py-3.5 text-lg font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-lg shadow-amber-500/20 transition transform hover:-translate-y-0.5"
          >
            Mulai Petualangan
          </Link>
        </div>
      </div>
    </main>
  );
}
