# Fix Google OAuth "Access Blocked" Error

## The Problem

Error: **"Stellar gateway has not completed the Google verification process"**

This happens because your OAuth app is in "Testing" mode and only whitelisted users can access it.

## Solution: Add Test Users

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Select your project (or create one if you don't have it)

### Step 2: Navigate to OAuth Consent Screen

1. In the left sidebar, click **APIs & Services**
2. Click **OAuth consent screen**
3. You'll see your app status: **"Testing"**

### Step 3: Add Test Users

1. Scroll down to **"Test users"** section
2. Click **"+ ADD USERS"** button
3. Add your email: **your-email@gmail.com**
4. Click **"SAVE"**

### Step 4: Add More Test Users (Optional)

Add any other emails you want to test with:
- Your work email
- Your partner's email
- Your developer team emails

### Step 5: Save and Test

1. Click **"SAVE AND CONTINUE"** at the bottom
2. Wait 5 minutes for changes to propagate
3. Try signing in again at: http://localhost:3000/zk-multi-custody

---

## Alternative Solutions

### Option A: Publish the App (Not Recommended Yet)

**Steps:**
1. OAuth consent screen → Click **"PUBLISH APP"**
2. Google will review your app (can take days/weeks)
3. Requires verification for sensitive scopes

**Warning**: Don't do this until you're ready for production!

### Option B: Use Internal App Type (For Google Workspace)

If you have a Google Workspace account:
1. OAuth consent screen → Edit app
2. Change **User Type** to **"Internal"**
3. Only users in your Workspace can access
4. No test user restrictions

---

## Quick Fix Commands (If You Have gcloud CLI)

```bash
# Add test user via gcloud
gcloud auth login
gcloud projects list
gcloud config set project <your-project-id>

# Then add user through console (no CLI command for test users)
```

---

## What You'll See After Fixing

Before:
```
❌ Access blocked: Stellar gateway has not completed verification
❌ Error 403: access_denied
```

After:
```
✅ Google OAuth consent screen
✅ "Stellar Gateway wants to access your Google Account"
✅ [Continue] button works
```

---

## Common Mistakes

### ❌ Wrong: Publishing app immediately
- Takes weeks to verify
- Not necessary for development

### ❌ Wrong: Creating new Google account
- Wastes time
- Still need to whitelist

### ✅ Right: Add test users
- Takes 30 seconds
- No verification needed
- Perfect for development

---

## Current OAuth Configuration

Your app details:
- **Client ID**: `your-google-client-id.apps.googleusercontent.com`
- **Status**: Testing mode
- **Scopes**: openid, email, profile, drive.appdata
- **Test Users**: Currently empty (needs your email)

---

## Step-by-Step Video Guide

Can't find the settings? Here's exactly where to click:

1. **Google Cloud Console**: https://console.cloud.google.com
2. **Left menu** → APIs & Services (icon looks like a plug)
3. **OAuth consent screen** (in the APIs & Services submenu)
4. Scroll down → **Test users** section
5. **+ ADD USERS** button
6. Enter email → **SAVE**
7. Done! Wait 5 minutes and try again

---

## Need Help?

If you still get errors after adding test users:

1. **Clear browser cache** and try again
2. **Try incognito mode** (Ctrl+Shift+N)
3. **Wait 10 minutes** for Google's changes to propagate
4. **Check the correct Google account** is being used

---

## For ZK Multi-Custody Wallet

You need to add **3 different emails** as test users:
- Your personal Gmail (Guardian 1)
- Your work Gmail or secondary account (Guardian 2)
- Your partner/family member's Gmail (Guardian 3)

Add all 3 emails to test users list to test the multi-custody flow!
