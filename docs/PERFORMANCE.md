# Laporan Audit Performa - Wayfarer Realm v1.0

## Optimasi yang Diterapkan (Milestone M0 - M8)
1. **GPU Instancing (`THREE.InstancedMesh`)**: Seluruh 9.500 bilah rumput, ratusan pohon (Oak, Pinus, Pinus Salju, Maple Merah, Palem), bunga liar, daun gugur, kunang-kunang, hujan, salju, burung, kupu-kupu, dan ikan dirender menggunakan instancing sehingga draw call tetap di bawah 120.
2. **Chunk Streaming & Geometry Disposal**: Terrain dibagi ke dalam chunk 100m x 100m dan otomatis memanggil `geometry.dispose()` saat di luar radius pandang pemain.
3. **Dynamic PointLight Pool**: Maksimal 8 `PointLight` aktif secara bersamaan untuk seluruh lentera kuil, lampu desa, dan obor kerajaan.
4. **Zero Frame Allocations**: Tidak ada pembuatan `new THREE.Vector3()` atau `setState` React di dalam loop `useFrame`. Komunikasi ke HUD di-throttle 4-5 kali per detik.
5. **Texel-Snapped Shadow Camera**: Kamera bayangan mengikuti pemain dengan pembulatan texel untuk mencegah efek bayangan bergetar.
