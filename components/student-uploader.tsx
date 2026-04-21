"use client"

import React from "react"
import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search, X, UserPlus, GraduationCap, BookOpen, Layers } from "lucide-react"
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

import type { UserData } from "@/lib/auth"

export function StudentUploader({ user }: { user: UserData }): ReactElement {
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
    }, user.rol)
    return () => unsubscribe()
  }, [user.rol])

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
    (acc, s) => { if (s.jornada) acc[s.jornada] = (acc[s.jornada] || 0) + 1; return acc },
    {} as Record<string, number>,
  )
  const countByPrograma = students.reduce(
    (acc, s) => { if (s.programa) acc[s.programa] = (acc[s.programa] || 0) + 1; return acc },
    {} as Record<string, number>,
  )
  const countByNivel = students.reduce(
    (acc, s) => { if (s.nivel) acc[s.nivel] = (acc[s.nivel] || 0) + 1; return acc },
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Gestión de Estudiantes</h2>
          <p className="text-sm text-emerald-700 mt-1">
            {students.length} estudiante{students.length !== 1 ? "s" : ""} registrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddStudentDialog(true)} className="bg-green-600 hover:bg-green-700 gap-2">
            <UserPlus className="h-4 w-4" />
            Agregar
          </Button>
          <Button onClick={() => setShowAssignDialog(true)} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Users className="h-4 w-4" />
            Asignar a Grupo
          </Button>
        </div>
      </div>

      {/* Stat cards compactos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card
          className="border-blue-200 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={clearAllFilters}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-900">{students.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <BookOpen className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Jornadas</p>
              <p className="text-2xl font-bold text-purple-900">{Object.keys(countByJornada).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <GraduationCap className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-green-600 font-medium">Programas</p>
              <p className="text-2xl font-bold text-green-900">{Object.keys(countByPrograma).length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <Layers className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <p className="text-xs text-orange-600 font-medium">Niveles</p>
              <p className="text-2xl font-bold text-orange-900">{Object.keys(countByNivel).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown chips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-purple-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-purple-800">Por Jornada</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {Object.entries(countByJornada)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([jornada, count]) => (
                  <button
                    key={jornada}
                    onClick={() => { clearAllFilters(); setFilterJornada(jornada) }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterJornada === jornada
                        ? "bg-purple-600 text-white"
                        : "bg-purple-100 text-purple-800 hover:bg-purple-200"
                    }`}
                  >
                    <span className="max-w-[140px] truncate">{jornada}</span>
                    <span className="font-bold">{count as number}</span>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-green-800">Por Programa</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {Object.entries(countByPrograma)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([programa, count]) => (
                  <button
                    key={programa}
                    onClick={() => { clearAllFilters(); setFilterPrograma(programa) }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterPrograma === programa
                        ? "bg-green-600 text-white"
                        : "bg-green-100 text-green-800 hover:bg-green-200"
                    }`}
                  >
                    <span className="max-w-[140px] truncate">{programa}</span>
                    <span className="font-bold">{count as number}</span>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold text-orange-800">Por Nivel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {Object.entries(countByNivel)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([nivel, count]) => (
                  <button
                    key={nivel}
                    onClick={() => { clearAllFilters(); setFilterNivel(nivel) }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterNivel === nivel
                        ? "bg-orange-600 text-white"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-200"
                    }`}
                  >
                    <span>Nivel {nivel}</span>
                    <span className="font-bold">{count as number}</span>
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Tabla */}
      <Card className="border-emerald-200">
        <CardContent className="pt-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={filterJornada} onValueChange={setFilterJornada}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Jornada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las jornadas</SelectItem>
                {uniqueJornadas.map((j) => (
                  <SelectItem key={j} value={j}>{j}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPrograma} onValueChange={setFilterPrograma}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los programas</SelectItem>
                {uniqueProgramasFilter.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterNivel} onValueChange={setFilterNivel}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los niveles</SelectItem>
                {uniqueNiveles.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los períodos</SelectItem>
                {uniquePeriodos.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGrupo} onValueChange={setFilterGrupo}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los grupos</SelectItem>
                {uniqueGruposFilter.map((g) => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <Input
              type="text"
              placeholder="Buscar por documento, nombre, programa o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          {hasActiveFilters && (
            <p className="text-xs text-emerald-700 font-medium">
              Mostrando {filteredStudents.length} de {students.length} estudiantes
            </p>
          )}

          {filteredStudents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No se encontraron estudiantes</p>
          ) : (
            <>
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {startIndex + 1}–{Math.min(endIndex, filteredStudents.length)} de {filteredStudents.length}
                    <span className="ml-1 text-gray-400">(pág. {currentPage}/{totalPages})</span>
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
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
                          return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>
                        }
                        return null
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[480px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-emerald-50 sticky top-0 z-10">
                      <tr>
                        <th className="text-left p-3 font-semibold text-emerald-800 text-xs uppercase tracking-wide">Documento</th>
                        <th className="text-left p-3 font-semibold text-emerald-800 text-xs uppercase tracking-wide">Nombre</th>
                        <th className="text-left p-3 font-semibold text-emerald-800 text-xs uppercase tracking-wide">Programa</th>
                        <th className="text-left p-3 font-semibold text-emerald-800 text-xs uppercase tracking-wide">Grupo</th>
                        <th className="text-left p-3 font-semibold text-emerald-800 text-xs uppercase tracking-wide">Nivel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedStudents.map((student, index) => (
                        <tr key={student.id || index} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 font-mono text-xs text-gray-600">{student.documento}</td>
                          <td className="p-3 font-medium text-gray-900">
                            {`${student.primerNombre} ${student.segundoNombre || ""} ${student.primerApellido} ${student.segundoApellido || ""}`.trim()}
                          </td>
                          <td className="p-3 text-gray-600 max-w-[200px] truncate">{student.programa || "-"}</td>
                          <td className="p-3">
                            {student.grupo ? (
                              <Badge variant="outline" className="text-xs">{student.grupo}</Badge>
                            ) : "-"}
                          </td>
                          <td className="p-3">
                            {student.nivel ? (
                              <Badge className="text-xs bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                                Nivel {student.nivel}
                              </Badge>
                            ) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-gray-500">
                    {startIndex + 1}–{Math.min(endIndex, filteredStudents.length)} de {filteredStudents.length}
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>
                        }
                        return null
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
</Card>

      <AddStudentDialog
        open={showAddStudentDialog}
        onOpenChange={setShowAddStudentDialog}
        onSuccess={() => setShowAddStudentDialog(false)}
        user={user}
      />
      <AssignStudentsToGroupDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        onSuccess={() => setShowAssignDialog(false)}
        user={user}
      />
    </div>
  )
}
