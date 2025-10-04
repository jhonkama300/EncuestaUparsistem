"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createSurvey, type SurveyQuestion } from "@/lib/surveys"
import { GoogleFormsSurveyEditor } from "./google-forms-survey-editor"
import { SurveyAssignmentSelector } from "./survey-assignment-selector"
import { ClipboardList, Users, CheckCircle } from "lucide-react"

interface CreateSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateSurveyDialog({ open, onOpenChange, onSuccess }: CreateSurveyDialogProps) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [preguntas, setPreguntas] = useState<SurveyQuestion[]>([
    {
      id: "q-1",
      texto: "",
      tipo: "opcion_multiple",
      opciones: ["Opción 1"],
      requerida: false,
    },
  ])
  const [ponenteId, setPonente] = useState("")
  const [grupos, setGrupos] = useState<any[]>([])
  const [estudiantesIndividuales, setEstudiantesIndividuales] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("preguntas")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await createSurvey({
        titulo,
        descripcion,
        preguntas,
        ponenteId,
        asignacion: {
          tipo:
            grupos.length > 0 && estudiantesIndividuales.length > 0
              ? "mixto"
              : grupos.length > 0
                ? "grupos"
                : "individual",
          grupos,
          estudiantesIndividuales,
        },
        activa: true,
        fechaCreacion: new Date().toISOString(),
      })

      // Reset form
      setTitulo("")
      setDescripcion("")
      setPreguntas([
        {
          id: "q-1",
          texto: "",
          tipo: "opcion_multiple",
          opciones: ["Opción 1"],
          requerida: false,
        },
      ])
      setPonente("")
      setGrupos([])
      setEstudiantesIndividuales([])
      setActiveTab("preguntas")

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error creando encuesta:", error)
    } finally {
      setSaving(false)
    }
  }

  const totalEstudiantes = estudiantesIndividuales.length + grupos.reduce((acc, g) => acc + (g.count || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-6xl flex flex-col p-0 overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Crear Nueva Encuesta
          </DialogTitle>
          <DialogDescription className="text-emerald-50">
            Diseña tu encuesta y asígnala a un ponente para que los estudiantes lo evalúen
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="px-6 pt-4 border-b sticky top-[120px] bg-white z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                <TabsTrigger value="preguntas" className="gap-2 py-3">
                  <ClipboardList className="h-4 w-4" />
                  <span>Preguntas</span>
                  <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                    {preguntas.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger value="asignacion" className="gap-2 py-3">
                  <Users className="h-4 w-4" />
                  <span>Asignación</span>
                  {totalEstudiantes > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {totalEstudiantes}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1">
            <Tabs value={activeTab} className="h-full flex flex-col">
              <TabsContent value="preguntas" className="px-6 py-4 mt-0">
                <GoogleFormsSurveyEditor
                  titulo={titulo}
                  descripcion={descripcion}
                  preguntas={preguntas}
                  onTituloChange={setTitulo}
                  onDescripcionChange={setDescripcion}
                  onPreguntasChange={setPreguntas}
                />
              </TabsContent>

              <TabsContent value="asignacion" className="px-6 py-4 mt-0">
                <SurveyAssignmentSelector
                  ponenteId={ponenteId}
                  grupos={grupos}
                  estudiantesIndividuales={estudiantesIndividuales}
                  onPonenteChange={setPonente}
                  onGruposChange={setGrupos}
                  onEstudiantesIndividualesChange={setEstudiantesIndividuales}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t bg-gray-50 px-6 py-4 sticky bottom-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-emerald-600" />
                  <span>
                    <strong className="text-emerald-700">{preguntas.length}</strong> preguntas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span>
                    <strong className="text-emerald-700">{totalEstudiantes}</strong> estudiantes asignados
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !titulo || preguntas.length === 0 || !ponenteId || totalEstudiantes === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                  size="lg"
                >
                  {saving ? (
                    "Creando..."
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Crear Encuesta
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
