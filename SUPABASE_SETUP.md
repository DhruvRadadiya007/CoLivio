# 🔧 Supabase Setup Guide for Colivio

## ⚡ Quick Fix: Disable Email Confirmation

The **"Email not confirmed"** error happens because Supabase requires email verification by default, but we don't have an email server configured.

### Solution: Disable Email Confirmation (2 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `xxhiqqamjhkhbykmehnr`

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Providers** (under Configuration)
   - Click on **Email** provider

3. **Disable Email Confirmation**
   - Find the setting: **"Confirm email"**
   - Toggle it **OFF** (disable it)
   - Click **Save** at the bottom

4. **Test Signup**
   - Return to your Colivio app
   - Try signing up again
   - ✅ It should work now!

---

## 🎯 Visual Guide

### Step-by-Step Screenshots Path:

```
Dashboard
  └─ Select Project: xxhiqqamjhkhbykmehnr
      └─ Authentication (left sidebar)
          └─ Providers
              └─ Email
                  └─ [Toggle OFF] Confirm email
                  └─ [Click] Save
```

### Settings to Configure:

| Setting | Value | Why |
|---------|-------|-----|
| **Confirm email** | ❌ OFF | No email server configured |
| **Enable email provider** | ✅ ON | Required for email/password auth |
| **Double confirm email changes** | ❌ OFF | Not needed for development |
| **Secure email change** | ❌ OFF | Not needed for development |

---

## 🔍 Troubleshooting

### Issue 1: Still Getting "Email not confirmed"

**Check:**
1. Did you save the settings?
2. Are you on the correct project? (`xxhiqqamjhkhbykmehnr`)
3. Try hard refresh (Ctrl+Shift+R)
4. Clear browser cache and try again

**Fix:**
```bash
# Clear browser data:
# 1. Open DevTools (F12)
# 2. Right-click Refresh button
# 3. Select "Empty Cache and Hard Reload"
```

### Issue 2: Can't Find the Setting

**If you don't see "Confirm email" toggle:**
1. Make sure you're in: **Authentication** → **Providers** → **Email**
2. Scroll down - the setting might be below the fold
3. Try a different browser if the UI is glitchy

### Issue 3: Setting Resets Automatically

**This shouldn't happen, but if it does:**
1. Check your Supabase plan (some features require paid plans)
2. Contact Supabase support
3. Or use the alternative solution below

---

## 🔐 Alternative Solutions

### Option A: Use Dashboard SQL Editor (Advanced)

If the UI doesn't work, you can disable email confirmation via SQL:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query:
```sql
-- Check current settings
SELECT * FROM auth.config;

-- Note: This table may not exist in newer Supabase versions
-- Email confirmation is controlled via Dashboard settings only
```

**Note:** Email confirmation is controlled through the Dashboard UI, not SQL.

### Option B: Use a Temporary Email Service

If you can't disable email confirmation:

1. Keep email confirmation enabled
2. Use a temporary email service for testing:
   - https://temp-mail.org
   - https://10minutemail.com
   - https://guerrillamail.com

3. Sign up with temp email
4. Check temp email inbox for confirmation link
5. Click the link to confirm

**Downsides:**
- Tedious for testing
- Emails expire
- Not suitable for development

### Option C: Configure Email Server (Production)

For production, you should configure a real email server:

1. **Go to:** Authentication → Email Templates
2. **Configure SMTP:**
   - SMTP Host: `smtp.gmail.com` (or your provider)
   - SMTP Port: `587`
   - SMTP User: Your email
   - SMTP Password: App-specific password

3. **Supported providers:**
   - Gmail
   - SendGrid
   - Mailgun
   - AWS SES
   - Postmark

4. **Enable email confirmation**
   - This is the proper production setup
   - Users will receive actual confirmation emails

---

## 🎨 Recommended Settings for Development

### Authentication → Providers → Email

| Setting | Development | Production |
|---------|-------------|------------|
| Enable email provider | ✅ ON | ✅ ON |
| Confirm email | ❌ OFF | ✅ ON |
| Double confirm email | ❌ OFF | ✅ ON |
| Secure email change | ❌ OFF | ✅ ON |

### Authentication → Policies

| Setting | Development | Production |
|---------|-------------|------------|
| Site URL | `http://localhost:3000` | `https://yourdomain.com` |
| Redirect URLs | `http://localhost:3000/**` | `https://yourdomain.com/**` |

### Authentication → URL Configuration

| Field | Value |
|-------|-------|
| Site URL | Your app URL (e.g., `http://localhost:5173` for Vite) |
| Redirect URLs | Add your app URL |

---

## 📋 Complete Setup Checklist

