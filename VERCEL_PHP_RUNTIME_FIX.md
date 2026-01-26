# Fix: @vercel/php Package Error

## Problem
Error: "The package `@vercel/php` is not published on the npm registry"

## Root Cause
`@vercel/php` doesn't exist. Vercel uses the **community-maintained** `vercel-php` package instead.

---

## ✅ Solution Applied

### 1. Updated `vercel.json`
Changed from:
```json
"use": "@vercel/php"
"runtime": "@vercel/php@2.0.0"
```

To:
```json
"use": "vercel-php@0.7.3"
"runtime": "vercel-php@0.7.3"
```

### 2. Updated `package.json`
Added the correct package:
```json
{
  "dependencies": {
    "vercel-php": "^0.7.3"
  }
}
```

---

## About vercel-php

- **Package Name:** `vercel-php` (not `@vercel/php`)
- **Latest Version:** `0.7.3` (supports PHP 8.3)
- **Maintained By:** Vercel Community
- **GitHub:** https://github.com/vercel-community/php
- **NPM:** https://www.npmjs.com/package/vercel-php

### Supported PHP Versions:
- `vercel-php@0.7.3` - PHP 8.3.x
- `vercel-php@0.6.2` - PHP 8.2.x
- `vercel-php@0.5.5` - PHP 8.1.x
- `vercel-php@0.4.4` - PHP 8.0.x
- `vercel-php@0.3.6` - PHP 7.4.x

---

## Next Steps

### 1. Install Dependencies
```bash
npm install
```

This will install `vercel-php@0.7.3` which Vercel needs.

### 2. Push Changes
```bash
git add vercel.json package.json
git commit -m "Fix PHP runtime to use vercel-php community package"
git push origin main
```

### 3. Vercel Will Auto-Deploy
Vercel will:
1. Install `vercel-php` from npm
2. Use it to process PHP files
3. Deploy your application

---

## Testing After Deployment

1. **Test PHP Runtime:**
   ```
   https://jbr7-seven.vercel.app/api/health.php
   ```

2. **Test Signin:**
   ```
   https://jbr7-seven.vercel.app/signin.html
   ```

3. **Test Signup:**
   ```
   https://jbr7-seven.vercel.app/signup.html
   ```

---

## Important Notes

- ✅ **`vercel-php` is the correct package** - Available on npm
- ✅ **Version 0.7.3** - Latest, supports PHP 8.3
- ✅ **Community maintained** - Official Vercel community runtime
- ❌ **`@vercel/php` doesn't exist** - This was the error

---

## Alternative: Remove package.json Dependency

If you prefer, you can also remove the dependency from `package.json` and let Vercel handle it automatically via `vercel.json` configuration. However, explicitly including it ensures the correct version is used.

---

**The error should be resolved after installing `vercel-php` and pushing the updated `vercel.json`!**
