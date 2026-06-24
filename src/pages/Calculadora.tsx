import { useState } from 'react';
import { ArrowLeft, Copy, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

const COLOR_DATA: Record<string, { value: number; hex: string; es: string; mult?: string; tol?: string; ppm?: string }> = {
  black:  { value: 0, hex: '#1e293b', es: 'Negro',   mult: '×1 Ω',      ppm: '200 ppm/K' },
  brown:  { value: 1, hex: '#78350f', es: 'Marrón',  mult: '×10 Ω',     tol: '±1%',  ppm: '100 ppm/K' },
  red:    { value: 2, hex: '#ef4444', es: 'Rojo',    mult: '×100 Ω',    tol: '±2%',  ppm: '50 ppm/K' },
  orange: { value: 3, hex: '#f97316', es: 'Naranja', mult: '×1 kΩ',                  ppm: '15 ppm/K' },
  yellow: { value: 4, hex: '#eab308', es: 'Amarillo',mult: '×10 kΩ',                 ppm: '25 ppm/K' },
  green:  { value: 5, hex: '#10b981', es: 'Verde',   mult: '×100 kΩ',   tol: '±0.5%', ppm: '20 ppm/K' },
  blue:   { value: 6, hex: '#3b82f6', es: 'Azul',    mult: '×1 MΩ',     tol: '±0.25%',ppm: '10 ppm/K' },
  violet: { value: 7, hex: '#a855f7', es: 'Violeta', mult: '×10 MΩ',    tol: '±0.1%', ppm: '5 ppm/K' },
  grey:   { value: 8, hex: '#64748b', es: 'Gris',    mult: '×100 MΩ',   tol: '±0.05%',ppm: '1 ppm/K' },
  white:  { value: 9, hex: '#f8fafc', es: 'Blanco',  mult: '×1 GΩ' },
  gold:   { value: -1, hex: '#fbbf24', es: 'Oro',    mult: '×0.1 Ω',    tol: '±5%' },
  silver: { value: -2, hex: '#cbd5e1', es: 'Plata',  mult: '×0.01 Ω',   tol: '±10%' },
};

const DIGIT_COLORS = ['black','brown','red','orange','yellow','green','blue','violet','grey','white'];
const MULT_COLORS = ['black','brown','red','orange','yellow','green','blue','violet','grey','white','gold','silver'];
const TOL_COLORS   = ['brown','red','green','blue','violet','grey','gold','silver'];
const PPM_COLORS   = ['black','brown','red','orange','yellow','green','blue','violet','grey'];

type BandMode = 3 | 4 | 5 | 6;

function formatOhms(v: number): string {
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1).replace(/\.0$/, '') + ' GΩ';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace(/\.0$/, '') + ' MΩ';
  if (v >= 1_000) return (v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1).replace(/\.0$/, '') + ' kΩ';
  return v.toFixed(v % 1 === 0 ? 0 : 2) + ' Ω';
}

function textColor(bg: string): string {
  return ['#eab308','#f8fafc','#fbbf24','#cbd5e1'].includes(bg) ? '#0f172a' : '#f8fafc';
}

