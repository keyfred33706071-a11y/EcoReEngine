import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function logClientError(error: Error, context?: string) {
  try {
    await addDoc(collection(db, 'client_errors'), {
      message: error.message,
      stack: error.stack?.slice(0, 500),
      context: context || 'unknown',
      timestamp: serverTimestamp(),
      user_agent: navigator.userAgent.slice(0, 200),
      url: window.location.href,
    });
  } catch {}
}

export function initGlobalErrorHandler() {
  window.onerror = (msg, source, line, _col, error) => {
    logClientError(error || new Error(String(msg)), `global:${source}:${line}`);
  };
  window.addEventListener('unhandledrejection', (e) => {
    logClientError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)), 'promise');
  });
}
