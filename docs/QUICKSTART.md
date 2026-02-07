# 🚀 Quick Start - Deploy in 5 Minutes

## Your Project is Ready! 🎉

Everything is configured for Vercel deployment. Just follow these 3 steps:

---

## Step 1: Get Your Google Client Secret

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Copy the **Client Secret** (format: `GOCSPX-...`)
4. Keep it handy for Step 2

---

## Step 2: Deploy to Vercel (Click Button)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Adwaitbytes/Stellar-new-project&project-name=stellar-gateway&repository-name=stellar-gateway&root-directory=demo)

**During deployment, you'll be asked for environment variables:**

| Variable | What to Enter |
|----------|---------------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID from GCP Console |
| `GOOGLE_CLIENT_SECRET` | Paste your secret from Step 1 |
| `NEXTAUTH_SECRET` | Click "Generate" button in Vercel |
| `NEXTAUTH_URL` | Leave blank (Vercel auto-fills) |
| `NEXT_PUBLIC_APP_URL` | Leave blank (Vercel auto-fills) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same as `GOOGLE_CLIENT_ID` above |

---

## Step 3: Update Google OAuth Redirect

**After deployment completes:**

1. Copy your Vercel URL (shown after deployment)
2. Go back to: https://console.cloud.google.com/apis/credentials
3. Click your OAuth Client ID
4. Under "Authorized redirect URIs", click **"+ ADD URI"**
5. Paste: `https://YOUR-VERCEL-URL.vercel.app/api/auth/callback/google`
6. Click **Save**

---

## ✅ Done! Test Your App

1. Visit your Vercel URL
2. Click "Continue with Google"
3. Sign in
4. Your wallet is created! 🎉

---

## 🔧 Alternative: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to demo folder
cd demo

# Login
vercel login

# Deploy
vercel --prod
```

Then manually add environment variables in Vercel Dashboard.

---

## 🆘 Having Issues?

### "redirect_uri_mismatch" Error
→ Did you add the redirect URI to Google Console? (Step 3)

### Can't Sign In
→ Check your `GOOGLE_CLIENT_SECRET` is correct in Vercel environment variables

### Build Failed
→ Check deployment logs in Vercel Dashboard

---

## 📚 Full Documentation

- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Complete deployment checklist
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Detailed deployment guide
- **[README.md](README.md)** - Project overview

---

## 🎯 What You Get

✅ Live demo at your-app.vercel.app  
✅ OAuth-based Stellar wallet  
✅ Sign in with Google (no seed phrases!)  
✅ Send/receive XLM on testnet  
✅ Auto SSL certificate  
✅ Global CDN deployment  

---

**Ready? Click the Deploy button above! 🚀**