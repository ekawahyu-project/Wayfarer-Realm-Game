import * as THREE from "three";

let cachedTextures: Record<string, THREE.CanvasTexture> | null = null;

function makePRNG(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getWorldTextures(): Record<string, THREE.CanvasTexture> {
  if (cachedTextures) return cachedTextures;
  if (typeof document === "undefined") return {};

  const rand = makePRNG(20261021);

  const makeTex = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeatX = 2, repeatY = 2, size = 256) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    draw(ctx, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.needsUpdate = true;
    return tex;
  };

  // 1. High-Contrast Multi-Grain Terrain Detail (Grass clumps, pebbles, sand ripples & snow crystals)
  const terrainDetail = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#b8b8b8";
    ctx.fillRect(0, 0, w, h);
    // Soft organic soil & sand wave ripples
    for (let y = 0; y < h; y += 4) {
      const wave = Math.sin((y / h) * Math.PI * 12) * 14;
      const v = Math.floor(175 + wave);
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.fillRect(0, y, w, 4);
    }
    // Rich organic pebbles, shells & grass tuft speckles (random, never striped)
    for (let i = 0; i < 4200; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 1 + rand() * 3.5;
      const v = Math.floor(110 + rand() * 125);
      ctx.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.55)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 45, 45);

  // 2. Detailed Snow & Frost Needle Texture
  const snowFrost = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#dce6f2";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const v = Math.floor(205 + rand() * 50);
      ctx.fillStyle = "rgb(" + v + "," + (v + 2) + ",255)";
      ctx.fillRect(x, y, 2 + rand() * 4, 2 + rand() * 4);
    }
    // Dark green pine needle patches peeking under snow
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = "rgba(30, 58, 42, 0.35)";
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, 3 + rand() * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 3, 3);

  // 3. Botanical Leaf Canopy Texture
  const leafFoliage = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#234d20";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      const x = rand() * w, y = rand() * h;
      const angle = rand() * Math.PI * 2;
      const g = Math.floor(85 + rand() * 110);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "rgb(" + Math.floor(g * 0.52) + "," + g + "," + Math.floor(g * 0.3) + ")";
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }, 2, 2);

  // 4. Medieval Stone Bricks
  const villageStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#263040";
    ctx.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const shade = Math.floor(86 + rand() * 40);
        ctx.fillStyle = "rgb(" + (shade - 6) + "," + (shade + 6) + "," + (shade + 20) + ")";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, rh - 6);
      }
    }
  }, 3, 2);

  // 5. Royal Kingdom Ashlar Stonework
  const kingdomStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#443850";
    ctx.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const v = Math.floor(150 + rand() * 36);
        ctx.fillStyle = "rgb(" + (v + 16) + "," + v + "," + (v + 12) + ")";
        ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
      }
    }
  }, 3, 3);

  // 6. Terracotta Roof Shingles
  const redRoof = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#5c1111";
    ctx.fillRect(0, 0, w, h);
    const rows = 10, cols = 8, rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const red = Math.floor(150 + rand() * 55);
        ctx.fillStyle = "rgb(" + red + "," + Math.floor(red * 0.28) + "," + Math.floor(red * 0.22) + ")";
        ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 3);
      }
    }
  }, 4, 4);

  // 7. Half-Timber Plaster & Wood Beams
  const halfTimber = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#4a2c14";
    ctx.fillRect(0, 0, w, 16); ctx.fillRect(0, h - 16, w, 16); ctx.fillRect(0, h / 2 - 8, w, 16);
    for (let x = 0; x <= w; x += 64) ctx.fillRect(x - 6, 0, 12, h);
    ctx.strokeStyle = "#4a2c14"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(128, h); ctx.moveTo(w, 0); ctx.lineTo(128, h); ctx.stroke();
  }, 2, 1);

  // 8. Wood Planks & Ornate Medieval Door Texture (For Boats, Piers, Cabins & Doors)
  const woodPlanks = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#5c3818";
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      const v = Math.floor(75 + rand() * 30);
      ctx.fillStyle = "rgb(" + (v + 25) + "," + v + "," + Math.floor(v * 0.5) + ")";
      ctx.fillRect(x + 2, 0, 28, h);
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = "rgba(40,20,5,0.25)";
        ctx.fillRect(x + 4 + rand() * 22, rand() * h, 2, 18 + rand() * 30);
      }
    }
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 28, w, 10); ctx.fillRect(0, h - 38, w, 10);
  }, 1, 1);

  // 9. Royal Palace Checkered Marble Floor Texture
  const royalMarble = makeTex((ctx, w, h) => {
    const step = 64;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const isLight = ((x / step) + (y / step)) % 2 === 0;
        ctx.fillStyle = isLight ? "#f1f5f9" : "#334155";
        ctx.fillRect(x, y, step, step);
      }
    }
  }, 10, 6);

  // 10. Animal Coat & Hide Textures (Dappled Horse Coat, Spotted Cow Hide, Feathers)
  const horseCoat = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#7c3f1c";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1200; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,235,210,0.12)" : "rgba(45,20,5,0.18)";
      ctx.fillRect(rand() * w, rand() * h, 2, 10);
    }
    for (let i = 0; i < 28; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.beginPath(); ctx.arc(rand() * w, rand() * h, 8 + rand() * 14, 0, Math.PI * 2); ctx.fill();
    }
  }, 1, 1);

  const cowHide = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = "#1e293b";
      ctx.beginPath(); ctx.arc(rand() * w, rand() * h, 22 + rand() * 35, 0, Math.PI * 2); ctx.fill();
    }
  }, 1, 1);

  const birchBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#f1f5f9"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 3 === 0 ? "#0f172a" : "#475569";
      ctx.fillRect(rand() * (w - 40), rand() * h, 18 + rand() * 30, 3 + rand() * 4);
    }
  }, 1, 2);

  const oakBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#4a321f"; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = (x % 16 === 0) ? "#2e1d10" : "#614126";
      ctx.fillRect(x, 0, 5, h);
    }
  }, 2, 2);

  const cobblestone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#334155"; ctx.fillRect(0, 0, w, h);
    for (let y = 10; y < h; y += 24) {
      for (let x = 10; x < w; x += 28) {
        const s = Math.floor(100 + rand() * 42);
        ctx.fillStyle = "rgb(" + s + "," + (s + 5) + "," + (s + 12) + ")";
        ctx.beginPath(); ctx.arc(x + ((y % 48 === 10) ? 7 : 0), y, 10, 0, Math.PI * 2); ctx.fill();
      }
    }
  }, 14, 14);

  const eyeIris = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 110);
    grad.addColorStop(0, "#0f172a"); grad.addColorStop(0.35, "#1d4ed8"); grad.addColorStop(0.78, "#38bdf8"); grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.arc(cx, cy, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx - 28, cy - 30, 18, 0, Math.PI * 2); ctx.fill();
  }, 1, 1);

  const makeAwning = (c1: string, c2: string) => makeTex((ctx, w, h) => {
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = (x / 32) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x, 0, 32, h);
    }
  }, 2, 1, 128);

  cachedTextures = {
    terrainDetail, snowFrost, leafFoliage, villageStone, kingdomStone, redRoof, halfTimber,
    woodPlanks, royalMarble, horseCoat, cowHide, birchBark, oakBark, cobblestone, eyeIris,
    awningRed: makeAwning("#dc2626", "#fef2f2"),
    awningBlue: makeAwning("#0284c7", "#f0f9ff"),
    awningGreen: makeAwning("#16a34a", "#f0fdf4"),
    awningGold: makeAwning("#d97706", "#fffbeb"),
  };
  return cachedTextures;
}
