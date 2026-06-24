import { useState, useCallback, useEffect } from 'react';
import { Trophy, ArrowLeft } from 'lucide-react';
import { UserProfile, xpToLevel, getLeaderboard, getGameLeaderboard } from '../lib/firestore';
import VerifiedBadge from '../components/VerifiedBadge';
import RoleBadge from '../components/RoleBadge';

interface LeaderboardPageProps {
  profile: UserProfile;
  type: 'xp' | 'game';
  onBack: () => void;
}

export default function LeaderboardPage({ profile, type, onBack }: LeaderboardPageProps) {
  const [leaderboard, setLeaderboard] = useState<(UserProfile & { rank: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = type === 'game' ? await getGameLeaderboard(100) : await getLeaderboard(100);
      setLeaderboard(data.map((u, i) => ({ ...u, rank: i + 1 })));
    } catch {}
    setLoading(false);
  }, [type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="section-title flex items-center gap-2">
          <Trophy className={`w-6 h-6 ${type === 'xp' ? 'text-amber-400' : 'text-purple-400'}`} />
          Top 100 · {type === 'xp' ? 'XP Total' : 'Récord de Juego'}
        </h2>
      </div>

      <div className="card p-2 space-y-1">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Cargando...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Sin datos</div>
        ) : (
          leaderboard.map((u) => {
            const isMe = u.id === profile.id;
            const rowHigh = type === 'game' ? Math.floor(u.high_score ?? 0) : 0;
            const rowXp = u.total_xp ?? 0;
            const lv = xpToLevel(rowXp);
            const medal = u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : '';
            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  isMe ? 'bg-emerald-600/20 border border-emerald-500/30' : 'hover:bg-slate-800/50'
                }`}
              >
                <span className={`w-8 text-center font-bold text-sm ${u.rank <= 3 ? 'text-lg' : 'text-slate-500'}`}>
                  {medal || `#${u.rank}`}
                </span>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                  {(u.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${u.role === 'owner' ? 'text-amber-400' : u.role === 'admin' ? 'text-blue-400' : 'text-slate-100'}`}>
                    {u.full_name || u.username || 'Usuario'}{u.verified && <VerifiedBadge />}<RoleBadge role={u.role} />
                    {isMe && <span className="text-emerald-400 text-xs ml-1">(tú)</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {type === 'xp' ? `${rowXp.toLocaleString()} XP` : `Mejor: ${rowHigh}`} · Nv.{lv.level}
                  </p>
                </div>
                {type === 'xp' ? (
                  rowXp > 0 && (
                    <div className={`text-sm font-bold ${u.rank <= 3 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {rowXp.toLocaleString()}
                    </div>
                  )
                ) : (
                  rowHigh > 0 && (
                    <div className={`text-sm font-bold ${u.rank <= 3 ? 'text-purple-400' : 'text-slate-400'}`}>
                      {rowHigh}
                    </div>
                  )
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
