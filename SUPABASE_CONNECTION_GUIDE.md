# How to Get Supabase Connection String (Step-by-Step with Screenshots)

## 📍 Exact Location in Supabase Dashboard

### Step-by-Step Instructions:

1. **Log in to Supabase**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Sign in with your account

2. **Select Your Project**
   - Click on your project name (e.g., "jbr7-bags")
   - You'll see the project dashboard

3. **Navigate to Settings**
   - Look at the **left sidebar**
   - Find and click the **⚙️ Settings** icon (gear icon)
   - It's usually at the bottom of the sidebar

4. **Go to Database Settings**
   - In the Settings menu, click **"Database"**
   - This will open the Database settings page

5. **Find Connection String Section**
   - Scroll down the Database settings page
   - Look for a section titled **"Connection string"** or **"Connection info"**
   - You'll see different connection string formats

6. **Select URI Format**
   - There's a dropdown/selector showing different formats:
     - **URI** ← Select this one!
     - **JDBC**
     - **Node.js**
     - **Python**
     - **etc.**
   - Click on **"URI"** from the dropdown

7. **Copy the Connection String**
   - You'll see a connection string that looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
     ```
   - Click the **📋 Copy** button (usually next to the connection string)
   - Or manually select and copy the entire string

8. **Important: Replace Password Placeholder**
   - The copied string will have `[YOUR-PASSWORD]` as a placeholder
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - Your password is the one you set when creating the Supabase project
   - If you forgot it, you can reset it in Settings → Database → Reset Database Password

## 📋 Alternative: Get Individual Values

If you prefer to get values separately (for environment variables):

1. In the same **Database** settings page
2. Look for **"Connection info"** or **"Connection parameters"** section
3. You'll see:
   - **Host**: `db.xxxxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (click "Show" to reveal, or use the one you set)

## 🔐 Where to Find Your Database Password

If you forgot your password:

1. Go to **Settings** → **Database**
2. Scroll to **"Database password"** section
3. Click **"Reset database password"**
4. Enter a new password
5. **Save it somewhere safe!** (password manager recommended)

## 📝 Example Connection String Format

**Full URI format:**
```
postgresql://postgres:your-actual-password@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Broken down:**
- Protocol: `postgresql://`
- User: `postgres`
- Password: `your-actual-password`
- Host: `db.abcdefghijklmnop.supabase.co`
- Port: `5432`
- Database: `postgres`

## ✅ Quick Checklist

- [ ] Logged into Supabase dashboard
- [ ] Selected your project
- [ ] Clicked Settings → Database
- [ ] Found "Connection string" section
- [ ] Selected "URI" format
- [ ] Copied the connection string
- [ ] Replaced `[YOUR-PASSWORD]` with actual password
- [ ] Saved connection details securely

## 🎯 Visual Guide (Text-Based)

```
Supabase Dashboard
├── Left Sidebar
│   ├── Home
│   ├── Table Editor
│   ├── SQL Editor
│   ├── Authentication
│   ├── Storage
│   ├── Edge Functions
│   └── ⚙️ Settings ← Click here!
│       ├── General
│       ├── API
│       ├── 🔵 Database ← Click here!
│       ├── Auth
│       └── ...
│
Database Settings Page
├── Connection pooling
├── Connection string ← Scroll here!
│   ├── [Dropdown: URI ▼]
│   ├── postgresql://postgres:[PASSWORD]@...
│   └── [📋 Copy] button
└── Connection info
    ├── Host: db.xxxxx.supabase.co
    ├── Port: 5432
    ├── Database: postgres
    ├── User: postgres
    └── Password: [Show/Reset]
```

## 💡 Pro Tips

1. **Save your password**: Use a password manager to store your Supabase database password
2. **Use environment variables**: Never hardcode passwords in your code
3. **Test connection**: Use the connection string in a test script before deploying
4. **Keep it secret**: Never commit connection strings to GitHub

## 🆘 Still Can't Find It?

If you can't find the connection string:

1. Make sure you're in the correct project
2. Check that your project has finished initializing (can take 2-3 minutes)
3. Try refreshing the page
4. Check if you have the correct permissions (project owner/admin)
5. Alternative: Use the **SQL Editor** → Click "Connect" → Copy connection details from there

---

**Next Step:** Use this connection string in your `config/database.php` file or Vercel environment variables!
