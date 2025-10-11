"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Search, X, CheckCircle2, AlertCircle } from "lucide-react"
import {
  getUniqueStudentValues,
  getStudentsByFilters,
  assignMultipleStudentsToGroup,
  createNewGroup,
} from "@/lib/students"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AssignStudentsToGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignStudentsToGroupDialog({ open, onOpenChange, onSuccess }: AssignStudentsToGroupDialogProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("")
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState("")

  // Filtros
  const [filterJornada, setFilterJornada] = useState("")
  const [filterPrograma, setFilterPrograma] = useState("")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [filterNivel, setFilterNivel] = useState("")

  // Búsqueda individual
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<any[]>([])

  // Datos
  const [uniqueValues, setUniqueValues] = useState<any>({
    grupos: [],
    jornadas: [],
    programas: [],
    periodos: [],
    niveles: [],
  })
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  useEffect(() => {
    if (open) {
      loadUniqueValues()
    }
  }, [open])

  useEffect(() => {
    if (filterJornada || filterPrograma || filterPeriodo || filterNivel) {
      loadFilteredStudents()
    } else {
      setFilteredStudents([])
    }
  }, [filterJornada, filterPrograma, filterPeriodo, filterNivel])

  const loadUniqueValues = async () => {
    const values = await getUniqueStudentValues()
    setUniqueValues(values)
  }

  const loadFilteredStudents = async () => {
    const filters: any = {}
    if (filterJornada) filters.jornada = filterJornada
    if (filterPrograma) filters.programa = filterPrograma
    if (filterPeriodo) filters.periodo = filterPeriodo
    if (filterNivel) filters.nivel = filterNivel

    const students = await getStudentsByFilters(filters)
    setFilteredStudents(students)
  }

  const handleAssign = async () => {
    if (mode === "existing" && !grupoSeleccionado) {
      alert("Por favor selecciona un grupo")
      return
    }

    if (mode === "new" && !nuevoGrupoNombre.trim()) {
      alert("Por favor ingresa un nombre para el nuevo grupo")
      return
    }

    if (selectedStudents.length === 0 && !filterJornada && !filterPrograma && !filterPeriodo && !filterNivel) {
      alert("Por favor selecciona estudiantes o aplica filtros")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const grupoDestino = mode === "existing" ? grupoSeleccionado : nuevoGrupoNombre.trim()

      if (selectedStudents.length > 0) {
        // Asignar estudiantes seleccionados individualmente
        const documentos = selectedStudents.map((s) => s.documento)
        const res = await assignMultipleStudentsToGroup(documentos, grupoDestino)
        setResult(res)
      } else {
        // Asignar todos los estudiantes que coincidan con los filtros
        if (mode === "new") {
          const filters: any = {}
          if (filterJornada) filters.jornada = filterJornada
          if (filterPrograma) filters.programa = filterPrograma
          if (filterPeriodo) filters.periodo = filterPeriodo
          if (filterNivel) filters.nivel = filterNivel

          const count = await createNewGroup(grupoDestino, filters)
          setResult({ success: count, errors: [] })
        } else {
          const documentos = filteredStudents.map((s) => s.documento)
          const res = await assignMultipleStudentsToGroup(documentos, grupoDestino)
          setResult(res)
        }
      }

      if (onSuccess) onSuccess()
    } catch (error) {
      console.error("Error asignando estudiantes:", error)
      alert("Error al asignar estudiantes al grupo")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setMode("existing")
    setGrupoSeleccionado("")
    setNuevoGrupoNombre("")
    setFilterJornada("")
    setFilterPrograma("")
    setFilterPeriodo("")
    setFilterNivel("")
    setSearchTerm("")
    setSelectedStudents([])
    setFilteredStudents([])
    setResult(null)
  }

  const addStudent = (student: any) => {
    if (!selectedStudents.find((s) => s.documento === student.documento)) {
      setSelectedStudents([...selectedStudents, student])
    }
  }

  const removeStudent = (documento: string) => {
    setSelectedStudents(selectedStudents.filter((s) => s.documento !== documento))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-emerald-600" />
            Asignar Estudiantes a Grupo
          </DialogTitle>
          <DialogDescription>Asigna estudiantes a un grupo existente o crea un nuevo grupo</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Modo de asignación */}
          <div className="space-y-2">
            <Label>Modo de Asignación</Label>
            <div className="flex gap-2">
              <Button
                variant={mode === "existing" ? "default" : "outline"}
                onClick={() => setMode("existing")}
                className="flex-1"
              >
                Grupo Existente
              </Button>
              <Button
                variant={mode === "new" ? "default" : "outline"}
                onClick={() => setMode("new")}
                className="flex-1"
              >
                Crear Nuevo Grupo
              </Button>
            </div>
          </div>

          {/* Selección de grupo */}
          {mode === "existing" ? (
            <div className="space-y-2">
              <Label>Grupo Destino</Label>
              <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {uniqueValues.grupos.map((grupo: string) => (
                    <SelectItem key={grupo} value={grupo}>
                      {grupo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Nombre del Nuevo Grupo</Label>
              <Input
                placeholder="Ej: Grupo A, Cohorte 2025-1, etc."
                value={nuevoGrupoNombre}
                onChange={(e) => setNuevoGrupoNombre(e.target.value)}
              />
            </div>
          )}

          {/* Filtros */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Filtros de Estudiantes</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Jornada</Label>
                <Select value={filterJornada} onValueChange={setFilterJornada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
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
                <Select value={filterPrograma} onValueChange={setFilterPrograma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {uniqueValues.programas.map((p: string) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Período</Label>
                <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
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
                <Select value={filterNivel} onValueChange={setFilterNivel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {uniqueValues.niveles.map((n: string) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredStudents.length > 0 && (
              <Alert>
                <AlertDescription>
                  <strong>{filteredStudents.length}</strong> estudiantes coinciden con los filtros seleccionados
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Búsqueda individual */}
          <div className="space-y-2">
            <Label>Búsqueda Individual (Opcional)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por documento o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {searchTerm && filteredStudents.length > 0 && (
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                {filteredStudents
                  .filter((s: any) => {
                    const searchLower = searchTerm.toLowerCase()
                    const fullName =
                      `${s.primerNombre} ${s.segundoNombre || ""} ${s.primerApellido} ${s.segundoApellido || ""}`.toLowerCase()
                    return fullName.includes(searchLower) || s.documento.includes(searchLower)
                  })
                  .slice(0, 10)
                  .map((student: any) => (
                    <div
                      key={student.documento}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => addStudent(student)}
                    >
                      <div className="text-sm">
                        <span className="font-medium">
                          {student.primerNombre} {student.primerApellido}
                        </span>
                        <span className="text-gray-500 ml-2">({student.documento})</span>
                      </div>
                      <Button size="sm" variant="ghost">
                        Agregar
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Estudiantes seleccionados */}
          {selectedStudents.length > 0 && (
            <div className="space-y-2">
              <Label>Estudiantes Seleccionados ({selectedStudents.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedStudents.map((student) => (
                  <Badge key={student.documento} variant="secondary" className="flex items-center gap-1">
                    {student.primerNombre} {student.primerApellido}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-600"
                      onClick={() => removeStudent(student.documento)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <Alert variant={result.errors.length > 0 ? "destructive" : "default"}>
              {result.errors.length === 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>
                <strong>{result.success}</strong> estudiantes asignados exitosamente
                {result.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <strong>{result.errors.length}</strong> errores:
                    <ul className="list-disc list-inside mt-1">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                      {result.errors.length > 5 && <li>... y {result.errors.length - 5} más</li>}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Acciones */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleReset}>
              Limpiar
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssign} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Asignando..." : "Asignar al Grupo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
