import { auth } from './firebase';
import { GROQ_KEY, OR_KEY } from './env';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const TIMEOUT_MS = 30000;

// Si está definido, las llamadas a IA pasan por Cloud Functions (las API keys
// viven en el servidor y NO se exponen en el bundle). Ej:
//   VITE_FUNCTIONS_URL=https://us-central1-ecoreengine-7fcaa.cloudfunctions.net
const FUNCTIONS_BASE = (import.meta.env.VITE_FUNCTIONS_URL || '').replace(/\/$/, '');
export function usingProxy(): boolean {
  return !!FUNCTIONS_BASE;
}

async function authHeader(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('AUTH_REQUIRED');
  return { Authorization: `Bearer ${token}` };
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface VisionContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface VisionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VisionContent[];
}

const CHAT_SYSTEM_PROMPT =
  'Eres un asistente experto en electrónica, robótica y reciclaje de e-waste. Respondes en español de forma clara, amigable y educativa. Ayudas a diagnosticar circuitos, explicar componentes, dar consejos de seguridad y guiar proyectos de electrónica DIY con materiales reciclados. Tus respuestas son concisas pero completas, usando formato markdown cuando sea útil.';

const VISION_SYSTEM_PROMPT =
  'Eres un experto en electrónica, reciclaje de e-waste e identificación de componentes. Respondes en español.';

export function getApiKey(): string {
  try { return localStorage.getItem('groq_api_key') || import.meta.env.VITE_GROQ_API_KEY || GROQ_KEY; } catch { return GROQ_KEY; }
}

export function setApiKey(key: string) {
  if (key.startsWith('sk-or')) {
    localStorage.setItem('openrouter_api_key', key);
  } else {
    localStorage.setItem('groq_api_key', key);
  }
}

export function hasApiKey(): boolean {
  return usingProxy() || !!getApiKey() || !!getOpenRouterKey();
}

async function sseReader(
  body: ReadableStream<Uint8Array> | null,
  onStream: (chunk: string) => void,
): Promise<string> {
  const reader = body?.getReader();
  if (!reader) throw new Error('STREAM_NOT_AVAILABLE');
  const decoder = new TextDecoder();
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      const json = line.slice(6);
      if (json === '[DONE]') continue;
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta?.content || '';
        if (delta) {
          full += delta;
          onStream(delta);
        }
      } catch { /* fragmento parcial */ }
    }
  }
  return full;
}

function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number, signal?: AbortSignal): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const combinedSignal = signal ? anySignal([signal, controller.signal]) : controller.signal;
  return fetch(url, { ...options, signal: combinedSignal }).finally(() => clearTimeout(timeout));
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) { controller.abort(s.reason); return controller.signal; }
    s.addEventListener('abort', () => controller.abort(s.reason), { once: true });
  }
  return controller.signal;
}

const OFFLINE_RESPONSES: { keywords: string[]; response: string }[] = [
  { keywords: ['resistencia', 'código de colores', 'banda', 'ohm'], response: 'Para leer una resistencia: identifica las bandas de colores. Las primeras dos son dígitos, la tercera es el multiplicador y la cuarta es la tolerancia. Puedes usar la Calculadora de la app en la sección Herramientas para obtener el valor exacto.' },
  { keywords: ['led', 'encender', 'diodo'], response: 'Para conectar un LED: la pata larga es positivo (ánodo) y la corta es negativo (cátodo). Siempre usa una resistencia de 220Ω a 330Ω en serie para no quemarlo. Revisa el proyecto PowerBulb en el Laboratorio para una guía completa.' },
  { keywords: ['motor', 'dc', 'girar'], response: 'Los motores DC tienen dos terminales. Invierte la polaridad para cambiar la dirección de giro. Puedes usar un transistor para controlarlos desde un microcontrolador. Mira el proyecto Eco-Rover en el Laboratorio.' },
  { keywords: ['arduino', 'microcontrolador', 'placa'], response: 'Arduino es una plataforma de código abierto para electrónica. Los pines digitales dan 5V o 0V, los analógicos leen valores de 0 a 1023. Necesitas el IDE de Arduino para programarlo y un cable USB.' },
  { keywords: ['reciclar', 'reciclaje', 'ewaste', 'basura', 'desecho', 'residuo'], response: 'El reciclaje electrónico es clave para reducir la contaminación. Nunca tires aparatos electrónicos a la basura común. Desármalos y separa: metales (cobre, aluminio), plásticos, y componentes reutilizables. La app te enseña a identificar qué sirve con el Diccionario de Componentes.' },
  { keywords: ['estaño', 'soldar', 'cautín', 'soldadura'], response: 'Para soldar: limpia la punta del cautín, estaña ambas superficies a unir, aplica calor con el cautín y agrega estaño. El estaño debe fluir solo. Nunca soples para enfriar. Usa flux si la soldadura no se adhiere bien.' },
  { keywords: ['batería', 'pila', '9v', 'voltaje', 'energía'], response: 'Las baterías tienen polaridad. Rojo es positivo (+), negro es negativo (-). Nunca conectes una batería directamente a un LED sin resistencia. Revisa el proyecto Eco-Dinamo que genera electricidad sin baterías.' },
  { keywords: ['multímetro', 'medir', 'voltaje', 'continuidad', 'tester'], response: 'El multímetro mide voltaje, corriente y resistencia. Para continuidad: pon la perilla en el símbolo de sonido y toca ambos extremos del cable. Si suena, hay continuidad. Siempre empieza midiendo en la escala más alta.' },
  { keywords: ['transistor', 'bc547', '2n2222'], response: 'El transistor tiene 3 patas: Base, Colector y Emisor. Una pequeña corriente en Base controla una corriente mayor de Colector a Emisor. Se usa como interruptor o amplificador. Mira el proyecto Sensor de Luz en el Laboratorio.' },
  { keywords: ['protoboard', 'breadboard'], response: 'La protoboard tiene conexiones internas en filas. Las filas marcadas con + y - son para alimentación. Cada fila de 5 orificios está conectada internamente. Ideal para prototipos antes de soldar.' },
  { keywords: ['cable', 'conectar', 'corto', 'circuito'], response: 'Un cortocircuito ocurre cuando la corriente toma un camino sin resistencia. Siempre verifica que los cables pelados no se toquen entre sí. Usa cinta aislante o termoencogible para aislar conexiones.' },
  { keywords: ['proyecto', 'hacer', 'construir', 'crear', 'tutorial'], response: 'EcoReEngine tiene varios proyectos paso a paso. ¿Qué te gustaría construir? Tenemos: PowerBulb (luz LED), Eco-Rover (carrito), EcoVentilador, Eco-Dinamo (generador), Sensor de Luz, Lámpara Nocturna, Motor DC y Eco-Tester. Todos con materiales reciclados.' },
  { keywords: ['hola', 'buenos días', 'buenas', 'hey', 'qué tal'], response: '¡Hola! Soy EcoBot, tu asistente de electrónica y reciclaje. Puedes preguntarme sobre componentes, proyectos, soldadura, reciclaje o cualquier cosa relacionada con tecnología sostenible. ¿En qué te ayudo hoy?' },
  { keywords: ['gracias'], response: '¡De nada! Recuerda que cada componente reciclado es un paso menos hacia la contaminación. Sigue así ♻️. ¿Necesitas algo más?' },
];

function getOfflineResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  for (const entry of OFFLINE_RESPONSES) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.response;
  }
  return 'Puedes preguntarme sobre: proyectos, componentes (resistencias, LEDs, transistores), soldadura, reciclaje, motores, la protoboard, o simplemente saludar. ¿En qué te ayudo?';
}

async function apiChat(
  endpoint: string,
  headers: Record<string, string>,
  body: object,
  onStream?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  }, TIMEOUT_MS, signal);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API_ERROR ${res.status}: ${text.slice(0, 200)}`);
  }

  if (!onStream) {
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  return sseReader(res.body, onStream);
}

export async function sendMessage(
  messages: ChatMessage[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = lastUserMsg?.content || '';

  // ── 1. Proxy en Cloud Functions (seguro, recomendado) ──
  if (usingProxy()) {
    return apiChat(`${FUNCTIONS_BASE}/chat`, await authHeader(), { messages, stream: !!onStream }, onStream, signal);
  }

  // ── 2. Groq (muy rápido, ~300ms primer token) ──
  const groqKey = getApiKey();
  if (groqKey) {
    try {
      return await apiChat(GROQ_ENDPOINT, { Authorization: `Bearer ${groqKey}` }, {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 2048,
        stream: !!onStream,
      }, onStream, signal);
    } catch { /* fallback al siguiente */ }
  }

  // ── 3. OpenRouter ──
  const orKey = getOpenRouterKey();
  if (orKey) {
    try {
      return await apiChat(OPENROUTER_ENDPOINT, { Authorization: `Bearer ${orKey}` }, {
        model: 'nvidia/nemotron-nano-12b-v2-vl:free',
        messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages],
        temperature: 0.7,
        max_tokens: 2048,
        stream: !!onStream,
      }, onStream, signal);
    } catch { /* fallback a offline */ }
  }

  // ── 4. Offline (instantáneo, sin API key) ──
  const reply = getOfflineResponse(userText);
  if (onStream) onStream(reply);
  return reply;
}

export function getOpenRouterKey(): string {
  try { return localStorage.getItem('openrouter_api_key') || import.meta.env.VITE_OPENROUTER_API_KEY || OR_KEY; } catch { return OR_KEY; }
}

export function hasOpenRouterKey(): boolean {
  return usingProxy() || !!getOpenRouterKey();
}

export async function sendVisionMessage(
  imageDataUrl: string,
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  if (usingProxy()) {
    const res = await fetchWithTimeout(`${FUNCTIONS_BASE}/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ imageDataUrl, prompt }),
    }, TIMEOUT_MS, signal);
    if (!res.ok) throw new Error(`VISION_ERROR: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('OPENROUTER_API_KEY_NO_SET');

  const res = await fetchWithTimeout(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'nvidia/nemotron-nano-12b-v2-vl:free',
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ] },
      ] as VisionMessage[],
      temperature: 0.5,
      max_tokens: 1024,
    }),
  }, TIMEOUT_MS, signal);

  if (!res.ok) throw new Error(`VISION_ERROR: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
