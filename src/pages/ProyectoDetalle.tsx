import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Wrench, Camera, X, Building2, Star, Send, Trash, MessageCircle, Share2, FileDown, Pin, PinOff } from 'lucide-react';
import { Share } from '@capacitor/share';
import { showToast } from '../components/Toast';
import { projects } from '../lib/projectsData';
import { sendVisionMessage } from '../lib/ai';
import { exportProjectAsPdf } from '../lib/exportPdf';
import { awardXPWithCounter, rateProject, fetchProjectRatings, fetchProjectComments, addProjectComment, deleteProjectComment, ProjectComment, fetchProjectImage } from '../lib/firestore';
import { timeAgo } from '../lib/firestore';

interface ProyectoDetalleProps {
  project: { type: 'static'; id: number } | { type: 'admin'; id: string; data: any };
  onBack: () => void;
  userId?: string;
}

export default function ProyectoDetalle({ project: selection, onBack, userId }: ProyectoDetalleProps) {
  const staticProject = selection.type === 'static' ? projects.find(p => p.id === selection.id) : null;
  const adminProject = selection.type === 'admin' ? selection.data : null;
  const project = staticProject || adminProject;

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [photo, setPhoto] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [comments, setComments] = useState<(ProjectComment & { user?: any })[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(() => {
    const id = selection.type === 'admin' ? `a_${selection.id}` : `s_${selection.id}`;
    try { const arr = JSON.parse(localStorage.getItem('eco_pinned_projects') || '[]'); return arr.includes(id); } catch { return false; }
  });
  const pinId = selection.type === 'admin' ? `a_${selection.id}` : `s_${selection.id}`;
  function togglePinDetail(e: React.MouseEvent) {
    e.stopPropagation();
    const newState = !isPinned;
    setIsPinned(newState);
    try {
      const arr = JSON.parse(localStorage.getItem('eco_pinned_projects') || '[]');
      if (newState) {
        arr.push(pinId);
      } else {
        const idx = arr.indexOf(pinId);
        if (idx !== -1) arr.splice(idx, 1);
      }
      localStorage.setItem('eco_pinned_projects', JSON.stringify(arr));
    } catch {}
  }

  const projectIdForRating = selection.type === 'admin' ? selection.id : `static_${selection.id}`;

  useEffect(() => {
    if (selection.type === 'static' && !staticProject?.image) {
      fetchProjectImage(selection.id).then(url => { if (url) setUploadedImage(url); });
    }
  }, [selection.type, selection.id, staticProject?.image]);

  useEffect(() => {
    if (userId) {
      fetchProjectRatings(projectIdForRating).then(r => {
        setAvgRating(r.average);
        setUserRating(r.userRating || 0);
      });
    }
    fetchProjectComments(projectIdForRating).then(setComments);
  }, [projectIdForRating, userId]);

  const isAdmin = selection.type === 'admin';
  const restoreKey = userId ? `lab_photo_${userId}_${selection.type}_${isAdmin ? selection.id : selection.id}` : null;
  useEffect(() => {
    if (restoreKey) {
      try {
        const saved = localStorage.getItem(restoreKey);
        if (saved) { setPhoto(saved); setVerifyResult({ ok: true, msg: 'Proyecto verificado correctamente' }); }
      } catch {}
    }
  }, [restoreKey]);

  if (!project) return null;
  const title = project.title || '';
  const description = project.description || '';
  const image = isAdmin ? project.image_url : (staticProject?.image || uploadedImage);
  const thumbnail = staticProject?.thumbnail || 'from-slate-700/40 to-slate-800/40';
  const difficulty = staticProject?.difficulty || '';
  const subtitle = staticProject?.subtitle || '';

  const materialsList = isAdmin
    ? (project.materials || []).map((m: any) => typeof m === 'string' ? { name: m, source: '' } : m)
    : staticProject?.materials || [];

  const toolsList = isAdmin
    ? (project.tools || []).map((t: any) => typeof t === 'string' ? { name: t, icon: Wrench } : t)
    : staticProject?.tools || [];

  const stepsList = isAdmin
    ? (project.steps || []).map((s: any) => typeof s === 'string' ? { title: s, description: '' } : s)
    : staticProject?.steps || [];

  const tipsList = isAdmin ? (project.tips || []) : staticProject?.tips || [];

  const storageKey = userId ? `lab_photo_${userId}_${selection.type}_${isAdmin ? selection.id : selection.id}` : null;

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleEvidenceFile(file: File | undefined) {
    if (!file) return;
    setVerifying(true);
    setVerifyResult(null);
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
      const dataUrl = c.toDataURL('image/webp', 0.5);
      setPhoto(dataUrl);
      const res = await sendVisionMessage(dataUrl, `Responde SOLO con una palabra: "SI" si la imagen contiene una foto real de un objeto físico, aparato, circuito, dispositivo, herramienta, o manualidad. Responde "NO" solo si la imagen está en blanco, es texto sin foto, un dibujo abstracto, o un error de cámara.`);
      const ok = res.trim().toUpperCase().startsWith('SI');
      setVerifyResult({ ok, msg: ok ? 'Proyecto verificado correctamente +100 XP' : 'No se reconoce como proyecto electrónico. ¿La foto muestra tu proyecto?' });
      if (ok && storageKey) {
        localStorage.setItem(storageKey, dataUrl);
        if (userId) await awardXPWithCounter(userId, 100, 'projects_completed');
      }
    } catch (err: any) {
      setVerifyResult({ ok: false, msg: 'Error al verificar: ' + (err.message || 'desconocido') });
    }
    setVerifying(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function removePhoto() {
    setPhoto(null);
    setVerifyResult(null);
    if (storageKey) localStorage.removeItem(storageKey);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto w-full overflow-x-hidden break-words">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Volver al laboratorio
      </button>

      {/* Header */}
      <div className="glass rounded-2xl overflow-hidden border border-slate-700/50">
        <div className={`relative bg-gradient-to-br ${thumbnail} h-40 sm:h-48 flex items-end justify-start overflow-hidden`}>
          {image ? (
            <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-slate-950/50" />
          <div className="relative p-5 w-full bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">{title}</h2>
              <button onClick={togglePinDetail}
                className={`transition-colors p-1 ${isPinned ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`} title={isPinned ? 'Quitar anclaje' : 'Anclar proyecto'}>
                {isPinned ? <Pin className="w-5 h-5" /> : <PinOff className="w-5 h-5" />}
              </button>
              <button onClick={async () => {
                try {
                  await Share.share({ title, text: description, url: window.location.href });
                  showToast('Compartido', 'success');
                } catch { showToast('Error al compartir', 'error'); }
              }} className="text-slate-400 hover:text-emerald-400 transition-colors p-1" title="Compartir proyecto">
                <Share2 className="w-5 h-5" />
              </button>
              <button onClick={() => exportProjectAsPdf(title, description, materialsList.map((m: any) => m.name || m), stepsList.map((s: any) => s.title || s), tipsList.join('\n'))}
                className="text-slate-400 hover:text-emerald-400 transition-colors p-1" title="Descargar como PDF">
                <FileDown className="w-5 h-5" />
              </button>
            </div>
            {subtitle && <p className="text-sm text-emerald-400 font-medium mt-0.5">{subtitle}</p>}
            {isAdmin && project.institution_name && (
              <p className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Por {project.institution_name}
              </p>
            )}
          </div>
          {difficulty && (
            <div className="absolute top-3 right-3">
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">{difficulty}</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          <div className="flex items-center gap-1.5 mt-3">
            {[1, 2, 3, 4, 5].map(star => (
              <Star key={star} className={`w-4 h-4 ${star <= avgRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
            ))}
            <span className="text-xs text-slate-500 ml-1">{avgRating > 0 ? avgRating.toFixed(1) : ''}</span>
            <span className="text-xs text-slate-600 ml-1">· {comments.length} comentario{comments.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* Materials */}
      {materialsList.length > 0 && (
        <div className="glass rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full" />
            Materiales
          </h3>
          <div className="space-y-2">
            {materialsList.map((mat: any, i: number) => {
              const name = mat.name || mat;
              const source = mat.source || '';
              const isChecked = !!checked[name];
              return (
                <div key={i} onClick={() => setChecked(prev => ({ ...prev, [name]: !prev[name] }))}
                  className={`rounded-xl p-3 border flex items-start gap-3 cursor-pointer transition-all ${
                    isChecked ? 'bg-emerald-900/30 border-emerald-600/40' : 'bg-slate-800/60 border-slate-700/50 hover:border-emerald-700/30'
                  }`}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                    isChecked ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500 bg-slate-800'
                  }`}>
                    {isChecked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-all ${isChecked ? 'text-emerald-300 line-through' : 'text-slate-200'}`}>{name}</p>
                    {source && <p className="text-xs text-slate-500 mt-0.5"><span className="text-emerald-500">Fuente:</span> {source}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tools */}
      {toolsList.length > 0 && (
        <div className="glass rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 bg-teal-500 rounded-full" />
            Herramientas Necesarias
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {toolsList.map((tool: any, i: number) => (
              <div key={i} className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 flex items-center gap-2">
                {tool.icon && <tool.icon className="w-4 h-4 text-teal-400 flex-shrink-0" />}
                <span className="text-xs text-slate-300 font-medium">{tool.name || tool}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {stepsList.length > 0 && (
        <div className="glass rounded-2xl border border-slate-700/50 p-5">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
            <span className="w-1.5 h-5 bg-amber-500 rounded-full" />
            Paso a Paso
          </h3>
          <ol className="space-y-3">
            {stepsList.map((step: any, i: number) => (
              <li key={i} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                <div className="flex gap-3">
                  <span className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg shadow-emerald-600/30">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100">{step.title || step}</p>
                    {step.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{step.description}</p>}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tips */}
      {tipsList.length > 0 && (
        <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-5">
          <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mb-3">
            <ShieldCheck className="w-4 h-4" />
            Consejos útiles
          </h4>
          <ul className="space-y-1.5">
            {tipsList.map((tip: string, i: number) => (
              <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comentarios y calificación */}
      <div className="glass rounded-2xl border border-slate-700/50 p-5">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          Calificaciones y Comentarios
        </h3>

        {/* Star rating */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-700/40">
          <p className="text-xs text-slate-500 mr-1">Tu calificación:</p>
          {[1, 2, 3, 4, 5].map(star => (
            <button key={star} onClick={async () => {
              if (!userId) return;
              await rateProject(projectIdForRating, userId, star);
              setUserRating(star);
              const r = await fetchProjectRatings(projectIdForRating);
              setAvgRating(r.average);
            }} className={`transition-all ${star <= (userRating || avgRating) ? 'text-amber-400' : 'text-slate-600'} hover:scale-110`}>
              <Star className={`w-5 h-5 ${star <= (userRating || avgRating) ? 'fill-amber-400' : ''}`} />
            </button>
          ))}
          <span className="text-xs text-slate-500 ml-1">{avgRating > 0 ? avgRating.toFixed(1) + ' ★' : 'Sin calificar'}</span>
        </div>

        {/* Comment input */}
        <div className="flex gap-2 mb-4">
          <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escribe un comentario..." maxLength={500}
            className="flex-1 text-sm bg-slate-800/60 border border-slate-700/50 rounded-xl px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50" />
          <button onClick={async () => {
            if (!commentText.trim() || !userId || sendingComment) return;
            setSendingComment(true);
            try {
              await addProjectComment({ project_id: projectIdForRating, user_id: userId, content: commentText.trim() });
              setCommentText('');
              await fetchProjectComments(projectIdForRating).then(setComments);
            } catch (e) { alert('Error al guardar comentario'); }
            setSendingComment(false);
          }} disabled={!commentText.trim() || !userId || sendingComment}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-xl p-2 transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Comments list */}
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {comments.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No hay comentarios aún. ¡Sé el primero!</p>}
          {comments.map(c => (
            <div key={c.id} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-emerald-400 truncate">{c.user?.username || c.user?.full_name || c.user_id?.slice(0, 6)}</span>
                  <span className="text-[10px] text-slate-600">{timeAgo(c.created_at)}</span>
                </div>
                {(c.user_id === userId) && (
                  <button onClick={async () => {
                    await deleteProjectComment(c.id!);
                    await fetchProjectComments(projectIdForRating).then(setComments);
                  }} className="text-red-400 hover:text-red-300 p-1">
                    <Trash className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Foto de evidencia */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={e => handleEvidenceFile(e.target.files?.[0])} className="hidden" />
      <button onClick={() => fileRef.current?.click()} disabled={verifying}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-600/50 text-slate-400 hover:border-emerald-600/50 hover:text-emerald-400 transition-colors disabled:opacity-50">
        {verifying ? (
          <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
        ) : <Camera className="w-5 h-5" />}
        {verifying ? 'Verificando con IA...' : photo ? 'Actualizar foto de evidencia' : 'Tomar foto de evidencia +100 XP'}
      </button>
      {verifying && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
          Analizando imagen...
        </div>
      )}
      {photo && !verifying && (
        <div className="relative rounded-xl overflow-hidden border border-emerald-700/40">
          <img src={photo} alt="Evidencia" className="w-full h-44 object-cover" />
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              {verifyResult?.ok ? 'Verificado' : 'Foto tomada'}
            </span>
            <button onClick={removePhoto} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
          </div>
        </div>
      )}
      {verifyResult && !verifyResult.ok && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <X className="w-4 h-4 flex-shrink-0" />
          {verifyResult.msg}
        </div>
      )}
    </div>
  );
}
