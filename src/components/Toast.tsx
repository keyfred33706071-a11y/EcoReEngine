import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

let toastId = 0;
let addToastFn: ((t: ToastMessage) => void) | null = null;

export function showToast(text: string, type: ToastType = 'info') {
  addToastFn?.({ id: ++toastId, text, type });
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    return () => { addToastFn = null; };
  }, []);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const colors = { success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400', error: 'bg-red-500/20 border-red-500/30 text-red-400', info: 'bg-blue-500/20 border-blue-500/30 text-blue-400' };

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90vw] max-w-md">
      {toasts.map(t => {
        const Icon = icons[t.type];
        return (
          <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border backdrop-blur-md animate-slide-up ${colors[t.type]}`}>
            <Icon className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium flex-1">{t.text}</p>
            <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="opacity-50 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
