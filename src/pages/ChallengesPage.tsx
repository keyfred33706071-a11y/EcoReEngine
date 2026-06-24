import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Check, X, Trophy } from 'lucide-react';
import { UserProfile, fetchProfile } from '../lib/firestore';
import { subscribeToChallenges, respondToChallenge, sendChallenge, Challenge } from '../lib/challenges';
import { showToast } from '../components/Toast';

interface Props { profile: UserProfile; onBack?: () => void; }

export default function ChallengesPage({ profile, onBack }: Props) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [friendId, setFriendId] = useState('');
  const [, setFriendName] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!profile.id) return;
    const unsub = subscribeToChallenges(profile.id, setChallenges);
    return unsub;
  }, [profile.id]);

  const handleSend = async () => {
    if (!friendId.trim() || !challengeDesc.trim()) { showToast('Completa todos los campos', 'error'); return; }
    setSending(true);
    try {
      const friend = await fetchProfile(friendId.trim());
      if (!friend) { showToast('Usuario no encontrado', 'error'); setSending(false); return; }
      await sendChallenge(profile.id, profile.full_name || 'Alguien', friendId.trim(), friend.full_name || 'Usuario', challengeDesc.trim());
      setFriendId(''); setFriendName(''); setChallengeDesc('');
    } catch { showToast('Error al enviar desafío', 'error'); }
    setSending(false);
  };

  const pending = challenges.filter(c => c.status === 'pending');
  const history = challenges.filter(c => c.status !== 'pending');

  return (
    <div className="space-y-4 animate-fade-in pb-10 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        {onBack && <button onClick={onBack} className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></button>}
        <h2 className="section-title">🤝 Desafíos</h2>
      </div>

      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Send className="w-4 h-4 text-emerald-400" /> Enviar desafío
        </h3>
        <input type="text" value={friendId} onChange={e => setFriendId(e.target.value)}
          className="input w-full text-sm" placeholder="ID del usuario (Firebase UID)" />
        <input type="text" value={challengeDesc} onChange={e => setChallengeDesc(e.target.value)}
          className="input w-full text-sm" placeholder="Ej: Reciclar 5 componentes este finde" />
        <button onClick={handleSend} disabled={sending}
          className="text-xs font-bold text-white px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 flex items-center gap-1.5 w-full sm:w-fit">
          {sending ? 'Enviando...' : <><Send className="w-3.5 h-3.5" /> Enviar desafío</>}
        </button>
      </div>

      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Desafíos pendientes ({pending.length})
          </h3>
          {pending.map(c => (
            <div key={c.id} className="card flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400"><Trophy className="w-4 h-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100">{c.fromName}</p>
                <p className="text-xs text-slate-400">{c.description}</p>
                <p className="text-[10px] text-slate-500 mt-1">+{c.xpReward} XP</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => c.id && respondToChallenge(c.id, 'accepted')}
                  className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"><Check className="w-4 h-4" /></button>
                <button onClick={() => c.id && respondToChallenge(c.id, 'declined')}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Historial</h3>
          {history.map(c => (
            <div key={c.id} className="card flex items-center gap-3 opacity-70">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${c.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : c.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{c.status}</span>
              <p className="text-xs text-slate-400 flex-1">{c.fromName} → {c.toName}: {c.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
