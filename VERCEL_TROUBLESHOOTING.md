# Vercel Deployment Troubleshooting Guide

## Error: ERR_INVALID_RESPONSE

This error typically means:
1. PHP runtime is not configured correctly
2. Environment variables are missing
3. Database connection is failing
4. Routing configuration issue

---

## Step 1: Verify PHP Runtime

### Check if PHP is working:
1. Visit: `https://jbr7-seven.vercel.app/api/test.php`
2. You should see JSON response with PHP version info
3. If you get 404 or error, PHP runtime is not configured

### Fix: Update `vercel.json`
Make sure your `vercel.json` has:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "**/*.php",
      "use": "@vercel/php"
    }
  ],
  "functions": {
    "**/*.php": {
      "runtime": "@vercel/php@2.0.0"
    }
  }
}
```

---

## Step 2: Check Environment Variables

### In Vercel Dashboard:
1. Go to your project → **Settings** → **Environment Variables**
2. Verify these are set:
   - `DB_HOST` = `db.npuijwrwpxodtamqybmy.supabase.co`
   - `DB_PORT` = `5432`
   - `DB_NAME` = `postgres`
   - `DB_USER` = `postgres`
   - `DB_PASSWORD` = `jbr7bags_27$`
3. Make sure they're applied to **Production**, **Preview**, and **Development**

### Test Environment Variables:
Visit: `https://jbr7-seven.vercel.app/api/test.php`
Check the `environment` section in the response.

---

## Step 3: Check Database Connection

### Test Database Connection:
Create `api/test-db.php`:
```php
<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->query('SELECT NOW() as current_time');
    $result = $stmt->fetch();
    echo json_encode([
        'success' => true,
        'message' => 'Database connected!',
        'time' => $result['current_time']
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
```

Visit: `https://jbr7-seven.vercel.app/api/test-db.php`

---

## Step 4: Check Vercel Logs

### View Deployment Logs:
1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Check **Build Logs** and **Function Logs**
4. Look for PHP errors or connection errors

### Common Errors:

#### Error: "Module not found: @vercel/php"
**Fix:** Vercel should auto-install, but you can add to `package.json`:
```json
{
  "dependencies": {
    "@vercel/php": "^2.0.0"
  }
}
```

#### Error: "Database connection failed"
**Fix:** 
- Check environment variables are set correctly
- Verify Supabase database is accessible
- Check if IP restrictions are enabled in Supabase

#### Error: "404 Not Found" for PHP files
**Fix:** Check `vercel.json` routes configuration

---

## Step 5: Verify File Structure

Make sure these files exist:
- ✅ `vercel.json` (in root)
- ✅ `config/database.php`
- ✅ `.vercelignore` (to exclude unnecessary files)
- ✅ All PHP files in `jbr7php/` directory

---

## Step 6: Redeploy

After making changes:

1. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Fix Vercel configuration"
   git push origin main
   ```

2. **Or trigger manual redeploy:**
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment

---

## Step 7: Test Specific Endpoints

### Test Signup:
- URL: `https://jbr7-seven.vercel.app/jbr7php/signup.php`
- Method: POST
- Body: `{ "username": "test", "email": "test@test.com", "password": "test123" }`

### Test Session:
- URL: `https://jbr7-seven.vercel.app/jbr7php/session_user.php`
- Should return 401 if not logged in (this is correct!)

---

## Quick Fixes

### If PHP files return 404:
1. Check `vercel.json` routes
2. Make sure files are not in `.vercelignore`
3. Verify file paths are correct

### If you get "Internal Server Error":
1. Check Vercel function logs
2. Check `config/database.php` for errors
3. Verify environment variables

### If database connection fails:
1. Double-check Supabase credentials
2. Verify Supabase project is active
3. Check Supabase connection pooling settings
4. Try using connection string format instead

---

## Still Not Working?

1. **Check Vercel Status:** https://vercel-status.com
2. **Check Supabase Status:** https://status.supabase.com
3. **Review Vercel Documentation:** https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/php
4. **Check PHP Error Logs:** Vercel Dashboard → Functions → View Logs

---

## Alternative: Use Vercel CLI for Debugging

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy with logs
vercel --prod --debug

# View logs
vercel logs
```

---

**Last Updated:** January 2026
