import { useState, useRef, useEffect } from 'react';
import { Send, Loader, X, ArrowRight } from 'lucide-react';
import { sendMessage } from '../lib/ai';
import { proyectosDisponibles } from '../lib/projects';
import { checkAndAwardAchievements } from '../lib/achievementChecker';
import { showAchievementPopup } from '../components/AchievementPopup';
import { fetchProfile, updateProfile } from '../lib/firestore';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
}

interface AsistenteProps {
  onNavigate?: (page: string) => void;
  userId?: string;
}

export default function Asistente({ onNavigate, userId }: AsistenteProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: '¡Hola! Soy EcoBot, tu asistente de electrónica y reciclaje. ¿En qué te ayudo?', sender: 'ai' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [projectMsgIds, setProjectMsgIds] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const autoQueryRef = useRef('');

  useEffect(() => {
    const q = sessionStorage.getItem('eco_search_query');
    if (q) {
      sessionStorage.removeItem('eco_search_query');
      setInput(q);
      autoQueryRef.current = q;
    }
  }, []);

  useEffect(() => {
    if (autoQueryRef.current && input === autoQueryRef.current && messages.length === 1) {
      const text = autoQueryRef.current;
      autoQueryRef.current = '';
      handleSend(text);
    }
  }, [input, messages.length]);

  async function handleSend(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { id: Date.now(), text: msg, sender: 'user' };
    const aiId = Date.now() + 1;
    setMessages(prev => [...prev, userMsg, { id: aiId, text: '', sender: 'ai' }]);
    setLoading(true);

    const projectKeywords = ['proyecto', 'proyectos', 'project', 'projects', 'hacer', 'construir', 'construye', 'arma', 'armar', 'crea', 'crear', 'fabrica', 'fabricar', 'qué puedo hacer', 'que puedo hacer', 'tutorial', 'guía', 'guia', 'manualidad', 'invento', 'bricolaje'];
    const isProjectQuery = projectKeywords.some(kw => msg.toLowerCase().includes(kw));

    let history: { role: 'system' | 'user' | 'assistant'; content: string }[] = [...messages, userMsg].map(m => ({ role: m.sender === 'user' ? 'user' as const : 'assistant' as const, content: m.text }));
    if (isProjectQuery) {
      history = [
        { role: 'system' as const, content: `Estos son los proyectos disponibles actualmente en EcoReEngine:\n\n${proyectosDisponibles}\n\nCuando el usuario pregunte qué proyecto hacer, recomiéndale uno según su nivel y lo que tenga disponible. Explica brevemente cada proyecto sugerido.${text ? '' : ' Al final de tu respuesta, di "proyecto: NOMBRE_DEL_PROYECTO" para que podamos mostrarle el botón de navegación al usuario.'}` },
        ...history,
      ];
    }

    abortRef.current = new AbortController();

    try {
      let accumulated = '';
      let lastUpdate = 0;
      await sendMessage(history, (chunk) => {
        accumulated += chunk;
        const now = Date.now();
        if (now - lastUpdate > 40) {
          lastUpdate = now;
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: accumulated } : m));
        }
      }, abortRef.current.signal);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: accumulated } : m));
      if (isProjectQuery) setProjectMsgIds(prev => new Set(prev).add(aiId));
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: `❌ Error: ${err.message}` } : m));
    } finally {
      setLoading(false);
      abortRef.current = null;
    }

    if (userId) {
      const prof = await fetchProfile(userId).catch(() => null);
      if (prof) {
        const chatCount = (prof as any).chat_count ?? 0;
        await updateProfile(userId, { chat_count: chatCount + 1 } as any).catch(() => {});
        checkAndAwardAchievements(userId, prof).then(e => e.forEach(showAchievementPopup)).catch(() => {});
      }
    }
  }

  function stopGeneration() {
    abortRef.current?.abort();
    setLoading(false);
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div className="absolute inset-0 flex flex-col">
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                msg.sender === 'user'
                  ? 'bg-emerald-600/20 border-emerald-500/30 text-emerald-100 rounded-br-none'
                  : 'bg-slate-800 border-slate-700/60 text-slate-200 rounded-bl-none'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text || (msg.sender === 'ai' ? <Loader className="w-4 h-4 animate-spin inline" /> : '')}</p>
                {msg.sender === 'ai' && msg.text && projectMsgIds.has(msg.id) && onNavigate && (
                  <button onClick={() => onNavigate('laboratory')} className="mt-2 w-full text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl py-2 px-3 transition-colors flex items-center justify-center gap-1.5">
                    Ver proyectos en Laboratorio <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-slate-800/80 px-3 py-2 bg-slate-950">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Pregunta sobre electrónica, circuitos, reciclaje..."
              className="input flex-1 py-2.5 text-sm"
              disabled={loading}
            />
            {loading ? (
              <button onClick={stopGeneration} className="btn-secondary flex items-center justify-center p-3 rounded-xl">
                <X className="w-5 h-5 text-red-400" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="btn-primary flex items-center justify-center p-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
