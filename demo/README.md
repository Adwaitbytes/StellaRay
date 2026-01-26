# Stellar Gateway - Quick Setup

## Local Development

```bash
cd demo
pnpm install
pnpm dev
```

Visit http://localhost:3000

## Vercel Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Adwaitbytes/Stellar-new-project&project-name=stellar-gateway&repository-name=stellar-gateway&root-directory=demo&env=GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,NEXTAUTH_SECRET,NEXTAUTH_URL,NEXT_PUBLIC_APP_URL,NEXT_PUBLIC_GOOGLE_CLIENT_ID)

### Environment Variables Required:

1. `GOOGLE_CLIENT_ID` - From Google Cloud Console
2. `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
3. `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
4. `NEXTAUTH_URL` - Your Vercel deployment URL
5. `NEXT_PUBLIC_APP_URL` - Your Vercel deployment URL
6. `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Same as GOOGLE_CLIENT_ID

### After Deployment:

1. Update Google OAuth redirect URIs with your Vercel domain
2. Add: `https://your-app.vercel.app/api/auth/callback/google`
3. Test the authentication flow

## Project Structure

```
demo/                    # Next.js demo application
├── src/
│   ├── app/            # App router pages
│   │   ├── page.tsx    # Landing page
│   │   ├── dashboard/  # Wallet dashboard
│   │   └── api/        # API routes
│   └── lib/            # Utility functions
├── public/             # Static assets
└── .env.production     # Production environment template
```

## Features

✅ OAuth-based wallet creation (Google Sign-In)  
✅ Stellar testnet integration  
✅ View XLM balance  
✅ Send transactions  
✅ Transaction history  
✅ Deterministic wallet generation  
✅ Responsive design  
✅ Production-ready configuration  

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Blockchain:** Stellar (Testnet)
- **Auth:** NextAuth.js
- **Styling:** TailwindCSS
- **Deployment:** Vercel
- **Icons:** Lucide React

## Security Notes

- OAuth credentials stored as Vercel environment variables
- Client ID is public, client secret is private
- Testnet only (no real funds at risk)
- Wallets deterministically generated from Google user ID

## Support

For deployment issues, check [DEPLOYMENT.md](DEPLOYMENT.md)
