"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, ClipboardList, CheckCircle2 } from "lucide-react"
import type { UserData } from "@/lib/auth"
import { getAssignedSurveys, submitSurveyResponse } from "@/lib/surveys"
import { SurveyForm } from "./survey-form"

interface StudentViewProps {
  user: UserData
  onLogout: () => void
}

export function StudentView({ user, onLogout }: StudentViewProps) {
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurveys()
  }, [user.documento])

  const loadSurveys = async () => {
    try {
      const assignedSurveys = await getAssignedSurveys(user.documento)
      setSurveys(assignedSurveys)
    } catch (error) {
      console.error("Error cargando encuestas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSurvey = async (surveyId: string, responses: any) => {
    try {
      await submitSurveyResponse(surveyId, user.documento, responses)
      await loadSurveys()
      setSelectedSurvey(null)
    } catch (error) {
      console.error("Error enviando respuestas:", error)
    }
  }

  if (selectedSurvey) {
    return (
      <SurveyForm
        survey={selectedSurvey}
        user={user}
        onSubmit={(responses) => handleSubmitSurvey(selectedSurvey.id, responses)}
        onBack={() => setSelectedSurvey(null)}
        onLogout={onLogout}
      />
    )
  }

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
            onClick={onLogout}
            className="gap-2 border-white bg-white/10 text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-4 py-8">
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
          <div className="space-y-4">
            {surveys.map((survey) => (
              <Card key={survey.id} className="border-emerald-200 transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-emerald-800">{survey.titulo}</CardTitle>
                      <CardDescription className="mt-1">{survey.descripcion}</CardDescription>
                    </div>
                    {survey.completada && <CheckCircle2 className="h-6 w-6 text-emerald-600" />}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <p>{survey.preguntas?.length || 0} preguntas</p>
                    </div>
                    <Button
                      onClick={() => setSelectedSurvey(survey)}
                      disabled={survey.completada}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {survey.completada ? "Completada" : "Responder"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
