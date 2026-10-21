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
  hasCrown?: boolean;
  greeting: string;
  choices: DialogueChoice[];
}

export const NPCS: NPCDef[] = [
  {
    id: "npc_king_aldric",
    name: "Raja Aldric",
    role: "Penguasa Wayfarer Realm",
    biome: "Ruang Singgasana Istana",
    position: [-1.8, 0, 456],
    patrolOffset: [0, 0],
    coatColor: "#991b1b",
    hatColor: "#fbbf24",
    hasCrown: true,
    greeting: "Selamat datang di Ruang Singgasana Kerajaan, Penjelajah! Istana dan benteng kami selalu terbuka bagi pengembara yang membawa kedamaian.",
    choices: [
      {
        text: "Yang Mulia, kemegahan istana dan kota kerajaan ini luar biasa!",
        nextText: "Terima kasih! Jangan ragu untuk menaiki tangga di sisi aula ini menuju Balkon Kerajaan, atau berjalan-jalan di atas puncak Tembok Benteng kami.",
        completeQuestId: "quest_05",
      },
      {
        text: "Apa tugas mulia yang bisa saya jalankan untuk Kerajaan?",
        nextText: "Kunjungilah ketiga desa makmur kami—Desa Pasar Timur, Desa Pesisir Barat Daya, dan Desa Hutan Barat—serta saksikan cahaya Aurora di Puncak Utara!",
        startQuestId: "quest_03",
      },
    ],
  },
  {
    id: "npc_queen_seraphina",
    name: "Ratu Seraphina",
    role: "Permaisuri Kerajaan",
    biome: "Ruang Singgasana Istana",
    position: [1.8, 0, 456],
    patrolOffset: [0, 0],
    coatColor: "#6d28d9",
    hatColor: "#f43f5e",
    hasCrown: true,
    useSorceressModel: true,
    greeting: "Semoga cahaya bintang dan kristal kerajaan selalu menerangi langkahmu di seluruh penjuru pulau ini.",
    choices: [
      {
        text: "Terima kasih atas sambutan hangatnya, Ratu Seraphina.",
        nextText: "Nikmatilah hidangan di meja perjamuan agung kami dan dengarkan alunan musik yang menenangkan hati.",
      },
    ],
  },
  {
    id: "npc_arka",
    name: "Kapten Arka",
    role: "Nelayan & Penjaga Dermaga Barat",
    biome: "Pantai Barat",
    position: [-536, 0, 4],
    patrolOffset: [5, 0],
    coatColor: "#0284c7",
    hatColor: "#f59e0b",
    greeting: "Selamat datang di Pantai Barat! Perahu tugboat di ujung dermaga sudah siap berlayar, atau kamu bisa menunggangi kuda di tepi pantai untuk menjelajah cepat.",
    choices: [
      {
        text: "Apakah ada sesuatu yang bisa kubantu, Kapten?",
        nextText: "Tolong sampaikan salam dan kabar cuaca cerah ini kepada sahabatku, Damar si Penjaga Mercusuar di Pelabuhan Selatan!",
        startQuestId: "quest_01",
      },
      {
        text: "Bagaimana cara mengemudikan perahu atau naik kuda?",
        nextText: "Cukup dekati perahu di dermaga atau kuda mana pun di pulau ini lalu tekan tombol E!",
      },
    ],
  },
  {
    id: "npc_raka",
    name: "Tetua Desa Raka",
    role: "Tetua Desa Pasar Timur",
    biome: "Desa Pasar Timur",
    position: [358, 0, -2],
    patrolOffset: [5, 0],
    coatColor: "#15803d",
    hatColor: "#78350f",
    greeting: "Salam hangat dari Desa Pasar Timur! Lihatlah deretan kios buah, ikan, sayur, dan roti kami yang ramai, serta rumah-rumah warga yang pintunya bisa kamu buka.",
    choices: [
      {
        text: "Ceritakan tentang benda berkilau di pulau ini.",
        nextText: "Di seluruh pulau tersebar 30 benda koleksi. Jika kamu mengumpulkan minimal 3 saja, lenteramu akan bersinar makin indah!",
        startQuestId: "quest_02",
      },
      {
        text: "Bolehkah aku berkunjung ke dalam rumah warga?",
        nextText: "Tentu! Dekati pintu kayu rumah mana saja lalu tekan E untuk membuka pintunya dan melihat perapian hangat di dalamnya.",
      },
    ],
  },
  {
    id: "npc_bachtiar_sw",
    name: "Saudagar Bachtiar",
    role: "Kepala Pasar Desa Barat Daya",
    biome: "Desa Pesisir Barat Daya",
    position: [-280, 0, 238],
    patrolOffset: [6, 0],
    coatColor: "#0369a1",
    hatColor: "#0284c7",
    greeting: "Selamat datang di Desa Pesisir Barat Daya! Rumah-rumah beratap biru laut di sini terkenal dengan hasil tangkapan ikan segar dan pasarnya yang semarak.",
    choices: [
      {
        text: "Suasana desa pesisir ini sangat hidup dan rapi!",
        nextText: "Warga kami senang berkumpul di pasar setiap hari. Silakan cicipi buah dan roti hangat di kios sebelah!",
      },
    ],
  },
  {
    id: "npc_kirana_west",
    name: "Tabib Hutan Kirana",
    role: "Tetua Desa Hutan Barat",
    biome: "Desa Hutan Barat",
    position: [-245, 0, -95],
    patrolOffset: [6, 0],
    coatColor: "#166534",
    hatColor: "#15803d",
    greeting: "Damai menyertaimu di Desa Hutan Barat. Desa kami dikelilingi pohon-pohon Birch putih dan mengarah langsung menuju Kuil Maple Merah di utara.",
    choices: [
      {
        text: "Bagaimana cara menuju Kuil Maple Merah dari sini?",
        nextText: "Ikuti saja jalan batu ke arah Barat Laut (Z negatif), kamu akan disambut Gerbang Torii merah dan guguran daun maple.",
      },
    ],
  },
  {
    id: "npc_hana",
    name: "Penjaga Kuil Hana",
    role: "Gadis Kuil Maple Merah",
    biome: "Kuil Barat Laut",
    position: [-310, 0, -295],
    patrolOffset: [4, 0],
    coatColor: "#dc2626",
    hatColor: "#1e293b",
    greeting: "Lihatlah daun-daun maple merah yang gugur perlahan ini. Saat malam Bulan Merah tiba, seluruh kuil ini memancarkan cahaya hangat.",
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
    biome: "Alun-Alun Kota Kerajaan",
    position: [0, 0, 390],
    patrolOffset: [0, 6],
    coatColor: "#6d28d9",
    hatColor: "#311042",
    useSorceressModel: true,
    greeting: "Selamat datang di pelataran Kota Kerajaan. Pintu Agung Istana di belakangku sudah terbuka, Raja Aldric dan Ratu Seraphina menantimu di Ruang Singgasana!",
    choices: [
      {
        text: "Bagaimana cara melihat Aurora terbaik?",
        nextText: "Pergilah ke Pegunungan Salju di Utara pada malam hari (pukul 20:00 - 04:00). Pita cahaya hijau dan magenta hanya muncul saat langit malam gelap!",
        startQuestId: "quest_03",
      },
    ],
  },
  {
    id: "npc_damar",
    name: "Penjaga Mercusuar Damar",
    role: "Penjaga Pelabuhan Selatan",
    biome: "Pelabuhan Selatan",
    position: [12, 0, 542],
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
    ],
  },
  {
    id: "npc_bima",
    name: "Pendaki Bima",
    role: "Penjelajah Lembah Salju",
    biome: "Pegunungan Salju",
    position: [-8, 0, -372],
    patrolOffset: [6, 0],
    coatColor: "#0f766e",
    hatColor: "#f8fafc",
    greeting: "Pondok-pondok kayu di Lembah Salju Utara ini berdiri kokoh di atas fondasi batu. Saat malam tiba, lihatlah ke langit utara untuk menyaksikan Aurora!",
    choices: [
      {
        text: "Pemandangan salju dan pohon pinus di sini sangat indah.",
        nextText: "Benar sekali! Apalagi jika kamu menunggangi kuda menyusuri lembah salju ini.",
      },
    ],
  },
];
