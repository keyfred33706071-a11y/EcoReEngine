import { useState, useEffect } from 'react';
import { fetchDailyContent, generateDailyContent } from '../lib/firestore';
import { LocalNotifications } from '@capacitor/local-notifications';


function getVenezuelaDate(): string {
  const now = new Date();
  const ve = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
  const hour = ve.getHours();
  // Si son antes de las 7:00 AM, usa el día anterior
  if (hour < 7) {
    ve.setDate(ve.getDate() - 1);
  }
  return ve.toISOString().split('T')[0];
}

interface HomeProps {
  onNavigate?: (page: string) => void;
  userId?: string;
}

export default function Home({ onNavigate }: HomeProps) {
  const [dailyTip, setDailyTip] = useState('');
  const [loadingTip, setLoadingTip] = useState(true);

  useEffect(() => {
    const today = getVenezuelaDate();
    const seenKey = `eco_daily_seen_${today}`;
    (async () => {
      try {
        const existing = await fetchDailyContent(today);
        if (existing) {
          setDailyTip(existing.content.slice(0, 150));
          setLoadingTip(false);
          return;
        }
        const content = await generateDailyContent(today);
        setDailyTip(content.slice(0, 150));
        setLoadingTip(false);
        if (!localStorage.getItem(seenKey)) {
          localStorage.setItem(seenKey, '1');
          try {
            await LocalNotifications.requestPermissions();
            await LocalNotifications.schedule({
              notifications: [{
                title: '♻️ Dato de hoy',
                body: content,
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 1000) },
              }],
            });
          } catch {}
        }
      } catch {
        setDailyTip('Hoy es un gran día para reciclar y crear. ¡Manos a la obra!');
        setLoadingTip(false);
      }
    })();
  }, []);
  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto relative overflow-hidden flex-1 min-h-[420px] lg:min-h-0 lg:flex-none">
      {/* Banner tipo notificación push */}
      <div className="shrink-0 flex items-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 overflow-hidden">
        <div className="relative shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          <span className="relative text-sm leading-none">💡</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 leading-none mb-1">
            Dato de hoy
          </p>
          {loadingTip ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] text-slate-400">Cargando...</span>
            </div>
          ) : (
            <p className="text-[11px] sm:text-xs text-emerald-100/90 leading-tight line-clamp-2">{dailyTip}</p>
          )}
        </div>
        <span className="shrink-0 text-[9px] font-semibold text-emerald-500/80">ahora</span>
      </div>

      {/* EcoBot compacto */}
      <button
        onClick={() => onNavigate?.('assistant')}
        className="shrink-0 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30 hover:shadow-emerald-700/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-white shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14.5 4h-5a7 7 0 000 14h5a7 7 0 000-14z"/>
          <circle cx="10" cy="10" r="3"/>
          <path d="M21 21l-4.35-4.35"/>
          <rect x="3" y="2" width="18" height="3" rx="1.5"/>
          <circle cx="17" cy="7" r="2"/>
          <path d="M14.5 4l2 2"/>
        </svg>
        <span className="text-sm font-bold text-white tracking-tight">Pregúntale a EcoBot</span>
      </button>

      {/* Grid 2x2 */}
      <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0 lg:flex-none">
        <button onClick={() => onNavigate?.('electronics-intro')} className="relative min-h-0 lg:min-h-[160px] bg-cover bg-center rounded-2xl p-3 flex flex-col items-start justify-between shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/electronica.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="relative z-10 rounded-lg w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 shrink-0">
            <img src="/inicio/icon-electronica.png?v=2" alt="" className="w-7 h-7 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-[11px] sm:text-xs font-bold text-white leading-tight drop-shadow-lg line-clamp-2">Electrónica y Leyes Básicas</p>
        </button>
        <button onClick={() => onNavigate?.('dictionary')} className="relative min-h-0 lg:min-h-[160px] bg-cover bg-center rounded-2xl p-3 flex flex-col items-start justify-between shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/componentes.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="relative z-10 rounded-lg w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 shrink-0">
            <img src="/inicio/icon-componentes.png?v=2" alt="" className="w-7 h-7 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-[11px] sm:text-xs font-bold text-white leading-tight drop-shadow-lg line-clamp-2">Componentes y Herramientas</p>
        </button>
        <button onClick={() => onNavigate?.('ewaste')} className="relative min-h-0 lg:min-h-[160px] bg-cover bg-center rounded-2xl p-3 flex flex-col items-start justify-between shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/reciclaje.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="relative z-10 rounded-lg w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 shrink-0">
            <img src="/inicio/icon-reciclaje.png?v=2" alt="" className="w-7 h-7 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-[11px] sm:text-xs font-bold text-white leading-tight drop-shadow-lg line-clamp-2">Reciclaje de E-waste</p>
        </button>
        <button onClick={() => onNavigate?.('puzzle')} className="relative min-h-0 lg:min-h-[160px] bg-cover bg-center rounded-2xl p-3 flex flex-col items-start justify-between shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/mini-puzzle.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
          <div className="relative z-10 rounded-lg w-9 h-9 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10 shrink-0">
            <img src="/inicio/icon-juego.png?v=2" alt="" className="w-7 h-7 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-[11px] sm:text-xs font-bold text-white leading-tight drop-shadow-lg line-clamp-2">Juego</p>
        </button>
      </div>
    </div>
  );
}
