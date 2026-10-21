import * as THREE from "three";

let cachedTextures: Record<string, THREE.CanvasTexture> | null = null;

export function getWorldTextures(): Record<string, THREE.CanvasTexture> {
  if (cachedTextures) return cachedTextures;
  if (typeof document === "undefined") return {};

  const makeTex = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeatX = 2, repeatY = 2) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    draw(ctx, 256, 256);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.needsUpdate = true;
    return tex;
  };

  // 1. Rich Micro-Detail Ground Texture (Grass blades, soil speckles, and stone grain so terrain is never plain!)
  const terrainDetail = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#b8b8b8";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3200; i++) {
      const x = (i * 73) % w;
      const y = (i * 137) % h;
      const v = 135 + ((i * 29) % 75);
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.fillRect(x, y, 2, 5);
    }
    for (let i = 0; i < 450; i++) {
      const x = (i * 53) % w;
      const y = (i * 97) % h;
      ctx.fillStyle = "#8a8a8a";
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }, 65, 65);

  // 2. Blue-Grey Medieval Stone Bricks with Mortar & Moss (Reference Image 055154_2)
  const villageStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#2d3748";
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const cols = 4;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const shade = 82 + ((r * 19 + c * 37) % 34);
        ctx.fillStyle = "rgb(" + (shade - 8) + "," + (shade + 6) + "," + (shade + 22) + ")";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, rh - 6);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, 3);
      }
    }
  }, 3, 2);

  // 3. Regal Pinkish-Lilac Castle Ashlar Stonework (Reference Image 055226_2)
  const kingdomStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#4a3f54";
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const cols = 4;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const v = 148 + ((r * 23 + c * 19) % 32);
        ctx.fillStyle = "rgb(" + (v + 16) + "," + (v - 2) + "," + (v + 10) + ")";
        ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
        ctx.fillStyle = "rgba(255,240,245,0.18)";
        ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, 3);
      }
    }
  }, 3, 3);

  // 4. Red Terracotta Roof Tiles
  const redRoof = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#691414";
    ctx.fillRect(0, 0, w, h);
    const rows = 10;
    const cols = 8;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const red = 160 + ((r * 13 + c * 29) % 48);
        ctx.fillStyle = "rgb(" + red + "," + Math.floor(red * 0.28) + "," + Math.floor(red * 0.22) + ")";
        ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 3);
      }
    }
  }, 4, 4);

  // 5. Half-Timber Plaster & Ornate Wood Lattice
  const halfTimber = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#d8dee9";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5c3818";
    ctx.fillRect(0, 0, w, 18);
    ctx.fillRect(0, h - 18, w, 18);
    ctx.fillRect(0, h / 2 - 8, w, 16);
    for (let x = 0; x <= w; x += 64) ctx.fillRect(x - 7, 0, 14, h);
    ctx.strokeStyle = "#5c3818";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(128, h);
    ctx.moveTo(w, 0); ctx.lineTo(128, h);
    ctx.stroke();
  }, 2, 1);

  // 6. White Birch Bark with Dark Lenticels (Reference Image 073818)
  const birchBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 55; i++) {
      const y = (i * 29) % h;
      const x = (i * 67) % (w - 40);
      ctx.fillStyle = i % 3 === 0 ? "#1f2937" : "#4b5563";
      ctx.fillRect(x, y, 18 + (i % 28), 3 + (i % 4));
    }
    ctx.fillStyle = "#374151";
    ctx.fillRect(0, h - 28, w, 28);
  }, 1, 2);

  // 7. Furrowed Ancient Oak Bark (Reference Image 073818)
  const oakBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#4a321f";
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = (x % 16 === 0) ? "#362214" : "#5e4028";
      ctx.fillRect(x, 0, 5, h);
    }
  }, 2, 2);

  // 8. Cobblestone & Flagstone Pavement
  const cobblestone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 0, w, h);
    for (let y = 10; y < h; y += 26) {
      for (let x = 10; x < w; x += 30) {
        const s = 96 + ((x * 13 + y * 19) % 38);
        ctx.fillStyle = "rgb(" + s + "," + (s + 4) + "," + (s + 8) + ")";
        ctx.beginPath();
        ctx.arc(x + ((y % 52 === 10) ? 7 : 0), y, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 12, 12);

  // 9. Striped Market Stall Awnings (Red, Blue, Green, Amber)
  const makeAwning = (c1: string, c2: string) => makeTex((ctx, w, h) => {
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = (x / 32) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x, 0, 32, h);
    }
  }, 2, 1);

  const awningRed = makeAwning("#dc2626", "#fef2f2");
  const awningBlue = makeAwning("#0284c7", "#f0f9ff");
  const awningGreen = makeAwning("#16a34a", "#f0fdf4");
  const awningGold = makeAwning("#d97706", "#fffbeb");

  cachedTextures = {
    terrainDetail, villageStone, kingdomStone, redRoof, halfTimber,
    birchBark, oakBark, cobblestone, awningRed, awningBlue, awningGreen, awningGold,
  };
  return cachedTextures;
}
