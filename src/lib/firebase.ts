import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0464770303",
  appId: "1:514839490318:web:952d597951874bba23715f",
  apiKey: "AIzaSyD878Hxuzf_qGql9qfew3Qfa0OmLME0qVQ",
  authDomain: "gen-lang-client-0464770303.firebaseapp.com",
  storageBucket: "gen-lang-client-0464770303.firebasestorage.app",
  messagingSenderId: "514839490318",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app, "ai-studio-finalyzed-2eb176a9-c018-4dcc-8f34-2ad9a11f7ee1");
