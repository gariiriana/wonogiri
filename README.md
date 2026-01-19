# 🏪 Catatan Utang Warung - Debt Management System

Sistem manajemen catatan utang pelanggan untuk warung/toko kecil. Dibangun dengan React, Firebase Authentication, Firestore, dan Firebase Storage.

---

## 🎯 Fitur Utama

### ✅ Authentication
- Login dengan Email/Password (Firebase Auth)
- **Tidak ada fitur register** - akun dibuat manual oleh admin
- Protected routes - harus login untuk akses
- Secure session management

### 📝 Manajemen Utang
- **Tambah utang baru** via modal popup
- **Foto wajib** untuk setiap penghutang (camera atau upload)
- Input: nama, nickname, jumlah, keterangan, foto
- Data real-time sync dengan Firestore

### 📊 Dashboard
- Summary hari ini (total utang & jumlah pelanggan)
- Statistik keseluruhan (total pelanggan, piutang, transaksi)
- Quick access ke semua fitur

### 📋 Daftar Utang
- List semua pelanggan berutang
- Search by nama atau nickname
- Foto, nama, total utang, tanggal terakhir
- Klik untuk detail lengkap

### 👤 Detail Pelanggan
- Info lengkap pelanggan dengan foto
- Statistik (total utang, dibayar, transaksi)
- Riwayat transaksi lengkap
- Tambah utang baru
- Tandai lunas/bayar

### 📈 Rekap Keuangan
- Laporan mingguan & bulanan
- Progress bar tingkat pembayaran
- Rasio keuangan
- Rekomendasi berdasarkan performa

---

## 🛠️ Tech Stack

### Frontend
- **React** 18.3.1
- **TypeScript**
- **Tailwind CSS** v4
- **React Router** v7
- **Lucide React** (icons)

### Backend & Database
- **Firebase Authentication** - Login system
- **Firestore** - NoSQL database
- **Firebase Storage** - Photo storage
- **Real-time listeners** - Live data sync

### Build Tools
- **Vite** - Build tool
- **pnpm** - Package manager

---

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── AddDebtModal.tsx          # Modal tambah utang + foto
│   │   │   ├── Login.tsx                 # Halaman login
│   │   │   ├── ProtectedRoute.tsx        # Route guard
│   │   │   ├── HomePage.tsx              # UI Dashboard
│   │   │   ├── HomePageContainer.tsx     # Dashboard + data logic
│   │   │   ├── DaftarUtang.tsx           # UI Daftar utang
│   │   │   ├── DaftarUtangContainer.tsx  # Daftar + data logic
│   │   │   ├── DetailOrang.tsx           # UI Detail pelanggan
│   │   │   ├── DetailOrangContainer.tsx  # Detail + data logic
│   │   │   ├── Rekap.tsx                 # UI Rekap
│   │   │   └── RekapContainer.tsx        # Rekap + data logic
│   │   └── App.tsx                       # Main app + routing
│   ├── context/
│   │   └── AuthContext.tsx               # Authentication context
│   ├── lib/
│   │   └── firebase.ts                   # Firebase config
│   └── styles/
│       └── theme.css                     # Tailwind theme
├── firestore.rules                       # Firestore security rules
├── storage.rules                         # Storage security rules
├── FIREBASE_SETUP.md                     # Setup guide
├── CARA_PAKAI.md                         # User manual (Indonesian)
├── DEMO_CREDENTIALS.md                   # Demo credentials
├── FIRESTORE_SCHEMA.md                   # Database schema
└── package.json
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Firebase

Ikuti panduan lengkap di file **`FIREBASE_SETUP.md`**

Langkah singkat:
1. Aktifkan Firebase Authentication (Email/Password)
2. Buat Firestore Database
3. Publish Firestore Security Rules
4. Aktifkan Firebase Storage
5. Publish Storage Security Rules
6. Buat user admin manual

### 3. Build & Run

```bash
# Development
pnpm run dev

# Production build
pnpm run build
```

### 4. Login

Gunakan credentials yang dibuat di Firebase Console:
```
Email: admin@warung.com
Password: [password yang dibuat]
```

---

## 📖 Documentation

| File | Deskripsi |
|------|-----------|
| **FIREBASE_SETUP.md** | Panduan setup Firebase lengkap (Authentication, Firestore, Storage) |
| **CARA_PAKAI.md** | Manual penggunaan untuk user/pemilik warung |
| **DEMO_CREDENTIALS.md** | Contoh credentials untuk testing |
| **FIRESTORE_SCHEMA.md** | Schema database & API reference |
| **firestore.rules** | Security rules untuk Firestore |
| **storage.rules** | Security rules untuk Storage |

---

## 🗄️ Database Schema

### Collections

