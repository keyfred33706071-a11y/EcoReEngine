import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Heart, MessageCircle, Share2, Plus, X, Users, Lightbulb, HelpCircle, Trophy, Camera, Flag, Menu, Sparkles, BookOpen, Image, MessageSquare } from 'lucide-react';
import { CardSkeleton } from '../components/Skeleton';
import { sanitize } from '../lib/sanitize';
import { UserProfile, timeAgo, CommunityPost, CommunityComment,
  fetchPosts, createPost, updatePostLikes, fetchLikedPosts, addLike, removeLike,
  fetchComments, addComment, incrementCommentCount, uploadImage, fetchProfile, addAdminLog, deleteComment, updateProfile } from '../lib/firestore';
import { checkAndAwardAchievements } from '../lib/achievementChecker';
import { showAchievementPopup } from '../components/AchievementPopup';
import { compressImage } from '../lib/compressImage';
import VerifiedBadge from '../components/VerifiedBadge';
import RoleBadge from '../components/RoleBadge';

interface CommunityPageProps {
  userId: string;
  profile: UserProfile;
  onBack?: () => void;
  onNavigate?: (page: string, userId?: string) => void;
}

const POST_TYPES: { value: CommunityPost['type']; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'project', label: 'Proyecto', icon: Trophy, color: 'text-amber-400' },
  { value: 'tip', label: 'Consejo', icon: Lightbulb, color: 'text-teal-400' },
  { value: 'question', label: 'Pregunta', icon: HelpCircle, color: 'text-blue-400' },
  { value: 'achievement', label: 'Logro', icon: Trophy, color: 'text-rose-400' },
  { value: 'idea', label: 'Idea', icon: Sparkles, color: 'text-purple-400' },
  { value: 'tutorial', label: 'Tutorial', icon: BookOpen, color: 'text-cyan-400' },
  { value: 'showcase', label: 'Galería', icon: Image, color: 'text-pink-400' },
  { value: 'debate', label: 'Debate', icon: MessageSquare, color: 'text-orange-400' },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  project: Trophy, tip: Lightbulb, question: HelpCircle, achievement: Trophy,
  idea: Sparkles, tutorial: BookOpen, showcase: Image, debate: MessageSquare,
};
const TYPE_COLORS: Record<string, string> = {
  project: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  tip: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  question: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  achievement: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  idea: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  tutorial: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  showcase: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  debate: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};
const TYPE_LABELS: Record<string, string> = {
  project: 'Proyecto', tip: 'Consejo', question: 'Pregunta', achievement: 'Logro',
  idea: 'Idea', tutorial: 'Tutorial', showcase: 'Galería', debate: 'Debate',
};

