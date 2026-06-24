import { useState, useEffect } from 'react';
import { Zap, Trophy, Award, TrendingUp, Gavel, Clock, RefreshCw, Download, Activity, Calendar, Copy, AlertTriangle, Trash2, Plus, Save, UserCheck, Users, BarChart3, Crown, ShieldCheck, MessageSquare, UserPlus, Gamepad2 } from 'lucide-react';
import { UserProfile, unbanUser, fetchPosts, fetchAdminProjects, fetchBadges, createBadge, deleteBadge, assignBadgeToUser, awardMassXP, getLeaderboard, fetchAchievements, createAdminAchievement, deleteAdminAchievement, assignAchievementManually, addAdminLog, fetchAdminLogs, resetUserGameData, generateDailyContent, fetchClientErrors, fetchAllPosts, unhidePost, CommunityPost } from '../../lib/firestore';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ACHIEVEMENTS_DATA } from '../../lib/achievementsData';
import { db } from '../../lib/firebase';

export interface AdminStats {
  total: number;
  totalXp: number;
  totalGames: number;
  owners: number;
  admins: number;
  verified: number;
  newThisWeek: number;
  withGames: number;
  mods: number;
  institutions: number;
  banned: number;
  topUser?: UserProfile;
}

interface AdminToolsProps {
  profile: UserProfile;
  allUsers: UserProfile[];
  posts: CommunityPost[];
  stats: AdminStats;
  setActionMsg: (msg: string) => void;
  reloadUsers: () => void;
}

type ToolsTab = 'mass-xp' | 'badges' | 'stats' | 'export' | 'bans' | 'backup' | 'activity' | 'achievements' | 'audit' | 'reset-user' | 'daily-content' | 'client-errors' | 'papelera';

const toolsTabs: { key: ToolsTab; label: string; short: string }[] = [
  { key: 'mass-xp', label: '🎯 Recompensa Masiva', short: '🎯 XP Masivo' },
  { key: 'achievements', label: '🌐 Logros', short: '🌐 Logros' },
  { key: 'badges', label: '🏅 Insignias', short: '🏅 Insignias' },
  { key: 'stats', label: '📊 Estadísticas', short: '📊 Stats' },
  { key: 'bans', label: '🚫 Baneos', short: '🚫 Baneos' },
  { key: 'audit', label: '📝 Auditoría', short: '📝 Auditoría' },
  { key: 'reset-user', label: '🔄 Reset Usuario', short: '🔄 Reset' },
  { key: 'backup', label: '💾 Respaldo', short: '💾 Respaldo' },
  { key: 'activity', label: '👁️ Actividad', short: '👁️ Actividad' },
  { key: 'daily-content', label: '📅 Contenido Diario', short: '📅 Diario' },
  { key: 'export', label: '📋 CSV', short: '📋 CSV' },
  { key: 'client-errors', label: '⚠️ Errores', short: '⚠️ Errores' },
  { key: 'papelera', label: '🗑️ Papelera', short: '🗑️ Papelera' },
];

