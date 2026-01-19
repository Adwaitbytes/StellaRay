# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Google OAuth credentials configured
3. Stellar testnet account for contract deployment

## Step 1: Prepare Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your project or create a new one
3. Go to "Credentials" → "OAuth 2.0 Client IDs"
4. Add authorized redirect URI: `https://your-app-name.vercel.app/api/auth/callback/google`
5. Note your Client ID and Client Secret

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to demo directory
cd demo

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Set root directory to `demo`
6. Configure environment variables (see below)
7. Click "Deploy"

## Step 3: Configure Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

### Required Variables:

```env
# Google OAuth (Secret - from Google Cloud Console)
GOOGLE_CLIENT_ID=your-actual-client-id
GOOGLE_CLIENT_SECRET=your-actual-client-secret

# NextAuth Configuration
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret

# Public Variables (will be embedded in frontend)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_FRIENDBOT_URL=https://friendbot.stellar.org
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-client-id
```

### Generate NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

Or use: https://generate-secret.vercel.app/32

## Step 4: Update Google OAuth Redirect URI

After deployment, update your Google OAuth settings:

1. Go back to Google Cloud Console
2. Update authorized redirect URIs to include:
   - `https://your-actual-vercel-domain.vercel.app/api/auth/callback/google`

## Step 5: Test Your Deployment

1. Visit your deployed site: `https://your-app.vercel.app`
2. Click "Continue with Google"
3. Authenticate with your Google account
4. Verify wallet creation and dashboard access

## Vercel Project Settings

### Root Directory
Set to: `demo`

### Build Command
```bash
pnpm build
```

### Output Directory
```bash
.next
```

### Install Command
```bash
pnpm install
```

### Node.js Version
Use Node.js 20.x or higher (set in Vercel project settings)

## Environment Variables Configuration

| Variable | Type | Description |
|----------|------|-------------|
| `GOOGLE_CLIENT_ID` | Secret | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Secret | Google OAuth Client Secret |
| `NEXTAUTH_URL` | Secret | Your production URL |
| `NEXTAUTH_SECRET` | Secret | Random 32-byte string |
| `NEXT_PUBLIC_*` | Public | All public variables safe to expose |

## Monitoring

- View deployment logs in Vercel Dashboard
- Monitor errors with Vercel Analytics
- Check function logs for serverless API routes

## Troubleshooting

### OAuth Error: redirect_uri_mismatch
- Ensure your Vercel domain is added to Google Cloud Console
- Check that NEXTAUTH_URL matches your Vercel domain

### Build Failures
- Check Node.js version (should be 20+)
- Verify all dependencies are in package.json
- Check build logs in Vercel Dashboard

### Environment Variables Not Working
- Public variables must start with `NEXT_PUBLIC_`
- Redeploy after changing environment variables
- Clear build cache if needed

## Production Checklist

- [ ] Google OAuth redirect URIs updated
- [ ] All environment variables set in Vercel
- [ ] NEXTAUTH_SECRET generated and set
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Test wallet creation flow
- [ ] Test transaction sending
- [ ] Monitor error logs

## Custom Domain (Optional)

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` to your custom domain
5. Update Google OAuth redirect URIs

## Support

For issues:
- Check Vercel deployment logs
- Review Google OAuth configuration
- Verify environment variables are set correctly
- Check browser console for errors

## Notes

- This demo uses Stellar Testnet (no real funds)
- Wallets are deterministically generated from Google user ID
- All transactions are on testnet only
- For production, implement proper zkLogin with ZK proofs
