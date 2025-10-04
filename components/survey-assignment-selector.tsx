"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Users, UserPlus, UserCheck } from "lucide-react"
import { getUniqueStudentValues, getStudentsByFilters, getAllStudents } from "@/lib/students"
import { getPonentes } from "@/lib/ponentes"

interface SurveyAssignmentSelectorProps {
  ponenteId: string
  grupos: Array<{
    jornada?: string
    programa?: string
    grupo?: string
    periodo?: string
    nivel?: string
  }>
  estudiantesIndividuales: string[]
  onPonenteChange: (ponenteId: string) => void
  onGruposChange: (grupos: any[]) => void
  onEstudiantesIndividualesChange: (estudiantes: string[]) => void
}

export function SurveyAssignmentSelector({
  ponenteId,
  grupos,
  estudiantesIndividuales,
  onPonenteChange,
  onGruposChange,
  onEstudiantesIndividualesChange,
}: SurveyAssignmentSelectorProps) {
  const [uniqueValues, setUniqueValues] = useState({
    jornadas: [],
    programas: [],
    grupos: [],
    periodos: [],
    niveles: [],
  })
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [ponentes, setPonentes] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [totalAsignados, setTotalAsignados] = useState(0)

  const [currentGrupo, setCurrentGrupo] = useState({
    jornada: "",
    programa: "",
    grupo: "",
    periodo: "",
    nivel: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    calculateTotalAsignados()
  }, [grupos, estudiantesIndividuales])

  const loadData = async () => {
    const values = await getUniqueStudentValues()
    setUniqueValues(values)
    const students = await getAllStudents()
    setAllStudents(students)
    const ponentesData = await getPonentes()
    setPonentes(ponentesData)
  }

  const calculateTotalAsignados = async () => {
    let total = estudiantesIndividuales.length

    for (const grupo of grupos) {
      const students = await getStudentsByFilters(grupo)
      total += students.length
    }

    setTotalAsignados(total)
  }

  const addGrupo = () => {
    if (
      currentGrupo.jornada ||
      currentGrupo.programa ||
      currentGrupo.grupo ||
      currentGrupo.periodo ||
      currentGrupo.nivel
    ) {
      onGruposChange([...grupos, { ...currentGrupo }])
      setCurrentGrupo({ jornada: "", programa: "", grupo: "", periodo: "", nivel: "" })
    }
  }

  const removeGrupo = (index: number) => {
    onGruposChange(grupos.filter((_, i) => i !== index))
  }

  const addEstudianteIndividual = () => {
    if (selectedStudent && !estudiantesIndividuales.includes(selectedStudent)) {
      onEstudiantesIndividualesChange([...estudiantesIndividuales, selectedStudent])
      setSelectedStudent("")
    }
  }

  const removeEstudianteIndividual = (documento: string) => {
    onEstudiantesIndividualesChange(estudiantesIndividuales.filter((d) => d !== documento))
  }

  const getGrupoLabel = (grupo: any) => {
    const parts = []
    if (grupo.jornada) parts.push(`Jornada: ${grupo.jornada}`)
    if (grupo.programa) parts.push(`Programa: ${grupo.programa}`)
    if (grupo.grupo) parts.push(`Grupo: ${grupo.grupo}`)
    if (grupo.periodo) parts.push(`Período: ${grupo.periodo}`)
    if (grupo.nivel) parts.push(`Nivel: ${grupo.nivel}`)
    return parts.join(" • ")
  }

  const getStudentName = (documento: string) => {
    const student = allStudents.find((s) => s.documento === documento)
    return student ? `${student.primerNombre} ${student.primerApellido} (${documento})` : documento
  }

  const selectedPonente = ponentes.find((p) => p.id === ponenteId)

  return (
    <div className="space-y-6">
      {/* Seleccionar ponente */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Seleccionar Ponente a Evaluar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Ponente</Label>
            <Select value={ponenteId} onValueChange={onPonenteChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ponente" />
              </SelectTrigger>
              <SelectContent>
                {ponentes.map((ponente) => (
                  <SelectItem key={ponente.id} value={ponente.id}>
                    {ponente.nombre} - {ponente.cargo || "Sin cargo"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedPonente && (
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">{selectedPonente.nombre}</p>
              {selectedPonente.cargo && <p className="text-xs text-blue-700">{selectedPonente.cargo}</p>}
              {selectedPonente.institucion && <p className="text-xs text-blue-600">{selectedPonente.institucion}</p>}
              {selectedPonente.descripcion && (
                <p className="text-xs text-gray-600 mt-2">{selectedPonente.descripcion}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-emerald-800">
            <Users className="h-5 w-5" />
            <span className="font-semibold">Total de estudiantes que evaluarán: {totalAsignados}</span>
          </div>
        </CardContent>
      </Card>

      {/* Asignar por grupos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Asignar Grupos de Estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm">Jornada</Label>
              <Select
                value={currentGrupo.jornada}
                onValueChange={(v) => setCurrentGrupo({ ...currentGrupo, jornada: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Todas</SelectItem>
                  {uniqueValues.jornadas.map((j: string) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Programa</Label>
              <Select
                value={currentGrupo.programa}
                onValueChange={(v) => setCurrentGrupo({ ...currentGrupo, programa: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Todos</SelectItem>
                  {uniqueValues.programas.map((p: string) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Grupo</Label>
              <Select value={currentGrupo.grupo} onValueChange={(v) => setCurrentGrupo({ ...currentGrupo, grupo: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Todos</SelectItem>
                  {uniqueValues.grupos.map((g: string) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Período</Label>
              <Select
                value={currentGrupo.periodo}
                onValueChange={(v) => setCurrentGrupo({ ...currentGrupo, periodo: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Todos</SelectItem>
                  {uniqueValues.periodos.map((p: string) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Nivel</Label>
              <Select value={currentGrupo.nivel} onValueChange={(v) => setCurrentGrupo({ ...currentGrupo, nivel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Todos</SelectItem>
                  {uniqueValues.niveles.map((n: string) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="button" onClick={addGrupo} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" />
            Agregar Grupo
          </Button>

          {grupos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Grupos asignados:</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {grupos.map((grupo, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center justify-between gap-2 py-2 px-3">
                    <span className="text-xs">{getGrupoLabel(grupo)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeGrupo(index)}
                      className="h-4 w-4 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Asignar estudiantes individuales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Estudiantes Individuales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Seleccionar estudiante" />
              </SelectTrigger>
              <SelectContent>
                {allStudents.map((student) => (
                  <SelectItem key={student.documento} value={student.documento}>
                    {student.primerNombre} {student.primerApellido} - {student.documento}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={addEstudianteIndividual}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          {estudiantesIndividuales.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Estudiantes individuales asignados:</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {estudiantesIndividuales.map((documento) => (
                  <Badge
                    key={documento}
                    variant="secondary"
                    className="flex items-center justify-between gap-2 py-2 px-3"
                  >
                    <span className="text-xs">{getStudentName(documento)}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeEstudianteIndividual(documento)}
                      className="h-4 w-4 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
