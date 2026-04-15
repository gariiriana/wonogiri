# 🏪 Wonogiri - Smart Debt Management System

![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)
![Django](https://img.shields.io/badge/Django-6.0-092E20?style=flat&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

**Wonogiri** adalah sistem manajemen catatan piutang (utang pelanggan) yang dirancang khusus untuk pemilik warung, toko kelontong, atau bisnis kecil. Aplikasi ini memodernisasi cara pencatatan utang yang dulunya manual *(buku hutang)* menjadi sistem digital yang **aman, rapi, dan transparan**.

---

## ✨ Fitur Unggulan

| Fitur | Deskripsi |
| --- | --- |
| 👥 **Manajemen Pelanggan** | Simpan data pelanggan lengkap dengan foto profil untuk verifikasi visual |
| 💳 **Pencatatan Transaksi Ganda** | Catat penambahan utang & pembayaran dalam satu dashboard terpadu |
| 📊 **Statistik Real-time** | Pantau total piutang aktif dan jumlah pelanggan secara langsung |
| 🔒 **Autentikasi Aman** | Sistem login terpusat untuk melindungi privasi data keuangan |
| 🤖 **Predictive Modeling** | Analisis prediktif berbasis data historis transaksi pelanggan |
| 🧠 **Behavioral Analysis** | Deteksi pola pembayaran dan perilaku keuangan pelanggan |
| 💰 **Cashflow Optimizer** | Optimasi arus kas dan rekomendasi prioritas penagihan |
| 🏥 **System Health Monitor** | Pemantauan kesehatan sistem secara otomatis dan real-time |
| 📋 **Reporting Engine** | Laporan keuangan terstruktur dan ekspor data yang komprehensif |
| 🗄️ **Data Migration Service** | Layanan migrasi dan pemeliharaan integritas data enterprise |

---

## 🚀 Technology Stack

### 🐍 Backend

- **Django 6.0.4** — High-level Python web framework dengan arsitektur MTV yang matang
- **Python 3.12** — Bahasa pemrograman utama untuk seluruh logika bisnis
- **Gunicorn 25.3** — Production-grade WSGI server untuk deployment yang stabil
- **WhiteNoise 6.12** — Static file serving yang efisien untuk lingkungan produksi

### 💾 Database

- **PostgreSQL** *(Production)* — Relational database enterprise via `psycopg` untuk cloud deployment
- **SQLite 3** *(Development)* — Database lokal ringan untuk lingkungan pengembangan
- **dj-database-url** — Konfigurasi database URL-based yang fleksibel

### 🎨 Frontend & UI

- **Django Templates (MTV)** — Server-side rendering untuk penyajian data yang cepat
- **Tailwind CSS v3** — Utility-first CSS framework untuk UI yang modern dan responsif
- **Lucide Icons** — Set ikon SVG yang konsisten dan cantik
- **Pillow 12.2** — Pemrosesan gambar untuk manajemen foto pelanggan

### ☁️ Deployment & DevOps

- **Vercel** — Platform deployment serverless dengan CDN global
- **python-dotenv** — Manajemen environment variables yang aman
- **build.sh** — Automated build script untuk proses deployment

---

## 🧠 Arsitektur Enterprise

Wonogiri dirancang dengan arsitektur **Server-Side Enterprise** yang modular dan scalable:

```text
wonogiri/
├── wonogiri_project/           # ⚙️  Konfigurasi Inti (Settings & Root Routing)
│   ├── settings.py             #     Konfigurasi global & environment
│   ├── urls.py                 #     Root URL dispatcher
│   └── wsgi.py                 #     WSGI application entry point
│
├── debt_management/            # 🏛️  Domain Utama Bisnis
│   ├── models.py               #     Data models & ORM schema
│   ├── views.py                #     Request handlers & business logic
│   ├── signals.py              #     Django signals & event hooks
│   └── logic/                  # 🧩  Modular Business Logic Layer
│       ├── predictive_modeling.py      # Analisis prediktif transaksi
│       ├── behavioral_analysis.py      # Analisis perilaku pelanggan
│       ├── cashflow_optimizer.py       # Optimasi arus kas
│       ├── finance_engine.py           # Mesin kalkulasi keuangan
│       ├── reporting_engine.py         # Generator laporan keuangan
│       ├── enterprise_logger.py        # Sistem logging enterprise
│       ├── system_health.py            # Monitor kesehatan sistem
│       ├── data_migration_service.py   # Layanan migrasi data
│       ├── metadata_manager.py         # Manajemen metadata
│       └── global_exception_handler.py # Penanganan error terpusat
│
├── templates/                  # 🎨  UI Layer (HTML & Layouts)
├── static/                     # 📦  Static Assets & Design Utilities
├── media/                      # 🖼️  Penyimpanan Foto Pelanggan
├── manage.py                   # 🖥️  Django Management CLI
└── requirements.txt            # 📋  Daftar Dependensi Python
```

---

## 🛠️ Cara Menjalankan Secara Lokal

### Prasyarat

- Python 3.12+
- pip (Python Package Manager)

### Langkah Instalasi

**1. Clone repository:**

```bash
git clone https://github.com/GariIriana/wonogiri.git
cd wonogiri
```

**2. Buat & aktifkan virtual environment:**

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**3. Install semua dependensi:**

```bash
pip install -r requirements.txt
```

**4. Konfigurasi environment variables:**

```bash
# Buat file .env dan isi variabel berikut:
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
```

**5. Jalankan migrasi database:**

```bash
python manage.py migrate
```

**6. Buat akun superuser:**

```bash
python manage.py createsuperuser
```

**7. Jalankan development server:**

```bash
python manage.py runserver
```

Akses aplikasi di **`http://127.0.0.1:8000`** 🎉

---

## 🌐 Deployment (Vercel)

Proyek ini dikonfigurasi untuk deployment otomatis ke **Vercel**:

```bash
# Script build yang digunakan Vercel:
bash build.sh
```

Pastikan variabel berikut sudah dikonfigurasi di Vercel Environment Variables:

- `SECRET_KEY` — Django secret key
- `DATABASE_URL` — PostgreSQL connection string
- `DEBUG` — Set ke `False` untuk produksi

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License** — bebas digunakan dan dimodifikasi untuk keperluan apapun.

---

**Built with ❤️ for the local business community**

*Digitizing warung, one transaction at a time. 🏪*
