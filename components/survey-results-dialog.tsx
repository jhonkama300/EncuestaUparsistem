"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getSurveyResponses } from "@/lib/surveys"
import { Users, Calendar, CheckCircle2, ChevronDown, ChevronUp, User } from "lucide-react"

interface SurveyResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  surveyTitle: string
}

export function SurveyResultsDialog({ open, onOpenChange, surveyId, surveyTitle }: SurveyResultsDialogProps) {
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedResponses, setExpandedResponses] = useState<Set<string>>(new Set())
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([])

  useEffect(() => {
    if (open && surveyId) {
      loadResponses()
    }
  }, [open, surveyId])

  const loadResponses = async () => {
    setLoading(true)
    try {
      const data = await getSurveyResponses(surveyId)
      console.log("[v0] Respuestas cargadas en el componente:", data)
      setResponses(data.respuestas || [])
      setSurveyQuestions((data.encuesta as any)?.preguntas || [])
    } catch (error) {
      console.error("Error cargando respuestas:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (responseId: string) => {
    setExpandedResponses((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(responseId)) {
        newSet.delete(responseId)
      } else {
        newSet.add(responseId)
      }
      return newSet
    })
  }

  const renderAnswer = (question: any, answer: any) => {
    console.log("[v0] Renderizando respuesta - Pregunta:", question.id, "Respuesta:", answer)

    if (!answer && answer !== 0) return <span className="text-gray-400 italic">Sin respuesta</span>

    switch (question.tipo) {
      case "escala":
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    num <= answer ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
            <span className="text-emerald-700 font-semibold">{answer}/5</span>
          </div>
        )
      case "checkbox":
        return (
          <div className="flex flex-wrap gap-2">
            {Array.isArray(answer) ? (
              answer.map((item: string, idx: number) => (
                <span key={idx} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                  {item}
                </span>
              ))
            ) : (
              <span className="text-gray-700">{answer}</span>
            )}
          </div>
        )
      case "opcion_multiple":
        return <span className="text-gray-700 font-medium">{answer}</span>
      case "texto_corto":
      case "texto_largo":
        return <p className="text-gray-700 whitespace-pre-wrap">{answer}</p>
      default:
        return <span className="text-gray-700">{String(answer)}</span>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-emerald-800 text-3xl flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7" />
            Resultados de la Encuesta
          </DialogTitle>
          <DialogDescription className="text-lg">{surveyTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-3 text-base bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <Users className="h-6 w-6 text-emerald-600" />
            <span>
              <strong className="text-emerald-700 text-xl">{responses.length}</strong> estudiantes han respondido esta
              encuesta
            </span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600 text-lg">Cargando respuestas...</p>
              </CardContent>
            </Card>
          ) : responses.length === 0 ? (
            <Card className="border-emerald-200">
              <CardContent className="py-16 text-center">
                <Users className="mx-auto mb-6 h-16 w-16 text-emerald-400" />
                <h3 className="mb-3 text-xl font-semibold text-gray-800">No hay respuestas aún</h3>
                <p className="text-gray-600 text-base">Ningún estudiante ha completado esta encuesta todavía</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {responses.map((response, index) => {
                const isExpanded = expandedResponses.has(response.id)
                return (
                  <Card key={response.id} className="border-emerald-200 hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-xl">{response.nombreEstudiante}</h4>
                              <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-2">
                                <span className="bg-gray-100 px-3 py-1 rounded">Doc: {response.documento}</span>
                                {response.grupoEstudiante !== "N/A" && (
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
                                    Grupo: {response.grupoEstudiante}
                                  </span>
                                )}
                                {response.programaEstudiante !== "N/A" && (
                                  <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded">
                                    {response.programaEstudiante}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="h-4 w-4" />
                            {new Date(response.fechaRespuesta).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="default"
                            onClick={() => toggleExpanded(response.id)}
                            className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-5 w-5" />
                                Ocultar
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-5 w-5" />
                                Respuestas
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 border-t border-emerald-100">
                        <div className="space-y-5 mt-5">
                          {surveyQuestions.map((question, qIndex) => {
                            const answer = response.respuestas?.[qIndex]
                            console.log(
                              "[v0] Pregunta índice:",
                              qIndex,
                              "ID:",
                              question.id,
                              "Respuesta:",
                              answer,
                              "Todas las respuestas:",
                              response.respuestas,
                            )
                            return (
                              <div key={question.id} className="bg-gray-50 p-5 rounded-lg">
                                <div className="flex items-start gap-3 mb-3">
                                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center font-semibold">
                                    {qIndex + 1}
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 mb-3 text-base">{question.texto}</p>
                                    <div className="ml-0">{renderAnswer(question, answer)}</div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
