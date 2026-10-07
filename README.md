# Smart Grocery App (Asisten Belanja Hemat Anak Kos) 🛒💡

Aplikasi web interaktif **Smart Grocery App** dirancang khusus untuk memecahkan 3 masalah utama **Rian (anak kos)**:
1. **Total tagihan membengkak saat di kasir** akibat salah hitung manual.
2. **Terkecoh promo diskon bertingkat** (seperti *"Diskon 50% + 20%"*) vs potongan langsung.
3. **Struk kertas thermal lama cepat pudar** sehingga kesulitan membandingkan harga saat berdiri di depan rak supermarket.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini dibangun menggunakan teknologi web murni (**HTML5, CSS3 kustom, Vanilla JavaScript**) tanpa dependensi eksternal yang rumit, sehingga sangat ringan dan cepat.

### Opsi 1: Menjalankan Server Lokal (Node.js)
Server lokal saat ini sudah aktif di:
👉 **[http://localhost:3000/](http://localhost:3000/)**

Jika ingin menjalankan ulang secara manual dari terminal:
```bash
node server.js
```
Lalu buka peramban (browser) di `http://localhost:3000/`.

### Opsi 2: Buka Langsung Berkas HTML
Cukup klik ganda (double click) berkas `index.html` pada File Explorer untuk membukanya langsung di browser favorit Anda (Google Chrome, Microsoft Edge, Firefox, Safari).

---

## 🎯 Pemetaan Fitur & Spesifikasi Kebutuhan Sistem (SRS)

| Kode SRS | Fitur | Implementasi & Logika Matematis |
| :--- | :--- | :--- |
| **F-01** | **Pencatatan Item Belanja Lengkap** | Mencatat Nama Barang, Kategori (Sembako, Makanan/Minuman, Mandi/Cuci, Bumbu, dll.), Satuan (`kg`, `liter`, `pcs`, `pack`, `botol`, dll.), Kuantitas (Qty), Harga Satuan Saat Ini, dan Harga Bulan Lalu. |
| **F-02** | **Perhitungan Kuantitas Otomatis** | Real-time calculation tanpa tombol manual. Perubahan Qty atau harga langsung memperbarui `Qty × Harga Akhir` dan total akumulasi keranjang secara instan. |
| **F-03** | **Kalkulator Diskon Bertingkat & Promo** | Mengakomodasi diskon tunggal (`25%`) maupun diskon bertumpuk (`50% + 20%`). Rumus: $P_A = P_0 \times (1 - A/100)$, $P_{Akhir} = P_A \times (1 - B/100)$. Edukasi Rian bahwa diskon $50\% + 20\%$ setara dengan **60%**, bukan 70%! Dilengkapi modal *"Cek Promo"* mandiri. |
| **F-04** | **Komparator Harga Realtime vs Bulan Lalu** | Indikator visual komparasi:<br>🔴 **Panah Merah Naik (↑)**: Jika harga saat ini > bulan lalu (+Rp & +%)<br>🟢 **Panah Hijau Turun (↓)**: Jika harga saat ini < bulan lalu (-Rp & -%)<br>🟡 **Tanda Setara (=)**: Jika harga stabil sama dengan bulan lalu<br>⚪ **Item Baru**: Jika belum ada data historis. |
| **F-05** | **Pengendali Anggaran (Budget Safety Cap)** | Input batas dompet Rian (misal Rp 500.000). Akumulasi belanjaan realtime dengan progress bar:<br>• **Aman (Hijau)**: < 75% budget<br>• **Waspada (Kuning)**: 75% - 99% budget<br>• **Bahaya / Jebol (Merah berkedip)**: ≥ 100% budget dengan banner peringatan darurat. |
| **F-06** | **Riwayat & Database Belanja** | Tersimpan di `LocalStorage`. Setiap kali transaksi diselesaikan, data harga dicatat ke **Master Memory**. Saat Rian mengetik nama barang di sesi berikutnya, *Harga Bulan Lalu* otomatis terisi! Dilengkapi **Struk Digital Thermal Anti Pudar** (bisa dicetak ke printer thermal / PDF atau diunduh sebagai teks). |

---

## 📱 Desain & Pengalaman Pengguna (UX/UI)
- **Trolley & Mobile-Friendly**: Desain responsif dengan *Sticky Mobile Bottom Bar* yang memudahkan Rian melihat sisa saldo dompet dengan satu ibu jari saat mendorong troli di lorong supermarket.
- **Tombol "Demo Rian"**: Sekali klik langsung memuat keranjang contoh realistis anak kos (Beras 5kg dengan kenaikan harga, Telur 1kg dengan penurunan harga, Minyak Goreng stabil, Mie Instan promo bertingkat 50%+20%).
- **Mode Gelap / Terang (Dark/Light Mode)**: Tersedia tombol toggle di pojok kanan atas.
- **Cadangan Data (Backup & Restore)**: Mendukung ekspor dan impor berkas JSON untuk menjaga data belanjaan antar-perangkat.
