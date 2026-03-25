# 🚀 Quick Start Guide - Fix "Failed to fetch" Error

## The Problem

You're seeing: **"Signup error: TypeError: Failed to fetch"**

This means the **backend server is not deployed yet**.

---

## ✅ The Solution (5 Minutes)

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate.

### Step 3: Deploy the Edge Function

**On macOS/Linux:**
```bash
chmod +x deploy-edge-function.sh
./deploy-edge-function.sh
```

**On Windows:**
```cmd
deploy-edge-function.bat
```

**Or manually:**
```bash
supabase link --project-ref xxhiqqamjhkhbykmehnr
supabase functions deploy make-server-5bec5893
```

### Step 4: Verify Deployment

Open this URL in your browser:
```
https://xxhiqqamjhkhbykmehnr.supabase.co/functions/v1/make-server-5bec5893/health
```

**Expected response:**
```json
{"status":"ok"}
```

✅ **If you see this, you're done!** Go back to your app and try signing up again.

---

## 🧪 Test the App

1. **Refresh your app in the browser**
2. **Go to the signup page**
3. **Check for the warning message:**
   - ✅ No warning = Server is online!
   - ⚠️ Yellow warning = Server still offline

4. **Try creating an account:**
   - Name: Test User
   - Email: test@example.com
   - Password: Test1234

5. **Success!** You should be logged in and redirected to room setup.

---

## 📋 Deployment Checklist

- [ ] Supabase CLI installed
- [ ] Logged in to Supabase (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Function deployed (`supabase functions deploy`)
- [ ] Health check passes (returns `{"status":"ok"}`)
- [ ] App shows no server warning
- [ ] Signup works
- [ ] Login works

---

## ❌ Still Not Working?

### Issue 1: CLI Not Found

**Error:** `supabase: command not found`

**Fix:**
```bash
npm install -g supabase
# or
yarn global add supabase
```

### Issue 2: Login Failed

**Error:** Browser doesn't open or login fails

**Fix:**
```bash
supabase login
```
- Make sure your browser isn't blocking the popup
- Try incognito mode if needed

### Issue 3: Project Link Failed

**Error:** `Cannot access project`

**Fix:**
- Verify project ID: `xxhiqqamjhkhbykmehnr`
- Check you have access to the project in Supabase Dashboard
- Try linking again with full command:
  ```bash
  supabase link --project-ref xxhiqqamjhkhbykmehnr
  ```

### Issue 4: Deployment Failed

**Error:** Function won't deploy

**Check:**
1. Syntax errors in `/supabase/functions/server/index.tsx`
2. Missing dependencies
3. Supabase service limits

**View errors:**
```bash
supabase functions deploy make-server-5bec5893 --debug
```

### Issue 5: Health Check Returns 404

**Error:** Health endpoint not found

**This means:**
- Function name is wrong (should be `make-server-5bec5893`)
- Function didn't deploy
- Wrong project

**Fix:**
```bash
# List all deployed functions
supabase functions list

# Redeploy
supabase functions deploy make-server-5bec5893
```

---

## 🎯 Alternative: Use Supabase Dashboard

If CLI doesn't work, use the web dashboard:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open project: `xxhiqqamjhkhbykmehnr`
3. Navigate to **Edge Functions** (left sidebar)
4. Click **"New Function"**
5. Name: `make-server-5bec5893`
6. Copy code from `/supabase/functions/server/index.tsx`
7. Click **"Deploy"**
8. Test health endpoint

---

## 📚 Helpful Commands

```bash
# Check CLI version
supabase --version

# Login
supabase login

# Link project
supabase link --project-ref xxhiqqamjhkhbykmehnr

# List all functions
supabase functions list

# Deploy function
supabase functions deploy make-server-5bec5893

# View logs
supabase functions logs make-server-5bec5893

# View logs with tail (live)
supabase functions logs make-server-5bec5893 --tail

# Delete function (if needed)
supabase functions delete make-server-5bec5893
```

---

## ✅ Success Indicators

**You'll know it's working when:**

1. ✅ Health endpoint returns: `{"status":"ok"}`
2. ✅ No yellow warning on signup page
3. ✅ Console shows: `Server health check: {status: 'ok'}`
4. ✅ Signup creates account successfully
5. ✅ Can login with created account
6. ✅ Can create/join rooms
7. ✅ Data persists after logout/login

---

## 🎉 Next Steps After Deployment

Once the server is deployed:

1. ✅ **Test authentication:**
   - Sign up with a test account
   - Log out
   - Log back in
   - Verify session persists

2. ✅ **Test room features:**
   - Create a room
   - Copy invite code
   - Join from another account (incognito)
   - Verify both users see the room

3. ✅ **Test data persistence:**
   - Add meals for the week
   - Create some tasks
   - Log out and back in
   - Verify data is still there

4. ✅ **Test collaboration:**
   - Have two users in same room
   - One user adds data
   - Other user refreshes page
   - Both see the same data

---

## 📞 Need More Help?

See these files:

- **`/TROUBLESHOOTING.md`** - Detailed troubleshooting
- **`/COLIVIO_COMPLETE_GUIDE.md`** - Full feature guide
- **`/DATABASE_INTEGRATION.md`** - Technical details
- **`/PROJECT_STATUS.md`** - Current status

---

## 🔥 Pro Tip

**Set up environment variables in Supabase:**

Even though the function should work without them (using automatic env vars), you can explicitly set them:

1. Go to **Edge Functions** → `make-server-5bec5893` → **Settings**
2. Add these variables:
   - `SUPABASE_URL`: `https://xxhiqqamjhkhbykmehnr.supabase.co`
   - `SUPABASE_ANON_KEY`: Get from **Project Settings** → **API**
   - `SUPABASE_SERVICE_ROLE_KEY`: Get from **Project Settings** → **API** (keep secret!)

---

**Good luck! The deployment should take less than 5 minutes!** 🚀

After deployment, your Colivio app will be fully functional with:
- ✅ Secure authentication
- ✅ Multi-user collaboration
- ✅ Persistent database storage
- ✅ Real-time room sharing
- ✅ All features working

**You got this!** 💪
