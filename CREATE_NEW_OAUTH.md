# Create NEW Google OAuth App (5 minutes)

## If your old project is inaccessible, create a fresh one:

### Step 1: Create New Project
1. Go to: https://console.cloud.google.com/projectcreate
2. Project name: `StellaRay-Dev`
3. Click **CREATE**

### Step 2: Enable Google+ API
1. Go to: https://console.cloud.google.com/apis/library/plus.googleapis.com
2. Click **ENABLE**

### Step 3: Create OAuth Consent Screen
1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Choose **External** user type
3. Click **CREATE**

**Fill in:**
- App name: `StellaRay Wallet`
- User support email: `your-email@gmail.com`
- Developer contact: `your-email@gmail.com`
- Click **SAVE AND CONTINUE**

**Scopes:**
- Click **ADD OR REMOVE SCOPES**
- Select: `openid`, `email`, `profile`, `drive.appdata`
- Click **UPDATE**
- Click **SAVE AND CONTINUE**

**Test users:**
- Click **+ ADD USERS**
- Add: `tripathiyatharth257@gmail.com`
- Add any other emails you want to test
- Click **SAVE AND CONTINUE**

### Step 4: Create OAuth Client ID
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `StellaRay Web Client`
5. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://localhost:3001`
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google`
7. Click **CREATE**

### Step 5: Copy Credentials
You'll see:
- **Client ID**: `123456789-abc.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xyz123`

### Step 6: Update .env File
Replace in `demo/.env`:

```bash
GOOGLE_CLIENT_ID=<your-new-client-id>
GOOGLE_CLIENT_SECRET=<your-new-client-secret>
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-new-client-id>
```

### Step 7: Restart Server
```bash
# Stop current server (Ctrl+C)
cd demo
pnpm dev
```

### Step 8: Test
Visit: http://localhost:3000/zk-multi-custody
Click "Sign in with Google" - Should work now!

---

## Still Getting Errors?

### Clear browser data:
1. Press `Ctrl+Shift+Delete`
2. Select "Cookies and site data"
3. Select "Cached images and files"
4. Click "Clear data"

### Try incognito:
1. Press `Ctrl+Shift+N`
2. Go to: http://localhost:3000/zk-multi-custody
3. Try signing in

---

## Why This Happens

Your old OAuth app might be:
- In a deleted/suspended project
- Not accessible to your account
- Misconfigured

Creating a fresh OAuth app takes 5 minutes and guarantees it works!
