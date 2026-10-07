# Panduan Antigravity Assistant untuk Smart Grocery

## Aturan Khusus Repositori:
1. **Auto Git Push**: Setiap kali selesai melakukan perubahan atau penambahan berkas atas permintaan pengguna, otomatis lakukan:
   - `git add .`
   - `git commit -m "<deskripsi perubahan singkat>"`
   - `git push origin main`
   Secara langsung pada sesi tersebut tanpa perlu menunggu instruksi manual atau konfirmasi dari pengguna, sehingga sinkronisasi Vercel langsung terpicu otomatis.
2. **Mobile-First PWA Guidelines**:
   - Selalu pertahankan tampilan khusus mobile maksimal 430px (centered di browser desktop).
   - Selalu pertahankan Bottom Navigation Bar melayang di bagian bawah layar.
   - Hindari layout tabel desktop lebar, gunakan komponen mobile cards touch-friendly.
   - Pastikan PWA (`manifest.json` dan `sw.js`) tetap sinkron dan valid.
