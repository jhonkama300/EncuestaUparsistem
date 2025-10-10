"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, LogOut } from "lucide-react"
import type { UserData } from "@/lib/auth"

interface SurveyFormProps {
  survey: any
  user: UserData
  onSubmit: (responses: any) => void
  onBack: () => void
  onLogout: () => void
}

export function SurveyForm({ survey, user, onSubmit, onBack, onLogout }: SurveyFormProps) {
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmittingRef.current || isSubmitting) {
      console.log("[v0] Envío ya en proceso, ignorando clic adicional")
      return
    }

    const totalPreguntas = survey.preguntas?.length || 0
    const respuestasCompletas = Object.keys(responses).length

    if (respuestasCompletas < totalPreguntas) {
      console.log("[v0] Faltan preguntas por responder")
      return
    }

    console.log("[v0] Iniciando envío de encuesta")
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      await onSubmit(responses)
      console.log("[v0] Encuesta enviada exitosamente")
    } catch (error) {
      console.error("[v0] Error enviando encuesta:", error)
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }

  const updateResponse = (preguntaIndex: number, value: string) => {
    setResponses({ ...responses, [preguntaIndex]: value })
  }

  const allQuestionsAnswered = Object.keys(responses).length >= (survey.preguntas?.length || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-3 sm:py-4">
          <div className="text-white flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">{survey.titulo}</h1>
            <p className="text-xs sm:text-sm text-emerald-100 truncate">{user.nombre}</p>
          </div>
          <Button
            variant="outline"
            onClick={onLogout}
            className="gap-2 border-white bg-white/10 text-white hover:bg-white/20 ml-2 text-xs sm:text-sm"
            size="sm"
            disabled={isSubmitting}
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <span className="sm:hidden">Salir</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl p-3 sm:p-4 py-4 sm:py-8">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-3 sm:mb-4 gap-2 text-emerald-700 text-sm"
          disabled={isSubmitting}
        >
          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          Volver a mis encuestas
        </Button>

        <Card className="border-emerald-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-emerald-800 text-lg sm:text-xl">{survey.titulo}</CardTitle>
            <CardDescription className="text-sm">{survey.descripcion}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {survey.preguntas?.map((pregunta: any, index: number) => (
                <div key={index} className="space-y-3 rounded-lg border border-emerald-100 bg-white p-3 sm:p-4">
                  <Label className="text-sm sm:text-base font-semibold text-gray-800">
                    {index + 1}. {pregunta.texto}
                  </Label>

                  {pregunta.tipo === "opcion_multiple" && (
                    <RadioGroup
                      value={responses[index] || ""}
                      onValueChange={(value) => updateResponse(index, value)}
                      disabled={isSubmitting}
                    >
                      {["Excelente", "Bueno", "Regular", "Malo"].map((opcion) => (
                        <div key={opcion} className="flex items-center space-x-2">
                          <RadioGroupItem value={opcion.toLowerCase()} id={`p${index}-${opcion}`} />
                          <Label htmlFor={`p${index}-${opcion}`} className="font-normal text-sm sm:text-base">
                            {opcion}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {pregunta.tipo === "escala" && (
                    <RadioGroup
                      value={responses[index] || ""}
                      onValueChange={(value) => updateResponse(index, value)}
                      disabled={isSubmitting}
                    >
                      <div className="flex gap-2 sm:gap-4 justify-center">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div key={num} className="flex flex-col items-center">
                            <RadioGroupItem value={num.toString()} id={`p${index}-${num}`} />
                            <Label htmlFor={`p${index}-${num}`} className="mt-1 font-normal text-xs sm:text-sm">
                              {num}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  )}

                  {pregunta.tipo === "texto_corto" && (
                    <Input
                      value={responses[index] || ""}
                      onChange={(e) => updateResponse(index, e.target.value)}
                      placeholder="Tu respuesta..."
                      className="text-sm sm:text-base"
                      disabled={isSubmitting}
                    />
                  )}

                  {pregunta.tipo === "texto_largo" && (
                    <Textarea
                      value={responses[index] || ""}
                      onChange={(e) => updateResponse(index, e.target.value)}
                      placeholder="Tu respuesta..."
                      rows={4}
                      className="text-sm sm:text-base"
                      disabled={isSubmitting}
                    />
                  )}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-sm sm:text-base"
                size="lg"
                disabled={!allQuestionsAnswered || isSubmitting}
              >
                {isSubmitting ? "Enviando encuesta..." : "Enviar Encuesta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
