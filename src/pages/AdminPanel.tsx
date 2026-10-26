import { useEffect, useState } from 'react';
import { clearApiKey, getApiKey, setApiKey } from '../lib/apiKeys';

const ADMIN_PASSWORD = 'ecore-demo-2024';
const SESSION_KEY = 'admin_auth';

export default function AdminPanel() {
  const [authed, setAuthed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [status, setStatus] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authed) {
      try {
        setApiKeyInput(getApiKey());
      } catch {
        // ignore
      }
    }
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch {
        // ignore
      }
      setAuthed(true);
      setError('');
      setPassword('');
      try {
        setApiKeyInput(getApiKey());
      } catch {
        // ignore
      }
    } else {
      setError('Contraseña incorrecta');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus('');
    try {
      const key = apiKeyInput.trim();
      if (!key) {
        setStatus('Ingresa una API key para probar');
        setTesting(false);
        return;
      }
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });
      if (res.ok) {
        setStatus('Conexión exitosa');
      } else {
        const text = await res.text().catch(() => '');
        setStatus(`Error: ${res.status} ${text.slice(0, 100)}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || 'desconocido'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    try {
      const key = apiKeyInput.trim();
      if (key) {
        setApiKey(key);
        setStatus('Guardado en localStorage');
      } else {
        setStatus('No hay key para guardar');
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || 'desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    try {
      clearApiKey();
      setApiKeyInput('');
      setStatus('Key eliminada');
    } catch (err: any) {
      setStatus(`Error: ${err?.message || 'desconocido'}`);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-xl font-bold text-slate-100 mb-2">Panel de Administración</h1>
          <p className="text-sm text-slate-400 mb-4">Acceso protegido</p>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
            >
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Panel /admin</h1>
          <p className="text-sm text-slate-400">Gestión de API Keys de Groq</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Groq API Key</label>
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="Pega tu API key aquí"
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleTest}
              disabled={testing}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {testing ? 'Probando...' : 'Probar'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              Limpiar
            </button>
          </div>
          {status && <p className="text-sm text-slate-300">{status}</p>}
        </div>
      </div>
    </div>
  );
}
