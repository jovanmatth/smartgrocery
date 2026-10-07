# Panduan Antigravity Assistant untuk Smart Grocery

## Aturan Khusus Repositori:
1. **Auto Git Push**: Setiap kali selesai melakukan perubahan atau penambahan berkas atas permintaan pengguna, otomatis lakukan:
   - `git add .`
   - `git commit -m "<deskripsi perubahan singkat>"`
   - `git push origin main`
   Secara langsung pada sesi tersebut tanpa perlu menunggu instruksi manual atau konfirmasi dari pengguna, sehingga sinkronisasi Vercel langsung terpicu otomatis.
2. **Mobile-First PWA Guidelines**:
   - Pertahankan tampilan web responsif full-screen / edge-to-edge (dengan konten touch-friendly yang terpusat rapi dan nyaman dibaca di desktop maupun layar ponsel).
   - Selalu pertahankan Bottom Navigation Bar melayang di bagian bawah layar.
   - Hindari layout tabel desktop lebar, gunakan komponen mobile cards touch-friendly.
   - Pastikan PWA (`manifest.json` dan `sw.js`) tetap sinkron dan valid.
