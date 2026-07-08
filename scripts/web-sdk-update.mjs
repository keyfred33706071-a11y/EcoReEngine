import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCHRevY_ZXZPTAfg8OeLmrnErfQlylk1Ms",
  authDomain: "ecoreengine-7fcaa.firebaseapp.com",
  projectId: "ecoreengine-7fcaa",
  storageBucket: "ecoreengine-7fcaa.firebasestorage.app",
  messagingSenderId: "1083558700443",
  appId: "1:1083558700443:web:293c9c9fbd0514d2ebed3e",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// These need to be the admin account credentials
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node script.mjs <email> <password>');
  console.log('Provide the admin email and password for the Firebase project.');
  process.exit(1);
}

try {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in as:', cred.user.uid);
  
  await setDoc(doc(db, 'app_config', 'update'), {
    version: '1.17.0',
    apk_url: 'https://files.catbox.moe/e28637.apk',
    changelog: '- Descarga dentro de la app con barra de progreso\n- Admin panel: solo campo URL (sin file upload)\n- Corrección de versión (APP_VERSION = 1.17.0)\n- Optimizaciones y limpieza de código',
    force_update: true,
    updated_at: new Date().toISOString(),
    updated_by: cred.user.uid
  }, { merge: true });
  
  console.log('SUCCESS - Update published!');
  console.log('Version 1.17.0 is now forced for all users.');
} catch (e) {
  console.log('ERROR:', e.message || e);
}
