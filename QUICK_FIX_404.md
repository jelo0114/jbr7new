# Quick Fix: 404 Errors on Signin/Signup

## ✅ What I Fixed

1. **Updated `vercel.json`** - Added explicit routes for `/jbr7php/*` and `/api/*`
2. **Updated `.vercelignore`** - Ensured PHP files are NOT ignored
3. **Added AJAX handling to `signup.html`** - Now matches `signin.html` behavior
4. **Created test endpoints** - `api/health.php` and `api/test-signin.php`

## 🚀 Next Steps

### 1. Push Changes to GitHub
```bash
git add .
git commit -m "Fix Vercel routing for signin/signup endpoints"
git push origin main
```

### 2. Set Environment Variables in Vercel
**Go to:** Vercel Dashboard → Settings → Environment Variables

Add:
```
DB_HOST=db.npuijwrwpxodtamqybmy.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=jbr7bags_27$
```

**⚠️ IMPORTANT:** After adding, click **"Redeploy"**!

### 3. Test After Deployment

**Test PHP is working:**
- `https://jbr7-seven.vercel.app/api/health.php`

**Test signin endpoint:**
- Visit: `https://jbr7-seven.vercel.app/signin.html`
- Fill form and submit

**Test signup endpoint:**
- Visit: `https://jbr7-seven.vercel.app/signup.html`
- Fill form and submit

## 🔍 If Still 404

1. **Check Vercel Logs:**
   - Dashboard → Deployments → Latest → Functions → Logs

2. **Verify Files Are Deployed:**
   - Check GitHub repo has `jbr7php/signin.php` and `jbr7php/signup.php`

3. **Manual Redeploy:**
   - Vercel Dashboard → Deployments → Redeploy

4. **Check Environment Variables:**
   - Make sure they're set AND you clicked "Redeploy" after setting them

## 📝 Important Notes

- **PHP files only accept POST** - Don't visit `/jbr7php/signin.php` directly
- **Use HTML forms** - `signin.html` and `signup.html` have the forms
- **After env vars** - Always redeploy!
