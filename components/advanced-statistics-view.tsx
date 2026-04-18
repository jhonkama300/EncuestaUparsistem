"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllSurveys, getSurveyResponses } from "@/lib/surveys"
import { getPonentes } from "@/lib/ponentes"
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
  LineChart,
  Line,
} from "recharts"
import { TrendingUp, Users, Award, CheckCircle, BarChart3, Activity, Target, Star } from "lucide-react"

const SCALE_VALUES: Record<string, number> = {
  excelente: 5,
  bueno: 4,
  aceptable: 3,
  regular: 2,
  malo: 1,
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

type QuestionStat = {
  question: string
  frequencies: Array<{ name: string; value: number; percentage: string }>
  mode: string
  average: number
  stdDev: number
  consensus: string
  satisfactionTrend: string
  total: number
  validResponses: number
}

export function AdvancedStatisticsView() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [ponentes, setPonentes] = useState<any[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("all")
  const [selectedPonenteId, setSelectedPonenteId] = useState<string>("all")
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const filteredSurveys = useMemo(() => {
    if (selectedPonenteId === "all") return surveys
    return surveys.filter((survey) => survey.ponenteId === selectedPonenteId)
  }, [surveys, selectedPonenteId])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSurveyId && selectedSurveyId !== "all") {
      loadResponses(selectedSurveyId)
    }
  }, [selectedSurveyId])

  useEffect(() => {
    if (selectedSurveyId === "all" && filteredSurveys.length > 0) {
      loadAllResponses(filteredSurveys.map((s) => s.id))
    } else if (selectedSurveyId === "all" && filteredSurveys.length === 0) {
      setResponses([])
    }
  }, [selectedSurveyId, filteredSurveys])

  const loadData = async () => {
    setLoading(true)
    try {
      const [surveysData, ponentesData] = await Promise.all([getAllSurveys(), getPonentes()])
      setSurveys(surveysData)
      setPonentes(ponentesData)
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (surveyId: string) => {
    setLoading(true)
    try {
      const data = await getSurveyResponses(surveyId)
      const respuestasArray = data?.respuestas || []
      setResponses(Array.isArray(respuestasArray) ? respuestasArray : [])
      console.log("[v0] Respuestas cargadas:", respuestasArray.length)
    } catch (error) {
      console.error("Error cargando respuestas:", error)
      setResponses([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllResponses = async (surveyIds: string[]) => {
    if (surveyIds.length === 0) {
      setResponses([])
      return
    }
    setLoading(true)
    try {
      const arrays = await Promise.all(
        surveyIds.map(async (id) => {
          const data = await getSurveyResponses(id)
          return data?.respuestas || []
        }),
      )
      const all = arrays.flat()
      setResponses(all)
      console.log("[v0] Respuestas agregadas:", all.length)
    } catch (error) {
      console.error("Error cargando respuestas agregadas:", error)
      setResponses([])
    } finally {
      setLoading(false)
    }
  }

  const selectedSurvey = selectedSurveyId === "all" ? null : surveys.find((s) => s.id === selectedSurveyId)

  useEffect(() => {
    if (selectedPonenteId !== "all" && filteredSurveys.length > 0) {
      const currentSurveyInFilter = filteredSurveys.find((s) => s.id === selectedSurveyId)
      if (!currentSurveyInFilter) {
        setSelectedSurveyId(filteredSurveys[0].id)
      }
    }
  }, [selectedPonenteId, filteredSurveys, selectedSurveyId])

  const statistics = useMemo(() => {
    const templateSurvey = selectedSurveyId === "all" ? filteredSurveys[0] : selectedSurvey
    if (!templateSurvey || !templateSurvey.preguntas || !Array.isArray(responses) || responses.length === 0) {
      return null
    }

    console.log("[v0] Calculando estadísticas con", responses.length, "respuestas reales")

    const questions = templateSurvey.preguntas || []
    const questionStats: QuestionStat[] = questions.map((question: any, index: number) => {
      const frequencies: Record<string, number> = {}
      let total = 0
      let sum = 0
      let validResponses = 0
      const values: number[] = []

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
            values.push(value)
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

      let stdDev = 0
      if (validResponses > 1 && values.length > 0) {
        const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / (validResponses - 1)
        stdDev = Math.sqrt(variance)
      }

      let consensus = "Medio"
      if (stdDev < 0.5) consensus = "Alto consenso"
      else if (stdDev < 1.0) consensus = "Consenso moderado"
      else if (stdDev < 1.5) consensus = "Opiniones divididas"
      else consensus = "Alta dispersión"

      const positiveResponses = Object.entries(frequencies).reduce((acc, [key, count]) => {
        const value = SCALE_VALUES[key.toLowerCase()]
        return value && value >= 4 ? acc + count : acc
      }, 0)
      const satisfactionTrend = total > 0 ? ((positiveResponses / total) * 100).toFixed(1) : "0"

      return {
        question: question.texto,
        frequencies: frequencyData,
        mode: mode.charAt(0).toUpperCase() + mode.slice(1),
        average: average,
        stdDev: stdDev,
        consensus: consensus,
        satisfactionTrend: satisfactionTrend,
        total,
        validResponses,
      }
    })

    const validAverages = questionStats.filter((stat) => stat.validResponses > 0)
    const overallAverage =
      validAverages.length > 0 ? validAverages.reduce((acc, stat) => acc + stat.average, 0) / validAverages.length : 0

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
      .filter((stat) => stat.validResponses > 0)
      .slice(0, 6)
      .map((stat, index) => ({
        subject: `P${questionStats.indexOf(stat) + 1}`,
        value: Number(stat.average.toFixed(2)),
        fullMark: 5,
      }))

    const comparisonData = questionStats
      .filter((stat) => stat.validResponses > 0)
      .map((stat, index) => ({
        pregunta: `Pregunta ${questionStats.indexOf(stat) + 1}`,
        promedio: Number(stat.average.toFixed(2)),
      }))

    const trendData = questionStats
      .filter((stat) => stat.validResponses > 0)
      .map((stat, index) => ({
        pregunta: `P${questionStats.indexOf(stat) + 1}`,
        satisfaccion: Number(stat.satisfactionTrend),
      }))

    console.log("[v0] Estadísticas calculadas:", {
      questionStats: questionStats.length,
      overallAverage,
      totalResponses: responses.length,
    })

    return {
      questionStats,
      overallAverage: overallAverage.toFixed(2),
      totalResponses: responses.length,
      expectationsPercentage,
      radarData,
      comparisonData,
      trendData,
    }
  }, [selectedSurvey, selectedSurveyId, filteredSurveys, responses])

  const getQualitativeRating = (score: number) => {
    if (score >= 4.5) return { text: "Excelente", color: "text-green-600", bg: "bg-green-50" }
    if (score >= 4.0) return { text: "Muy Bueno", color: "text-blue-600", bg: "bg-blue-50" }
    if (score >= 3.5) return { text: "Bueno", color: "text-emerald-600", bg: "bg-emerald-50" }
    if (score >= 3.0) return { text: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (score >= 2.0) return { text: "Regular", color: "text-orange-600", bg: "bg-orange-50" }
    return { text: "Deficiente", color: "text-red-600", bg: "bg-red-50" }
  }

  if (loading && surveys.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Cargando estadísticas...</p>
        </div>
      </div>
    )
  }

  if (surveys.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No hay encuestas disponibles</p>
        </div>
      </div>
    )
  }

  if (filteredSurveys.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Análisis Estadístico Avanzado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filtrar por Ponente</label>
              <Select value={selectedPonenteId} onValueChange={setSelectedPonenteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los ponentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ponentes</SelectItem>
                  {ponentes.map((ponente) => (
                    <SelectItem key={ponente.id} value={ponente.id}>
                      {ponente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay encuestas para el ponente seleccionado</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Análisis Estadístico Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Filtrar por Ponente</label>
              <Select value={selectedPonenteId} onValueChange={setSelectedPonenteId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los ponentes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ponentes</SelectItem>
                  {ponentes.map((ponente) => (
                    <SelectItem key={ponente.id} value={ponente.id}>
                      {ponente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Seleccionar Encuesta</label>
              <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una encuesta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todas las encuestas ({filteredSurveys.reduce((acc, s) => acc + (s.respuestas || 0), 0)} respondidas)
                  </SelectItem>
                  {filteredSurveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.titulo} ({survey.respuestas || 0} respuestas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )}

      {!loading && (!statistics || statistics.totalResponses === 0) && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No hay respuestas disponibles para esta encuesta</p>
          </div>
        </div>
      )}

      {!loading && statistics && statistics.totalResponses > 0 && (
        <>
          <Card className="border-2 border-emerald-500 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                Calificación General del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Gauge Visual */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="96" cy="96" r="80" stroke="#e5e7eb" strokeWidth="16" fill="none" />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#10b981"
                        strokeWidth="16"
                        fill="none"
                        strokeDasharray={`${(Number.parseFloat(statistics.overallAverage) / 5) * 502.4} 502.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-emerald-600">{statistics.overallAverage}</div>
                      <div className="text-sm text-gray-500">de 5.0</div>
                    </div>
                  </div>
                  <div
                    className={`mt-4 px-4 py-2 rounded-full ${getQualitativeRating(Number.parseFloat(statistics.overallAverage)).bg}`}
                  >
                    <span
                      className={`text-lg font-semibold ${getQualitativeRating(Number.parseFloat(statistics.overallAverage)).color}`}
                    >
                      {getQualitativeRating(Number.parseFloat(statistics.overallAverage)).text}
                    </span>
                  </div>
                </div>

                {/* Métricas Clave */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-sm font-medium text-blue-700">Porcentaje de Satisfacción</div>
                    </div>
                    <div className="text-4xl font-bold text-blue-900">
                      {((Number.parseFloat(statistics.overallAverage) / 5) * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Basado en promedio general</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-500 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-sm font-medium text-green-700">Expectativas Cumplidas</div>
                    </div>
                    <div className="text-4xl font-bold text-green-900">{statistics.expectationsPercentage}%</div>
                    <div className="text-xs text-green-600 mt-1">De los asistentes</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-sm font-medium text-purple-700">Total de Respuestas</div>
                    </div>
                    <div className="text-4xl font-bold text-purple-900">{statistics.totalResponses}</div>
                    <div className="text-xs text-purple-600 mt-1">Participantes evaluados</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-orange-500 rounded-lg">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-sm font-medium text-orange-700">Nivel de Calidad</div>
                    </div>
                    <div className="text-4xl font-bold text-orange-900">
                      {statistics.questionStats.filter((s: any) => s.average >= 4).length}
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      De {statistics.questionStats.length} aspectos evaluados
                    </div>
                  </div>
                </div>
              </div>

              {/* Interpretación */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-2">Interpretación de Resultados</h4>
                <p className="text-sm text-gray-600">
                  {Number.parseFloat(statistics.overallAverage) >= 4.5 &&
                    "El evento ha sido evaluado de manera excepcional. Los asistentes muestran un alto nivel de satisfacción en todos los aspectos evaluados."}
                  {Number.parseFloat(statistics.overallAverage) >= 4.0 &&
                    Number.parseFloat(statistics.overallAverage) < 4.5 &&
                    "El evento ha recibido una evaluación muy positiva. La mayoría de los aspectos han cumplido o superado las expectativas de los asistentes."}
                  {Number.parseFloat(statistics.overallAverage) >= 3.5 &&
                    Number.parseFloat(statistics.overallAverage) < 4.0 &&
                    "El evento ha sido bien recibido en general. Existen oportunidades de mejora en algunos aspectos específicos."}
                  {Number.parseFloat(statistics.overallAverage) >= 3.0 &&
                    Number.parseFloat(statistics.overallAverage) < 3.5 &&
                    "El evento ha cumplido con un nivel aceptable. Se recomienda revisar los aspectos con menor valoración para futuras mejoras."}
                  {Number.parseFloat(statistics.overallAverage) < 3.0 &&
                    "El evento requiere atención en varios aspectos. Se recomienda un análisis detallado de las áreas con menor valoración."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resumen General */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Respuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">{statistics.totalResponses}</div>
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
                <div className="text-3xl font-bold text-blue-600">{statistics.overallAverage}/5</div>
                <div className="text-xs text-gray-500 mt-1">
                  {((Number.parseFloat(statistics.overallAverage) / 5) * 100).toFixed(0)}% de satisfacción
                </div>
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
                <div className="text-3xl font-bold text-purple-600">
                  {((Number.parseFloat(statistics.overallAverage) / 5) * 100).toFixed(0)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Expectativas Cumplidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{statistics.expectationsPercentage}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Comparación entre Preguntas - Radar Chart */}
          {statistics.radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  Comparación de Promedios por Pregunta
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Visualización comparativa de las valoraciones promedio de cada pregunta
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
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

          {/* Comparación de Promedios - Barras Horizontales */}
          {statistics.comparisonData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Comparación de Aspectos Evaluados
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Identifica qué aspectos fueron mejor o peor valorados (expositor, refrigerio, etc.)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statistics.comparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} />
                    <YAxis dataKey="pregunta" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="promedio" fill="#3b82f6" name="Promedio" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tendencia de Satisfacción */}
          {statistics.trendData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Tendencia de Satisfacción
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Porcentaje de valoraciones positivas (Bueno/Excelente) por pregunta
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={statistics.trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="pregunta" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="satisfaccion"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      name="% Satisfacción"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Estadísticas Detalladas por Pregunta */}
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
                      <>
                        <Badge variant="secondary">Promedio: {stat.average.toFixed(2)}/5</Badge>
                        <Badge variant="outline">σ: {stat.stdDev.toFixed(2)}</Badge>
                        <Badge
                          variant={
                            stat.consensus === "Alto consenso"
                              ? "default"
                              : stat.consensus === "Alta dispersión"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {stat.consensus}
                        </Badge>
                      </>
                    )}
                    <Badge variant="outline">Respuestas: {stat.total}</Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Barras */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3">Frecuencias Absolutas</h4>
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
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
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

                {/* Métricas Estadísticas */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 mb-1">Desviación Estándar</div>
                    <div className="text-2xl font-bold text-blue-900">{stat.stdDev.toFixed(2)}</div>
                    <div className="text-xs text-blue-600 mt-1">{stat.consensus}</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-green-700 mb-1">Tendencia Positiva</div>
                    <div className="text-2xl font-bold text-green-900">{stat.satisfactionTrend}%</div>
                    <div className="text-xs text-green-600 mt-1">Bueno/Excelente</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-700 mb-1">Media Ponderada</div>
                    <div className="text-2xl font-bold text-purple-900">{stat.average.toFixed(2)}/5</div>
                    <div className="text-xs text-purple-600 mt-1">
                      {((stat.average / 5) * 100).toFixed(0)}% satisfacción
                    </div>
                  </div>
                </div>

                {/* Tabla de Frecuencias */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Tabla de Frecuencias</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700 border">Respuesta</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700 border">Frecuencia Absoluta</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-700 border">Frecuencia Relativa</th>
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
        </>
      )}
    </div>
  )
}