### Initial Setup (One-time):
- [ ] Create Supabase project
- [ ] Note project ID: `xxhiqqamjhkhbykmehnr`
- [ ] Get API keys (already configured)
- [ ] Disable email confirmation (see above)
- [ ] Set Site URL
- [ ] Add Redirect URLs

### Testing:
- [ ] Sign up with test account
- [ ] Verify account created
- [ ] Log out
- [ ] Log back in
- [ ] Create a room
- [ ] Add some data
- [ ] Verify data persists

### Production (When Ready):
- [ ] Configure SMTP email server
- [ ] Enable email confirmation
- [ ] Enable double confirm email
- [ ] Enable secure email change
- [ ] Set production Site URL
- [ ] Set production Redirect URLs
- [ ] Deploy Edge Function (optional)
- [ ] Test complete flow

---

## 🚨 Common Mistakes

### ❌ Mistake 1: Wrong Project
**Error:** Settings don't affect your app

**Fix:** Make sure you're configuring project `xxhiqqamjhkhbykmehnr`

### ❌ Mistake 2: Didn't Save
**Error:** Changes don't take effect

**Fix:** Always click **Save** after making changes

### ❌ Mistake 3: Browser Cache
**Error:** Old settings still active

**Fix:** Hard refresh or clear cache

### ❌ Mistake 4: Wrong Provider
**Error:** Configuring Google/Github instead of Email

**Fix:** Make sure you're in **Email** provider settings

---

## ✅ Verification Steps

### Test 1: Check Settings
1. Go to Authentication → Providers → Email
2. Verify "Confirm email" is OFF
3. Verify "Enable email provider" is ON

### Test 2: Sign Up
1. Go to your app's signup page
2. Fill in the form:
   - Name: Test User
   - Email: test@example.com
   - Password: Test1234
3. Click "Sign Up"
4. ✅ Should succeed and log you in

### Test 3: Check User Created
1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. You should see your test user
4. Email should be `test@example.com`
5. Status should be **Confirmed** (or no warning)

### Test 4: Login
1. Log out of the app
2. Go to login page
3. Enter same credentials
4. ✅ Should log you in successfully

---

## 📊 What Each Setting Does

### Confirm Email
- **OFF (Development):** Users can sign up and use the app immediately
- **ON (Production):** Users must click email link to activate account

**Why OFF for development:**
- No email server needed
- Faster testing
- No inbox checking required

### Double Confirm Email
- **OFF:** Email change happens immediately
- **ON:** User must confirm new email address

### Secure Email Change
- **OFF:** Email can be changed without current password
- **ON:** Requires password to change email

### Enable Email Provider
- **ON:** Users can sign up with email/password
- **OFF:** Email/password signup disabled

**Must be ON for Colivio to work!**

---

## 🔄 Migration Plan

### From Development to Production

1. **Phase 1: Configure Email**
   ```
   Set up SMTP server
   Test email sending
   Verify email templates
   ```

2. **Phase 2: Enable Confirmation**
   ```
   Enable "Confirm email"
   Enable "Double confirm email"
   Enable "Secure email change"
   ```

3. **Phase 3: Migrate Users**
   ```
   Export existing users
   Mark all as confirmed
   Or ask users to re-verify
   ```

4. **Phase 4: Test**
   ```
   Test signup flow
   Test email delivery
   Test confirmation links
   Test login after confirmation
   ```

---

## 💡 Pro Tips

1. **Use Test Accounts**
   - Create `test1@example.com`, `test2@example.com`, etc.
   - Keep them for repeated testing
   - Delete when done

2. **Check User List**
   - Authentication → Users shows all accounts
   - You can manually delete test accounts
   - You can see last sign in time

3. **Monitor Auth Logs**
   - Authentication → Logs shows all auth events
   - Helpful for debugging
   - Shows failed login attempts

4. **Set Password Requirements**
   - Authentication → Policies
   - Set minimum password length
   - Require special characters

5. **Rate Limiting**
   - Supabase automatically rate limits auth attempts
   - Prevents brute force attacks
   - Adjust in settings if needed

---

## 🎉 Success!

After following this guide:
- ✅ Email confirmation is disabled
- ✅ Users can sign up immediately
- ✅ No email server needed
- ✅ Perfect for development
- ✅ Ready to test Colivio

**Next Steps:**
1. Test signup with a new account
2. Test all features
3. When ready for production, configure email server
4. Re-enable email confirmation for production

---

## 📞 Need More Help?

- **Supabase Docs:** https://supabase.com/docs/guides/auth
- **Supabase Discord:** https://discord.supabase.com
- **Colivio Docs:** See `/FIXED_SOLUTION.md`

---

**This is a one-time setup. Once configured, you won't need to do it again!** 🚀

*Last Updated: March 25, 2026*
*Tested with Supabase Platform Version: Latest*
