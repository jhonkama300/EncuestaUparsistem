"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { getSurveyResponses } from "@/lib/surveys"
import { Users, Calendar, CheckCircle2 } from "lucide-react"

interface SurveyResultsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  surveyTitle: string
}

export function SurveyResultsDialog({ open, onOpenChange, surveyId, surveyTitle }: SurveyResultsDialogProps) {
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (open && surveyId) {
      loadResponses()
    }
  }, [open, surveyId])

  const loadResponses = async () => {
    setLoading(true)
    try {
      const data = await getSurveyResponses(surveyId)
      setResponses(data)
    } catch (error) {
      console.error("Error cargando respuestas:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-emerald-800 text-xl flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Resultados de la Encuesta
          </DialogTitle>
          <DialogDescription>{surveyTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-emerald-600" />
            <span>
              <strong className="text-emerald-700">{responses.length}</strong> estudiantes han respondido
            </span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-gray-600">Cargando respuestas...</p>
              </CardContent>
            </Card>
          ) : responses.length === 0 ? (
            <Card className="border-emerald-200">
              <CardContent className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-800">No hay respuestas aún</h3>
                <p className="text-gray-600">Ningún estudiante ha completado esta encuesta todavía</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {responses.map((response, index) => (
                <Card key={response.id} className="border-emerald-100">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <h4 className="font-semibold text-gray-800">{response.nombreEstudiante}</h4>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-600">
                          <span>Documento: {response.documento}</span>
                          <span>•</span>
                          <span>Grupo: {response.grupoEstudiante}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(response.fechaRespuesta).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
