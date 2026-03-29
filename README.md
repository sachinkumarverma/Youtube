# 📺 ViewTube — The Ultimate YouTube Clone

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.io/)

A high-performance, full-stack video sharing platform built with modern web technologies. ViewTube offers a seamless user experience, a robust admin ecosystem, and a premium design language.

---

## ✨ Key Features

### 🎬 Professional Video Experience
- **Dynamic Video Player**: Custom-built player with keyboard shortcuts and playback controls.
- **Smart Sidebar Toggle**: Hide or show related videos to focus on the content. The player dynamically adjusts its width for an immersive experience.
- **AI-Powered Summaries**: Integrated AI to provide brief overviews of video content instantly.
- **Interactive Engagement**: Like, subscribe, and share with real-time optimistic updates.

### 🔐 Authentication & Security
- **JWT Authentication**: Secure token-based auth with 7-day expiry.
- **Google OAuth**: One-click sign-in via Supabase OAuth integration.
- **Forgot Password with OTP**: Email-based password reset using a 6-digit OTP (10 min expiry) sent via Gmail SMTP.
- **Admin Forgot Password**: Same OTP-based password recovery available in the Admin Portal.

### 🛡️ Robust Admin Ecosystem
- **Centralized Dashboard**: Manage videos, users, comments, and reports from a dedicated Admin Portal.
- **Full Audit Logging**: Every critical action is recorded with filterable, collapsible log viewer.
- **Content Moderation**: Streamlined reporting and video/comment removal workflows.
- **Comment Moderation**: View, manage, and delete user comments across all videos.

### 🎨 Modern UI & UX
- **Glassmorphism Design**: Sleek, modern interface using custom CSS tokens and high-quality animations.
- **Premium Toast Notifications**: Custom notification system for consistent user feedback.
- **Internationalization**: Full support for multiple languages and RTL/LTR layouts.
- **Responsive Layouts**: Optimized for Desktop, Tablet, and Mobile devices.

---

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, React Router 7, Lucide Icons
- **Backend**: Node.js, Express.js, JWT Authentication, Nodemailer
- **Database**: PostgreSQL (Prisma-ready structure)
- **Storage**: Supabase Storage for blazingly fast video and thumbnail delivery
- **Email**: Gmail SMTP via Nodemailer (OTP-based password reset)
- **Styling**: Vanilla CSS with a custom Design System

---

## 📦 Project Structure

```text
├── frontend/         # Main user application (React + Vite)
├── admin/            # Administrative portal (React + Vite)
├── backend/          # Express API & PostgreSQL database logic
└── shared/           # (Optional) shared constants and types
```

---

## 🛠️ Getting Started

### 1. Environment Configuration
Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL="your-postgresql-connection-string"
JWT_SECRET="your-secure-jwt-secret"
SUPABASE_URL="your-supabase-project-url"
SUPABASE_ANON_KEY="your-supabase-public-anon-key"
PORT=5000
ADMIN_SECRET="[ENCRYPTION_KEY]"

# SMTP (for Forgot Password OTP emails)
SMTP_EMAIL="your-gmail@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
```

> **Note**: `SMTP_PASSWORD` requires a Gmail **App Password**, not your regular password. Enable 2-Step Verification on your Google account, then generate an App Password at *Google Account > Security > App Passwords*.

### 2. Database Initialization
```bash
cd backend
npm install
node migrate.js
```

### 3. Launching the Platform

**API Server**
```bash
cd backend
npm run dev
```

**Main Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Admin Dashboard**
```bash
cd admin
npm install
npm run dev
```

---

## 🔗 Live Production Links

- **Main Frontend App**: [https://viewtube-app.vercel.app](https://viewtube-app.vercel.app) (Vercel)
- **Admin Management Portal**: [https://viewtube-admin.vercel.app](https://viewtube-admin.vercel.app) (Vercel)
- **Scalable Backend API**: [https://youtube-vi8f.onrender.com](https://youtube-vi8f.onrender.com) (Render)

---

## 🔗 Local Access (Development)

- **Main App**: [http://localhost:5173](http://localhost:5173)
- **Admin Portal**: [http://localhost:5174](http://localhost:5174)
- **API Server**: [http://localhost:5000](http://localhost:5000)

---

## 🔑 Default Admin Access
To register as an admin for the first time, ask for the secret key from the admin

---

Built with ❤️ by the ViewTube Team.
