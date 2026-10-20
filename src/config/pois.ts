export interface POI {
  id: string;
  name: string;
  biome: "beach" | "mountain" | "shrine" | "forest" | "meadow" | "village" | "kingdom" | "harbor";
  position: [number, number, number];
  type: "view" | "building" | "collectible" | "npc" | "secret";
  journalText: string;
  discoverRadius: number;
}

export const POIS: POI[] = [
  { id: "poi_01", name: "Dermaga Pantai Barat", biome: "beach", position: [-585, 4, 0], type: "building", journalText: "Dermaga kayu tenang tempat perahu tugboat bersandar di air turquoise jernih.", discoverRadius: 28 },
  { id: "poi_02", name: "Teluk Karang Berkilau", biome: "beach", position: [-560, 3, -95], type: "view", journalText: "Gugusan batu karang pantai tempat ikan-ikan kecil bersembunyi di bawah cahaya caustic.", discoverRadius: 26 },
  { id: "poi_03", name: "Tanjung Palem Kembar", biome: "beach", position: [-555, 3, 110], type: "view", journalText: "Rumpun pohon kelapa yang melambai diterpa angin laut barat.", discoverRadius: 26 },
  { id: "poi_04", name: "Pulau Karang Barat", biome: "beach", position: [-860, 2, -160], type: "secret", journalText: "Pulau kecil di seberang laut dangkal yang hanya bisa dicapai dengan berenang atau naik perahu.", discoverRadius: 45 },
  { id: "poi_05", name: "Bukit Angin Padang Rumput", biome: "meadow", position: [-180, 10, 20], type: "view", journalText: "Hamparan rumput hijau bergelombang di jantung pulau yang menghubungkan semua wilayah.", discoverRadius: 32 },
  { id: "poi_06", name: "Lembah Bunga Liar", biome: "meadow", position: [40, 9, -60], type: "collectible", journalText: "Padang bunga warna-warni yang harum saat matahari pagi bersinar.", discoverRadius: 30 },
  { id: "poi_07", name: "Batu Kuno Penjelajah", biome: "meadow", position: [-40, 11, 120], type: "secret", journalText: "Monolit batu berlumut penanda jalur kuno menuju Kota Kerajaan di selatan.", discoverRadius: 26 },
  { id: "poi_08", name: "Hutan Rimba Teduh", biome: "forest", position: [-140, 12, -130], type: "view", journalText: "Kanopi pepohonan rindang tempat sinar matahari menembus kabut tipis.", discoverRadius: 32 },
  { id: "poi_09", name: "Lingkaran Jamur Cahaya", biome: "forest", position: [120, 11, 130], type: "secret", journalText: "Sudut hutan yang tenang dan dipenuhi lumut lembut.", discoverRadius: 28 },
  { id: "poi_10", name: "Alun-Alun Sumur Desa", biome: "village", position: [360, 9, 0], type: "building", journalText: "Pusat Desa Pedesaan Timur dengan sumur batu tua tempat warga berkumpul.", discoverRadius: 28 },
  { id: "poi_11", name: "Jembatan Kayu Desa", biome: "village", position: [350, 9, 12], type: "building", journalText: "Jembatan kayu melengkung di bawah naungan pohon raksasa berlumut.", discoverRadius: 22 },
  { id: "poi_12", name: "Menara Pandang Pedesaan", biome: "village", position: [388, 9, -20], type: "building", journalText: "Rumah half-timber tinggi dengan jendela kuning hangat di kala senja.", discoverRadius: 25 },
  { id: "poi_13", name: "Kebun Timur Desa", biome: "village", position: [410, 9, 25], type: "view", journalText: "Pekarangan hijau di tepi timur desa yang menghadap ke laut lepas.", discoverRadius: 26 },
  { id: "poi_14", name: "Gerbang Torii Merah", biome: "shrine", position: [-310, 19, -271], type: "building", journalText: "Gerbang merah tradisional penanda batas suci menuju Kuil Maple.", discoverRadius: 25 },
  { id: "poi_15", name: "Tangga Lentera Batu", biome: "shrine", position: [-310, 19, -290], type: "view", journalText: "Deretan lentera batu yang menyala hangat di tengah guguran daun maple merah.", discoverRadius: 24 },
  { id: "poi_16", name: "Kuil Agung Maple Merah", biome: "shrine", position: [-310, 19, -315], type: "building", journalText: "Pagoda bertingkat yang tampak magis saat malam Bulan Merah tiba.", discoverRadius: 28 },
  { id: "poi_17", name: "Desa Lembah Salju", biome: "mountain", position: [0, 24, -400], type: "building", journalText: "Deretan pondok kayu beratap salju dengan cahaya jendela oranye hangat di malam hari.", discoverRadius: 35 },
  { id: "poi_18", name: "Hutan Pinus Utara", biome: "mountain", position: [90, 22, -310], type: "view", journalText: "Ratusan pohon pinus bersalju yang berdiri rapat menahan angin utara.", discoverRadius: 32 },
  { id: "poi_19", name: "Puncak Aurora Utara", biome: "mountain", position: [0, 55, -460], type: "view", journalText: "Titik pandang tertinggi untuk menyaksikan pita cahaya Aurora hijau dan magenta di langit malam.", discoverRadius: 40 },
  { id: "poi_20", name: "Gerbang Kembar Kerajaan", biome: "kingdom", position: [-18, 25, 366], type: "building", journalText: "Gerbang gotik megah dengan empat bendera merah-emas kerajaan yang menjuntai.", discoverRadius: 28 },
  { id: "poi_21", name: "Menara Jam Raksasa", biome: "kingdom", position: [16, 25, 382], type: "building", journalText: "Menara jam kuning bercahaya yang menjadi penunjuk waktu seluruh warga kota kerajaan.", discoverRadius: 26 },
  { id: "poi_22", name: "Kubah Observatorium & Taman Patung", biome: "kingdom", position: [22, 25, 378], type: "building", journalText: "Observatorium perunggu dengan teleskop bintang dan patung penjaga kristal.", discoverRadius: 26 },
  { id: "poi_23", name: "Katedral & Istana Kerajaan", biome: "kingdom", position: [0, 25, 422], type: "building", journalText: "Benteng utama kerajaan dengan jendela kaca patri tinggi yang menyala di waktu senja.", discoverRadius: 34 },
  { id: "poi_24", name: "Pelabuhan Selatan & Mercusuar", biome: "harbor", position: [0, 4, 618], type: "building", journalText: "Pelabuhan besar di ujung selatan tempat kapal layar kerajaan berlabuh di dekat mercusuar.", discoverRadius: 35 },
];
