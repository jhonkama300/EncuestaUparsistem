"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, Search, Users, ChevronDown, ChevronUp, Calendar, User } from "lucide-react"
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
      <DialogContent className="max-w-[98vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-4">
          <DialogTitle className="text-emerald-800 text-3xl flex items-center gap-3">
            <Users className="h-7 w-7" />
            Estado de Respuestas
          </DialogTitle>
          <DialogDescription className="text-lg">{surveyTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-emerald-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <Users className="h-12 w-12 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Total Asignados</p>
                    <p className="text-4xl font-bold text-purple-700">{students.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Han Respondido</p>
                    <p className="text-4xl font-bold text-green-700">{respondedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <XCircle className="h-12 w-12 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Pendientes</p>
                    <p className="text-4xl font-bold text-orange-700">{pendingCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between gap-3 text-base bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-700">Tasa de respuesta:</span>
              <span className="font-bold text-emerald-700 text-xl">{responseRate}%</span>
            </div>
            <span className="text-gray-600">
              Mostrando {filteredStudents.length} de {students.length} estudiantes
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base border-2 focus:border-emerald-500"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="all" className="text-base">
                Todos ({students.length})
              </TabsTrigger>
              <TabsTrigger value="responded" className="text-base">
                Respondieron ({respondedCount})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-base">
                Pendientes ({pendingCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {loading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="inline-block w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 text-lg">Cargando estudiantes...</p>
                  </CardContent>
                </Card>
              ) : filteredStudents.length === 0 ? (
                <Card className="border-emerald-200">
                  <CardContent className="py-16 text-center">
                    <Users className="mx-auto mb-6 h-16 w-16 text-emerald-400" />
                    <h3 className="mb-3 text-xl font-semibold text-gray-800">No se encontraron estudiantes</h3>
                    <p className="text-gray-600 text-base">
                      No hay estudiantes que coincidan con los criterios de búsqueda
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map((student) => {
                    const isExpanded = expandedStudents.has(student.documento)
                    return (
                      <Card key={student.documento} className="border-emerald-200 hover:shadow-md transition-shadow">
                        <CardContent className="py-5 px-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                  <User className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-xl">{student.nombre}</h4>
                                  <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-2">
                                    <span className="bg-gray-100 px-3 py-1 rounded">Doc: {student.documento}</span>
                                    {student.programa !== "N/A" && (
                                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded">
                                        {student.programa}
                                      </span>
                                    )}
                                    {student.grupo !== "N/A" && (
                                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
                                        Grupo {student.grupo}
                                      </span>
                                    )}
                                    {student.nivel !== "N/A" && (
                                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded">
                                        Nivel {student.nivel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              {student.fechaRespuesta && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(student.fechaRespuesta).toLocaleDateString("es-ES", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                              <div className="flex items-center gap-2">
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
                                    size="default"
                                    onClick={() => toggleExpanded(student.documento)}
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
                                )}
                              </div>
                            </div>
                          </div>

                          {isExpanded && student.hasResponded && student.respuestas && (
                            <div className="mt-5 pt-5 border-t border-emerald-100">
                              <div className="space-y-5">
                                {surveyQuestions.map((question, qIndex) => {
                                  const answer = student.respuestas?.[qIndex]
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
      </DialogContent>
    </Dialog>
  )
}
