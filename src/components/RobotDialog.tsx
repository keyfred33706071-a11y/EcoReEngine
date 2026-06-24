import { useState, useEffect, useRef } from 'react';
import { X, Home as HomeIcon, LayoutDashboard, Cpu, Users, User } from 'lucide-react';

interface Step {
  title: string;
  text: string;
  emoji?: string;
  navIndex?: number;
}

interface RobotDialogProps {
  steps: Step[];
  onComplete: () => void;
  onSkip?: () => void;
  title?: string;
  audioPrefix?: string;
}

const NAV_ITEMS = [
  { icon: HomeIcon, label: 'Inicio' },
  { icon: LayoutDashboard, label: 'Proyectos' },
  { icon: Cpu, label: 'Herramientas' },
  { icon: Users, label: 'Comunidad' },
  { icon: User, label: 'Perfil' },
];

const ROBOT_IMAGES: Record<string, string> = {
  '👋': '/robot/saludar.png',
  '💡': '/robot/explicar.png',
  '🎉': '/robot/celebrar.png',
  '🤔': '/robot/pensar.png',
  '🎮': '/robot/jugar.png',
  '🔧': '/robot/construir.png',
  '♻️': '/robot/reciclar.png',
  '🏆': '/robot/logro.png',
  '⭐': '/robot/logro.png',
  '🌱': '/robot/naturaleza.png',
  '🌍': '/robot/naturaleza.png',
  '😢': '/robot/triste.png',
  '⚡': '/robot/emocionado.png',
  '🎯': '/robot/enfoque.png',
  '❤️': '/robot/celebrar.png',
};

export default function RobotDialog({ steps, onComplete, onSkip, title, audioPrefix = '' }: RobotDialogProps) {
  const [step, setStep] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isLast = step >= steps.length - 1;

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const delay = step === 0 ? 2000 : 400;
    const timer = setTimeout(() => {
      fetch(`/robot/${audioPrefix}${step + 1}.mp3`)
        .then(r => r.blob())
        .then(blob => { el.src = URL.createObjectURL(blob); el.currentTime = 0; el.play(); })
        .catch(e => console.warn('audio err', e));
    }, delay);
    return () => { clearTimeout(timer); if (el) el.pause(); };
  }, [step]);

  const handleTap = () => {
    if (audioRef.current) audioRef.current.pause();
    if (isLast) return onComplete();
    setStep(s => s + 1);
  };

  const handleSkip = () => { if (audioRef.current) audioRef.current.pause(); onSkip?.(); };

  const current = steps[step];
  if (!current) return null;

  const imgSrc = ROBOT_IMAGES[current.emoji || ''] || '/robot/saludar.png';
  const navIdx = current.navIndex;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/70" onClick={handleTap}>
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-end px-5 pt-5">
        {title && <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider mr-auto">{title}</span>}
        {onSkip && (
          <button onClick={e => { e.stopPropagation(); handleSkip(); }} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Robot + texto */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-2" onClick={e => e.stopPropagation()}>
        <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl overflow-hidden">
          <img src={imgSrc} alt="" className="w-full h-full object-contain p-2" />
        </div>
        <div className="mt-5 w-full max-w-sm bg-slate-900/95 border border-slate-700/60 rounded-2xl p-5 shadow-xl" onClick={e => e.stopPropagation()}>
          <h3 className="text-base font-bold text-slate-100 mb-1.5">{current.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{current.text}</p>
        </div>
      </div>

      {/* Nav indicator + toque para continuar */}
      <div className="relative z-10 px-4 pb-8">
        {navIdx !== undefined && (
          <div className="flex items-center justify-center gap-1 mb-4">
            {NAV_ITEMS.map((item, i) => {
              const Icon = item.icon;
              const isActive = i === navIdx;
              return (
                <div key={i} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-500 ${
                  isActive ? 'bg-emerald-500/20 scale-110' : 'opacity-20'
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className={`text-[9px] font-semibold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        )}
        <p className="text-center text-[11px] text-slate-500">Toca la pantalla para continuar</p>
      </div>
      <audio ref={audioRef} preload="auto" />
    </div>
  );
}
