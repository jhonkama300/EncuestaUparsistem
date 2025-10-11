"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllSurveys, getSurveyResponses } from "@/lib/surveys"
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
import { TrendingUp, Users, Award, CheckCircle, BarChart3, Activity, Target } from "lucide-react"

const SCALE_VALUES: Record<string, number> = {
  excelente: 5,
  bueno: 4,
  aceptable: 3,
  regular: 2,
  malo: 1,
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

export function AdvancedStatisticsView() {
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("")
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSurveys()
  }, [])

  useEffect(() => {
    if (selectedSurveyId) {
      loadResponses(selectedSurveyId)
    }
  }, [selectedSurveyId])

  const loadSurveys = async () => {
    setLoading(true)
    try {
      const data = await getAllSurveys()
      setSurveys(data)
      if (data.length > 0) {
        setSelectedSurveyId(data[0].id)
      }
    } catch (error) {
      console.error("[v0] Error cargando encuestas:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (surveyId: string) => {
    setLoading(true)
    try {
      const data = await getSurveyResponses(surveyId)
      console.log("[v0] Respuestas cargadas:", data)
      setResponses(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("[v0] Error cargando respuestas:", error)
      setResponses([])
    } finally {
      setLoading(false)
    }
  }

  const selectedSurvey = surveys.find((s) => s.id === selectedSurveyId)

  const statistics = useMemo(() => {
    if (!selectedSurvey || !selectedSurvey.preguntas || !Array.isArray(responses) || responses.length === 0) {
      return null
    }

    const questions = selectedSurvey.preguntas || []
    const questionStats = questions.map((question: any, index: number) => {
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

      // Calcular desviación estándar
      let stdDev = 0
      if (validResponses > 1 && values.length > 0) {
        const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / (validResponses - 1)
        stdDev = Math.sqrt(variance)
      }

      // Determinar consenso
      let consensus = "Medio"
      if (stdDev < 0.5) consensus = "Alto consenso"
      else if (stdDev < 1.0) consensus = "Consenso moderado"
      else if (stdDev < 1.5) consensus = "Opiniones divididas"
      else consensus = "Alta dispersión"

      // Tendencia de satisfacción
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

    // Calcular porcentaje de cumplimiento de expectativas
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

    // Datos para radar chart (comparación entre preguntas)
    const radarData = questionStats
      .filter((stat) => stat.validResponses > 0)
      .slice(0, 6)
      .map((stat, index) => ({
        subject: `P${questionStats.indexOf(stat) + 1}`,
        value: Number(stat.average.toFixed(2)),
        fullMark: 5,
      }))

    // Datos para comparación de promedios (gráfico de barras horizontal)
    const comparisonData = questionStats
      .filter((stat) => stat.validResponses > 0)
      .map((stat, index) => ({
        pregunta: `Pregunta ${questionStats.indexOf(stat) + 1}`,
        promedio: Number(stat.average.toFixed(2)),
      }))

    // Datos para tendencia de satisfacción
    const trendData = questionStats
      .filter((stat) => stat.validResponses > 0)
      .map((stat, index) => ({
        pregunta: `P${questionStats.indexOf(stat) + 1}`,
        satisfaccion: Number(stat.satisfactionTrend),
      }))

    return {
      questionStats,
      overallAverage: overallAverage.toFixed(2),
      totalResponses: responses.length,
      expectationsPercentage,
      radarData,
      comparisonData,
      trendData,
    }
  }, [selectedSurvey, responses])

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

  return (
    <div className="space-y-6">
      {/* Selector de Encuesta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Análisis Estadístico Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Seleccionar Encuesta</label>
            <Select value={selectedSurveyId} onValueChange={setSelectedSurveyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una encuesta" />
              </SelectTrigger>
              <SelectContent>
                {surveys.map((survey) => (
                  <SelectItem key={survey.id} value={survey.id}>
                    {survey.titulo} ({survey.respuestas || 0} respuestas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
