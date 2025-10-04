"use client"

import type { User } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, UserIcon, CheckCircle } from "lucide-react"
import type { UserData } from "@/lib/auth"

interface MainViewProps {
  user: User
  userData: UserData
  onLogout: () => Promise<void>
}

export function MainView({ user, userData, onLogout }: MainViewProps) {
  const handleLogout = async () => {
    try {
      await onLogout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Panel Principal</h1>
          <Button variant="outline" onClick={handleLogout} className="gap-2 bg-transparent">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{userData?.nombre || "Bienvenido"}</CardTitle>
                  <CardDescription>Sesión iniciada correctamente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Número de Documento:</span>
                  <span className="text-lg font-semibold text-gray-900">{userData?.documento || "N/A"}</span>
                </div>
                {userData?.email && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Email:</span>
                    <span className="text-gray-700">{userData.email}</span>
                  </div>
                )}
                {userData?.rol && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Rol:</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                      {userData.rol}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">ID de Usuario:</span>
                  <span className="font-mono text-sm text-gray-700">{user.uid}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Tu sesión está activa y segura</p>
            </CardContent>
          </Card>

          {/* Placeholder Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Módulo 1</CardTitle>
              <CardDescription>Funcionalidad disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Contenido del módulo 1</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Módulo 2</CardTitle>
              <CardDescription>Funcionalidad disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Contenido del módulo 2</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
