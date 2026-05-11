# EquityLens — Setup Guide

> Full-stack fintech portfolio tracker. React + TypeScript + Firebase + real market APIs + AI.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | TailwindCSS 3, CSS variables |
| Charts | Recharts |
| Routing | React Router v6 |
| State | Zustand |
| Auth & DB | Firebase (Authentication + Firestore) |
| Market Data | Finnhub (quotes/news), Twelve Data (history) |
| AI Analyst | Anthropic Claude API |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env template
cp .env.example .env

# 3. Fill in your API keys (see sections below)
# 4. Start dev server
npm run dev
```

---

## Step 1 — Firebase Setup

### 1.1 Create Firebase Project

1. Go to **https://console.firebase.google.com**
2. Click **"Add project"**
3. Enter project name (e.g. `equitylens`)
4. Disable Google Analytics (optional for now) → **Create project**
5. Wait for creation → **Continue**

### 1.2 Enable Google Authentication

1. In Firebase Console → **Build → Authentication**
2. Click **"Get started"**
3. Go to **Sign-in method** tab
4. Click **Google** → toggle **Enable**
5. Add your **Project support email**
6. Click **Save**

### 1.3 Create Firestore Database

1. In Firebase Console → **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add rules after)
4. Select a region close to you → **Enable**

### 1.4 Set Firestore Security Rules

In Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**.

### 1.5 Get Firebase Config

1. Firebase Console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** → click **Web** icon (`</>`)
3. Register app (nickname: `equitylens-web`)
4. Copy the `firebaseConfig` object — you'll see:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

5. Paste each value into your `.env` file:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### 1.6 Add Authorized Domain (for Google Auth)

1. Firebase Console → Authentication → **Settings** tab
2. Under **Authorized domains**, add `localhost` (already there)
3. When deploying, add your production domain here too

---

## Step 2 — Finnhub API (Quotes, News, Company Info)

**Free plan:** 60 API calls/minute | Real-time US stock quotes | No credit card needed

### Setup

1. Go to **https://finnhub.io**
2. Click **"Get free API key"** (top right)
3. Fill in name and email → **Sign up**
4. Verify your email
5. Log in → you'll see your **API key** on the dashboard
6. Copy it → paste in `.env`:

```env
VITE_FINNHUB_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### What Finnhub gives us (free)

- ✅ Real-time stock quotes (60/min)
- ✅ Company profiles and logos
- ✅ Company news (past 30 days)
- ✅ Market news
- ✅ Stock symbol search
- ❌ WebSocket real-time (requires paid plan)

### Test it

```bash
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY"
```

You should see: `{"c":178.72,"d":1.45,"dp":0.82,...}`

---

## Step 3 — Twelve Data API (Historical OHLCV)

**Free plan:** 800 calls/day | 8 calls/minute | No credit card

### Setup

1. Go to **https://twelvedata.com**
2. Click **"Sign up for free"**
3. Create account with email → Verify
4. Log in → go to **Dashboard**
5. Click **"API Keys"** in the left sidebar
6. Your default API key is shown → Copy it
7. Add to `.env`:

```env
VITE_TWELVE_DATA_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
```

### What Twelve Data gives us (free)

- ✅ 1-year daily OHLCV for any stock
- ✅ Weekly, monthly time series
- ✅ Symbol search
- ❌ Real-time (15-min delay on free plan)

### Test it

```bash
curl "https://api.twelvedata.com/time_series?symbol=AAPL&interval=1day&outputsize=5&apikey=YOUR_KEY"
```

---

## Step 4 — Anthropic API (AI Analyst)

**Free trial credits included** | Claude Sonnet 4

### Setup

