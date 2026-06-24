import { useEffect, useState } from 'react';
import { Lightbulb, Building2, Filter, Star, ChevronRight, Menu, X, ClipboardPaste, Loader, FolderOpen } from 'lucide-react';
import { fetchAdminProjects, fetchProjectRatings, rateProject, AdminProject, fetchProjectImage, saveProjectImage, uploadImage } from '../lib/firestore';
import { compressImage } from '../lib/compressImage';
import { showToast } from '../components/Toast';
import { CardSkeleton } from '../components/Skeleton';
import { ProjectData, projects } from '../lib/projectsData';


type SelectableProject = { type: 'static'; id: number } | { type: 'admin'; id: string; data: AdminProject };

interface LaboratorioProps {
  onSelectProject: (p: SelectableProject) => void;
  userId?: string;
  savedScrollY?: number;
  onSaveScroll?: (y: number) => void;
}

function StarRating({ projectId, userId, compact, className }: { projectId: string; userId?: string; compact?: boolean; className?: string }) {
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    fetchProjectRatings(projectId).then(r => {
      setAvgRating(r.average);
      setUserRating(r.userRating || 0);
    }).finally(() => setLoading(false));
  }, [projectId, userId]);

  if (loading) return <div className="h-5" />;

  return (
    <div className={`flex items-center gap-0.5 ${compact ? 'scale-75 origin-left' : ''} ${className || ''}`}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={async () => {
          if (!userId) return;
          await rateProject(projectId, userId, star);
          setUserRating(star);
          const r = await fetchProjectRatings(projectId);
          setAvgRating(r.average);
        }} className={`transition-all ${star <= (userRating || avgRating) ? 'text-amber-400' : 'text-slate-600'} hover:scale-110`}>
          <Star className={`w-4 h-4 ${star <= (userRating || avgRating) ? 'fill-amber-400' : ''}`} />
        </button>
      ))}
      {!compact && <span className="text-[11px] text-slate-500 ml-1">{avgRating > 0 ? avgRating.toFixed(1) : ''}</span>}
    </div>
  );
}

