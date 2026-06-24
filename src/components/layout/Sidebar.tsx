import { Cpu, LayoutDashboard, BookOpen, Package, Wrench, Users, Trophy, Settings, LogOut, Leaf, ChevronRight, Gamepad2, Calculator, Lightbulb, Home as HomeIcon } from 'lucide-react';
import { UserProfile, xpToLevel } from '../../lib/firestore';
import VerifiedBadge from '../VerifiedBadge';

type Page = 'dashboard' | 'learn' | 'inventory' | 'projects' | 'community' | 'achievements' | 'puzzle' | 'settings' | 'calculator' | 'dictionary' | 'assistant' | 'tools' | 'laboratory' | 'project-detail' | 'home' | 'ewaste' | 'electronics-intro';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  profile: UserProfile | null;
  onSignOut: () => void;
}

const navItems: { icon: React.ElementType; label: string; page: Page; badge?: string }[] = [
  { icon: HomeIcon, label: 'Inicio', page: 'home' },
  { icon: Lightbulb, label: 'Laboratorio', page: 'laboratory', badge: 'PROY' },
  { icon: Cpu, label: 'Herramientas', page: 'tools' },
  { icon: BookOpen, label: 'Aprender', page: 'learn' },
  { icon: Package, label: 'Inventario', page: 'inventory' },
  { icon: Wrench, label: 'Proyectos', page: 'projects' },
  { icon: Users, label: 'Comunidad', page: 'community' },
  { icon: Gamepad2, label: 'CircuitPuzzle', page: 'puzzle', badge: 'JUEGO' },
  { icon: Trophy, label: 'Logros', page: 'achievements' },
  { icon: Calculator, label: 'Calculadora', page: 'calculator' },
  { icon: BookOpen, label: 'Diccionario', page: 'dictionary' },
  { icon: LayoutDashboard, label: 'Perfil y progreso', page: 'dashboard' },
];

export default function Sidebar({ currentPage, onNavigate, profile, onSignOut }: SidebarProps) {
  const levelInfo = profile ? xpToLevel(profile.total_xp) : null;

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-slate-900/95 border-r border-slate-800 px-4 py-6 fixed left-0 top-0 bottom-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8 cursor-pointer" onClick={() => onNavigate('dashboard')}>
        <img src="/logo/logo.jpeg?v=6" alt="EcoReEngine" className="w-10 h-10 rounded-xl object-contain shadow-lg" />
        <div>
          <p className="font-bold text-slate-100 leading-none">EcoReEngine</p>
          <p className="text-xs text-emerald-400 mt-0.5">Aprende. Recicla. Crea.</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ icon: Icon, label, page, badge }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={currentPage === page ? 'nav-item-active w-full text-left' : 'nav-item w-full text-left'}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && currentPage !== page && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                {badge}
              </span>
            )}
            {currentPage === page && <ChevronRight className="w-4 h-4 opacity-60" />}
          </button>
        ))}
      </nav>

      {/* User profile card */}
      {profile && (
        <div className="mt-4">
          <div className="glass rounded-2xl p-4 mb-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-white text-sm">
                {(profile.full_name || profile.username || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {profile.full_name || profile.username || 'Inventor'}{profile.verified && <VerifiedBadge />}
                </p>
                <div className="flex items-center gap-1">
                  <Leaf className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-medium">Nivel {levelInfo?.level}</span>
                </div>
              </div>
            </div>
            {levelInfo && (
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{levelInfo.currentXp} XP</span>
                  <span>{levelInfo.nextXp} XP</span>
                </div>
                <div className="xp-bar">
                  <div className="xp-fill" style={{ width: `${levelInfo.progress * 100}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('settings')}
              className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Config
            </button>
            <button
              onClick={onSignOut}
              className="flex-1 flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-red-400 py-2 rounded-xl hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
