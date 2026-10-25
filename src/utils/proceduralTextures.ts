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

  const rand = makePRNG(20261025);

  const makeTex = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeatX = 2, repeatY = 2, size = 512) => {
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    draw(ctx, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    return tex;
  };

  // Subtle warm stone micro-grain & fine chisel detail (Never darkens or muddies the buildings!)
  const addSubtleStoneGrain = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    for (let i = 0; i < 1200; i++) {
      const x = rand() * w, y = rand() * h;
      ctx.fillStyle = i % 2 === 0 ? "rgba(255, 250, 240, 0.12)" : "rgba(90, 75, 60, 0.10)";
      ctx.fillRect(x, y, 2 + rand() * 3, 2 + rand() * 3);
    }
    ctx.strokeStyle = "rgba(80, 65, 50, 0.16)";
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      let cx = rand() * w, cy = rand() * h;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let s = 0; s < 3; s++) { cx += (rand() - 0.5) * 16; cy += rand() * 12; ctx.lineTo(cx, cy); }
      ctx.stroke();
    }
  };

  // 1. Grass & Soil Detail
  const terrainDetail = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#dedede"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      const x = rand() * w, y = rand() * h, r = 8 + rand() * 16;
      const v = Math.floor(195 + rand() * 45);
      ctx.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.3)";
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < 7000; i++) {
      const x = rand() * w, y = rand() * h;
      const v = Math.floor(155 + rand() * 95);
      ctx.strokeStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.lineWidth = 1.4;
      const angle = (rand() - 0.5) * 0.8;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(angle) * 6, y - Math.cos(angle) * 6); ctx.stroke();
    }
  }, 95, 95, 512);

  // 2. Bright Warm Medieval Cobblestone Plaza & Roads (Warm sandstone & slate pavers)
  const cobblestone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#645b52";
    ctx.fillRect(0, 0, w, h);
    const rows = 12, cols = 6;
    const rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const base = Math.floor(122 + rand() * 42);
        const warm = Math.floor((rand() - 0.3) * 22);
        ctx.fillStyle = "rgb(" + (base + warm) + "," + (base + Math.floor(warm * 0.5)) + "," + (base - 8) + ")";
        const bx = c * cw + off + 3, by = r * rh + 3, bw = cw - 6, bh = rh - 6;
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 7); ctx.fill();
        ctx.fillStyle = "rgba(255,252,245,0.28)";
        ctx.fillRect(bx + 3, by + 2, bw - 6, 3);
      }
    }
    addSubtleStoneGrain(ctx, w, h);
  }, 34, 34, 512);

  // 3. Warm Village Cut-Stone Masonry
  const villageStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#6b6257"; ctx.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const shade = Math.floor(175 + rand() * 55);
        const warm = Math.floor((rand() - 0.3) * 18);
        ctx.fillStyle = "rgb(" + (shade + warm) + "," + shade + "," + (shade - 10) + ")";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, rh - 6);
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.fillRect(c * cw + offset + 4, r * rh + 4, cw - 8, 3);
      }
    }
    addSubtleStoneGrain(ctx, w, h);
  }, 3, 2, 256);

  // 4. Warm Cream & Ochre Tudor Half-Timber Plaster with Fine Aged Texture
  const halfTimber = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#dfd3be"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 350; i++) {
      const v = Math.floor(215 + rand() * 30);
      ctx.fillStyle = "rgba(" + v + "," + (v - 10) + "," + (v - 22) + ", 0.35)";
      ctx.beginPath(); ctx.arc(rand() * w, rand() * h, 6 + rand() * 18, 0, Math.PI * 2); ctx.fill();
    }
    addSubtleStoneGrain(ctx, w, h);
    ctx.fillStyle = "#4a2c14";
    ctx.fillRect(0, 0, w, 16); ctx.fillRect(0, h - 16, w, 16); ctx.fillRect(0, h / 2 - 8, w, 16);
    for (let x = 0; x <= w; x += 64) ctx.fillRect(x - 6, 0, 12, h);
    ctx.strokeStyle = "#4a2c14"; ctx.lineWidth = 11;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(128, h); ctx.moveTo(w, 0); ctx.lineTo(128, h); ctx.stroke();
  }, 2, 1, 256);

  // 5. Warm Terracotta Clay Shingle Roof
  const redRoof = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#6e1c14"; ctx.fillRect(0, 0, w, h);
    const rows = 10, cols = 8, rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const red = Math.floor(165 + rand() * 65);
        ctx.fillStyle = "rgb(" + red + "," + Math.floor(red * 0.38) + "," + Math.floor(red * 0.26) + ")";
        ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 3);
      }
    }
    addSubtleStoneGrain(ctx, w, h);
  }, 4, 4, 256);

  // 6. Bright Royal Limestone Ashlar Blocks for Grand Kingdom (Majestic, bright & regal!)
  const kingdomStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#8a8278"; ctx.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, rh = h / rows, cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const v = Math.floor(205 + rand() * 40);
        ctx.fillStyle = "rgb(" + (v + 6) + "," + (v + 3) + "," + (v - 4) + ")";
        ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, 3);
      }
    }
    addSubtleStoneGrain(ctx, w, h);
  }, 3, 3, 256);

  const woodPlanks = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#5c3618"; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      const v = Math.floor(92 + rand() * 38);
      ctx.fillStyle = "rgb(" + (v + 32) + "," + v + "," + Math.floor(v * 0.52) + ")";
      ctx.fillRect(x + 2, 0, 28, h);
    }
    ctx.fillStyle = "#27272a"; ctx.fillRect(0, 28, w, 8); ctx.fillRect(0, h - 36, w, 8);
  }, 1, 1, 256);

  const windowLattice = makeTex((ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.65);
    grad.addColorStop(0, "#fef9c3"); grad.addColorStop(0.6, "#fbbf24"); grad.addColorStop(1, "#d97706");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#3d2310"; ctx.lineWidth = 5;
    for (let i = -w; i < w * 2; i += 32) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, h); ctx.lineTo(i + h, 0); ctx.stroke();
    }
    ctx.lineWidth = 14; ctx.strokeRect(7, 7, w - 14, h - 14);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
  }, 1, 1, 256);

  const snowFrost = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#eef5fc"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1500; i++) {
      const v = Math.floor(225 + rand() * 30);
      ctx.fillStyle = "rgb(" + v + "," + (v + 2) + ",255)";
      ctx.fillRect(rand() * w, rand() * h, 3, 3);
    }
  }, 4, 4, 256);

  const leafFoliage = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#4d9e34"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 1000; i++) {
      const x = rand() * w, y = rand() * h, angle = rand() * Math.PI * 2;
      const g = Math.floor(145 + rand() * 85);
      ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
      ctx.fillStyle = "rgb(" + Math.floor(g * 0.55) + "," + g + "," + Math.floor(g * 0.28) + ")";
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }, 2, 2, 256);

  const royalMarble = makeTex((ctx, w, h) => {
    const step = 64;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        ctx.fillStyle = ((x / step) + (y / step)) % 2 === 0 ? "#f8fafc" : "#475569";
        ctx.fillRect(x, y, step, step);
      }
    }
  }, 10, 6, 256);

  const horseCoat = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#b46934"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,235,210,0.18)" : "rgba(120,55,20,0.15)";
      ctx.fillRect(rand() * w, rand() * h, 2, 10);
    }
  }, 1, 1, 256);

  const cowHide = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = "#1e293b";
      ctx.beginPath(); ctx.arc(rand() * w, rand() * h, 22 + rand() * 35, 0, Math.PI * 2); ctx.fill();
    }
  }, 1, 1, 256);

  const birchBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#f1f5f9"; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 3 === 0 ? "#0f172a" : "#475569";
      ctx.fillRect(rand() * (w - 40), rand() * h, 18 + rand() * 30, 3 + rand() * 4);
    }
  }, 1, 2, 256);

  const oakBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#7c5334"; ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = (x % 16 === 0) ? "#2e1d10" : "#614126";
      ctx.fillRect(x, 0, 5, h);
    }
  }, 2, 2, 256);

  const eyeIris = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 12, cx, cy, 110);
    grad.addColorStop(0, "#0f172a"); grad.addColorStop(0.35, "#1d4ed8"); grad.addColorStop(0.78, "#38bdf8"); grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(cx, cy, 110, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#020617"; ctx.beginPath(); ctx.arc(cx, cy, 42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx - 28, cy - 30, 18, 0, Math.PI * 2); ctx.fill();
  }, 1, 1, 256);

  const makeAwning = (c1: string, c2: string) => makeTex((ctx, w, h) => {
    for (let x = 0; x < w; x += 32) {
      ctx.fillStyle = (x / 32) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x, 0, 32, h);
    }
  }, 2, 1, 128);

  cachedTextures = {
    windowLattice, terrainDetail, snowFrost, leafFoliage, villageStone, kingdomStone, redRoof, halfTimber,
    woodPlanks, royalMarble, horseCoat, cowHide, birchBark, oakBark, cobblestone, eyeIris,
    awningRed: makeAwning("#dc2626", "#fef2f2"),
    awningBlue: makeAwning("#0284c7", "#f0f9ff"),
    awningGreen: makeAwning("#16a34a", "#f0fdf4"),
    awningGold: makeAwning("#d97706", "#fffbeb"),
  };
  return cachedTextures;
}
