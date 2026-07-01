import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Search, Filter, Clock, Zap, ChevronRight, CheckCircle, Play, BookOpen, Camera, Trash2 } from 'lucide-react';
import { Tutorial, TutorialProgress, TutorialBlock, difficultyLabel, difficultyColor, categoryLabel, fetchTutorials, fetchTutorialProgress, upsertTutorialProgress, awardXPWithCounter, awardTutorialXp } from '../lib/firestore';

interface LearnPageProps {
  userId: string;
  onXpGained?: () => void;
  onBack?: () => void;
}

const CATEGORIES = ['all', 'basics', 'circuits', 'robotics', 'ewaste', 'projects'];
const CATEGORY_ICONS: Record<string, string> = {
  all: '📚', basics: '⚡', circuits: '🔌', robotics: '🤖', ewaste: '♻️', projects: '🔧',
};

export default function LearnPage({ userId, onXpGained, onBack }: LearnPageProps) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [progress, setProgress] = useState<Map<string, TutorialProgress>>(new Map());
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Tutorial | null>(null);
  const [completing, setCompleting] = useState(false);
  const [verificationPhotos, setVerificationPhotos] = useState<Record<string, string>>({});
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [xpAwarded, setXpAwarded] = useState(false);

  // Load saved verification photos from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`tutorial_photos_${userId}`);
      if (saved) setVerificationPhotos(JSON.parse(saved));
    } catch {}
  }, [userId]);

  function savePhotoToStorage(tutorialId: string, dataUrl: string) {
    const updated = { ...verificationPhotos, [tutorialId]: dataUrl };
    setVerificationPhotos(updated);
    localStorage.setItem(`tutorial_photos_${userId}`, JSON.stringify(updated));
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoFile(file: File | undefined) {
    if (!file) return;
    try {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      await new Promise<void>((resolve, reject) => { img.onload = () => { URL.revokeObjectURL(url); resolve(); }; img.onerror = () => { URL.revokeObjectURL(url); reject(); }; });
      let w = img.width, h = img.height;
      if (w > 800) { h = Math.round(h * 800 / w); w = 800; }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      setNewPhoto(c.toDataURL('image/webp', 0.5));
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeNewPhoto() {
    setNewPhoto(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function toggleStep(index: number) {
    if (!selected) return;
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      localStorage.setItem(`eco_tutorial_progress_${userId}_${selected.id}`, JSON.stringify([...next]));
      return next;
    });
  }

  function removePhoto(tutorialId: string) {
    const updated = { ...verificationPhotos };
    delete updated[tutorialId];
    setVerificationPhotos(updated);
    localStorage.setItem(`tutorial_photos_${userId}`, JSON.stringify(updated));
  }

  useEffect(() => {
    async function load() {
      const [t, p] = await Promise.all([
        fetchTutorials(),
        fetchTutorialProgress(userId),
      ]);
      setTutorials(t as Tutorial[]);
      const map = new Map<string, TutorialProgress>();
      (p as TutorialProgress[]).forEach(item => map.set(item.tutorial_id, item));
      setProgress(map);
      setLoading(false);
    }
    load();
  }, [userId]);

  useEffect(() => {
    if (!selected) return;
    const key = `eco_tutorial_progress_${userId}_${selected.id}`;
    try {
      const saved = localStorage.getItem(key);
      setCompletedSteps(saved ? new Set(JSON.parse(saved)) : new Set());
      const awarded = localStorage.getItem(`${key}_awarded`);
      setXpAwarded(awarded === 'true');
    } catch { setCompletedSteps(new Set()); setXpAwarded(false); }
  }, [selected?.id, userId]);

  useEffect(() => {
    const steps = selected?.content || [];
    if (steps.length === 0 || !userId || !selected) return;
    if (completedSteps.size === steps.length && completedSteps.size > 0 && !xpAwarded) {
      setXpAwarded(true);
      localStorage.setItem(`eco_tutorial_progress_${userId}_${selected.id}_awarded`, 'true');
      awardTutorialXp(userId, selected.id).then(() => onXpGained?.()).catch(() => {});
    }
  }, [completedSteps.size, selected?.id, xpAwarded, userId]);

  const filtered = tutorials.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false;
    if (activeDifficulty > 0 && t.difficulty_level !== activeDifficulty) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function startTutorial(tutorial: Tutorial) {
    setSelected(tutorial);
    const existing = progress.get(tutorial.id);
    if (!existing || existing.status === 'not_started') {
      await upsertTutorialProgress({
        user_id: userId,
        tutorial_id: tutorial.id,
        status: 'in_progress',
        progress_percentage: 10,
      });
      const newMap = new Map(progress);
      newMap.set(tutorial.id, { ...existing, status: 'in_progress', progress_percentage: 10 } as TutorialProgress);
      setProgress(newMap);
    }
  }

  async function completeTutorial() {
    if (!selected) return;
    setCompleting(true);
    await upsertTutorialProgress({
      user_id: userId,
      tutorial_id: selected.id,
      status: 'completed',
      progress_percentage: 100,
      completed_at: new Date().toISOString(),
    });

    const photoBonus = newPhoto ? 50 : 0;
    await awardXPWithCounter(userId, selected.xp_reward + photoBonus, 'tutorials_completed');

    const newMap = new Map(progress);
    newMap.set(selected.id, { status: 'completed', progress_percentage: 100 } as TutorialProgress);
    setProgress(newMap);
    if (newPhoto) savePhotoToStorage(selected.id, newPhoto);
    setNewPhoto(null);
    setCompleting(false);
    setSelected(null);
    onXpGained?.();
  }

  const getStatusBadge = (tutorialId: string) => {
    const p = progress.get(tutorialId);
    if (!p || p.status === 'not_started') return null;
    if (p.status === 'completed') return <span className="badge-emerald">Completado</span>;
    return <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">En progreso</span>;
  };

  const completedCount = [...progress.values()].filter(p => p.status === 'completed').length;

  if (selected) {
    const p = progress.get(selected.id);
    const isCompleted = p?.status === 'completed';
    const tutorialContent = [
      { type: 'intro', text: selected.description },
      { type: 'concept', text: `Categoría: ${categoryLabel(selected.category)} · Nivel: ${difficultyLabel(selected.difficulty_level)} · Duración: ${selected.duration_minutes} minutos` },
      { type: 'objective', text: `Al completar este tutorial ganarás ${selected.xp_reward} XP y avanzarás en tu camino de aprendizaje.` },
      ...(selected.tags?.length ? [{ type: 'tags', text: `Etiquetas: ${(selected.tags as string[]).join(', ')}` }] : []),
    ];
    const tutorialSteps = (selected.content || []) as TutorialBlock[];

    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 mb-6 transition-colors">
          <ChevronRight className="w-4 h-4 rotate-180" />
          Volver a tutoriales
        </button>

        <div className="card mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-5xl">{CATEGORY_ICONS[selected.category] ?? '📖'}</div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-100 mb-2">{selected.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="badge-emerald">{categoryLabel(selected.category)}</span>
                <span className={`badge bg-slate-700 ${difficultyColor(selected.difficulty_level)}`}>
                  {difficultyLabel(selected.difficulty_level)}
                </span>
                <span className="badge bg-slate-700 text-slate-400">
                  <Clock className="w-3 h-3" />{selected.duration_minutes}min
                </span>
                <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="w-3 h-3" />{selected.xp_reward} XP
                </span>
              </div>
            </div>
            {isCompleted && <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />}
          </div>

          {tutorialSteps.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Progreso: {completedSteps.size} de {tutorialSteps.length} pasos</span>
                <span className="text-xs text-emerald-400 font-medium">{Math.round((completedSteps.size / tutorialSteps.length) * 100)}%</span>
              </div>
              <div className="progress-bar h-2">
                <div className="progress-fill h-2" style={{ width: `${(completedSteps.size / tutorialSteps.length) * 100}%` }} />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {tutorialContent.map((block, i) => (
              <div key={i} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <p className="text-slate-300 text-sm leading-relaxed">{block.text}</p>
              </div>
            ))}

            {tutorialSteps.length > 0 && tutorialSteps.map((block, i) => {
              const isStepDone = completedSteps.has(i);
              return (
                <div key={i} onClick={() => toggleStep(i)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isStepDone ? 'bg-emerald-900/20 border-emerald-600/40' : 'bg-slate-800/50 border-slate-700/50 hover:border-emerald-700/30'
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isStepDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
                  }`}>
                    {isStepDone && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm transition-all ${isStepDone ? 'text-emerald-300 line-through' : 'text-slate-200'}`}>{block.content}</p>
                  </div>
                </div>
              );
            })}

            {tutorialSteps.length > 0 && completedSteps.size === tutorialSteps.length && (
              <div className="p-4 bg-emerald-500/20 rounded-xl border border-emerald-500/40 flex items-center gap-3">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="font-semibold text-emerald-400">Completado! +50 XP</p>
                  <p className="text-xs text-slate-400">Has completado todos los pasos de este tutorial.</p>
                </div>
              </div>
            )}

            <div className="p-4 bg-emerald-900/30 rounded-xl border border-emerald-700/40">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">Materiales necesarios</h4>
              <p className="text-sm text-slate-300">
                {(selected.required_components as string[])?.length > 0
                  ? (selected.required_components as string[]).join(', ')
                  : 'Componentes básicos de e-waste reciclado'}
              </p>
            </div>

            <div className="p-4 bg-teal-900/30 rounded-xl border border-teal-700/40">
              <h4 className="text-sm font-semibold text-teal-400 mb-2">Consejo de seguridad</h4>
              <p className="text-sm text-slate-300">
                Siempre trabaja con equipos desconectados de la corriente eléctrica.
                Usa gafas de protección al desmontar componentes. La seguridad es lo primero.
              </p>
            </div>
          </div>
        </div>

        {/* Foto de evidencia */}
        {!isCompleted ? (
          <div className="mb-4">
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={e => handlePhotoFile(e.target.files?.[0])} className="hidden" />
            {!newPhoto ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-600/50 text-slate-400 hover:border-emerald-600/50 hover:text-emerald-400 transition-colors"
              >
                <Camera className="w-5 h-5" />
                Tomar foto de evidencia <span className="text-emerald-500 text-xs">+50 XP</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-700/50">
                <img src={newPhoto} alt="Evidencia" className="w-full h-48 object-cover" />
                <button
                  onClick={removeNewPhoto}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-600/80 rounded-full flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        ) : verificationPhotos[selected.id] ? (
          <div className="mb-4 rounded-xl overflow-hidden border border-emerald-700/40">
            <img src={verificationPhotos[selected.id]} alt="Evidencia" className="w-full h-48 object-cover" />
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                Foto de evidencia
              </span>
              <button onClick={() => removePhoto(selected.id)} className="text-xs text-red-400 hover:text-red-300">
                Eliminar
              </button>
            </div>
          </div>
        ) : null}

        {!isCompleted ? (
          <button
            onClick={completeTutorial}
            disabled={completing}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base"
          >
            {completing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Marcar como completado · +{selected.xp_reward} XP
              </>
            )}
          </button>
        ) : (
          <div className="card bg-emerald-900/30 border-emerald-700/40 flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-400">Tutorial completado</p>
              <p className="text-sm text-slate-400">Has ganado {selected.xp_reward} XP por este tutorial.</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header stats */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => onBack?.()} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="section-title">Biblioteca de Aprendizaje</h2>
            <p className="section-subtitle mt-1">{completedCount} de {tutorials.length} tutoriales completados</p>
          </div>
        </div>
        <div className="w-32">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${tutorials.length > 0 ? (completedCount / tutorials.length) * 100 : 0}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(tutorials.length > 0 ? (completedCount / tutorials.length) * 100 : 0)}% completo</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 flex-1">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tutoriales..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={activeDifficulty}
            onChange={e => setActiveDifficulty(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>Todos los niveles</option>
            {[1,2,3,4,5].map(d => (
              <option key={d} value={d}>{difficultyLabel(d)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            <span className="capitalize">{cat === 'all' ? 'Todos' : categoryLabel(cat)}</span>
          </button>
        ))}
      </div>

      {/* Tutorial grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card h-40 animate-pulse bg-slate-800/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No se encontraron tutoriales</p>
          <button onClick={() => { setSearch(''); setActiveCategory('all'); setActiveDifficulty(0); }}
            className="btn-ghost text-sm mt-3">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(tutorial => {
            const p = progress.get(tutorial.id);
            const isCompleted = p?.status === 'completed';
            const isInProgress = p?.status === 'in_progress';
            return (
              <button
                key={tutorial.id}
                onClick={() => startTutorial(tutorial)}
                className={`card-hover flex flex-col gap-3 text-left group ${isCompleted ? 'border-emerald-500/30' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {CATEGORY_ICONS[tutorial.category] ?? '📖'}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(tutorial.id)}
                    {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                  </div>
                </div>

                  <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-100 leading-snug mb-1 flex items-center gap-1.5">
                    {tutorial.title}
                    {verificationPhotos[tutorial.id] && <Camera className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{tutorial.description}</p>
                </div>

                {isInProgress && p && (
                  <div>
                    <div className="progress-bar h-1">
                      <div className="progress-fill h-1" style={{ width: `${p.progress_percentage}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${difficultyColor(tutorial.difficulty_level)}`}>
                      {difficultyLabel(tutorial.difficulty_level)}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{tutorial.duration_minutes}m
                    </span>
                  </div>
                  <span className="text-xs font-medium text-amber-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />{tutorial.xp_reward}
                  </span>
                </div>

                <div className={`flex items-center gap-1 text-xs font-medium ${isCompleted ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'} transition-colors`}>
                  {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isCompleted ? 'Completado' : isInProgress ? 'Continuar' : 'Comenzar'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
