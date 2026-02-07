# 🚀 Vercel Deployment Checklist

Your Stellar Gateway project is now **deployment-ready**! Follow this checklist to deploy to Vercel.

## ✅ Pre-Deployment Checklist

- [x] Google OAuth credentials secured in environment variables
- [x] Vercel configuration file created (`demo/vercel.json`)
- [x] Production environment template created (`.env.production`)
- [x] Next.js config optimized for production
- [x] Node.js version specified (`.nvmrc`)
- [x] Security headers configured
- [x] Build scripts added to package.json
- [x] Deployment documentation created
- [x] MIT License added
- [x] README updated with deploy button

## 📋 Step-by-Step Deployment

### 1. Prepare Google OAuth

**Required before deployment:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. **Important:** Add authorized redirect URIs:
   - For Vercel preview: `https://*.vercel.app/api/auth/callback/google`
   - For production: `https://your-domain.vercel.app/api/auth/callback/google`

### 2. Deploy to Vercel

**Option A: One-Click Deploy (Recommended)**

Click this button: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Adwaitbytes/Stellar-new-project)

**Option B: Manual Deploy**

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to demo folder
cd demo

# Deploy
vercel --prod
```

### 3. Configure Environment Variables in Vercel

In your Vercel project dashboard, add these environment variables:

#### Required Variables:

| Variable | Value | Type |
|----------|-------|------|
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID from GCP Console | Secret |
| `GOOGLE_CLIENT_SECRET` | Your secret from Google Console | Secret |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | Secret |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Secret |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Public |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same as GOOGLE_CLIENT_ID above | Public |

#### Optional Variables (defaults work):

| Variable | Default Value |
|----------|---------------|
| `NEXT_PUBLIC_STELLAR_RPC_URL` | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` |
| `NEXT_PUBLIC_FRIENDBOT_URL` | `https://friendbot.stellar.org` |

### 4. Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

### 5. Verify Deployment

After deployment:

1. ✅ Visit your Vercel URL
2. ✅ Click "Continue with Google"
3. ✅ Complete authentication
4. ✅ Verify wallet dashboard loads
5. ✅ Test sending a transaction
6. ✅ Check Friendbot funded your account

## 🔧 Vercel Project Settings

**Project Configuration:**
- **Framework Preset:** Next.js
- **Root Directory:** `demo`
- **Build Command:** `pnpm build`
- **Output Directory:** `.next`
- **Install Command:** `pnpm install`
- **Node.js Version:** 20.x (auto-detected from `.nvmrc`)

## 🎯 Post-Deployment Tasks

### Update OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click your OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://YOUR-ACTUAL-VERCEL-URL.vercel.app/api/auth/callback/google`
4. Save changes

### Test Authentication Flow

1. Visit your deployed site
2. Click "Continue with Google"
3. Sign in with your Google account
4. Verify redirect works correctly
5. Check wallet dashboard displays

### Optional: Add Custom Domain

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL`
5. Update Google OAuth redirect URI

## 🐛 Troubleshooting

### Error: redirect_uri_mismatch

**Solution:** Your Vercel URL must be added to Google Cloud Console redirect URIs.

1. Copy your Vercel URL (e.g., `https://stellar-gateway.vercel.app`)
2. Go to Google Cloud Console → Credentials
3. Add: `https://your-url.vercel.app/api/auth/callback/google`

### Error: NEXTAUTH_SECRET missing

**Solution:** Add `NEXTAUTH_SECRET` to Vercel environment variables.

```bash
# Generate
openssl rand -base64 32

# Add to Vercel Dashboard → Settings → Environment Variables
```

### Build Fails

**Solution:** Check these:
- Node.js version is 20.x
- All dependencies in package.json
- Build logs in Vercel Dashboard
- Environment variables are set

### OAuth Sign-In Fails

**Solution:**
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check `NEXTAUTH_URL` matches your deployment URL
- Ensure redirect URI is added to Google Console

## 📊 Monitoring

After deployment, monitor:

- **Vercel Analytics:** Traffic and performance
- **Function Logs:** API route executions
- **Error Tracking:** Runtime errors
- **Build Logs:** Deployment status

## 🎉 Success!

Once deployed:

1. ✅ Share your deployed URL
2. ✅ Test with different Google accounts
3. ✅ Monitor for errors
4. ✅ Consider adding custom domain
5. ✅ Set up Vercel Analytics

## 📚 Additional Resources

- [Full Deployment Guide](DEPLOYMENT.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

## 🔒 Security Reminders

- ✅ Never commit `.env` files with secrets
- ✅ Use Vercel environment variables for all secrets
- ✅ Only `NEXT_PUBLIC_*` variables are exposed to browser
- ✅ Rotate `NEXTAUTH_SECRET` periodically
- ✅ Monitor OAuth application for suspicious activity

## 📞 Need Help?

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide
- Review Vercel deployment logs
- Check browser console for errors
- Verify all environment variables are set

---

**Your project is ready to deploy! 🚀**

Click the deploy button above or run `vercel --prod` in the demo folder.