1. Go to **https://console.anthropic.com**
2. Click **"Sign up"**
3. Verify email + phone
4. Go to **API Keys** → **"Create key"**
5. Name it (e.g. `equitylens-dev`) → Copy key immediately (shown only once!)
6. Add to `.env`:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
```

### ⚠️ Security Warning

The Anthropic key is exposed client-side during development. **For production**, use a backend proxy:

**Option A: Firebase Cloud Functions**
```js
// functions/src/index.ts
export const analyzePortfolio = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new Error('Unauthenticated');
  // Call Anthropic API server-side
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY }
    // ...
  });
  return response.json();
});
```

**Option B: Next.js API Route**
```js
// pages/api/analyze.ts
export default async function handler(req, res) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY }
    // ...
  });
  res.json(await response.json());
}
```

---

## Firestore Data Structure

```
users/{userId}
  - email: string
  - displayName: string
  - photoURL: string
  - createdAt: Timestamp
  - settings: { currency: 'USD', theme: 'dark' }

users/{userId}/transactions/{txId}
  - ticker: string
  - type: 'buy' | 'sell'
  - quantity: number
  - price: number
  - date: string (YYYY-MM-DD)
  - commission: number
  - notes: string
  - createdAt: Timestamp

users/{userId}/watchlist/{ticker}
  - ticker: string
  - addedAt: Timestamp

users/{userId}/ai_chat/{messageId}
  - role: 'user' | 'assistant'
  - content: string
  - timestamp: Timestamp
```

---

## Environment Variables Reference

```env
# Firebase (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Finnhub (required for prices/news)
VITE_FINNHUB_API_KEY=

# Twelve Data (required for charts)
VITE_TWELVE_DATA_API_KEY=

# Anthropic (required for AI Analyst)
VITE_ANTHROPIC_API_KEY=
```

---

## Deployment (Free)

### Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Add all env vars in Vercel Dashboard → Project → Settings → Environment Variables.

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting   # set dist as public dir
npm run build
firebase deploy
```

---

## Scaling Tips

### Avoid API Rate Limits

- All API calls are cached in memory (see `stockApi.ts`)
- Quote cache: 30 seconds
- Profile cache: 1 hour
- History cache: 10 minutes
- Add Redis or localStorage cache for production

### Firebase Free Tier Limits

- Firestore: 50K reads/day, 20K writes/day, 20K deletes/day
- Auth: unlimited
- Hosting: 10GB storage, 1GB/day transfer

For a typical user with 20 holdings refreshing every 30 seconds, you'll use ~2,880 reads/day — well within limits.

### Add a Backend Later

When you need to scale:

1. Add **Firebase Cloud Functions** for AI proxy and data aggregation
2. Add **Firebase Extensions** for scheduled portfolio updates
3. Consider **Supabase** as Firebase alternative with PostgreSQL
4. Add **Redis** (Upstash free tier) for shared API response caching

---

## Monetization Ideas

- **Freemium**: 3 holdings free, unlimited on Pro ($9/mo)
- **Premium AI**: More AI calls, deeper analysis
- **Alerts**: Email/SMS price alerts
- **Advanced charts**: TradingView widget integration
- **Tax reports**: Capital gains calculation export (PDF)
- **Portfolio sharing**: Public portfolio pages

---

## Adding More AI Providers

### Gemini (Google) — Free tier available

```ts
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`,
  { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }
);
```

### OpenAI

```ts
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
  body: JSON.stringify({ model: 'gpt-4o-mini', messages: [...] })
});
```

---

## Troubleshooting

**"Firebase: Error (auth/unauthorized-domain)"**
→ Add `localhost` to Firebase Auth → Settings → Authorized domains

**"Firebase: Error (permission-denied)"**
→ Check Firestore Security Rules (Step 1.4)

**Finnhub returns empty data**
→ Some tickers need exact format: `BRK-B` not `BRK.B`

**Charts show no data**
→ Twelve Data free plan has 8 calls/minute limit — wait a moment and retry

**AI Analyst shows error**
→ Check `VITE_ANTHROPIC_API_KEY` in `.env` and restart dev server
