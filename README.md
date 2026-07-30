# 🏠 Rent Receipt Manager

A modern, full-stack Rent Receipt Management System built with **React.js** (Vite + Tailwind CSS), **Node.js + Express**, and **MongoDB**.

![Tech Stack](https://img.shields.io/badge/React-18-blue?logo=react) ![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js) ![MongoDB](https://img.shields.io/badge/MongoDB-8-green?logo=mongodb) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss)

---

## ✨ Features

### User Features
- 🔐 **JWT Authentication** — Secure sign up, login, logout with bcrypt password hashing
- 📊 **Analytics Dashboard** — Charts for monthly & yearly rent trends, payment method breakdown
- 📤 **Upload Receipts** — Drag & drop file upload (PDF/JPG/PNG, max 10MB) with progress bar
- 📋 **Receipt History** — Paginated table with search, filter by month/year/method/amount
- 👁️ **Receipt Detail View** — Full file preview (image/PDF viewer) with download
- 📥 **Export** — Export receipt history to Excel or PDF
- ✏️ **Edit & Delete** — Manage receipts with modal editor
- 🌙 **Dark/Light Mode** — Persisted theme with smooth transitions

### Admin Features
- 👑 **Admin Dashboard** — Global statistics and activity charts
- 👥 **User Management** — View all users, receipt counts, activate/deactivate accounts
- 📂 **All Receipts** — Browse and delete any user's receipts

### Design
- 🎨 **Glassmorphism UI** — Modern frosted glass cards and panels
- 📱 **Fully Responsive** — Mobile-first design with collapsible sidebar
- 🎞️ **Animations** — Smooth entrance animations and hover effects
- 🔔 **Toast Notifications** — Success/error feedback via react-hot-toast

---

## 📁 Project Structure

```
rent-receipt-manager/
├── backend/          # Node.js + Express API
│   ├── config/       # MongoDB connection
│   ├── controllers/  # Route controllers
│   ├── middleware/   # JWT auth, file upload, admin guard
│   ├── models/       # Mongoose schemas
│   ├── routes/       # Express routes
│   ├── utils/        # Seed data script
│   ├── uploads/      # Uploaded files (gitignored)
│   └── server.js
│
└── frontend/         # React + Vite + Tailwind
    └── src/
        ├── api/      # Axios instance
        ├── components/  # Reusable components
        ├── context/  # Auth & Theme contexts
        └── pages/    # Route pages
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** v18+ — [Download](https://nodejs.org/)
- **MongoDB** v6+ — [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas)

### 1. Clone / Open Project
```bash
cd rent-receipt-manager
```

### 2. Configure Backend Environment
```bash
cd backend
copy .env .env.local  # Windows
```
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/rent-receipts
JWT_SECRET=your_super_secret_key_at_least_32_chars
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173

# Optional: Email notifications (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=noreply@rentreceipts.com
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 5. Seed Sample Data (Optional but Recommended)
```bash
cd backend
npm run seed
```
This creates sample users and receipts for local development only. Do not run the seed script in production.

### 6. Start Development Servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# API running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

### 7. Open in Browser
Visit [http://localhost:5173](http://localhost:5173)

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| PUT | `/api/auth/change-password` | Private | Change password |

### Receipts
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/receipts` | Private | List user's receipts (search/filter/pagination) |
| POST | `/api/receipts` | Private | Upload new receipt |
| GET | `/api/receipts/:id` | Private | Get single receipt |
| PUT | `/api/receipts/:id` | Private | Edit receipt |
| DELETE | `/api/receipts/:id` | Private | Delete receipt |

### Analytics
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/analytics/dashboard` | Private | Dashboard stats |
| GET | `/api/analytics/yearly` | Private | Yearly totals |
| GET | `/api/analytics/monthly-trend` | Private | Monthly breakdown |
| GET | `/api/analytics/payment-methods` | Private | Method breakdown |

### Admin
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/stats` | Admin | Global statistics |
| GET | `/api/admin/users` | Admin | All users |
| PUT | `/api/admin/users/:id/toggle-status` | Admin | Activate/deactivate |
| GET | `/api/admin/receipts` | Admin | All receipts |
| DELETE | `/api/admin/receipts/:id` | Admin | Delete any receipt |

---

## 🔒 Security
- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens expire in 7 days
- File type validation (MIME + extension)
- 10MB upload size limit
- Users can only access their own receipts
- Admin routes protected by dual middleware

---

## 📦 Key Dependencies

### Backend
| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ORM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT authentication |
| multer | File uploads |
| nodemailer | Email notifications |
| cors | Cross-Origin Resource Sharing |

### Frontend
| Package | Purpose |
|---------|---------|
| react-router-dom v6 | Client-side routing |
| axios | HTTP client |
| recharts | Charts & analytics |
| react-dropzone | Drag & drop uploads |
| react-hot-toast | Toast notifications |
| jsPDF + jspdf-autotable | PDF export |
| xlsx (SheetJS) | Excel export |
| lucide-react | Icons |
| date-fns | Date formatting |

---

## 🏗️ Build for Production

```bash
# Frontend build
cd frontend
npm run build

# Serve frontend from backend (optional)
# Set FRONTEND_URL in .env to your production domain
# Deploy backend to any Node.js hosting (Railway, Render, etc.)
```

---

## 📸 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | JWT authentication |
| Signup | `/signup` | Password strength indicator |
| Dashboard | `/dashboard` | Analytics, charts, recent receipts |
| Upload | `/upload` | Drag-drop upload with progress |
| History | `/history` | Searchable table, Excel/PDF export |
| Receipt Detail | `/receipt/:id` | File viewer + all info |
| Admin Dashboard | `/admin` | Global stats for admins |
| Admin Users | `/admin/users` | User management |
| Admin Receipts | `/admin/receipts` | All receipts across all users |
