"use client"

import { useState, useEffect } from "react"
import { loginWithDocument, loginWithDocumentAndPassword, type UserData } from "@/lib/auth"
import { LoginView } from "@/components/login-view"
import { StudentView } from "@/components/student-view"
import { AdminView } from "@/components/admin-view"
import { MainView } from "@/components/main-view"

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem("uparsistem_user")
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log("[v0] Sesión restaurada desde localStorage:", parsedUser.documento)
        setUser(parsedUser)
        setUserData(parsedUser)
      } catch (error) {
        console.error("[v0] Error al parsear sesión guardada:", error)
        localStorage.removeItem("uparsistem_user")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLoginStudent = async (documentNumber: string) => {
    console.log("[v0] handleLoginStudent iniciado para:", documentNumber)
    const userData = await loginWithDocument(documentNumber)
    console.log("[v0] loginWithDocument retornó:", userData)

    setUser(userData)
    setUserData(userData)
    localStorage.setItem("uparsistem_user", JSON.stringify(userData))

    console.log("[v0] Estados actualizados - user y userData")
    return userData
  }

  const handleLoginAdmin = async (documentNumber: string, password: string) => {
    console.log("[v0] handleLoginAdmin iniciado para:", documentNumber)
    const userData = await loginWithDocumentAndPassword(documentNumber, password)
    console.log("[v0] loginWithDocumentAndPassword retornó:", userData)

    setUser(userData)
    setUserData(userData)
    localStorage.setItem("uparsistem_user", JSON.stringify(userData))

    console.log("[v0] Estados actualizados - user y userData")
    return userData
  }

  const handleLogout = () => {
    console.log("[v0] Cerrando sesión")
    setUser(null)
    setUserData(null)
    localStorage.removeItem("uparsistem_user")
  }

  console.log("[v0] Renderizando Home - user:", user?.documento, "rol:", user?.rol)

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-emerald-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

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
