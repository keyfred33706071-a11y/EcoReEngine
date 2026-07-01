import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { fetchProfile, createProfile, UserProfile, fetchAppConfig, AppConfig, fetchAppUpdate, AppUpdate, AdminProject } from './lib/firestore';
import { checkAndAwardAchievements } from './lib/achievementChecker';
import { initGlobalErrorHandler } from './lib/errorLogger';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';

const Home = lazy(() => import('./pages/Home'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const ToolsHub = lazy(() => import('./pages/ToolsHub'));
const ScannerPage = lazy(() => import('./pages/ScannerPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PublicProfilePage = lazy(() => import('./pages/PublicProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const PuzzlePage = lazy(() => import('./pages/PuzzlePage'));
const Diccionario = lazy(() => import('./pages/Diccionario'));
const Calculadora = lazy(() => import('./pages/Calculadora'));
const EwastePage = lazy(() => import('./pages/EwastePage'));
const ElectronicaIntro = lazy(() => import('./pages/ElectronicaIntro'));
const Laboratorio = lazy(() => import('./pages/Laboratorio'));
const ProyectoDetalle = lazy(() => import('./pages/ProyectoDetalle'));
const Asistente = lazy(() => import('./pages/Asistente'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const InstitutionPage = lazy(() => import('./pages/InstitutionPage'));
const FormulasPage = lazy(() => import('./pages/FormulasPage'));
const RecyclingMapPage = lazy(() => import('./pages/RecyclingMapPage'));

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Toast from './components/Toast';
import AchievementPopup, { showAchievementPopup } from './components/AchievementPopup';
import { isNewerVersion } from './lib/version';
import { LayoutDashboard, Cpu, User, X, Bot, Home as HomeIcon, Users, Download } from 'lucide-react';
import RobotDialog from './components/RobotDialog';

const APP_VERSION = '1.1.1';

type Page = 'dashboard' | 'learn' | 'inventory' | 'projects' | 'community' | 'achievements' | 'puzzle' | 'settings' | 'admin' | 'calculator' | 'dictionary' | 'assistant' | 'tools' | 'scanner' | 'laboratory' | 'project-detail' | 'home' | 'ewaste' | 'electronics-intro' | 'leaderboard-xp' | 'leaderboard-game' | 'institution' | 'formulas' | 'public-profile' | 'recycling-map';

type SelectedProject = { type: 'static'; id: number } | { type: 'admin'; id: string; data: AdminProject };

const defaultProfile: UserProfile = {
  id: '', username: '', full_name: '', bio: '', avatar_url: '',
  level: 1, total_xp: 0, components_salvaged: 0, co2_saved_kg: 0,
  tutorials_completed: 0, projects_completed: 0, high_score: 0, games_played: 0, streak_days: 0,
  last_active_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const bottomNavItems: { icon: React.ElementType; label: string; page: Page }[] = [
  { icon: HomeIcon, label: 'Inicio', page: 'home' },
  { icon: LayoutDashboard, label: 'Proyectos', page: 'laboratory' },
  { icon: Cpu, label: 'Herramientas', page: 'tools' },
  { icon: Users, label: 'Comunidad', page: 'community' },
  { icon: User, label: 'Perfil', page: 'dashboard' },
];

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [page, setPage] = useState<Page>('home');
  const [selectedProject, setSelectedProject] = useState<SelectedProject | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== 'dark') document.body.classList.add('theme-light');
    return saved === 'dark';
  });
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [appUpdate, setAppUpdate] = useState<AppUpdate | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [labScrollY, setLabScrollY] = useState(0);

  useEffect(() => {
    const vv = (window as any).visualViewport;
    if (!vv) return;
    const handler = () => {
      const diff = window.innerHeight - vv.height;
      setKeyboardHeight(diff > 0 ? diff : 0);
    };
    vv.addEventListener('resize', handler);
    return () => vv.removeEventListener('resize', handler);
  }, []);

  const onboardingSteps = [
    { title: '¡Bienvenido a EcoReEngine!', text: 'Soy ReBot, tu asistente ecológico 🤖♻️\nTe guiaré por la app para que aprendas a reciclar electrónicos y cuides el planeta.', emoji: '👋' },
    { title: 'Inicio', text: 'Aquí verás tu dosis diaria de conciencia ecológica, accesos rápidos y tu progreso general. Es tu centro de comando.', emoji: '🌱', navIndex: 0 },
    { title: 'Proyectos', text: 'Crea proyectos paso a paso con componentes reciclados. Sigue guías prácticas para convertir residuos electrónicos en nuevos inventos.', emoji: '🔧', navIndex: 1 },
    { title: 'Herramientas', text: 'Calculadora de resistencia, diccionario de componentes, escáner de residuos y el asistente EcoBot para resolver tus dudas.', emoji: '⚡', navIndex: 2 },
    { title: 'Comunidad', text: 'Comparte tus proyectos, da like a otros ecoingenieros y aprende de la comunidad porque Todos remamos por un planeta más verde.', emoji: '🌍', navIndex: 3 },
    { title: 'Perfil', text: 'Revisa tus estadísticas, logros, nivel y configuración. Cada proyecto completado suma XP y subes de nivel 🏆', emoji: '🏆', navIndex: 4 },
    { title: '¡Listo!', text: 'Ya conoces lo básico. Explora cada sección, completa proyectos y diviértete aprendiendo. El planeta te lo agradecerá 💚', emoji: '🎉' },
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCheckingAuth(false);
      if (user) {
        setAuthed(true);
        loadProfile(user.uid);
        fetchAppConfig().then(setAppConfig);
        fetchAppUpdate().then(setAppUpdate);
        if (!localStorage.getItem('eco_onboarding_done')) {
          setShowOnboarding(true);
        }
      }
    });
    return unsub;
  }, []);

  const pendingUsernameRef = useRef<string | null>(null);

  async function loadProfile(userId: string) {
    if (!userId) return;
    const cached = localStorage.getItem('ecore_profile_' + userId);
    if (cached) {
      try { setProfile(JSON.parse(cached)); } catch {}
    }
    const data = await fetchProfile(userId);
    if (data) {
      const lsHigh = Number(localStorage.getItem(`eco_sort_high_${userId}`)) || 0;
      const lsGames = Number(localStorage.getItem(`eco_sort_games_${userId}`)) || 0;
      data.high_score = Math.max(data.high_score ?? 0, lsHigh);
      data.games_played = Math.max(data.games_played ?? 0, lsGames);

      const today = new Date().toISOString().slice(0, 10);
      const lastActive = data.last_active_date?.slice(0, 10);
      if (lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().slice(0, 10);
        if (lastActive === yStr) {
          data.streak_days = (data.streak_days ?? 0) + 1;
          await updateDoc(doc(db, 'users', userId), { streak_days: data.streak_days, last_active_date: today }).catch(() => {});
        } else if (lastActive !== today) {
          data.streak_days = 1;
          await updateDoc(doc(db, 'users', userId), { streak_days: 1, last_active_date: today }).catch(() => {});
        }
      } else {
        data.streak_days = 1;
        await updateDoc(doc(db, 'users', userId), { streak_days: 1, last_active_date: today }).catch(() => {});
      }

      setProfile(data);
      localStorage.setItem('ecore_profile_' + userId, JSON.stringify(data));
      checkAndAwardAchievements(userId, data).then(e => e.forEach(showAchievementPopup)).catch(() => {});
    } else {
      const lsHigh = Number(localStorage.getItem(`eco_sort_high_${userId}`)) || 0;
      const lsGames = Number(localStorage.getItem(`eco_sort_games_${userId}`)) || 0;
      const pending = (window as any).__ECO_PENDING_USERNAME;
      const userName = pending || pendingUsernameRef.current || userId.slice(0, 8);
      const newProfile: UserProfile = {
        ...defaultProfile, id: userId, full_name: userName,
        high_score: lsHigh, games_played: lsGames,
      };
      try {
        await createProfile(userId, { full_name: userName });
      } catch {
        try {
          await setDoc(doc(db, 'users', userId), {
            id: userId, total_xp: 0, level: 1, full_name: userName,
            created_at: new Date().toISOString(),
            last_active_date: new Date().toISOString(),
          });
        } catch (e2: any) { console.error('createProfile minimal fallback error:', e2?.code || e2); }
      }
      if ((window as any).__ECO_PENDING_USERNAME) delete (window as any).__ECO_PENDING_USERNAME;
      pendingUsernameRef.current = null;
      setProfile(newProfile);
      localStorage.setItem('ecore_profile_' + userId, JSON.stringify(newProfile));
    }
  }

  async function onAuthSuccess(userId: string, pendingUsername?: string) {
    if (pendingUsername) {
      pendingUsernameRef.current = pendingUsername;
      localStorage.removeItem('eco_onboarding_done');
      setShowOnboarding(true);
    } else if (!localStorage.getItem('eco_onboarding_done')) {
      setShowOnboarding(true);
    }
    setAuthed(true);
    setPage('home');
    loadProfile(userId);
  }

  function completeOnboarding() {
    localStorage.setItem('eco_onboarding_done', '1');
    setShowOnboarding(false);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    initGlobalErrorHandler();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'k' || e.key === 'K') {
        localStorage.removeItem('eco_onboarding_done');
        setShowOnboarding(true);
      }
      if (e.key === 'u' || e.key === 'U') {
        showAchievementPopup({ id: 'test', name: 'Maestro Reciclador', description: 'Completa 100 proyectos de reciclaje electrónico.', icon: '/logro/Maestro_del_Reciclaje-removebg-preview.png', xp_reward: 500 });
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  async function refreshProfile() {
    if (profile.id) loadProfile(profile.id);
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!authed) return <Suspense fallback={<div className="min-h-screen bg-slate-950" />}><AuthPage onAuthSuccess={onAuthSuccess} /></Suspense>;

  function navigate(p: string, userId?: string) {
    const target = p as Page;
    if (userId) setSelectedUserId(userId);
    if (target === page) {
      setResetKey(prev => prev + 1);
      window.scrollTo(0, 0);
      return;
    }
    setTransitioning(true);
    setTimeout(() => {
      setPage(target);
      window.scrollTo(0, 0);
    }, 150);
    setTimeout(() => setTransitioning(false), 300);
  }

  async function handleSignOut() {
    await firebaseSignOut(auth);
    const cachedKey = Object.keys(localStorage).find(k => k.startsWith('ecore_profile_'));
    if (cachedKey) localStorage.removeItem(cachedKey);
    setProfile(defaultProfile);
    setAuthed(false);
  }

  function toggleTheme() {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.body.classList.toggle('theme-light', !next);
      return next;
    });
  }

  const renderPage = () => {
    switch (page) {
      case 'home': return <Home onNavigate={navigate} userId={profile.id} />;
      case 'ewaste': return <EwastePage onNavigate={navigate} />;
      case 'electronics-intro': return <ElectronicaIntro onNavigate={navigate} />;
      case 'dashboard': return <Dashboard profile={profile} onNavigate={navigate} />;
      case 'learn': return <LearnPage userId={profile.id} onXpGained={refreshProfile} onBack={() => setPage('home')} />;
      case 'inventory': return <InventoryPage userId={profile.id} onXpGained={refreshProfile} />;
      case 'projects': return <ProjectsPage userId={profile.id} onXpGained={refreshProfile} />;
      case 'community': return <CommunityPage userId={profile.id} profile={profile} onBack={() => setPage('home')} onNavigate={navigate} />;
      case 'achievements': return <AchievementsPage userId={profile.id} profile={profile} />;
      case 'puzzle': return <PuzzlePage userId={profile.id} onXpGained={refreshProfile} onNavigate={navigate} />;
      case 'calculator': return <Calculadora onBack={() => setPage('tools')} />;
      case 'dictionary': return <Diccionario onBack={() => setPage('tools')} userId={profile.id} />;
      case 'assistant': return null;
      case 'tools': return <ToolsHub onSelectTool={(toolPage) => navigate(toolPage)} onBack={() => navigate('home')} />;
      case 'laboratory': return <Laboratorio onSelectProject={(p) => { setSelectedProject(p); setPage('project-detail'); }} userId={profile.id} savedScrollY={labScrollY} onSaveScroll={setLabScrollY} />;
      case 'project-detail': return selectedProject ? <ProyectoDetalle project={selectedProject} onBack={() => setPage('laboratory')} userId={profile.id} /> : null;
      case 'settings': return <SettingsPage profile={profile} onProfileUpdate={refreshProfile} onSignOut={handleSignOut} isDark={isDark} onToggleTheme={toggleTheme} onNavigate={navigate} />;
      case 'admin': return <AdminPage profile={profile} onProfileUpdate={refreshProfile} onBack={() => setPage('settings')} />;
      case 'leaderboard-xp': return <LeaderboardPage profile={profile} type="xp" onBack={() => setPage('dashboard')} />;
      case 'leaderboard-game': return <LeaderboardPage profile={profile} type="game" onBack={() => setPage('dashboard')} />;
      case 'institution': return <InstitutionPage profile={profile} onBack={() => setPage('settings')} />;
      case 'formulas': return <FormulasPage onBack={() => setPage('tools')} />;
      case 'scanner': return <ScannerPage onBack={() => setPage('tools')} />;
      case 'recycling-map': return <RecyclingMapPage onBack={() => setPage('home')} />;
      case 'public-profile': return selectedUserId ? <PublicProfilePage userId={selectedUserId} onBack={() => setPage('community')} /> : null;
      default: return <Home userId={profile.id} />;
    }
  };

   return (
     <div key={resetKey} className={`${isDark ? 'dark' : 'light'} min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col`}>
       <Sidebar currentPage={page} onNavigate={navigate} profile={profile} onSignOut={handleSignOut} />
       <div className="lg:ml-64 min-h-screen flex flex-col pt-14 sm:pt-16">
        <Header currentPage={page} onNavigate={navigate} profile={profile} />
        {appConfig?.announcement_enabled && appConfig.announcement && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 lg:px-8 py-2.5 text-center">
            <div className="flex items-center justify-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-emerald-400"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                EcoReEngine
              </span>
            </div>
            <p className="text-xs text-emerald-300 font-medium">{appConfig.announcement}</p>
          </div>
        )}
        {(() => {
          if (!appUpdate) return null;
          const newer = isNewerVersion(appUpdate.version, APP_VERSION);
          if (!newer) return null;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
              <div className={`mx-4 w-full max-w-sm rounded-2xl p-6 shadow-2xl border ${appUpdate.force_update ? 'border-red-500/30 bg-red-950/90' : 'border-slate-700/50 bg-slate-900/95'}`}>
                <div className="flex flex-col items-center text-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${appUpdate.force_update ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                    <Download className={`w-6 h-6 ${appUpdate.force_update ? 'text-red-400' : 'text-emerald-400'}`} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nueva versión disponible</p>
                  <p className="text-lg font-bold text-slate-100">v{appUpdate.version} <span className="text-[11px] font-normal text-slate-500">(tienes v{APP_VERSION})</span></p>
                  {appUpdate.changelog && (
                    <div className="w-full bg-slate-800/50 rounded-xl p-3 text-left">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Cambios</p>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap">{appUpdate.changelog}</p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 w-full mt-1">
                    <button onClick={async () => {
                      if (Capacitor.isNativePlatform()) {
                        try {
                          const resp = await fetch(appUpdate.apk_url);
                          const blob = await resp.blob();
                          const base64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(blob);
                          });
                          const clean = base64.split(',')[1];
                          const fileName = `EcoReEngine-v${appUpdate.version}.apk`;
                          await Filesystem.writeFile({ path: fileName, data: clean, directory: Directory.Cache });
                          const uri = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
                          await Share.share({ url: uri.uri, title: fileName });
                        } catch { Browser.open({ url: appUpdate.apk_url, windowName: '_system' }); }
                      } else {
                        window.open(appUpdate.apk_url, '_blank');
                      }
                    }}
                      className="w-full text-xs font-bold text-white px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center gap-1.5 transition-colors">
                      <Download className="w-4 h-4" /> Descargar e Instalar
                    </button>
                    {!appUpdate.force_update && (
                      <button onClick={() => setAppUpdate(null)}
                        className="w-full text-xs text-slate-400 hover:text-slate-200 px-4 py-2 rounded-xl border border-slate-600/40 hover:border-slate-500/40 transition-colors">
                        Ignorar esta versión
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {page !== 'assistant' && (
          <main className="flex-1 px-4 lg:px-8 py-4 lg:py-6 pb-36 lg:pb-6 max-w-7xl w-full mx-auto">
            <Suspense fallback={<div className="flex items-center justify-center h-40"><p className="text-slate-400 text-sm">Cargando...</p></div>}>
              <div className={`transition-all duration-300 ease-out ${transitioning ? 'opacity-0 translate-y-2 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
                {renderPage()}
              </div>
            </Suspense>
          </main>
        )}
        <Toast />
        <AchievementPopup />
      </div>
      {page === 'assistant' && (
        <div className="fixed inset-x-0 z-[60] flex flex-col bg-slate-950" style={{ top: 0, bottom: keyboardHeight || 0 }}>
          <header className="flex items-center justify-between h-14 px-4 border-b border-slate-800/50 bg-slate-950/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100">EcoBot</h1>
                <p className="text-[10px] text-emerald-400 font-medium">En línea</p>
              </div>
            </div>
            <button onClick={() => setPage('tools')} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </header>
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>}>
            <Asistente onNavigate={navigate} userId={profile.id} />
          </Suspense>
        </div>
      )}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 py-1.5 grid grid-cols-5 shadow-2xl" style={{ paddingBottom: 'calc(0.375rem + env(safe-area-inset-bottom, 0px))' }}>
        {bottomNavItems.map(({ icon: Icon, label, page: itemPage }) => {
          const isActive = page === itemPage;
          return (
            <button key={itemPage} onClick={() => navigate(itemPage)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 mx-0.5 rounded-2xl transition-all ${
                isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 active:scale-95'
              }`}>
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[9px] sm:text-[10px] font-semibold leading-tight text-center overflow-hidden text-ellipsis whitespace-nowrap max-w-full px-0.5">{label}</span>
            </button>
          );
        })}
      </div>
      {showOnboarding && (
        <RobotDialog
          steps={onboardingSteps}
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
          title="ReBot te guía"
        />
      )}
    </div>
  );
}
