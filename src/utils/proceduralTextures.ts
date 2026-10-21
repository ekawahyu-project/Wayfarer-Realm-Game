import * as THREE from "three";

let cachedTextures: Record<string, THREE.CanvasTexture> | null = null;

export function getWorldTextures(): Record<string, THREE.CanvasTexture> {
  if (cachedTextures) return cachedTextures;
  if (typeof document === "undefined") return {};

  const makeTex = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, repeatX = 2, repeatY = 2, size = 512) => {
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

  // 1. Photogrammetry-style Ground & Rock Micro-Detail + Bump Map
  const terrainDetail = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#b0b0b0";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) {
      const x = (i * 73) % w;
      const y = (i * 137) % h;
      const v = 115 + ((i * 29) % 105);
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.fillRect(x, y, 2, 6);
    }
    for (let i = 0; i < 1200; i++) {
      const x = (i * 53) % w;
      const y = (i * 97) % h;
      const v = 70 + (i % 60);
      ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  }, 80, 80);

  // 2. Botanical Leaf Canopy Texture (Thousands of detailed overlapping leaves & veins!)
  const leafFoliage = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#1e3f18";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2400; i++) {
      const x = (i * 89) % w;
      const y = (i * 149) % h;
      const angle = (i * 0.618) * Math.PI * 2;
      const g = 75 + (i % 115);
      const r = Math.floor(g * 0.52);
      const b = Math.floor(g * 0.32);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(220,255,180,0.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
      ctx.stroke();
      ctx.restore();
    }
  }, 3, 3);

  // 3. Medieval Blue-Grey Stone Bricks
  const villageStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#263040";
    ctx.fillRect(0, 0, w, h);
    const rows = 10;
    const cols = 5;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const shade = 84 + ((r * 19 + c * 37) % 42);
        ctx.fillStyle = "rgb(" + (shade - 8) + "," + (shade + 6) + "," + (shade + 22) + ")";
        ctx.fillRect(c * cw + offset + 4, r * rh + 4, cw - 8, rh - 8);
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(c * cw + offset + 4, r * rh + 4, cw - 8, 4);
      }
    }
  }, 3, 2);

  // 4. Royal Kingdom Ashlar Stonework
  const kingdomStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#443850";
    ctx.fillRect(0, 0, w, h);
    const rows = 10;
    const cols = 5;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const v = 152 + ((r * 23 + c * 19) % 36);
        ctx.fillStyle = "rgb(" + (v + 18) + "," + v + "," + (v + 12) + ")";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, rh - 6);
        ctx.fillStyle = "rgba(255,245,250,0.22)";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, 4);
      }
    }
  }, 3, 3);

  // 5. Terracotta Roof Shingles
  const redRoof = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#5c1111";
    ctx.fillRect(0, 0, w, h);
    const rows = 12;
    const cols = 10;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const red = 155 + ((r * 17 + c * 29) % 55);
        ctx.fillStyle = "rgb(" + red + "," + Math.floor(red * 0.28) + "," + Math.floor(red * 0.22) + ")";
        ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 4);
      }
    }
  }, 4, 4);

  // 6. Half-Timber Plaster & Wood Beams
  const halfTimber = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#4a2c14";
    ctx.fillRect(0, 0, w, 24);
    ctx.fillRect(0, h - 24, w, 24);
    ctx.fillRect(0, h / 2 - 12, w, 24);
    for (let x = 0; x <= w; x += 128) ctx.fillRect(x - 10, 0, 20, h);
    ctx.strokeStyle = "#4a2c14";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(256, h);
    ctx.moveTo(w, 0); ctx.lineTo(256, h);
    ctx.stroke();
  }, 2, 1);

  // 7. White Birch Bark & Furrowed Oak Bark
  const birchBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 95; i++) {
      const y = (i * 31) % h;
      const x = (i * 67) % (w - 50);
      ctx.fillStyle = i % 3 === 0 ? "#0f172a" : "#475569";
      ctx.fillRect(x, y, 24 + (i % 45), 4 + (i % 5));
    }
  }, 1, 2);

  const oakBark = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#4a321f";
    ctx.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) {
      ctx.fillStyle = (x % 16 === 0) ? "#2e1d10" : "#614126";
      ctx.fillRect(x, 0, 5, h);
    }
  }, 2, 3);

  // 8. Specular Cobblestone Pavement (Reflects Streetlights at Night!)
  const cobblestone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#334155";
    ctx.fillRect(0, 0, w, h);
    for (let y = 12; y < h; y += 28) {
      for (let x = 12; x < w; x += 32) {
        const s = 100 + ((x * 13 + y * 19) % 45);
        ctx.fillStyle = "rgb(" + s + "," + (s + 5) + "," + (s + 12) + ")";
        ctx.beginPath();
        ctx.arc(x + ((y % 56 === 12) ? 8 : 0), y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 16, 16);

  // 9. Soulful Eye Iris Texture with Pupil & Dual Catchlights (Digital Human Eye Shader)
  const eyeIris = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2;
    const grad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 125);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.32, "#1d4ed8");
    grad.addColorStop(0.75, "#38bdf8");
    grad.addColorStop(0.95, "#1e3a8a");
    grad.addColorStop(1, "#ffffff");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 125, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.arc(cx, cy, 46, 0, Math.PI * 2);
    ctx.fill();
    // Soul Catchlights
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx - 32, cy - 34, 20, 0, Math.PI * 2);
    ctx.arc(cx + 28, cy + 26, 9, 0, Math.PI * 2);
    ctx.fill();
  }, 1, 1, 256);

  // 10. Market Awning Textures
  const makeAwning = (c1: string, c2: string) => makeTex((ctx, w, h) => {
    for (let x = 0; x < w; x += 64) {
      ctx.fillStyle = (x / 64) % 2 === 0 ? c1 : c2;
      ctx.fillRect(x, 0, 64, h);
    }
  }, 2, 1, 256);

  cachedTextures = {
    terrainDetail, leafFoliage, villageStone, kingdomStone, redRoof, halfTimber,
    birchBark, oakBark, cobblestone, eyeIris,
    awningRed: makeAwning("#dc2626", "#fef2f2"),
    awningBlue: makeAwning("#0284c7", "#f0f9ff"),
    awningGreen: makeAwning("#16a34a", "#f0fdf4"),
    awningGold: makeAwning("#d97706", "#fffbeb"),
  };
  return cachedTextures;
}
