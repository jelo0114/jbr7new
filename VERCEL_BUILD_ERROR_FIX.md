# Fix: Vercel Build Error - @vercel/php Not Found

## Problem
```
Error: The package `@vercel/php` is not published on the npm registry
```

## Root Cause
The `builds` section in `vercel.json` was trying to use `@vercel/php` which doesn't exist. Vercel's modern approach uses the `functions` configuration instead of `builds` for PHP.

---

## ✅ Solution Applied

### Removed `builds` Section
**Old (causing error):**
```json
{
  "builds": [
    {
      "src": "**/*.php",
      "use": "@vercel/php"  // ❌ Doesn't exist
    }
  ]
}
```

**New (fixed):**
```json
{
  "functions": {
    "**/*.php": {
      "runtime": "vercel-php@0.7.3"  // ✅ Correct
    }
  }
}
```

### Why This Works
- **Modern Vercel** uses `functions` configuration (not `builds`)
- **`vercel-php@0.7.3`** is installed via `package.json` dependency
- **No builder needed** - Vercel auto-detects PHP files via `functions` config

---

## 📋 Updated Files

### `vercel.json` (Fixed)
- ✅ Removed `builds` section
- ✅ Kept `functions` section with `vercel-php@0.7.3`
- ✅ All routes preserved

### `package.json` (Already Correct)
```json
{
  "dependencies": {
    "vercel-php": "^0.7.3"
  }
}
```

---

## 🚀 Deployment Steps

### 1. Push Updated Files
```bash
git add vercel.json package.json
git commit -m "Remove builds section, use functions config for PHP"
git push origin main
```

### 2. Vercel Will:
1. Install `vercel-php@0.7.3` from npm (via package.json)
2. Use `functions` config to process PHP files
3. Deploy successfully ✅

---

## ✅ Expected Build Output

After fix, you should see:
```
✓ Installing dependencies
✓ Installing vercel-php@0.7.3
✓ Building PHP functions
✓ Deployment complete
```

**No more `@vercel/php` error!**

---

## 📝 Key Changes

1. ✅ **Removed `builds`** - Not needed with `functions` config
2. ✅ **Kept `functions`** - Modern Vercel approach
3. ✅ **`vercel-php@0.7.3`** - Correct community package
4. ✅ **Routes preserved** - All routing still works

---

## 🔍 If Still Having Issues

### Check Vercel Build Logs:
1. Vercel Dashboard → Deployments → Latest
2. Check "Build Logs"
3. Should see: `Installing vercel-php@0.7.3`

### Verify package.json:
Make sure `package.json` has:
```json
"dependencies": {
  "vercel-php": "^0.7.3"
}
```

### Manual Test:
```bash
# Install locally to verify
npm install

# Should install vercel-php@0.7.3 successfully
```

---

**The build error should be resolved after pushing the updated `vercel.json`!**
