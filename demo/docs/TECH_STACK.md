# STELLARAY - Complete Technology Stack

> A comprehensive guide to every technology, protocol, library, and system used in the Stellaray application.

---

## Table of Contents

1. [Core Framework & Runtime](#1-core-framework--runtime)
2. [Blockchain & Stellar Ecosystem](#2-blockchain--stellar-ecosystem)
3. [Zero-Knowledge Cryptography](#3-zero-knowledge-cryptography)
4. [X-Ray Protocol](#4-x-ray-protocol-stellar-native-zk)
5. [Smart Contracts](#5-smart-contracts-soroban)
6. [Authentication & Security](#6-authentication--security)
7. [Database & Storage](#7-database--storage)
8. [Styling & Design System](#8-styling--design-system)
9. [Typography & Fonts](#9-typography--fonts)
10. [Icons & Graphics](#10-icons--graphics)
11. [Image & Media](#11-image--media)
12. [External APIs & Data Sources](#12-external-apis--data-sources)
13. [API Routes](#13-api-routes-backend)
14. [State Management](#14-state-management)
15. [Deployment & Infrastructure](#15-deployment--infrastructure)
16. [SEO & Social](#16-seo--social)
17. [Twitter Integration](#17-twitter-integration)
18. [Analytics & Tracking](#18-analytics--tracking)
19. [Custom Systems](#19-custom-systems-built)
20. [Animations & Effects](#20-animations--effects)
21. [Development Tools](#21-development-tools)
22. [Security Features](#22-security-features)
23. [Performance Optimizations](#23-performance-optimizations)

---

## 1. Core Framework & Runtime

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.3.8 | React framework with App Router, Server Components, API Routes, ISR/SSR |
| **React** | 18.3.1 | UI component library with hooks, concurrent rendering |
| **TypeScript** | 5.9.3 | Static typing, better IDE support, compile-time error catching |
| **Node.js** | 20.x | JavaScript runtime for server-side code |

### Why Next.js?
- **App Router**: File-based routing with layouts, loading states, error boundaries
- **Server Components**: Better performance, reduced client-side JavaScript
- **API Routes**: Backend endpoints without separate server
- **Image Optimization**: Automatic WebP conversion, lazy loading
- **Edge Runtime**: Low-latency serverless functions

---

## 2. Blockchain & Stellar Ecosystem

| Technology | Version/Type | Purpose |
|------------|--------------|---------|
| **Stellar Network** | Testnet + Mainnet | Layer 1 blockchain for fast, low-cost transactions |
| **@stellar/stellar-sdk** | 12.3.0 | Official SDK for Horizon API, transaction building, account management |
| **Stellar Horizon API** | REST API | Query blockchain state, account balances, transaction history |
| **Soroban** | Smart Contracts | Stellar's WASM-based smart contract platform |
| **Soroban RPC** | JSON-RPC | Interact with Soroban smart contracts |
| **Friendbot** | Testnet Faucet | Fund test accounts with 10,000 XLM |

### Network Configuration
```typescript
// Testnet
horizonUrl: "https://horizon-testnet.stellar.org"
rpcUrl: "https://soroban-testnet.stellar.org"
friendbotUrl: "https://friendbot.stellar.org"

// Mainnet
horizonUrl: "https://horizon.stellar.org"
rpcUrl: "https://soroban.stellar.org"
```

---

## 3. Zero-Knowledge Cryptography

| Technology | Type | Purpose |
|------------|------|---------|
| **@stellar-zklogin/sdk** | 2.0.0 | ZK proof generation for OAuth-based wallet creation |
| **zkLogin Protocol** | ZK Circuit | Proves Google identity ownership without revealing user data |
| **Groth16** | ZK Proof System | Efficient zkSNARK proving system for verification |
| **BN254 Curve** | Elliptic Curve | Pairing-friendly curve for ZK proof operations |
| **Poseidon Hash** | ZK-Friendly Hash | Hash function optimized for ZK circuits |

### How zkLogin Works
1. User signs in with Google OAuth
2. SDK generates a ZK proof that proves:
   - User owns the Google account
   - Without revealing email, sub ID, or any PII
3. Proof is verified on-chain via X-Ray Protocol
4. Deterministic wallet address derived from proof

---

## 4. X-Ray Protocol (Stellar Native ZK)

X-Ray Protocol provides native host functions for zero-knowledge operations on Stellar, enabling efficient on-chain proof verification.

| Component | Purpose |
|-----------|---------|
| **X-Ray Protocol** | Stellar's native host functions for ZK operations |
| **BN254 Host Functions** | Native elliptic curve operations (G1 add, G1 mul, pairing) |
| **Poseidon Permutation** | Native ZK-friendly hashing |
| **Groth16 Verifier** | On-chain proof verification |
| **Multi-Pairing Check** | Batch verification of multiple proofs |

### X-Ray Operations Tracked

| Operation | Gas Cost | Description |
|-----------|----------|-------------|
| `proof_verified` | ~260,000 | Groth16 proof verification |
| `pairing_check` | ~150,000 | Multi-pairing operations |
| `poseidon_hash` | ~50,000 | Poseidon permutation calls |
| `g1_scalar_mul` | ~45,000 | G1 scalar multiplication |
| `g1_addition` | ~15,000 | G1 point addition |

### Gas Savings vs WASM
X-Ray native operations provide **85-95% gas savings** compared to WASM implementations:
- Groth16 Verify: 260K (X-Ray) vs 2.1M (WASM)
- Pairing Check: 150K (X-Ray) vs 1.8M (WASM)
- Poseidon Hash: 50K (X-Ray) vs 420K (WASM)

---

## 5. Smart Contracts (Soroban)

| Contract | Contract ID | Purpose |
|----------|-------------|---------|
| **ZK Verifier** | `CDAQXHNK2HZJ...` | Validates zkLogin proofs on-chain |
| **Smart Wallet** | WASM Hash | User wallet with zkLogin authentication |
| **Gateway Factory** | `CAAOQR7L5UVV...` | Deploys and manages smart wallets |
| **JWK Registry** | `CAMO5LYOANZW...` | Stores OAuth provider public keys |
| **x402 Facilitator** | `CDJMT4P4DUZV...` | Handles micropayments |
| **USDC Contract** | Configurable | Stellar USDC token operations |

### Contract Interactions
```typescript
// Check if wallet exists
await GatewayFactory.walletExists(addressSeed);

// Predict wallet address
await GatewayFactory.predictAddress(issHash, addressSeed);

// Get all OAuth providers
await JWKRegistry.getAllProviders();

// Check payment status
await X402Facilitator.isPaid(requestId);
```

---

## 6. Authentication & Security

| Technology | Version | Purpose |
|------------|---------|---------|
| **NextAuth.js** | 4.24.7 | Authentication framework for Next.js |
| **Google OAuth 2.0** | Provider | Social login via Google accounts |
| **JWT Tokens** | Auth | Session management with access & ID tokens |
| **CSRF Protection** | NextAuth | Built-in cross-site request forgery protection |
| **Web Crypto API** | Native | SHA-256 hashing for address derivation |

### OAuth Flow
```
User clicks "Sign in with Google"
    ↓
Google OAuth consent screen
    ↓
Receive ID token with sub claim
    ↓
Generate ZK proof of identity
    ↓
Derive deterministic wallet address
    ↓
User has self-custody wallet
```

---

## 7. Database & Storage

| Technology | Type | Purpose |
|------------|------|---------|
| **Neon Database** | Serverless PostgreSQL | Primary database for waitlist, analytics |
| **@neondatabase/serverless** | 0.10.4 | HTTP-based PostgreSQL client for edge/serverless |
| **PostgreSQL** | RDBMS | Relational data storage |
| **JSONB** | Data Type | Flexible JSON storage for analytics events |
| **localStorage** | Browser | Client-side persistence for quests, referrals |

### Database Schema

#### `waitlist` Table
```sql
CREATE TABLE waitlist (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(100) DEFAULT 'website',
  referrer TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  user_agent TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(100),
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  referral_code VARCHAR(50) UNIQUE,
  referred_by VARCHAR(50),
  referral_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending'
);
```

#### `waitlist_analytics` Table
```sql
CREATE TABLE waitlist_analytics (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255),
  visitor_id VARCHAR(255),
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address VARCHAR(45),
  country VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Styling & Design System

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.0 | Utility-first CSS framework |
| **PostCSS** | 8.4.32 | CSS processing pipeline |
| **Autoprefixer** | 10.4.16 | Automatic vendor prefixes |
| **CSS Custom Properties** | Native | Theme colors and spacing variables |

### Brand Colors
```css
/* Primary */
--color-primary: #0066FF;      /* Stellaray Blue */
--color-accent: #00D4FF;       /* Cyan accent */

/* Status */
--color-success: #00FF88;      /* Green */
--color-warning: #FFD700;      /* Gold */
--color-error: #FF3366;        /* Red */

/* Backgrounds */
--color-bg-dark: #0A0A0A;      /* Primary background */
--color-bg-darker: #07070A;    /* Darker sections */
--color-bg-card: rgba(255, 255, 255, 0.05);
```

### Tailwind Custom Config
```typescript
// tailwind.config.ts
colors: {
  stellar: {
    blue: "#3E1BDB",
    purple: "#7B61FF",
    cyan: "#00D4FF",
    dark: "#0D0D12",
    darker: "#07070A",
  },
}
```

---

## 9. Typography & Fonts

| Font | Source | Usage |
|------|--------|-------|
| **Space Grotesk** | Google Fonts | Primary heading/body font |
| **JetBrains Mono** | Google Fonts | Code, addresses, monospace text |

### Font Loading
```typescript
// Optimized loading via next/font
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
});
```

---

## 10. Icons & Graphics

| Technology | Version | Purpose |
|------------|---------|---------|
| **Lucide React** | 0.300.0 | SVG icon library (300+ icons) |
| **Custom SVG** | Inline | Logo, XLM icon, corner accents |
| **QRCode.react** | 4.2.0 | QR code generation for wallet addresses |

### Commonly Used Icons
```typescript
import {
  Twitter, Users, Share2, Trophy, Zap,
  CheckCircle, Copy, Sparkles, Gift, Star,
  ChevronRight, Clock, Target, Award, Flame,
  Crown, ArrowRight, Shield, Wallet, Lock
} from "lucide-react";
```

---

## 11. Image & Media

| Technology | Feature | Purpose |
|------------|---------|---------|
| **Next.js Image** | Built-in | Automatic optimization, lazy loading, WebP |
| **ImageResponse** | Edge Runtime | Dynamic OG/Twitter card image generation |
| **randomuser.me** | External API | Placeholder human avatars for social proof |

### OG Image Generation
```typescript
// app/opengraph-image.tsx
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div>...</div>,
    { ...size }
  );
}
```

---

## 12. External APIs & Data Sources

| API | Provider | Purpose | Fallback |
|-----|----------|---------|----------|
| **CoinGecko** | Price API | XLM price data | Primary |
| **CoinPaprika** | Price API | XLM price data | Fallback 1 |
| **CoinCap** | Price API | XLM price data | Fallback 2 |
| **Stellar Horizon** | Stellar | Blockchain data | - |
| **Soroban RPC** | Stellar | Smart contracts | - |
| **Google OAuth** | Google | Authentication | - |

### Price API Cascade
```typescript
const apis = [
  'https://api.coingecko.com/api/v3/simple/price?ids=stellar...',
  'https://api.coinpaprika.com/v1/tickers/xlm-stellar...',
  'https://api.coincap.io/v2/assets/stellar',
];
// Falls through to next API on failure
```

---

## 13. API Routes (Backend)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth authentication endpoints |
| `/api/waitlist` | GET | Get waitlist count and stats |
| `/api/waitlist` | POST | Add email to waitlist |
| `/api/price` | GET | Fetch XLM price from multiple sources |
| `/api/db/init` | GET | Initialize database schema |
| `/api/xray/events` | GET | Fetch blockchain events for X-Ray |
| `/api/xray/status` | GET | X-Ray protocol status |
| `/api/xray/metrics` | GET/POST | X-Ray performance metrics |

### Example: Waitlist API Response
```json
{
  "success": true,
  "count": 156,
  "realCount": 141,
  "stats": {
    "total_signups": 141,
    "countries": 12,
    "last_24h": 23,
    "last_7d": 89
  },
  "topSources": [
    { "source": "twitter", "count": 67 },
    { "source": "website", "count": 54 }
  ]
}
```

---

## 14. State Management

| Technology | Type | Purpose |
|------------|------|---------|
| **React useState** | Hook | Local component state |
| **React useEffect** | Hook | Side effects, data fetching |
| **React useCallback** | Hook | Memoized callbacks |
| **React useRef** | Hook | DOM refs, animation counters |
| **React Context** | Provider | Auth session state (NextAuth) |
| **localStorage** | Browser | Persistent client state |

### localStorage Keys
```typescript
const STORAGE_KEYS = {
  REFERRAL_CODE: "stellaray_quest_referral",
  COMPLETED_TASKS: "stellaray_quest_completed",
  REFERRED_BY: "stellaray_referred_by",
  NETWORK: "stellar_network",
};
```

---

## 15. Deployment & Infrastructure

| Technology | Provider | Purpose |
|------------|----------|---------|
| **Vercel** | Platform | Hosting, CDN, serverless functions |
| **Edge Runtime** | Vercel | OG image generation at edge |
| **Serverless Functions** | Vercel | API routes execution |
| **Environment Variables** | Vercel | Secrets management |

### Environment Variables Required
```bash
# Database
DATABASE_URL=

# Auth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stellar
NEXT_PUBLIC_STELLAR_HORIZON_URL=
NEXT_PUBLIC_STELLAR_RPC_URL=
NEXT_PUBLIC_ZK_VERIFIER_CONTRACT_ID=
NEXT_PUBLIC_GATEWAY_FACTORY_CONTRACT_ID=
NEXT_PUBLIC_JWK_REGISTRY_CONTRACT_ID=
```

---

## 16. SEO & Social

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **OpenGraph Images** | ImageResponse | Dynamic social previews |
| **Twitter Cards** | Meta tags | Twitter link previews |
| **Canonical URLs** | Next.js Metadata | SEO canonicalization |
| **robots.txt** | Metadata | Search engine directives |
| **manifest.json** | PWA | Progressive Web App metadata |

### Metadata Configuration
```typescript
export const metadata: Metadata = {
  title: "STELLARAY | ZK Wallet",
  description: "Create a Stellar blockchain wallet instantly...",
  keywords: ["Stellar", "Wallet", "zkLogin", "Zero Knowledge"],
  openGraph: {
    type: "website",
    url: "https://stellaray.fun",
    title: "STELLARAY - Prove Everything. Reveal Nothing.",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@stellaraydotfun",
  },
};
```

---

## 17. Twitter Integration

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **Twitter Intent URLs** | Web API | Pre-filled tweet composition |
| **Follow Intent** | `intent/follow` | One-click follow button |
| **Retweet Intent** | `intent/retweet` | One-click retweet |
| **Tweet Intent** | `intent/tweet` | Share with custom text |

### Intent URL Examples
```typescript
// Follow
`https://twitter.com/intent/follow?screen_name=stellaraydotfun`

// Retweet
`https://twitter.com/intent/retweet?tweet_id=2015801792823726355`

// Tweet with text
`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`
```

---

## 18. Analytics & Tracking

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **UTM Parameters** | URL parsing | Campaign tracking |
| **User Agent Parsing** | Custom lib | Device/browser detection |
| **IP Geolocation** | Headers | Country/region tracking |
| **Event Tracking** | JSONB storage | User action analytics |
| **Referral Tracking** | Unique codes | Viral growth attribution |

### UTM Parameters Tracked
- `utm_source` - Traffic source (twitter, google, etc.)
- `utm_medium` - Marketing medium (social, cpc, email)
- `utm_campaign` - Campaign name
- `utm_content` - Ad content/variant
- `utm_term` - Search keywords

### User Agent Parsing
```typescript
function parseUserAgent(ua: string) {
  return {
    deviceType: /mobile/i.test(ua) ? "mobile" : "desktop",
    browser: detectBrowser(ua),  // Chrome, Firefox, Safari, etc.
    os: detectOS(ua),            // Windows, macOS, iOS, Android
  };
}
```

---

## 19. Custom Systems Built

| System | Location | Purpose |
|--------|----------|---------|
| **Feature Flags** | `config/features.ts` | Toggle features for different launch phases |
| **X-Ray Data Service** | `lib/xray.ts` | Fetch and transform blockchain ZK data |
| **Soroban Integration** | `lib/soroban.ts` | Smart contract interactions |
| **Stellar Utilities** | `lib/stellar.ts` | Network config, wallet operations |
| **Database Utilities** | `lib/db.ts` | Schema init, referral codes, UA parsing |
| **Quest System** | `app/quests/page.tsx` | Gamified task completion with rewards |
| **Waitlist System** | `app/waitlist/page.tsx` | Email collection with social proof |

### Feature Flags
```typescript
export const FEATURES = {
  // Launch Control
  WAITLIST_MODE: true,
  SHOW_COMING_SOON: true,
  MAINNET_ENABLED: true,
  QUESTS_ENABLED: true,

  // UI Features
  SHOW_WAITLIST_COUNT: true,
  WAITLIST_CONFETTI: true,
  WAITLIST_TYPEWRITER: true,
  WAITLIST_SUCCESS_MODAL: true,
  WAITLIST_ANIMATED_COUNTER: true,
};
```

---

## 20. Animations & Effects

| Effect | Implementation | Purpose |
|--------|----------------|---------|
| **Confetti** | CSS keyframes | Signup celebration |
| **Floating Particles** | CSS animation | Background ambiance |
| **Typewriter** | JavaScript | Headline text effect |
| **Animated Counter** | requestAnimationFrame | Smooth number transitions |
| **Fade In/Slide** | Tailwind transitions | Page load animations |
| **Pulse** | Tailwind animate | Live status indicators |

### CSS Keyframes
```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.2; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
}

@keyframes confetti {
  0% { transform: translateY(0) rotate(0); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
```

---

## 21. Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **ESLint** | 8.55.0 | Code linting |
| **eslint-config-next** | 15.1.5 | Next.js specific rules |
| **dotenv** | 17.2.3 | Environment variable management |
| **pnpm** | Package Manager | Fast, disk-efficient package management |

### Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 22. Security Features

| Feature | Implementation | Purpose |
|---------|----------------|---------|
| **Zero-Knowledge Proofs** | zkLogin | Privacy-preserving authentication |
| **No Seed Phrases** | ZK derivation | Better UX, reduced phishing |
| **CSRF Protection** | NextAuth | Prevent cross-site attacks |
| **Email Validation** | Regex | Input sanitization |
| **Rate Limiting** | API caching | Prevent abuse |
| **HTTPS Only** | Vercel | Encrypted connections |
| **Secure Headers** | Next.js | XSS, clickjacking prevention |

### Security Best Practices
- No PII stored on-chain
- Wallet keys derived client-side only
- OAuth tokens never exposed to frontend
- Environment variables for all secrets
- Input validation on all API routes

---

## 23. Performance Optimizations

| Optimization | Implementation | Purpose |
|--------------|----------------|---------|
| **API Caching** | In-memory TTL | Reduce external API calls |
| **Image Optimization** | Next.js Image | Smaller file sizes, WebP |
| **Font Optimization** | next/font | No layout shift, preloaded |
| **Code Splitting** | Next.js auto | Smaller initial bundles |
| **Edge Functions** | Vercel Edge | Low-latency OG images |
| **Compression** | gzip/brotli | Smaller transfer sizes |
| **React Server Components** | Next.js 15 | Reduced client JS |

### Caching Strategy
```typescript
// Price API - 30 second cache
const PRICE_CACHE_TTL = 30000;

// X-Ray events - 3 second cache
const EVENTS_CACHE_TTL = 3000;

// Blockchain events - 5 second cache
const BLOCKCHAIN_CACHE_TTL = 5000;
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **NPM Packages** | 15 production + 10 dev |
| **API Routes** | 7 endpoints |
| **Database Tables** | 3 tables |
| **Smart Contracts** | 5 contracts |
| **External APIs** | 6 integrations |
| **Custom Libraries** | 4 modules |
| **Feature Flags** | 15 toggles |
| **Pages** | 4 main pages |

---

## Quick Reference

### Key Files
```
src/
├── app/
│   ├── layout.tsx          # Root layout, fonts, metadata
│   ├── page.tsx            # Home/dashboard page
│   ├── waitlist/page.tsx   # Waitlist signup page
│   ├── quests/page.tsx     # Quest rewards page
│   ├── opengraph-image.tsx # Dynamic OG image
│   └── api/                # Backend API routes
├── lib/
│   ├── stellar.ts          # Stellar network utilities
│   ├── soroban.ts          # Smart contract interactions
│   ├── xray.ts             # X-Ray protocol data
│   └── db.ts               # Database utilities
└── config/
    └── features.ts         # Feature flags
```

### Important URLs
- **Production**: https://stellaray.fun
- **Testnet Explorer**: https://stellar.expert/explorer/testnet
- **Horizon Testnet**: https://horizon-testnet.stellar.org
- **Soroban RPC**: https://soroban-testnet.stellar.org

---

*Last updated: January 2025*