#### `debtors`
```typescript
{
  id: string;              // Auto-generated
  userId: string;          // UID from Auth
  name: string;            // Full name
  nickname: string | null; // Nickname
  photoURL: string;        // Storage URL
  totalDebt: number;       // Current debt
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `transactions`
```typescript
{
  id: string;               // Auto-generated
  userId: string;           // UID from Auth
  debtorId: string;         // Reference to debtor
  debtorName: string;       // Denormalized
  amount: number;           // Amount in IDR
  type: "debt" | "payment"; // Transaction type
  note: string | null;      // Optional note
  createdAt: Timestamp;
}
```

Lihat **FIRESTORE_SCHEMA.md** untuk detail lengkap.

---

## 🔐 Security

### Authentication
- ✅ Email/Password only
- ✅ No public registration
- ✅ Admin creates accounts manually

### Firestore Rules
- ✅ Must be authenticated
- ✅ Can only read/write own data
- ❌ Cannot access other users' data
- ❌ Anonymous users blocked

### Storage Rules
- ✅ Must be authenticated
- ✅ Can only upload to own folder
- ✅ Can read all photos (for sharing)
- ❌ Anonymous users blocked

---

## 🎨 Design System

### Colors
- **Primary**: Orange (#F97316)
- **Background**: Off-white (#FFF9F5)
- **Success**: Green
- **Danger**: Red
- **Info**: Blue

### Typography
- Clean sans-serif fonts
- Large text for readability
- Bold headings
- Clear hierarchy

### Components
- Card-based layout
- Large touch-friendly buttons
- Gradient backgrounds
- Smooth transitions
- Responsive design

---

## 📱 Responsive Design

Website fully responsive untuk:
- 📱 **Mobile** (320px+)
- 📱 **Tablet** (768px+)
- 💻 **Desktop** (1024px+)

Optimized untuk touch dan click interactions.

---

## 🧪 Testing

### Manual Testing Checklist

Authentication:
- [ ] Login dengan credentials valid
- [ ] Login dengan credentials invalid
- [ ] Logout
- [ ] Protected routes redirect ke login

CRUD Operations:
- [ ] Tambah utang baru (camera)
- [ ] Tambah utang baru (upload)
- [ ] Lihat daftar utang
- [ ] Search pelanggan
- [ ] Lihat detail pelanggan
- [ ] Tambah utang di detail
- [ ] Bayar/lunas utang
- [ ] Lihat rekap mingguan
- [ ] Lihat rekap bulanan

Data Persistence:
- [ ] Data tersimpan di Firestore
- [ ] Foto tersimpan di Storage
- [ ] Real-time update berfungsi
- [ ] Refresh page data tetap ada

---

## 🚨 Troubleshooting

### Build Errors

**Error: Firebase not initialized**
```bash
# Pastikan firebase config sudah benar di src/lib/firebase.ts
```

**Error: Module not found**
```bash
# Clear cache dan reinstall
rm -rf node_modules
pnpm install
```

### Runtime Errors

**Error: Permission denied (Firestore)**
- Cek apakah security rules sudah dipublish
- Cek apakah user sudah login
- Cek console untuk error detail

**Error: Permission denied (Storage)**
- Cek apakah storage rules sudah dipublish
- Cek apakah user sudah login
- Cek ukuran file (max 5MB)

**Error: Can't access camera**
- Izinkan browser akses kamera
- Gunakan HTTPS (camera requires secure context)
- Coba opsi upload foto

---

## 📊 Firebase Quota (Free Tier)

### Firestore
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ 20,000 deletes/day
- ✅ 1GB storage

### Storage
- ✅ 5GB storage
- ✅ 1GB upload/day
- ✅ 10GB download/day

### Authentication
- ✅ Unlimited users (Email/Password)

**Cukup untuk warung kecil-menengah!** 🎉

---

## 🔄 Data Flow

```
User Login
  ↓
Firebase Auth
  ↓
AuthContext (React)
  ↓
Protected Routes
  ↓
Components (UI)
  ↓
Firestore (Database)
  ↓
Real-time Updates
  ↓
UI Re-render
```

---

## 🌟 Best Practices

### Code
- ✅ TypeScript untuk type safety
- ✅ Separation of concerns (UI vs Logic)
- ✅ Reusable components
- ✅ Real-time listeners untuk live data

### Security
- ✅ Strong security rules
- ✅ Data isolation per user
- ✅ Protected routes
- ✅ Input validation

### Performance
- ✅ Denormalized data untuk speed
- ✅ Composite indexes
- ✅ Real-time listeners (no polling)
- ✅ Lazy loading components

---

## 🎯 Roadmap (Future Features)

Possible enhancements:
- [ ] Export data ke Excel/PDF
- [ ] Print receipt/nota
- [ ] Reminder otomatis via WhatsApp
- [ ] Multi-user dengan roles
- [ ] Analytics dashboard
- [ ] Backup/restore data
- [ ] Dark mode
- [ ] PWA (Progressive Web App)
- [ ] Offline mode

---

## 👥 User Personas

### Pemilik Warung
- Usia: 40-60 tahun
- Tech-savvy: Medium-Low
- Butuh: UI simple, text besar, jelas

### Kasir
- Usia: 25-45 tahun
- Tech-savvy: Medium
- Butuh: Cepat catat transaksi

---

## 📝 License

This project is private and proprietary.

---

## 🤝 Support

Untuk bantuan:
1. Baca dokumentasi di folder ini
2. Cek Firebase Console untuk error logs
3. Contact developer/admin

---

## 🎉 Credits

Built with:
- React + TypeScript
- Firebase (Google)
- Tailwind CSS
- Lucide Icons

---

**Happy Managing! 🚀**
- [React Docs](https://react.dev)
- [Tailwind Docs](https://tailwindcss.com)
