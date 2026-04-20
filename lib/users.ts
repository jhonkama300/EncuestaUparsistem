import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "./firebase"

export type AppRole = "admin" | "uparsistem" | "relaciones_corporativas" | "estudiante"

export interface AppUser {
  id?: string
  nombre: string
  documento: string
  email?: string
  password?: string
  rol: AppRole
  activo: boolean
  fechaCreacion?: string
}

export async function getUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(db, "usuarios"))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser))
}

export async function createUser(user: Omit<AppUser, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "usuarios"), {
    ...user,
    fechaCreacion: new Date().toISOString(),
  })
  return ref.id
}

export async function updateUser(id: string, data: Partial<AppUser>): Promise<void> {
  await updateDoc(doc(db, "usuarios", id), data as any)
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, "usuarios", id))
}
