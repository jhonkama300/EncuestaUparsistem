"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Search,
  Eye,
  X,
  Database,
} from "lucide-react"
import {
  uploadStudentsFromExcel,
  resetStudentsByPrograma,
  resetStudentsByGrupo,
  resetAllStudents,
  deleteStudentByDocumento,
  searchStudentByName,
  subscribeToStudents,
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
import * as XLSX from "xlsx"
import type { UserData } from "@/lib/auth"

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

export function Configuraciones({ user }: { user: UserData }) {
  const [students, setStudents] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)
  const [previewData, setPreviewData] = useState<PreviewData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewErrors, setPreviewErrors] = useState<string[]>([])
  const [resetPrograma, setResetPrograma] = useState("")
  const [resetGrupo, setResetGrupo] = useState("")
  const [deleteSearchTerm, setDeleteSearchTerm] = useState("")
  const [deleteSearchResults, setDeleteSearchResults] = useState<any[]>([])
  const [isSearchingToDelete, setIsSearchingToDelete] = useState(false)

  const fileInputRef = React.createRef<HTMLInputElement>()

  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => setStudents(data), user.rol)
    return () => unsubscribe()
  }, [user.rol])

  const uniqueProgramas = Array.from(new Set(students.map((s) => s.programa).filter(Boolean)))
  const uniqueGrupos = Array.from(new Set(students.map((s) => s.grupo).filter(Boolean)))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
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
      const documentosEnArchivo = new Map<string, number>()

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
        documentosEnArchivo.set(documento, (documentosEnArchivo.get(documento) || 0) + 1)
        preview.push({
          primerNombre: row["Primer nombre"],
          segundoNombre: row["Segundo nombre"] || "",
          primerApellido: row["Primer apellido"],
          segundoApellido: row["Segundo apellido"] || "",
          documento,
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
        if (documento) documentosEnArchivo.set(documento, (documentosEnArchivo.get(documento) || 0) + 1)
      }

      const multipleEnrollments = Array.from(documentosEnArchivo.entries()).filter(([, count]) => count > 1)
      if (multipleEnrollments.length > 0) {
        errors.push(
          `ℹ️ Información: ${multipleEnrollments.length} estudiante(s) tienen múltiples inscripciones en el archivo (esto es válido)`,
        )
      }

      setPreviewData(preview)
      setPreviewErrors(errors)
      setShowPreview(true)
    } catch {
      setPreviewErrors(["Error al leer el archivo. Verifica que sea un archivo Excel válido."])
      setShowPreview(true)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setShowPreview(false)
    try {
      const uploadResult = await uploadStudentsFromExcel(file, user.rol)
      setResult(uploadResult)
      setFile(null)
      setPreviewData([])
      setPreviewErrors([])
      setShowPreview(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch {
      setResult({ success: 0, errors: ["Error al procesar el archivo"] })
    } finally {
      setUploading(false)
    }
  }

  const handleResetByPrograma = async () => {
    if (!resetPrograma) return
    try {
      const count = await resetStudentsByPrograma(resetPrograma, user.rol)
      alert(`${count} estudiantes eliminados del programa ${resetPrograma}`)
      setResetPrograma("")
    } catch {
      alert("Error al resetear estudiantes")
    }
  }

  const handleResetByGrupo = async () => {
    if (!resetGrupo) return
    try {
      const count = await resetStudentsByGrupo(resetGrupo, user.rol)
      alert(`${count} estudiantes eliminados del grupo ${resetGrupo}`)
      setResetGrupo("")
    } catch {
      alert("Error al resetear estudiantes")
    }
  }

  const handleResetAll = async () => {
    try {
      const count = await resetAllStudents(user.rol)
      alert(`${count} estudiantes eliminados en total`)
    } catch {
      alert("Error al resetear estudiantes")
    }
  }

  const handleSearchStudentToDelete = async () => {
    if (!deleteSearchTerm.trim()) { setDeleteSearchResults([]); return }
    setIsSearchingToDelete(true)
    try {
      const results = await searchStudentByName(deleteSearchTerm, user.rol)
      setDeleteSearchResults(results)
    } catch {
      alert("Error al buscar estudiante")
    } finally {
      setIsSearchingToDelete(false)
    }
  }

  const handleDeleteStudent = async (documento: string, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar al estudiante ${nombre} (${documento})?`)) return
    try {
      const success = await deleteStudentByDocumento(documento, user.rol)
      if (success) {
        alert(`Estudiante ${nombre} eliminado exitosamente`)
        setDeleteSearchTerm("")
        setDeleteSearchResults([])
      } else {
        alert("No se encontró el estudiante")
      }
    } catch {
      alert("Error al eliminar estudiante")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configuraciones</h2>
        <p className="text-sm text-muted-foreground mt-1">Gestión de base de datos de estudiantes</p>
      </div>

      <Card className="border-primary/20 bg-primary/10">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Database className="h-5 w-5" />
            Base de Datos
          </CardTitle>
          <CardDescription>Importa, elimina y gestiona la base de datos de estudiantes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Importar Excel */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Importar desde Excel</h3>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Subir Archivo Excel</CardTitle>
                <CardDescription>
                  El archivo debe contener: Primer nombre, Segundo nombre, Primer apellido, Segundo apellido, Número de
                  identificación, Jornada, Programa, Grupo, Período, Nivel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-primary/30 bg-primary/10 p-4 transition-colors hover:border-primary/50 hover:bg-primary/10">
                    <FileSpreadsheet className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {file ? file.name : "Seleccionar archivo Excel"}
                      </p>
                      <p className="text-xs text-muted-foreground">Formatos: .xlsx, .xls</p>
                    </div>
                  </div>
                </label>

                {showPreview && (
                  <Card className="border-primary/20 bg-primary/10">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-primary" />
                          <CardTitle className="text-foreground text-base">Vista Previa del Archivo</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowPreview(false)
                            setFile(null)
                            setPreviewData([])
                            setPreviewErrors([])
                            if (fileInputRef.current) fileInputRef.current.value = ""
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
                          <p className="mb-2 font-medium text-foreground text-sm">
                            Primeros {previewData.length} registros:
                          </p>
                          <div className="border rounded-lg overflow-hidden bg-white">
                            <div className="max-h-64 overflow-auto">
                              <table className="w-full text-xs">
                                <thead className="bg-primary/10 sticky top-0">
                                  <tr>
                                    <th className="text-left p-2 font-semibold text-foreground">Documento</th>
                                    <th className="text-left p-2 font-semibold text-foreground">Nombre</th>
                                    <th className="text-left p-2 font-semibold text-foreground">Programa</th>
                                    <th className="text-left p-2 font-semibold text-foreground">Grupo</th>
                                    <th className="text-left p-2 font-semibold text-foreground">Nivel</th>
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
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Subiendo..." : "Subir Estudiantes"}
                </Button>
              </CardContent>
            </Card>

            {result && (
              <Card
                className={result.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}
              >
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
                      <p className="mb-2 font-medium text-yellow-800 text-sm">
                        Advertencias y errores encontrados ({result.errors.length}):
                      </p>
                      <ul className="list-inside list-disc space-y-1 text-xs text-yellow-700 max-h-40 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={() => setResult(null)} className="mt-4 w-full">
                    Cerrar y cargar otro archivo
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Eliminar Individual */}
          <div className="space-y-4">
            <h3 className="font-semibold text-red-900">Eliminar Estudiante Individual</h3>
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 text-base">Buscar y Eliminar Estudiante</CardTitle>
                <CardDescription className="text-red-700">
                  Busca un estudiante por nombre o documento para eliminarlo de la base de datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre o documento..."
                    value={deleteSearchTerm}
                    onChange={(e) => setDeleteSearchTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSearchStudentToDelete() }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSearchStudentToDelete}
                    disabled={!deleteSearchTerm.trim() || isSearchingToDelete}
                    variant="outline"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {isSearchingToDelete ? "Buscando..." : "Buscar"}
                  </Button>
                </div>

                {deleteSearchResults.length > 0 && (
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-red-100 sticky top-0">
                          <tr>
                            <th className="text-left p-2 font-semibold text-red-900">Documento</th>
                            <th className="text-left p-2 font-semibold text-red-900">Nombre</th>
                            <th className="text-left p-2 font-semibold text-red-900">Programa</th>
                            <th className="text-left p-2 font-semibold text-red-900">Grupo</th>
                            <th className="text-center p-2 font-semibold text-red-900">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deleteSearchResults.map((student, index) => (
                            <tr key={student.id || index} className="border-t hover:bg-gray-50">
                              <td className="p-2">{student.documento}</td>
                              <td className="p-2">
                                {`${student.primerNombre} ${student.segundoNombre || ""} ${student.primerApellido} ${student.segundoApellido || ""}`.trim()}
                              </td>
                              <td className="p-2">{student.programa || "-"}</td>
                              <td className="p-2">{student.grupo || "-"}</td>
                              <td className="p-2 text-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteStudent(
                                      student.documento,
                                      `${student.primerNombre} ${student.primerApellido}`,
                                    )
                                  }
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Eliminar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {deleteSearchTerm && deleteSearchResults.length === 0 && !isSearchingToDelete && (
                  <p className="text-center text-muted-foreground py-4">No se encontraron estudiantes</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resetear Base de Datos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-red-900">Resetear Base de Datos</h3>
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 text-base flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Eliminar Grupos de Estudiantes
                </CardTitle>
                <CardDescription className="text-red-700">
                  Elimina estudiantes por programa, grupo o toda la base de datos. Esta acción no se puede deshacer.
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
                        list="cfg-reset-programas-list"
                        className="flex-1"
                      />
                      <datalist id="cfg-reset-programas-list">
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
                              Esto eliminará todos los estudiantes del programa "{resetPrograma}". Esta acción no se
                              puede deshacer.
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
                        list="cfg-reset-grupos-list"
                        className="flex-1"
                      />
                      <datalist id="cfg-reset-grupos-list">
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
                              Esto eliminará todos los estudiantes del grupo "{resetGrupo}". Esta acción no se puede
                              deshacer.
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
        </CardContent>
      </Card>
    </div>
  )
}
