import { db } from './firebase';
import { addDoc, collection, query, where, updateDoc, doc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { showToast } from '../components/Toast';

export interface Challenge {
  id?: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  description: string;
  xpReward: number;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  createdAt: any;
  completedAt?: any;
}

export async function sendChallenge(fromUserId: string, fromName: string, toUserId: string, toName: string, description: string, xpReward = 30): Promise<void> {
  await addDoc(collection(db, 'challenges'), {
    fromUserId, fromName, toUserId, toName, description, xpReward,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  showToast('✅ Desafío enviado', 'success');
}

export async function respondToChallenge(challengeId: string, status: 'accepted' | 'declined'): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), { status, completedAt: serverTimestamp() });
  if (status === 'accepted') showToast('🎉 Desafío aceptado!', 'success');
}

export async function completeChallenge(challengeId: string): Promise<void> {
  await updateDoc(doc(db, 'challenges', challengeId), { status: 'completed', completedAt: serverTimestamp() });
  showToast('✅ Desafío completado! +30 XP', 'success');
}

export function subscribeToChallenges(userId: string, callback: (challenges: Challenge[]) => void): () => void {
  const q = query(
    collection(db, 'challenges'),
    where('toUserId', '==', userId)
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Challenge));
    list.sort((a, b) => {
      const ta = a.createdAt ? (typeof a.createdAt === 'object' ? (a.createdAt as any).toDate?.().getTime() || 0 : 0) : 0;
      const tb = b.createdAt ? (typeof b.createdAt === 'object' ? (b.createdAt as any).toDate?.().getTime() || 0 : 0) : 0;
      return tb - ta;
    });
    callback(list);
  });
}
