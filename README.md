# 🏪 Wonogiri - Smart Debt Management System

**Wonogiri** adalah sistem manajemen catatan piutang (utang pelanggan) yang dirancang khusus untuk pemilik warung, toko kelontong, atau bisnis kecil. Aplikasi ini memodernisasi cara pencatatan utang yang dulunya manual (buku hutang) menjadi sistem digital yang aman, rapi, dan transparan.

---

## 🚀 Core Technology Stack

Proyek ini telah melalui transformasi arsitektur dari *Client-Side Architecture* ke *Server-Side Architecture* yang jauh lebih stabil dan mudah dimaintain.

### 🐍 Backend (The Engine)

- **Django 6.0+**: Framework Python tingkat tinggi yang mengutamakan keamanan dan kecepatan pengembangan.
- **Python 3.12**: Bahasa pemrograman yang sangat kuat untuk pengolahan data dan logika bisnis.
- **Django ORM**: Memastikan integritas data transaksi dan pelanggan tetap terjaga.

### 💾 Database (The Storage)

- **SQLite 3**: Database relasional yang ringan dan efisien untuk penyimpanan lokal data piutang.

### 🎨 Frontend & UI (The Face)

- **Django Templates (MTV)**: Sistem engine template yang dinamis untuk penyajian data dari server.
- **Tailwind CSS**: Framework CSS revolusioner untuk interface yang modern, bersih, dan responsif (Mobile Friendly).
- **Lucide Icons**: Set ikon yang cantik dan konsisten untuk navigasi yang lebih intuitif.

---

## 🎯 Fitur Unggulan

- **Manajemen Pelanggan**: Simpan data pelanggan lengkap dengan foto untuk verifikasi yang lebih akurat.
- **Pencatatan Transaksi Ganda**: Catat penambahan utang maupun pembayaran dengan mudah dalam satu dashboard.
- **Statistik Dashboard**: Pantau total piutang yang beredar dan jumlah pelanggan aktif secara real-time.
- **Autentikasi Aman**: Sistem login terpusat untuk menjaga privasi data keuangan warung.

---

## 📁 Struktur Arsitektur

```bash
 wonogiri/
 ├── wonogiri_project/   # Jantung Konfigurasi (Settings & Root Routing)
 ├── debt_management/    # Logika Sistem (Models, Logic, & Business Views)
 ├── templates/          # Unified UI Layer (HTML & Responsive Layouts)
 ├── static/             # Assets & Design Utilities
 ├── media/              # Penyimpanan Identitas Visual (Foto Pelanggan)
 ├── manage.py           # Command Line Interface Utama
 └── db.sqlite3          # Database Management System
```

---

## 🛠️ Cara Menjalankan Project

1. **Install Python & Django**:

   ```bash
   pip install django pillow
   ```

2. **Jalankan Aplikasi**:

   ```bash
   python manage.py runserver
   ```

3. **Login Akses**:

   Gunakan akun admin yang telah dikonfigurasi sebelumnya untuk akses penuh ke dashboard.

---

### Built with pride for the local business community. 🚀
