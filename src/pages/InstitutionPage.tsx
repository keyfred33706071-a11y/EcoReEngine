import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, Edit3, BookOpen } from 'lucide-react';
import { UserProfile, fetchAdminProjects, createAdminProject, updateAdminProject, deleteAdminProject, uploadImage, AdminProject } from '../lib/firestore';

interface InstitutionPageProps {
  profile: UserProfile;
  onBack: () => void;
}

export default function InstitutionPage({ profile, onBack }: InstitutionPageProps) {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({ title: '', description: '', materials: '' as string, tools: '' as string, steps: '' as string, tips: '' as string });

  async function loadProjects() {
    setLoading(true);
    try {
      const all = await fetchAdminProjects();
      setProjects(all.filter(p => p.created_by === profile.id));
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadProjects(); }, []);

  async function uploadImageSafe(file: File): Promise<string> {
    return uploadImage(file, `institution/${profile.id}/${Date.now()}`);
  }

  function resetForm() {
    setForm({ title: '', description: '', materials: '', tools: '', steps: '', tips: '' });
    setImageFile(null);
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(p: AdminProject) {
    setForm({
      title: p.title,
      description: p.description,
      materials: Array.isArray(p.materials) ? p.materials.map((m: any) => m.name).join('\n') : '',
      tools: Array.isArray(p.tools) ? p.tools.join('\n') : '',
      steps: Array.isArray(p.steps) ? p.steps.join('\n') : '',
      tips: Array.isArray(p.tips) ? p.tips.join('\n') : '',
    });
    setImagePreview(p.image_url ?? null);
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    setUploading(true);
    try {
      let image_url = imagePreview || '';
      if (imageFile) image_url = await uploadImageSafe(imageFile);

      const data: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        image_url,
        materials: form.materials.split('\n').filter(Boolean).map((l: string) => ({ name: l.trim(), source: '' })),
        tools: form.tools.split('\n').filter(Boolean).map((l: string) => l.trim()),
        steps: form.steps.split('\n').filter(Boolean).map((l: string) => l.trim()),
        tips: form.tips.split('\n').filter(Boolean).map((l: string) => l.trim()),
        created_by: profile.id,
        institution_name: profile.institution_name || profile.full_name || profile.username || 'Institución',
      };

      if (editingId) {
        await updateAdminProject(editingId, data);
      } else {
        await createAdminProject(data);
      }
      resetForm();
      await loadProjects();
    } catch {}
    setSaving(false);
    setUploading(false);
  }

  async function handleDelete(id: string) {
    try { await deleteAdminProject(id); await loadProjects(); } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Mis Proyectos</h2>
          <p className="text-xs text-slate-500">{profile.institution_name || profile.full_name || 'Institución'}</p>
        </div>
      </div>

      <button onClick={() => { resetForm(); setShowForm(!showForm); }}
        className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 flex items-center gap-1.5 w-fit transition-colors">
        <Plus className="w-3.5 h-3.5" /> {showForm ? 'Cerrar' : 'Nuevo Proyecto'}
      </button>

      {showForm && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400">{editingId ? 'Editar' : 'Crear'} Proyecto</h3>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="input w-full text-sm" placeholder="Título del proyecto" />

          <div>
            <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">Imagen</label>
            <input type="file" accept="image/*" onChange={e => {
              const file = e.target.files?.[0] || null;
              setImageFile(file);
              if (file) { const reader = new FileReader(); reader.onload = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); }
            }} className="block w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/20 file:text-emerald-400 file:cursor-pointer cursor-pointer" />
            {imagePreview && <img src={imagePreview} alt="" className="mt-2 w-full h-32 object-cover rounded-xl" />}
          </div>

          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="input w-full h-20 resize-none text-sm" placeholder="Descripción" />
          <textarea value={form.materials} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))}
            className="input w-full h-20 resize-none text-sm" placeholder="Materiales (uno por línea)" />
          <textarea value={form.tools} onChange={e => setForm(f => ({ ...f, tools: e.target.value }))}
            className="input w-full h-20 resize-none text-sm" placeholder="Herramientas (una por línea)" />
          <textarea value={form.steps} onChange={e => setForm(f => ({ ...f, steps: e.target.value }))}
            className="input w-full h-20 resize-none text-sm" placeholder="Pasos (uno por línea)" />
          <textarea value={form.tips} onChange={e => setForm(f => ({ ...f, tips: e.target.value }))}
            className="input w-full h-20 resize-none text-sm" placeholder="Consejos (uno por línea)" />

          <button onClick={handleSave} disabled={!form.title.trim() || !form.description.trim() || saving}
            className="text-xs font-bold text-white px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center gap-1.5 w-fit transition-colors">
            <Save className="w-3.5 h-3.5" /> {uploading ? 'Subiendo...' : saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400">Cargando...</p>
      ) : projects.length === 0 ? (
        <div className="card text-center py-8">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No has creado proyectos aún</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map(p => (
            <div key={p.id} className="card">
              {p.image_url && <img src={p.image_url} alt={p.title} className="w-full h-36 object-cover rounded-xl mb-3" />}
              <h3 className="text-sm font-bold text-slate-200">{p.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleEdit(p)} className="text-xs text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-lg bg-slate-800/50 flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Editar
                </button>
                <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/10 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
