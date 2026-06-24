import { db } from './firebase';
import {
  getDocs, collection, query, where, addDoc, orderBy,
} from 'firebase/firestore';
import { fetchProfile, awardXP } from './firestore';
import type { Achievement, UserProfile } from './firestore';

function getProfileValue(profile: UserProfile, requirementType: string): number {
  switch (requirementType) {
    case 'puzzle_score': return profile.high_score ?? 0;
    case 'puzzle_total_recycled': return (profile as any).puzzle_total_recycled ?? 0;
    case 'projects_completed': return profile.projects_completed ?? 0;
    case 'dictionary_views': return (profile as any).dictionary_views ?? 0;
    case 'chat_count': return (profile as any).chat_count ?? 0;
    case 'posts_count': return (profile as any).posts_count ?? 0;
    case 'streak_days': return profile.streak_days ?? 0;
    case 'level': return profile.level ?? 1;
    case 'puzzle_games': return profile.games_played ?? 0;
    case 'all_milestones': {
      const score = profile.high_score ?? 0;
      return (score >= 50 && score >= 100 && score >= 300 && score >= 500 && score >= 1000) ? 1 : 0;
    }
    default: return 0;
  }
}

export interface EarnedAchievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  xp_reward: number;
}

export async function checkAndAwardAchievements(
  userId: string,
  profile: UserProfile | null,
): Promise<EarnedAchievement[]> {
  if (!userId) return [];
  const prof = profile ?? await fetchProfile(userId);
  if (!prof) return [];

  const achSnap = await getDocs(query(collection(db, 'achievements'), orderBy('requirement_value')));
  const achievements = achSnap.docs.map(d => ({ id: d.id, ...d.data() } as Achievement));

  const uaSnap = await getDocs(query(collection(db, 'user_achievements'), where('user_id', '==', userId)));
  const alreadyEarned = new Set(uaSnap.docs.map(d => d.data().achievement_id));

  const earned: EarnedAchievement[] = [];

  for (const ach of achievements) {
    if (alreadyEarned.has(ach.id)) continue;
    const value = getProfileValue(prof, ach.requirement_type);
    if (value >= ach.requirement_value) {
      try {
        await addDoc(collection(db, 'user_achievements'), {
          user_id: userId,
          achievement_id: ach.id,
          assigned_by: 'system',
          unlocked_at: new Date().toISOString(),
        });
        await awardXP(userId, ach.xp_reward);
        earned.push({ id: ach.id, name: ach.name, description: ach.description, icon: ach.icon, xp_reward: ach.xp_reward });
      } catch {}
    }
  }

  return earned;
}
