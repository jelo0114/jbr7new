# Deployment Troubleshooting Guide

## If Deployment is Stuck or Not Working

### Step 1: Check Vercel Dashboard
1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the **latest deployment**
3. Check the **status**:
   - ✅ **Ready** = Success
   - ⏳ **Building** = Still in progress (wait 2-5 minutes)
   - ❌ **Error** = Failed (check logs below)

### Step 2: Check Build Logs
1. In the deployment page, scroll to **"Build Logs"**
2. Look for:
   - **Red error messages** (these are the problem)
   - **"Installing Builder: @vercel/php"** (this means old config is being used)
   - **"Build Completed"** (this is good)
   - **"Deploying outputs..."** (this is normal, can take 1-3 minutes)

### Step 3: Common Issues & Fixes

#### Issue: "The package @vercel/php is not published"
**Fix:**
- Make sure `vercel.json` has **NO `builds` section**
- Make sure `package.json` has `"vercel-php": "^0.7.3"` (not `@vercel/php`)
- Commit and push again

#### Issue: "Build Completed" but stuck on "Deploying outputs"
**This is NORMAL** - wait 2-5 minutes. With 40+ PHP files, this takes time.

#### Issue: Deployment shows "Error" status
**Check logs for:**
- Database connection errors → Set environment variables in Vercel
- Missing files → Check `.vercelignore` isn't ignoring PHP files
- Syntax errors → Check PHP files for errors

### Step 4: Force Redeploy
1. In Vercel Dashboard → **Deployments**
2. Click **"..."** (three dots) on latest deployment
3. Click **"Redeploy"**
4. Check **"Redeploy without cache"** (if available)
5. Click **"Redeploy"**

### Step 5: Verify Files Are Pushed to GitHub
```bash
# Check if files are committed
git status

# If files are not committed:
git add vercel.json package.json .vercelignore
git commit -m "Fix deployment configuration"
git push origin main
```

### Step 6: Check Vercel Project Settings
1. Go to **Vercel Dashboard** → Project → **Settings** → **General**
2. Check **Root Directory**:
   - Should be **`./`** (root of repo)
   - NOT a subfolder like `./src` or `./app`
3. Check **Build & Development Settings**:
   - Framework Preset: **"Other"** (for PHP)
   - Build Command: Leave empty (Vercel handles PHP automatically)
   - Output Directory: Leave empty

### Step 7: Check Environment Variables
1. Go to **Vercel Dashboard** → Project → **Settings** → **Environment Variables**
2. Make sure these 5 variables are set:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
3. After adding/changing variables, **Redeploy** the project

### Step 8: Test Deployment
After deployment completes:
1. Visit: `https://your-project.vercel.app/api/test.php`
2. Should see: `{"status":"ok","message":"PHP API is working",...}`
3. If you see error → Check Vercel Function Logs

### Step 9: Check Function Logs
1. Go to **Vercel Dashboard** → Project → **Logs**
2. Look for PHP errors
3. Common errors:
   - Database connection failed → Check environment variables
   - File not found → Check file paths
   - Syntax error → Check PHP syntax

---

## Quick Checklist

- [ ] `vercel.json` has `functions` (not `builds`)
- [ ] `package.json` has `"vercel-php": "^0.7.3"`
- [ ] `.vercelignore` doesn't ignore PHP files
- [ ] Files are committed and pushed to GitHub
- [ ] Vercel Root Directory is `./`
- [ ] Environment variables are set in Vercel
- [ ] Deployment status is checked in Vercel Dashboard
- [ ] Build logs are reviewed for errors

---

## Still Not Working?

1. **Disconnect and Reconnect GitHub:**
   - Vercel Dashboard → Settings → Git → Disconnect
   - Re-import project from GitHub

2. **Create New Vercel Project:**
   - Delete current project
   - Create new project
   - Import from GitHub again

3. **Check GitHub Repository:**
   - Make sure `vercel.json` and `package.json` are in the root
   - Make sure they're committed (not just local)
