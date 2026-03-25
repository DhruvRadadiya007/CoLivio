# 📧 CoLivio - Email Configuration & Password Reset Setup Guide

## Overview

This guide will help you set up email functionality in your CoLivio app, including:
- ✅ Email confirmation for new signups
- ✅ Password reset functionality  
- ✅ Email change verification

---

## 🎯 Quick Start: Choose Your Email Provider

### Option 1: Gmail (Easiest for Testing)
### Option 2: SendGrid (Best for Production)
### Option 3: Resend (Modern Alternative)
### Option 4: Custom SMTP Server

---

## 📧 Option 1: Gmail Setup (For Testing)

### Step 1: Generate App Password

1. **Go to Google Account Settings**
   - Visit: https://myaccount.google.com/security
   - Click "2-Step Verification" (enable if not already)

2. **Create App Password**
   - Scroll to "App passwords"
   - Select app: "Mail"
   - Select device: "Other" → Name it "CoLivio"
   - Click "Generate"
   - **Copy the 16-character password** (you'll need this!)

### Step 2: Configure Supabase

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/xxhiqqamjhkhbykmehnr
   ```

2. **Navigate to Settings**
   ```
   Settings → Authentication → Email Templates
   ```

3. **Configure SMTP**
   Click "SMTP Settings" and enter:
   
   ```
   SMTP Host:     smtp.gmail.com
   SMTP Port:     587
   SMTP User:     your-email@gmail.com
   SMTP Password: [16-character app password]
   Sender Email:  your-email@gmail.com
   Sender Name:   CoLivio
   ```

4. **Click "Save"**

### Step 3: Enable Email Confirmation

1. **Go to:** Authentication → Providers → Email
2. **Enable these settings:**
   - ✅ Enable email provider
   - ✅ Confirm email
   - ✅ Secure email change (optional)
3. **Click "Save"**

### Step 4: Test

1. Sign up with a new account in your app
2. Check your email for confirmation link
3. Click the link to confirm
4. ✅ Done!

**Limitations:**
- Gmail has daily sending limits (~500 emails/day)
- Not recommended for production
- Good for development/testing

---

## 📧 Option 2: SendGrid Setup (Production Recommended)

### Step 1: Create SendGrid Account

1. **Sign up:** https://signup.sendgrid.com/
2. **Verify your email**
3. **Go to dashboard:** https://app.sendgrid.com/

### Step 2: Create API Key

1. **Navigate to:**
   ```
   Settings → API Keys → Create API Key
   ```

2. **Create Key:**
   - Name: "CoLivio SMTP"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Click "Create & View"
   - **Copy the API key** (you won't see it again!)

### Step 3: Verify Sender Identity

1. **Go to:** Settings → Sender Authentication
2. **Click "Verify a Single Sender"**
3. **Fill in details:**
   - From Name: CoLivio
   - From Email: noreply@yourdomain.com (or your email)
   - Reply To: support@yourdomain.com
   - Company Address: Your address
4. **Click "Create"**
5. **Check email and click verification link**

### Step 4: Configure Supabase

1. **Go to:** Supabase Dashboard → Settings → Authentication
2. **SMTP Settings:**
   ```
   SMTP Host:     smtp.sendgrid.net
   SMTP Port:     587
   SMTP User:     apikey
   SMTP Password: [Your SendGrid API Key]
   Sender Email:  noreply@yourdomain.com (must be verified)
   Sender Name:   CoLivio
   ```

### Step 5: Enable Email Confirmation

Same as Gmail option above.

**Benefits:**
- ✅ 100 emails/day free
- ✅ Reliable delivery
- ✅ Email analytics
- ✅ Production-ready

---

## 📧 Option 3: Resend Setup (Modern Alternative)

### Step 1: Create Resend Account

1. **Sign up:** https://resend.com/signup
2. **Verify email**
3. **Go to dashboard**

### Step 2: Get API Key

1. **Navigate to:** API Keys
2. **Click "Create API Key"**
3. **Name:** "CoLivio"
4. **Copy the key**

### Step 3: Verify Domain (Optional but recommended)

1. **Go to:** Domains → Add Domain
2. **Enter your domain:** yourdomain.com
3. **Add DNS records** as shown
4. **Wait for verification**

### Step 4: Configure Supabase

Resend uses their API, not traditional SMTP. You'll need to use Supabase Edge Functions:

1. Create a custom email function (see "Custom Email Integration" below)
2. Or use Resend's SMTP (if available in your plan)

**Benefits:**
- ✅ Modern API
- ✅ 3,000 emails/month free
- ✅ Simple integration
- ✅ Great developer experience

---

## 🔧 Supabase Email Configuration

### Enable Features in Supabase

**Go to:** Authentication → Providers → Email

#### Basic Settings
```
☑ Enable email provider              (Must be ON)
☑ Confirm email                       (ON for production)
☑ Secure email change                 (ON for production)
☐ Double confirm email changes        (Optional)
```

#### URL Configuration
```
Site URL:           https://yourdomain.com (or http://localhost:5173 for dev)
Redirect URLs:      https://yourdomain.com/**
                    http://localhost:5173/**
```

---

## 📝 Customize Email Templates

### Go to: Authentication → Email Templates

### 1. Confirm Signup Template

```html
<h2>Welcome to CoLivio!</h2>
<p>Thanks for signing up. Please confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
<p>Or copy this link:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 2. Reset Password Template

```html
<h2>Reset your CoLivio password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>Or copy this link:</p>
<p>{{ .ConfirmationURL }}</p>
```

### 3. Invite User Template

```html
<h2>You've been invited to join a room on CoLivio!</h2>
<p>Click the link below to accept the invitation:</p>
<p><a href="{{ .ConfirmationURL }}">Accept invitation</a></p>
```

### 4. Magic Link Template

```html
<h2>Your CoLivio magic link</h2>
<p>Click this link to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to CoLivio</a></p>
<p>This link expires in 60 minutes.</p>
```

---

## 🔐 Implement Password Reset in CoLivio

### Update ForgotPassword Component

<function_calls>
<invoke name="read">
<parameter name="path">/src/app/components/auth/ForgotPassword.tsx