# Architecture - Wayfarer Realm

## Status: Milestone M2 (Siklus Siang Malam dan Langit)
- **Time Store & Keyframes (`src/game/state/useTimeStore.ts`, `src/config/timeOfDay.ts`)**:
  - Menyimpan waktu dunia (0-24 jam, default 1 hari = 20 menit nyata) dan mendukung interpolasi smoothstep 6 fase (Fajar, Pagi, Siang, Sore, Senja, Malam).
- **Global Uniforms (`src/game/systems/globalUniforms.ts`)**:
  - Berbagi `uTime`, `uNightFactor`, `uSunDir`, `uMoonDir`, `uSkyTop`, `uSkyHorizon`, dan `uBloodMoon` ke seluruh shader tanpa re-render React.
- **Procedural Sky Shader (`src/game/systems/Sky.tsx`)**:
  - Merender gradien langit, matahari dengan halo, bulan bertekstur kawah prosedural (plus mode Bulan Merah), bintang berkedip, dan awan bergerak.
- **Dynamic Lighting & Shadows (`src/game/systems/TimeOfDay.tsx`)**:
  - Mengatur DirectionalLight matahari & bulan, HemisphereLight, FogExp2, ACES Filmic Tone Mapping exposure, serta texel-snapped shadow camera di sekitar pemain.
