import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Menu, X, Copy } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

function OhmCalculator() {
  const [v, setV] = useState('');
  const [i, setI] = useState('');
  const [r, setR] = useState('');
  const [calc, setCalc] = useState<'V' | 'I' | 'R'>('R');

  const result = (() => {
    const vn = parseFloat(v), in_ = parseFloat(i), rn = parseFloat(r);
    if (calc === 'R' && !isNaN(vn) && !isNaN(in_) && in_ !== 0) return { label: 'Resistencia (Ω)', value: vn / in_ };
    if (calc === 'I' && !isNaN(vn) && !isNaN(rn) && rn !== 0) return { label: 'Corriente (A)', value: vn / rn };
    if (calc === 'V' && !isNaN(in_) && !isNaN(rn)) return { label: 'Voltaje (V)', value: in_ * rn };
    return null;
  })();

  const calcOptions = [
    { key: 'R' as const, label: 'Calcular R (Ω)' },
    { key: 'I' as const, label: 'Calcular I (A)' },
    { key: 'V' as const, label: 'Calcular V (V)' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {calcOptions.map(o => (
          <button key={o.key} onClick={() => { setCalc(o.key); setV(''); setI(''); setR(''); }}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${calc === o.key ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'}`}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {calc !== 'V' && (
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Voltaje (V)</p>
            <input type="number" value={v} onChange={e => setV(e.target.value)} className="input w-full text-sm" placeholder="Ej: 5" step="any" />
          </div>
        )}
        {calc !== 'I' && (
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Corriente (A)</p>
            <input type="number" value={i} onChange={e => setI(e.target.value)} className="input w-full text-sm" placeholder="Ej: 0.02" step="any" />
          </div>
        )}
        {calc !== 'R' && (
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Resistencia (Ω)</p>
            <input type="number" value={r} onChange={e => setR(e.target.value)} className="input w-full text-sm" placeholder="Ej: 150" step="any" />
          </div>
        )}
      </div>
      {result && (
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[10px] text-slate-500">{result.label}</p>
            <p className="text-lg font-bold font-mono text-emerald-400 select-all">{result.value.toFixed(4)}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result.value.toFixed(4))}
            className="ml-3 p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            aria-label="Copiar resultado"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function PowerCalculator() {
  const [v, setV] = useState('');
  const [i, setI] = useState('');
  const [r, setR] = useState('');
  const [mode, setMode] = useState<'VI' | 'IR'>('VI');

  const result = (() => {
    if (mode === 'VI') {
      const vn = parseFloat(v), in_ = parseFloat(i);
      if (!isNaN(vn) && !isNaN(in_)) return { label: 'Potencia (W)', value: vn * in_ };
    }
    if (mode === 'IR') {
      const in_ = parseFloat(i), rn = parseFloat(r);
      if (!isNaN(in_) && !isNaN(rn)) return { label: 'Potencia (W)', value: in_ * in_ * rn };
    }
    return null;
  })();

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {[{ key: 'VI', label: 'P = V × I' }, { key: 'IR', label: 'P = I² × R' }].map(o => (
          <button key={o.key} onClick={() => { setMode(o.key as 'VI' | 'IR'); setV(''); setI(''); setR(''); }}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors ${mode === o.key ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-700/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'}`}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-[10px] text-slate-500 mb-0.5">Corriente (A)</p>
          <input type="number" value={i} onChange={e => setI(e.target.value)} className="input w-full text-sm" placeholder="Ej: 0.5" step="any" />
        </div>
        {mode === 'VI' ? (
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Voltaje (V)</p>
            <input type="number" value={v} onChange={e => setV(e.target.value)} className="input w-full text-sm" placeholder="Ej: 12" step="any" />
          </div>
        ) : (
          <div>
            <p className="text-[10px] text-slate-500 mb-0.5">Resistencia (Ω)</p>
            <input type="number" value={r} onChange={e => setR(e.target.value)} className="input w-full text-sm" placeholder="Ej: 10" step="any" />
          </div>
        )}
      </div>
      {result && (
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[10px] text-slate-500">{result.label}</p>
            <p className="text-lg font-bold font-mono text-emerald-400 select-all">{result.value.toFixed(4)}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(result.value.toFixed(4))}
            className="ml-3 p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            aria-label="Copiar resultado"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ResistorCalculator({ mode }: { mode: 'series' | 'parallel' }) {
  const [values, setValues] = useState<string[]>(['', '']);

  const addValue = () => setValues([...values, '']);
  const removeValue = (i: number) => { if (values.length > 1) setValues(values.filter((_, idx) => idx !== i)); };
  const setValue = (i: number, v: string) => { const n = [...values]; n[i] = v; setValues(n); };

  const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
  const total = mode === 'series'
    ? nums.reduce((a, b) => a + b, 0)
    : 1 / nums.reduce((a, b) => a + 1 / b, 0);

  return (
    <div className="space-y-3">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input type="number" value={v} onChange={e => setValue(i, e.target.value)}
            className="input flex-1 text-sm" placeholder={`R${i + 1} (Ω)`} step="any" />
          <button onClick={() => removeValue(i)} disabled={values.length <= 1}
            className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={addValue} className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 hover:text-emerald-300 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Agregar resistencia
      </button>
      {nums.length >= 2 && (
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[10px] text-slate-500">R<sub>total</sub></p>
            <p className="text-lg font-bold font-mono text-emerald-400 select-all">{total.toFixed(2)} Ω</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${total.toFixed(2)} Ω`)}
            className="ml-3 p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            aria-label="Copiar resultado"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function VoltageDivider() {
  const [vin, setVin] = useState('');
  const [r1, setR1] = useState('');
  const [r2, setR2] = useState('');

  const vout = (() => {
    const vn = parseFloat(vin), r1n = parseFloat(r1), r2n = parseFloat(r2);
    if (!isNaN(vn) && !isNaN(r1n) && !isNaN(r2n) && r1n + r2n > 0) return vn * r2n / (r1n + r2n);
    return null;
  })();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-slate-500 mb-0.5">V<sub>in</sub> (V)</p>
          <input type="number" value={vin} onChange={e => setVin(e.target.value)} className="input w-full text-sm" placeholder="Ej: 5" step="any" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-0.5">R₁ (Ω)</p>
          <input type="number" value={r1} onChange={e => setR1(e.target.value)} className="input w-full text-sm" placeholder="Ej: 1000" step="any" />
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-0.5">R₂ (Ω)</p>
          <input type="number" value={r2} onChange={e => setR2(e.target.value)} className="input w-full text-sm" placeholder="Ej: 2000" step="any" />
        </div>
      </div>
      {vout !== null && (
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-[10px] text-slate-500">V<sub>out</sub></p>
            <p className="text-lg font-bold font-mono text-emerald-400 select-all">{vout.toFixed(4)} V</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(`${vout.toFixed(4)} V`)}
            className="ml-3 p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
            aria-label="Copiar resultado"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function FormulasPage({ onBack }: Props) {
  const [section, setSection] = useState('ohm');
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const sections = [
    { key: 'ohm', label: '⚡ Ley de Ohm', color: 'text-amber-400' },
    { key: 'power', label: '🔋 Potencia', color: 'text-blue-400' },
    { key: 'series', label: '🔗 Serie', color: 'text-purple-400' },
    { key: 'parallel', label: '🔄 Paralelo', color: 'text-cyan-400' },
    { key: 'divider', label: '💡 Divisor', color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="btn-ghost p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h2 className="section-title flex-1">Calculadora de Fórmulas</h2>
        <div ref={menuRef} className="relative">
          <button onClick={() => setShowMenu(!showMenu)}
            className="text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 p-2 rounded-xl transition-colors">
            {showMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          {showMenu && (
            <div className="fixed lg:absolute right-0 top-16 lg:top-full lg:mt-2 left-4 lg:left-auto w-auto lg:w-52 glass rounded-2xl border border-slate-700/50 shadow-2xl z-50 animate-slide-up max-h-[70vh] overflow-y-auto">
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Secciones</p>
              </div>
              {sections.map(s => (
                <button key={s.key} onClick={() => { setSection(s.key); setShowMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${section === s.key ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-300 hover:bg-slate-800/50'}`}>
                  <span className={`w-4 h-4 flex items-center justify-center text-xs ${s.color}`}>{s.label.split(' ')[0]}</span>
                  {s.label}
                </button>
              ))}
              <div className="mx-4 border-t border-slate-700/50" />
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Salir</p>
              </div>
              <button onClick={() => { onBack?.(); setShowMenu(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                Volver
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:flex gap-1.5 overflow-x-auto pb-1">
        {sections.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${section === s.key ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : `${s.color} bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50`}`}>
            {s.label}
          </button>
        ))}
      </div>

      {section === 'ohm' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <span className="text-lg">⚡</span> Ley de Ohm
          </h3>
          <p className="text-[11px] text-slate-500">Ingresa los 2 valores conocidos para calcular el tercero</p>
          <OhmCalculator />
        </div>
      )}

      {section === 'power' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-blue-400 flex items-center gap-2">
            <span className="text-lg">🔋</span> Potencia
          </h3>
          <PowerCalculator />
        </div>
      )}

      {section === 'series' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-purple-400 flex items-center gap-2">
            <span className="text-lg">🔗</span> Resistencias en Serie
          </h3>
          <p className="text-[11px] text-slate-500">R<sub>total</sub> = R₁ + R₂ + R₃ + ...</p>
          <ResistorCalculator mode="series" />
        </div>
      )}

      {section === 'parallel' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
            <span className="text-lg">🔄</span> Resistencias en Paralelo
          </h3>
          <p className="text-[11px] text-slate-500">1/R<sub>total</sub> = 1/R₁ + 1/R₂ + 1/R₃ + ...</p>
          <ResistorCalculator mode="parallel" />
        </div>
      )}

      {section === 'divider' && (
        <div className="card space-y-3">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <span className="text-lg">💡</span> Divisor de Voltaje
          </h3>
          <p className="text-[11px] text-slate-500">V<sub>out</sub> = V<sub>in</sub> × R₂ / (R₁ + R₂)</p>
          <VoltageDivider />
        </div>
      )}
    </div>
  );
}
