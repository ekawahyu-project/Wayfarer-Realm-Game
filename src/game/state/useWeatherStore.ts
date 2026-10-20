import { create } from "zustand";

export type WeatherType = "clear" | "cloudy" | "fog" | "rain" | "snow";
export type PhotoFilter = "none" | "warm" | "vintage" | "cool" | "dreamy";

interface WeatherAndAudioState {
  weather: WeatherType;
  weatherLabel: string;
  autoWeather: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  isMuted: boolean;
  isPhotoMode: boolean;
  photoFov: number;
  photoFilter: PhotoFilter;
  setWeather: (weather: WeatherType) => void;
  setAutoWeather: (auto: boolean) => void;
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setAmbientVolume: (v: number) => void;
  toggleMute: () => void;
  togglePhotoMode: () => void;
  setPhotoFov: (fov: number) => void;
  setPhotoFilter: (filter: PhotoFilter) => void;
}

const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: "Cerah",
  cloudy: "Berawan",
  fog: "Kabut Tebal",
  rain: "Hujan Ringan",
  snow: "Salju Ringan",
};

export const weatherFrameState = {
  rainIntensity: 0,
  snowIntensity: 0,
  fogMultiplier: 1,
  cloudiness: 0,
  photoFov: 60,
  isPhotoMode: false,
};

export const useWeatherStore = create<WeatherAndAudioState>((set) => ({
  weather: "clear",
  weatherLabel: "Cerah",
  autoWeather: true,
  masterVolume: 0.75,
  musicVolume: 0.55,
  sfxVolume: 0.70,
  ambientVolume: 0.65,
  isMuted: false,
  isPhotoMode: false,
  photoFov: 60,
  photoFilter: "none",
  setWeather: (weather) => set({ weather, weatherLabel: WEATHER_LABELS[weather] }),
  setAutoWeather: (autoWeather) => set({ autoWeather }),
  setMasterVolume: (masterVolume) => set({ masterVolume }),
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  setSfxVolume: (sfxVolume) => set({ sfxVolume }),
  setAmbientVolume: (ambientVolume) => set({ ambientVolume }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  togglePhotoMode: () =>
    set((s) => {
      const next = !s.isPhotoMode;
      weatherFrameState.isPhotoMode = next;
      if (next && document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      return { isPhotoMode: next };
    }),
  setPhotoFov: (photoFov) => {
    weatherFrameState.photoFov = photoFov;
    set({ photoFov });
  },
  setPhotoFilter: (photoFilter) => set({ photoFilter }),
}));
