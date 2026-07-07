import { initializeApp, applicationDefault } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

try {
  initializeApp({ credential: applicationDefault(), projectId: 'ecoreengine-7fcaa' });
  const db = getFirestore();
  await db.doc('app_config/update').set({
    version: '1.16',
    apk_url: 'https://files.catbox.moe/vtw72h.apk',
    changelog: 'Correcciones de camara, optimizacion, lazy loading, mapa reciclaje, PowerBulb',
    force_update: true,
    updated_at: new Date().toISOString(),
    updated_by: 'admin'
  });
  console.log('OK - App update published');
} catch(e) {
  console.log('ERR:', e.message);
}
