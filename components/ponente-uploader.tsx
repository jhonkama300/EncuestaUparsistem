"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserPlus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { getPonentes, deletePonente, getStudentFilters } from "@/lib/ponentes"
import { AddPonenteDialog } from "./add-ponente-dialog"

const ITEMS_PER_PAGE = 10

export function PonenteUploader() {
  const [ponentes, setPonentes] = useState<any[]>([])
  const [filteredPonentes, setFilteredPonentes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedPonente, setSelectedPonente] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterJornada, setFilterJornada] = useState<string>("all")
  const [filterPrograma, setFilterPrograma] = useState<string>("all")
  const [filterGrupo, setFilterGrupo] = useState<string>("all")
  const [availableFilters, setAvailableFilters] = useState({
    jornadas: [] as string[],
    programas: [] as string[],
    grupos: [] as string[],
  })

  useEffect(() => {
    loadPonentes()
    loadFilters()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [ponentes, searchTerm, filterJornada, filterPrograma, filterGrupo])

  const loadFilters = async () => {
    const filters = await getStudentFilters()
    setAvailableFilters({
      jornadas: filters.jornadas,
      programas: filters.programas,
      grupos: filters.grupos,
    })
  }

  const loadPonentes = async () => {
    const data = await getPonentes()
    setPonentes(data)
  }

  const applyFilters = () => {
    let filtered = [...ponentes]

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.cargo?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por jornada
    if (filterJornada !== "all") {
      filtered = filtered.filter((p) => p.jornada === filterJornada)
    }

    // Filtro por programa
    if (filterPrograma !== "all") {
      filtered = filtered.filter((p) => p.programa === filterPrograma)
    }

    // Filtro por grupo
    if (filterGrupo !== "all") {
      filtered = filtered.filter((p) => p.grupo === filterGrupo)
    }

    setFilteredPonentes(filtered)
    setCurrentPage(1) // Resetear a la primera página cuando se filtran
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar al ponente "${nombre}"?`)) {
      try {
        await deletePonente(id)
        alert("Ponente eliminado exitosamente")
        loadPonentes()
      } catch (error) {
        console.error("Error eliminando ponente:", error)
        alert("Error al eliminar el ponente")
      }
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

  const totalPages = Math.ceil(filteredPonentes.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentPonentes = filteredPonentes.slice(startIndex, endIndex)

  return (
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
          <CardTitle className="text-emerald-900">Filtros de Búsqueda</CardTitle>
          <CardDescription className="text-emerald-700">Filtra los ponentes por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Jornada</label>
              <Select value={filterJornada} onValueChange={setFilterJornada}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {availableFilters.jornadas.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Programa</label>
              <Select value={filterPrograma} onValueChange={setFilterPrograma}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableFilters.programas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Grupo</label>
              <Select value={filterGrupo} onValueChange={setFilterGrupo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {availableFilters.grupos.map((g) => (
                    <SelectItem key={g} value={g}>
                      Grupo {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(searchTerm || filterJornada !== "all" || filterPrograma !== "all" || filterGrupo !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("")
                setFilterJornada("all")
                setFilterPrograma("all")
                setFilterGrupo("all")
              }}
              className="mt-4"
            >
              Limpiar filtros
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
                {ponentes.length === 0 ? "No hay ponentes registrados" : "No se encontraron ponentes con esos filtros"}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {ponentes.length === 0
                  ? 'Haz clic en "Agregar Ponente" para comenzar'
                  : "Intenta ajustar los filtros de búsqueda"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Detalles</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPonentes.map((ponente) => (
                      <TableRow key={ponente.id}>
                        <TableCell className="font-medium">{ponente.nombre}</TableCell>
                        <TableCell>{ponente.numero || "-"}</TableCell>
                        <TableCell>{ponente.cargo || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">{ponente.descripcion}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ponente.jornada && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                {ponente.jornada}
                              </span>
                            )}
                            {ponente.programa && (
                              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                {ponente.programa}
                              </span>
                            )}
                            {ponente.grupo && (
                              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                                G{ponente.grupo}
                              </span>
                            )}
                          </div>
                        </TableCell>
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
                              onClick={() => handleDelete(ponente.id, ponente.nombre)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
  )
}
