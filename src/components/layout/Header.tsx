import { useEffect, useState, useRef } from 'react';
import { Bell, Search, Leaf, Settings, MessageCircle, Heart, UserPlus, CheckCheck, Megaphone } from 'lucide-react';
import { UserProfile, xpToLevel, timeAgo, fetchMyPostIds, fetchCommentsOnPosts, fetchProfile, fetchGlobalNotificationsForUser } from '../../lib/firestore';
import { LocalNotifications } from '@capacitor/local-notifications';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  profile: UserProfile | null;
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  post_id?: string;
  display_name?: string;
  read: boolean;
  created_at: string;
}

export default function Header({ currentPage, onNavigate, profile }: HeaderProps) {
  const levelInfo = profile ? xpToLevel(profile.total_xp) : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.id) return;
    const load = async () => {
      const postIds = await fetchMyPostIds(profile.id);
      let commentNotifs: NotificationItem[] = [];
      if (postIds.length > 0) {
        const comments = await fetchCommentsOnPosts(postIds);
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const userNames: Record<string, string> = {};
        for (const uid of userIds) {
          if (uid === profile.id) { userNames[uid] = 'tú'; continue; }
          const u = await fetchProfile(uid);
          userNames[uid] = u?.full_name || u?.username || 'Alguien';
        }
        commentNotifs = comments.map(c => ({
          id: c.id,
          type: 'comment',
          message: `${userNames[c.user_id] || 'Alguien'} comentó: "${(c.content || '').slice(0, 80)}"`,
          post_id: c.post_id,
          read: false,
          created_at: c.created_at ? (typeof c.created_at === 'object' ? (c.created_at as any).toDate?.().toISOString() : c.created_at) : '',
        }));
      }
      const globalNotifs = await fetchGlobalNotificationsForUser();
      const allNotifs = [...globalNotifs, ...commentNotifs];
      const seenKey = 'eco_seen_notifs_' + profile.id;
      const seen = new Set<string>(JSON.parse(localStorage.getItem(seenKey) || '[]'));
      const newNotifs = allNotifs.filter(n => n.id && !seen.has(n.id));
      if (newNotifs.length > 0) {
        try {
          await LocalNotifications.requestPermissions();
          for (const n of newNotifs.slice(0, 3)) {
            await LocalNotifications.schedule({
              notifications: [{
                title: n.type === 'global' ? '📢 EcoReEngine' : n.type === 'comment' ? '💬 Nuevo comentario' : '🔔 Notificación',
                body: n.message,
                id: Number(n.id.replace(/\D/g, '').slice(0, 8)) || Date.now(),
              }],
            });
            seen.add(n.id);
          }
        } catch {}
        localStorage.setItem(seenKey, JSON.stringify([...seen]));
      }
      setNotifications(allNotifs);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    if (showNotifs) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showNotifs]);

  function markAllRead() {
    setReadIds(new Set(notifications.map(n => n.id)));
  }

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const NOTIF_ICONS: Record<string, React.ElementType> = {
    comment: MessageCircle, like: Heart, post: UserPlus, global: Megaphone,
  };
  const NOTIF_COLORS: Record<string, string> = {
    comment: 'text-teal-400', like: 'text-rose-400', post: 'text-emerald-400', global: 'text-amber-400',
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-20 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/50 px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0 max-w-[55%]">
        <img src="/logo/logo.jpeg?v=6" alt="EcoReEngine" loading="lazy" className="w-7 h-7 rounded-lg object-contain flex-shrink-0" />
        <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight truncate">EcoReEngine</h1>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar tutoriales, componentes..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-48"
            onKeyDown={e => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                sessionStorage.setItem('eco_search_query', e.currentTarget.value.trim());
                setSearchQuery('');
                onNavigate('assistant');
              }
            }} />
        </div>

        {levelInfo && (
          <div className="hidden md:flex items-center gap-2 glass rounded-xl px-3 py-1.5">
            <Leaf className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400">{profile?.total_xp.toLocaleString()} XP</span>
          </div>
        )}

        <div ref={notifRef} className="relative">
          <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unreadCount > 0) { setReadIds(new Set(notifications.map(n => n.id))); setTimeout(() => setNotifications([]), 600); } }}
            className="relative text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800 transition-colors">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-2.5 w-4.5 h-4.5 bg-emerald-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="fixed md:absolute right-4 md:right-0 top-16 md:top-full md:mt-2 left-4 md:left-auto w-auto md:w-96 glass rounded-2xl border border-slate-700/50 shadow-2xl shadow-slate-950/50 overflow-hidden z-50 animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <h4 className="text-sm font-bold text-slate-100">Notificaciones</h4>
                {unreadCount > 0 && (
                  <button onClick={() => { markAllRead(); setTimeout(() => setNotifications([]), 300); }} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas leídas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Sin notificaciones</p>
                  </div>
                ) : notifications.map(n => {
                  const Icon = NOTIF_ICONS[n.type] || Bell;
                  return (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors cursor-pointer ${!readIds.has(n.id) ? 'bg-emerald-500/5' : ''}`}
                      onClick={() => { if (n.post_id) onNavigate('community'); setShowNotifs(false); }}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-slate-700 ${NOTIF_COLORS[n.type] || 'text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                      {!readIds.has(n.id) && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button onClick={() => onNavigate('settings')}
          className={`text-slate-400 hover:text-slate-100 p-2 rounded-xl hover:bg-slate-800 transition-colors ${currentPage === 'settings' ? 'text-emerald-400 bg-emerald-500/10' : ''}`}
          title="Configuración de la App">
          <Settings className="w-5 h-5" />
        </button>


      </div>
    </header>
  );
}
