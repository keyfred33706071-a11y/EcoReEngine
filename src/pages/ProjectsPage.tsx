import { useEffect, useState } from 'react';
import { Plus, Wrench, CheckCircle, Clock, Share2, X, ChevronRight, Zap, Trash2 } from 'lucide-react';
import { Project, difficultyLabel, difficultyColor, awardXPWithCounter, fetchUserProjects, createUserProject, updateUserProject, deleteUserProject } from '../lib/firestore';

interface ProjectsPageProps {
  userId: string;
  onXpGained: () => void;
}

const CATEGORIES = [
  { value: 'assistive_tech', label: 'Tecnología Asistiva' },
  { value: 'home_automation', label: 'Hogar Inteligente' },
  { value: 'education', label: 'Educación' },
  { value: 'art', label: 'Arte & Diseño' },
  { value: 'environment', label: 'Medio Ambiente' },
  { value: 'general', label: 'General' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planning: { label: 'Planificando', color: 'text-slate-400 bg-slate-700 border-slate-600', icon: Clock },
  in_progress: { label: 'En progreso', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: Wrench },
  completed: { label: 'Completado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle },
  shared: { label: 'Compartido', color: 'text-teal-400 bg-teal-500/10 border-teal-500/30', icon: Share2 },
};

export default function ProjectsPage({ userId, onXpGained }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [difficulty, setDifficulty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadProjects();
  }, [userId]);

  async function loadProjects() {
    const data = await fetchUserProjects(userId);
    setProjects(data as Project[]);
    setLoading(false);
  }

  async function createProject() {
    if (!title.trim()) return;
    setSaving(true);
    const id = await createUserProject({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      category,
      difficulty_level: difficulty,
      status: 'planning',
    });
    const newProject = { id, user_id: userId, title: title.trim(), description: description.trim(), category, difficulty_level: difficulty, status: 'planning' as Project['status'], components_used: [], steps: [], images: [], xp_earned: 0, is_public: false, likes_count: 0 };
    setProjects(prev => [newProject, ...prev]);
    setShowModal(false);
    setTitle('');
    setDescription('');
    setSaving(false);
  }

  async function updateStatus(project: Project, newStatus: string) {
    const xpMap: Record<string, number> = { completed: 200, shared: 100 };
    const xpGain = xpMap[newStatus] ?? 0;

    await updateUserProject(project.id, {
      status: newStatus,
      xp_earned: project.xp_earned + xpGain,
    });

    if (newStatus === 'completed') {
      await awardXPWithCounter(userId, xpGain, 'projects_completed');
      onXpGained();
    }

    setProjects(prev => prev.map(p => p.id === project.id ? { ...p, status: newStatus as Project['status'], xp_earned: p.xp_earned + xpGain } : p));
    setSelected(null);
  }

  async function deleteProject(id: string) {
    await deleteUserProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setSelected(null);
  }

  const filtered = projects.filter(p => filterStatus === 'all' || p.status === filterStatus);
  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}
              className={`card-hover flex items-center gap-3 ${filterStatus === status ? 'border-emerald-500/30' : ''}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-100">{statusCounts[status] ?? 0}</p>
                <p className="text-xs text-slate-500">{cfg.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Mis Proyectos</h2>
          <p className="section-subtitle">{filtered.length} proyectos{filterStatus !== 'all' ? ` · ${STATUS_CONFIG[filterStatus]?.label}` : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </button>
      </div>

      {/* Projects grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-36 animate-pulse bg-slate-800/40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium mb-1">
            {projects.length === 0 ? 'Aún no tienes proyectos' : 'Sin proyectos en este estado'}
          </p>
          <p className="text-slate-500 text-sm mb-4">Documenta los proyectos que construyes con e-waste</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">Crear primer proyecto</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(project => {
            const cfg = STATUS_CONFIG[project.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={project.id}
                onClick={() => setSelected(project)}
                className="card-hover flex flex-col gap-3 text-left group cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 line-clamp-1">{project.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{project.description || 'Sin descripción'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1 group-hover:text-emerald-400 transition-colors" />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`badge border ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  <span className={`text-xs ${difficultyColor(project.difficulty_level)}`}>
                    {difficultyLabel(project.difficulty_level)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-xs text-slate-500">
                    {CATEGORIES.find(c => c.value === project.category)?.label ?? project.category}
                  </span>
                  {project.xp_earned > 0 && (
                    <span className="text-xs text-amber-400 flex items-center gap-1">
                      <Zap className="w-3 h-3" />{project.xp_earned} XP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative glass rounded-3xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-slate-100">Nuevo proyecto</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre del proyecto</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Robot con motores reciclados" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe tu proyecto..." className="input h-24 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input text-sm">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Dificultad</label>
                  <select value={difficulty} onChange={e => setDifficulty(Number(e.target.value))} className="input text-sm">
                    {[1,2,3,4,5].map(d => <option key={d} value={d}>{difficultyLabel(d)}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button onClick={createProject} disabled={!title.trim() || saving} className="btn-primary w-full py-3 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Crear proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative glass rounded-3xl w-full max-w-lg animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-bold text-slate-100">{selected.title}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{CATEGORIES.find(c => c.value === selected.category)?.label}</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5 text-slate-400 hover:text-slate-200" /></button>
            </div>
            <div className="p-6 space-y-4">
              {selected.description && <p className="text-slate-300 text-sm">{selected.description}</p>}

              <div className="flex flex-wrap gap-2">
                <span className={`badge border ${STATUS_CONFIG[selected.status]?.color}`}>
                  {STATUS_CONFIG[selected.status]?.label}
                </span>
                <span className={`text-sm ${difficultyColor(selected.difficulty_level)}`}>
                  {difficultyLabel(selected.difficulty_level)}
                </span>
                {selected.xp_earned > 0 && <span className="badge-amber">+{selected.xp_earned} XP ganado</span>}
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">Cambiar estado</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={status}
                        onClick={() => updateStatus(selected, status)}
                        disabled={selected.status === status}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          selected.status === status ? `${cfg.color} opacity-100` : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="p-6 pt-0">
              <button onClick={() => deleteProject(selected.id)} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 w-full justify-center py-2 rounded-xl hover:bg-red-500/10 transition-all">
                <Trash2 className="w-4 h-4" />
                Eliminar proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
