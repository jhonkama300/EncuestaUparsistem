"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Star } from "lucide-react"
import { getPonentes, deletePonente } from "@/lib/ponentes"
import { AddPonenteDialog } from "./add-ponente-dialog"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const ITEMS_PER_PAGE = 10

export function PonenteUploader() {
  const [ponentes, setPonentes] = useState<any[]>([])
  const [filteredPonentes, setFilteredPonentes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedPonente, setSelectedPonente] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ponenteToDelete, setPonenteToDelete] = useState<any>(null)
  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({})

  useEffect(() => {
    loadPonentes()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [ponentes, searchTerm])

  useEffect(() => {
    if (ponentes.length > 0) {
      loadCalificaciones()
    }
  }, [ponentes])

  const loadPonentes = async () => {
    const data = await getPonentes()
    setPonentes(data)
  }

  const loadCalificaciones = async () => {
    try {
      const encuestasRef = collection(db, "encuestas")
      const respuestasRef = collection(db, "respuestas")

      const calificacionesPorPonente: Record<string, { suma: number; count: number }> = {}

      for (const ponente of ponentes) {
        // Buscar encuestas de este ponente
        const qEncuestas = query(encuestasRef, where("ponenteId", "==", ponente.id))
        const encuestasSnapshot = await getDocs(qEncuestas)

        let sumaCalificaciones = 0
        let totalRespuestas = 0

        for (const encuestaDoc of encuestasSnapshot.docs) {
          // Buscar respuestas de esta encuesta
          const qRespuestas = query(respuestasRef, where("encuestaId", "==", encuestaDoc.id))
          const respuestasSnapshot = await getDocs(qRespuestas)

          respuestasSnapshot.docs.forEach((respuestaDoc) => {
            const respuestaData = respuestaDoc.data()
            const respuestas = respuestaData.respuestas || {}

            // Mapeo de respuestas a valores numéricos
            const SCALE_VALUES: Record<string, number> = {
              excelente: 5,
              bueno: 4,
              aceptable: 3,
              regular: 2,
              malo: 1,
            }

            // Procesar cada respuesta
            Object.keys(respuestas).forEach((key) => {
              const answer = respuestas[key]
              const answerStr = String(answer).toLowerCase().trim()

              const value = SCALE_VALUES[answerStr]
              if (value !== undefined && !isNaN(value)) {
                sumaCalificaciones += value
                totalRespuestas++
              }
            })
          })
        }

        if (totalRespuestas > 0) {
          calificacionesPorPonente[ponente.id] = {
            suma: sumaCalificaciones,
            count: totalRespuestas,
          }
        }
      }

      // Calcular promedios
      const promedios: Record<string, number> = {}
      Object.entries(calificacionesPorPonente).forEach(([ponenteId, data]) => {
        promedios[ponenteId] = data.suma / data.count
      })

      setCalificaciones(promedios)
    } catch (error) {
      console.error("Error cargando calificaciones:", error)
    }
  }

  const applyFilters = () => {
    let filtered = [...ponentes]

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cargo?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredPonentes(filtered)
    setCurrentPage(1)
  }

  const handleDeleteClick = (ponente: any) => {
    setPonenteToDelete(ponente)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!ponenteToDelete) return

    try {
      await deletePonente(ponenteToDelete.id)
      alert("Ponente eliminado exitosamente")
      loadPonentes()
    } catch (error) {
      console.error("Error eliminando ponente:", error)
      alert("Error al eliminar el ponente")
    } finally {
      setDeleteDialogOpen(false)
      setPonenteToDelete(null)
    }
  }

  const handleAdd = () => {
    setEditMode(false)
    setSelectedPonente(null)
    setDialogOpen(true)
  }

  const handleEdit = (ponente: any) => {
    setEditMode(true)
    setSelectedPonente(ponente)
    setDialogOpen(true)
  }

  const renderStars = (calificacion: number) => {
    const stars = []
    const fullStars = Math.floor(calificacion)
    const hasHalfStar = calificacion % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-4 w-4 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>,
        )
      } else {
        stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />)
      }
    }

    return stars
  }

  const totalPages = Math.ceil(filteredPonentes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPonentes = filteredPonentes.slice(startIndex, endIndex)

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Gestión de Ponentes</h2>
            <p className="text-sm text-emerald-700 mt-1">
              Total: {filteredPonentes.length} ponente{filteredPonentes.length !== 1 ? "s" : ""}
              {filteredPonentes.length !== ponentes.length && ` (de ${ponentes.length})`}
            </p>
          </div>
          <Button
            onClick={handleAdd}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            <UserPlus className="h-4 w-4" />
            Agregar Ponente
          </Button>
        </div>

        <AddPonenteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={loadPonentes}
          editMode={editMode}
          ponenteData={selectedPonente}
        />

        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-emerald-900">Búsqueda de Ponentes</CardTitle>
            <CardDescription className="text-emerald-700">Busca ponentes por nombre, número o cargo</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, número o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => setSearchTerm("")} className="mt-4">
                Limpiar búsqueda
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-emerald-900">Ponentes Registrados</CardTitle>
            <CardDescription className="text-emerald-700">
              Lista de todos los ponentes activos en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {currentPonentes.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {ponentes.length === 0
                    ? "No hay ponentes registrados"
                    : "No se encontraron ponentes con esa búsqueda"}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {ponentes.length === 0
                    ? 'Haz clic en "Agregar Ponente" para comenzar'
                    : "Intenta ajustar la búsqueda"}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Imagen</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Calificación</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPonentes.map((ponente) => {
                        const calificacion = calificaciones[ponente.id]
                        return (
                          <TableRow key={ponente.id}>
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={ponente.imagen || "/placeholder.svg?height=40&width=40&query=avatar"}
                                  alt={ponente.nombre}
                                />
                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                  {ponente.nombre.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell className="font-medium">{ponente.nombre}</TableCell>
                            <TableCell>{ponente.numero || "-"}</TableCell>
                            <TableCell>{ponente.cargo || "-"}</TableCell>
                            <TableCell>
                              {calificacion ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-0.5">{renderStars(calificacion)}</div>
                                  <span className="text-sm font-semibold text-gray-700">{calificacion.toFixed(1)}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Sin calificaciones</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{ponente.descripcion}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                                  onClick={() => handleEdit(ponente)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                                  onClick={() => handleDeleteClick(ponente)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-emerald-100">
                    <p className="text-sm text-gray-600">
                      Mostrando {startIndex + 1} - {Math.min(endIndex, filteredPonentes.length)} de{" "}
                      {filteredPonentes.length}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={
                              currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : "hover:bg-emerald-50"
                            }
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Siguiente
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ponente?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar al ponente "{ponenteToDelete?.nombre}"? Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
