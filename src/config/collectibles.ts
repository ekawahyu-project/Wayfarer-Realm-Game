import { getWalkableHeight } from "@/utils/noise";

export interface CollectibleItem {
  id: string;
  name: string;
  category: "Kerang Laut" | "Bunga Malam" | "Koin Kuno" | "Lentera Mini" | "Kristal Aurora";
  position: [number, number, number];
  color: string;
}

const RAW_COLLECTIBLES: (Omit<CollectibleItem, "position"> & { x: number; z: number })[] = [
  { id: "col_01", name: "Kerang Mutiara Barat", category: "Kerang Laut", x: -518, z: -22, color: "#38bdf8" },
  { id: "col_02", name: "Kerang Bintang Karang", category: "Kerang Laut", x: -512, z: 38, color: "#38bdf8" },
  { id: "col_03", name: "Kerang Turquoise", category: "Kerang Laut", x: -505, z: -72, color: "#38bdf8" },
  { id: "col_04", name: "Kerang Tanjung Palem", category: "Kerang Laut", x: -502, z: 85, color: "#38bdf8" },
  { id: "col_05", name: "Kerang Pelabuhan Selatan", category: "Kerang Laut", x: -12, z: 535, color: "#38bdf8" },
  { id: "col_06", name: "Kerang Mercusuar", category: "Kerang Laut", x: 18, z: 542, color: "#38bdf8" },
  { id: "col_07", name: "Bunga Malam Padang Rumput", category: "Bunga Malam", x: -120, z: 10, color: "#c084fc" },
  { id: "col_08", name: "Bunga Malam Bukit Tengah", category: "Bunga Malam", x: 20, z: -40, color: "#c084fc" },
  { id: "col_09", name: "Bunga Malam Tepi Hutan", category: "Bunga Malam", x: -95, z: -110, color: "#c084fc" },
  { id: "col_10", name: "Bunga Malam Tepi Sungai", category: "Bunga Malam", x: 218, z: 18, color: "#c084fc" },
  { id: "col_11", name: "Bunga Malam Jembatan Sungai", category: "Bunga Malam", x: 245, z: 0, color: "#c084fc" },
  { id: "col_12", name: "Bunga Malam Taman Kastil", category: "Bunga Malam", x: -24, z: 392, color: "#c084fc" },
  { id: "col_13", name: "Koin Kuno Pasar Timur", category: "Koin Kuno", x: 365, z: 0, color: "#fbbf24" },
  { id: "col_14", name: "Koin Kuno Desa Barat Daya", category: "Koin Kuno", x: -280, z: 240, color: "#fbbf24" },
  { id: "col_15", name: "Koin Kuno Desa Hutan Barat", category: "Koin Kuno", x: -245, z: -95, color: "#fbbf24" },
  { id: "col_16", name: "Koin Kuno Gerbang Benteng", category: "Koin Kuno", x: 0, z: 322, color: "#fbbf24" },
  { id: "col_17", name: "Koin Kuno Pelataran Kastil", category: "Koin Kuno", x: 14, z: 382, color: "#fbbf24" },
  { id: "col_18", name: "Koin Kuno Singgasana Raja", category: "Koin Kuno", x: 0, z: 452, color: "#fbbf24" },
  { id: "col_19", name: "Lentera Mini Torii Pertama", category: "Lentera Mini", x: -310, z: -266, color: "#f97316" },
  { id: "col_20", name: "Lentera Mini Tangga Kuil", category: "Lentera Mini", x: -305, z: -285, color: "#f97316" },
  { id: "col_21", name: "Lentera Mini Altar Kuil", category: "Lentera Mini", x: -310, z: -312, color: "#f97316" },
  { id: "col_22", name: "Lentera Mini Hutan Maple", category: "Lentera Mini", x: -285, z: -320, color: "#f97316" },
  { id: "col_23", name: "Lentera Mini Belakang Kuil", category: "Lentera Mini", x: -310, z: -332, color: "#f97316" },
  { id: "col_24", name: "Lentera Mini Dermaga Barat", category: "Lentera Mini", x: -555, z: 0, color: "#f97316" },
  { id: "col_25", name: "Kristal Aurora Lembah Salju", category: "Kristal Aurora", x: -12, z: -350, color: "#34d399" },
  { id: "col_26", name: "Kristal Aurora Chalet Utara", category: "Kristal Aurora", x: 12, z: -385, color: "#34d399" },
  { id: "col_27", name: "Kristal Aurora Hutan Cemara", category: "Kristal Aurora", x: 55, z: -330, color: "#34d399" },
  { id: "col_28", name: "Kristal Aurora Lereng Es", category: "Kristal Aurora", x: -35, z: -420, color: "#34d399" },
  { id: "col_29", name: "Kristal Aurora Puncak Utara", category: "Kristal Aurora", x: 0, z: -445, color: "#34d399" },
  { id: "col_30", name: "Kristal Aurora Atas Benteng", category: "Kristal Aurora", x: -45, z: 315, color: "#34d399" },
];

export const COLLECTIBLES: CollectibleItem[] = RAW_COLLECTIBLES.map((item) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  color: item.color,
  position: [item.x, getWalkableHeight(item.x, item.z, item.id === "col_30" ? 38 : 22) + 0.85, item.z],
}));
