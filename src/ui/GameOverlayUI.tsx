"use client";

import { POIS } from "@/config/pois";
import { COLLECTIBLES } from "@/config/collectibles";
import { QUESTS } from "@/config/quests";
import { usePlayerStore, playerFrameState } from "@/game/state/usePlayerStore";
import { useJournalStore } from "@/game/state/useJournalStore";
import { getTerrainHeight } from "@/utils/noise";

export default function GameOverlayUI() {
  const position = usePlayerStore((s) => s.position);
  const requestTeleport = usePlayerStore((s) => s.requestTeleport);

  const discoveredPOIs = useJournalStore((s) => s.discoveredPOIs);
  const collectedItems = useJournalStore((s) => s.collectedItems);
  const questStatus = useJournalStore((s) => s.questStatus);
  const activeNpc = useJournalStore((s) => s.activeDialogueNpc);
  const dialogueReply = useJournalStore((s) => s.dialogueReply);
  const isMapOpen = useJournalStore((s) => s.isMapOpen);
  const isJournalOpen = useJournalStore((s) => s.isJournalOpen);
  const notification = useJournalStore((s) => s.notification);

  const setDialogueReply = useJournalStore((s) => s.setDialogueReply);
  const closeDialogue = useJournalStore((s) => s.closeDialogue);
  const startQuest = useJournalStore((s) => s.startQuest);
  const completeQuest = useJournalStore((s) => s.completeQuest);
  const toggleMap = useJournalStore((s) => s.toggleMap);
  const toggleJournal = useJournalStore((s) => s.toggleJournal);

  // Heading direction label from camera yaw
  const deg = (((-playerFrameState.yaw * 180) / Math.PI) % 360 + 360) % 360;
  const dirs = ["UTARA", "TIMUR LAUT", "TIMUR", "TENGGARA", "SELATAN", "BARAT DAYA", "BARAT", "BARAT LAUT"];
  const compassLabel = dirs[Math.round(deg / 45) % 8];

  return (
    <>
      {/* Compass Pill under Clock */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-1 bg-slate-950/80 border border-amber-600/50 rounded-full text-[11px] font-semibold tracking-widest text-amber-200 shadow">
        🧭 {compassLabel} • POI: {discoveredPOIs.length}/24 • Koleksi: {collectedItems.length}/30
      </div>

      {/* Discovery / Quest Notification Toast */}
      {notification && (
        <div className="absolute top-28 right-4 z-30 px-5 py-3 bg-amber-950/95 border-2 border-amber-400 rounded-xl text-amber-100 text-sm font-semibold shadow-2xl animate-pulse">
          {notification}
        </div>
      )}

      {/* NPC Dialogue Modal (PRD 6.7 & 10.2) */}
      {activeNpc && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl p-6 bg-amber-950/95 border-2 border-amber-500 rounded-2xl text-amber-50 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-amber-700/60 pb-2 mb-3">
            <div>
              <h3 className="text-lg font-bold text-amber-300">{activeNpc.name}</h3>
              <p className="text-xs text-amber-200/75">{activeNpc.role} • {activeNpc.biome}</p>
            </div>
            <button onClick={closeDialogue} className="px-3 py-1 text-xs bg-amber-900 hover:bg-amber-800 rounded-lg border border-amber-600">
              Tutup (Esc)
            </button>
          </div>
          <p className="text-sm leading-relaxed text-amber-100 mb-4">
            "{dialogueReply || activeNpc.greeting}"
          </p>
          <div className="flex flex-col gap-2">
            {activeNpc.choices.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDialogueReply(c.nextText);
                  if (c.startQuestId) startQuest(c.startQuestId);
                  if (c.completeQuestId) completeQuest(c.completeQuestId);
                }}
                className="text-left px-4 py-2.5 text-xs font-medium bg-slate-900/85 hover:bg-amber-800/80 border border-amber-600/50 rounded-xl transition"
              >
                💬 {c.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Island Map Modal (Tombol M - PRD 10.2) */}
      {isMapOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-3xl bg-amber-950/95 border-2 border-amber-500 rounded-2xl p-6 text-amber-100 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-amber-300">🗺️ Peta Pulau Wayfarer Realm</h2>
                <p className="text-xs text-amber-200/80">Klik titik lokasi yang sudah ditemukan untuk Teleport Cepat</p>
              </div>
              <button onClick={toggleMap} className="px-4 py-1.5 text-xs font-semibold bg-amber-800 hover:bg-amber-700 rounded-lg">
                Tutup (M / Esc)
              </button>
            </div>

            <div className="relative w-full h-[420px] bg-sky-950/90 border-2 border-amber-700/70 rounded-xl overflow-hidden">
              {/* Stylized Island Circle */}
              <div className="absolute inset-8 rounded-full bg-emerald-900/70 border-4 border-amber-300/40" />

              {/* Discovered POIs on Map */}
              {POIS.map((poi) => {
                const isDiscovered = discoveredPOIs.includes(poi.id);
                const leftPct = Math.min(94, Math.max(6, ((poi.position[0] + 750) / 1500) * 100));
                const topPct = Math.min(94, Math.max(6, ((poi.position[2] + 750) / 1500) * 100));
                return (
                  <button
                    key={poi.id}
                    onClick={() => {
                      if (!isDiscovered) return;
                      const y = Math.max(3, getTerrainHeight(poi.position[0], poi.position[2]) + 2.5);
                      requestTeleport([poi.position[0], y, poi.position[2]]);
                      toggleMap();
                    }}
                    style={{ left: leftPct + "%", top: topPct + "%" }}
                    title={isDiscovered ? poi.name + " (Klik untuk Teleport)" : "Belum Ditemukan"}
                    className={"-translate-x-1/2 -translate-y-1/2 absolute px-2 py-0.5 rounded-full text-[10px] font-bold transition " + (isDiscovered ? "bg-amber-400 text-slate-950 hover:scale-125 shadow" : "bg-slate-700/60 text-slate-400 cursor-not-allowed")}
                  >
                    {isDiscovered ? "📍 " + poi.name : "?"}
                  </button>
                );
              })}

              {/* Player Live Marker */}
              <div
                style={{
                  left: Math.min(96, Math.max(4, ((position[0] + 750) / 1500) * 100)) + "%",
                  top: Math.min(96, Math.max(4, ((position[2] + 750) / 1500) * 100)) + "%",
                }}
                className="-translate-x-1/2 -translate-y-1/2 absolute px-2 py-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-lg animate-bounce"
              >
                🧍 Kamu
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explorer Journal Modal (Tombol J - PRD 6.8 & 10.2) */}
      {isJournalOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-amber-950/95 border-2 border-amber-500 rounded-2xl p-6 text-amber-100 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-amber-700 pb-3">
              <div>
                <h2 className="text-2xl font-bold text-amber-300">📖 Jurnal Penjelajah Wayfarer</h2>
                <p className="text-xs text-amber-200/80">Catatan Perjalanan, Quest Santai, dan Benda Koleksi</p>
              </div>
              <button onClick={toggleJournal} className="px-4 py-1.5 text-xs font-semibold bg-amber-800 hover:bg-amber-700 rounded-lg">
                Tutup (J / Esc)
              </button>
            </div>

            {/* Quests Section */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">📜 Daftar Quest Santai</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {QUESTS.map((q) => {
                  const st = questStatus[q.id] || "available";
                  return (
                    <div key={q.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-700/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-200 text-sm">{q.title}</span>
                        <span className={"text-[10px] px-2 py-0.5 rounded font-bold uppercase " + (st === "completed" ? "bg-emerald-600 text-white" : st === "active" ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-300")}>
                          {st === "completed" ? "Selesai" : st === "active" ? "Aktif" : "Tersedia"}
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/80">{q.description}</p>
                      <p className="text-[11px] text-amber-300">🎯 Target: {q.targetText}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* POIs Section */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">
                📍 Titik Menarik Ditemukan ({discoveredPOIs.length}/{POIS.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {POIS.map((p) => {
                  const found = discoveredPOIs.includes(p.id);
                  return (
                    <div key={p.id} className={"p-3 rounded-xl border " + (found ? "bg-slate-900/85 border-amber-600/60" : "bg-slate-950/50 border-slate-800 opacity-60")}>
                      <div className="font-semibold text-xs text-amber-300">{found ? p.name : "??? (Belum Dikunjungi)"}</div>
                      <p className="text-[11px] text-amber-100/75 mt-1">{found ? p.journalText : "Jelajahi pulau untuk membuka catatan lokasi ini."}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Collectibles Summary */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-2">
                ✨ Benda Koleksi ({collectedItems.length}/{COLLECTIBLES.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {COLLECTIBLES.map((c) => {
                  const got = collectedItems.includes(c.id);
                  return (
                    <span key={c.id} className={"px-2.5 py-1 rounded-lg text-xs border " + (got ? "bg-amber-500/20 border-amber-400 text-amber-200 font-semibold" : "bg-slate-900/50 border-slate-800 text-slate-500")}>
                      {got ? "✨ " + c.name : "🔒 ???"}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
