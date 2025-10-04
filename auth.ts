import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
import { auth } from "./lib/firebase";

export async function loginEmailPassword(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function registerEmailPassword(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export function onAuth(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export function logout() {
  return signOut(auth);
}
