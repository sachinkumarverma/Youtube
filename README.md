# YouTube Clone Stack

A professional YouTube clone featuring a separate Admin Portal, secure authentication, video management, and audit logging.

## Requirements
- Node.js 18+
- PostgreSQL (Supabase recommended)
- Supabase project for Video/Thumbnail storage

## Quick Start

### 1. Environment Setup
Create a `.env` in the `backend/` directory with:
```env
DATABASE_URL="your-postgresql-url"
JWT_SECRET="your-jwt-secret"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
PORT=5000
ADMIN_SECRET="viewtube-admin-2024"
```

### 2. Database Migration
```bash
cd backend
npm install
node migrate.js
```

### 3. Run Applications
Open three terminal windows:

**Backend (API)**
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

**Admin Portal**
```bash
cd admin
npm install
npm run dev
```

## Default Access
- **Main App**: `http://localhost:5173`
- **Admin Portal**: `http://localhost:5174`
- **Admin Secret Key**: `viewtube-admin-2024` (Use for first-time admin registration)