export default function AdminTools({ profile, allUsers, posts, stats, setActionMsg, reloadUsers }: AdminToolsProps) {
  const [toolsTab, setToolsTab] = useState<ToolsTab>('mass-xp');
  const [massXpAmount, setMassXpAmount] = useState(10);
  const [massXpReason, setMassXpReason] = useState('');
  const [massXpRunning, setMassXpRunning] = useState(false);
  const [massXpResult, setMassXpResult] = useState<string | null>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [badgeForm, setBadgeForm] = useState({ name: '', emoji: '🏅', color: '#10b981' });
  const [savingBadge, setSavingBadge] = useState(false);
  const [badgeAssignUserId, setBadgeAssignUserId] = useState('');
  const [badgeAssignBadgeId, setBadgeAssignBadgeId] = useState('');
  const [assigningBadge, setAssigningBadge] = useState(false);
  const [badgeAssignResult, setBadgeAssignResult] = useState('');
  const [featuredUsers, setFeaturedUsers] = useState<any[]>([]);
  const [bannedUsers, setBannedUsers] = useState<UserProfile[]>([]);
  const [backupStatus, setBackupStatus] = useState('');
  const [recentActivity, setRecentActivity] = useState({ newUsers: 0, totalPosts: 0, totalComments: 0 });
  const [achievements, setAchievements] = useState<any[]>([]);
  const [achForm, setAchForm] = useState({ name: '', description: '', emoji: '🏆' });
  const [savingAch, setSavingAch] = useState(false);
  const [achAssignUserId, setAchAssignUserId] = useState('');
  const [achAssignAchId, setAchAssignAchId] = useState('');
  const [assigningAch, setAssigningAch] = useState(false);
  const [achAssignResult, setAchAssignResult] = useState('');
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resettingUser, setResettingUser] = useState(false);
  const [resetResult, setResetResult] = useState('');
  const [dailyContentResult, setDailyContentResult] = useState('');
  const [generatingDailyContent, setGeneratingDailyContent] = useState(false);
  const [clientErrors, setClientErrors] = useState<any[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(false);
  const [hiddenPosts, setHiddenPosts] = useState<CommunityPost[]>([]);
  const [loadingHiddenPosts, setLoadingHiddenPosts] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'role_change'>('all');

  useEffect(() => {
    fetchBadges().then(setBadges).catch(() => {});
    fetchAchievements().then(setAchievements).catch(() => {});
  }, []);

  async function loadAdminLogs() {
    setLoadingLogs(true);
    try { setAdminLogs(await fetchAdminLogs(50)); } catch {}
    setLoadingLogs(false);
  }
  async function loadBadges() { try { setBadges(await fetchBadges()); } catch {} }
  async function loadAchievements() { try { setAchievements(await fetchAchievements()); } catch {} }

  useEffect(() => {
    if (toolsTab === 'client-errors' && clientErrors.length === 0) {
      setLoadingErrors(true);
      fetchClientErrors().then(setClientErrors).catch(() => {}).finally(() => setLoadingErrors(false));
    }
    if (toolsTab === 'papelera' && hiddenPosts.length === 0) {
      setLoadingHiddenPosts(true);
      fetchAllPosts().then(all => setHiddenPosts(all.filter(p => p.hidden))).catch(() => {}).finally(() => setLoadingHiddenPosts(false));
    }
    if (toolsTab === 'stats' && featuredUsers.length === 0) {
      getLeaderboard(20).then(data => setFeaturedUsers(data)).catch(() => {});
    }
    if (toolsTab === 'bans') {
      setBannedUsers(allUsers.filter(u => u.banned));
    }
    if (toolsTab === 'activity') {
      const weekMs = 7 * 24 * 60 * 60 * 1000;
      setRecentActivity({
        newUsers: allUsers.filter(u => u.created_at && Date.now() - new Date(u.created_at).getTime() < weekMs).length,
        totalPosts: posts.length,
        totalComments: 0,
      });
    }
    if ((toolsTab === 'audit' || toolsTab === 'activity') && adminLogs.length === 0) {
      loadAdminLogs();
    }
  }, [toolsTab]);

  return (
    <div className="space-y-4">
      {/* Sub-tabs: pills on desktop, select on mobile */}
      <div className="hidden sm:flex gap-1 overflow-x-auto pb-1">
        {toolsTabs.map(t => (
          <button key={t.key} onClick={() => setToolsTab(t.key)}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${toolsTab === t.key ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'}`}>
            {t.short}
          </button>
        ))}
      </div>
      <select value={toolsTab} onChange={e => setToolsTab(e.target.value as ToolsTab)}
        className="sm:hidden input w-full text-sm mb-2">
        {toolsTabs.map(t => (
          <option key={t.key} value={t.key}>{t.label}</option>
        ))}
      </select>

      {toolsTab === 'mass-xp' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Recompensa Masiva
          </h3>
          <p className="text-xs text-slate-500">Otorga XP a todos los usuarios registrados de una sola vez.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <input type="number" min={1} max={10000} value={massXpAmount}
              onChange={e => setMassXpAmount(Number(e.target.value))}
              className="input w-full sm:w-28 text-sm" placeholder="XP" />
            <input type="text" value={massXpReason}
              onChange={e => setMassXpReason(e.target.value)}
              className="input w-full sm:flex-1 text-sm" placeholder="Motivo (ej: 🎉 Felices Fiestas)" />
          </div>
          <button onClick={async () => {
            if (massXpAmount < 1) return;
            setMassXpRunning(true); setMassXpResult(null);
            try {
              const count = await awardMassXP(massXpAmount, massXpReason);
              setMassXpResult(`✅ ${count} usuarios recibieron +${massXpAmount} XP`);
            } catch { setMassXpResult('❌ Error al distribuir XP'); }
            setMassXpRunning(false);
          }} disabled={massXpRunning}
            className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
            {massXpRunning ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Distribuyendo...</>
            ) : (
              <><Zap className="w-3.5 h-3.5" /> Dar {massXpAmount} XP a Todos</>
            )}
          </button>
          {massXpResult && <p className="text-xs font-medium text-emerald-400">{massXpResult}</p>}
        </div>
      )}

      {toolsTab === 'achievements' && (
        <div className="space-y-4">

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Crear Logro
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input type="text" value={achForm.name}
                onChange={e => setAchForm(f => ({ ...f, name: e.target.value }))}
                className="input w-full sm:flex-1 text-sm" placeholder="Nombre del logro" />
              <input type="text" value={achForm.emoji}
                onChange={e => setAchForm(f => ({ ...f, emoji: e.target.value }))}
                className="input w-full sm:w-16 text-center text-lg" placeholder="🏆" />
            </div>
            <textarea value={achForm.description}
              onChange={e => setAchForm(f => ({ ...f, description: e.target.value }))}
              className="input w-full text-sm h-16 resize-none" placeholder="Descripción del logro" />
            <button onClick={async () => {
              if (!achForm.name.trim()) return;
              setSavingAch(true);
              try {
                await createAdminAchievement({ name: achForm.name.trim(), description: achForm.description.trim(), icon: achForm.emoji, created_by: profile.id });
                await addAdminLog('Crear Logro', profile.full_name || 'Admin', `Logro "${achForm.name.trim()}" creado`);
                setActionMsg('✅ Logro creado');
                setAchForm({ name: '', description: '', emoji: '🏆' });
                loadAchievements();
              } catch { setActionMsg('❌ Error al crear'); }
              setSavingAch(false);
            }} disabled={savingAch || !achForm.name.trim()}
              className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <Save className="w-3.5 h-3.5" /> {savingAch ? 'Creando...' : 'Crear Logro'}
            </button>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Asignar Logro a Usuario
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input type="text" value={achAssignUserId}
                onChange={e => setAchAssignUserId(e.target.value)}
                className="input w-full sm:flex-1 text-sm" placeholder="ID del usuario" />
              <select value={achAssignAchId} onChange={e => setAchAssignAchId(e.target.value)}
                className="input w-full sm:flex-1 text-sm">
                <option value="">Seleccionar logro</option>
                {achievements.map(a => (
                  <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                ))}
              </select>
            </div>
            <button onClick={async () => {
              if (!achAssignUserId.trim() || !achAssignAchId) return;
              setAssigningAch(true); setAchAssignResult('');
              try {
                await assignAchievementManually(achAssignUserId.trim(), achAssignAchId);
                const ach = achievements.find(a => a.id === achAssignAchId);
                await addAdminLog('Asignar Logro', profile.full_name || 'Admin', `Logro "${ach?.name}" asignado a ${achAssignUserId.trim()}`);
                setAchAssignResult('✅ Logro asignado');
                setAchAssignUserId('');
              } catch { setAchAssignResult('❌ Error al asignar'); }
              setAssigningAch(false);
            }} disabled={assigningAch || !achAssignUserId.trim() || !achAssignAchId}
                className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <UserCheck className="w-3.5 h-3.5" /> {assigningAch ? 'Asignando...' : 'Asignar'}
            </button>
            {achAssignResult && <p className="text-xs font-medium text-emerald-400">{achAssignResult}</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={async () => {
              const snap = await getDocs(collection(db, 'achievements'));
              const seen = new Map<string, string[]>();
              snap.forEach(d => {
                const name = d.data().name;
                if (!seen.has(name)) seen.set(name, []);
                seen.get(name)!.push(d.id);
              });
              let deleted = 0;
              for (const [, ids] of seen) {
                if (ids.length <= 1) continue;
                for (let i = 1; i < ids.length; i++) {
                  await deleteDoc(doc(db, 'achievements', ids[i]));
                  deleted++;
                }
              }
              setActionMsg(`✅ ${deleted} duplicado(s) eliminado(s)`);
              loadAchievements();
            }} className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <Trash2 className="w-3.5 h-3.5" /> Limpiar Duplicados
            </button>
            <button onClick={async () => {
              const snap = await getDocs(collection(db, 'achievements'));
              let updated = 0;
              for (const d of snap.docs) {
                const data = d.data();
                const match = ACHIEVEMENTS_DATA.find(a => a.name === data.name);
                if (match && match.icon && data.icon !== match.icon) {
                  await updateDoc(doc(db, 'achievements', d.id), { icon: match.icon });
                  updated++;
                }
              }
              setActionMsg(`✅ ${updated} icono(s) actualizado(s)`);
              loadAchievements();
            }} className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <Download className="w-3.5 h-3.5" /> Sincronizar Iconos
            </button>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Logros Existentes ({achievements.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {achievements.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    {(a.icon?.startsWith('/') || a.icon?.startsWith('http')) ? <img src={a.icon} alt="" className="w-7 h-7 object-contain" /> : <span className="text-xl">{a.icon || '🏆'}</span>}
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{a.name}</p>
                      <p className="text-[10px] text-slate-500">{a.description}</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (!confirm('¿Eliminar este logro?')) return;
                    try { await deleteAdminAchievement(a.id); loadAchievements(); setActionMsg('✅ Logro eliminado'); } catch {}
                  }} aria-label="Eliminar" className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {achievements.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay logros aún</p>}
            </div>
          </div>
        </div>
      )}

      {toolsTab === 'badges' && (
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Crear Insignia
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input type="text" value={badgeForm.name}
                onChange={e => setBadgeForm(f => ({ ...f, name: e.target.value }))}
                className="input w-full sm:flex-1 text-sm" placeholder="Nombre de la insignia" />
              <input type="text" value={badgeForm.emoji}
                onChange={e => setBadgeForm(f => ({ ...f, emoji: e.target.value }))}
                className="input w-full sm:w-16 text-center text-lg" placeholder="🏅" />
              <input type="color" value={badgeForm.color}
                onChange={e => setBadgeForm(f => ({ ...f, color: e.target.value }))}
                className="w-full sm:w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-slate-700" />
            </div>
            <button onClick={async () => {
              if (!badgeForm.name.trim()) return;
              setSavingBadge(true);
              try {
                await createBadge({ name: badgeForm.name.trim(), emoji: badgeForm.emoji, color: badgeForm.color, created_by: profile.id });
                setActionMsg('✅ Insignia creada');
                setBadgeForm({ name: '', emoji: '🏅', color: '#10b981' });
                loadBadges();
              } catch { setActionMsg('❌ Error al crear'); }
              setSavingBadge(false);
            }} disabled={savingBadge || !badgeForm.name.trim()}
              className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <Save className="w-3.5 h-3.5" /> {savingBadge ? 'Creando...' : 'Crear Insignia'}
            </button>
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Asignar Insignia
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input type="text" value={badgeAssignUserId}
                onChange={e => setBadgeAssignUserId(e.target.value)}
                className="input w-full sm:flex-1 text-sm" placeholder="ID del usuario" />
              <select value={badgeAssignBadgeId} onChange={e => setBadgeAssignBadgeId(e.target.value)}
                className="input w-full sm:flex-1 text-sm">
                <option value="">Seleccionar insignia</option>
                {badges.map(b => (
                  <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>
                ))}
              </select>
            </div>
            <button onClick={async () => {
              if (!badgeAssignUserId.trim() || !badgeAssignBadgeId) return;
              setAssigningBadge(true); setBadgeAssignResult('');
              try {
                await assignBadgeToUser(badgeAssignUserId.trim(), badgeAssignBadgeId);
                setBadgeAssignResult('✅ Insignia asignada');
                setBadgeAssignUserId('');
              } catch { setBadgeAssignResult('❌ Error al asignar'); }
              setAssigningBadge(false);
            }} disabled={assigningBadge || !badgeAssignUserId.trim() || !badgeAssignBadgeId}
              className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <UserCheck className="w-3.5 h-3.5" /> {assigningBadge ? 'Asignando...' : 'Asignar'}
            </button>
            {badgeAssignResult && <p className="text-xs font-medium text-emerald-400">{badgeAssignResult}</p>}
          </div>

          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Insignias Existentes ({badges.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {badges.map(b => (
                <div key={b.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{b.emoji}</span>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{b.name}</p>
                      <p className="text-[10px] text-slate-500">{b.id}</p>
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (!confirm('¿Eliminar esta insignia?')) return;
                    try { await deleteBadge(b.id); loadBadges(); setActionMsg('✅ Insignia eliminada'); } catch {}
                  }} aria-label="Eliminar" className="text-slate-500 hover:text-red-400 transition-colors p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {badges.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay insignias aún</p>}
            </div>
          </div>
        </div>
      )}

      {toolsTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Jugadores por XP
            </h3>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {featuredUsers.map((u: any, i: number) => (
                <div key={u.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'text-slate-500 bg-slate-700/30'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">{u.full_name || u.username || u.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-slate-500">Nivel {u.level || 1}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{(u.total_xp || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">XP</p>
                  </div>
                </div>
              ))}
              {featuredUsers.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Totales del Sistema
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Users className="w-4 h-4" />, value: allUsers.length, label: 'Usuarios', color: 'text-blue-400', bg: 'bg-blue-500/15' },
                { icon: <Zap className="w-4 h-4" />, value: stats.totalXp.toLocaleString(), label: 'XP Total', color: 'text-amber-400', bg: 'bg-amber-500/15' },
                { icon: <Gamepad2 className="w-4 h-4" />, value: stats.totalGames.toLocaleString(), label: 'Partidas Jugadas', color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
                { icon: <Crown className="w-4 h-4" />, value: stats.owners, label: 'Dueño(s)', color: 'text-amber-400', bg: 'bg-amber-500/15' },
                { icon: <ShieldCheck className="w-4 h-4" />, value: stats.admins, label: 'Admins', color: 'text-blue-400', bg: 'bg-blue-500/15' },
              ].map((card, i) => (
                <div key={i} className={`${card.bg} rounded-xl p-3 border border-transparent`}>
                  <div className="flex items-center gap-2">
                    {card.icon}
                    <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{card.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toolsTab === 'bans' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Gavel className="w-4 h-4 text-red-400" />
            Usuarios Baneados ({bannedUsers.length})
          </h3>
          {bannedUsers.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">No hay usuarios baneados</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bannedUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between bg-slate-800/40 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-200 font-medium">{u.full_name || u.username || u.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-slate-500">
                      {u.id?.slice(0, 12)}...
                      {u.ban_reason && <span className="text-red-400 ml-2">Motivo: {u.ban_reason}</span>}
                    </p>
                  </div>
                  <button onClick={async () => {
                    if (!confirm(`¿Desbanear a ${u.full_name || u.username || 'este usuario'}?`)) return;
                    try { await unbanUser(u.id); setActionMsg('✅ Usuario desbaneado'); reloadUsers(); setBannedUsers(prev => prev.filter(x => x.id !== u.id)); } catch {}
                  }} className="text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors">
                    Desbanear
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {toolsTab === 'backup' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            Respaldo de Contenido
          </h3>
          <p className="text-xs text-slate-500">Descarga un JSON con todas las publicaciones y proyectos de la comunidad.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={async () => {
              try {
                const [allPosts, allProjects] = await Promise.all([fetchPosts(), fetchAdminProjects()]);
                const backup = { exported_at: new Date().toISOString(), posts: allPosts, projects: allProjects };
                const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `respaldo_${new Date().toISOString().slice(0, 10)}.json`; a.click();
                URL.revokeObjectURL(url);
                setBackupStatus('✅ Respaldo descargado');
              } catch { setBackupStatus('❌ Error al generar respaldo'); }
            }} className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-1.5 w-full sm:w-fit">
              <Download className="w-3.5 h-3.5" /> Descargar JSON (Posts + Proyectos)
            </button>
          </div>
          {backupStatus && <p className="text-xs font-medium text-emerald-400">{backupStatus}</p>}
        </div>
      )}

      {toolsTab === 'activity' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-400" />
                Resumen de Actividad (7 días)
              </h3>
              <div className="space-y-3">
                {[
                  { icon: <UserPlus className="w-4 h-4" />, value: recentActivity.newUsers, label: 'Usuarios nuevos', color: 'text-blue-400' },
                  { icon: <MessageSquare className="w-4 h-4" />, value: recentActivity.totalPosts, label: 'Publicaciones totales', color: 'text-emerald-400' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <p className="text-xs text-slate-400">{item.label}</p>
                    </div>
                    <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-400" />
                Últimos Usuarios Registrados
              </h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {[...allUsers].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 15).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-1.5">
                    <p className="text-sm text-slate-200">{u.full_name || u.username || u.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString('es') : '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              Acciones de Administradores
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={loadAdminLogs} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Actualizar
              </button>
              <div className="flex gap-1">
                <button onClick={() => setLogFilter('all')} className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${logFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>Todos</button>
                <button onClick={() => setLogFilter('role_change')} className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${logFilter === 'role_change' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>Cambios de rol</button>
              </div>
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {loadingLogs ? (
                <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
              ) : adminLogs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">No hay acciones registradas</p>
              ) : (
                adminLogs.filter(l => logFilter === 'all' || l.action === logFilter).map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 bg-slate-800/30 rounded-lg px-3 py-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 font-medium">{log.action}</p>
                      <p className="text-[10px] text-slate-500 truncate">{log.details}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {log.admin_name} · {log.created_at ? new Date(log.created_at).toLocaleString('es') : '—'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {toolsTab === 'audit' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Registro de Auditoría
          </h3>
          <p className="text-xs text-slate-500">Últimas acciones realizadas en el panel de administración.</p>
          <div className="flex items-center gap-2">
            <button onClick={loadAdminLogs} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Actualizar
            </button>
            <div className="flex gap-1">
              <button onClick={() => setLogFilter('all')} className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${logFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>Todos</button>
              <button onClick={() => setLogFilter('role_change')} className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${logFilter === 'role_change' ? 'bg-slate-700 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>Cambios de rol</button>
            </div>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {loadingLogs ? (
              <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
            ) : adminLogs.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay registros aún</p>
            ) : (
              adminLogs.filter(l => logFilter === 'all' || l.action === logFilter).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 bg-slate-800/30 rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-medium">{log.action}</p>
                    <p className="text-[10px] text-slate-500 truncate">{log.details}</p>
                    <p className="text-[9px] text-slate-600 mt-0.5">
                      {log.admin_name} · {log.created_at ? new Date(log.created_at).toLocaleString('es') : '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {toolsTab === 'reset-user' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Resetear Datos de Usuario
          </h3>
          <p className="text-xs text-slate-500">Reinicia el XP, nivel, high score y partidas de un usuario.</p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input type="text" value={resetUserId}
              onChange={e => setResetUserId(e.target.value)}
              className="input w-full text-sm" placeholder="ID del usuario" />
          </div>
          <button onClick={async () => {
            if (!resetUserId.trim()) return;
            if (!confirm(`¿Resetear todos los datos de juego de ${resetUserId.trim()}? Esta acción no se puede deshacer.`)) return;
            setResettingUser(true); setResetResult('');
            try {
              await resetUserGameData(resetUserId.trim());
              await addAdminLog('Reset Usuario', profile.full_name || 'Admin', `Datos de juego reseteados para ${resetUserId.trim()}`);
              setResetResult('✅ Datos del usuario reseteados');
              setResetUserId('');
            } catch { setResetResult('❌ Error al resetear'); }
            setResettingUser(false);
          }} disabled={resettingUser || !resetUserId.trim()}
            className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
            <RefreshCw className="w-3.5 h-3.5" /> {resettingUser ? 'Reseteando...' : 'Resetear Datos'}
          </button>
          {resetResult && <p className="text-xs font-medium text-emerald-400">{resetResult}</p>}
        </div>
      )}

      {toolsTab === 'daily-content' && (
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Contenido Diario
          </h3>
          <p className="text-xs text-slate-500">Genera un nuevo dato/tip diario para el "Dato de hoy" en la pantalla de inicio. El contenido se guarda automáticamente en Firestore y se muestra a los usuarios.</p>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Fecha objetivo</p>
            <input type="text" defaultValue={new Date().toISOString().split('T')[0]}
              className="input w-full sm:w-40 text-sm" disabled />
            <p className="text-[10px] text-slate-600 mt-1">Se genera automáticamente para la fecha de hoy. Solo acepta formato numérico (YYYY-MM-DD).</p>
          </div>
          <button onClick={async () => {
            setGeneratingDailyContent(true); setDailyContentResult('');
            try {
              const today = new Date().toISOString().split('T')[0];
              const content = await generateDailyContent(today);
              setDailyContentResult(`✅ Contenido generado:\n"${content}"`);
            } catch { setDailyContentResult('❌ Error al generar contenido'); }
            setGeneratingDailyContent(false);
          }} disabled={generatingDailyContent}
            className="text-xs font-bold text-emerald-400 px-4 py-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 flex items-center justify-center gap-1.5 w-full sm:w-fit">
            {generatingDailyContent ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generando...</>
            ) : (
              <><Calendar className="w-3.5 h-3.5" /> Generar contenido para hoy</>
            )}
          </button>
          {dailyContentResult && (
            <div className="text-xs text-emerald-400 bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/20 whitespace-pre-wrap">
              {dailyContentResult}
            </div>
          )}
        </div>
      )}

      {toolsTab === 'export' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Copy className="w-4 h-4 text-emerald-400" />
            Exportar Usuarios a CSV
          </h3>
          <p className="text-xs text-slate-500">Descarga un archivo CSV con todos los usuarios registrados.</p>
          <button onClick={() => {
            const csv = [
              ['ID', 'Nombre', 'Username', 'Email', 'Rol', 'Verificado', 'Nivel', 'XP Total', 'Partidas', 'High Score', 'Creado'].join(','),
              ...allUsers.map(u => [
                u.id,
                `"${(u.full_name || '').replace(/"/g, '""')}"`,
                `"${(u.username || '').replace(/"/g, '""')}"`,
                `"${((u as any).email || '').replace(/"/g, '""')}"`,
                u.role || 'user',
                u.verified ? 'Sí' : 'No',
                u.level || 1,
                u.total_xp || 0,
                u.games_played || 0,
                u.high_score || 0,
                u.created_at || '',
              ].join(',')),
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'usuarios.csv'; a.click();
            URL.revokeObjectURL(url);
            setActionMsg('✅ CSV descargado');
          }}
            className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-1.5 w-full sm:w-fit">
            <Download className="w-3.5 h-3.5" /> Descargar CSV ({allUsers.length} usuarios)
          </button>
        </div>
      )}

      {toolsTab === 'client-errors' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Errores del Cliente
          </h3>
          <button onClick={() => { setLoadingErrors(true); fetchClientErrors().then(setClientErrors).catch(() => {}).finally(() => setLoadingErrors(false)); }}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Recargar
          </button>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loadingErrors ? (
              <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
            ) : clientErrors.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Sin errores registrados</p>
            ) : (
              clientErrors.map((e: any) => (
                <div key={e.id} className="bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                  <p className="text-xs font-medium text-red-400">{e.message}</p>
                  {e.context && <p className="text-[10px] text-slate-400 mt-1">Contexto: {e.context}</p>}
                  {e.stack && <details className="mt-1"><summary className="text-[10px] text-slate-500 cursor-pointer">Stack</summary><pre className="text-[9px] text-slate-500 mt-1 whitespace-pre-wrap">{e.stack}</pre></details>}
                  <p className="text-[9px] text-slate-600 mt-1">
                    {e.url && <span>URL: {e.url.slice(0, 80)} · </span>}
                    {e.timestamp?.toDate?.()?.toLocaleString('es') || ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {toolsTab === 'papelera' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-400" />
            Posts Ocultos / Papelera ({hiddenPosts.length})
          </h3>
          <button onClick={() => { setLoadingHiddenPosts(true); fetchAllPosts().then(all => setHiddenPosts(all.filter(p => p.hidden))).catch(() => {}).finally(() => setLoadingHiddenPosts(false)); }}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Recargar
          </button>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loadingHiddenPosts ? (
              <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
            ) : hiddenPosts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay posts ocultos</p>
            ) : (
              hiddenPosts.map(p => (
                <div key={p.id} className="bg-amber-500/5 border border-amber-500/10 rounded-xl px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{p.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{p.content}</p>
                      <p className="text-[10px] text-slate-600 mt-1">
                        ♥ {p.likes_count} · 💬 {p.comments_count} · {p.type} · {p.created_at?.toDate?.()?.toLocaleDateString('es') || ''}
                      </p>
                    </div>
                    <button onClick={async () => {
                      try { await unhidePost(p.id); setActionMsg('✅ Post restaurado'); setHiddenPosts(prev => prev.filter(x => x.id !== p.id)); } catch { setActionMsg('❌ Error'); }
                    }} className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
                      Restaurar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
