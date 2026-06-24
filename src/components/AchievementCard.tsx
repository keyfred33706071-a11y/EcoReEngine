import { Lock, Sparkles } from 'lucide-react';

interface Props {
  name: string;
  description: string;
  emoji: string;
  rarity?: 'comun' | 'raro' | 'epico' | 'legendario';
  unlocked: boolean;
  unlockedAt?: string;
}

const rarityStyles = {
  comun: { border: 'border-slate-600/50', bg: 'bg-slate-800/40', badge: 'bg-slate-600 text-slate-200', glow: '' },
  raro: { border: 'border-blue-500/40', bg: 'bg-blue-900/20', badge: 'bg-blue-600 text-white', glow: 'shadow-blue-500/20' },
  epico: { border: 'border-purple-500/40', bg: 'bg-purple-900/20', badge: 'bg-purple-600 text-white', glow: 'shadow-purple-500/20' },
  legendario: { border: 'border-amber-500/40', bg: 'bg-amber-900/20', badge: 'bg-amber-600 text-white', glow: 'shadow-amber-500/30' },
};

export default function AchievementCard({ name, description, emoji, rarity = 'comun', unlocked, unlockedAt }: Props) {
  const s = rarityStyles[rarity];
  return (
    <div className={`relative rounded-xl border ${s.border} ${s.bg} p-3 sm:p-4 transition-all duration-300 flex gap-3 sm:gap-4 ${unlocked ? `${s.glow} shadow-lg hover:scale-[1.03]` : 'opacity-50 grayscale'} ${unlocked ? 'animate-achievement-unlock' : ''}`}>
      {!unlocked && <Lock className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 text-slate-600 z-10" />}
      {unlocked && rarity === 'legendario' && <Sparkles className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3 h-3 sm:w-4 sm:h-4 text-amber-400 animate-pulse z-10" />}
      <div className="flex-shrink-0 self-center">
        {emoji.startsWith('/') || emoji.startsWith('http')
          ? <img src={emoji} alt={name} className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
          : <span className="text-3xl sm:text-4xl">{emoji}</span>}
      </div>
      <div className="flex-1 min-w-0 self-center">
        <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">{name}</h4>
        <p className="text-[11px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{description}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`inline-block text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded ${s.badge}`}>{rarity}</span>
          {unlockedAt && <span className="text-[9px] sm:text-[10px] text-slate-600">{new Date(unlockedAt).toLocaleDateString('es')}</span>}
        </div>
      </div>
    </div>
  );
}
