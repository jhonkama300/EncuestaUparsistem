"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { X, GripVertical, Copy, Trash2, Type, ListChecks, AlignLeft, BarChart3, CheckSquare } from "lucide-react"
import type { SurveyQuestion } from "@/lib/surveys"

interface GoogleFormsSurveyEditorProps {
  titulo: string
  descripcion: string
  preguntas: SurveyQuestion[]
  onTituloChange: (value: string) => void
  onDescripcionChange: (value: string) => void
  onPreguntasChange: (preguntas: SurveyQuestion[]) => void
}

export function GoogleFormsSurveyEditor({
  titulo,
  descripcion,
  preguntas,
  onTituloChange,
  onDescripcionChange,
  onPreguntasChange,
}: GoogleFormsSurveyEditorProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)

  const DEFAULT_OPCIONES: Record<string, string[]> = {
    opcion_multiple: ["Excelente", "Bueno", "Aceptable", "Regular", "Malo"],
    checkbox: ["Sí", "No"],
  }

  const addQuestion = (tipo: SurveyQuestion["tipo"]) => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}`,
      texto: "",
      tipo,
      opciones: DEFAULT_OPCIONES[tipo] ? [...DEFAULT_OPCIONES[tipo]] : undefined,
      requerida: false,
    }
    onPreguntasChange([...preguntas, newQuestion])
    setSelectedQuestion(newQuestion.id)
  }

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    onPreguntasChange(preguntas.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const duplicateQuestion = (id: string) => {
    const question = preguntas.find((q) => q.id === id)
    if (question) {
      const newQuestion = { ...question, id: `q-${Date.now()}` }
      const index = preguntas.findIndex((q) => q.id === id)
      const newPreguntas = [...preguntas]
      newPreguntas.splice(index + 1, 0, newQuestion)
      onPreguntasChange(newPreguntas)
    }
  }

  const deleteQuestion = (id: string) => {
    onPreguntasChange(preguntas.filter((q) => q.id !== id))
    if (selectedQuestion === id) setSelectedQuestion(null)
  }

  const addOption = (questionId: string) => {
    const question = preguntas.find((q) => q.id === questionId)
    if (question && question.opciones) {
      updateQuestion(questionId, {
        opciones: [...question.opciones, `Opción ${question.opciones.length + 1}`],
      })
    }
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = preguntas.find((q) => q.id === questionId)
    if (question && question.opciones) {
      const newOpciones = [...question.opciones]
      newOpciones[optionIndex] = value
      updateQuestion(questionId, { opciones: newOpciones })
    }
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = preguntas.find((q) => q.id === questionId)
    if (question && question.opciones && question.opciones.length > 1) {
      updateQuestion(questionId, {
        opciones: question.opciones.filter((_, i) => i !== optionIndex),
      })
    }
  }

  const getQuestionIcon = (tipo: SurveyQuestion["tipo"]) => {
    switch (tipo) {
      case "opcion_multiple":
        return <ListChecks className="h-5 w-5" />
      case "checkbox":
        return <CheckSquare className="h-5 w-5" />
      case "texto_corto":
        return <Type className="h-5 w-5" />
      case "texto_largo":
        return <AlignLeft className="h-5 w-5" />
      case "escala":
        return <BarChart3 className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-8">
      {/* Encabezado de la encuesta */}
      <Card className="border-t-8 border-t-emerald-600">
        <CardHeader className="space-y-4">
          <Input
            value={titulo}
            onChange={(e) => onTituloChange(e.target.value)}
            placeholder="Título de la encuesta"
            className="text-3xl font-normal border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-600"
          />
          <Textarea
            value={descripcion}
            onChange={(e) => onDescripcionChange(e.target.value)}
            placeholder="Descripción de la encuesta"
            className="border-0 border-b border-gray-300 rounded-none px-0 resize-none focus-visible:ring-0 focus-visible:border-emerald-600"
            rows={2}
          />
        </CardHeader>
      </Card>

      {/* Preguntas */}
      {preguntas.map((pregunta, index) => (
        <Card
          key={pregunta.id}
          className={`transition-all ${selectedQuestion === pregunta.id ? "ring-2 ring-emerald-600 border-emerald-600" : ""}`}
          onClick={() => setSelectedQuestion(pregunta.id)}
        >
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Encabezado de pregunta */}
              <div className="flex items-start gap-3">
                <GripVertical className="h-5 w-5 text-gray-400 mt-2 cursor-move" />
                <div className="flex-1 space-y-4">
                  <div className="flex items-start gap-3">
                    <Input
                      value={pregunta.texto}
                      onChange={(e) => updateQuestion(pregunta.id, { texto: e.target.value })}
                      placeholder={`Pregunta ${index + 1}`}
                      className="flex-1 border-0 border-b border-gray-300 rounded-none px-0 focus-visible:ring-0 focus-visible:border-emerald-600"
                    />
                    <Select
                      value={pregunta.tipo}
                      onValueChange={(value: SurveyQuestion["tipo"]) => {
                        const updates: Partial<SurveyQuestion> = { tipo: value }
                        if (value === "opcion_multiple" || value === "checkbox") {
                          updates.opciones = [...(DEFAULT_OPCIONES[value] ?? ["Opción 1"])]
                        } else {
                          updates.opciones = undefined
                        }
                        updateQuestion(pregunta.id, updates)
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <div className="flex items-center gap-2">
                          {getQuestionIcon(pregunta.tipo)}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opcion_multiple">
                          <div className="flex items-center gap-2">
                            <ListChecks className="h-4 w-4" />
                            Opción múltiple
                          </div>
                        </SelectItem>
                        <SelectItem value="checkbox">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" />
                            Si, No y ¿Por qué?
                          </div>
                        </SelectItem>
                        <SelectItem value="texto_corto">
                          <div className="flex items-center gap-2">
                            <Type className="h-4 w-4" />
                            Respuesta corta
                          </div>
                        </SelectItem>
                        <SelectItem value="texto_largo">
                          <div className="flex items-center gap-2">
                            <AlignLeft className="h-4 w-4" />
                            Párrafo
                          </div>
                        </SelectItem>
                        <SelectItem value="escala">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Escala lineal
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Opciones de respuesta */}
                  {(pregunta.tipo === "opcion_multiple" || pregunta.tipo === "checkbox") && pregunta.opciones && (
                    <div className="space-y-2 ml-6">
                      {pregunta.opciones.map((opcion, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                          <Input
                            value={opcion}
                            onChange={(e) => updateOption(pregunta.id, optIndex, e.target.value)}
                            className="flex-1 border-0 border-b border-gray-300 rounded-none px-2 focus-visible:ring-0 focus-visible:border-emerald-600"
                          />
                          {pregunta.opciones && pregunta.opciones.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeOption(pregunta.id, optIndex)}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(pregunta.id)}
                        className="ml-6 text-gray-600"
                      >
                        Agregar opción
                      </Button>
                    </div>
                  )}

                  {pregunta.tipo === "texto_corto" && (
                    <div className="ml-6">
                      <Input disabled placeholder="Respuesta de texto corto" className="max-w-md" />
                    </div>
                  )}

                  {pregunta.tipo === "texto_largo" && (
                    <div className="ml-6">
                      <Textarea disabled placeholder="Respuesta de texto largo" className="max-w-md" rows={3} />
                    </div>
                  )}

                  {pregunta.tipo === "escala" && (
                    <div className="ml-6 flex items-center gap-4">
                      <span className="text-sm text-gray-600">1</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <div
                            key={num}
                            className="w-8 h-8 rounded-full border-2 border-gray-300 flex items-center justify-center text-sm"
                          >
                            {num}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">5</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones de pregunta */}
              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={pregunta.requerida}
                    onCheckedChange={(checked) => updateQuestion(pregunta.id, { requerida: checked as boolean })}
                  />
                  <Label className="text-sm cursor-pointer">Obligatoria</Label>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => duplicateQuestion(pregunta.id)}
                    title="Duplicar"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteQuestion(pregunta.id)}
                    title="Eliminar"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Botones para agregar preguntas */}
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuestion("opcion_multiple")}
              className="gap-2"
            >
              <ListChecks className="h-4 w-4" />
              Opción múltiple
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("checkbox")} className="gap-2">
              <CheckSquare className="h-4 w-4" />
              Si, No y ¿Por qué?
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuestion("texto_corto")}
              className="gap-2"
            >
              <Type className="h-4 w-4" />
              Respuesta corta
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuestion("texto_largo")}
              className="gap-2"
            >
              <AlignLeft className="h-4 w-4" />
              Párrafo
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("escala")} className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Escala lineal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
