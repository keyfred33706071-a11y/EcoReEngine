import { useState, useEffect } from 'react';
import { ArrowLeft, Share2, Trophy, Zap, Medal, Calendar } from 'lucide-react';
import { fetchProfile, UserProfile, xpToLevel } from '../lib/firestore';
import { Share } from '@capacitor/share';

interface Props { userId?: string; onBack?: () => void; }

export default function PublicProfilePage({ userId, onBack }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchProfile(userId).then(p => { setProfile(p); setLoading(false); }).catch(() => setLoading(false));
  }, [userId]);

  const level = profile ? xpToLevel(profile.total_xp || 0) : null;

  const handleShare = async () => {
    if (!profile) return;
    try {
      await Share.share({
        title: `EcoReEngine - ${profile.full_name || 'Usuario'}`,
        text: `¡Mira el perfil de ${profile.full_name || 'Usuario'} en EcoReEngine! Nivel ${level?.level || 1} · ${profile.total_xp || 0} XP`,
        url: window.location.href,
      });
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="text-center text-slate-500 py-10">Usuario no encontrado</div>;

  return (
    <div className="space-y-4 animate-fade-in pb-10 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        {onBack && <button onClick={onBack} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>}
        <h2 className="section-title flex-1">Perfil Público</h2>
        <button onClick={handleShare} className="btn-ghost p-2 text-slate-400 hover:text-emerald-400"><Share2 className="w-5 h-5" /></button>
      </div>

      <div className="card text-center py-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-3xl font-bold mx-auto">
          {(profile.full_name || '?')[0].toUpperCase()}
        </div>
        <h3 className="text-xl font-bold text-slate-100 mt-3">{profile.full_name || 'Sin nombre'}</h3>
        {profile.bio && <p className="text-sm text-slate-400 mt-1">{profile.bio}</p>}
        {level && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-slate-200">Nivel {level.level}</span>
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-slate-400">{profile.total_xp?.toLocaleString()} XP</span>
          </div>
        )}
        {profile.created_at && (
          <p className="text-xs text-slate-500 mt-2 flex items-center justify-center gap-1">
            <Calendar className="w-3 h-3" /> Miembro desde {new Date(profile.created_at).toLocaleDateString('es')}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Medal, label: 'Proyectos', value: profile.projects_completed || 0 },
          { icon: Zap, label: 'Tutoriales', value: profile.tutorials_completed || 0 },
          { icon: Trophy, label: 'High Score', value: profile.high_score || 0 },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <s.icon className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-lg font-bold text-slate-100 mt-1">{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
