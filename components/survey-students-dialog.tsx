"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, Search, Users, ChevronDown, ChevronUp, Calendar, User, X } from "lucide-react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db, getRoleCollectionName } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { UserData } from "@/lib/auth"

interface SurveyStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  surveyId: string
  surveyTitle: string
  surveyData: any
  user: UserData
}

interface StudentStatus {
// ... ( keep StudentStatus interface )
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
  user,
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
  }, [open, surveyId, user.rol])

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
      console.log("[v0] Cargando estado de estudiantes para encuesta:", surveyId, "en rol:", user.rol)

      const estudiantesRef = collection(db, getRoleCollectionName("estudiantes", user.rol))
      const estudiantesSnapshot = await getDocs(estudiantesRef)

      const respuestasRef = collection(db, getRoleCollectionName("respuestas", user.rol))
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

      const asignacion = surveyData.asignacion || {}
      const assignedStudents: StudentStatus[] = []

      estudiantesSnapshot.docs.forEach((doc) => {
        const estudiante = doc.data()
        let isAssigned = false

        if (asignacion.estudiantesIndividuales?.includes(estudiante.documento)) {
          isAssigned = true
        }

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
      <DialogContent className="max-h-[95vh] w-[95vw] max-w-[95vw] sm:w-[90vw] sm:max-w-[90vw] lg:w-[85vw] lg:max-w-6xl xl:max-w-7xl flex flex-col p-0 overflow-hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-50 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 text-gray-700 hover:text-gray-900"
        >
          <X className="h-5 w-5" />
        </Button>

        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white sticky top-0 z-20">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 pr-12">
            <Users className="h-5 w-5 sm:h-6 sm:w-6" />
            Estado de Respuestas
          </DialogTitle>
          <DialogDescription className="text-emerald-50 text-sm">{surveyTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-emerald-200 bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Total Asignados</p>
                      <p className="text-3xl font-bold text-purple-700">{students.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Han Respondido</p>
                      <p className="text-3xl font-bold text-green-700">{respondedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <XCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">Pendientes</p>
                      <p className="text-3xl font-bold text-orange-700">{pendingCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="text-gray-700">Tasa de respuesta:</span>
                <span className="font-bold text-emerald-700 text-lg">{responseRate}%</span>
              </div>
              <span className="text-gray-600">
                Mostrando {filteredStudents.length} de {students.length} estudiantes
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre o documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm border-2 focus:border-emerald-500"
              />
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-3 h-10">
                <TabsTrigger value="all" className="text-sm">
                  Todos ({students.length})
                </TabsTrigger>
                <TabsTrigger value="responded" className="text-sm">
                  Respondieron ({respondedCount})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-sm">
                  Pendientes ({pendingCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {loading ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-gray-600 text-sm">Cargando estudiantes...</p>
                    </CardContent>
                  </Card>
                ) : filteredStudents.length === 0 ? (
                  <Card className="border-emerald-200">
                    <CardContent className="py-12 text-center">
                      <Users className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
                      <h3 className="mb-2 text-lg font-semibold text-gray-800">No se encontraron estudiantes</h3>
                      <p className="text-gray-600 text-sm">
                        No hay estudiantes que coincidan con los criterios de búsqueda
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => {
                      const isExpanded = expandedStudents.has(student.documento)
                      return (
                        <Card key={student.documento} className="border-emerald-200 hover:shadow-md transition-shadow">
                          <CardContent className="py-4 px-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <User className="h-5 w-5 text-emerald-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-base">{student.nombre}</h4>
                                    <div className="flex flex-wrap gap-1.5 text-xs text-gray-600 mt-1">
                                      <span className="bg-gray-100 px-2 py-0.5 rounded">Doc: {student.documento}</span>
                                      {student.programa !== "N/A" && (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                          {student.programa}
                                        </span>
                                      )}
                                      {student.grupo !== "N/A" && (
                                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                          Grupo {student.grupo}
                                        </span>
                                      )}
                                      {student.nivel !== "N/A" && (
                                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                          {student.nivel}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {student.fechaRespuesta && (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
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
                                      size="sm"
                                      onClick={() => toggleExpanded(student.documento)}
                                      className="gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 h-8"
                                    >
                                      {isExpanded ? (
                                        <>
                                          <ChevronUp className="h-4 w-4" />
                                          Ocultar
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="h-4 w-4" />
                                          Ver
                                        </>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {isExpanded && student.hasResponded && student.respuestas && (
                              <div className="mt-4 pt-4 border-t border-emerald-100">
                                <div className="space-y-3">
                                  {surveyQuestions.map((question, qIndex) => {
                                    const answer = student.respuestas?.[qIndex]
                                    return (
                                      <div key={question.id} className="bg-gray-50 p-3 rounded-lg">
                                        <div className="flex items-start gap-2 mb-2">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
