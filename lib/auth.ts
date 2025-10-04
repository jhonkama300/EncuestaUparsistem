import { collection, query, where, getDocs } from "firebase/firestore"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { db, auth } from "./firebase"

export interface UserData {
  documento: string
  nombre: string
  email?: string
  rol: "admin" | "estudiante"
  password?: string // Solo para admin
  activo: boolean
  fechaCreacion?: string
}

export async function getUserDataByDocument(documentNumber: string): Promise<UserData | null> {
  try {
    console.log("[v0] Buscando usuario con documento:", documentNumber)
    const usuariosRef = collection(db, "usuarios")
    const q = query(usuariosRef, where("documento", "==", documentNumber))
    const querySnapshot = await getDocs(q)

    console.log("[v0] Documentos encontrados:", querySnapshot.size)

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0]
      console.log("[v0] Usuario encontrado:", userDoc.data())
      return userDoc.data() as UserData
    }

    console.log("[v0] No se encontró usuario con ese documento")
    return null
  } catch (error) {
    console.error("[v0] Error al obtener datos del usuario:", error)
    return null
  }
}

export async function loginWithDocumentAndPassword(documentNumber: string, password: string): Promise<UserData> {
  console.log("[v0] Iniciando login admin con documento:", documentNumber)

  const userData = await getUserDataByDocument(documentNumber)

  if (!userData) {
    throw new Error("Número de documento no registrado en la base de datos")
  }

  if (userData.rol !== "admin") {
    throw new Error("Este usuario no tiene permisos de administrador")
  }

  if (!userData.activo) {
    throw new Error("Usuario inactivo")
  }

  // Validar contraseña
  if (userData.password !== password) {
    console.log("[v0] Contraseña incorrecta. Esperada:", userData.password, "Recibida:", password)
    throw new Error("Contraseña incorrecta")
  }

  try {
    const email = `${documentNumber}@admin.uparsistem.local`
    console.log("[v0] Autenticando en Firebase Auth con email:", email)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      console.log("[v0] Autenticación Firebase Auth exitosa")
    } catch (authError: any) {
      // Si el usuario no existe en Firebase Auth, crearlo
      if (authError.code === "auth/user-not-found" || authError.code === "auth/invalid-credential") {
        console.log("[v0] Usuario no existe en Firebase Auth, creándolo...")
        await createUserWithEmailAndPassword(auth, email, password)
        console.log("[v0] Usuario creado en Firebase Auth")
      } else {
        throw authError
      }
    }
  } catch (error) {
    console.error("[v0] Error en autenticación Firebase:", error)
    // Continuar aunque falle la autenticación de Firebase
  }

  console.log("[v0] Login admin exitoso")
  return userData
}

export async function loginWithDocument(documentNumber: string): Promise<UserData> {
  console.log("[v0] Iniciando login estudiante con documento:", documentNumber)

  const userData = await getUserDataByDocument(documentNumber)

  if (!userData) {
    throw new Error("Número de documento no registrado en la base de datos")
  }

  if (userData.rol !== "estudiante") {
    throw new Error("Este usuario no es un estudiante")
  }

  if (!userData.activo) {
    throw new Error("Usuario inactivo")
  }

  console.log("[v0] Login estudiante exitoso")
  return userData
}
