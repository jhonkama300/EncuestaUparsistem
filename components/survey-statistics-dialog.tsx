"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSurveyResponses } from "@/lib/surveys"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { TrendingUp, Users, Award, CheckCircle, BarChart3 } from "lucide-react"

import type { UserData } from "@/lib/auth"

interface SurveyStatisticsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  surveyTitle: string
  user: UserData
}

// ... ( keep SCALE_VALUES and COLORS )

const SCALE_VALUES: Record<string, number> = {
  excelente: 5,
  bueno: 4,
  aceptable: 3,
  regular: 2,
  malo: 1,
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

export function SurveyStatisticsDialog({ open, onOpenChange, surveyId, surveyTitle, user }: SurveyStatisticsDialogProps) {
  const [responses, setResponses] = useState<any[]>([])
  const [survey, setSurvey] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && surveyId) {
      loadData()
    }
  }, [open, surveyId])

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getSurveyResponses(surveyId, user.rol)
      setResponses(Array.isArray(data.respuestas) ? data.respuestas : [])
      setSurvey(data.encuesta || null)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
      setResponses([])
      setSurvey(null)
    } finally {
      setLoading(false)
    }
  }

  const statistics = useMemo(() => {
    if (!survey || !survey.preguntas || !Array.isArray(responses) || responses.length === 0) {
      return null
    }

    const questions = survey.preguntas || []
    const questionStats = questions.map((question: any, index: number) => {
      const frequencies: Record<string, number> = {}
      let total = 0
      let sum = 0
      let validResponses = 0

      responses.forEach((response) => {
        const answer = response.respuestas?.[index]
        if (answer !== undefined && answer !== null && answer !== "") {
          const answerStr = String(answer).toLowerCase().trim()
          frequencies[answerStr] = (frequencies[answerStr] || 0) + 1
          total++

          const value = SCALE_VALUES[answerStr] || (typeof answer === "number" ? answer : null)
          if (value !== null && !isNaN(value)) {
            sum += value
            validResponses++
          }
        }
      })

      const frequencyData = Object.entries(frequencies)
        .map(([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: value,
          percentage: total > 0 ? ((value / total) * 100).toFixed(1) : "0",
        }))
        .sort((a, b) => b.value - a.value)

      const mode = Object.entries(frequencies).reduce((a, b) => (b[1] > a[1] ? b : a), ["N/A", 0])[0]
      const average = validResponses > 0 ? sum / validResponses : 0

      return {
        question: question.texto,
        frequencies: frequencyData,
        mode: mode.charAt(0).toUpperCase() + mode.slice(1),
        average: average,
        total,
        validResponses,
      }
    })

    const validAverages = questionStats.filter((stat: any) => stat.validResponses > 0)
    const overallAverage =
      validAverages.length > 0 ? validAverages.reduce((acc: any, stat: any) => acc + stat.average, 0) / validAverages.length : 0

    const lastQuestion = questions[questions.length - 1]
    let expectationsFulfilled = 0
    if (lastQuestion && lastQuestion.tipo === "si_no") {
      responses.forEach((response) => {
        const answer = response.respuestas?.[questions.length - 1]
        if (answer && String(answer).toLowerCase().includes("sí")) {
          expectationsFulfilled++
        }
      })
    }

    const expectationsPercentage =
      responses.length > 0 ? ((expectationsFulfilled / responses.length) * 100).toFixed(1) : "0"

    const radarData = questionStats
      .filter((stat: any) => stat.validResponses > 0)
      .slice(0, 6)
      .map((stat: any, _index: number) => ({
        subject: `P${questionStats.indexOf(stat) + 1}`,
        value: Number(stat.average.toFixed(2)),
        fullMark: 5,
      }))

    return {
      questionStats,
      overallAverage: overallAverage.toFixed(2),
      totalResponses: responses.length,
      expectationsPercentage,
      radarData,
    }
  }, [survey, responses])

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] lg:w-[85vw] lg:max-w-6xl xl:max-w-7xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Cargando estadísticas</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-500">Cargando estadísticas...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!statistics || statistics.totalResponses === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] lg:w-[85vw] lg:max-w-6xl xl:max-w-7xl flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
              Estadísticas - {surveyTitle}
            </DialogTitle>
            <DialogDescription className="text-emerald-50 text-sm">
              Análisis estadístico descriptivo de las respuestas
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay respuestas disponibles para esta encuesta</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] lg:w-[85vw] lg:max-w-6xl xl:max-w-7xl flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-20">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
            Estadísticas - {surveyTitle}
          </DialogTitle>
          <DialogDescription className="text-emerald-50 text-sm">
            Análisis estadístico descriptivo de las respuestas de la encuesta
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Respuestas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{statistics.totalResponses}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Promedio General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{statistics.overallAverage}/5</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Calificación
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {((Number.parseFloat(statistics.overallAverage) / 5) * 100).toFixed(0)}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Expectativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{statistics.expectationsPercentage}%</div>
                </CardContent>
              </Card>
            </div>

            {statistics.radarData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Comparación de Promedios por Pregunta</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={statistics.radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} />
                      <Radar name="Promedio" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                      <Tooltip />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Estadísticas por Pregunta */}
            {statistics.questionStats.map((stat: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center justify-between flex-wrap gap-2">
                    <span className="flex-1">
                      Pregunta {index + 1}: {stat.question}
                    </span>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">Moda: {stat.mode}</Badge>
                      {stat.validResponses > 0 && (
                        <Badge variant="secondary">Promedio: {stat.average.toFixed(2)}/5</Badge>
                      )}
                      <Badge variant="outline">Respuestas: {stat.total}</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gráfico de Barras */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Frecuencias</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stat.frequencies}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#10b981" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Gráfico de Pastel */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Distribución Porcentual</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={stat.frequencies}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {stat.frequencies.map((entry: any, idx: number) => (
                              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Tabla de Frecuencias */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Tabla de Frecuencias</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700 border">Respuesta</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-700 border">
                              Frecuencia Absoluta
                            </th>
                            <th className="px-4 py-2 text-right font-medium text-gray-700 border">
                              Frecuencia Relativa
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {stat.frequencies.map((freq: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 font-medium border">{freq.name}</td>
                              <td className="px-4 py-2 text-right border">{freq.value}</td>
                              <td className="px-4 py-2 text-right border">{freq.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
