import { useState } from 'react';
import { Camera, CameraResultType, CameraDirection, CameraSource } from '@capacitor/camera';
import { sendVisionMessage, hasOpenRouterKey } from '../lib/ai';

interface EwasteItem {
  name: string;
  icon: string;
  recyclable: string[];
}

interface Props {
  onNavigate?: (page: string) => void;
}

const items: EwasteItem[] = [
  {
    name: 'Teléfono móvil / Smartphone',
    icon: '📱',
    recyclable: ['Batería de litio', 'Pantalla LCD / OLED (vidrio reciclable)', 'Placa base con oro, plata, cobre', 'Carcasa de aluminio o plástico', 'Altavoces (imanes de neodimio)', 'Cámara (lentes de vidrio)'],
  },
  {
    name: 'Laptop / Notebook',
    icon: '💻',
    recyclable: ['Batería recargable', 'Disco duro o SSD (metales raros)', 'Placa madre con cobre y oro', 'Ventilador (cobre y aluminio)', 'Teclado (plástico reciclable)', 'Carcasa de aluminio o magnesio'],
  },
  {
    name: 'Monitor / Pantalla LCD',
    icon: '🖥️',
    recyclable: ['Panel LCD (vidrio)', 'Cables internos (cobre)', 'Fuente de poder (transformadores)', 'Placa controladora (oro, estaño)', 'Carcasa de plástico ABS'],
  },
  {
    name: 'Tablet / iPad',
    icon: '📟',
    recyclable: ['Batería de polímero de litio', 'Pantalla táctil (vidrio y óxido de indio)', 'Placa base (metales preciosos)', 'Carcasa de aluminio'],
  },
  {
    name: 'Televisor LED / LCD',
    icon: '📺',
    recyclable: ['Pantalla LED (vidrio)', 'Fuente de poder', 'Placa T-Con y mainboard', 'Altavoces (imanes)', 'Cables (cobre)', 'Carcasa de plástico'],
  },
  {
    name: 'Impresora',
    icon: '🖨️',
    recyclable: ['Cartuchos de tinta / tóner', 'Motor paso a paso (cobre, imanes)', 'Fuente de poder', 'Rodillos de goma', 'Placa controladora', 'Carcasa de plástico'],
  },
  {
    name: 'CPU / Torre de escritorio',
    icon: '🖥️',
    recyclable: ['Fuente de poder (cobre, aluminio)', 'Placa madre (oro, plata, cobre)', 'CPU (silicio, oro)', 'Memoria RAM (oro)', 'Disco duro (imanes, aluminio)', 'Ventiladores (cobre)'],
  },
  {
    name: 'Cargador / Fuente de poder',
    icon: '🔌',
    recyclable: ['Transformador interno (cobre)', 'Cable (cobre)', 'Placa rectificadora', 'Carcasa de plástico'],
  },
  {
    name: 'Auriculares / Audífonos',
    icon: '🎧',
    recyclable: ['Altavoces (imanes de neodimio)', 'Cable de cobre', 'Almohadillas (espuma reciclable)', 'Carcasa de plástico ABS'],
  },
  {
    name: 'Batería de litio (sueltas)',
    icon: '🔋',
    recyclable: ['Litio', 'Cobalto', 'Níquel', 'Manganeso', 'Cobre', 'Aluminio'],
  },
  {
    name: 'Cable USB / HDMI / audio',
    icon: '🔌',
    recyclable: ['Cobre (conductores internos)', 'Aislante de PVC', 'Conectores metálicos (estaño, níquel)'],
  },
  {
    name: 'Router / Módem',
    icon: '📡',
    recyclable: ['Placa base (oro, cobre)', 'Antena (cobre)', 'Fuente de poder', 'LEDs (arseniuro de galio)', 'Carcasa de plástico'],
  },
  {
    name: 'Teclado / Ratón',
    icon: '⌨️',
    recyclable: ['Placa controladora (cobre)', 'Cables (cobre)', 'Teclas de plástico ABS', 'Sensor óptico (silicio)', 'Carcasa de plástico'],
  },
  {
    name: 'Microondas',
    icon: '📡',
    recyclable: ['Transformador de alto voltaje (cobre)', 'Motor del plato giratorio', 'Ventilador (cobre)', 'Carcasa de acero', 'Placa controladora'],
  },
  {
    name: 'Lavadora / Electrodoméstico grande',
    icon: '🧺',
    recyclable: ['Motor (cobre, imanes)', 'Bomba de agua (cobre)', 'Cableado interno', 'Tambor de acero inoxidable', 'Placa controladora', 'Plásticos y gomas'],
  },
  {
    name: 'Ventilador eléctrico',
    icon: '🌀',
    recyclable: ['Motor (cobre, imanes)', 'Aspas de plástico o metal', 'Cable de poder', 'Eje de acero', 'Base de metal o plástico'],
  },
];

