"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Users, Search, CheckCircle2, AlertCircle } from "lucide-react"
import {
  getUniqueStudentValues,
  getStudentsByFilters,
  assignMultipleStudentsToGroup,
  createNewGroup,
} from "@/lib/students"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { UserData } from "@/lib/auth"

interface AssignStudentsToGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  user: UserData
}

export function AssignStudentsToGroupDialog({ open, onOpenChange, onSuccess, user }: AssignStudentsToGroupDialogProps) {
  const [mode, setMode] = useState<"existing" | "new">("existing")
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("")
  const [nuevoGrupoNombre, setNuevoGrupoNombre] = useState("")

  const [filterGrupo, setFilterGrupo] = useState("")
  const [filterPrograma, setFilterPrograma] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<any[]>([])

  // Datos
  const [uniqueValues, setUniqueValues] = useState<any>({
    grupos: [],
    programas: [],
  })
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  useEffect(() => {
    if (open) {
      loadUniqueValues()
      loadAllStudents()
    }
  }, [open, user.rol])

  useEffect(() => {
    applyFilters()
  }, [filterGrupo, filterPrograma, searchTerm, user.rol])

  const loadUniqueValues = async () => {
    const values = await getUniqueStudentValues(user.rol)
    setUniqueValues({
      grupos: values.grupos || [],
      programas: values.programas || [],
    })
  }

  const loadAllStudents = async () => {
    const students = await getStudentsByFilters({}, user.rol)
    setFilteredStudents(students)
  }

  const applyFilters = async () => {
    const filters: any = {}
    if (filterGrupo && filterGrupo !== "__all__") filters.grupo = filterGrupo
    if (filterPrograma && filterPrograma !== "__all__") filters.programa = filterPrograma

    let students = await getStudentsByFilters(filters, user.rol)

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      students = students.filter((s: any) => {
        const fullName =
          `${s.primerNombre} ${s.segundoNombre || ""} ${s.primerApellido} ${s.segundoApellido || ""}`.toLowerCase()
        return fullName.includes(searchLower) || s.documento.includes(searchTerm)
      })
    }

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

    if (selectedStudents.length === 0 && !filterGrupo && !filterPrograma) {
      alert("Por favor selecciona estudiantes o aplica filtros")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const grupoDestino = mode === "existing" ? grupoSeleccionado : nuevoGrupoNombre.trim()

      if (selectedStudents.length > 0) {
        const documentos = selectedStudents.map((s) => s.documento)
        const res = await assignMultipleStudentsToGroup(documentos, grupoDestino, user.rol)
        setResult(res)
      } else {
        if (mode === "new") {
          const filters: any = {}
          if (filterGrupo && filterGrupo !== "__all__") filters.grupo = filterGrupo
          if (filterPrograma && filterPrograma !== "__all__") filters.programa = filterPrograma

          const count = await createNewGroup(grupoDestino, user.rol, filters)
          setResult({ success: count, errors: [] })
        } else {
          const documentos = filteredStudents.map((s) => s.documento)
          const res = await assignMultipleStudentsToGroup(documentos, grupoDestino, user.rol)
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
    setFilterGrupo("")
    setFilterPrograma("")
    setSearchTerm("")
    setSelectedStudents([])
    setResult(null)
    loadAllStudents()
  }

  const toggleStudent = (student: any) => {
    const exists = selectedStudents.find((s) => s.documento === student.documento)
    if (exists) {
      setSelectedStudents(selectedStudents.filter((s) => s.documento !== student.documento))
    } else {
      setSelectedStudents([...selectedStudents, student])
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" />
            Asignar Estudiantes a Grupo
          </DialogTitle>
          <DialogDescription>Asigna estudiantes a un grupo existente o crea un nuevo grupo</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
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

          <div className="space-y-3">
            <Label className="text-base font-semibold">Filtros</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">Grupo</Label>
                <Select value={filterGrupo} onValueChange={setFilterGrupo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los grupos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los grupos</SelectItem>
                    {uniqueValues.grupos.map((g: string) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Programa</Label>
                <Select value={filterPrograma} onValueChange={setFilterPrograma}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los programas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los programas</SelectItem>
                    {uniqueValues.programas.map((p: string) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Buscar Estudiante</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre completo o identificación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredStudents.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Estudiantes ({filteredStudents.length})</Label>
                {selectedStudents.length > 0 && (
                  <Badge variant="secondary">{selectedStudents.length} seleccionados</Badge>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Seleccionar</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Identificación</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Nombre Completo</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Grupo Actual</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border-b">Programa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student: any) => {
                        const isSelected = selectedStudents.find((s) => s.documento === student.documento)
                        return (
                          <tr
                            key={student.documento}
                            className={`hover:bg-gray-50 cursor-pointer ${isSelected ? "bg-primary/10" : ""}`}
                            onClick={() => toggleStudent(student)}
                          >
                            <td className="px-4 py-3 border-b">
                              <input
                                type="checkbox"
                                checked={!!isSelected}
                                onChange={() => toggleStudent(student)}
                                className="h-4 w-4 text-primary rounded"
                              />
                            </td>
                            <td className="px-4 py-3 border-b font-medium">{student.documento}</td>
                            <td className="px-4 py-3 border-b">
                              {student.primerNombre} {student.segundoNombre || ""} {student.primerApellido}{" "}
                              {student.segundoApellido || ""}
                            </td>
                            <td className="px-4 py-3 border-b text-gray-600">{student.grupo || "Sin grupo"}</td>
                            <td className="px-4 py-3 border-b text-gray-600">{student.programa}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
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
        </div>

        {/* Acciones */}
        <div className="flex gap-2 justify-end pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  )
}
