"use client"

import { useState, useEffect } from "react"
import { loginWithDocument, loginWithDocumentAndPassword, type UserData } from "@/lib/auth"
import { LoginView } from "@/components/login-view"
import { StudentView } from "@/components/student-view"
import { AdminView } from "@/components/admin-view"
import { MainView } from "@/components/main-view"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

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
    setLogoutDialogOpen(true)
  }

  const handleLogoutConfirm = () => {
    console.log("[v0] Cerrando sesión")
    setUser(null)
    setUserData(null)
    localStorage.removeItem("uparsistem_user")
    setLogoutDialogOpen(false)
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

  return (
    <>
      {userData && (userData.rol === "admin" || userData.rol === "uparsistem" || userData.rol === "relaciones_corporativas") ? (
        <AdminView user={user} userData={userData} onLogout={handleLogoutConfirm} />
      ) : userData && userData.rol === "estudiante" ? (
        <StudentView user={user} userData={userData} onLogout={handleLogoutConfirm} />
      ) : (
        <MainView user={user!} userData={userData!} onLogout={handleLogoutConfirm} />
      )}

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