export default function CommunityPage({ userId, profile, onBack, onNavigate }: CommunityPageProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [postType, setPostType] = useState<CommunityPost['type']>('project');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);
  const userCacheRef = useRef<Record<string, UserProfile>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set());
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    if (!userId) return;
    userCacheRef.current[profile.id] = profile;
    loadPosts();
    loadLikes();
  }, [userId]);

  async function fetchUsers(ids: string[]) {
    userCacheRef.current['app_ecoreengine'] = {
      id: 'app_ecoreengine',
      full_name: 'EcoReEngine',
      verified: true,
      role: 'user',
      avatar_url: '/logo/logo.jpeg',
      total_xp: 0,
      games_played: 0,
      high_score: 0,
      created_at: '',
    } as UserProfile;
    const missing = ids.filter(id => id !== 'app_ecoreengine' && !userCacheRef.current[id]);
    if (missing.length === 0) return;
    for (const id of missing) {
      const u = await fetchProfile(id);
      if (u) userCacheRef.current[id] = u;
    }
  }

  async function loadPosts() {
    const raw = await fetchPosts();
    const ids = [...new Set(raw.map(p => p.user_id).filter(Boolean))];
    await fetchUsers(ids);
    setPosts(raw.map(p => ({ ...p, user: userCacheRef.current[p.user_id] })));
    setLoading(false);
  }

  async function loadLikes() {
    if (!userId) return;
    const liked = await fetchLikedPosts(userId);
    setLikedPosts(new Set(liked));
  }

  async function handleCreatePost() {
    if (!title.trim() || !userId) return;
    setPosting(true);
    let images: string[] = [];
    if (imageFile) {
      try {
        if (imageFile.size > 5 * 1024 * 1024) { setActionMsg('❌ La imagen excede 5MB'); setPosting(false); return; }
        const compressed = await compressImage(imageFile, 1000, 0.7);
        const url = await uploadImage(compressed, `community/${userId}_${Date.now()}`);
        images = [url];
      } catch {
        setActionMsg('❌ Error al subir imagen'); setPosting(false); return;
      }
    }
    try {
      const postId = await createPost({
        user_id: userId, type: postType, title: title.trim(), content: content.trim(), images, tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      });
      if (postId) {
        await loadPosts();
        setView('list');
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview(null);
        setTagsInput('');
        const prof = await fetchProfile(userId).catch(() => null);
        if (prof) {
          const postsCount = (prof as any).posts_count ?? 0;
          await updateProfile(userId, { posts_count: postsCount + 1 } as any).catch(() => {});
          checkAndAwardAchievements(userId, prof).then(e => e.forEach(showAchievementPopup)).catch(() => {});
        }
      }
    } catch { setActionMsg('❌ Error al publicar'); }
    setPosting(false);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setActionMsg('❌ La imagen excede 5MB'); e.target.value = ''; return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function toggleLike(postId: string) {
    const isLiked = likedPosts.has(postId);
    if (isLiked) {
      await Promise.all([removeLike(userId, postId), updatePostLikes(postId, -1)]);
      setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count ?? 0) - 1) } : p));
    } else {
      await Promise.all([addLike(userId, postId), updatePostLikes(postId, 1)]);
      setLikedPosts(prev => new Set([...prev, postId]));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count ?? 0) + 1 } : p));
    }
  }

  async function toggleComments(postId: string) {
    if (expandedComments.has(postId)) {
      const n = new Set(expandedComments);
      n.delete(postId);
      setExpandedComments(n);
      return;
    }
    if (!comments[postId]) {
      const list = await fetchComments(postId);
      const ids = [...new Set(list.map(c => c.user_id))];
      await fetchUsers(ids);
      setComments(prev => ({ ...prev, [postId]: list.map(c => ({ ...c, user: userCacheRef.current[c.user_id] })) }));
    }
    setExpandedComments(prev => new Set([...prev, postId]));
  }

  async function addCommentToPost(postId: string) {
    const text = commentTexts[postId]?.trim();
    if (!text) return;
    setPostingComment(prev => new Set([...prev, postId]));
    await addComment({ post_id: postId, user_id: userId, content: sanitize(text) });
    await incrementCommentCount(postId);
    const list = await fetchComments(postId);
    const ids = [...new Set(list.map(c => c.user_id))];
    await fetchUsers(ids);
    setComments(prev => ({ ...prev, [postId]: list.map(c => ({ ...c, user: userCacheRef.current[c.user_id] })) }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count ?? 0) + 1 } : p));
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    setPostingComment(prev => { const n = new Set(prev); n.delete(postId); return n; });
  }

  function replyToComment(postId: string, username: string) {
    setCommentTexts(prev => ({ ...prev, [postId]: `@${username}: ${(prev[postId] || '')}` }));
    const input = document.querySelector<HTMLInputElement>(`[data-comment-input="${postId}"]`);
    input?.focus();
  }

  const filtered = posts.filter(p => activeFilter === 'all' || p.type === activeFilter);

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {view === 'create' ? (
        <>
          <div className="flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-30 -mx-4 px-4 py-3 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="btn-ghost p-1.5 -ml-1.5">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-slate-100">Nueva publicación</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tipo</label>
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                {POST_TYPES.map(({ value, label, icon: Icon, color }) => (
                  <button key={value} onClick={() => setPostType(value)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                      postType === value ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-800/60 border-slate-700/50 text-slate-500 hover:border-slate-600'
                    }`}>
                    <Icon className={`w-4 h-4 ${postType === value ? 'text-emerald-400' : color}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Título</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="¿Qué quieres compartir?" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Descripción <span className="text-slate-600">(opcional)</span></label>
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Más detalles..." className="input w-full h-24 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Imagen <span className="text-slate-600">(opcional)</span></label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover" />
                  <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-slate-900/80 flex items-center justify-center hover:bg-slate-900 transition-colors">
                    <X className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-slate-700 hover:border-emerald-500/40 cursor-pointer transition-colors bg-slate-800/30">
                  <Camera className="w-5 h-5 text-slate-500" />
                  <span className="text-sm text-slate-500 font-medium">Subir imagen</span>
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Etiquetas <span className="text-slate-600">(opcional)</span></label>
              <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="arduino, reciclaje, led" className="input w-full" />
              <p className="text-[10px] text-slate-600 mt-1">Separadas por coma</p>
            </div>
          </div>
          <button onClick={handleCreatePost} disabled={!title.trim() || posting} className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-sm font-bold transition-all active:scale-[0.98]">
            {posting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Publicar'}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-md z-30 -mx-4 px-4 py-3 border-b border-slate-800/50">
            <div className="flex items-center gap-3">
              <button onClick={() => onBack?.()} className="btn-ghost p-1.5 -ml-1.5">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-100">Comunidad</h2>
                <p className="text-[11px] text-slate-500">{posts.length} publicaciones</p>
              </div>
            </div>
            <button onClick={() => setView('create')} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
              <Plus className="w-3.5 h-3.5" /> Publicar
            </button>
          </div>

          <div className="relative">
            <button onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 w-full sm:w-auto text-sm font-medium px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-700/50 hover:border-slate-600/50 transition-all active:scale-95">
              {showFilter ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span>{activeFilter === 'all' ? 'Todos' : (POST_TYPES.find(t => t.value === activeFilter)?.label || activeFilter)}</span>
            </button>
            {showFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                <div className="absolute top-full left-0 right-auto mt-1.5 z-50 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-slate-950/50 overflow-hidden min-w-[180px] animate-slide-up">
                  <button onClick={() => { setActiveFilter('all'); setShowFilter(false); }}
                    className={`w-full text-left text-sm px-4 py-3 transition-all flex items-center gap-2 ${activeFilter === 'all' ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'}`}>
                    <Users className="w-4 h-4" /> Todos
                    {activeFilter === 'all' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                  {POST_TYPES.map(({ value, label, icon: Icon, color }) => (
                    <button key={value} onClick={() => { setActiveFilter(value); setShowFilter(false); }}
                      className={`w-full text-left text-sm px-4 py-3 transition-all flex items-center gap-2 ${activeFilter === value ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'}`}>
                      <Icon className={`w-4 h-4 ${color}`} /> {label}
                      {activeFilter === value && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-16">
              <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-medium mb-1">Aún no hay publicaciones</p>
              <p className="text-slate-500 text-sm mb-4">Sé el primero en compartir algo</p>
              <button onClick={() => setView('create')} className="btn-primary">Hacer primera publicación</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(post => {
                const TypeIcon = TYPE_ICONS[post.type] ?? Trophy;
                const isLiked = likedPosts.has(post.id);
                return (
                  <div key={post.id} className="card-hover rounded-2xl">
                    <div className="flex items-start gap-3 mb-3">
                      <button onClick={() => onNavigate?.('public-profile', post.user_id)} className="shrink-0">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-white text-sm shrink-0">
                          {post.user?.avatar_url ? (
                            <img src={post.user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            ((post.user?.full_name || post.user?.username) ?? 'U')[0].toUpperCase()
                          )}
                        </div>
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => onNavigate?.('public-profile', post.user_id)} className={`text-sm font-semibold hover:underline truncate max-w-[140px] sm:max-w-[200px] ${post.user_id === 'app_ecoreengine' ? 'text-emerald-400' : post.user?.role === 'owner' ? 'text-amber-400' : post.user?.role === 'admin' ? 'text-blue-400' : 'text-slate-100'}`}>{post.user?.full_name || post.user?.username || 'Usuario'}{post.user?.verified && <VerifiedBadge />}{post.user_id !== 'app_ecoreengine' && <RoleBadge role={post.user?.role} />}</button>
                          {post.pinned && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-semibold shrink-0">📌 Oficial</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500">{timeAgo(post.created_at)}</span>
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${TYPE_COLORS[post.type].split(' ')[0]}`}>
                            <TypeIcon className="w-2.5 h-2.5" /> {TYPE_LABELS[post.type]}
                          </span>
                          {post.user?.level && <span className="text-[10px] text-slate-600">Nv.{post.user.level}</span>}
                        </div>
                      </div>
                    </div>

                    {post.images?.[0] && (
                      <div className="mb-3 rounded-2xl overflow-hidden">
                        <img src={post.images[0]} alt={post.title} className="w-full h-52 sm:h-48 object-cover" loading="eager" />
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-100 mb-1.5 leading-snug">{post.title}</h3>
                    {post.content && <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-4">{post.content}</p>}

                    {(post.tags as string[])?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(post.tags as string[]).map(tag => (
                          <span key={tag} className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 pt-2.5 border-t border-slate-700/50">
                      <button onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all active:scale-90 ${isLiked ? 'text-rose-400 bg-rose-500/10' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-semibold">{post.likes_count ?? 0}</span>
                      </button>
                      <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-800/50 transition-all active:scale-90">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">{post.comments_count ?? 0}</span>
                      </button>
                      <button onClick={async () => {
                        const reason = window.prompt('¿Por qué denuncias este contenido?');
                        if (reason) {
                          await addAdminLog('report_content', userId, `Usuario ${userId} reportó post ${post.id}: "${reason}"`);
                          setActionMsg('🚩 Reporte enviado');
                          setTimeout(() => setActionMsg(''), 2000);
                        }
                      }} className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90">
                        <Flag className="w-4 h-4" />
                      </button>
                      <button onClick={async () => {
                        const url = `${window.location.origin}/community?post=${post.id}`;
                        if (navigator.share) {
                          try { await navigator.share({ title: post.title, text: post.content, url }); } catch {}
                        } else {
                          await navigator.clipboard.writeText(url);
                          setActionMsg('📋 Enlace copiado');
                          setTimeout(() => setActionMsg(''), 2000);
                        }
                      }} className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all active:scale-90 ml-auto">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    {expandedComments.has(post.id) && (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
                        {(comments[post.id] || []).length === 0 && (
                          <p className="text-xs text-slate-500 text-center py-3">Sin comentarios aún. ¡Sé el primero!</p>
                        )}
                        {(comments[post.id] || []).map(c => (
                          <div key={c.id} className="flex items-start gap-2.5">
                            <button onClick={() => onNavigate?.('public-profile', c.user_id)} className="shrink-0">
                              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-white text-[10px]">
                                {((c.user?.full_name || c.user?.username) ?? '?')[0].toUpperCase()}
                              </div>
                            </button>
                            <div className="flex-1 min-w-0 bg-slate-800/40 rounded-xl px-3 py-2">
                              <div className="flex items-center gap-2">
                                <button onClick={() => onNavigate?.('public-profile', c.user_id)} className={`text-xs font-semibold hover:underline ${c.user_id === 'app_ecoreengine' ? 'text-emerald-400' : c.user?.role === 'owner' ? 'text-amber-400' : c.user?.role === 'admin' ? 'text-blue-400' : 'text-slate-200'}`}>{c.user?.full_name || c.user?.username || 'Usuario'}{c.user?.verified && <VerifiedBadge />}{c.user_id !== 'app_ecoreengine' && <RoleBadge role={c.user?.role} />}</button>
                                <span className="text-[10px] text-slate-500 ml-auto">{timeAgo(c.created_at)}</span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{c.content}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <button onClick={() => replyToComment(post.id, c.user?.full_name || c.user?.username || 'Usuario')}
                                  className="text-[10px] font-semibold text-slate-500 hover:text-teal-400 active:text-teal-300 transition-colors">Responder</button>
                                {(profile.role === 'admin' || profile.role === 'mod' || profile.role === 'owner') && (
                                  <button onClick={() => { if (!confirm('¿Eliminar este comentario?')) return; deleteComment(c.id).then(() => { setComments(prev => ({ ...prev, [post.id]: (prev[post.id] || []).filter(x => x.id !== c.id) })); setPosts(prev => prev.map(p => p.id === post.id ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 0) - 1) } : p)); }).catch(() => {}); }} className="text-[10px] font-semibold text-slate-500 hover:text-red-400 transition-colors" title="Eliminar comentario">
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                          <input data-comment-input={post.id} value={commentTexts[post.id] || ''}
                            onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => { if (e.key === 'Enter') addCommentToPost(post.id); }}
                            placeholder="Escribe un comentario..." className="input flex-1 text-sm py-2.5" />
                          <button onClick={() => addCommentToPost(post.id)}
                            disabled={!commentTexts[post.id]?.trim() || postingComment.has(post.id)}
                            className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-90 shrink-0">
                            {postingComment.has(post.id) ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : <MessageCircle className="w-4 h-4 text-white" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {actionMsg && (
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[70] bg-slate-900/95 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-slate-700/50 text-xs text-slate-200 animate-slide-up shadow-xl shadow-slate-950/50 whitespace-nowrap">
              {actionMsg}
            </div>
          )}
        </>
      )}
    </div>
  );
}