export default function Laboratorio({ onSelectProject, userId, savedScrollY = 0, onSaveScroll }: LaboratorioProps) {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [filter, setFilter] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [projectImages, setProjectImages] = useState<Record<number, string>>({});
  const [pastingId, setPastingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 7;
  useEffect(() => { setCurrentPage(1); }, [filter]);

  function getPinnedIds(): string[] {
    try { return JSON.parse(localStorage.getItem('eco_pinned_projects') || '[]'); } catch { return []; }
  }

  useEffect(() => {
    if (savedScrollY > 0) {
      window.scrollTo(0, savedScrollY);
    }
  }, []);

  useEffect(() => {
    setLoadingAdmin(true);
    fetchAdminProjects().then(list => setAdminProjects(list)).catch(() => {}).finally(() => setLoadingAdmin(false));
  }, []);

  useEffect(() => {
    const ids = projects.filter(p => !p.image.startsWith('/proyecto/')).map(p => p.id);
    if (ids.length === 0) return;
    Promise.all(ids.map(async id => {
      const url = await fetchProjectImage(id);
      return url ? { id, url } : null;
    })).then(results => {
      const map: Record<number, string> = {};
      for (const r of results) {
        if (r) map[r.id] = r.url;
      }
      setProjectImages(map);
    });
  }, []);

  async function handlePasteImage(projectId: number) {
    setPastingId(projectId);
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const t = item.types.find(x => x.startsWith('image/'));
        if (!t) continue;
        const blob = await item.getType(t);
        const file = new File([blob], `project_${projectId}.${t.split('/')[1]}`, { type: t });
        if (file.size > 5 * 1024 * 1024) { showToast('❌ La imagen excede 5MB', 'error'); return; }
        const compressed = await compressImage(file, 1200, 0.8);
        const url = await uploadImage(compressed, `projects/${projectId}`);
        await saveProjectImage(projectId, url);
        setProjectImages(prev => ({ ...prev, [projectId]: url }));
        showToast('✅ Imagen agregada', 'success');
        return;
      }
    } catch {
      showToast('💡 Arrastra una imagen desde tu PC', 'error');
    } finally {
      setPastingId(null);
    }
  }

  async function handleDropImage(projectId: number, file: File) {
    if (!file.type.startsWith('image/')) { showToast('❌ Solo imágenes', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('❌ La imagen excede 5MB', 'error'); return; }
    setPastingId(projectId);
    try {
      const compressed = await compressImage(file, 1200, 0.8);
      const url = await uploadImage(compressed, `projects/${projectId}`);
      await saveProjectImage(projectId, url);
      setProjectImages(prev => ({ ...prev, [projectId]: url }));
      showToast('✅ Imagen agregada', 'success');
    } catch {
      showToast('❌ Error al subir', 'error');
    } finally {
      setPastingId(null);
    }
  }

  const filterOptions = ['Todos', 'Fácil', 'Medio', 'Avanzado', 'Institución', 'Otros Proyectos'];

  function sortPinned<T extends { id: number | string }>(items: T[], prefix: string): T[] {
    const ids = getPinnedIds();
    return [...items].sort((a, b) => {
      const aPinned = ids.includes(`${prefix}_${a.id}`);
      const bPinned = ids.includes(`${prefix}_${b.id}`);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }

  const staticFiltered = sortPinned(
    (filter === 'Institución' || filter === 'Otros Proyectos') ? [] : (
    (!filter || filter === 'Todos')
      ? projects
      : projects.filter(p => p.difficulty === filter)
    ), 's'
  );
  const adminFiltered = sortPinned(
    !filter || filter === 'Todos'
    ? adminProjects
    : filter === 'Institución'
      ? adminProjects.filter(p => p.institution_name)
      : filter === 'Otros Proyectos'
        ? adminProjects.filter(p => p.difficulty === 'Otros' || (!p.difficulty && !p.institution_name))
        : adminProjects.filter(p => p.difficulty === filter),
    'a'
  );
  const showInst = !filter || filter === 'Todos' || filter === 'Institución' || filter === 'Otros Proyectos';

  type DisplayItem = { type: 'inst'; data: AdminProject } | { type: 'static'; data: ProjectData };

  const allItems: DisplayItem[] = [];
  if (showInst && adminFiltered.length > 0) {
    for (const p of adminFiltered) allItems.push({ type: 'inst', data: p });
  }
  for (const p of staticFiltered) allItems.push({ type: 'static', data: p });
  const totalPages = Math.max(1, Math.ceil(allItems.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = allItems.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-emerald-400" />
          Laboratorio de Proyectos
        </h2>
        <p className="section-subtitle mt-1">
          Guías detalladas paso a paso para construir inventos útiles con componentes reciclados de e-waste.
        </p>
      </div>

      {/* Filter */}
      <div className="relative">
        <button onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800/60 text-slate-300 border border-slate-700/50 hover:border-slate-600/50 transition-all w-full sm:w-auto">
          {showMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{filter || 'Todos'}</span>
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-auto sm:ml-0" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute top-full left-0 right-auto mt-1 z-50 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-slate-950/50 overflow-hidden min-w-[180px] animate-slide-up">
              {filterOptions.map(d => (
                <button key={d} onClick={() => { setFilter(d === 'Todos' ? '' : d); setShowMenu(false); }}
                  className={`w-full text-left text-sm px-4 py-2.5 transition-all flex items-center gap-2 ${
                    (filter === '' && d === 'Todos') || filter === d
                      ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}>
                  {d === 'Institución' ? <Building2 className="w-4 h-4 text-emerald-400" /> : null}
                  {d === 'Otros Proyectos' ? <FolderOpen className="w-4 h-4 text-emerald-400" /> : null}
                  {d}
                  {((filter === '' && d === 'Todos') || filter === d) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loadingAdmin ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : pageItems.map(item =>
          item.type === 'inst' ? (
            (() => { const p = (item as { type: 'inst'; data: AdminProject }).data; return (
              <div key={`inst-${p.id}`} onClick={() => { onSaveScroll?.(window.scrollY); onSelectProject?.({ type: 'admin', id: p.id!, data: p }); }}
                className="card-hover flex flex-col gap-3 text-left group cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 line-clamp-1 flex items-center gap-1.5">
                      {p.title}
                      <Building2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description || 'Sin descripción'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1 group-hover:text-emerald-400 transition-colors" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="badge border text-emerald-400 bg-emerald-500/10 border-emerald-500/30">
                    <Building2 className="w-3 h-3" /> Institución
                  </span>
                  {p.difficulty && (
                    <span className="text-xs text-amber-400">{p.difficulty}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500 flex-1 min-w-0 truncate">
                    {p.institution_name || 'Institución'}
                  </span>
                  <StarRating projectId={p.id!} userId={userId} compact className="flex-shrink-0" />
                </div>
              </div>
            ); })()
          ) : (
            (() => { const project = (item as { type: 'static'; data: ProjectData }).data; const ThumbIcon = project.thumbnailIcon; const imgUrl = project.image || projectImages[project.id]; return (
              <div key={project.id}
                className="group glass rounded-2xl overflow-hidden border border-slate-700/50 transition-all duration-300 hover:border-emerald-500/30 hover:scale-[1.02] cursor-pointer flex flex-col"
                onClick={() => { onSaveScroll?.(window.scrollY); onSelectProject?.({ type: 'static', id: project.id }); }}>
                   <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${project.thumbnail}`}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={project.title} className="relative w-full h-full object-cover animate-img-fade" loading="eager" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <ThumbIcon className="w-16 h-16 text-white/10" />
                      </div>
                    )}
                    {isDesktop && (
                      <div onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={e => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer?.files[0]; if (f) handleDropImage(project.id, f); }}
                        onClick={() => { if (navigator.clipboard) { handlePasteImage(project.id); } }}
                        className={`absolute inset-0 z-10 flex items-center justify-center cursor-pointer transition-all ${
                          imgUrl
                            ? 'bg-black/0 hover:bg-black/60 group-hover:opacity-100 opacity-0'
                            : 'bg-black/60 hover:bg-black/70'
                        }`}>
                        {pastingId === project.id ? (
                          <Loader className="w-8 h-8 text-emerald-400 animate-spin" />
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <ClipboardPaste className="w-10 h-10 text-emerald-400" />
                            <span className="text-xs font-semibold text-white bg-emerald-600/80 px-3 py-1.5 rounded-lg">{imgUrl ? 'Reemplazar imagen' : 'Arrastra o pega imagen aquí'}</span>
                          </div>
                        )}
                      </div>
                    )}
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent pointer-events-none" />
                   <ThumbIcon className="absolute top-3 right-3 w-10 h-10 text-white/20" />
                   <div className="absolute inset-x-0 bottom-0 p-4">
                     <h3 className="text-lg font-bold text-white leading-tight truncate">{project.title}</h3>
                     <p className="text-xs text-emerald-400 font-medium mt-0.5 truncate">{project.subtitle}</p>
                   </div>
                   <div className="absolute top-3 left-3">
                     <span className="bg-emerald-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{project.difficulty}</span>
                   </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{project.description}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <StarRating projectId={`static_${project.id}`} userId={userId} compact />
                  </div>
                </div>
              </div>
            ); })()
          )
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button key={pageNum} onClick={() => { setCurrentPage(pageNum); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`w-9 h-9 rounded-xl text-sm font-bold transition-all active:scale-90 ${
                safePage === pageNum
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}>
              {pageNum}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
