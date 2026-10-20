import { create } from "zustand";
import { POIS } from "@/config/pois";
import { COLLECTIBLES } from "@/config/collectibles";
import { QUESTS } from "@/config/quests";
import { NPCDef } from "@/game/npc/npcData";

export type QuestStatus = "available" | "active" | "completed";

interface JournalState {
  discoveredPOIs: string[];
  collectedItems: string[];
  questStatus: Record<string, QuestStatus>;
  activeDialogueNpc: NPCDef | null;
  dialogueReply: string | null;
  isMapOpen: boolean;
  isJournalOpen: boolean;
  isHudHidden: boolean;
  notification: string | null;
  discoverPOI: (id: string) => void;
  collectItem: (id: string) => void;
  startQuest: (id: string) => void;
  completeQuest: (id: string) => void;
  openDialogue: (npc: NPCDef) => void;
  setDialogueReply: (reply: string | null) => void;
  closeDialogue: () => void;
  toggleMap: () => void;
  toggleJournal: () => void;
  toggleHud: () => void;
  closePanels: () => void;
  showNotification: (msg: string) => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  discoveredPOIs: ["poi_01"],
  collectedItems: [],
  questStatus: {
    quest_01: "available",
    quest_02: "available",
    quest_03: "available",
    quest_04: "available",
    quest_05: "active",
  },
  activeDialogueNpc: null,
  dialogueReply: null,
  isMapOpen: false,
  isJournalOpen: false,
  isHudHidden: false,
  notification: null,

  showNotification: (msg) => {
    set({ notification: msg });
    setTimeout(() => {
      if (get().notification === msg) {
        set({ notification: null });
      }
    }, 4000);
  },

  discoverPOI: (id) => {
    const curr = get().discoveredPOIs;
    if (curr.includes(id)) return;
    const poi = POIS.find((p) => p.id === id);
    const next = [...curr, id];
    set({ discoveredPOIs: next });
    if (poi) {
      get().showNotification("📍 Lokasi Ditemukan: " + poi.name);
    }
    if (id === "poi_19") {
      get().completeQuest("quest_03");
    }
    if (next.length >= 6 && get().questStatus["quest_05"] !== "completed") {
      get().completeQuest("quest_05");
    }
  },

  collectItem: (id) => {
    const curr = get().collectedItems;
    if (curr.includes(id)) return;
    const item = COLLECTIBLES.find((c) => c.id === id);
    const next = [...curr, id];
    set({ collectedItems: next });
    if (item) {
      get().showNotification("✨ Koleksi Diambil: " + item.name + " (" + next.length + "/30)");
    }
    if (next.length >= 3 && get().questStatus["quest_02"] !== "completed") {
      get().completeQuest("quest_02");
    }
  },

  startQuest: (id) => {
    const status = get().questStatus[id];
    if (status === "completed" || status === "active") return;
    const q = QUESTS.find((x) => x.id === id);
    set({ questStatus: { ...get().questStatus, [id]: "active" } });
    if (q) {
      get().showNotification("📜 Quest Dimulai: " + q.title);
    }
  },

  completeQuest: (id) => {
    if (get().questStatus[id] === "completed") return;
    const q = QUESTS.find((x) => x.id === id);
    set({ questStatus: { ...get().questStatus, [id]: "completed" } });
    if (q) {
      get().showNotification("🎉 Quest Selesai: " + q.title);
    }
  },

  openDialogue: (npc) => {
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }
    set({ activeDialogueNpc: npc, dialogueReply: null, isMapOpen: false, isJournalOpen: false });
  },
  setDialogueReply: (dialogueReply) => set({ dialogueReply }),
  closeDialogue: () => set({ activeDialogueNpc: null, dialogueReply: null }),

  toggleMap: () => {
    const next = !get().isMapOpen;
    if (next && document.pointerLockElement) document.exitPointerLock?.();
    set({ isMapOpen: next, isJournalOpen: false, activeDialogueNpc: null });
  },
  toggleJournal: () => {
    const next = !get().isJournalOpen;
    if (next && document.pointerLockElement) document.exitPointerLock?.();
    set({ isJournalOpen: next, isMapOpen: false, activeDialogueNpc: null });
  },
  toggleHud: () => set({ isHudHidden: !get().isHudHidden }),
  closePanels: () => set({ isMapOpen: false, isJournalOpen: false, activeDialogueNpc: null }),
}));
