"use client"

import type React from "react"

import { useState } from "react"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(responses)
  }

  const updateResponse = (preguntaIndex: number, value: string) => {
    setResponses({ ...responses, [preguntaIndex]: value })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="text-white">
            <h1 className="text-2xl font-bold">{survey.titulo}</h1>
            <p className="text-sm text-emerald-100">{user.nombre}</p>
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

      <main className="container mx-auto max-w-3xl p-4 py-8">
        <Button onClick={onBack} variant="ghost" className="mb-4 gap-2 text-emerald-700">
          <ArrowLeft className="h-4 w-4" />
          Volver a mis encuestas
        </Button>

        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-800">{survey.titulo}</CardTitle>
            <CardDescription>{survey.descripcion}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {survey.preguntas?.map((pregunta: any, index: number) => (
                <div key={index} className="space-y-3 rounded-lg border border-emerald-100 bg-white p-4">
                  <Label className="text-base font-semibold text-gray-800">
                    {index + 1}. {pregunta.texto}
                  </Label>

                  {pregunta.tipo === "opcion_multiple" && (
                    <RadioGroup value={responses[index] || ""} onValueChange={(value) => updateResponse(index, value)}>
                      {["Excelente", "Bueno", "Regular", "Malo"].map((opcion) => (
                        <div key={opcion} className="flex items-center space-x-2">
                          <RadioGroupItem value={opcion.toLowerCase()} id={`p${index}-${opcion}`} />
                          <Label htmlFor={`p${index}-${opcion}`} className="font-normal">
                            {opcion}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {pregunta.tipo === "escala" && (
                    <RadioGroup value={responses[index] || ""} onValueChange={(value) => updateResponse(index, value)}>
                      <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div key={num} className="flex flex-col items-center">
                            <RadioGroupItem value={num.toString()} id={`p${index}-${num}`} />
                            <Label htmlFor={`p${index}-${num}`} className="mt-1 font-normal">
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
                    />
                  )}

                  {pregunta.tipo === "texto_largo" && (
                    <Textarea
                      value={responses[index] || ""}
                      onChange={(e) => updateResponse(index, e.target.value)}
                      placeholder="Tu respuesta..."
                      rows={4}
                    />
                  )}
                </div>
              ))}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
                disabled={Object.keys(responses).length < (survey.preguntas?.length || 0)}
              >
                Enviar Encuesta
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
