import { useEffect, useState } from 'react';
import { Sparkles, X, Trophy } from 'lucide-react';

interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon?: string;
  xp_reward: number;
}

let showFn: ((a: AchievementData) => void) | null = null;

export function showAchievementPopup(ach: AchievementData) {
  showFn?.(ach);
}

export default function AchievementPopup() {
  const [current, setCurrent] = useState<AchievementData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showFn = (ach) => {
      setCurrent(ach);
      setVisible(true);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setCurrent(null), 300);
      }, 4000);
    };
    return () => { showFn = null; };
  }, []);

  if (!current) return null;

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => setCurrent(null), 300); }}
      className={`fixed inset-0 z-[200] flex items-center justify-center transition-all duration-300 ${
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 pointer-events-none'
      }`}>
      <div
        onClick={e => e.stopPropagation()}
        className={`relative flex flex-col items-center gap-3 px-8 py-10 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 shadow-2xl shadow-emerald-500/20 max-w-xs w-[85vw] transition-all duration-300 ${
          visible ? 'animate-achievement-unlock' : 'scale-75 opacity-0'
        }`}>
        <button onClick={() => { setVisible(false); setTimeout(() => setCurrent(null), 300); }}
          className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="w-4 h-4" />
        </button>

        {current.icon ? (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30">
            <img src={current.icon} alt="" className="w-14 h-14 object-contain" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-score-pop">
            <Trophy className="w-8 h-8 text-white" />
          </div>
        )}

        <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          NUEVO LOGRO
          <Sparkles className="w-3 h-3" />
        </div>

        <p className="text-lg font-bold text-white text-center leading-tight">{current.name}</p>
        <p className="text-xs text-slate-400 text-center leading-relaxed">{current.description}</p>

        <div className="flex items-center gap-1.5 mt-1 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
          <Sparkles className="w-4 h-4" />
          +{current.xp_reward} XP
        </div>
      </div>
    </div>
  );
}
