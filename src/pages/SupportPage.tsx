import { useState, useEffect } from 'react';
import { ArrowLeft, LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { UserProfile, createSupportTicket, fetchUserSupportTickets, fetchSupportTicketReplies, addSupportTicketReply, SupportTicket, SupportTicketReply } from '../lib/firestore';
import { showToast } from '../components/Toast';
import { auth } from '../lib/firebase';

interface SupportPageProps {
  profile: UserProfile;
  onBack: () => void;
}

const categories = [
  { value: 'bug', label: 'Error / Bug' },
  { value: 'suggestion', label: 'Sugerencia' },
  { value: 'account', label: 'Cuenta / Login' },
  { value: 'scanner', label: 'Scanner / IA' },
  { value: 'other', label: 'Otro' },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Abierto', color: 'text-blue-400 bg-blue-500/10', icon: AlertCircle },
  in_progress: { label: 'En proceso', color: 'text-amber-400 bg-amber-500/10', icon: Clock },
  resolved: { label: 'Resuelto', color: 'text-emerald-400 bg-emerald-500/10', icon: CheckCircle },
  closed: { label: 'Cerrado', color: 'text-slate-400 bg-slate-500/10', icon: CheckCircle },
};

export default function SupportPage({ profile, onBack }: SupportPageProps) {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [replyMsg, setReplyMsg] = useState('');
  const [sending, setSending] = useState(false);

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('bug');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const data = await fetchUserSupportTickets(profile.id);
      setTickets(data);
    } catch {}
    setLoading(false);
  }

  async function handleCreate() {
    if (!subject.trim() || !message.trim()) {
      showToast('Completa todos los campos', 'error');
      return;
    }
    setCreating(true);
    try {
      const id = await createSupportTicket({
        user_id: profile.id || auth?.currentUser?.uid || 'anon',
        user_name: profile.full_name || profile.username || auth?.currentUser?.displayName || 'Usuario',
        user_email: (profile as any).email || auth?.currentUser?.email,
        subject: subject.trim(),
        message: message.trim(),
        category,
      });
      console.log('ticket created', id);
      showToast('Ticket creado correctamente', 'success');
      setSubject('');
      setMessage('');
      setCategory('bug');
      setView('list');
      loadTickets();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || 'Error al crear ticket', 'error');
    }
    setCreating(false);
  }

  async function openTicket(ticket: SupportTicket) {
    setSelectedTicket(ticket);
    setView('detail');
    try {
      const r = await fetchSupportTicketReplies(ticket.id);
      setReplies(r);
    } catch {}
  }

  async function sendReply() {
    if (!replyMsg.trim() || !selectedTicket) return;
    setSending(true);
    try {
      await addSupportTicketReply(selectedTicket.id, {
        user_id: profile.id,
        user_name: profile.full_name || profile.username || 'Usuario',
        message: replyMsg.trim(),
        is_admin: false,
      });
      setReplyMsg('');
      const r = await fetchSupportTicketReplies(selectedTicket.id);
      setReplies(r);
      loadTickets();
      showToast('Respuesta enviada', 'success');
    } catch {
      showToast('Error al enviar', 'error');
    }
    setSending(false);
  }

  if (view === 'create') {
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a mis tickets
        </button>
        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-cyan-400" />
            Nuevo Ticket de Soporte
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Asunto</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="input w-full" placeholder="Describe brevemente el problema" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input w-full">
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Descripción</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input w-full h-32 resize-none" placeholder="Explica el problema con el mayor detalle posible..." />
          </div>
          <button onClick={handleCreate} disabled={creating} className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
            {creating ? 'Enviando...' : <><Send className="w-4 h-4" /> Enviar Ticket</>}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedTicket) {
    const st = statusConfig[selectedTicket.status] || statusConfig.open;
    const Icon = st.icon;
    return (
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <button onClick={() => { setView('list'); setReplies([]); }} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a mis tickets
        </button>
        <div className="card space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-100">{selectedTicket.subject}</h2>
              <p className="text-xs text-slate-500 mt-1">{new Date(selectedTicket.created_at).toLocaleString('es-ES')}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${st.color}`}>
              <Icon className="w-3.5 h-3.5" /> {st.label}
            </span>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
          {selectedTicket.admin_reply && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-400 mb-1">Respuesta del equipo</p>
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
            </div>
          )}
        </div>
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Conversación</h3>
          {replies.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Sin respuestas aún</p>
          ) : (
            <div className="space-y-2">
              {replies.map(r => (
                <div key={r.id} className={`p-3 rounded-xl ${r.is_admin ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-300">{r.is_admin ? 'Equipo EcoReEngine' : r.user_name}</p>
                    <p className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleString('es-ES')}</p>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>
          )}
          {selectedTicket.status !== 'closed' && (
            <div className="flex gap-2 pt-2">
              <input value={replyMsg} onChange={(e) => setReplyMsg(e.target.value)} className="input flex-1" placeholder="Escribe tu respuesta..." onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()} />
              <button onClick={sendReply} disabled={sending || !replyMsg.trim()} className="btn-primary px-4"><Send className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Configuración
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-cyan-400" />
            Soporte
          </h2>
          <p className="text-sm text-slate-400 mt-1">Gestiona tus tickets de soporte</p>
        </div>
        <button onClick={() => setView('create')} className="btn-primary flex items-center gap-2 px-4 py-2">
          <Plus className="w-4 h-4" /> Nuevo Ticket
        </button>
      </div>
      <div className="space-y-2">
        {loading ? (
          <p className="text-center text-slate-500 py-8">Cargando...</p>
        ) : tickets.length === 0 ? (
          <div className="card text-center py-8">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">No tienes tickets aún</p>
            <button onClick={() => setView('create')} className="text-cyan-400 text-sm mt-2 hover:underline">Abrir tu primer ticket</button>
          </div>
        ) : (
          tickets.map(ticket => {
            const st = statusConfig[ticket.status] || statusConfig.open;
            const Icon = st.icon;
            return (
              <button key={ticket.id} onClick={() => openTicket(ticket)} className="card w-full text-left hover:bg-slate-800/50 transition-colors flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-100 truncate">{ticket.subject}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{new Date(ticket.created_at).toLocaleDateString('es-ES')} · {categories.find(c => c.value === ticket.category)?.label}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${st.color}`}>
                  <Icon className="w-3 h-3" /> {st.label}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
