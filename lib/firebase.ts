import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// ⬇️ Reemplaza con tu configuración de Firebase Web App
// Firebase Console → Configuración del proyecto → Tus apps → Web
const firebaseConfig = {
  apiKey: "AIzaSyDHg_3Mmpr1zcMHS9IMpGjVcwy352t9UmA",
  authDomain: "encuestasseminarios.firebaseapp.com",
  projectId: "encuestasseminarios",
  storageBucket: "encuestasseminarios.firebasestorage.app",
  messagingSenderId: "244387508257",
  appId: "1:244387508257:web:b4f2da5f9403a0912bb360",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export function getRoleCollectionName(collectionName: string, role: string): string {
  if (role === "admin") return collectionName
  if (role === "relaciones_corporativas") return `relaciones_${collectionName}`
  if (role === "practicas_operador") return `practicas_operador_${collectionName}`
  return `uparsistem_${collectionName}`
}

setPersistence(auth, browserLocalPersistence).catch(console.error)
