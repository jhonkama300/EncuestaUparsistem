"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search, X, UserPlus } from "lucide-react"
import { subscribeToStudents } from "@/lib/students"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AssignStudentsToGroupDialog } from "@/components/assign-students-to-group-dialog"
import { AddStudentDialog } from "@/components/add-student-dialog"

export function StudentUploader(): ReactElement {
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [filterJornada, setFilterJornada] = useState<string>("")
  const [filterPrograma, setFilterPrograma] = useState<string>("")
  const [filterNivel, setFilterNivel] = useState<string>("")
  const [filterPeriodo, setFilterPeriodo] = useState<string>("")
  const [filterGrupo, setFilterGrupo] = useState<string>("")

  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToStudents((studentsData) => {
      setStudents(studentsData)
      setFilteredStudents(studentsData)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    filterStudents()
    setCurrentPage(1)
  }, [searchTerm, students, filterJornada, filterPrograma, filterNivel, filterPeriodo, filterGrupo])

  const filterStudents = () => {
    let filtered = students

    if (filterJornada && filterJornada !== "__all__") {
      filtered = filtered.filter((s) => s.jornada === filterJornada)
    }
    if (filterPrograma && filterPrograma !== "__all__") {
      filtered = filtered.filter((s) => s.programa === filterPrograma)
    }
    if (filterNivel && filterNivel !== "__all__") {
      filtered = filtered.filter((s) => s.nivel === filterNivel)
    }
    if (filterPeriodo && filterPeriodo !== "__all__") {
      filtered = filtered.filter((s) => s.periodo === filterPeriodo)
    }
    if (filterGrupo && filterGrupo !== "__all__") {
      filtered = filtered.filter((s) => s.grupo === filterGrupo)
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (student) =>
          student.documento?.toLowerCase().includes(searchLower) ||
          student.primerNombre?.toLowerCase().includes(searchLower) ||
          student.segundoNombre?.toLowerCase().includes(searchLower) ||
          student.primerApellido?.toLowerCase().includes(searchLower) ||
          student.segundoApellido?.toLowerCase().includes(searchLower) ||
          student.programa?.toLowerCase().includes(searchLower) ||
          student.grupo?.toLowerCase().includes(searchLower),
      )
    }

    setFilteredStudents(filtered)
  }

  const clearAllFilters = () => {
    setFilterJornada("")
    setFilterPrograma("")
    setFilterNivel("")
    setFilterPeriodo("")
    setFilterGrupo("")
    setSearchTerm("")
  }

  const countByJornada = students.reduce(
    (acc, student) => {
      if (student.jornada) acc[student.jornada] = (acc[student.jornada] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const countByPrograma = students.reduce(
    (acc, student) => {
      if (student.programa) acc[student.programa] = (acc[student.programa] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const countByNivel = students.reduce(
    (acc, student) => {
      if (student.nivel) acc[student.nivel] = (acc[student.nivel] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const uniqueJornadas = Array.from(new Set(students.map((s) => s.jornada).filter(Boolean))).sort()
  const uniqueProgramasFilter = Array.from(new Set(students.map((s) => s.programa).filter(Boolean))).sort()
  const uniqueNiveles = Array.from(new Set(students.map((s) => s.nivel).filter(Boolean))).sort()
  const uniquePeriodos = Array.from(new Set(students.map((s) => s.periodo).filter(Boolean))).sort()
  const uniqueGruposFilter = Array.from(new Set(students.map((s) => s.grupo).filter(Boolean))).sort()

  const hasActiveFilters = filterJornada || filterPrograma || filterNivel || filterPeriodo || filterGrupo || searchTerm

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-emerald-800">Gestión de Estudiantes</h2>
          <p className="text-gray-600">Visualiza y administra los estudiantes registrados</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddStudentDialog(true)} className="bg-green-600 hover:bg-green-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar un Estudiante
          </Button>
          <Button onClick={() => setShowAssignDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Asignar a Grupo
          </Button>
        </div>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="text-emerald-800 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestión de Estudiantes
          </CardTitle>
          <CardDescription>Visualiza, busca y filtra estudiantes registrados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="border-blue-200 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow"
              onClick={clearAllFilters}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 text-sm font-medium">Total de Estudiantes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-900">{students.length}</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-purple-800 text-sm font-medium">Por Jornada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(countByJornada)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([jornada, count]) => (
                    <div
                      key={jornada}
                      className="flex items-center justify-between cursor-pointer hover:bg-purple-100 p-2 rounded transition-colors"
                      onClick={() => { clearAllFilters(); setFilterJornada(jornada) }}
                    >
                      <span className="text-sm text-purple-900">{jornada}</span>
                      <Badge variant="secondary" className="bg-purple-200 text-purple-900">
                        {count as number}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800 text-sm font-medium">Por Programa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(countByPrograma)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([programa, count]) => (
                    <div
                      key={programa}
                      className="flex items-center justify-between cursor-pointer hover:bg-green-100 p-2 rounded transition-colors"
                      onClick={() => { clearAllFilters(); setFilterPrograma(programa) }}
                    >
                      <span className="text-sm text-green-900">{programa}</span>
                      <Badge variant="secondary" className="bg-green-200 text-green-900">
                        {count as number}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-800 text-sm font-medium">Por Nivel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(countByNivel)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([nivel, count]) => (
                    <div
                      key={nivel}
                      className="flex items-center justify-between cursor-pointer hover:bg-orange-100 p-2 rounded transition-colors"
                      onClick={() => { clearAllFilters(); setFilterNivel(nivel) }}
                    >
                      <span className="text-sm text-orange-900">Nivel {nivel}</span>
                      <Badge variant="secondary" className="bg-orange-200 text-orange-900">
                        {count as number}
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Filtros y Tabla */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Select value={filterJornada} onValueChange={setFilterJornada}>
                <SelectTrigger>
                  <SelectValue placeholder="Jornada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las jornadas</SelectItem>
                  {uniqueJornadas.map((jornada) => (
                    <SelectItem key={jornada} value={jornada}>{jornada}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPrograma} onValueChange={setFilterPrograma}>
                <SelectTrigger>
                  <SelectValue placeholder="Programa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los programas</SelectItem>
                  {uniqueProgramasFilter.map((programa) => (
                    <SelectItem key={programa} value={programa}>{programa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterNivel} onValueChange={setFilterNivel}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los niveles</SelectItem>
                  {uniqueNiveles.map((nivel) => (
                    <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los períodos</SelectItem>
                  {uniquePeriodos.map((periodo) => (
                    <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterGrupo} onValueChange={setFilterGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los grupos</SelectItem>
                  {uniqueGruposFilter.map((grupo) => (
                    <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por documento, nombre, programa o grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>

            {filteredStudents.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No se encontraron estudiantes</p>
            ) : (
              <>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 pb-2">
                    <p className="text-sm text-gray-600">
                      Mostrando {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} de{" "}
                      {filteredStudents.length} estudiantes
                      <span className="ml-2 text-gray-500">
                        (Página {currentPage} de {totalPages})
                      </span>
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-emerald-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold text-emerald-800">Documento</th>
                          <th className="text-left p-2 font-semibold text-emerald-800">Nombre</th>
                          <th className="text-left p-2 font-semibold text-emerald-800">Programa</th>
                          <th className="text-left p-2 font-semibold text-emerald-800">Grupo</th>
                          <th className="text-left p-2 font-semibold text-emerald-800">Nivel</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedStudents.map((student, index) => (
                          <tr key={student.id || index} className="border-t hover:bg-gray-50">
                            <td className="p-2">{student.documento}</td>
                            <td className="p-2">
                              {`${student.primerNombre} ${student.segundoNombre || ""} ${student.primerApellido} ${student.segundoApellido || ""}`.trim()}
                            </td>
                            <td className="p-2">{student.programa || "-"}</td>
                            <td className="p-2">{student.grupo || "-"}</td>
                            <td className="p-2">{student.nivel || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-600">
                      Mostrando {startIndex + 1} - {Math.min(endIndex, filteredStudents.length)} de{" "}
                      {filteredStudents.length} estudiantes
                      <span className="ml-2 text-gray-500">
                        (Página {currentPage} de {totalPages})
                      </span>
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <PaginationItem key={page}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )
                          }
                          return null
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onSuccess={() => setShowAddStudentDialog(false)}
      />

      <AssignStudentsToGroupDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onSuccess={() => setShowAssignDialog(false)}
      />
    </div>
  )
}
