import { getTerrainHeight } from "@/utils/noise";

export interface CollectibleItem {
  id: string;
  name: string;
  category: "Kerang Laut" | "Bunga Malam" | "Koin Kuno" | "Lentera Mini" | "Kristal Aurora";
  position: [number, number, number];
  color: string;
}

const RAW_COLLECTIBLES: Omit<CollectibleItem, "position"> & { x: number; z: number }[] = [
  { id: "col_01", name: "Kerang Mutiara Barat", category: "Kerang Laut", x: -570, z: -25, color: "#38bdf8" },
  { id: "col_02", name: "Kerang Bintang Karang", category: "Kerang Laut", x: -562, z: 45, color: "#38bdf8" },
  { id: "col_03", name: "Kerang Turquoise", category: "Kerang Laut", x: -550, z: -80, color: "#38bdf8" },
  { id: "col_04", name: "Kerang Tanjung Palem", category: "Kerang Laut", x: -545, z: 95, color: "#38bdf8" },
  { id: "col_05", name: "Kerang Pelabuhan Selatan", category: "Kerang Laut", x: -15, z: 605, color: "#38bdf8" },
  { id: "col_06", name: "Kerang Mercusuar", category: "Kerang Laut", x: 24, z: 615, color: "#38bdf8" },
  { id: "col_07", name: "Bunga Malam Padang Rumput", category: "Bunga Malam", x: -120, z: 10, color: "#c084fc" },
  { id: "col_08", name: "Bunga Malam Bukit Tengah", category: "Bunga Malam", x: 20, z: -40, color: "#c084fc" },
  { id: "col_09", name: "Bunga Malam Tepi Hutan", category: "Bunga Malam", x: -95, z: -110, color: "#c084fc" },
  { id: "col_10", name: "Bunga Malam Lembah Timur", category: "Bunga Malam", x: 210, z: 20, color: "#c084fc" },
  { id: "col_11", name: "Bunga Malam Jembatan Desa", category: "Bunga Malam", x: 342, z: 16, color: "#c084fc" },
  { id: "col_12", name: "Bunga Malam Taman Kastil", category: "Bunga Malam", x: -24, z: 392, color: "#c084fc" },
  { id: "col_13", name: "Koin Kuno Sumur Desa", category: "Koin Kuno", x: 364, z: -4, color: "#fbbf24" },
  { id: "col_14", name: "Koin Kuno Menara Desa", category: "Koin Kuno", x: 385, z: -15, color: "#fbbf24" },
  { id: "col_15", name: "Koin Kuno Pohon Raksasa", category: "Koin Kuno", x: 344, z: 5, color: "#fbbf24" },
  { id: "col_16", name: "Koin Kuno Gerbang Kerajaan", category: "Koin Kuno", x: -18, z: 360, color: "#fbbf24" },
  { id: "col_17", name: "Koin Kuno Menara Jam", category: "Koin Kuno", x: 14, z: 376, color: "#fbbf24" },
  { id: "col_18", name: "Koin Kuno Observatorium", category: "Koin Kuno", x: 30, z: 372, color: "#fbbf24" },
  { id: "col_19", name: "Lentera Mini Torii Pertama", category: "Lentera Mini", x: -310, z: -266, color: "#f97316" },
  { id: "col_20", name: "Lentera Mini Tangga Kuil", category: "Lentera Mini", x: -305, z: -285, color: "#f97316" },
  { id: "col_21", name: "Lentera Mini Halaman Pagoda", category: "Lentera Mini", x: -318, z: -304, color: "#f97316" },
  { id: "col_22", name: "Lentera Mini Hutan Maple", category: "Lentera Mini", x: -285, z: -320, color: "#f97316" },
  { id: "col_23", name: "Lentera Mini Belakang Kuil", category: "Lentera Mini", x: -310, z: -332, color: "#f97316" },
  { id: "col_24", name: "Lentera Mini Dermaga Barat", category: "Lentera Mini", x: -598, z: 2, color: "#f97316" },
  { id: "col_25", name: "Kristal Aurora Lembah Salju", category: "Kristal Aurora", x: -20, z: -375, color: "#34d399" },
  { id: "col_26", name: "Kristal Aurora Pondok Utara", category: "Kristal Aurora", x: 18, z: -390, color: "#34d399" },
  { id: "col_27", name: "Kristal Aurora Hutan Pinus", category: "Kristal Aurora", x: 65, z: -330, color: "#34d399" },
  { id: "col_28", name: "Kristal Aurora Lereng Es", category: "Kristal Aurora", x: -45, z: -430, color: "#34d399" },
  { id: "col_29", name: "Kristal Aurora Puncak Utara", category: "Kristal Aurora", x: 0, z: -455, color: "#34d399" },
  { id: "col_30", name: "Kristal Aurora Katedral", category: "Kristal Aurora", x: 0, z: 408, color: "#34d399" },
];

export const COLLECTIBLES: CollectibleItem[] = RAW_COLLECTIBLES.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  color: item.color,
  position: [item.x, getTerrainHeight(item.x, item.z) + 0.65, item.z],
}));
