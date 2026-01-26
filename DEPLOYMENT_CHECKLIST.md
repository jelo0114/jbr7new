# Vercel Deployment Checklist - Fix 404 Errors

## ✅ Pre-Deployment Checklist

### 1. Verify Files Are Committed
```bash
git status
git add vercel.json .vercelignore package.json api/ config/
git commit -m "Fix Vercel routing for PHP endpoints"
git push origin main
```

### 2. Set Environment Variables in Vercel
**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these (apply to Production, Preview, Development):**
```
DB_HOST=db.npuijwrwpxodtamqybmy.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=jbr7bags_27$
```

**⚠️ CRITICAL:** After adding, click **"Redeploy"** button!

---

## ✅ Post-Deployment Testing

### Test 1: PHP Runtime
```
https://jbr7-seven.vercel.app/api/health.php
```
**Expected:** `{"status":"ok","php_version":"8.x",...}`

### Test 2: File Structure
```
https://jbr7-seven.vercel.app/api/test-signin.php
```
**Expected:** JSON showing signin.php and signup.php exist

### Test 3: Database Connection
```
https://jbr7-seven.vercel.app/api/test-db.php
```
**Expected:** Database connection success JSON

### Test 4: Signin Endpoint (POST)
```bash
curl -X POST https://jbr7-seven.vercel.app/jbr7php/signin.php \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@test.com&password=test123"
```
**Expected:** JSON response (success or error, not 404)

### Test 5: Signup Endpoint (POST)
```bash
curl -X POST https://jbr7-seven.vercel.app/jbr7php/signup.php \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test&email=test@test.com&password=test123"
```
**Expected:** JSON response (success or error, not 404)

### Test 6: HTML Forms
- Visit: `https://jbr7-seven.vercel.app/signin.html`
- Visit: `https://jbr7-seven.vercel.app/signup.html`
- Try submitting the forms

---

## 🔧 If Still Getting 404

### Option 1: Check Vercel Logs
1. Vercel Dashboard → Deployments → Latest deployment
2. Click "Functions" tab
3. Check for PHP errors or routing errors

### Option 2: Verify Build Output
1. Vercel Dashboard → Deployments → Latest deployment
2. Check "Build Logs"
3. Look for PHP files being processed

### Option 3: Manual Redeploy
1. Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

### Option 4: Check File Paths
Make sure these files exist in your GitHub repo:
- ✅ `jbr7php/signin.php`
- ✅ `jbr7php/signup.php`
- ✅ `config/database.php`
- ✅ `vercel.json`
- ✅ `package.json`

---

## 📝 Common Issues

### Issue: "404 Not Found" for all PHP files
**Fix:** 
1. Check `vercel.json` has `"use": "@vercel/php"` in builds
2. Verify `package.json` has `@vercel/php` dependency
3. Redeploy

### Issue: "404" only for `/jbr7php/*` files
**Fix:**
1. Check `vercel.json` routes include `/jbr7php/(.*)`
2. Verify files are not in `.vercelignore`
3. Check rewrites section

### Issue: Database connection fails
**Fix:**
1. Verify environment variables are set
2. Check Supabase project is active
3. Verify credentials are correct
4. **Redeploy after setting env vars**

---

## 🚀 Quick Fix Command

If everything is configured but still 404:

```bash
# Trigger a fresh deployment
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main
```

Then wait 1-2 minutes and test again.

---

**Last Updated:** January 2026
