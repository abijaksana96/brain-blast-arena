# Dokumentasi Brain Blast Arena

## Ringkasan
Brain Blast Arena adalah aplikasi permainan kuis interaktif yang dirancang untuk kompetisi berbasis tim. Aplikasi ini memiliki alur permainan yang dinamis dengan pertanyaan berwaktu, mekanisme "buzzing" (menekan tombol) untuk tim, dan pelacakan skor secara real-time.

## Fitur Utama
- **Manajemen Tim**: Pengaturan awal untuk mendaftarkan tim dan skor awal mereka.
- **Fase Permainan**: Alur permainan terstruktur yang mencakup:
  - **Setup**: Konfigurasi tim.
  - **Intro**: Pengenalan ronde.
  - **Question Display**: Penampilan pertanyaan dengan timer utama.
  - **Team Answering**: Fase menjawab bagi tim yang menekan tombol tercepat.
  - **Feedback**: Umpan balik visual untuk jawaban benar/salah.
  - **Round Over**: Ringkasan akhir permainan.
- **Sistem Timer**:
  - **Timer Pertanyaan**: 3 menit (180 detik) untuk kesempatan menekan tombol.
  - **Timer Jawaban**: 5 detik untuk menjawab setelah menekan tombol.
- **Sistem Skor**: Poin diberikan berdasarkan tingkat kesulitan pertanyaan (Mudah/Sulit).
- **Papan Peringkat (Leaderboard)**: Menampilkan skor tim secara real-time.

## Teknologi yang Digunakan
- **Frontend Framework**: React 19
- **Bahasa Pemrograman**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React

## Struktur Proyek
Berikut adalah struktur file utama dalam proyek ini:

```
brain-blast-arena/
├── components/          # Komponen UI React yang dapat digunakan kembali
│   ├── Button.tsx       # Komponen tombol standar
│   ├── Leaderboard.tsx  # Komponen tampilan skor tim
│   └── Timer.tsx        # Komponen tampilan waktu
├── App.tsx              # Komponen utama yang mengatur logika game dan state
├── constants.ts         # Konstanta aplikasi (pertanyaan, durasi waktu, dll)
├── types.ts             # Definisi tipe TypeScript (Interface & Enum)
├── index.html           # Entry point HTML (memuat Tailwind CSS)
└── package.json         # Dependensi dan skrip proyek
```

## Alur Permainan (Game Flow)
1. **Inisialisasi**: Aplikasi dimulai di fase `SETUP`. Pengguna memasukkan nama tim dan skor awal.
2. **Mulai Ronde**: Setelah setup, masuk ke fase `INTRO` dan kemudian `QUESTION_DISPLAY`.
3. **Pertanyaan**:
   - Pertanyaan ditampilkan dengan timer 3 menit.
   - Tim berlomba menekan tombol "Buzz".
4. **Menjawab**:
   - Tim yang menekan tombol pertama masuk ke fase `TEAM_ANSWERING`.
   - Timer 5 detik berjalan.
   - Operator (Host) menandai jawaban sebagai Benar atau Salah.
5. **Penilaian**:
   - **Benar**: Tim mendapat poin, lanjut ke pertanyaan berikutnya.
   - **Salah/Timeout**: Tim tidak mendapat poin (atau pengurangan jika dikonfigurasi), permainan kembali ke fase `QUESTION_DISPLAY` untuk tim lain (jika logika mengizinkan) atau lanjut ke pertanyaan berikutnya.
6. **Selesai**: Setelah semua pertanyaan selesai, masuk ke fase `ROUND_OVER`.

## Cara Menjalankan Aplikasi

### Prasyarat
- Node.js terinstal di komputer Anda.

### Langkah-langkah
1. **Instal Dependensi**:
   ```bash
   npm install
   ```

2. **Jalankan Mode Pengembangan**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173` (atau port lain yang tersedia).

3. **Build untuk Produksi**:
   ```bash
   npm run build
   ```

## Konfigurasi
- **Pertanyaan**: Daftar pertanyaan dapat diubah di file `constants.ts`.
- **Durasi Waktu**: Durasi timer dapat disesuaikan di `constants.ts` (`QUESTION_DURATION`, `ANSWER_DURATION`).
