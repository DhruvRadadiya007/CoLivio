# 🔧 Troubleshooting Guide - Server Connection Issues

## Error: "Failed to fetch" / "Unable to connect to server"

This error means the frontend cannot reach the Supabase Edge Function backend server.

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Server URL

The app is trying to connect to:
```
https://xxhiqqamjhkhbykmehnr.supabase.co/functions/v1/make-server-5bec5893
```

Open your browser console and look for log messages showing:
- `API Request: POST https://...`
- `API Response: ...`

### Step 2: Test Health Endpoint

Open this URL directly in your browser:
```
https://xxhiqqamjhkhbykmehnr.supabase.co/functions/v1/make-server-5bec5893/health
```

**Expected Response:**
```json
{"status":"ok"}
```

**If you see an error:**
- 404 Not Found → Edge Function not deployed
- 500 Internal Server Error → Edge Function has an error
- Connection refused → Supabase project issue

---

## ✅ Solution: Deploy the Edge Function

The Supabase Edge Function needs to be deployed. Here's how:

### Option 1: Use Supabase CLI (Recommended)

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link to your project:**
   ```bash
   supabase link --project-ref xxhiqqamjhkhbykmehnr
   ```

4. **Deploy the Edge Function:**
   ```bash
   supabase functions deploy make-server-5bec5893
   ```

5. **Verify deployment:**
   ```bash
   supabase functions list
   ```

### Option 2: Use Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `xxhiqqamjhkhbykmehnr`
3. Navigate to **Edge Functions** in the left sidebar
4. Click **"New Function"** or **"Deploy existing function"**
5. Name: `make-server-5bec5893`
6. Copy the code from `/supabase/functions/server/index.tsx`
7. Click **Deploy**

### Option 3: Manual Deployment via Dashboard

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Verify your project is: `xxhiqqamjhkhbykmehnr`
4. Use the Dashboard UI to:
   - Navigate to **Edge Functions**
   - Create a new function named: `make-server-5bec5893`
   - Paste the server code
   - Deploy

---

## 🧪 Testing After Deployment

### Test 1: Health Check
```bash
curl https://xxhiqqamjhkhbykmehnr.supabase.co/functions/v1/make-server-5bec5893/health
```

Expected: `{"status":"ok"}`

### Test 2: Signup Endpoint
```bash
curl -X POST https://xxhiqqamjhkhbykmehnr.supabase.co/functions/v1/make-server-5bec5893/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

Expected: User object or error message

### Test 3: Frontend Connection

1. Open the app in your browser
2. Go to signup page
3. Open browser DevTools (F12)
4. Check the Console tab
5. Look for:
   - ✅ "Server health check: {status: 'ok'}" → Server is online
   - ❌ "Server is offline" → Server not deployed

---

## 🚨 Common Issues & Fixes

### Issue 1: Function Not Found (404)

**Symptoms:**
- `Failed to fetch`
- `404 Not Found`

**Solution:**
- Deploy the Edge Function (see above)
- Check function name is exactly: `make-server-5bec5893`

### Issue 2: CORS Error

**Symptoms:**
- Error mentioning CORS policy
- "Access to fetch has been blocked by CORS policy"

**Solution:**
Already handled in the server code! If you still see CORS errors:

1. Check the server's CORS configuration:
```tsx
app.use(
  "/*",
  cors({
    origin: "*",  // Allows all origins
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
```

2. Ensure the function is deployed with this configuration

### Issue 3: Environment Variables Missing

**Symptoms:**
- Server deploys but signup fails
- "Invalid credentials" or auth errors

**Solution:**

The Edge Function needs these environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

**Set them in Supabase Dashboard:**

1. Go to **Project Settings** → **API**
2. Find these values:
   - URL: `https://xxhiqqamjhkhbykmehnr.supabase.co`
   - `anon` public key
   - `service_role` secret key

3. Go to **Edge Functions** → Your function → **Settings**
4. Add these as environment variables

### Issue 4: Server Code Error

**Symptoms:**
- 500 Internal Server Error
- Function logs show errors

**Solution:**

1. Check Edge Function logs in Dashboard:
   - **Edge Functions** → `make-server-5bec5893` → **Logs**

2. Common fixes:
   - Missing `import` statements
   - Syntax errors in code
   - Missing dependencies

3. Verify all imports work with Deno:
   ```tsx
   import { Hono } from "npm:hono";
   import { cors } from "npm:hono/cors";
   import { logger } from "npm:hono/logger";
   import { createClient } from "npm:@supabase/supabase-js";
   ```

---

## 📋 Deployment Checklist

Before the app will work, ensure:

- [ ] Supabase project exists
- [ ] Edge Function `make-server-5bec5893` is deployed
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] Environment variables are set
- [ ] CORS is configured correctly
- [ ] Function logs show no errors

---

## 🔄 Alternative: Use a Different Backend

If you can't deploy to Supabase Edge Functions, you can:

### Option A: Use Supabase without Edge Functions

Modify the app to use Supabase directly from the frontend:

1. Remove the API service layer
2. Use `@supabase/supabase-js` directly in components
3. Use Supabase's built-in auth
4. Use Supabase Database instead of KV store

**Note:** This requires database schema setup instead of KV store.

### Option B: Deploy to a Different Platform

Deploy the server to:
- **Vercel** (Serverless Functions)
- **Netlify** (Edge Functions)
- **Railway** / **Render** (Container)
- **AWS Lambda**

Change the `API_BASE_URL` in `/src/app/services/api.ts` to point to your new endpoint.

---

## 🛠️ Quick Fix: Temporary Demo Mode

If you need to test the UI immediately while fixing the backend:

**Enable localStorage fallback** (temporary):

1. Comment out API calls in components
2. Use the original localStorage logic
3. Test UI/UX
4. Re-enable API when server is ready

**Example in Signup.tsx:**
```tsx
// Temporary demo mode - remove when server is ready
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // DEMO MODE - bypassing server
  const demoUser = {
    id: Date.now().toString(),
    name,
    email,
  };
  setUser(demoUser);
  toast.success('Account created (demo mode)!');
  navigate('/app/room');
};
```

---

## 📞 Still Having Issues?

### Check These:

1. **Browser Console** (F12 → Console tab)
   - Look for error messages
   - Check network requests

2. **Network Tab** (F12 → Network tab)
   - Filter by "make-server"
   - Check request/response details
   - Look at status codes

3. **Supabase Logs**
   - Dashboard → Edge Functions → Logs
   - Look for errors or warnings

4. **Server Code**
   - Verify `/supabase/functions/server/index.tsx` is correct
   - Check for syntax errors
   - Ensure all imports are valid

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Health check returns: `{"status":"ok"}`
2. ✅ Browser console shows: "Server health check: {status: 'ok'}"
3. ✅ No yellow warning on signup page
4. ✅ Signup creates an account
5. ✅ User can login
6. ✅ Data persists across sessions

---

## 📚 Additional Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase CLI Docs](https://supabase.com/docs/reference/cli)
- [Hono Framework Docs](https://hono.dev/)
- [Deno Deploy Docs](https://deno.com/deploy)

---

**Good luck! Once the Edge Function is deployed, everything should work perfectly!** 🚀
