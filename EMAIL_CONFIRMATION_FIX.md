# ⚡ Quick Fix: "Email not confirmed" Error

## The Problem
You're seeing: **"Signup error: AuthApiError: Email not confirmed"**

## The Solution (2 minutes)

### Step 1: Open Supabase Dashboard
Go to: **https://supabase.com/dashboard**

### Step 2: Navigate to Settings
1. Select your project
2. Click **Authentication** (left sidebar)
3. Click **Providers**
4. Click **Email**

### Step 3: Disable Email Confirmation
1. Find: **"Confirm email"** toggle
2. Turn it **OFF**
3. Click **Save**

### Step 4: Test
1. Return to your app
2. Try signing up again
3. ✅ **It works!**

---

## Visual Guide

```
Supabase Dashboard
    ↓
[Select Project: xxhiqqamjhkhbykmehnr]
    ↓
Authentication (sidebar)
    ↓
Providers
    ↓
Email
    ↓
[Toggle OFF] Confirm email
    ↓
[Click] Save
    ↓
✅ Done!
```

---

## Why This Happens

- Supabase requires email confirmation by default
- We don't have an email server configured yet
- This is normal for development!

## Why This Fix Works

- Disabling email confirmation allows instant signup
- Users can use the app immediately
- Perfect for development and testing

## Production Note

For production apps:
- Configure an SMTP email server
- Re-enable email confirmation
- Users will receive real confirmation emails

---

## Still Having Issues?

See full guide: `/SUPABASE_SETUP.md`

Or contact support with:
- Project ID: `xxhiqqamjhkhbykmehnr`
- Error message: "Email not confirmed"

---

**This is a one-time fix! Once done, signup will work perfectly!** 🚀
