/**
 * Firestore service — all database operations live here
 */
import {
  db,
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
  serverTimestamp,
  Timestamp,
} from '../lib/firebase';
import type { Transaction, AppUser, AIMessage } from '../types';

// ─── USER ─────────────────────────────────────────────────────────────────────
export async function upsertUser(user: AppUser): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      settings: { currency: 'USD', theme: 'dark' },
    });
  }
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export async function addTransaction(
  userId: string,
  tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const ref = collection(db, 'users', userId, 'transactions');
  const docRef = await addDoc(ref, {
    ...tx,
    userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const ref = collection(db, 'users', userId, 'transactions');
  const q = query(ref, orderBy('date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
    } as Transaction;
  });
}

export async function deleteTransaction(userId: string, txId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'transactions', txId);
  await deleteDoc(ref);
}

// ─── WATCHLIST ────────────────────────────────────────────────────────────────
export async function getWatchlist(userId: string): Promise<string[]> {
  const ref = collection(db, 'users', userId, 'watchlist');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.id);
}

export async function addToWatchlist(userId: string, ticker: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'watchlist', ticker);
  await setDoc(ref, { ticker, addedAt: serverTimestamp() });
}

export async function removeFromWatchlist(userId: string, ticker: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'watchlist', ticker);
  await deleteDoc(ref);
}

// ─── AI CHAT HISTORY ──────────────────────────────────────────────────────────
export async function saveAIMessage(userId: string, message: AIMessage): Promise<void> {
  const ref = collection(db, 'users', userId, 'ai_chat');
  await addDoc(ref, {
    ...message,
    timestamp: serverTimestamp(),
  });
}

export async function getAIChatHistory(userId: string, limitCount = 50): Promise<AIMessage[]> {
  const ref = collection(db, 'users', userId, 'ai_chat');
  const q = query(ref, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .slice(0, limitCount)
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        role: data.role,
        content: data.content,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : Date.now(),
      } as AIMessage;
    })
    .reverse();
}
