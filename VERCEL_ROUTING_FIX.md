# Vercel Routing Fix for Signin/Signup 404 Errors

## Problem
Getting 404 errors when accessing `/jbr7php/signin.php` and `/jbr7php/signup.php` on Vercel.

## Root Cause
Vercel needs explicit routing configuration for PHP files in subdirectories.

## Solution Applied

### 1. Updated `vercel.json`
Added explicit routes for:
- `/jbr7php/*` - All PHP files in jbr7php directory
- `/api/*` - API endpoints
- `/config/*` - Config files

### 2. Added Rewrites
Added `rewrites` section to ensure proper routing:
```json
"rewrites": [
  {
    "source": "/jbr7php/:path*",
    "destination": "/jbr7php/:path*"
  }
]
```

### 3. Updated `.vercelignore`
Made sure PHP files are NOT ignored:
```
!jbr7php/
!config/
!api/
```

## Testing

After deploying, test these URLs:

1. **Health Check:**
   ```
   https://jbr7-seven.vercel.app/api/health.php
   ```

2. **File Check:**
   ```
   https://jbr7-seven.vercel.app/api/test-signin.php
   ```

3. **Signin (POST only):**
   ```bash
   curl -X POST https://jbr7-seven.vercel.app/jbr7php/signin.php \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "email=test@test.com&password=test123"
   ```

4. **Signup (POST only):**
   ```bash
   curl -X POST https://jbr7-seven.vercel.app/jbr7php/signup.php \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=test&email=test@test.com&password=test123"
   ```

## Important Notes

1. **PHP files only accept POST:** Visiting `/jbr7php/signin.php` directly (GET) will fail. Use the HTML forms instead.

2. **Use HTML forms:** 
   - `signin.html` → POSTs to `/jbr7php/signin.php`
   - `signup.html` → POSTs to `/jbr7php/signup.php`

3. **After updating vercel.json:** You MUST redeploy for changes to take effect.

## Deployment Steps

1. Commit changes:
   ```bash
   git add vercel.json .vercelignore
   git commit -m "Fix Vercel routing for PHP files"
   git push origin main
   ```

2. Wait for Vercel to auto-deploy

3. Test the endpoints above

4. If still 404, check Vercel deployment logs for errors

## Alternative: Use Vercel Serverless Functions

If routing still doesn't work, we can convert PHP files to Vercel serverless functions, but the current setup should work with proper routing.
