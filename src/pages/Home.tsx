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
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden">
      <div className="px-5 pt-5">
        <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">Dato de hoy</p>
        <div className="relative bg-gradient-to-br from-emerald-900/40 to-teal-900/30 rounded-2xl p-5 overflow-hidden border border-emerald-800/30">
          <div className="absolute -top-3 -right-3 text-emerald-700 opacity-20 text-6xl transform rotate-12">💡</div>
          <div className="absolute bottom-2 left-8 text-emerald-700 opacity-15 text-4xl">💡</div>
          <div className="absolute top-12 right-16 text-emerald-700 opacity-10 text-3xl">💡</div>
          <div className="relative z-10">
            {loadingTip ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-500">Cargando...</p>
              </div>
            ) : (
              <p className="text-sm text-slate-300 leading-relaxed font-light">{dailyTip}</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <button onClick={() => onNavigate?.('assistant')} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl py-4 px-5 flex items-center justify-between shadow-md shadow-emerald-900/40 hover:shadow-emerald-700/30 transition-all hover:scale-[1.02]">
          <span className="text-lg font-bold text-white tracking-tight">Pregúntale a EcoBot</span>
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M14.5 4h-5a7 7 0 000 14h5a7 7 0 000-14z"/>
            <circle cx="10" cy="10" r="3"/>
            <path d="M21 21l-4.35-4.35"/>
            <rect x="3" y="2" width="18" height="3" rx="1.5"/>
            <circle cx="17" cy="7" r="2"/>
            <path d="M14.5 4l2 2"/>
          </svg>
        </button>
      </div>

      <div className="px-5 mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => onNavigate?.('electronics-intro')} className="relative bg-cover bg-center rounded-2xl p-5 flex flex-col items-start justify-between min-h-[160px] shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/electronica.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 rounded-xl w-14 h-14 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
            <img src="/inicio/icon-electronica.png?v=2" alt="" className="w-12 h-12 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-sm font-bold text-white leading-snug drop-shadow-lg">Electrónica y Leyes Básicas</p>
        </button>
        <button onClick={() => onNavigate?.('dictionary')} className="relative bg-cover bg-center rounded-2xl p-5 flex flex-col items-start justify-between min-h-[160px] shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/componentes.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 rounded-xl w-14 h-14 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
            <img src="/inicio/icon-componentes.png?v=2" alt="" className="w-12 h-12 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-sm font-bold text-white leading-snug drop-shadow-lg">Componentes y Herramientas</p>
        </button>
        <button onClick={() => onNavigate?.('ewaste')} className="relative bg-cover bg-center rounded-2xl p-5 flex flex-col items-start justify-between min-h-[160px] shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/reciclaje.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 rounded-xl w-14 h-14 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
            <img src="/inicio/icon-reciclaje.png?v=2" alt="" className="w-12 h-12 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-sm font-bold text-white leading-snug drop-shadow-lg">Reciclaje de E-waste</p>
        </button>
        <button onClick={() => onNavigate?.('puzzle')} className="relative bg-cover bg-center rounded-2xl p-5 flex flex-col items-start justify-between min-h-[160px] shadow-lg hover:scale-[1.02] transition-all text-left overflow-hidden group" style={{ backgroundImage: `url('/inicio/mini-puzzle.jpeg')` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 rounded-xl w-14 h-14 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/10">
            <img src="/inicio/icon-juego.png?v=2" alt="" className="w-12 h-12 object-contain drop-shadow-lg" />
          </div>
          <p className="relative z-10 text-sm font-bold text-white leading-snug drop-shadow-lg">Juego</p>
        </button>

      </div>
    </div>
  );
}
