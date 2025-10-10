"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createSurvey, updateSurvey, type SurveyQuestion } from "@/lib/surveys"
import { GoogleFormsSurveyEditor } from "./google-forms-survey-editor"
import { SurveyAssignmentSelector } from "./survey-assignment-selector"
import { ClipboardList, Users, CheckCircle, Calendar, Clock, FileText, Save } from "lucide-react"
import { getUniqueStudentValues } from "@/lib/students"
import { CreateTemplateDialog } from "./create-template-dialog"
import { SurveyTemplateManager } from "./survey-template-manager"
import { getTemplates } from "@/lib/survey-templates"
import { dateInputToLocalISO, localISOToDateInput } from "@/lib/date-utils"

interface CreateSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingSurvey?: any
}

export function CreateSurveyDialog({ open, onOpenChange, onSuccess, editingSurvey }: CreateSurveyDialogProps) {
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

  const [programa, setPrograma] = useState("")
  const [nivel, setNivel] = useState("")
  const [periodo, setPeriodo] = useState("")
  const [grupo, setGrupo] = useState("")
  const [fechaEncuesta, setFechaEncuesta] = useState("")
  const [horaInicio, setHoraInicio] = useState("")
  const [horaFin, setHoraFin] = useState("")

  const [uniqueValues, setUniqueValues] = useState({
    programas: [],
    niveles: [],
    periodos: [],
    grupos: [],
  })

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("preguntas")

  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)

  useEffect(() => {
    loadFilters()
  }, [])

  const loadFilters = async () => {
    const values = await getUniqueStudentValues()
    setUniqueValues(values)
  }

  useEffect(() => {
    if (editingSurvey && open) {
      setTitulo(editingSurvey.titulo || "")
      setDescripcion(editingSurvey.descripcion || "")
      setPreguntas(editingSurvey.preguntas || [])
      setPonente(editingSurvey.ponenteId || "")
      setGrupos(editingSurvey.asignacion?.grupos || [])
      setEstudiantesIndividuales(editingSurvey.asignacion?.estudiantesIndividuales || [])
      setPrograma(editingSurvey.programa || "")
      setNivel(editingSurvey.nivel || "")
      setPeriodo(editingSurvey.periodo || "")
      setGrupo(editingSurvey.grupo || "")
      setFechaEncuesta(editingSurvey.fechaEncuesta ? localISOToDateInput(editingSurvey.fechaEncuesta) : "")
      setHoraInicio(editingSurvey.horaInicio || "")
      setHoraFin(editingSurvey.horaFin || "")
    } else if (!open) {
      // Reset form when dialog closes
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
      setPrograma("")
      setNivel("")
      setPeriodo("")
      setGrupo("")
      setFechaEncuesta("")
      setHoraInicio("")
      setHoraFin("")
      setActiveTab("preguntas")
      setShowTemplateSelector(false)
    }
  }, [editingSurvey, open])

  const handleSelectTemplate = async (templateId: string) => {
    const templates = await getTemplates()
    const template = templates.find((t: any) => t.id === templateId)

    if (template) {
      setPreguntas(template.preguntas)
      if (!titulo) setTitulo(template.nombre)
      if (!descripcion) setDescripcion(template.descripcion)
      setShowTemplateSelector(false)
      setActiveTab("preguntas")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const gruposValidos = Array.isArray(grupos) ? grupos.filter((g) => g && typeof g === "object") : []
      const estudiantesValidos = Array.isArray(estudiantesIndividuales) ? estudiantesIndividuales.filter((e) => e) : []

      const surveyData: any = {
        titulo,
        descripcion,
        preguntas,
        ponenteId,
        asignacion: {
          tipo: gruposValidos.length > 0 ? "grupos" : "todos",
          grupos: gruposValidos,
          estudiantesIndividuales: estudiantesValidos,
        },
        activa: true,
        fechaCreacion: editingSurvey?.fechaCreacion || new Date().toISOString(),
      }

      if (programa && programa.trim() !== "") {
        surveyData.programa = programa.trim()
      }
      if (nivel && nivel.trim() !== "") {
        surveyData.nivel = nivel.trim()
      }
      if (periodo && periodo.trim() !== "") {
        surveyData.periodo = periodo.trim()
      }
      if (grupo && grupo.trim() !== "") {
        surveyData.grupo = grupo.trim()
      }
      if (fechaEncuesta && fechaEncuesta.trim() !== "") {
        surveyData.fechaEncuesta = dateInputToLocalISO(fechaEncuesta.trim())
      }
      if (horaInicio && horaInicio.trim() !== "") {
        surveyData.horaInicio = horaInicio.trim()
      }
      if (horaFin && horaFin.trim() !== "") {
        surveyData.horaFin = horaFin.trim()
      }

      if (editingSurvey && editingSurvey.id) {
        await updateSurvey(editingSurvey.id, surveyData)
      } else {
        await createSurvey(surveyData)
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error guardando encuesta:", error)
    } finally {
      setSaving(false)
    }
  }

  const totalEstudiantes = grupos.reduce((acc, g) => acc + (g.count || 0), 0)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[95vh] w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] lg:w-[85vw] lg:max-w-6xl xl:max-w-7xl flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-20">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <ClipboardList className="h-5 w-5 sm:h-6 sm:w-6" />
              {editingSurvey ? "Editar Encuesta" : "Crear Nueva Encuesta"}
            </DialogTitle>
            <DialogDescription className="text-emerald-50 text-sm">
              {editingSurvey
                ? "Actualiza la información de tu encuesta"
                : "Diseña tu encuesta y asígnala a un ponente para que los estudiantes lo evalúen"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 sm:px-6 pt-4 pb-2 border-b bg-white">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                  <TabsTrigger value="preguntas" className="gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                    <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Preguntas</span>
                    <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {preguntas.length}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="plantillas" className="gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Plantillas</span>
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Información</span>
                  </TabsTrigger>
                  <TabsTrigger value="asignacion" className="gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span>Asignación</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="preguntas" className="px-4 sm:px-6 py-4 sm:py-6 mt-0 h-full">
                  <div className="mb-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCreateTemplateDialogOpen(true)}
                      disabled={preguntas.length === 0 || !preguntas[0].texto}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar como Plantilla
                    </Button>
                  </div>
                  <GoogleFormsSurveyEditor
                    titulo={titulo}
                    descripcion={descripcion}
                    preguntas={preguntas}
                    onTituloChange={setTitulo}
                    onDescripcionChange={setDescripcion}
                    onPreguntasChange={setPreguntas}
                  />
                </TabsContent>

                <TabsContent value="plantillas" className="px-4 sm:px-6 py-4 sm:py-6 mt-0 h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-emerald-800">Plantillas Disponibles</h3>
                        <p className="text-sm text-gray-600">
                          Selecciona una plantilla para cargar sus preguntas en esta encuesta
                        </p>
                      </div>
                    </div>
                    <SurveyTemplateManager onSelectTemplate={handleSelectTemplate} />
                  </div>
                </TabsContent>

                <TabsContent value="info" className="px-4 sm:px-6 py-4 sm:py-6 mt-0 h-full">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Categorización de la Encuesta
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Programa</Label>
                          <Input
                            type="text"
                            placeholder="Buscar programa..."
                            value={programa}
                            onChange={(e) => setPrograma(e.target.value)}
                            list="programas-cat-list"
                          />
                          <datalist id="programas-cat-list">
                            {uniqueValues.programas.map((p: string) => (
                              <option key={p} value={p} />
                            ))}
                          </datalist>
                        </div>

                        <div className="space-y-2">
                          <Label>Nivel</Label>
                          <Input
                            type="text"
                            placeholder="Buscar nivel..."
                            value={nivel}
                            onChange={(e) => setNivel(e.target.value)}
                            list="niveles-cat-list"
                          />
                          <datalist id="niveles-cat-list">
                            {uniqueValues.niveles.map((n: string) => (
                              <option key={n} value={n} />
                            ))}
                          </datalist>
                        </div>

                        <div className="space-y-2">
                          <Label>Período</Label>
                          <Input
                            type="text"
                            placeholder="Buscar período..."
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            list="periodos-cat-list"
                          />
                          <datalist id="periodos-cat-list">
                            {uniqueValues.periodos.map((p: string) => (
                              <option key={p} value={p} />
                            ))}
                          </datalist>
                        </div>

                        <div className="space-y-2">
                          <Label>Grupo</Label>
                          <Input
                            type="text"
                            placeholder="Buscar grupo..."
                            value={grupo}
                            onChange={(e) => setGrupo(e.target.value)}
                            list="grupos-cat-list"
                          />
                          <datalist id="grupos-cat-list">
                            {uniqueValues.grupos.map((g: string) => (
                              <option key={g} value={g} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Fecha y Horario del Seminario
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Fecha de la Encuesta</Label>
                          <Input type="date" value={fechaEncuesta} onChange={(e) => setFechaEncuesta(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                          <Label>Hora de Inicio</Label>
                          <Input
                            type="time"
                            value={horaInicio}
                            onChange={(e) => setHoraInicio(e.target.value)}
                            placeholder="06:00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Hora de Fin</Label>
                          <Input
                            type="time"
                            value={horaFin}
                            onChange={(e) => setHoraFin(e.target.value)}
                            placeholder="20:00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="asignacion" className="px-4 sm:px-6 py-4 sm:py-6 mt-0 h-full">
                  <SurveyAssignmentSelector
                    ponenteId={ponenteId}
                    grupos={grupos}
                    estudiantesIndividuales={estudiantesIndividuales}
                    onPonenteChange={setPonente}
                    onGruposChange={setGrupos}
                    onEstudiantesIndividualesChange={setEstudiantesIndividuales}
                  />
                </TabsContent>
              </div>
            </Tabs>

            <div className="border-t bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 sticky bottom-0 z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                    <span>
                      <strong className="text-emerald-700">{preguntas.length}</strong> preguntas
                    </span>
                  </div>
                  {totalEstudiantes > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                      <span>
                        <strong className="text-emerald-700">{totalEstudiantes}</strong> estudiantes
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    size="lg"
                    className="flex-1 sm:flex-none"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !titulo || preguntas.length === 0 || !ponenteId}
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2 flex-1 sm:flex-none"
                    size="lg"
                  >
                    {saving ? (
                      editingSurvey ? (
                        "Actualizando..."
                      ) : (
                        "Creando..."
                      )
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {editingSurvey ? "Actualizar" : "Crear"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <CreateTemplateDialog
        open={createTemplateDialogOpen}
        onOpenChange={setCreateTemplateDialogOpen}
        onSuccess={() => {
          console.log("Plantilla creada exitosamente")
        }}
        surveyData={{
          titulo,
          descripcion,
          preguntas,
        }}
      />
    </>
  )
}