export default function Calculadora({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<BandMode>(4);
  const [bands, setBands] = useState<string[]>(['brown','black','red','gold']);

  const bandCount = mode;
  const digitCount = mode === 3 || mode === 4 ? 2 : 3;

  function updateBand(idx: number, color: string) {
    const next = [...bands];
    next[idx] = color;
    if (next.length < bandCount) {
      for (let i = next.length; i < bandCount; i++) next.push(i < digitCount ? 'brown' : 'gold');
    }
    setBands(next.slice(0, bandCount));
  }

  function resetBands() {
    if (mode === 3) setBands(['brown','black','red']);
    else if (mode === 4) setBands(['brown','black','red','gold']);
    else if (mode === 5) setBands(['brown','black','black','red','gold']);
    else setBands(['brown','black','black','red','gold','brown']);
  }

  function calcValue(): { ohms: number; formatted: string; tol: string; ppm: string } {
    const digits = bands.slice(0, digitCount).map(c => COLOR_DATA[c]?.value ?? 0);
    let val = 0;
    for (const d of digits) val = val * 10 + d;
    const multKey = bands[digitCount];
    const mult = multKey ? Math.pow(10, COLOR_DATA[multKey]?.value ?? 0) : 1;
    const ohms = val * mult;
    const formatted = formatOhms(ohms);
    const tolKey = mode >= 4 ? bands[digitCount + 1] : null;
    const tol = tolKey ? (COLOR_DATA[tolKey]?.tol ?? '') : '';
    const ppmKey = mode === 6 ? bands[digitCount + 2] : null;
    const ppm = ppmKey ? (COLOR_DATA[ppmKey]?.ppm ?? '') : '';
    return { ohms, formatted, tol, ppm };
  }

  const result = calcValue();
  const isValid = result.ohms > 0 && result.ohms < 1_000_000_000_000;

  function columnLabel(idx: number): string {
    if (idx < digitCount) return `Banda ${idx + 1}`;
    if (idx === digitCount) return 'Mult.';
    if (mode >= 5 && idx === digitCount + 1) return 'Tol.';
    if (mode === 4 && idx === digitCount + 1) return 'Tol.';
    if (mode === 6 && idx === digitCount + 2) return 'PPM';
    return '';
  }

  function colorsForCol(idx: number): string[] {
    if (idx < digitCount) return DIGIT_COLORS;
    if (idx === digitCount) return MULT_COLORS;
    if (mode === 4 && idx === digitCount + 1) return TOL_COLORS;
    if (mode >= 5 && idx === digitCount + 1) return TOL_COLORS;
    if (mode === 6 && idx === digitCount + 2) return PPM_COLORS;
    return DIGIT_COLORS;
  }

  return (
    <div className="pb-10 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-700 to-emerald-600 -mx-4 lg:-mx-8 px-4 lg:px-8 py-3 mb-6">
        <button onClick={onBack} className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-bold text-white flex-1">Código de colores — Calculadora de Resistencias</h1>
        <div className="relative">
          <select
            value={mode}
            onChange={e => { const m = Number(e.target.value) as BandMode; setMode(m); resetBands(); }}
            className="appearance-none bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/20 pr-7 focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value={3} className="text-slate-900">3 Bandas</option>
            <option value={4} className="text-slate-900">4 Bandas</option>
            <option value={5} className="text-slate-900">5 Bandas</option>
            <option value={6} className="text-slate-900">6 Bandas</option>
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/70 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6"/></svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resistor visual + result */}
        <div className="card space-y-5">
          <div className="flex items-center justify-center py-8 bg-white rounded-2xl border border-slate-200 relative overflow-hidden">
            <svg viewBox="0 0 320 130" className="w-full max-w-xs h-auto">
              {/* Left lead */}
              <rect x="0" y="58" width="48" height="14" rx="2" fill="#94a3b8" />
              {/* Right lead */}
              <rect x="272" y="58" width="48" height="14" rx="2" fill="#94a3b8" />
              {/* Resistor body */}
              <rect x="40" y="28" width="240" height="74" rx="14" fill="#f5e6d0" stroke="#d4c4a8" strokeWidth="1" />
              {/* Left cap */}
              <rect x="40" y="28" width="24" height="74" rx="14" fill="#e8d5b8" />
              {/* Right cap */}
              <rect x="256" y="28" width="24" height="74" rx="14" fill="#e8d5b8" />
              {/* Bands */}
              {bands.slice(0, bandCount).map((c, i) => {
                const bw = bandCount <= 4 ? 18 : 14;
                const gap = bandCount <= 4 ? 10 : 6;
                const totalBw = bandCount * bw + (bandCount - 1) * gap;
                const startX = (320 - totalBw) / 2;
                const x = startX + i * (bw + gap);
                return (
                  <rect key={i} x={x} y="32" width={bw} height="66" rx="2" fill={COLOR_DATA[c]?.hex ?? '#1e293b'} />
                );
              })}
              {/* Shine */}
              <rect x="64" y="32" width="180" height="8" rx="4" fill="white" opacity="0.12" />
            </svg>
          </div>

          {/* Result */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-teal-950/30 border border-emerald-500/20 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-center gap-2">
              {isValid ? (
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              )}
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {isValid ? 'Valor comercial válido' : 'Valor no estandarizado'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight py-1 select-all">
                {result.formatted}
              </p>
              <button onClick={() => navigator.clipboard.writeText(result.formatted)}
                className="p-2 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors shrink-0"
                title="Copiar">
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs flex-wrap">
              {result.tol && <span className="badge-amber font-semibold px-3 py-1">{result.tol}</span>}
              {result.ppm && <span className="badge-blue font-semibold px-3 py-1">{result.ppm}</span>}
              <button onClick={resetBands} className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px]">
                <RotateCcw className="w-3.5 h-3.5" /> Reiniciar
              </button>
            </div>
          </div>
        </div>

        {/* Right: Color columns */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Selector de Colores</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide" style={{ minHeight: 340 }}>
            {Array.from({ length: bandCount }).map((_, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1.5 min-w-[72px] flex-1">
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-1">{columnLabel(colIdx)}</p>
                {colorsForCol(colIdx).map(c => {
                  const selected = bands[colIdx] === c;
                  const d = COLOR_DATA[c];
                  let sub = '';
                  if (colIdx < digitCount) sub = String(d.value);
                  else if (colIdx === digitCount) sub = d.mult ?? '';
                  else if ((mode === 4 || mode >= 5) && colIdx === digitCount + 1) sub = d.tol ?? '';
                  else if (mode === 6 && colIdx === digitCount + 2) sub = d.ppm ?? '';
                  return (
                    <button key={c} onClick={() => updateBand(colIdx, c)}
                      className={`flex flex-col items-center justify-center rounded-xl border transition-all py-1.5 ${
                        selected
                          ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-105 shadow-md shadow-emerald-500/10 z-10'
                          : 'border-slate-800 hover:border-slate-700 active:scale-95'
                      }`}
                      style={{ backgroundColor: d.hex, color: textColor(d.hex) }}>
                      <span className="text-[9px] font-extrabold leading-tight">{d.es}</span>
                      <span className="text-[7px] opacity-80 leading-tight mt-px">{sub}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
            <span>Pulsa un color por columna</span>
            <span className="font-mono text-emerald-400">{bandCount} bandas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
