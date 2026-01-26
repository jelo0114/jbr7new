# Vercel ERR_INVALID_RESPONSE - Fix Checklist

## ✅ Immediate Actions Required

### 1. Set Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables (apply to Production, Preview, Development):

```
DB_HOST=db.npuijwrwpxodtamqybmy.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=jbr7bags_27$
```

**⚠️ CRITICAL:** After adding environment variables, you MUST redeploy!

---

### 2. Test PHP Runtime

After redeploying, visit:
- `https://jbr7-seven.vercel.app/api/test.php`

**Expected:** JSON response with PHP version info
**If 404:** PHP runtime not configured - check `vercel.json`

---

### 3. Test Database Connection

Visit:
- `https://jbr7-seven.vercel.app/api/test-db.php`

**Expected:** JSON with database connection success
**If error:** Check environment variables and Supabase connection

---

### 4. Check Signup Endpoint

The issue: `signup.php` expects **POST** method, not GET.

**To test signup:**
- Use a form or POST request tool (Postman, curl, etc.)
- Or visit `signup.html` which has the form

**Test with curl:**
```bash
curl -X POST https://jbr7-seven.vercel.app/jbr7php/signup.php \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'
```

---

## Common Issues & Fixes

### Issue 1: PHP Runtime Not Found
**Symptom:** 404 for all PHP files

**Fix:**
1. Check `vercel.json` has `"use": "@vercel/php"`
2. Add `package.json` with `@vercel/php` dependency (already created)
3. Redeploy

---

### Issue 2: Environment Variables Not Set
**Symptom:** Database connection fails, `test-db.php` shows "Not set"

**Fix:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add all DB_* variables
3. **IMPORTANT:** Click "Redeploy" after adding variables
4. Or trigger redeploy: `git commit --allow-empty -m "Trigger redeploy" && git push`

---

### Issue 3: Database Connection Fails
**Symptom:** `test-db.php` returns connection error

**Fix:**
1. Verify Supabase credentials are correct
2. Check Supabase project is active (not paused)
3. Verify database password matches
4. Check Supabase connection pooling settings
5. Try connection string format in `config/database.php`

---

### Issue 4: Signup.php Returns ERR_INVALID_RESPONSE
**Symptom:** Visiting `/signup.php` directly gives error

**This is expected!** `signup.php` only accepts POST requests.

**Fix:**
- Use `signup.html` instead (has the form)
- Or make POST request with proper headers

---

## Step-by-Step Fix Process

### Step 1: Verify Files Are Pushed to GitHub
```bash
git status
git add .
git commit -m "Add Vercel configuration and test endpoints"
git push origin main
```

### Step 2: Check Vercel Deployment
1. Go to Vercel Dashboard
2. Check latest deployment status
3. View build logs for errors

### Step 3: Set Environment Variables
1. Vercel Dashboard → Settings → Environment Variables
2. Add all DB_* variables
3. Apply to: Production, Preview, Development
4. **Redeploy** (click "Redeploy" button)

### Step 4: Test Endpoints
1. `https://jbr7-seven.vercel.app/api/test.php` - Should work
2. `https://jbr7-seven.vercel.app/api/test-db.php` - Should connect to DB
3. `https://jbr7-seven.vercel.app/signup.html` - Should show form

### Step 5: Check Logs
1. Vercel Dashboard → Functions → View Logs
2. Look for PHP errors or connection errors

---

## Quick Test Commands

### Test PHP Runtime:
```bash
curl https://jbr7-seven.vercel.app/api/test.php
```

### Test Database:
```bash
curl https://jbr7-seven.vercel.app/api/test-db.php
```

### Test Signup (POST):
```bash
curl -X POST https://jbr7-seven.vercel.app/jbr7php/signup.php \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

---

## Still Not Working?

1. **Check Vercel Logs:** Dashboard → Functions → Logs
2. **Check Supabase Logs:** Supabase Dashboard → Logs
3. **Verify File Structure:** Make sure all files are in GitHub
4. **Try Manual Redeploy:** Vercel Dashboard → Deployments → Redeploy

---

**Most Common Issue:** Environment variables not set or not applied after setting them. **Always redeploy after adding environment variables!**
