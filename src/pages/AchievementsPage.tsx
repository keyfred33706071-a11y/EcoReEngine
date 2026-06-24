import { useEffect, useState } from 'react';
import { Trophy, Star, Zap } from 'lucide-react';
import { Achievement, UserProfile, fetchAchievements, fetchUserAchievements } from '../lib/firestore';
import { ACHIEVEMENTS_DATA } from '../lib/achievementsData';
import AchievementCard from '../components/AchievementCard';

interface AchievementsPageProps {
  userId: string;
  profile: UserProfile;
}

function rarityForXp(xp: number): 'comun' | 'raro' | 'epico' | 'legendario' {
  if (xp >= 250) return 'legendario';
  if (xp >= 100) return 'epico';
  if (xp >= 50) return 'raro';
  return 'comun';
}

export default function AchievementsPage({ userId }: AchievementsPageProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      const [ach, ua] = await Promise.all([
        fetchAchievements(),
        fetchUserAchievements(userId),
      ]);
      const merged = (ach as Achievement[]).map(a => {
        if (!a.icon) {
          const match = ACHIEVEMENTS_DATA.find(d => d.name === a.name);
          if (match?.icon) a.icon = match.icon;
        }
        return a;
      });
      setAchievements(merged);
      setEarned(new Set(ua));
      setLoading(false);
    }
    load();
  }, [userId]);

  const filtered = achievements.sort((a, b) => {
      const aEarned = earned.has(a.id) ? 0 : 1;
      const bEarned = earned.has(b.id) ? 0 : 1;
      return aEarned - bEarned;
    });
  const earnedCount = [...earned].length;
  const totalXpFromAchievements = achievements.filter(a => earned.has(a.id)).reduce((sum, a) => sum + a.xp_reward, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Logros obtenidos', value: `${earnedCount}/${achievements.length}`, icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'XP de logros', value: totalXpFromAchievements.toLocaleString(), icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Completado', value: `${achievements.length > 0 ? Math.round((earnedCount / achievements.length) * 100) : 0}%`, icon: Star, color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card ${bg} border flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color} flex-shrink-0`} />
            <div className="min-w-0">
              <p className={`text-base sm:text-xl font-bold ${color} truncate`}>{value}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-slate-300">Progreso general de logros</p>
          <p className="text-sm font-semibold text-emerald-400">{earnedCount}/{achievements.length}</p>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Achievements grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card h-28 sm:h-32 animate-pulse bg-slate-800/40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map(achievement => {
            const isEarned = earned.has(achievement.id);
            const rarity = rarityForXp(achievement.xp_reward);
            return (
              <AchievementCard
                key={achievement.id}
                name={achievement.name}
                description={achievement.description}
                emoji={achievement.icon || '🏆'}
                rarity={rarity}
                unlocked={isEarned}
                unlockedAt={isEarned ? new Date().toISOString() : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
