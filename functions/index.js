/**
 * EcoReEngine — Cloud Functions
 * Proxy seguro para servicios con API key. Las keys viven en Firebase Config
 * (NUNCA en el bundle del cliente). Cada endpoint exige un ID token de Firebase.
 *
 * Configuración de keys:
 *   firebase functions:config:set openrouter.key="sk-or-..." imgbb.key="..."
 *
 * Despliegue:
 *   firebase deploy --only functions
 *
 * Migrar a Firebase Secrets (Blaze plan) cuando esté disponible:
 *   firebase functions:secrets:set OPENROUTER_API_KEY
 */
const { onRequest } = require('firebase-functions/v2/https');
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Las keys se configuran via: firebase functions:config:set
//   openrouter.key="..." imgbb.key="..."
//
// Si el proyecto está en Spark (gratuito), despliega las funciones
// y configura las keys con:
//   firebase functions:config:set openrouter.key="..." imgbb.key="..."
//   firebase deploy --only functions
//
// NOTA: Cloud Functions requiere plan Blaze (pay-as-you-go).
// Tiene generoso free tier, es poco probable que te cobren.
function getOpenRouterKey() { return functions.config()?.openrouter?.key || ''; }
function getImgbbKey() { return functions.config()?.imgbb?.key || ''; }

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const CHAT_SYSTEM_PROMPT =
  'Eres un asistente experto en electrónica, robótica y reciclaje de e-waste. ' +
  'Respondes en español de forma clara, amigable y educativa. Ayudas a diagnosticar ' +
  'circuitos, explicar componentes, dar consejos de seguridad y guiar proyectos de ' +
  'electrónica DIY con materiales reciclados. Tus respuestas son concisas pero completas, ' +
  'usando formato markdown cuando sea útil.';

const VISION_SYSTEM_PROMPT =
  'Eres un experto en electrónica, reciclaje de e-waste e identificación de componentes. ' +
  'Respondes en español.';

// ─── Helpers ────────────────────────────────────────────────
function applyCors(req, res) {
  res.set('Access-Control-Allow-Origin', '*'); // TODO: restringe a tu dominio web
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.set('Access-Control-Max-Age', '3600');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return true;
  }
  return false;
}

async function requireAuth(req, res) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    res.status(401).json({ error: 'No autenticado' });
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch {
    res.status(401).json({ error: 'Token inválido' });
    return null;
  }
}

// ─── Chat (OpenRouter, con streaming opcional) ──────────────
exports.chat = onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido' }); return; }
  if (!(await requireAuth(req, res))) return;

  const { messages, stream } = req.body || {};
  if (!Array.isArray(messages)) { res.status(400).json({ error: 'messages requerido' }); return; }

  const body = {
    model: 'nvidia/nemotron-nano-12b-v2-vl:free',
    messages: [{ role: 'system', content: CHAT_SYSTEM_PROMPT }, ...messages],
    temperature: 0.7,
    max_tokens: 2048,
    stream: !!stream,
  };

  const upstream = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getOpenRouterKey()}` },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    res.status(upstream.status).send(err);
    return;
  }

  if (!stream) {
    res.json(await upstream.json());
    return;
  }

  // Passthrough del stream SSE de OpenRouter al cliente.
  res.set('Content-Type', 'text/event-stream');
  res.set('Cache-Control', 'no-cache');
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value, { stream: true }));
  }
  res.end();
});

// ─── Visión (OpenRouter) ────────────────────────────────────
exports.vision = onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido' }); return; }
  if (!(await requireAuth(req, res))) return;

  const { imageDataUrl, prompt } = req.body || {};
  if (!imageDataUrl || !prompt) { res.status(400).json({ error: 'imageDataUrl y prompt requeridos' }); return; }

  const body = {
    model: 'nvidia/nemotron-nano-12b-v2-vl:free',
    messages: [
      { role: 'system', content: VISION_SYSTEM_PROMPT },
      { role: 'user', content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ] },
    ],
    temperature: 0.5,
    max_tokens: 1024,
  };

  const upstream = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getOpenRouterKey()}` },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) { res.status(upstream.status).send(await upstream.text()); return; }
  res.json(await upstream.json());
});

// ─── Contenido diario (OpenRouter, texto corto) ─────────────
exports.dailyContent = onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido' }); return; }
  if (!(await requireAuth(req, res))) return;

  const { date } = req.body || {};
  if (!date) { res.status(400).json({ error: 'date requerido' }); return; }

  const prompt =
    'Escribe un dato curioso, tip o reflexión en español sobre reciclaje electrónico, ' +
    'upcycling de e-waste, o medio ambiente. Máximo 150 caracteres. Que sea breve, variado ' +
    'e interesante. No incluyas títulos ni formato. Responde solo el texto.';

  const upstream = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getOpenRouterKey()}` },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 50 }),
  });

  if (!upstream.ok) { res.status(upstream.status).send(await upstream.text()); return; }
  const data = await upstream.json();
  const content = (data.choices?.[0]?.message?.content || '').trim().slice(0, 150);

  // Guarda en Firestore para que los clientes no necesiten escribir (más seguro).
  try {
    await admin.firestore().collection('daily_content').doc(date).set({
      content,
      generated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[dailyContent] Error al guardar en Firestore:', err);
  }

  res.json({ content });
});

// ─── Subida de imagen (ImgBB) ───────────────────────────────
exports.uploadImage = onRequest(async (req, res) => {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') { res.status(405).json({ error: 'Método no permitido' }); return; }
  if (!(await requireAuth(req, res))) return;

  const { imageBase64, name } = req.body || {};
  if (!imageBase64) { res.status(400).json({ error: 'imageBase64 requerido' }); return; }

  const form = new URLSearchParams();
  form.append('key', getImgbbKey());
  form.append('image', imageBase64);
  if (name) form.append('name', String(name).replace(/\//g, '_'));

  const upstream = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: form });
  if (!upstream.ok) { res.status(upstream.status).json({ error: 'Error al subir imagen a ImgBB' }); return; }

  const data = await upstream.json();
  if (!data.success) { res.status(502).json({ error: data.error?.message || 'Error en ImgBB' }); return; }
  res.json({ url: data.data.url });
});
