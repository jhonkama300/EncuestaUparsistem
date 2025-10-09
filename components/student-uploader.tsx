"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Users, Trash2, Search, Eye, X } from "lucide-react"
import {
  uploadStudentsFromExcel,
  getAllStudents,
  resetStudentsByPrograma,
  resetStudentsByGrupo,
  resetAllStudents,
} from "@/lib/students"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import * as XLSX from "xlsx"

interface PreviewData {
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  documento: string
  jornada: string
  programa: string
  grupo: string
  periodo: string
  nivel: string
}

export function StudentUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [filteredStudents, setFilteredStudents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewErrors, setPreviewErrors] = useState<string[]>([])

  const [filterJornada, setFilterJornada] = useState<string>("")
  const [filterPrograma, setFilterPrograma] = useState<string>("")
  const [filterNivel, setFilterNivel] = useState<string>("")
  const [filterPeriodo, setFilterPeriodo] = useState<string>("")
  const [filterGrupo, setFilterGrupo] = useState<string>("")

  const [resetPrograma, setResetPrograma] = useState("")
  const [resetGrupo, setResetGrupo] = useState("")

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
    setCurrentPage(1)
  }, [searchTerm, students, filterJornada, filterPrograma, filterNivel, filterPeriodo, filterGrupo])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const allStudents = await getAllStudents()
      setStudents(allStudents)
      setFilteredStudents(allStudents)
    } catch (error) {
      console.error("Error cargando estudiantes:", error)
    } finally {
      setLoading(false)
    }
  }

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
      filtered = filtered.filter((student) => {
        return (
          student.documento?.toLowerCase().includes(searchLower) ||
          student.primerNombre?.toLowerCase().includes(searchLower) ||
          student.segundoNombre?.toLowerCase().includes(searchLower) ||
          student.primerApellido?.toLowerCase().includes(searchLower) ||
          student.segundoApellido?.toLowerCase().includes(searchLower) ||
          student.programa?.toLowerCase().includes(searchLower) ||
          student.grupo?.toLowerCase().includes(searchLower)
        )
      })
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setResult(null)
      setShowPreview(false)
      setPreviewData([])
      setPreviewErrors([])

      try {
        const data = await selectedFile.arrayBuffer()
        const workbook = XLSX.read(data)
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        const errors: string[] = []
        const preview: PreviewData[] = []
        const documentosEnArchivo = new Set<string>()

        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
          const row: any = jsonData[i]

          const requiredFields = [
            "Primer nombre",
            "Primer apellido",
            "Número de identificación",
            "Jornada",
            "Programa",
            "Grupo",
            "Período",
            "Nivel",
          ]

          const missingFields = requiredFields.filter((field) => !row[field])
          if (missingFields.length > 0) {
            errors.push(`Fila ${i + 2}: Faltan campos: ${missingFields.join(", ")}`)
            continue
          }

          const documento = row["Número de identificación"].toString()

          if (documentosEnArchivo.has(documento)) {
            errors.push(`Fila ${i + 2}: Documento ${documento} está duplicado en el archivo`)
          } else {
            documentosEnArchivo.add(documento)
          }

          preview.push({
            primerNombre: row["Primer nombre"],
            segundoNombre: row["Segundo nombre"] || "",
            primerApellido: row["Primer apellido"],
            segundoApellido: row["Segundo apellido"] || "",
            documento: documento,
            jornada: row["Jornada"],
            programa: row["Programa"],
            grupo: row["Grupo"],
            periodo: row["Período"],
            nivel: row["Nivel"].toString(),
          })
        }

        for (let i = 10; i < jsonData.length; i++) {
          const row: any = jsonData[i]
          const documento = row["Número de identificación"]?.toString()
          if (documento) {
            if (documentosEnArchivo.has(documento)) {
              errors.push(`Fila ${i + 2}: Documento ${documento} está duplicado en el archivo`)
            } else {
              documentosEnArchivo.add(documento)
            }
          }
        }

        setPreviewData(preview)
        setPreviewErrors(errors)
        setShowPreview(true)
      } catch (error) {
        console.error("Error procesando archivo:", error)
        setPreviewErrors(["Error al leer el archivo. Verifica que sea un archivo Excel válido."])
        setShowPreview(true)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setShowPreview(false)
    try {
      const uploadResult = await uploadStudentsFromExcel(file)
      setResult(uploadResult)
      setFile(null)
      setPreviewData([])
      setPreviewErrors([])
      await loadStudents()
    } catch (error) {
      console.error("Error subiendo archivo:", error)
      setResult({ success: 0, errors: ["Error al procesar el archivo"] })
    } finally {
      setUploading(false)
    }
  }

  const handleResetByPrograma = async () => {
    if (!resetPrograma) return
    try {
      const count = await resetStudentsByPrograma(resetPrograma)
      alert(`${count} estudiantes eliminados del programa ${resetPrograma}`)
      setResetPrograma("")
      await loadStudents()
    } catch (error) {
      console.error("Error reseteando por programa:", error)
      alert("Error al resetear estudiantes")
    }
  }

  const handleResetByGrupo = async () => {
    if (!resetGrupo) return
    try {
      const count = await resetStudentsByGrupo(resetGrupo)
      alert(`${count} estudiantes eliminados del grupo ${resetGrupo}`)
      setResetGrupo("")
      await loadStudents()
    } catch (error) {
      console.error("Error reseteando por grupo:", error)
      alert("Error al resetear estudiantes")
    }
  }

  const handleResetAll = async () => {
    try {
      const count = await resetAllStudents()
      alert(`${count} estudiantes eliminados en total`)
      await loadStudents()
    } catch (error) {
      console.error("Error reseteando todos los estudiantes:", error)
      alert("Error al resetear estudiantes")
    }
  }

  const countByJornada = students.reduce(
    (acc, student) => {
      acc[student.jornada] = (acc[student.jornada] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const countByPrograma = students.reduce(
    (acc, student) => {
      acc[student.programa] = (acc[student.programa] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const countByNivel = students.reduce(
    (acc, student) => {
      acc[student.nivel] = (acc[student.nivel] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex)

  const uniqueProgramas = Array.from(new Set(students.map((s) => s.programa).filter(Boolean)))
  const uniqueGrupos = Array.from(new Set(students.map((s) => s.grupo).filter(Boolean)))

  const uniqueJornadas = Array.from(new Set(students.map((s) => s.jornada).filter(Boolean))).sort()
  const uniqueProgramasFilter = Array.from(new Set(students.map((s) => s.programa).filter(Boolean))).sort()
  const uniqueNiveles = Array.from(new Set(students.map((s) => s.nivel).filter(Boolean))).sort()
  const uniquePeriodos = Array.from(new Set(students.map((s) => s.periodo).filter(Boolean))).sort()
  const uniqueGruposFilter = Array.from(new Set(students.map((s) => s.grupo).filter(Boolean))).sort()

  const hasActiveFilters = filterJornada || filterPrograma || filterNivel || filterPeriodo || filterGrupo || searchTerm

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-emerald-800">Gestión de Estudiantes</h2>
        <p className="text-gray-600">Carga, visualiza y administra los estudiantes registrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="border-blue-200 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => clearAllFilters()}
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
                  onClick={() => {
                    clearAllFilters()
                    setFilterJornada(jornada)
                  }}
                >
                  <span className="text-sm text-purple-900">{jornada}</span>
                  <Badge variant="secondary" className="bg-purple-200 text-purple-900">
                    {count}
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
                  onClick={() => {
                    clearAllFilters()
                    setFilterPrograma(programa)
                  }}
                >
                  <span className="text-sm text-green-900">{programa}</span>
                  <Badge variant="secondary" className="bg-green-200 text-green-900">
                    {count}
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
                  onClick={() => {
                    clearAllFilters()
                    setFilterNivel(nivel)
                  }}
                >
                  <span className="text-sm text-orange-900">Nivel {nivel}</span>
                  <Badge variant="secondary" className="bg-orange-200 text-orange-900">
                    {count}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Subir Archivo Excel</CardTitle>
          <CardDescription>
            El archivo debe contener: Primer nombre, Segundo nombre, Primer apellido, Segundo apellido, Número de
            identificación, Jornada, Programa, Grupo, Período, Nivel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 transition-colors hover:border-emerald-400 hover:bg-emerald-100">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800 text-sm">
                    {file ? file.name : "Seleccionar archivo Excel"}
                  </p>
                  <p className="text-xs text-gray-600">Formatos: .xlsx, .xls</p>
                </div>
              </div>
            </label>
          </div>

          {showPreview && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-blue-800 text-base">Vista Previa del Archivo</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPreview(false)
                      setFile(null)
                      setPreviewData([])
                      setPreviewErrors([])
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewErrors.length > 0 && (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3">
                    <p className="mb-2 font-semibold text-yellow-800 text-sm">
                      Advertencias encontradas ({previewErrors.length}):
                    </p>
                    <ul className="list-inside list-disc space-y-1 text-xs text-yellow-700 max-h-32 overflow-y-auto">
                      {previewErrors.slice(0, 5).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {previewErrors.length > 5 && <li>... y {previewErrors.length - 5} advertencias más</li>}
                    </ul>
                  </div>
                )}

                {previewData.length > 0 && (
                  <div>
                    <p className="mb-2 font-medium text-blue-800 text-sm">Primeros {previewData.length} registros:</p>
                    <div className="border rounded-lg overflow-hidden bg-white">
                      <div className="max-h-64 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-blue-100 sticky top-0">
                            <tr>
                              <th className="text-left p-2 font-semibold text-blue-900">Documento</th>
                              <th className="text-left p-2 font-semibold text-blue-900">Nombre</th>
                              <th className="text-left p-2 font-semibold text-blue-900">Programa</th>
                              <th className="text-left p-2 font-semibold text-blue-900">Grupo</th>
                              <th className="text-left p-2 font-semibold text-blue-900">Nivel</th>
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((student, index) => (
                              <tr key={index} className="border-t hover:bg-gray-50">
                                <td className="p-2">{student.documento}</td>
                                <td className="p-2">
                                  {`${student.primerNombre} ${student.segundoNombre || ""} ${student.primerApellido} ${student.segundoApellido || ""}`.trim()}
                                </td>
                                <td className="p-2">{student.programa}</td>
                                <td className="p-2">{student.grupo}</td>
                                <td className="p-2">{student.nivel}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir Estudiantes"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <CardTitle
                className={result.errors.length > 0 ? "text-yellow-800 text-base" : "text-green-800 text-base"}
              >
                Resultado de la Carga
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-medium text-sm">{result.success} estudiante(s) cargado(s) exitosamente</p>
            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-medium text-yellow-800 text-sm">Errores encontrados:</p>
                <ul className="list-inside list-disc space-y-1 text-xs text-yellow-700 max-h-40 overflow-y-auto">
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {result.errors.length > 10 && <li>... y {result.errors.length - 10} errores más</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-emerald-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-emerald-800 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Estudiantes Registrados ({filteredStudents.length})
              </CardTitle>
              <CardDescription>Visualiza y busca estudiantes en la base de datos</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={filterJornada} onValueChange={setFilterJornada}>
              <SelectTrigger>
                <SelectValue placeholder="Jornada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las jornadas</SelectItem>
                {uniqueJornadas.map((jornada) => (
                  <SelectItem key={jornada} value={jornada}>
                    {jornada}
                  </SelectItem>
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
                  <SelectItem key={programa} value={programa}>
                    {programa}
                  </SelectItem>
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
                  <SelectItem key={nivel} value={nivel}>
                    {nivel}
                  </SelectItem>
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
                  <SelectItem key={periodo} value={periodo}>
                    {periodo}
                  </SelectItem>
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
                  <SelectItem key={grupo} value={grupo}>
                    {grupo}
                  </SelectItem>
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

          {loading ? (
            <p className="text-center text-gray-600 py-8">Cargando estudiantes...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No se encontraron estudiantes</p>
          ) : (
            <>
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
                          <td className="p-2">{student.programa}</td>
                          <td className="p-2">{student.grupo}</td>
                          <td className="p-2">{student.nivel}</td>
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
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Resetear Base de Datos
          </CardTitle>
          <CardDescription className="text-red-700">
            Elimina estudiantes de la base de datos. Esta acción no se puede deshacer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Resetear por Programa</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Seleccionar programa..."
                  value={resetPrograma}
                  onChange={(e) => setResetPrograma(e.target.value)}
                  list="reset-programas-list"
                  className="flex-1"
                />
                <datalist id="reset-programas-list">
                  {uniqueProgramas.map((p: string) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!resetPrograma}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto eliminará todos los estudiantes del programa "{resetPrograma}". Esta acción no se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetByPrograma} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resetear por Grupo</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Seleccionar grupo..."
                  value={resetGrupo}
                  onChange={(e) => setResetGrupo(e.target.value)}
                  list="reset-grupos-list"
                  className="flex-1"
                />
                <datalist id="reset-grupos-list">
                  {uniqueGrupos.map((g: string) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!resetGrupo}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esto eliminará todos los estudiantes del grupo "{resetGrupo}". Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetByGrupo} className="bg-red-600 hover:bg-red-700">
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-red-200">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Resetear TODA la Base de Datos
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto eliminará TODOS los estudiantes de la base de datos. Esta acción no se puede deshacer y
                    afectará a {students.length} estudiantes.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetAll} className="bg-red-600 hover:bg-red-700">
                    Sí, eliminar todo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
