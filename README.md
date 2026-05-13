# Sistem Informasi Notaris & Monitoring Berkas Digital

Sistem manajemen kantor notaris modern yang dirancang untuk efisiensi, transparansi, dan keamanan data.

## Fitur Utama

- **Dashboard Modern**: Visualisasi data realtime menggunakan Recharts.
- **Monitoring Berkas**: Pelacakan progress pekerjaan dari masuk hingga selesai.
- **Client Tracking**: Sistem pelacakan publik menggunakan QR Code/Kode Tracking.
- **Manajemen Keuangan**: Monitoring invoice, pembayaran, dan cashflow kantor.
- **AI Analytics**: Analisa otomatis performa kantor menggunakan AI assistant.
- **Digital Archive**: Penyimpanan dokumen digital yang terintegrasi.
- **Security**: Autentikasi JWT, Role-based Access Control (RBAC), dan Audit Log.
- **Multi-platform**: Responsif untuk desktop dan mobile.

## Teknologi

- **Frontend**: Next.js 14, Tailwind CSS, Shadcn UI, Framer Motion.
- **Backend**: Next.js API Routes & Server Actions.
- **Database**: MySQL dengan Prisma ORM.
- **Auth**: NextAuth.js.
- **Reports**: jsPDF untuk generator invoice/kwitansi.

## Cara Instalasi

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Konfigurasi Database**
   Update file `.env` dengan kredensial database MySQL Anda:
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/notaris"
   ```

3. **Migrasi Database**
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Jalankan Aplikasi**
   ```bash
   npm run dev
   ```

## Akun Demo

- **Username**: `superadmin`
- **Password**: `admin123`

## Struktur Folder

- `src/app`: Routing and Pages (Next.js App Router)
- `src/components`: UI Components (Shadcn + Custom)
- `src/lib`: Utilities (Prisma, Auth, PDF, Audit)
- `prisma`: Database Schema & Seeds
- `scripts`: Maintenance scripts (Backup, etc)

## Docker Support

Untuk menjalankan menggunakan Docker:
```bash
docker-compose up --build
```

---
Dikembangkan secara profesional untuk kebutuhan Kantor Notaris & PPAT.
