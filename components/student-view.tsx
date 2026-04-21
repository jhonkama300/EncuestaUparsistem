"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClipboardList, CheckCircle2, GraduationCap, BookOpen } from "lucide-react"
import type { UserData } from "@/lib/auth"
import { AppSidebar } from "./app-sidebar"
import { getAssignedSurveys, submitSurveyResponse } from "@/lib/surveys"
import { SurveyForm } from "./survey-form"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

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
      const assignedSurveys = await getAssignedSurveys(user.documento, user.rol)
      console.log("[v0] Encuestas cargadas:", assignedSurveys.length)
      assignedSurveys.forEach((survey) => {
        console.log(
          "[v0] Encuesta:",
          survey.titulo,
          "- Ponente:",
          survey.ponenteNombre,
          "- Imagen:",
          survey.ponenteImagen ? "SÍ" : "NO",
        )
      })
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
      await submitSurveyResponse(surveyId, user.documento, responses, user.rol)
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
    <Card key={survey.id} className="border-border transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-foreground">{survey.titulo}</CardTitle>
            <CardDescription className="mt-2">{survey.descripcion}</CardDescription>
          </div>
          {survey.completada && <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />}
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
                <Avatar className="w-14 h-14 border-3 border-amber-300 shadow-md">
                  {survey.ponenteImagen && (
                    <AvatarImage
                      src={survey.ponenteImagen || "/placeholder.svg"}
                      alt={survey.ponenteNombre}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="bg-amber-200 text-amber-800 font-bold text-lg">
                    {survey.ponenteNombre
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm text-amber-900 font-bold leading-tight">{survey.ponenteNombre}</p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => setSelectedSurvey(survey)}
          disabled={survey.completada}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-6 text-base"
        >
          {survey.completada ? "Completada" : "Responder"}
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className={`min-h-screen bg-background flex ${userData?.rol === "relaciones_corporativas" ? "theme-relaciones" : ""}`}>
      <AppSidebar user={user} onLogout={handleLogoutClick} activeTab="mi-encuesta" onTabChange={() => {}} isCollapsed={false} onCollapsedChange={() => {}} />
      <main className="flex-1 lg:pl-20 pb-16 lg:pb-0 min-h-screen overflow-auto">
      <div className="container mx-auto max-w-6xl p-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Tus Encuestas</h2>
          <p className="text-gray-700">Completa las encuestas asignadas a tu grupo</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-700">Cargando encuestas...</p>
            </CardContent>
          </Card>
        ) : surveys.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center">
              <ClipboardList className="mx-auto mb-4 h-12 w-12 text-primary/60" />
              <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay encuestas disponibles</h3>
              <p className="text-gray-700">No tienes encuestas asignadas en este momento</p>
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
                <Card className="border-border">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 text-primary/60" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay seminarios disponibles</h3>
                    <p className="text-gray-700">No tienes seminarios asignados en este momento</p>
                  </CardContent>
                </Card>
              ) : (
                seminarios.map(renderSurveyCard)
              )}
            </TabsContent>

            <TabsContent value="diplomados" className="space-y-4">
              {diplomados.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="mx-auto mb-4 h-12 w-12 text-primary/60" />
                    <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay diplomados disponibles</h3>
                    <p className="text-gray-700">No tienes diplomados asignados en este momento</p>
                  </CardContent>
                </Card>
              ) : (
                diplomados.map(renderSurveyCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
      </main>
    </div>
  )
}
