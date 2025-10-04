import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";

// ⬇️ Reemplaza con tu configuración de Firebase Web App
// Firebase Console → Configuración del proyecto → Tus apps → Web
npm 

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
