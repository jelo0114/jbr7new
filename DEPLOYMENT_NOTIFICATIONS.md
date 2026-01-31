# Notifications Not Showing on Deployment

If notifications appear in Supabase but not on your deployed site, check the following:

## 1. API Route Deployed

The notifications panel fetches from `/api/get?action=notifications&userId=...`. Your deployment platform must serve this API as a serverless function:

- **Vercel**: The `api/` folder becomes serverless functions. Ensure `api/get.js` is deployed.
- **Netlify**: Add Netlify Functions for `api/` or use a proxy to your API.
- **Static hosting (GitHub Pages, etc.)**: You need a separate API server. Set `window.JBR7_API_BASE = 'https://your-api-url.com'` before loading the app.

## 2. Environment Variables

In your deployment dashboard (Vercel, Netlify, etc.), set:

- `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon/public key

These must be set for the API serverless functions, not just the frontend.

## 3. RLS Policies on Supabase

Run in Supabase SQL Editor (if not already done):

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read notifications" ON notifications;
CREATE POLICY "Allow read notifications" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert notifications" ON notifications;
CREATE POLICY "Allow insert notifications" ON notifications FOR INSERT WITH CHECK (true);
```

## 4. User ID Match

The notification in Supabase has `user_id: 1`. The logged-in user on your deployment must have `user_id: 1` in session (`sessionStorage.jbr7_user_id`). If you're testing with a different account, notifications won't appear.

## 5. Retry Button

If the fetch fails, the panel now shows "Unable to load notifications" with a **Retry** button. Use the browser console (F12 → Console) to see the actual error when Retry is shown.
