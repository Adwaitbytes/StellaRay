# CRITICAL: Set these environment variables in Vercel Dashboard before deploying

## Required Environment Variables

### 1. GOOGLE_CLIENT_ID
```
138834794677-pdn6lifgvg8jc6mrdjurumoujk5cj689.apps.googleusercontent.com
```

### 2. GOOGLE_CLIENT_SECRET
```
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
```

### 3. NEXTAUTH_SECRET
Generate a new one:
```bash
openssl rand -base64 32
```
Or use: https://generate-secret.vercel.app/32

### 4. NEXTAUTH_URL
Your Vercel deployment URL (Vercel will auto-populate this)

### 5. NEXT_PUBLIC_GOOGLE_CLIENT_ID
```
138834794677-pdn6lifgvg8jc6mrdjurumoujk5cj689.apps.googleusercontent.com
```

---

## How to Add in Vercel:

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add each variable above
4. Select "Production", "Preview", and "Development"
5. Save and redeploy

## After Deployment:

1. Copy your Vercel URL
2. Go to: https://console.cloud.google.com/apis/credentials
3. Click your OAuth Client ID
4. Add redirect URI: `https://YOUR-URL.vercel.app/api/auth/callback/google`
5. Save

---

Your app will work after these steps!
