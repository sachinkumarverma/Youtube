# Full-Stack YouTube Clone

This is a modern, full-stack YouTube clone built with React (Vite), Node.js, Express, and PostgreSQL (via Prisma and Supabase).

## Tech Stack
* **Frontend:** React (Vite), React Router, Lucide React, vanilla CSS (Dark Mode/Glassmorphism)
* **Backend:** Node.js, Express, JWT Authentication, bcryptjs
* **Database:** PostgreSQL (Supabase), Prisma ORM

---

## 🚀 How to Run Locally

If you are cloning this project onto a new computer, follow these exact steps to get everything running without errors:

### 1. Clone the Repository
```bash
git clone https://github.com/sachinkumarverma/Youtube.git
cd Youtube
```

### 2. Backend Setup
The backend requires setting up environment variables to connect to your database.
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. **Environment Setup:** Create a new file named `.env` inside the `backend` folder. Add the following variables (make sure to replace the bracketed values with your actual Supabase database connection strings):
   ```env
   # Connect to Supabase via connection pooling with Supavisor. (Transaction mode)
   DATABASE_URL="postgres://[db-user]:[db-password]@[your-supabase-url]:5432/postgres"

   # Direct connection to the database. Used for migrations.
   DIRECT_URL="postgres://[db-user]:[db-password]@[your-supabase-url]:5432/postgres"
   
   PORT=5000
   JWT_SECRET="your_secure_random_string_here"
   ```
4. Generate the Prisma database client:
   ```bash
   npx prisma generate
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
*(The backend should now be running on `http://localhost:5000`)*

### 3. Frontend Setup
1. Open a **new separate terminal** and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
*(The UI should now be available in your browser at `http://localhost:5173`)*

---

### Features Developed
* Modular Express API setup for users, videos, comments, and likes.
* JWT secured authentication middleware.
* Prisma PostgreSQL strict-typed schema.
* Modern frontend design utilizing complex grid systems and polished hover state animations.
