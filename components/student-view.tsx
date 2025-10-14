"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, ClipboardList, CheckCircle2, GraduationCap, BookOpen } from "lucide-react"
import type { UserData } from "@/lib/auth"
import { getAssignedSurveys, submitSurveyResponse } from "@/lib/surveys"
import { SurveyForm } from "./survey-form"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface StudentViewProps {
  user: UserData
  userData: UserData
  onLogout: () => void
}

export function StudentView({ user, userData, onLogout }: StudentViewProps) {
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  console.log("[v0] StudentView montado - user:", user?.documento, "userData:", userData?.documento)

  useEffect(() => {
    console.log("[v0] StudentView useEffect - configurando listener en tiempo real")

    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("activa", "==", true))

    const unsubscribe = onSnapshot(qSurveys, async () => {
      console.log("[v0] Cambio detectado en encuestas - recargando...")
      await loadSurveys()
    })

    loadSurveys()

    return () => {
      console.log("[v0] Limpiando listener de encuestas")
      unsubscribe()
    }
  }, [user.documento])

  const loadSurveys = async () => {
    try {
      console.log("[v0] Cargando encuestas para:", user.documento)
      const assignedSurveys = await getAssignedSurveys(user.documento)
      console.log("[v0] Encuestas cargadas:", assignedSurveys.length)
      setSurveys(assignedSurveys)
    } catch (error) {
      console.error("[v0] Error cargando encuestas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSurvey = async (surveyId: string, responses: any) => {
    console.log("[v0] handleSubmitSurvey - Iniciando envío para encuesta:", surveyId)
    console.log("[v0] handleSubmitSurvey - Respuestas:", responses)
    console.log("[v0] handleSubmitSurvey - Documento estudiante:", user.documento)

    try {
      await submitSurveyResponse(surveyId, user.documento, responses)
      console.log("[v0] handleSubmitSurvey - Respuesta guardada exitosamente")

      await loadSurveys()
      console.log("[v0] handleSubmitSurvey - Encuestas recargadas")

      setSelectedSurvey(null)
      console.log("[v0] handleSubmitSurvey - Navegando de vuelta a la lista")
    } catch (error) {
      console.error("[v0] handleSubmitSurvey - Error enviando respuestas:", error)
      throw error
    }
  }

  const handleLogoutClick = () => {
    console.log("[v0] StudentView - Usuario clickeó cerrar sesión")
    onLogout()
  }

  const seminarios = surveys.filter((survey) => survey.titulo?.toUpperCase().includes("SEMINARIO"))
  const diplomados = surveys.filter((survey) => survey.titulo?.toUpperCase().includes("DIPLOMADO"))

  if (selectedSurvey) {
    return (
      <SurveyForm
        survey={selectedSurvey}
        user={user}
        onSubmit={(responses) => handleSubmitSurvey(selectedSurvey.id, responses)}
        onBack={() => setSelectedSurvey(null)}
        onLogout={handleLogoutClick}
      />
    )
  }

  const renderSurveyCard = (survey: any) => (
    <Card key={survey.id} className="border-emerald-200 transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-emerald-800">{survey.titulo}</CardTitle>
            <CardDescription className="mt-2">{survey.descripcion}</CardDescription>
          </div>
          {survey.completada && <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-wrap gap-2 mb-3">
              {(survey.programaAsignado || survey.programa) && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {survey.programaAsignado || survey.programa}
                </Badge>
              )}
              {(survey.nivelAsignado || survey.nivel) && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Nivel: {survey.nivelAsignado || survey.nivel}
                </Badge>
              )}
              {(survey.periodoAsignado || survey.periodo) && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {survey.periodoAsignado || survey.periodo}
                </Badge>
              )}
              {(survey.grupoAsignado || survey.grupo) && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Grupo {survey.grupoAsignado || survey.grupo}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">{survey.preguntas?.length || 0}</span> preguntas
            </p>
          </div>

          {survey.ponenteNombre && (
            <div className="md:w-64 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700 font-semibold mb-3 uppercase tracking-wide">Ponente</p>
              <div className="flex items-center gap-3">
                {survey.ponenteImagen && (
                  <img
                    src={survey.ponenteImagen || "/placeholder.svg"}
                    alt={survey.ponenteNombre}
                    className="w-14 h-14 rounded-full object-cover border-3 border-amber-300 shadow-md flex-shrink-0"
                  />
                )}
                <p className="text-sm text-amber-900 font-bold leading-tight">{survey.ponenteNombre}</p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => setSelectedSurvey(survey)}
          disabled={survey.completada}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-6 text-base"
        >
          {survey.completada ? "Completada" : "Responder"}
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold">Encuestas Estudiantiles</h1>
            <p className="text-sm text-emerald-100">Bienvenido, {user.nombre}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogoutClick}
            className="gap-2 border-white bg-white/10 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-emerald-800">Tus Encuestas</h2>
          <p className="text-gray-600">Completa las encuestas asignadas a tu grupo</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-600">Cargando encuestas...</p>
            </CardContent>
          </Card>
        ) : surveys.length === 0 ? (
          <Card className="border-emerald-200">
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay encuestas disponibles</h3>
              <p className="text-gray-600">No tienes encuestas asignadas en este momento</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="seminarios" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="seminarios" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Seminarios ({seminarios.length})
              </TabsTrigger>
              <TabsTrigger value="diplomados" className="gap-2">
                <GraduationCap className="h-4 w-4" />
                Diplomados ({diplomados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="seminarios" className="space-y-4">
              {seminarios.length === 0 ? (
                <Card className="border-emerald-200">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay seminarios disponibles</h3>
                    <p className="text-gray-600">No tienes seminarios asignados en este momento</p>
                  </CardContent>
                </Card>
              ) : (
                seminarios.map(renderSurveyCard)
              )}
            </TabsContent>

            <TabsContent value="diplomados" className="space-y-4">
              {diplomados.length === 0 ? (
                <Card className="border-emerald-200">
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay diplomados disponibles</h3>
                    <p className="text-gray-600">No tienes diplomados asignados en este momento</p>
                  </CardContent>
                </Card>
              ) : (
                diplomados.map(renderSurveyCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
