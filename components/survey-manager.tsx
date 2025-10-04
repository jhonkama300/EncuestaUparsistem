"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Users, TrendingUp } from "lucide-react"
import { CreateSurveyDialog } from "./create-survey-dialog"
import { getSurveys, getSurveyStats } from "@/lib/surveys"

export function SurveyManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [surveys, setSurveys] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, respuestas: 0, tasa: 0 })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const surveysData = await getSurveys()
    const statsData = await getSurveyStats()
    setSurveys(surveysData)
    setStats(statsData)
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800">Gestión de Encuestas</h2>
          <p className="text-gray-600 mt-1">Crea y administra encuestas para tus estudiantes</p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Nueva Encuesta
        </Button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Encuestas Activas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">Encuestas en curso</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Respuestas Totales</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.respuestas}</div>
            <p className="text-xs text-gray-600 mt-1">Estudiantes han respondido</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-teal-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Tasa de Respuesta</CardTitle>
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700">{stats.tasa}%</div>
            <p className="text-xs text-gray-600 mt-1">De estudiantes asignados</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Encuestas Recientes</h3>
        <div className="space-y-4">
          {surveys.length === 0 ? (
            <Card className="border-dashed border-2 border-emerald-200">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">No hay encuestas creadas</h3>
                <p className="text-gray-600 mb-4">Crea tu primera encuesta para comenzar a recopilar respuestas</p>
                <Button onClick={() => setShowCreateDialog(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4" />
                  Crear Primera Encuesta
                </Button>
              </CardContent>
            </Card>
          ) : (
            surveys.map((survey) => (
              <Card key={survey.id} className="border-emerald-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-emerald-800 text-xl">{survey.titulo}</CardTitle>
                      <CardDescription className="mt-2">{survey.descripcion}</CardDescription>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-emerald-700">{survey.respuestas || 0}</div>
                      <div className="text-xs text-gray-600">respuestas</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                    >
                      Ver Resultados
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-transparent"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-700 hover:bg-red-50 bg-transparent"
                    >
                      Desactivar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CreateSurveyDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onSuccess={loadData} />
    </>
  )
}
