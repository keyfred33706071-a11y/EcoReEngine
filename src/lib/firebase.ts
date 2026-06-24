import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCHRevY_ZXZPTAfg8OeLmrnErfQlylk1Ms",
  authDomain: "ecoreengine-7fcaa.firebaseapp.com",
  projectId: "ecoreengine-7fcaa",
  storageBucket: "ecoreengine-7fcaa.firebasestorage.app",
  messagingSenderId: "1083558700443",
  appId: "1:1083558700443:web:293c9c9fbd0514d2ebed3e",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);