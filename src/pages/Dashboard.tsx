import { useState, useRef, useEffect } from 'react';
import { Camera, Loader, Share2, AlertTriangle, ClipboardPaste, Trophy, BarChart3, Gamepad2 } from 'lucide-react';
import { Share } from '@capacitor/share';
import { showToast } from '../components/Toast';
import { UserProfile, xpToLevel, uploadImage, updateProfile, fetchAchievements, fetchUserAchievements, formatCO2 } from '../lib/firestore';
import VerifiedBadge from '../components/VerifiedBadge';
import RoleBadge from '../components/RoleBadge';

interface DashboardProps {
  profile: UserProfile;
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
  onProfileUpdate?: () => void;
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function WeeklyChart({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const today = new Date().getDay();
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((v, i) => {
        const pct = (v / max) * 100;
        const isToday = i === today;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-slate-500 font-medium">{v > 0 ? v : ''}</span>
            <div className="w-full rounded-md bg-slate-800/60 relative" style={{ height: '72px' }}>
              <div
                className={`absolute bottom-0 w-full rounded-md transition-all duration-700 ${isToday ? 'bg-gradient-to-t from-emerald-500 to-emerald-400' : 'bg-emerald-500/40'}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`text-[9px] ${isToday ? 'text-emerald-400 font-semibold' : 'text-slate-600'}`}>{DAYS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

function CO2Gauge({ saved, target = 1000 }: { saved: number; target?: number }) {
  const pct = Math.min(100, (saved / target) * 100);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(5,150,105,0.15)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="url(#co2grad)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} className="transition-all duration-1000" />
        <defs>
          <linearGradient id="co2grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-emerald-400">{formatCO2(saved)}</span>
        <span className="text-[10px] text-slate-500">CO₂ ahorrado</span>
      </div>
    </div>
  );
}

export default function Dashboard({ profile, onNavigate, onSignOut, onProfileUpdate }: DashboardProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const levelInfo = xpToLevel(profile.total_xp);
  const [achTotal, setAchTotal] = useState(0);
  const [achEarned, setAchEarned] = useState(0);
  const [weeklyXp, setWeeklyXp] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(`eco_weekly_xp_${profile.id}`);
      return raw ? JSON.parse(raw) : Array(7).fill(0);
    } catch { return Array(7).fill(0); }
  });

  useEffect(() => {
    if (!profile.id) return;
    const today = new Date().getDay();
    const raw = localStorage.getItem(`eco_weekly_xp_${profile.id}`);
    let week: number[];
    try { week = raw ? JSON.parse(raw) : Array(7).fill(0); } catch { week = Array(7).fill(0); }
    const lastUpdate = localStorage.getItem(`eco_weekly_xp_date_${profile.id}`);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (lastUpdate !== todayStr) {
      week[today] += 0;
      localStorage.setItem(`eco_weekly_xp_date_${profile.id}`, todayStr);
    }
    setWeeklyXp(week);
  }, [profile.id]);

  useEffect(() => {
    if (!profile.id) return;
    Promise.all([
      fetchAchievements().then(a => setAchTotal(a.length)).catch(() => {}),
      fetchUserAchievements(profile.id).then(u => setAchEarned(u.length)).catch(() => {}),
    ]);
  }, [profile.id]);


  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, `avatars/${profile.id}`);
      await updateProfile(profile.id, { avatar_url: url });
      showToast('✅ Foto actualizada', 'success');
      onProfileUpdate?.();
    } catch {
      showToast('❌ Error al subir foto', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handlePasteAvatar() {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (!imageType) continue;
        const blob = await item.getType(imageType);
        const file = new File([blob], 'avatar.' + imageType.split('/')[1], { type: imageType });
        setUploading(true);
        const url = await uploadImage(file, `avatars/${profile.id}`);
        await updateProfile(profile.id, { avatar_url: url });
        showToast('✅ Foto pegada desde portapapeles', 'success');
        onProfileUpdate?.();
        return;
      }
      showToast('❌ No hay imagen en el portapapeles', 'error');
    } catch {
      showToast('❌ No se pudo leer el portapapeles', 'error');
    } finally {
      setUploading(false);
    }
  }

  async function handleShare() {
    try {
      await Share.share({
        title: 'EcoReEngine',
        text: `¡Únete a EcoReEngine y recicla componentes electrónicos! 🚀\n\n${profile.full_name || profile.username} ya está reciclando y ganando experiencia.\n\n🌱 CO₂ ahorrado: ${formatCO2(profile.co2_saved_kg || 0)}\n🏆 Nivel: ${levelInfo.level}\n📦 Componentes: ${profile.components_salvaged || 0}`,
        url: 'https://ecoreengine-7fcaa.web.app',
        dialogTitle: 'Compartir EcoReEngine',
      });
    } catch {}
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {profile.banned && (
        <div className="bg-red-900/30 border border-red-700/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">Cuenta suspendida</p>
            <p className="text-xs text-red-300/80 mt-1">{profile.ban_reason || 'Violación de las normas de la comunidad.'}</p>
            {profile.ban_expires && (
              <p className="text-xs text-red-300/60 mt-1">Expira: {new Date(profile.ban_expires).toLocaleDateString('es')}</p>
            )}
          </div>
        </div>
      )}

      <div className="card flex flex-col sm:flex-row items-center gap-5">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-3xl font-bold text-white cursor-pointer overflow-hidden ring-2 ring-emerald-500/30 hover:ring-emerald-400/60 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                (profile.full_name?.[0] || profile.username?.[0] || '?').toUpperCase()
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </div>
            </div>
            <button onClick={handlePasteAvatar} disabled={uploading}
              className="mt-2 w-full text-[10px] font-semibold text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center gap-1 disabled:opacity-40">
              <ClipboardPaste className="w-3 h-3" /> Pegar imagen
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-slate-100">{profile.full_name || profile.username || 'Inventor'}</h2>
            {profile.verified && <VerifiedBadge />}
            <RoleBadge role={profile.role} />
          </div>
          {profile.bio && <p className="text-sm text-slate-400 mt-1">{profile.bio}</p>}
          <p className="text-xs text-slate-500 mt-1">@{profile.username || profile.id.slice(0, 8)}</p>
        </div>
        <button onClick={handleShare} className="btn-secondary text-sm flex items-center gap-2 shrink-0">
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>

      {/* XP + Logros + Juego - Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div onClick={() => onNavigate?.('leaderboard-xp')} className="card-hover bg-amber-500/10 border border-amber-500/20 cursor-pointer flex flex-col items-center justify-center py-5 text-center">
          <BarChart3 className="w-8 h-8 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-amber-400">{profile.total_xp.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">XP Total</p>
          <p className="text-[10px] text-slate-600 mt-1">Nivel {levelInfo.level}</p>
        </div>
        <div onClick={() => onNavigate?.('achievements')} className="card-hover bg-emerald-500/10 border border-emerald-500/20 cursor-pointer flex flex-col items-center justify-center py-5 text-center">
          <Trophy className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{achEarned}/{achTotal}</p>
          <p className="text-xs text-slate-500 mt-1">Logros</p>
          <p className="text-[10px] text-slate-600 mt-1">{achTotal > 0 ? Math.round((achEarned / achTotal) * 100) : 0}% completado</p>
        </div>
        <div onClick={() => onNavigate?.('leaderboard-game')} className="card-hover bg-purple-500/10 border border-purple-500/20 cursor-pointer flex flex-col items-center justify-center py-5 text-center">
          <Gamepad2 className="w-8 h-8 text-purple-400 mb-2" />
          <p className="text-2xl font-bold text-purple-400">{profile.high_score?.toLocaleString() ?? '0'}</p>
          <p className="text-xs text-slate-500 mt-1">Récord</p>
          <p className="text-[10px] text-slate-600 mt-1">{profile.games_played ?? 0} partidas</p>
        </div>
      </div>

      {/* CO₂ Gauge */}
      <div className="card flex flex-col items-center relative">
        <CO2Gauge saved={profile.co2_saved_kg || 0} target={1000} />
      </div>

      {/* Weekly Progress Chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Progreso Semanal
          </h3>
          <span className="text-[11px] text-slate-500">XP por día</span>
        </div>
        <WeeklyChart data={weeklyXp} />
        <p className="text-xs text-slate-500 text-center mt-3">
          Total semanal: <span className="text-emerald-400 font-bold">{weeklyXp.reduce((a, b) => a + b, 0)} XP</span>
        </p>
      </div>

      {onSignOut && (
        <button onClick={onSignOut} className="w-full py-3 rounded-xl border border-red-800/40 text-red-400 text-sm font-medium hover:bg-red-900/20 transition-colors">
          Cerrar sesión
        </button>
      )}
    </div>
  );
}
