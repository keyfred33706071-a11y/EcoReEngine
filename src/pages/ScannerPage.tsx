import { useState } from 'react';
import { Camera, CameraResultType, CameraDirection } from '@capacitor/camera';
import { sendVisionMessage, hasOpenRouterKey } from '../lib/ai';

interface Props { onBack?: () => void; }

const COMPONENTS_LIST = [
  { name: 'Resistencia', icon: '⚡', info: 'Componente pasivo que limita el flujo de corriente. Se identifica por sus bandas de colores.' },
  { name: 'LED (Diodo Emisor de Luz)', icon: '💡', info: 'Componente que emite luz al pasar corriente. Polarizado: ánodo (+) pata larga, cátodo (-) pata corta.' },
  { name: 'Transistor (BC547, 2N2222)', icon: '🔌', info: 'Componente de 3 patas (Base, Colector, Emisor). Se usa como interruptor o amplificador.' },
  { name: 'Condensador / Capacitor', icon: '🔋', info: 'Almacena energía eléctrica. Hay electrolíticos (polarizados, cilíndricos) y cerámicos (no polarizados, disco).' },
  { name: 'Diodo (1N4007, etc.)', icon: '➡️', info: 'Permite el paso de corriente en un solo sentido. Tiene una banda en el cátodo (-).' },
  { name: 'Motor DC', icon: '🔄', info: 'Convierte energía eléctrica en movimiento. Tiene dos terminales; invierte polaridad para cambiar giro.' },
  { name: 'Potenciometro', icon: '🎛️', info: 'Resistencia variable. Se usa para controlar volumen, velocidad o intensidad.' },
  { name: 'Relé / Relay', icon: '🔘', info: 'Interruptor electromecánico. Permite controlar altos voltajes con una señal pequeña.' },
  { name: 'Regulador de voltaje (7805)', icon: '⚡', info: 'Mantiene un voltaje de salida fijo (ej: 5V) aunque varíe la entrada o la carga.' },
  { name: 'Display 7 segmentos', icon: '🔢', info: 'Muestra números. Tiene 8 LEDs internos (7 segmentos + punto decimal).' },
  { name: 'Crystal / Resonador', icon: '🕒', info: 'Genera una frecuencia precisa para relojes de microcontroladores.' },
  { name: 'Sensor (LDR, Temp, etc.)', icon: '🌡️', info: 'Detecta cambios en el entorno (luz, temperatura, distancia) y los convierte en señales eléctricas.' },
];

export default function ScannerPage({ onBack }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (dataUrl: string) => {
    setLoading(true);
    setResult(null);
    setError(null);
    if (!hasOpenRouterKey()) {
      setError('La clave de OpenRouter para la IA de cámara no está configurada.');
      setLoading(false);
      return;
    }
    try {
      const text = await sendVisionMessage(
        dataUrl,
        'Identifica este componente electrónico. Responde SOLO con: Nombre, Tipo, De qué aparato suele extraerse, Si se puede reciclar (Sí/No), Consejo breve. Usa formato corto y claro en español.',
      );
      setResult(text);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const takePhoto = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 50,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        direction: CameraDirection.Rear,
      });
      const dataUrl = photo.dataUrl ?? null;
      setImage(dataUrl);
      setResult(null);
      setError(null);
      if (dataUrl && hasOpenRouterKey()) {
        analyze(dataUrl);
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="text-xl font-bold text-slate-100">Scanner de Componentes</h1>
      </div>

      {/* Camera scanner */}
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
            <p className="text-xs text-slate-400">Toma una foto y la IA identificará el componente y te dirá si es reciclable</p>
          </div>
        </div>

        <button onClick={takePhoto}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Abrir cámara
        </button>

        {image && (
          <div className="mt-4">
            <img src={image} alt="Componente" className="w-full rounded-xl" />

            {loading && (
              <div className="mt-3 flex items-center gap-3 bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-300">La IA está analizando la imagen...</span>
              </div>
            )}

            {error && (
              <div className="mt-3 bg-red-900/30 border border-red-800/30 rounded-xl p-4">
                <p className="text-sm text-red-300">{error}</p>
                {!hasOpenRouterKey() && (
                  <p className="mt-2 text-sm text-slate-400">Configura la variable VITE_OPENROUTER_API_KEY en el .env</p>
                )}
              </div>
            )}

            {result && (
              <div className="mt-3 bg-slate-800/80 rounded-xl p-4 border border-emerald-700/30">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">🔍 Análisis de la IA:</p>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{result}</p>
              </div>
            )}

            {!loading && !result && !error && !hasOpenRouterKey() && (
              <p className="mt-2 text-sm text-slate-400">La clave de OpenRouter para el análisis con IA de cámara no está configurada.</p>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-slate-400 mb-4">
        O toca cada componente para ver información útil.
      </p>

      <div className="space-y-3">
        {COMPONENTS_LIST.map((item) => (
          <details key={item.name} className="group bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
            <summary className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/40 transition-colors list-none">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-100">{item.name}</span>
              </div>
              <svg className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </summary>
            <div className="px-4 pb-4 pt-0">
              <div className="border-t border-slate-700/50 pt-3">
                <p className="text-xs text-slate-300 leading-relaxed">{item.info}</p>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
