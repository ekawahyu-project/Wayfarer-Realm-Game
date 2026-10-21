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

  // 1. Blue-Grey Medieval Stone Bricks (Reference Image 4 Village)
  const villageStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#3b4754";
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const cols = 4;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const shade = 78 + ((r * 17 + c * 31) % 26);
        ctx.fillStyle = "rgb(" + (shade - 6) + "," + (shade + 6) + "," + (shade + 20) + ")";
        ctx.fillRect(c * cw + offset + 3, r * rh + 3, cw - 6, rh - 6);
      }
    }
  }, 3, 2);

  // 2. Warm Pinkish-Lilac Gothic Ashlar Stone (Reference Image 5 & 6 Kingdom)
  const kingdomStone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#5c4d63";
    ctx.fillRect(0, 0, w, h);
    const rows = 8;
    const cols = 4;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const v = 138 + ((r * 23 + c * 19) % 28);
        ctx.fillStyle = "rgb(" + (v + 12) + "," + (v - 4) + "," + (v + 8) + ")";
        ctx.fillRect(c * cw + offset + 2, r * rh + 2, cw - 4, rh - 4);
      }
    }
  }, 3, 3);

  // 3. Red Terracotta Roof Shingles (Reference Images 4, 5, 6)
  const redRoof = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#7f1d1d";
    ctx.fillRect(0, 0, w, h);
    const rows = 10;
    const cols = 8;
    const rh = h / rows;
    const cw = w / cols;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const red = 155 + ((r * 13 + c * 29) % 45);
        ctx.fillStyle = "rgb(" + red + "," + Math.floor(red * 0.25) + "," + Math.floor(red * 0.22) + ")";
        ctx.fillRect(c * cw + 2, r * rh + 2, cw - 4, rh - 3);
      }
    }
  }, 4, 4);

  // 4. Half-Timber Plaster with Wood Lattice (Reference Image 4)
  const halfTimber = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5c3a21";
    ctx.fillRect(0, 0, w, 18);
    ctx.fillRect(0, h - 18, w, 18);
    ctx.fillRect(0, h / 2 - 8, w, 16);
    for (let x = 0; x <= w; x += 64) {
      ctx.fillRect(x - 7, 0, 14, h);
    }
    ctx.strokeStyle = "#5c3a21";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(128, h);
    ctx.moveTo(w, 0); ctx.lineTo(128, h);
    ctx.stroke();
  }, 2, 1);

  // 5. Cobblestone Plaza Pavement
  const cobblestone = makeTex((ctx, w, h) => {
    ctx.fillStyle = "#475569";
    ctx.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 24) {
      for (let x = 8; x < w; x += 28) {
        const s = 95 + ((x * 11 + y * 17) % 35);
        ctx.fillStyle = "rgb(" + s + "," + (s + 4) + "," + (s + 10) + ")";
        ctx.beginPath();
        ctx.arc(x + ((y % 48 === 8) ? 6 : 0), y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, 10, 10);

  cachedTextures = { villageStone, kingdomStone, redRoof, halfTimber, cobblestone };
  return cachedTextures;
}
