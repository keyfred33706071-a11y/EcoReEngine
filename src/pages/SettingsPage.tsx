import React, { useState } from 'react';
import { Settings, Bell, ShieldAlert, ShieldCheck, Building2, Check } from 'lucide-react';
import { UserProfile, verifyUser, setUserRole } from '../lib/firestore';
import { showToast } from '../components/Toast';


interface SettingsPageProps {
  profile: UserProfile;
  onProfileUpdate: () => void;
  onSignOut: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onNavigate?: (page: string) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ profile, onProfileUpdate, onSignOut, isDark, onToggleTheme, onNavigate }) => {
  const [activating, setActivating] = useState(false);

  const isAdmin = profile.role === 'admin' || profile.role === 'owner';

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h2 className="section-title flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-400" />
          Configuración de la App
        </h2>
        <p className="section-subtitle mt-1">
          Personaliza tu perfil, gestiona las preferencias y configura el comportamiento de la aplicación.
        </p>
      </div>

      <div className="card space-y-6">
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Preferencias de la App
          </h3>

          <label className="flex items-center gap-3 cursor-pointer group py-2">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${isDark ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
              {isDark && <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <div>
              <p className="text-sm text-slate-200 font-medium">Tema Oscuro</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Alternar entre modo claro y oscuro.</p>
            </div>
            <input type="checkbox" checked={isDark} onChange={onToggleTheme} className="sr-only" />
          </label>

        </div>

      </div>

      {/* Admin access button */}
      {isAdmin && (
        <div className="card border-blue-500/20 bg-blue-500/5 space-y-4">
          <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Administrador
          </h3>
          <p className="text-xs text-slate-400">Accede al panel de administración para gestionar la plataforma.</p>
          <button onClick={() => onNavigate?.('admin')}
            className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Ir al Panel de Admin
          </button>
        </div>
      )}

      {/* Institution access */}
      {profile.role === 'institution' && (
        <div className="card border-emerald-500/20 bg-emerald-500/5 space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Mis Proyectos
          </h3>
          <p className="text-xs text-slate-400">Gestiona los proyectos institucionales, agrega cupos y administra participantes.</p>
          <button onClick={() => onNavigate?.('institution')}
            className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4" />
            Gestionar Proyectos
          </button>
        </div>
      )}

      {/* Auto-verify */}
      {(!profile.role || profile.role === 'user') && (
        <div className="card border-emerald-500/20 bg-emerald-500/5 space-y-4">
          <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Activación</h3>
          <button onClick={async () => {
            setActivating(true);
            try {
              await verifyUser(profile.id);
              await setUserRole(profile.id, 'owner');
              await onProfileUpdate();
              showToast('✅ ¡Verificado y Owner activado!', 'success');
            } catch { showToast('❌ Error al activar', 'error'); }
            finally { setActivating(false); }
          }} disabled={activating}
            className="btn-primary w-full py-2.5 text-sm font-bold disabled:opacity-50">
            {activating ? 'Activando...' : 'Activar Verificado + Admin'}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card border-red-500/20 bg-red-500/5 space-y-4">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Zona de Peligro
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Acciones destructivas que afectan permanentemente tu cuenta y datos.
        </p>
        <button className="btn-secondary border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs py-2 px-4 rounded-xl font-semibold">
          Restablecer Progreso
        </button>
        <div className="pt-2 border-t border-red-500/10">
          <button onClick={onSignOut} className="btn-secondary border-red-500/30 hover:bg-red-500/10 text-red-400 text-xs py-2 px-4 rounded-xl font-semibold w-full flex items-center justify-center gap-2">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
