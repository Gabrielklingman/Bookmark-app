import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAO2LJSS0K6cHM1LQ_32wnCNQ_fDp9f9gU",
  authDomain: "auramark-577e1.firebaseapp.com",
  projectId: "auramark-577e1",
  storageBucket: "auramark-577e1.firebasestorage.app",
  messagingSenderId: "611136704891",
  appId: "1:611136704891:web:c06b9155f762afe4926dde"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;