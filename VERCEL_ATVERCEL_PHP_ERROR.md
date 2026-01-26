# Fix: `Error: The package @vercel/php is not published on the npm registry`

## What this error means

Vercel is trying to install a **builder/runtime named `@vercel/php`**.

- **`@vercel/php` is not an npm package**, so the install fails.
- This usually happens when your deployment is using a `vercel.json` that contains a `builds` rule like:

```json
{
  "builds": [{ "src": "**/*.php", "use": "@vercel/php" }]
}
```

If Vercel prints **`Installing Builder: @vercel/php`**, it is reading a config (or deployment) that still references it.

---

## What your repo should look like (working setup)

### `package.json`

```json
{
  "dependencies": {
    "vercel-php": "^0.7.3"
  }
}
```

### `vercel.json` (recommended: NO `builds`)

```json
{
  "version": 2,
  "functions": {
    "**/*.php": {
      "runtime": "vercel-php@0.7.3",
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

You can keep your existing `routes/rewrites/headers` as needed — the key point is: **do not use `builds` with `@vercel/php`**.

---

## Why you can still see this error even after “fixing” it

### 1) You didn’t deploy the latest commit
Vercel deploy logs show the **commit hash** it is building. If that hash is not your newest commit, Vercel is building an older version that still had `@vercel/php`.

**Fix**
- Commit and push `vercel.json` + `package.json`
- Redeploy

---

### 2) Vercel is using the wrong Root Directory
If Vercel’s **Settings → General → Root Directory** is set to a subfolder, Vercel will look for `vercel.json` inside that folder (and may find an older config or none, causing fallback behavior).

**Fix**
- In Vercel: **Project → Settings → General → Root Directory**
- Set it to the correct folder (usually **`./`**)
- Redeploy

---

### 3) There is another `vercel.json` in the repo (different folder)
This is common in projects that were copied/migrated.

**Fix (local check)**
- Search your repo for more `vercel.json` files
- Search for `@vercel/php` text

---

### 4) Old “Build & Development Settings” overrides in Vercel
If you previously set overrides, Vercel might not behave as expected.

**Fix**
- Vercel: **Project → Settings → Build & Development Settings**
- Turn off / clear any overrides
- Redeploy

---

## Step-by-step fix checklist (do this in order)

### Step A — Ensure config files are correct locally
1. Confirm `vercel.json` has **no `builds`** and **no `@vercel/php`**
2. Confirm `package.json` includes `"vercel-php": "^0.7.3"`

### Step B — Install dependencies locally (optional but recommended)

```bash
npm install
```

This should generate/update `package-lock.json`. Commit it too.

### Step C — Commit and push

```bash
git add vercel.json package.json package-lock.json
git commit -m "Fix: use vercel-php runtime (remove @vercel/php)"
git push origin main
```

### Step D — Redeploy on Vercel (no cache)
- Go to Vercel → **Deployments**
- Click **Redeploy**
- Choose **Redeploy without cache** (if available)

### Step E — Verify the logs
In the new deployment logs, you should see:
- ✅ installing dependencies
- ✅ `vercel-php` being used
- ❌ no `Installing Builder: @vercel/php`

---

## If it STILL says “Installing Builder: @vercel/php”

Do one of these (fast reset options):

1. **Disconnect and re-import the project**
   - Vercel Project → Settings → Git → Disconnect
   - Import again from GitHub

2. **Delete the Vercel project and create a new one**
   - This guarantees there are no hidden legacy settings.

---

## Quick note about docs

It’s OK if a `.md` file mentions `@vercel/php` as text (like tutorials).  
That does **not** affect the build. Only `vercel.json`/settings matter.

