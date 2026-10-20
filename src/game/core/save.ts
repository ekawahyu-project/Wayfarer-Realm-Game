export function hasSavedGame(): boolean { return false; }
export function getSavedSummary(): null { return null; }
export function saveGameProgress(_showToast = false): boolean { return false; }
export function loadGameProgress(): boolean { return false; }
export function clearSavedGame(): void {
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("wayfarer_realm_save_v1"); } catch {}
  }
}
