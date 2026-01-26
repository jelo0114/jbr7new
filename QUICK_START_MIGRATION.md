# Quick Start: MySQL to Supabase + Vercel Migration

## 🚀 5-Minute Quick Start

### Step 1: Create Supabase Project (2 min)
1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create new project → Name: `jbr7-bags`
3. Save your database password!

### Step 2: Run SQL Schema (1 min)
1. In Supabase dashboard → **SQL Editor**
2. Open `SQL/postgresql_schema.sql`
3. Copy entire file → Paste in SQL Editor
4. Click **Run**

### Step 3: Get Connection String (1 min)
1. In Supabase dashboard, click **Settings** (gear icon) in the left sidebar
2. Click **Database** in the settings menu
3. Scroll down to **Connection string** section
4. Click the dropdown and select **URI**
5. You'll see a connection string like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. Click the **Copy** button next to the URI connection string
7. **Important:** Replace `[YOUR-PASSWORD]` with your actual database password
8. Also note these values separately (you'll need them):
   - **Host**: `db.xxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (the password you created when setting up the project)

### Step 4: Update PHP Files (1 min)
1. Replace all MySQL connections with:
   ```php
   require_once __DIR__ . '/../config/database.php';
   ```
2. The `config/database.php` file is already created!

### Step 5: Deploy to Vercel (2 min)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Add environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
5. Deploy!

## ✅ Done! Your app is live!

Every push to GitHub main branch = Auto-deploy to Vercel!

---

**Full detailed guide:** See `MIGRATION_TO_SUPABASE_VERCEL.md`