async function loadAndCompress(uri: string, maxW = 1024, quality = 0.5): Promise<string> {
  const img = new Image();
  img.src = uri;
  await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = reject; });
  let { width, height } = img;
  if (width > maxW) { height = Math.round(height * maxW / width); width = maxW; }
  const c = document.createElement('canvas');
  c.width = width; c.height = height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);
  return c.toDataURL('image/webp', quality);
}

export default function EwastePage({ onNavigate }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const analyzeWithAI = async (dataUrl: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const result = await sendVisionMessage(
        dataUrl,
        'Identifica este aparato electrónico y dime exactamente qué componentes y materiales se pueden reciclar de él. Responde en español con formato conciso: primero el nombre del aparato, luego una lista de los componentes reciclables con su material principal. Si no puedes identificarlo con certeza, di lo que parece ser y sugiere cómo averiguarlo.',
      );
      setAiResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const captureFrom = async (source: CameraSource) => {
    setCapturing(true);
    setError(null);
    try {
      const image = await Camera.getPhoto({
        quality: 30,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        direction: CameraDirection.Rear,
        source,
      });
      if (!image.path) return;
      const compressed = await loadAndCompress(image.path);
      setPhoto(compressed);
      setAiResult(null);
      if (hasOpenRouterKey()) {
        analyzeWithAI(compressed);
      } else {
        setError('Identificación por IA no disponible en esta versión.');
      }
    } catch (err: any) {
      if (err?.message?.includes('cancel')) return;
      setError('No se pudo acceder a la cámara. Revisá los permisos en Configuración > EcoReEngine > Cámara.');
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => onNavigate?.('home')} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-100">Reciclaje de E-waste</h1>
      </div>

      <div className="mb-6 bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-800/30 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-100">Escanea con la cámara</p>
            <p className="text-xs text-slate-400">Toma una foto y la IA identificará el aparato y sus componentes reciclables</p>
          </div>
        </div>

        <button onClick={() => captureFrom(CameraSource.Camera)} disabled={capturing}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {capturing
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Abriendo cámara...</>
            : <><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg> Abrir cámara</>}
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-slate-700/50" />
          <span className="text-xs text-slate-500">o</span>
          <div className="flex-1 h-px bg-slate-700/50" />
        </div>

        <button onClick={() => captureFrom(CameraSource.Photos)} disabled={capturing}
          className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {capturing
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Abriendo galería...</>
            : <><svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> Desde galería</>}
        </button>

        {error && (
          <div className="mt-3 bg-red-900/30 border border-red-800/30 rounded-xl p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {photo && (
          <div className="mt-4">
            <img src={photo} alt="Foto del aparato" className="w-full rounded-xl" />

            {analyzing && (
              <div className="mt-3 flex items-center gap-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-300">La IA está analizando la imagen...</span>
              </div>
            )}

            {aiResult && (
              <div className="mt-3 bg-slate-800/80 rounded-xl p-4 border border-emerald-700/30">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">🔍 Análisis de la IA:</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{aiResult}</p>
              </div>
            )}

            {!analyzing && !aiResult && !error && !hasOpenRouterKey() && (
              <p className="mt-2 text-sm text-slate-400">Identificación por IA no disponible en esta versión.</p>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-4">
        O toca cada aparato para ver qué materiales se pueden recuperar y reciclar.
      </p>

      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.name} className="group bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/40 transition-colors list-none">
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm font-semibold text-slate-100 flex-1">{item.name}</span>
              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <div className="border-t border-slate-700/50 pt-3">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Componentes reciclables:</p>
                <ul className="space-y-1">
                  {item.recyclable.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-emerald-500 mt-0.5">♻️</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
