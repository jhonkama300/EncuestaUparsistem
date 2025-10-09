"use client"

import { useState } from "react"
import { loginWithDocument, loginWithDocumentAndPassword, type UserData } from "@/lib/auth"
import { LoginView } from "@/components/login-view"
import { StudentView } from "@/components/student-view"
import { AdminView } from "@/components/admin-view"
import { MainView } from "@/components/main-view"

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)

  const handleLoginStudent = async (documentNumber: string) => {
    console.log("[v0] handleLoginStudent iniciado para:", documentNumber)
    const userData = await loginWithDocument(documentNumber)
    console.log("[v0] loginWithDocument retornó:", userData)

    setUser(userData)
    setUserData(userData)

    console.log("[v0] Estados actualizados - user y userData")
    return userData
  }

  const handleLoginAdmin = async (documentNumber: string, password: string) => {
    console.log("[v0] handleLoginAdmin iniciado para:", documentNumber)
    const userData = await loginWithDocumentAndPassword(documentNumber, password)
    console.log("[v0] loginWithDocumentAndPassword retornó:", userData)

    setUser(userData)
    setUserData(userData)

    console.log("[v0] Estados actualizados - user y userData")
    return userData
  }

  const handleLogout = () => {
    console.log("[v0] Cerrando sesión")
    setUser(null)
    setUserData(null)
  }

  console.log("[v0] Renderizando Home - user:", user?.documento, "rol:", user?.rol)

  if (!user) {
    return <LoginView onLoginStudent={handleLoginStudent} onLoginAdmin={handleLoginAdmin} />
  }

  if (userData && userData.rol === "admin") {
    return <AdminView user={user} userData={userData} onLogout={handleLogout} />
  } else if (userData && userData.rol === "estudiante") {
    return <StudentView user={user} userData={userData} onLogout={handleLogout} />
  } else {
    return <MainView user={user} userData={userData} onLogout={handleLogout} />
  }
}
