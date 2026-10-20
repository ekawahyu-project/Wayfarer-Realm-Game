export interface Quest {
  id: string;
  title: string;
  giver: string;
  description: string;
  targetText: string;
  rewardText: string;
}

export const QUESTS: Quest[] = [
  {
    id: "quest_01",
    title: "Surat untuk Penjaga Mercusuar",
    giver: "Kapten Arka (Pantai Barat)",
    description: "Antarkan kabar cuaca laut dari Kapten Arka di Dermaga Pantai Barat kepada Penjaga Mercusuar di Pelabuhan Selatan.",
    targetText: "Bicara dengan Penjaga Mercusuar Damar di Pelabuhan Selatan",
    rewardText: "Entri Jurnal Pelaut & Lencana Kompas Emas",
  },
  {
    id: "quest_02",
    title: "Bunga yang Mekar Saat Malam",
    giver: "Tetua Desa Raka (Desa Timur)",
    description: "Kumpulkan minimal 3 benda koleksi di sekitar pulau untuk membantu ramuan lentera warga desa.",
    targetText: "Ambil 3 Benda Koleksi (Tekan E dekat kristal berkilau)",
    rewardText: "Lentera Pinggang Lebih Terang",
  },
  {
    id: "quest_03",
    title: "Cahaya Aurora dari Puncak Utara",
    giver: "Penyihir Kerajaan Lyra (Kota Kerajaan)",
    description: "Mendakilah ke Puncak Pegunungan Salju di Utara dan saksikan keindahan pita cahaya Aurora.",
    targetText: "Kunjungi POI Puncak Aurora Utara (Z: -460)",
    rewardText: "Jubah Penjelajah Bintang",
  },
  {
    id: "quest_04",
    title: "Lentera Kuil Maple Merah",
    giver: "Penjaga Kuil Hana (Kuil Barat Laut)",
    description: "Kunjungi Kuil Agung Maple Merah di Barat Laut dan nikmati suasana guguran daun maple.",
    targetText: "Temukan Kuil Agung Maple Merah & Bicara dengan Hana",
    rewardText: "Catatan Rahasia Bulan Merah",
  },
  {
    id: "quest_05",
    title: "Penjelajah Sejati Pulau Wayfarer",
    giver: "Jurnal Penjelajah",
    description: "Jelajahi pulau dengan santai dan temukan minimal 6 Titik Menarik (POI) berbeda.",
    targetText: "Temukan 6 lokasi POI di pulau",
    rewardText: "Gelar Penjelajah Wayfarer Realm",
  },
];
