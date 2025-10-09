"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserDataByDocument, type UserData } from "@/lib/auth"
import { GraduationCap, Lock, User } from "lucide-react"

interface LoginViewProps {
  onLoginStudent: (documentNumber: string) => Promise<UserData>
  onLoginAdmin: (documentNumber: string, password: string) => Promise<UserData>
}

export function LoginView({ onLoginStudent, onLoginAdmin }: LoginViewProps) {
  const [documentNumber, setDocumentNumber] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(false)
  const [cachedUserData, setCachedUserData] = useState<UserData | null>(null)
  const isSubmittingRef = useRef(false)

  const handleDocumentBlur = async () => {
    if (isSubmittingRef.current || !documentNumber.trim() || !/^\d+$/.test(documentNumber)) {
      return
    }

    setCheckingRole(true)
    setError("")

    try {
      console.log("[v0] Buscando usuario con documento:", documentNumber)
      const userData = await getUserDataByDocument(documentNumber)
      console.log("[v0] Usuario encontrado:", userData)

      setCachedUserData(userData)

      if (userData && userData.rol === "admin") {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch (err) {
      console.error("Error al verificar rol:", err)
      setCachedUserData(null)
    } finally {
      setCheckingRole(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmittingRef.current || loading) {
      console.log("[v0] Envío bloqueado - ya está en proceso")
      return
    }

    isSubmittingRef.current = true
    setError("")

    if (!documentNumber.trim()) {
      setError("Por favor ingresa tu número de documento")
      isSubmittingRef.current = false
      return
    }

    if (!/^\d+$/.test(documentNumber)) {
      setError("El número de documento solo debe contener dígitos")
      isSubmittingRef.current = false
      return
    }

    if (isAdmin && !password.trim()) {
      setError("Por favor ingresa tu contraseña")
      isSubmittingRef.current = false
      return
    }

    setLoading(true)
    console.log("[v0] Iniciando login para documento:", documentNumber)

    try {
      let userData = cachedUserData

      if (!userData || userData.documento !== documentNumber) {
        console.log("[v0] Buscando usuario (no hay caché):", documentNumber)
        userData = await getUserDataByDocument(documentNumber)
        setCachedUserData(userData)
      } else {
        console.log("[v0] Usando datos en caché para:", documentNumber)
      }

      if (!userData) {
        setError("Número de documento no registrado en la base de datos")
        setLoading(false)
        isSubmittingRef.current = false
        return
      }

      if (userData.rol === "admin" && !isAdmin) {
        setIsAdmin(true)
        setError("Por favor ingresa tu contraseña de administrador")
        setLoading(false)
        isSubmittingRef.current = false
        return
      }

      console.log("[v0] Procesando login como:", userData.rol)

      if (userData.rol === "admin") {
        console.log("[v0] Llamando onLoginAdmin")
        await onLoginAdmin(documentNumber, password)
        console.log("[v0] onLoginAdmin completado")
      } else {
        console.log("[v0] Llamando onLoginStudent")
        await onLoginStudent(documentNumber)
        console.log("[v0] onLoginStudent completado")
      }

      console.log("[v0] Login exitoso - manteniendo estado de carga hasta cambio de vista")
      // mantener el botón deshabilitado hasta que el componente se desmonte
      // cuando cambie la vista al StudentView o AdminView
    } catch (err: any) {
      console.error("[v0] Error en login:", err)
      setError(err.message || "Error al iniciar sesión")
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-green-100">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">UPARSISTEM</CardTitle>
          <CardDescription className="text-base">
            {isAdmin ? "Panel de Administración" : "Portal de Estudiantes"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="document" className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Número de Documento
              </label>
              <Input
                id="document"
                type="text"
                placeholder="Ingresa tu documento"
                value={documentNumber}
                onChange={(e) => {
                  setDocumentNumber(e.target.value)
                  setIsAdmin(false)
                  setPassword("")
                  setCachedUserData(null)
                }}
                onBlur={handleDocumentBlur}
                disabled={loading || checkingRole}
                className="text-lg h-12 border-green-200 focus:border-primary focus:ring-primary"
              />
              {checkingRole && (
                <p className="text-sm text-primary animate-pulse flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" />
                  Verificando usuario...
                </p>
              )}
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="text-lg h-12 border-green-200 focus:border-primary focus:ring-primary"
                />
                <p className="text-xs text-primary font-medium">🔒 Acceso restringido para administradores</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-200">
                <AlertDescription className="font-medium">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-secondary transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={loading || checkingRole}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                "Ingresar al Sistema"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
