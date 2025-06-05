import { initializeApp } from 'firebase/app';
import auth from '@react-native-firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBjubSEs3QNn_dV6_viqHrgrRXMXFLJHKo",
  authDomain: "classconnect-grupo2.firebaseapp.com",
  projectId: "classconnect-grupo2",
  storageBucket: "classconnect-grupo2.firebasestorage.app",
  messagingSenderId: "120382293299",
  appId: "1:120382293299:web:1c3b54d1ecd31227a42a46",
  measurementId: "G-012DDD9WZM"
};
// Inicializa Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);




// Firebase se inicializa automáticamente con google-services.json

export { auth, db };