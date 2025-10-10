"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, Search, Users, ChevronDown, ChevronUp, Calendar } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface SurveyStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  surveyTitle: string
  surveyData: any
}

interface StudentStatus {
  documento: string
  nombre: string
  programa: string
  grupo: string
  nivel: string
  periodo: string
  hasResponded: boolean
  respuestas?: any
  fechaRespuesta?: string
}

export function SurveyStudentsDialog({
  open,
  onOpenChange,
  surveyId,
  surveyTitle,
  surveyData,
}: SurveyStudentsDialogProps) {
  const [students, setStudents] = useState<StudentStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "responded" | "pending">("all")
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([])

  useEffect(() => {
    if (open) {
      loadStudentStatus()
      loadSurveyQuestions()
    }
  }, [open, surveyId])

  const loadSurveyQuestions = () => {
    try {
      const preguntas = surveyData.preguntas || []
      console.log("[v0] Preguntas de la encuesta:", preguntas)
      setSurveyQuestions(preguntas)
    } catch (error) {
      console.error("[v0] Error cargando preguntas:", error)
    }
  }

  const loadStudentStatus = async () => {
    setLoading(true)
    try {
      console.log("[v0] Cargando estado de estudiantes para encuesta:", surveyId)

      // Get all students assigned to this survey
      const estudiantesRef = collection(db, "estudiantes")
      const estudiantesSnapshot = await getDocs(estudiantesRef)

      // Get all responses for this survey
      const respuestasRef = collection(db, "respuestas")
      const qRespuestas = query(respuestasRef, where("encuestaId", "==", surveyId))
      const respuestasSnapshot = await getDocs(qRespuestas)

      const respuestasPorDocumento = new Map()
      respuestasSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        respuestasPorDocumento.set(data.documento, {
          respuestas: data.respuestas,
          fechaRespuesta: data.fechaRespuesta,
        })
      })

      console.log("[v0] Documentos que respondieron:", Array.from(respuestasPorDocumento.keys()))

      // Filter students based on survey assignment
      const asignacion = surveyData.asignacion || {}
      const assignedStudents: StudentStatus[] = []

      estudiantesSnapshot.docs.forEach((doc) => {
        const estudiante = doc.data()
        let isAssigned = false

        // Check if student is individually assigned
        if (asignacion.estudiantesIndividuales?.includes(estudiante.documento)) {
          isAssigned = true
        }

        // Check if student matches group criteria
        if (asignacion.grupos && asignacion.grupos.length > 0) {
          isAssigned = asignacion.grupos.some((grupo: any) => {
            return (
              (!grupo.programa || grupo.programa === estudiante.programa) &&
              (!grupo.grupo || grupo.grupo === estudiante.grupo) &&
              (!grupo.periodo || grupo.periodo === estudiante.periodo) &&
              (!grupo.nivel || grupo.nivel === estudiante.nivel)
            )
          })
        }

        if (isAssigned) {
          const nombres = [
            estudiante.primerNombre,
            estudiante.segundoNombre,
            estudiante.primerApellido,
            estudiante.segundoApellido,
          ]
            .filter(Boolean)
            .join(" ")

          const respuestaData = respuestasPorDocumento.get(estudiante.documento)

          assignedStudents.push({
            documento: estudiante.documento,
            nombre: nombres || `Estudiante ${estudiante.documento}`,
            programa: estudiante.programa || "N/A",
            grupo: estudiante.grupo || "N/A",
            nivel: estudiante.nivel || "N/A",
            periodo: estudiante.periodo || "N/A",
            hasResponded: respuestasPorDocumento.has(estudiante.documento),
            respuestas: respuestaData?.respuestas,
            fechaRespuesta: respuestaData?.fechaRespuesta,
          })
        }
      })

      console.log("[v0] Total estudiantes asignados:", assignedStudents.length)
      console.log("[v0] Estudiantes que respondieron:", assignedStudents.filter((s) => s.hasResponded).length)

      setStudents(assignedStudents)
    } catch (error) {
      console.error("[v0] Error cargando estado de estudiantes:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpanded = (documento: string) => {
    setExpandedStudents((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(documento)) {
        newSet.delete(documento)
      } else {
        newSet.add(documento)
      }
      return newSet
    })
  }

  const renderAnswer = (question: any, answer: any) => {
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

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || student.documento.includes(searchTerm)

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "responded" && student.hasResponded) ||
      (activeTab === "pending" && !student.hasResponded)

    return matchesSearch && matchesTab
  })

  const respondedCount = students.filter((s) => s.hasResponded).length
  const pendingCount = students.length - respondedCount
  const responseRate = students.length > 0 ? Math.round((respondedCount / students.length) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl text-emerald-800">Estado de Respuestas</DialogTitle>
          <DialogDescription>{surveyTitle}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Asignados</p>
                    <p className="text-2xl font-bold text-emerald-700">{students.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Han Respondido</p>
                    <p className="text-2xl font-bold text-green-700">{respondedCount}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendientes</p>
                    <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todos ({students.length})</TabsTrigger>
              <TabsTrigger value="responded">Respondieron ({respondedCount})</TabsTrigger>
              <TabsTrigger value="pending">Pendientes ({pendingCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="flex-1 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando estudiantes...</p>
                  </div>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No se encontraron estudiantes</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudents.has(student.documento)
                    return (
                      <Card
                        key={student.documento}
                        className={`border ${
                          student.hasResponded ? "border-green-200 bg-green-50/50" : "border-orange-200 bg-orange-50/50"
                        }`}
                      >
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    student.hasResponded ? "bg-green-100" : "bg-orange-100"
                                  }`}
                                >
                                  {student.hasResponded ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-orange-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{student.nombre}</p>
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-600 mt-1">
                                    <span className="bg-white px-2 py-0.5 rounded border">
                                      Doc: {student.documento}
                                    </span>
                                    {student.programa !== "N/A" && (
                                      <span className="bg-white px-2 py-0.5 rounded border">{student.programa}</span>
                                    )}
                                    {student.grupo !== "N/A" && (
                                      <span className="bg-white px-2 py-0.5 rounded border">Grupo {student.grupo}</span>
                                    )}
                                    {student.nivel !== "N/A" && (
                                      <span className="bg-white px-2 py-0.5 rounded border">Nivel {student.nivel}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {student.fechaRespuesta && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(student.fechaRespuesta).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                              <Badge
                                className={
                                  student.hasResponded
                                    ? "bg-green-600 hover:bg-green-700"
                                    : "bg-orange-600 hover:bg-orange-700"
                                }
                              >
                                {student.hasResponded ? "Respondió" : "Pendiente"}
                              </Badge>
                              {student.hasResponded && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleExpanded(student.documento)}
                                  className="gap-1 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4" />
                                      Ocultar
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4" />
                                      Respuestas
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>

                          {isExpanded && student.hasResponded && student.respuestas && (
                            <div className="mt-4 pt-4 border-t border-green-200">
                              <div className="space-y-3">
                                {surveyQuestions.map((question, qIndex) => {
                                  const answer = student.respuestas?.[qIndex]
                                  return (
                                    <div key={question.id} className="bg-white p-3 rounded-lg border">
                                      <div className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center font-semibold">
                                          {qIndex + 1}
                                        </span>
                                        <div className="flex-1">
                                          <p className="font-medium text-gray-900 mb-2 text-sm">{question.texto}</p>
                                          <div className="ml-0">{renderAnswer(question, answer)}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Tasa de respuesta: <span className="font-semibold text-emerald-700">{responseRate}%</span>
            </p>
            <p className="text-sm text-gray-600">
              Mostrando {filteredStudents.length} de {students.length} estudiantes
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
