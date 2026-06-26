import { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Search, ShieldCheck, Shield, ShieldX, Crown, ChevronDown, ChevronUp, Edit3, Trash2, MessageSquare, Users, BarChart3, Megaphone, Calendar, Hash, Pin, PinOff, Download, Copy, Clock, Activity, Menu, X, Plus, Save, Gavel, MessageCircle, Bell, Send, Image as ImageIcon, Globe, BookOpen, AlertTriangle, Smartphone, Zap, Star, UserCheck, EyeOff, RefreshCw, UserPlus, Building2 } from 'lucide-react';
import { sanitize } from '../lib/sanitize';
import { UserProfile, UserRole, listAllUsers, setUserVerified, setUserRole, deletePost, permanentDeletePost, deleteComment, fetchPosts, fetchAllPosts, fetchComments, CommunityPost, fetchAppConfig, setAppAnnouncement, AppConfig, togglePostPinned, searchUserById, banUser, unbanUser, fetchAdminProjects, createAdminProject, updateAdminProject, deleteAdminProject, AdminProject, sendAdminChatMessage, fetchAdminChatMessages, AdminChatMessage, sendGlobalNotification, fetchGlobalNotifications, GlobalNotification, sendDirectNotification, createAppPost, fetchAppUpdate, setAppUpdate, AppUpdate, fetchAdminLogs, hidePost, unhidePost, updateAppConfig, uploadImage, invalidateCache, DictionaryEntry, fetchDictionaryEntries, createDictionaryEntry, updateDictionaryEntry, deleteDictionaryEntry } from '../lib/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import VerifiedBadge from '../components/VerifiedBadge';
import AdminTools from './admin/AdminTools';

interface AdminPageProps {
  profile: UserProfile;
  onProfileUpdate: () => void;
  onBack: () => void;
}

type UserFilter = 'all' | 'admins' | 'mods' | 'verified' | 'new' | 'banned' | 'institutions';
type AdminSection = 'dashboard' | 'users' | 'posts' | 'announcement' | 'projects' | 'institution-projects' | 'chat' | 'app-post' | 'notify' | 'update' | 'tools' | 'reports' | 'dictionary';

