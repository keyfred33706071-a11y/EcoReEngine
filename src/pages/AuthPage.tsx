import { useState } from 'react';
import { Loader, Eye, EyeOff, Mail } from 'lucide-react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { checkUsernameTaken, reserveUsername } from '../lib/firestore';

interface AuthPageProps {
  onAuthSuccess: (userId: string, username?: string) => void;
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [error, setError] = useState('');

  async function handleResetPassword() {
    setError('');
    if (!resetEmail.trim()) { setError('Ingresa tu email'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setError('Enlace enviado con éxito. Revisa tu email.');
      setTimeout(() => setShowResetForm(false), 3000);
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'No hay cuenta con ese email' : err.message || 'Error al enviar enlace');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (mode === 'register') {
      if (!username.trim()) { setError('Debes elegir un nombre de usuario'); setLoading(false); return; }
      if (username.trim().length < 3) { setError('El usuario debe tener al menos 3 caracteres'); setLoading(false); return; }
    }
    setLoading(true);

    try {
      if (mode === 'register') {
        if (await checkUsernameTaken(username.trim())) {
          setError('Ese nombre de usuario ya está en uso'); setLoading(false); return;
        }
        (window as any).__ECO_PENDING_USERNAME = username.trim();
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await reserveUsername(username.trim(), cred.user.uid).catch(() => {});
        onAuthSuccess(cred.user.uid, username.trim());
        return;
      }

      const cred = await signInWithEmailAndPassword(auth, email, password);
      onAuthSuccess(cred.user.uid);
    } catch (err: any) {
      const msg = err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential'
        ? 'Email o contraseña incorrectos'
        : err.code === 'auth/email-already-in-use'
          ? 'Este email ya está registrado'
          : err.code === 'auth/too-many-requests'
            ? 'Demasiados intentos. Espera un minuto.'
            : err.code === 'auth/invalid-email'
              ? 'Email inválido'
              : err.code === 'auth/weak-password'
                ? 'Contraseña muy débil (mín 6 caracteres)'
                : err.message || 'Error de conexión';
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo/logo.jpeg?v=6" alt="EcoReEngine" className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg shadow-emerald-600/40 object-contain" />
          <h1 className="text-2xl font-bold text-slate-100">EcoReEngine</h1>
          <p className="text-slate-400 text-sm mt-1">Ingeniería inversa para un mundo sustentable</p>
        </div>

        <div className="card space-y-5">
          <div className="flex bg-slate-700/50 rounded-xl p-1">
            <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'login' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Iniciar sesión</button>
            <button type="button" onClick={() => { setMode('register'); setError(''); }} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'register' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>Crear cuenta</button>
          </div>

          {showResetForm ? (
            <div className="space-y-4">
              {error && (
                <p className={`text-xs text-center font-semibold p-2 rounded-xl border ${
                  error.includes('éxito') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>{error}</p>
              )}
              <div>
                <label className="text-xs text-slate-300 font-medium mb-1 block">Email</label>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required placeholder="tu@email.com" className="input w-full" />
              </div>
              <button type="button" onClick={handleResetPassword} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                Enviar enlace
              </button>
              <button type="button" onClick={() => { setShowResetForm(false); setError(''); }} className="text-xs text-slate-500 hover:text-slate-300 w-full text-center">
                Volver a inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className={`text-xs text-center font-semibold p-2 rounded-xl border ${
                  error.includes('éxito') ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-red-400 bg-red-500/10 border-red-500/20'
                }`}>{error}</p>
              )}

              <div>
                <label className="text-xs text-slate-300 font-medium mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="tu@email.com" className="input w-full" />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-xs text-slate-300 font-medium mb-1 block">Nombre de usuario</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="ej: ecofan42" className="input w-full" />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300 font-medium mb-1 block">Contraseña</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="mín. 6 caracteres" className="input w-full pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <button type="button" onClick={() => { setShowResetForm(true); setResetEmail(email); setError(''); }} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
                  Olvidé mi contraseña
                </button>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
