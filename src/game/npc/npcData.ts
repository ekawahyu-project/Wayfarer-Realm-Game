export interface DialogueChoice {
  text: string;
  nextText: string;
  startQuestId?: string;
  completeQuestId?: string;
}

export interface NPCDef {
  id: string;
  name: string;
  role: string;
  biome: string;
  position: [number, number, number];
  patrolOffset: [number, number];
  coatColor: string;
  hatColor: string;
  useSorceressModel?: boolean;
  greeting: string;
  choices: DialogueChoice[];
}

export const NPCS: NPCDef[] = [
  {
    id: "npc_arka",
    name: "Kapten Arka",
    role: "Nelayan & Penjaga Dermaga",
    biome: "Pantai Barat",
    position: [-592, 0, 5],
    patrolOffset: [6, 0],
    coatColor: "#0284c7",
    hatColor: "#f59e0b",
    greeting: "Selamat datang di Pulau Wayfarer, Penjelajah! Air laut hari ini begitu jernih. Kamu bebas memakai perahu tugboat milikku di ujung dermaga kapan saja.",
    choices: [
      {
        text: "Apakah ada sesuatu yang bisa kubantu, Kapten?",
        nextText: "Tentu! Tolong sampaikan salam dan kabar cuaca cerah ini kepada sahabatku, Damar si Penjaga Mercusuar di Pelabuhan Selatan.",
        startQuestId: "quest_01",
      },
      {
        text: "Terima kasih, aku ingin melihat pemandangan pantai dulu.",
        nextText: "Silakan! Jangan lupa mencoba berenang di air dangkal turquoise itu, rasanya sangat menyegarkan.",
      },
    ],
  },
  {
    id: "npc_raka",
    name: "Tetua Desa Raka",
    role: "Tetua Desa Pedesaan Timur",
    biome: "Desa Timur",
    position: [356, 0, -6],
    patrolOffset: [5, 5],
    coatColor: "#15803d",
    hatColor: "#78350f",
    greeting: "Salam hangat dari Desa Pedesaan Timur! Saat senja tiba, seluruh jendela rumah kayu kami akan menyala hangat menyambut malam.",
    choices: [
      {
        text: "Ceritakan tentang benda berkilau di pulau ini.",
        nextText: "Di seluruh pulau tersebar 30 benda koleksi mulai dari Kerang Laut hingga Bunga Malam. Jika kamu mengumpulkan minimal 3 saja, lenteramu akan bersinar makin indah!",
        startQuestId: "quest_02",
      },
      {
        text: "Desa ini sangat damai dan asri.",
        nextText: "Begitulah hidup di pulau ini. Tidak perlu terburu-buru, nikmati saja suara angin dan langkah kakimu.",
      },
    ],
  },
  {
    id: "npc_mila",
    name: "Mila si Pembuat Roti",
    role: "Warga Desa Timur",
    biome: "Desa Timur",
    position: [372, 0, 10],
    patrolOffset: [-6, 4],
    coatColor: "#be123c",
    hatColor: "#fef3c7",
    greeting: "Aroma roti hangat paling cocok dinikmati sore hari sambil melihat pohon-pohon besar di tepi jembatan kayu.",
    choices: [
      {
        text: "Ke mana arah menuju Kota Kerajaan?",
        nextText: "Berjalanlah ke arah Bukit Selatan (Z positif). Kamu akan melihat menara jam raksasa dan bendera merah kerajaan dari kejauhan!",
      },
    ],
  },
  {
    id: "npc_hana",
    name: "Penjaga Kuil Hana",
    role: "Gadis Kuil Maple Merah",
    biome: "Kuil Barat Laut",
    position: [-310, 0, -298],
    patrolOffset: [4, 0],
    coatColor: "#dc2626",
    hatColor: "#1e293b",
    greeting: "Lihatlah daun-daun maple merah yang gugur perlahan ini. Saat malam Bulan Merah tiba, seluruh kuil ini akan memancarkan cahaya yang tak terlupakan.",
    choices: [
      {
        text: "Aku datang untuk mengagumi Kuil Maple Merah ini.",
        nextText: "Terima kasih telah berkunjung dengan hati yang tenang. Aku sudah mencatat lentera kuil ini di dalam Jurnal Penjelajahmu.",
        startQuestId: "quest_04",
        completeQuestId: "quest_04",
      },
    ],
  },
  {
    id: "npc_lyra_sorceress",
    name: "Penyihir Agung Lyra",
    role: "Penasihat Bintang & Kristal Kerajaan",
    biome: "Kota Kerajaan",
    position: [0, 0, 386],
    patrolOffset: [0, 5],
    coatColor: "#6d28d9",
    hatColor: "#311042",
    useSorceressModel: true,
    greeting: "Selamat datang di pelataran Kota Kerajaan, pengembara. Dari kubah observatorium ini, kami mengamati pergerakan bintang dan pita Aurora di langit utara.",
    choices: [
      {
        text: "Bagaimana cara melihat Aurora terbaik?",
        nextText: "Pergilah ke Puncak Pegunungan Salju di Utara saat malam hari. Pita cahaya hijau dan magenta akan menari tepat di atas kepalamu!",
        startQuestId: "quest_03",
      },
      {
        text: "Arsitektur kastil dan menara jam ini luar biasa megah.",
        nextText: "Menara Jam Raksasa dan obor-obor kota kami dirancang untuk menjaga kehangatan malam bagi siapa saja yang singgah.",
      },
    ],
  },
  {
    id: "npc_guard_varon",
    name: "Kapten Penjaga Varon",
    role: "Penjaga Gerbang Kembar Kerajaan",
    biome: "Kota Kerajaan",
    position: [-14, 0, 362],
    patrolOffset: [6, 0],
    coatColor: "#475569",
    hatColor: "#991b1b",
    greeting: "Gerbang Kembar Kota Kerajaan selalu terbuka untuk para penjelajah damai. Silakan masuk dan nikmati taman patung serta alun-alun kota.",
    choices: [
      {
        text: "Terima kasih, Kapten Varon!",
        nextText: "Semoga perjalananmu menyenangkan. Jika ingin ke Pelabuhan, cukup turun mengikuti lereng selatan di belakang kastil.",
      },
    ],
  },
  {
    id: "npc_astronomer_kael",
    name: "Astronom Kael",
    role: "Penjaga Menara Jam & Observatorium",
    biome: "Kota Kerajaan",
    position: [22, 0, 376],
    patrolOffset: [0, 5],
    coatColor: "#1e40af",
    hatColor: "#d97706",
    greeting: "Detak Menara Jam ini berpadu serasi dengan perputaran matahari dan bulan di langit Wayfarer Realm.",
    choices: [
      {
        text: "Bisakah waktu di dunia ini dipercepat?",
        nextText: "Rahasia kecil untukmu: tekan tombol T di keyboard jika kamu ingin melihat pergerakan cepat matahari terbit hingga malam berbintang!",
      },
    ],
  },
  {
    id: "npc_damar",
    name: "Penjaga Mercusuar Damar",
    role: "Penjaga Pelabuhan Selatan",
    biome: "Pelabuhan Selatan",
    position: [12, 0, 612],
    patrolOffset: [5, 0],
    coatColor: "#b45309",
    hatColor: "#1e3a8a",
    greeting: "Angin laut selatan berhembus tenang. Cahaya mercusuar ini memandu kapal layar kerajaan setiap malam.",
    choices: [
      {
        text: "Aku membawa salam dan kabar cuaca dari Kapten Arka!",
        nextText: "Wah, terima kasih banyak! Kapten Arka memang sahabat sejati. Terimalah lencana kehormatan pelaut ini untuk Jurnal Penjelajahmu!",
        completeQuestId: "quest_01",
      },
      {
        text: "Kapal layar di dermaga itu tampak gagah.",
        nextText: "Itu kapal kebanggaan kerajaan kami yang baru saja kembali dari pelayaran jauh.",
      },
    ],
  },
  {
    id: "npc_bima",
    name: "Pendaki Bima",
    role: "Penjelajah Lembah Salju",
    biome: "Pegunungan Salju",
    position: [-10, 0, -385],
    patrolOffset: [7, 3],
    coatColor: "#0f766e",
    hatColor: "#f8fafc",
    greeting: "Udara di Lembah Salju Utara ini dingin, tapi cahaya lampu dari pondok-pondok kayu membuat suasananya terasa sangat hangat.",
    choices: [
      {
        text: "Di mana titik terbaik melihat Aurora?",
        nextText: "Naiklah sedikit lagi ke arah utara menuju Puncak Aurora (Z: -460) saat langit malam tiba!",
      },
    ],
  },
  {
    id: "npc_seno",
    name: "Pengembara Seno",
    role: "Pejalan Padang Rumput",
    biome: "Padang Rumput Tengah",
    position: [-30, 0, 15],
    patrolOffset: [8, 6],
    coatColor: "#4d7c0f",
    hatColor: "#92400e",
    greeting: "Padang rumput tengah ini adalah persimpangan terbaik. Barat ke Pantai, Timur ke Desa, Utara ke Gunung Salju, dan Selatan ke Kastil Kerajaan!",
    choices: [
      {
        text: "Bagaimana cara membuka Peta dan Jurnal?",
        nextText: "Tekan tombol M untuk membuka Peta Pulau, dan tekan tombol J untuk membaca Jurnal Penjelajah serta daftar Quest-mu!",
      },
    ],
  },
];
