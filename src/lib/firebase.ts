import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ─── Firebase Config ──────────────────────────────────────────────────────────
// Paste your Firebase project config here (from Firebase Console → Project Settings → Your apps)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// ─── Firestore helpers re-exported for convenience ─────────────────────────────
export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
};

/*
──────────────────────────────────────────────────────────────────────────────
  FIRESTORE DATABASE STRUCTURE
──────────────────────────────────────────────────────────────────────────────

  users/{userId}
    - email: string
    - displayName: string
    - photoURL: string
    - createdAt: Timestamp
    - settings: { currency: 'USD', theme: 'dark' }

  users/{userId}/transactions/{transactionId}
    - ticker: string
    - companyName: string
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

  users/{userId}/ai_analysis/{analysisId}
    - riskScore: number
    - diversification: string
    - summary: string
    - createdAt: Timestamp

──────────────────────────────────────────────────────────────────────────────
  SECURITY RULES (paste in Firebase Console → Firestore → Rules)
──────────────────────────────────────────────────────────────────────────────

  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }

──────────────────────────────────────────────────────────────────────────────
*/