export default function AdminPage({ profile, onProfileUpdate, onBack }: AdminPageProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const [actionMsg, setActionMsg] = useState('');

  // ─── Users ───
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [searchById, setSearchById] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [banReason, setBanReason] = useState('');
  const [banModal, setBanModal] = useState<string | null>(null);
  const [banExpiration, setBanExpiration] = useState('permanent');

  // ─── Posts ───
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);

  // ─── Announcement ───
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // ─── Admin Projects ───
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectForm, setProjectForm] = useState({ title: '', description: '', materials: '' as string, tools: '' as string, steps: '' as string, tips: '' as string, difficulty: '' });
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [savingProject, setSavingProject] = useState(false);


  // ─── Admin Chat ───
  const [chatMessages, setChatMessages] = useState<AdminChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── App Post ───
  const [appPostTitle, setAppPostTitle] = useState('');
  const [appPostContent, setAppPostContent] = useState('');
  const [appPostType, setAppPostType] = useState<CommunityPost['type']>('project');
  const [appPostImageFile, setAppPostImageFile] = useState<File | null>(null);
  const [appPostImagePreview, setAppPostImagePreview] = useState<string | null>(null);
  const [sendingAppPost, setSendingAppPost] = useState(false);

  // ─── Notify ───
  const [notifications, setNotifications] = useState<GlobalNotification[]>([]);
  const [notifyMessage, setNotifyMessage] = useState('');
  const [sendingNotify, setSendingNotify] = useState(false);
  const [directUserId, setDirectUserId] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [sendingDirect, setSendingDirect] = useState(false);

  // ─── App Update ───
  const [appUpdate, setAppUpdateState] = useState<AppUpdate | null>(null);
  const [updateVersion, setUpdateVersion] = useState('');
  const [updateApkFile, setUpdateApkFile] = useState<File | null>(null);
  const [updateChangelog, setUpdateChangelog] = useState('');
  const [updateForce, setUpdateForce] = useState(false);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [uploadingApk, setUploadingApk] = useState(false);

  // ─── Tools ───
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // ─── Dictionary ───
  const [dictEntries, setDictEntries] = useState<DictionaryEntry[]>([]);
  const [loadingDict, setLoadingDict] = useState(false);
  const [dictForm, setDictForm] = useState({ name: '', category: '', description: '', function_desc: '', unit: '', common_source: '', image_url: '', color_class: '' });
  const [savingDict, setSavingDict] = useState(false);
  const [editingDictId, setEditingDictId] = useState<string | null>(null);
  const [dictImageFile, setDictImageFile] = useState<File | null>(null);
  const [dictImagePreview, setDictImagePreview] = useState<string | null>(null);

  const sortedPosts = useMemo(() => [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)), [posts]);

  useEffect(() => {
    loadUsers(); loadPosts(); loadConfig(); loadAdminProjects(); loadChat(); loadNotifications(); loadUpdate();
  }, []);

  useEffect(() => {
    if (activeSection === 'dictionary' && dictEntries.length === 0) loadDictionary();
  }, [activeSection]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (activeSection === 'reports' && reports.length === 0) {
      setLoadingReports(true);
      fetchAdminLogs(100).then(logs => {
        setReports(logs.filter(l => l.action === 'report_content'));
      }).catch(() => {}).finally(() => setLoadingReports(false));
    }
  }, [activeSection]);

  // ─── Loaders ───
  async function loadConfig() {
    const c = await fetchAppConfig();
    if (c) { setConfig(c); setAnnouncementText(c.announcement); setAnnouncementEnabled(c.announcement_enabled); }
  }
  async function loadUsers() {
    setLoadingUsers(true);
    try { setAllUsers(await listAllUsers(1000)); } catch (e) { console.error('loadUsers error:', e); }
    setLoadingUsers(false);
  }
  async function loadPosts() {
    setLoadingPosts(true);
    try { setPosts(await fetchAllPosts()); } catch {}
    setLoadingPosts(false);
  }
  async function loadAdminProjects() {
    setLoadingProjects(true);
    try { invalidateCache('admin_projects'); setAdminProjects(await fetchAdminProjects()); } catch {}
    setLoadingProjects(false);
  }
  async function loadChat() {
    try { setChatMessages(await fetchAdminChatMessages()); } catch {}
  }
  async function loadNotifications() {
    try { setNotifications(await fetchGlobalNotifications()); } catch {}
  }
  async function loadUpdate() {
    try {
      const u = await fetchAppUpdate();
      if (u) {
        setAppUpdateState(u);
        setUpdateVersion(u.version);
        setUpdateChangelog(u.changelog);
        setUpdateForce(u.force_update);
      }
    } catch {}
  }
  async function loadDictionary() {
    setLoadingDict(true);
    try { setDictEntries(await fetchDictionaryEntries()); } catch {}
    setLoadingDict(false);
  }

  // ─── Users logic ───
  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (search.trim()) {
      if (searchById) {
        list = list.filter(u => u.id.toLowerCase().includes(search.toLowerCase()));
      } else {
        list = list.filter(u =>
          u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.username?.toLowerCase().includes(search.toLowerCase())
        );
      }
    }
    switch (userFilter) {
      case 'admins': return list.filter(u => u.role === 'owner' || u.id === profile.id);
      case 'mods': return list.filter(u => u.role === 'admin' || u.role === 'mod');
      case 'institutions': return list.filter(u => u.role === 'institution');
      case 'verified': return list.filter(u => u.verified);
      case 'banned': return list.filter(u => u.banned);
      case 'new': return list.filter(u => u.created_at && Date.now() - new Date(u.created_at).getTime() < 7 * 24 * 60 * 60 * 1000);
      default: return list;
    }
  }, [allUsers, search, searchById, userFilter]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const stats = useMemo(() => ({
    total: allUsers.length,
    totalXp: allUsers.reduce((s, u) => s + (u.total_xp ?? 0), 0),
    totalGames: allUsers.reduce((s, u) => s + (u.games_played ?? 0), 0),
    owners: allUsers.filter(u => u.role === 'owner' || u.id === profile.id).length,
    admins: allUsers.filter(u => u.role === 'admin' && u.id !== profile.id).length,
    verified: allUsers.filter(u => u.verified).length,
    newThisWeek: allUsers.filter(u => u.created_at && new Date(u.created_at).getTime() > weekAgo).length,
    withGames: allUsers.filter(u => (u.games_played ?? 0) > 0).length,
    mods: allUsers.filter(u => u.role === 'mod').length,
    institutions: allUsers.filter(u => u.role === 'institution').length,
    banned: allUsers.filter(u => u.banned).length,
    topUser: allUsers.reduce((best, u) => (u.total_xp ?? 0) > ((best?.total_xp) ?? 0) ? u : best, allUsers[0]),
  }), [allUsers]);

  const filterTabs: { key: UserFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: allUsers.length },
    { key: 'admins', label: 'Dueños', count: stats.owners },
    { key: 'mods', label: 'Admins', count: stats.admins },
    { key: 'institutions', label: 'Instituciones', count: stats.institutions },
    { key: 'verified', label: 'Verificados', count: stats.verified },
    { key: 'banned', label: 'Baneados', count: stats.banned },
    { key: 'new', label: 'Nuevos', count: stats.newThisWeek },
  ];

  async function toggleUserVerified(userId: string, current: boolean) {
    setUpdatingUserId(userId);
    try { await setUserVerified(userId, !current); setActionMsg('✓ Verificado actualizado'); loadUsers(); await onProfileUpdate(); } catch { setActionMsg('Error'); }
    setUpdatingUserId(null);
  }
  async function changeUserRole(userId: string, role: UserRole) {
    setUpdatingUserId(userId);
    try { await setUserRole(userId, role); setActionMsg('Rol cambiado a ' + role); loadUsers(); await onProfileUpdate(); } catch { setActionMsg('Error'); }
    setUpdatingUserId(null);
  }
  function toggleExpand(u: UserProfile) {
    if (expandedUserId === u.id) { setExpandedUserId(null); return; }
    setExpandedUserId(u.id);
  }
  async function handleSearchById() {
    if (!search.trim()) return;
    const user = await searchUserById(search.trim());
    if (user) {
      if (!allUsers.find(u => u.id === user.id)) {
        setAllUsers(prev => { const exists = prev.find(u => u.id === user.id); return exists ? prev : [user, ...prev]; });
      }
      setExpandedUserId(user.id);
    } else { setActionMsg('Usuario no encontrado'); }
  }
  function exportUsers() {
    const lines = filteredUsers.map((u, i) =>
      `${i + 1}. ${u.full_name || '?'} | ${u.role || 'user'}${u.verified ? ' ✓' : ''}${u.banned ? ' 🚫' : ''} | ${u.total_xp ?? 0} XP | ID: ${u.id.slice(0, 8)}...`
    );
    const text = `Usuarios (${filteredUsers.length})\n${'─'.repeat(48)}\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text).then(() => setActionMsg('Lista copiada al portapapeles'));
  }
  async function handleBan(userId: string) {
    if (!banReason.trim()) return;
    setUpdatingUserId(userId);
    let expiresAt: string | null = null;
    if (banExpiration === '24h') {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else if (banExpiration === '7d') {
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (banExpiration === '30d') {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    try { await banUser(userId, banReason.trim(), profile.id, expiresAt); setActionMsg('Usuario baneado'); loadUsers(); } catch { setActionMsg('Error'); }
    setUpdatingUserId(null); setBanModal(null); setBanReason(''); setBanExpiration('permanent');
  }
  async function handleUnban(userId: string) {
    setUpdatingUserId(userId);
    try { await unbanUser(userId); setActionMsg('Usuario desbaneado'); loadUsers(); } catch { setActionMsg('Error'); }
    setUpdatingUserId(null);
  }

  // ─── Posts logic ───
  async function handleDeletePost(postId: string) {
    if (!confirm('¿Mover este post a la papelera? Se puede recuperar después.')) return;
    try { await deletePost(postId); setActionMsg('Post movido a papelera'); loadPosts(); } catch { setActionMsg('Error'); }
  }
  async function handlePermanentDelete(postId: string) {
    if (!confirm('⚠️ ¿Eliminar permanentemente? Esta acción NO se puede deshacer.')) return;
    if (!confirm('¿Estás seguro? El post se borrará para siempre.')) return;
    try { await permanentDeletePost(postId); setActionMsg('Post eliminado permanentemente'); loadPosts(); } catch { setActionMsg('Error'); }
  }
  async function handleHidePost(postId: string) {
    try { await hidePost(postId); setActionMsg('Post ocultado'); loadPosts(); } catch { setActionMsg('Error'); }
  }
  async function handleUnhidePost(postId: string) {
    try { await unhidePost(postId); setActionMsg('Post restaurado'); loadPosts(); } catch { setActionMsg('Error'); }
  }
  async function handleTogglePin(postId: string, current: boolean) {
    try { await togglePostPinned(postId, !current); setActionMsg(current ? 'Post desanclado' : 'Post anclado'); loadPosts(); } catch { setActionMsg('Error'); }
  }
  async function handleViewComments(postId: string) {
    if (expandedPostId === postId) { setExpandedPostId(null); return; }
    setExpandedPostId(postId);
    try { setPostComments(await fetchComments(postId)); } catch { setPostComments([]); }
  }
  async function handleDeleteComment(commentId: string) {
    if (!confirm('¿Eliminar este comentario?')) return;
    try { await deleteComment(commentId); setActionMsg('Comentario eliminado'); setPostComments(prev => prev.filter(c => c.id !== commentId)); } catch { setActionMsg('Error'); }
  }

  // ─── Announcement logic ───
  async function saveAnnouncement() {
    setSavingAnnouncement(true);
    try { await setAppAnnouncement(announcementText, announcementEnabled, profile.id); setActionMsg('Comunicado guardado'); loadConfig(); } catch { setActionMsg('Error al guardar'); }
    setSavingAnnouncement(false);
  }

  // ─── Projects logic ───
  async function handleSaveProject() {
    if (!projectForm.title.trim() || !projectForm.description.trim() || !projectForm.materials.trim() || !projectForm.tools.trim() || !projectForm.steps.trim()) {
      setActionMsg('Todos los campos obligatorios deben estar llenos'); return;
    }
    setSavingProject(true);
    try {
      const data = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        image_url: '',
        materials: projectForm.materials.split('\n').filter(Boolean).map(l => {
          const parts = l.split('|');
          return { name: parts[0]?.trim() || l.trim(), source: parts[1]?.trim() || '' };
        }),
        tools: projectForm.tools.split('\n').filter(Boolean).map(l => l.trim()),
        steps: projectForm.steps.split('\n').filter(Boolean).map(l => l.trim()),
        tips: projectForm.tips.split('\n').filter(Boolean).map(l => l.trim()),
        created_by: profile.id,
        difficulty: projectForm.difficulty || '',
      };
      if (editingProjectId) {
        await updateAdminProject(editingProjectId, data);
        setActionMsg('Proyecto actualizado');
      } else {
        const newId = await createAdminProject(data);
        setAdminProjects(prev => [{ id: newId, ...data, created_at: null as any } as AdminProject, ...prev]);
        invalidateCache('admin_projects');
        loadAdminProjects();
        setActionMsg('Proyecto creado');
      }
      setProjectForm({ title: '', description: '', materials: '', tools: '', steps: '', tips: '', difficulty: '' });
      setEditingProjectId(null);
    } catch { setActionMsg('Error al guardar proyecto'); }
    setSavingProject(false);
  }
  function handleEditProject(p: AdminProject) {
    setEditingProjectId(p.id);
    setProjectForm({
      title: p.title,
      description: p.description,
      materials: p.materials.map(m => m.source ? `${m.name} | ${m.source}` : m.name).join('\n'),
      tools: p.tools.join('\n'),
      steps: p.steps.join('\n'),
      tips: p.tips.join('\n'),
      difficulty: p.difficulty || '',
    });
    setActiveSection('projects');
  }
  async function handleDeleteProject(projectId: string) {
    if (!confirm('¿Eliminar este proyecto definitivamente?')) return;
    try { await deleteAdminProject(projectId); setActionMsg('Proyecto eliminado'); loadAdminProjects(); } catch { setActionMsg('Error'); }
  }

  // ─── Chat logic ───
  async function handleSendChat() {
    if (!chatInput.trim()) return;
    setSendingChat(true);
    try {
      await sendAdminChatMessage({ user_id: profile.id, user_name: profile.full_name || 'Admin', message: chatInput.trim() });
      setChatInput('');
      await loadChat();
    } catch { setActionMsg('Error al enviar mensaje'); }
    setSendingChat(false);
  }

  // ─── App Post logic ───
  async function handleSendAppPost() {
    if (!appPostTitle.trim()) { setActionMsg('Título obligatorio'); return; }
    setSendingAppPost(true);
    try {
      let images: string[] = [];
      if (appPostImageFile) {
        const url = await uploadImage(appPostImageFile, `app_posts/${Date.now()}`);
        images = [url];
      }
      await createAppPost(appPostTitle.trim(), appPostContent.trim(), appPostType, images);
      setActionMsg('Publicación creada como EcoReEngine');
      setAppPostTitle(''); setAppPostContent(''); setAppPostImageFile(null); setAppPostImagePreview(null);
    } catch { setActionMsg('Error al publicar'); }
    setSendingAppPost(false);
  }

  // ─── Notify logic ───
  async function handleSendNotify() {
    if (!notifyMessage.trim()) return;
    setSendingNotify(true);
    try {
      await sendGlobalNotification(sanitize(notifyMessage.trim()), profile.id);
      setActionMsg('Notificación enviada a todos los usuarios');
      setNotifyMessage('');
      loadNotifications();
    } catch { setActionMsg('Error al enviar'); }
    setSendingNotify(false);
  }

  const roleDisplay = (role?: string) => {
    if (role === 'owner') return { icon: <Crown className="w-3.5 h-3.5 text-amber-400" />, label: 'Owner' };
    if (role === 'admin') return { icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />, label: 'Admin' };
    if (role === 'mod') return { icon: <Shield className="w-3.5 h-3.5 text-purple-400" />, label: 'Mod' };
    if (role === 'institution') return { icon: <Building2 className="w-3.5 h-3.5 text-emerald-400" />, label: 'Institución' };
    return { icon: <ShieldX className="w-3.5 h-3.5 text-slate-500" />, label: 'User' };
  };

  const menuSections = [
    { label: 'Admin', items: [
      { icon: BarChart3, label: 'Dashboard', section: 'dashboard' as AdminSection },
      { icon: Megaphone, label: 'Comunicado Global', section: 'announcement' as AdminSection },
      { icon: MessageSquare, label: 'Publicaciones', section: 'posts' as AdminSection },
    ]},
    { label: 'Usuarios', items: [
      { icon: Users, label: 'Usuarios', section: 'users' as AdminSection },
    ]},
    { label: 'Proyectos', items: [
      { icon: BookOpen, label: 'Proyectos Admin', section: 'projects' as AdminSection },
      { icon: Building2, label: 'Proyectos Institución', section: 'institution-projects' as AdminSection },
    ]},
    { label: 'Comunicación', items: [
      { icon: MessageCircle, label: 'Chat Admin', section: 'chat' as AdminSection },
      { icon: Globe, label: 'Publicar como App', section: 'app-post' as AdminSection },
      { icon: Bell, label: 'Notificar a Todos', section: 'notify' as AdminSection },
      ...(profile.role === 'owner' ? [{ icon: Smartphone, label: 'Actualizar App', section: 'update' as AdminSection }] : []),
    ]},
    { label: 'Herramientas', items: [
      ...(profile.role === 'owner' ? [{ icon: BookOpen, label: 'Diccionario', section: 'dictionary' as AdminSection }] : []),
      ...(profile.role === 'owner' ? [{ icon: Zap, label: 'Herramientas', section: 'tools' as AdminSection }] : []),
      ...(profile.role === 'owner' ? [{ icon: AlertTriangle, label: 'Reportes', section: 'reports' as AdminSection }] : []),
    ]},
  ];

  function renderSection() {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'posts': return renderPosts();
      case 'announcement': return renderAnnouncement();
      case 'projects': return renderProjects();
      case 'institution-projects': return renderInstitutionProjects();
      case 'chat': return renderChat();
      case 'app-post': return renderAppPost();
      case 'notify': return renderNotify();
      case 'update': return profile.role === 'owner' ? renderUpdate() : renderDashboard();
      case 'tools': return profile.role === 'owner'
        ? <AdminTools profile={profile} allUsers={allUsers} posts={posts} stats={stats} setActionMsg={setActionMsg} reloadUsers={loadUsers} />
        : renderDashboard();
      case 'dictionary': return profile.role === 'owner' ? renderDictionary() : renderDashboard();
      case 'reports': return profile.role === 'owner' ? renderReports() : renderDashboard();
    }
  }

  // ══════════════════════════════════════════════════════════
  //  DASHBOARD
  // ══════════════════════════════════════════════════════════
  function renderDashboard() {
    const cards = [
      { icon: <Users className="w-5 h-5" />, value: stats.total, label: 'Usuarios', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.25)', iconBg: 'bg-blue-500/20' },
      { icon: <BarChart3 className="w-5 h-5" />, value: stats.totalXp.toLocaleString(), label: 'XP Total', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'rgba(52,211,153,0.25)', iconBg: 'bg-emerald-500/20' },
      { icon: <ShieldCheck className="w-5 h-5" />, value: stats.verified, label: 'Verificados', color: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/30', glow: 'rgba(34,211,238,0.25)', iconBg: 'bg-cyan-500/20' },
      { icon: <Activity className="w-5 h-5" />, value: stats.newThisWeek, label: 'Nuevos (7d)', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', glow: 'rgba(168,85,247,0.25)', iconBg: 'bg-purple-500/20' },
      { icon: <Crown className="w-5 h-5" />, value: stats.owners, label: 'Dueños', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', glow: 'rgba(251,191,36,0.25)', iconBg: 'bg-amber-500/20' },
      { icon: <ShieldCheck className="w-5 h-5" />, value: stats.admins, label: 'Admins', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'rgba(59,130,246,0.25)', iconBg: 'bg-blue-500/20' },
      { icon: <Building2 className="w-5 h-5" />, value: stats.institutions, label: 'Instituciones', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'rgba(52,211,153,0.25)', iconBg: 'bg-emerald-500/20' },
      { icon: <Gavel className="w-5 h-5" />, value: stats.banned, label: 'Baneados', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', glow: 'rgba(239,68,68,0.25)', iconBg: 'bg-red-500/20' },
      { icon: <BarChart3 className="w-5 h-5" />, value: stats.totalGames, label: 'Partidas', color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/30', glow: 'rgba(20,184,166,0.25)', iconBg: 'bg-teal-500/20' },
      { icon: <UserPlus className="w-5 h-5" />, value: allUsers.filter(u => u.created_at && Date.now() - new Date(u.created_at).getTime() < 30 * 24 * 60 * 60 * 1000).length, label: 'Nuevos (30d)', color: 'text-indigo-400', bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', glow: 'rgba(99,102,241,0.25)', iconBg: 'bg-indigo-500/20' },
    ];
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cards.map((s, i) => (
            <div key={i} className={`stat-card ${s.bg} border ${s.border} rounded-xl p-4 flex items-center gap-3 cursor-default`}
              style={{ boxShadow: `0 0 12px ${s.glow}` }}>
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} ${s.color} flex items-center justify-center stat-icon`}>
                {s.icon}
              </div>
              <div>
                <p className="stat-value text-lg font-bold text-slate-100 leading-tight">{s.value}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
        {stats.topUser && (
          <div className="mt-4 flex items-center gap-2 bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-700/40">
            <Crown className="w-4 h-4 text-amber-400" />
            <p className="text-xs text-slate-400">Top usuario:</p>
            <span className="text-sm font-bold text-amber-300">{stats.topUser.full_name || '?'}</span>
            <span className="text-xs text-slate-500">· {stats.topUser.total_xp?.toLocaleString()} XP</span>
          </div>
        )}

        {profile.role === 'owner' && (
          <div className="card space-y-3 mt-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Límites</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Posts / día</label>
                <input type="number" value={config?.max_posts_per_day ?? ''} onChange={e => setConfig(prev => prev ? { ...prev, max_posts_per_day: Number(e.target.value) || 0 } : null)}
                  className="input w-full text-sm" placeholder="Ej: 5" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">XP / hora</label>
                <input type="number" value={config?.max_xp_per_hour ?? ''} onChange={e => setConfig(prev => prev ? { ...prev, max_xp_per_hour: Number(e.target.value) || 0 } : null)}
                  className="input w-full text-sm" placeholder="Ej: 100" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Comentario (caracteres)</label>
                <input type="number" value={config?.max_comment_length ?? ''} onChange={e => setConfig(prev => prev ? { ...prev, max_comment_length: Number(e.target.value) || 0 } : null)}
                  className="input w-full text-sm" placeholder="Ej: 500" />
              </div>
            </div>
            <button onClick={async () => {
              try {
                await updateAppConfig({ max_posts_per_day: config?.max_posts_per_day, max_xp_per_hour: config?.max_xp_per_hour, max_comment_length: config?.max_comment_length });
                setActionMsg('✅ Límites guardados');
              } catch { setActionMsg('❌ Error al guardar'); }
            }} className="text-xs font-bold text-amber-400 px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
              Guardar
            </button>
          </div>
        )}

        <div className="card space-y-4 mt-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Estadísticas</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Usuarios</span><span>{stats.total || 0}</span></div>
              <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{width: `${Math.min(100, ((stats.total||0)/100)*100)}%`}} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Verificados</span><span>{stats.verified || 0}</span></div>
              <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{width: `${Math.min(100, ((stats.verified||0)/50)*100)}%`}} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Admins</span><span>{stats.admins || 0}</span></div>
              <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{width: `${Math.min(100, ((stats.admins||0)/10)*100)}%`}} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Baneados</span><span>{stats.banned || 0}</span></div>
              <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{width: `${Math.min(100, ((stats.banned||0)/10)*100)}%`}} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  USERS
  // ══════════════════════════════════════════════════════════
  function renderUsers() {
    return (
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Usuarios
          <span className="text-[10px] text-slate-600 font-normal normal-case">({filteredUsers.length} de {allUsers.length})</span>
        </h3>
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl px-3 py-2 border border-slate-700/50">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={searchById ? 'Buscar por ID...' : 'Buscar por nombre...'}
            className="bg-transparent text-sm text-slate-200 w-full outline-none placeholder-slate-500" />
          <button onClick={() => { setSearchById(!searchById); setSearch(''); }}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${searchById ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500 hover:text-slate-300'}`}>ID</button>
          {searchById && <button onClick={handleSearchById} className="text-[10px] font-bold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20">Ir</button>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map(t => {
            const colors: Record<string, { active: string, inactive: string, icon: React.ReactNode }> = {
              all: { active: 'bg-slate-700 text-slate-200 ring-1 ring-slate-500/50', inactive: 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50', icon: <Users className="w-3.5 h-3.5" /> },
              admins: { active: 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40', inactive: 'text-slate-500 hover:text-amber-400 hover:bg-amber-500/10', icon: <Crown className="w-3.5 h-3.5" /> },
              mods: { active: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/40', inactive: 'text-slate-500 hover:text-blue-400 hover:bg-blue-500/10', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
              institutions: { active: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40', inactive: 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10', icon: <Building2 className="w-3.5 h-3.5" /> },
              verified: { active: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40', inactive: 'text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10', icon: <UserCheck className="w-3.5 h-3.5" /> },
              banned: { active: 'bg-red-500/20 text-red-300 ring-1 ring-red-500/40', inactive: 'text-slate-500 hover:text-red-400 hover:bg-red-500/10', icon: <Gavel className="w-3.5 h-3.5" /> },
              new: { active: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/40', inactive: 'text-slate-500 hover:text-purple-400 hover:bg-purple-500/10', icon: <Star className="w-3.5 h-3.5" /> },
            };
            const c = colors[t.key] || colors.all;
            return (
              <button key={t.key} onClick={() => setUserFilter(t.key)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl whitespace-nowrap transition-all ${userFilter === t.key ? c.active : c.inactive}`}>
                {c.icon} {t.label}<span className={`text-[10px] font-normal ${userFilter === t.key ? 'opacity-70' : 'text-slate-600'}`}>({t.count})</span>
              </button>
            );
          })}
          <button onClick={exportUsers} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
        </div>
        <div className="divide-y divide-slate-800/60 -mx-2">
          {loadingUsers ? (
            <p className="text-center text-slate-500 text-sm py-8">Cargando usuarios...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Sin resultados</p>
          ) : (
            filteredUsers.map(u => {
              const isUpdating = updatingUserId === u.id;
              const isMe = u.id === profile.id;
              const isExpanded = expandedUserId === u.id;
              return (
                <div key={u.id} className="px-2">
                  <div className={`flex flex-wrap items-center gap-2 py-2.5 px-3 rounded-xl transition-colors ${isMe ? 'bg-emerald-600/15 border border-emerald-500/20' : u.banned ? 'bg-red-900/15 border border-red-500/20' : 'hover:bg-slate-800/40'}`}>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(u.full_name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
                        {u.full_name || 'Sin nombre'}
                        {u.verified && <VerifiedBadge />}
                        {roleDisplay(u.role).icon}
                        <span className={`text-[10px] font-bold uppercase ${u.role === 'owner' ? 'text-amber-400' : u.role === 'admin' ? 'text-blue-400' : u.role === 'mod' ? 'text-purple-400' : u.role === 'institution' ? 'text-emerald-400' : 'text-slate-500'}`}>{roleDisplay(u.role).label}</span>
                        {isMe && <span className="text-emerald-400 text-[10px] ml-0.5">(tú)</span>}
                        {u.banned && <span className="text-red-400 text-[10px] ml-0.5">🚫 Baneado</span>}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {u.total_xp?.toLocaleString()} XP · Nv.{Math.floor((u.total_xp ?? 0) / 100) + 1}
                        {u.games_played > 0 && ` · 🎮 ${u.high_score ?? 0}`}
                        {u.created_at && ` · ${new Date(u.created_at).toLocaleDateString('es')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                      <button onClick={() => toggleExpand(u)} disabled={isUpdating} aria-label="Expandir"
                        className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => toggleUserVerified(u.id, !!u.verified)} disabled={isUpdating} aria-label="Verificar"
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${u.verified ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-500 hover:text-slate-300'}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                      {profile.role === 'owner' && (
                        <select value={u.role || 'user'} onChange={e => changeUserRole(u.id, e.target.value as UserRole)} disabled={isUpdating || u.role === 'owner'}
                          className="bg-slate-700/50 text-[10px] text-slate-300 rounded-lg px-1.5 py-1.5 border border-slate-600/50 outline-none disabled:opacity-40">
                          <option value="user">User</option>
                          <option value="institution">Institución</option>
                          <option value="mod">Mod</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Dueño</option>
                        </select>
                      )}
                      {!isMe && (
                        u.banned ? (
                          <button onClick={() => handleUnban(u.id)} disabled={isUpdating} aria-label="Desbanear"
                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40" title="Desbanear">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button onClick={() => setBanModal(u.id)} disabled={isUpdating || u.role === 'owner'} aria-label="Banear"
                            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40" title="Banear">
                            <Gavel className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="ml-12 mr-2 mb-2 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 space-y-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <Hash className="w-3 h-3" /> Detalles
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-slate-500" />
                          ID: <span className="text-slate-300 font-mono text-[10px]">{u.id}</span>
                          <button onClick={() => { navigator.clipboard.writeText(u.id); setActionMsg('ID copiado'); }} aria-label="Copiar" className="text-slate-600 hover:text-slate-300"><Copy className="w-3 h-3" /></button>
                        </div>
                        {u.created_at && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Registro: <span className="text-slate-300">{new Date(u.created_at).toLocaleDateString('es')}</span>
                          </div>
                        )}
                        {u.role === 'institution' && u.institution_name && (
                          <div className="flex items-center gap-1.5 col-span-2">
                            <Building2 className="w-3 h-3 text-emerald-500" />
                            Institución: <span className="text-emerald-300">{u.institution_name}</span>
                          </div>
                        )}
                      </div>
                      {u.banned && u.ban_reason && (
                        <div className="flex items-center gap-1.5 text-[11px] text-red-400">
                          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                          Razón: {u.ban_reason}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs text-slate-400">Nombre: <span className="text-slate-200 font-medium">{u.full_name || u.username || '—'}</span></span>
                      </div>
                      <button onClick={() => {
                        const data = JSON.stringify(u, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `usuario_${u.id}.json`; a.click();
                        URL.revokeObjectURL(url);
                        setActionMsg('Datos exportados');
                      }} className="text-[10px] font-bold text-emerald-400 px-2 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 w-fit">
                        <Download className="w-3 h-3" /> Exportar datos
                      </button>
                      {profile.role === 'owner' && (
                        <button onClick={async () => {
                          if (!confirm('¿Enviar enlace de restablecimiento a este usuario?')) return;
                          try {
                            const email = prompt('Email del usuario:');
                            if (!email) return;
                            await sendPasswordResetEmail(auth, email);
                            setActionMsg('✅ Enlace enviado');
                          } catch { setActionMsg('❌ Error'); }
                        }} className="text-[10px] font-bold text-amber-400 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-1 w-fit">
                          Restablecer contraseña
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-between items-center pt-1">
          <button onClick={loadUsers} className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1">
            <Clock className="w-3 h-3" /> Recargar
          </button>
        </div>
        {banModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-sm mx-4 shadow-2xl space-y-3">
              <h4 className="text-sm font-bold text-slate-100">Banear usuario</h4>
              <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)}
                className="input w-full text-sm" placeholder="Razón del baneo..." autoFocus />
              <div>
                <p className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-semibold">Duración</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'permanent', label: 'Permanente' },
                    { value: '24h', label: '24 horas' },
                    { value: '7d', label: '7 días' },
                    { value: '30d', label: '30 días' },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => setBanExpiration(opt.value)}
                      className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${banExpiration === opt.value ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-slate-300'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setBanModal(null); setBanReason(''); setBanExpiration('permanent'); }} className="text-xs text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-800">Cancelar</button>
                <button onClick={() => handleBan(banModal)} disabled={!banReason.trim() || updatingUserId === banModal}
                  className="text-xs font-bold text-white px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-40">Banear</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  POSTS
  // ══════════════════════════════════════════════════════════
  function renderPosts() {
    return (
      <div className="card border-orange-500/20 bg-orange-500/5 space-y-3 p-4">
        <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comunidad
          <span className="text-[10px] text-slate-600 font-normal normal-case">({posts.length} posts)</span>
          <button onClick={loadPosts} className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto font-normal"><Clock className="w-3 h-3" /></button>
        </h3>
        <div className="space-y-2">
          {loadingPosts ? (
            <p className="text-center text-slate-500 text-xs py-4">Cargando posts...</p>
          ) : posts.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-4">Sin posts</p>
          ) : (
            sortedPosts.map(p => {
              const isPostExpanded = expandedPostId === p.id;
              return (
                <div key={p.id} className={`p-3 rounded-xl border ${p.hidden ? 'bg-red-900/10 border-red-800/30' : p.pinned ? 'bg-amber-500/10 border-amber-500/20' : 'bg-slate-800/30 border-slate-700/30'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate flex items-center gap-1.5">
                        {p.pinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        {p.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{p.content}</p>
                      <p className="text-[10px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{p.type}</span>
                        <span>♥ {p.likes_count}</span>
                        <span>💬 {p.comments_count}</span>
                        {p.pinned && <span className="text-amber-400/60">· Anclado</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                      {!p.hidden && (
                        <button onClick={() => handleTogglePin(p.id, !!p.pinned)} aria-label="Fijar"
                          className={`p-2 rounded-lg transition-colors ${p.pinned ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700/50 text-slate-500 hover:text-slate-300'}`}>
                          {p.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                        </button>
                      )}
                      <button onClick={() => handleViewComments(p.id)} aria-label="Comentarios"
                        className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-blue-300 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      {p.hidden ? (
                        <>
                          <button onClick={() => handleUnhidePost(p.id)} aria-label="Restaurar"
                            className="p-2 rounded-lg bg-emerald-700/30 text-emerald-400 hover:bg-emerald-600/40 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button onClick={() => handlePermanentDelete(p.id)} aria-label="Eliminar permanentemente"
                            className="p-2 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-800/40 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleHidePost(p.id)} aria-label="Ocultar"
                            className="p-2 rounded-lg bg-slate-700/50 text-slate-500 hover:text-amber-400 transition-colors">
                            <EyeOff className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeletePost(p.id)} aria-label="Eliminar"
                            className="p-2 rounded-lg bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {isPostExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2">
                      {postComments.length === 0 ? (
                        <p className="text-xs text-slate-500">Sin comentarios</p>
                      ) : (
                        postComments.map((c: any) => (
                          <div key={c.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-300">{c.content}</p>
                              <p className="text-[10px] text-slate-600 mt-0.5">ID: {c.user_id?.slice(0, 8)}</p>
                            </div>
                            <button onClick={() => handleDeleteComment(c.id)} aria-label="Eliminar comentario"
                              className="p-1.5 rounded-lg bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  ANNOUNCEMENT
  // ══════════════════════════════════════════════════════════
  function renderAnnouncement() {
    return (
      <details className="card border-amber-500/20 bg-amber-500/5 open:!pb-4" open>
        <summary className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2 cursor-pointer p-4">
          <Megaphone className="w-4 h-4" />
          Comunicado Global
          {config?.announcement_enabled && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
        </summary>
        <div className="px-4 space-y-3">
          <p className="text-xs text-slate-400">Este mensaje aparece como banner para todos los usuarios.</p>
          <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
            className="input w-full h-20 resize-none text-sm" placeholder="Ej: Mantenimiento programado el sábado..." />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <button onClick={() => setAnnouncementEnabled(!announcementEnabled)}
                className={`w-9 h-5 rounded-full transition-all relative ${announcementEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${announcementEnabled ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
              Banner activo
            </label>
            <button onClick={saveAnnouncement} disabled={savingAnnouncement}
              className="text-xs font-bold text-amber-400 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40">
              {savingAnnouncement ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          {config?.updated_at && (
            <p className="text-[10px] text-slate-600">Última actualización: {new Date(config.updated_at).toLocaleString('es')}</p>
          )}
        </div>
      </details>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  PROJECTS
  // ══════════════════════════════════════════════════════════
  function renderProjects() {
    return (
      <div className="space-y-4">
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            {editingProjectId ? 'Editar Proyecto' : 'Nuevo Proyecto'}
          </h3>
          <div className="space-y-3">
            <input type="text" value={projectForm.title} onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
              className="input w-full text-sm" placeholder="Título del proyecto *" />

            <textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
              className="input w-full h-20 resize-none text-sm" placeholder="Descripción - ¿Qué principio científico/robótico enseña? *" />
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Materiales (un material por línea: nombre | fuente de extracción)</p>
              <textarea value={projectForm.materials} onChange={e => setProjectForm(f => ({ ...f, materials: e.target.value }))}
                className="input w-full h-20 resize-none text-sm" placeholder="Ej: Motor DC | Reproductor de DVD viejo&#10;LEDs | Teclado viejo&#10;Cables | Cable USB dañado" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Herramientas (una por línea)</p>
              <textarea value={projectForm.tools} onChange={e => setProjectForm(f => ({ ...f, tools: e.target.value }))}
                className="input w-full h-16 resize-none text-sm" placeholder="Cautín&#10;Estaño&#10;Silicón caliente" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Paso a paso (un paso por línea, en orden)</p>
              <textarea value={projectForm.steps} onChange={e => setProjectForm(f => ({ ...f, steps: e.target.value }))}
                className="input w-full h-24 resize-none text-sm" placeholder="1. Conectar el motor al transistor&#10;2. Soldar los cables..." />
            </div>
            <textarea value={projectForm.tips} onChange={e => setProjectForm(f => ({ ...f, tips: e.target.value }))}
              className="input w-full h-16 resize-none text-sm" placeholder="Consejos útiles (opcional)" />
            <div>
              <p className="text-[10px] text-slate-500 mb-1">Filtro de dificultad (para el Laboratorio)</p>
              <div className="flex gap-1.5">
                {['', 'Fácil', 'Medio', 'Avanzado', 'Otros'].map(d => (
                  <button key={d} onClick={() => setProjectForm(f => ({ ...f, difficulty: d }))}
                    className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      projectForm.difficulty === d
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:text-slate-200'
                    }`}>
                    {d || 'General'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveProject} disabled={savingProject}
                className="text-xs font-bold text-emerald-400 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" /> {savingProject ? 'Guardando...' : editingProjectId ? 'Actualizar' : 'Crear Proyecto'}
              </button>
              {editingProjectId && (
                <button onClick={() => { setEditingProjectId(null); setProjectForm({ title: '', description: '', materials: '', tools: '', steps: '', tips: '', difficulty: '' }); }}
                  className="text-xs text-slate-400 px-3 py-2 rounded-lg hover:bg-slate-800">Cancelar</button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Proyectos Creados ({adminProjects.length})
          </h4>
          {loadingProjects ? (
            <p className="text-xs text-slate-500 text-center py-4">Cargando proyectos...</p>
          ) : adminProjects.filter(p => !p.institution_name).length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin proyectos aún</p>
          ) : (
            adminProjects.filter(p => !p.institution_name).map(p => (
              <div key={p.id} className="card flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{p.materials?.length || 0} materiales · {p.steps?.length || 0} pasos</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleEditProject(p)} aria-label="Editar"
                    className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-blue-300 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {profile.role === 'owner' && (
                    <button onClick={() => handleDeleteProject(p.id)} aria-label="Eliminar"
                      className="p-1.5 rounded-lg bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  INSTITUTION PROJECTS
  // ══════════════════════════════════════════════════════════
  function renderInstitutionProjects() {
    const instProjects = adminProjects.filter(p => p.institution_name);
    const loadingInst = loadingProjects;

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Proyectos de Instituciones
        </h3>
        <p className="text-xs text-slate-500">Proyectos creados por instituciones. Solo visibles, no editables desde aquí.</p>
        <div className="space-y-2">
          {loadingInst ? (
            <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
          ) : instProjects.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin proyectos de instituciones</p>
          ) : (
            instProjects.map(p => (
              <div key={p.id} className="card flex items-start gap-3">

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-100 truncate">{p.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                  <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> {p.institution_name || 'Institución'}
                  </p>
                </div>
                {profile.role === 'owner' && (
                  <button onClick={() => handleDeleteProject(p.id)} aria-label="Eliminar"
                    className="p-1.5 rounded-lg bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  CHAT
  // ══════════════════════════════════════════════════════════
  function renderChat() {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-blue-400" />
          Chat de Administradores
        </h3>
        <div className="h-80 overflow-y-auto space-y-2 bg-slate-900/50 rounded-xl p-3 border border-slate-700/40">
          {chatMessages.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Sin mensajes aún</p>
          ) : (
            chatMessages.map(m => (
              <div key={m.id} className={`flex ${m.user_id === profile.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl ${m.user_id === profile.id ? 'bg-emerald-600/20 border border-emerald-500/20' : 'bg-slate-800/50 border border-slate-700/30'}`}>
                  {m.user_id !== profile.id && (
                    <p className="text-[10px] font-semibold text-blue-400 mb-0.5">{m.user_name}</p>
                  )}
                  <p className="text-xs text-slate-200">{m.message}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5 text-right">
                    {m.created_at ? new Date((m.created_at as any).seconds ? (m.created_at as any).seconds * 1000 : (m.created_at as any)).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="flex gap-2">
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
            className="input flex-1 text-sm" placeholder="Escribe un mensaje..." />
          <button onClick={handleSendChat} disabled={!chatInput.trim() || sendingChat} aria-label="Enviar"
            className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-40 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  APP POST
  // ══════════════════════════════════════════════════════════
  function renderAppPost() {
    return (
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          Publicar como EcoReEngine
          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[9px] font-bold">Verificado</span>
        </h3>
        <p className="text-xs text-slate-400">La publicación aparecerá como oficial de EcoReEngine (verificado) y quedará anclada.</p>
        <select value={appPostType} onChange={e => setAppPostType(e.target.value as CommunityPost['type'])}
          className="input text-sm w-full">
          <option value="project">Proyecto</option>
          <option value="tip">Consejo</option>
          <option value="question">Pregunta</option>
          <option value="achievement">Logro</option>
          <option value="idea">Idea</option>
          <option value="tutorial">Tutorial</option>
          <option value="showcase">Galería</option>
          <option value="debate">Debate</option>
        </select>
        <div>
          {appPostImagePreview ? (
            <div className="relative mb-2">
              <img src={appPostImagePreview} alt="Preview" loading="lazy" className="w-full h-32 object-cover rounded-xl" />
              <button onClick={() => { setAppPostImageFile(null); setAppPostImagePreview(null); }} aria-label="Cerrar"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-slate-900 transition-colors">
                <X className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 h-16 rounded-xl border-2 border-dashed border-slate-600 hover:border-emerald-500/50 cursor-pointer transition-colors">
              <ImageIcon className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">Subir imagen</span>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) { setActionMsg('❌ La imagen excede 5MB'); return; }
                  setAppPostImageFile(file);
                  const reader = new FileReader();
                  reader.onload = () => setAppPostImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }} />
            </label>
          )}
        </div>
        <input type="text" value={appPostTitle} onChange={e => setAppPostTitle(e.target.value)}
          className="input w-full text-sm" placeholder="Título de la publicación" />
        <textarea value={appPostContent} onChange={e => setAppPostContent(e.target.value)}
          className="input w-full h-24 resize-none text-sm" placeholder="Contenido de la publicación..." />
        <button onClick={handleSendAppPost} disabled={!appPostTitle.trim() || sendingAppPost}
          className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center gap-1.5 w-fit">
          <Globe className="w-3.5 h-3.5" /> {sendingAppPost ? 'Publicando...' : 'Publicar en Comunidad'}
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  //  NOTIFY
  // ══════════════════════════════════════════════════════════
  function renderNotify() {
    return (
      <div className="space-y-4">
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Notificar a Todos los Usuarios
          </h3>
          <p className="text-xs text-slate-400">Envía una notificación que aparecerá a todos los usuarios de la app.</p>
          <textarea value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)}
            className="input w-full h-20 resize-none text-sm" placeholder="Escribe el mensaje de notificación..." />
          <button onClick={handleSendNotify} disabled={!notifyMessage.trim() || sendingNotify}
            className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 flex items-center gap-1.5 w-fit">
            <Send className="w-3.5 h-3.5" /> {sendingNotify ? 'Enviando...' : 'Enviar Notificación'}
          </button>
        </div>

        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-400" />
            Notificar a un Usuario Específico
          </h3>
          <p className="text-xs text-slate-400">Envía una notificación directa a un usuario por su ID.</p>
          <input type="text" value={directUserId} onChange={e => setDirectUserId(e.target.value)}
            className="input w-full text-sm" placeholder="ID del usuario" />
          <textarea value={directMessage} onChange={e => setDirectMessage(e.target.value)}
            className="input w-full h-20 resize-none text-sm" placeholder="Escribe el mensaje..." />
          <button onClick={async () => {
            if (!directUserId.trim() || !directMessage.trim()) return;
            setSendingDirect(true);
            try {
              await sendDirectNotification(directUserId.trim(), directMessage.trim());
              setActionMsg('Notificación enviada al usuario');
              setDirectUserId(''); setDirectMessage('');
            } catch { setActionMsg('Error al enviar'); }
            setSendingDirect(false);
          }} disabled={!directUserId.trim() || !directMessage.trim() || sendingDirect}
            className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center gap-1.5 w-fit">
            <Send className="w-3.5 h-3.5" /> {sendingDirect ? 'Enviando...' : 'Enviar'}
          </button>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Historial ({notifications.length})</h4>
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin notificaciones enviadas</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="card flex items-start gap-3">
                <Megaphone className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-400">{n.display_name || 'EcoReEngine'}</span>
                    <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-emerald-400"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                  </div>
                  <p className="text-sm text-slate-200">{n.message}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    {n.created_at ? new Date((n.created_at as any).seconds ? (n.created_at as any).seconds * 1000 : (n.created_at as any)).toLocaleString('es') : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  function renderUpdate() {
    return (
      <div className="space-y-4">
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Actualizar App (OTA)
          </h3>
          <p className="text-xs text-slate-400">
            Sube el archivo APK directamente. La versión anterior se reemplazará automáticamente.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Versión</label>
              <input value={updateVersion} onChange={e => setUpdateVersion(e.target.value)}
                className="input w-full text-sm" placeholder="Ej: 1.0.3" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Archivo APK</label>
              <input type="file" accept=".apk,application/vnd.android.package-archive"
                onChange={e => setUpdateApkFile(e.target.files?.[0] ?? null)}
                className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 hover:file:bg-emerald-500/30 file:cursor-pointer cursor-pointer" />
              {updateApkFile && <p className="text-[10px] text-emerald-400 mt-1">{updateApkFile.name} ({(updateApkFile.size / 1048576).toFixed(1)} MB)</p>}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Cambios (changelog)</label>
            <textarea value={updateChangelog} onChange={e => setUpdateChangelog(e.target.value)}
              className="input w-full h-24 resize-none text-sm" placeholder="- Corrección de errores&#10;- Nueva función X&#10;- Mejora de rendimiento" />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={updateForce} onChange={e => setUpdateForce(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500" />
            Forzar actualización (el usuario no podrá cerrar el aviso)
          </label>

          <button onClick={async () => {
            if (!updateVersion.trim() || !updateApkFile) return;
            setUploadingApk(true);
            setSavingUpdate(true);
            try {
              const formData = new FormData();
              formData.append('reqtype', 'fileupload');
              formData.append('fileToUpload', updateApkFile);
              const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
              if (!res.ok) throw new Error('Error al subir');
              const apkUrl = await res.text();
              await setAppUpdate({ version: updateVersion.trim(), apk_url: apkUrl.trim(), changelog: updateChangelog.trim(), force_update: updateForce }, profile.id);
              setUpdateApkFile(null);
              setActionMsg('✅ Actualización publicada');
              await loadUpdate();
            } catch { setActionMsg('❌ Error al subir o guardar'); }
            setSavingUpdate(false);
            setUploadingApk(false);
          }} disabled={!updateVersion.trim() || !updateApkFile || savingUpdate}
            className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center gap-1.5 w-fit">
            <Save className="w-3.5 h-3.5" /> {uploadingApk ? 'Subiendo APK...' : savingUpdate ? 'Guardando...' : 'Publicar Actualización'}
          </button>

          {appUpdate && (
            <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Última versión publicada</p>
              <p className="text-sm text-slate-200">Versión <span className="text-emerald-400 font-bold">{appUpdate.version}</span></p>
              <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap">{appUpdate.changelog}</p>
              <p className="text-[10px] text-slate-600 mt-1">
                {appUpdate.force_update ? '🔴 Forzada' : '🟢 Opcional'} · {appUpdate.updated_at ? new Date(appUpdate.updated_at).toLocaleString('es') : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════
  //  DICTIONARY
  // ══════════════════════════════════════════════════════════
  function renderDictionary() {
    async function handleSaveDictEntry() {
      if (!dictForm.name.trim() || !dictForm.category.trim() || !dictForm.description.trim()) {
        setActionMsg('Nombre, categoría y descripción obligatorios'); return;
      }
      setSavingDict(true);
      try {
        let image_url = dictForm.image_url.trim();
        if (dictImageFile) {
          image_url = await uploadImage(dictImageFile, `dictionary/${Date.now()}`);
        }
        const data = { ...dictForm, name: dictForm.name.trim(), image_url };
        if (editingDictId) {
          await updateDictionaryEntry(editingDictId, data);
          setActionMsg('Entrada actualizada');
        } else {
          await createDictionaryEntry(data);
          setActionMsg('Entrada creada');
        }
        setDictForm({ name: '', category: '', description: '', function_desc: '', unit: '', common_source: '', image_url: '', color_class: '' });
        setDictImageFile(null); setDictImagePreview(null);
        setEditingDictId(null);
        loadDictionary();
      } catch { setActionMsg('Error al guardar'); }
      setSavingDict(false);
    }

    function handleEditDictEntry(e: DictionaryEntry) {
      setEditingDictId(e.id);
      setDictForm({
        name: e.name,
        category: e.category,
        description: e.description,
        function_desc: e.function_desc || '',
        unit: e.unit || '',
        common_source: e.common_source || '',
        image_url: e.image_url || '',
        color_class: e.color_class || '',
      });
      setDictImagePreview(e.image_url || null);
    }

    async function handleDeleteDictEntry(id: string) {
      if (!confirm('¿Eliminar esta entrada del diccionario?')) return;
      try { await deleteDictionaryEntry(id); setActionMsg('Entrada eliminada'); loadDictionary(); } catch { setActionMsg('Error'); }
    }

    return (
      <div className="space-y-4">
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            {editingDictId ? 'Editar Entrada' : 'Nueva Entrada'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Nombre *</label>
              <input value={dictForm.name} onChange={e => setDictForm(f => ({ ...f, name: e.target.value }))}
                className="input w-full text-sm" placeholder="Ej: Resistencia" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Categoría *</label>
              <select value={dictForm.category} onChange={e => setDictForm(f => ({ ...f, category: e.target.value }))}
                className="input w-full text-sm">
                <option value="">Seleccionar...</option>
                <option value="Pasivo">Pasivo</option>
                <option value="Semiconductor">Semiconductor</option>
                <option value="Protección">Protección</option>
                <option value="Control">Control</option>
                <option value="Sensor">Sensor</option>
                <option value="Actuador">Actuador</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Descripción *</label>
              <textarea value={dictForm.description} onChange={e => setDictForm(f => ({ ...f, description: e.target.value }))}
                className="input w-full h-16 resize-none text-sm" placeholder="Descripción breve del componente..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Función Principal</label>
              <textarea value={dictForm.function_desc} onChange={e => setDictForm(f => ({ ...f, function_desc: e.target.value }))}
                className="input w-full h-16 resize-none text-sm" placeholder="Explica su función eléctrica/electrónica..." />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Unidad de Medida</label>
              <input value={dictForm.unit} onChange={e => setDictForm(f => ({ ...f, unit: e.target.value }))}
                className="input w-full text-sm" placeholder="Ej: Ohm (Ω)" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">¿Dónde encontrarlo en e-waste?</label>
              <input value={dictForm.common_source} onChange={e => setDictForm(f => ({ ...f, common_source: e.target.value }))}
                className="input w-full text-sm" placeholder="Ej: Placas base de PC, cargadores..." />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Clase de color (Tailwind)</label>
              <input value={dictForm.color_class} onChange={e => setDictForm(f => ({ ...f, color_class: e.target.value }))}
                className="input w-full text-sm font-mono" placeholder="Ej: from-red-500/20 to-rose-600/20 border-red-500/30 text-red-400" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">URL de imagen</label>
              <input value={dictForm.image_url} onChange={e => setDictForm(f => ({ ...f, image_url: e.target.value }))}
                className="input w-full text-sm" placeholder="URL directa o sube una imagen" />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">O subir imagen</label>
              {dictImagePreview ? (
                <div className="relative w-32 h-32 mb-2">
                  <img src={dictImagePreview} alt="Preview" loading="lazy" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => { setDictImageFile(null); setDictImagePreview(null); }} aria-label="Cerrar"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-slate-900 transition-colors">
                    <X className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                </div>
              ) : null}
              <label className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-slate-600 hover:border-emerald-500/50 cursor-pointer transition-colors max-w-xs">
                <ImageIcon className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Seleccionar imagen</span>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { setActionMsg('❌ La imagen excede 5MB'); return; }
                    setDictImageFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setDictImagePreview(reader.result as string);
                    reader.readAsDataURL(file);
                    setDictForm(f => ({ ...f, image_url: '' }));
                  }} />
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveDictEntry} disabled={savingDict || !dictForm.name.trim() || !dictForm.category.trim() || !dictForm.description.trim()}
              className="text-xs font-bold text-emerald-400 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-40 flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> {savingDict ? 'Guardando...' : editingDictId ? 'Actualizar' : 'Crear Entrada'}
            </button>
            {editingDictId && (
              <button onClick={() => { setEditingDictId(null); setDictForm({ name: '', category: '', description: '', function_desc: '', unit: '', common_source: '', image_url: '', color_class: '' }); setDictImageFile(null); setDictImagePreview(null); }}
                className="text-xs text-slate-400 px-3 py-2 rounded-lg hover:bg-slate-800">Cancelar</button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" /> Entradas del Diccionario ({dictEntries.length})
            <button onClick={loadDictionary} className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto"><RefreshCw className="w-3 h-3" /></button>
          </h4>
          {loadingDict ? (
            <p className="text-xs text-slate-500 text-center py-4">Cargando...</p>
          ) : dictEntries.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin entradas aún</p>
          ) : (
            dictEntries.map(e => (
              <div key={e.id} className="card flex items-start gap-3">
                {e.image_url && (
                  <img src={e.image_url} alt={e.name} loading="lazy" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${e.color_class?.split(' ').find(c => c.startsWith('text-')) || 'text-slate-100'} truncate`}>{e.name}</p>
                  <p className="text-xs text-slate-500">{e.category}</p>
                  <p className="text-xs text-slate-400 line-clamp-1">{e.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => handleEditDictEntry(e)} aria-label="Editar"
                    className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-blue-300 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDeleteDictEntry(e.id)} aria-label="Eliminar"
                    className="p-1.5 rounded-lg bg-slate-700/50 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }


  // ══════════════════════════════════════════════════════════
  //  REPORTS
  // ══════════════════════════════════════════════════════════
  function renderReports() {
    return (
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Reportes de Contenido
          <span className="text-[10px] text-slate-600 font-normal normal-case">({reports.length})</span>
        </h3>
        <button onClick={() => {
          setLoadingReports(true);
          fetchAdminLogs(100).then(logs => {
            setReports(logs.filter(l => l.action === 'report_content'));
          }).catch(() => {}).finally(() => setLoadingReports(false));
        }} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Actualizar
        </button>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loadingReports ? (
            <p className="text-xs text-slate-500 text-center py-4">Cargando reportes...</p>
          ) : reports.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin reportes</p>
          ) : (
            reports.map(r => (
              <div key={r.id} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200 font-medium">Reportado por: {r.admin_name || '?'}</p>
                  <p className="text-xs text-slate-400 mt-1">Motivo: {r.details}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Post ID: {r.post_id || '—'} · {r.created_at ? new Date(r.created_at).toLocaleString('es') : '—'}
                  </p>
                </div>
                <button onClick={() => setReports(prev => prev.filter(x => x.id !== r.id))}
                  className="text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex-shrink-0">
                  Resuelto
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} aria-label="Volver" className="btn-ghost p-2 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-100 truncate">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
            <span className="truncate">Panel de Administración</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">Gestiona usuarios, contenido y configuración de la app</p>
        </div>
        <div ref={menuRef} className="relative flex-shrink-0 mr-1">
          <button onClick={() => setShowMenu(!showMenu)} aria-label="Menú"
            className="text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 p-2 rounded-xl transition-colors"
            title="Menú">
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {showMenu && (
            <div className="fixed lg:absolute right-0 top-16 lg:top-full lg:mt-2 left-4 lg:left-auto w-auto lg:w-56 glass rounded-2xl border border-slate-700/50 shadow-2xl z-50 animate-slide-up max-h-[70vh] overflow-y-auto">
              {menuSections.map((section, si) => (
                <div key={si}>
                  {si > 0 && <div className="mx-4 border-t border-slate-700/50" />}
                  <div className="px-4 pt-3 pb-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{section.label}</p>
                  </div>
                  {section.items.map((item, ii) => {
                    const Icon = item.icon;
                    return (
                      <button key={ii} onClick={() => { setActiveSection(item.section); setShowMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${activeSection === item.section ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                        <Icon className={`w-4 h-4 ${activeSection === item.section ? 'text-emerald-400' : 'text-slate-500'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
              <div className="mx-4 border-t border-slate-700/50" />
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Salir</p>
              </div>
              <button onClick={() => { onBack(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                Configuración
              </button>
            </div>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5">
          <p className="text-xs text-blue-300 font-medium">{actionMsg}</p>
          <button onClick={() => setActionMsg('')} className="text-blue-400/50 hover:text-blue-300 text-xs font-bold">✕</button>
        </div>
      )}

      {renderSection()}
    </div>
  );
}
