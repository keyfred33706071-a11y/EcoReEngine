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

const email = process.argv[2];
const password = process.argv[3];

try {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  console.log('Signed in as:', cred.user.uid);
  
  await setDoc(doc(db, 'app_config', 'update'), {
    version: '1.16.0',
    apk_url: 'https://files.catbox.moe/vtw72h.apk',
    changelog: 'Correcciones de camara, optimizacion, lazy loading, mapa de reciclaje, PowerBulb',
    force_update: true,
    updated_at: new Date().toISOString(),
    updated_by: cred.user.uid
  }, { merge: true });
  
  console.log('SUCCESS - Version fixed to 1.16.0');
} catch (e) {
  console.log('ERROR:', e.message || e);
}
