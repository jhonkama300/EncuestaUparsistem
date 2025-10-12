"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Plus,
  FileText,
  Users,
  TrendingUp,
  Edit,
  Trash2,
  Calendar,
  Clock,
  Filter,
  Copy,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { CreateSurveyDialog } from "./create-survey-dialog"
import { SurveyResultsDialog } from "./survey-results-dialog"
import { SurveyStatisticsDialog } from "./survey-statistics-dialog"
import { SurveyStudentsDialog } from "./survey-students-dialog"
import { getSurveyStats, deleteSurvey, updateSurvey, subscribeToAllSurveys } from "@/lib/surveys"
import { useToast } from "@/hooks/use-toast"
import { formatDateForDisplay, formatTimeForDisplay } from "@/lib/date-utils"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

export function SurveyManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [showStatisticsDialog, setShowStatisticsDialog] = useState(false)
  const [showStudentsDialog, setShowStudentsDialog] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, respuestas: 0, tasa: 0 })
  const [editingSurvey, setEditingSurvey] = useState<any>(null)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5) // 5 encuestas por página

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false)
  const [surveyToDelete, setSurveyToDelete] = useState<any>(null)
  const [surveyToToggle, setSurveyToToggle] = useState<any>(null)

  useEffect(() => {
    loadStats()

    const unsubscribe = subscribeToAllSurveys((surveysData) => {
      setSurveys(surveysData)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    applyFilters()
  }, [surveys, searchTerm, filterTipo])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterTipo])

  const loadStats = async () => {
    const statsData = await getSurveyStats()
    setStats(statsData)
  }

  const loadData = async () => {
    await loadStats()
  }

  const applyFilters = () => {
    let filtered = [...surveys]

    // Filtro por búsqueda de texto (nombre de encuesta)
    if (searchTerm) {
      filtered = filtered.filter((s) => s.titulo?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Filtro por tipo (seminario/diplomado)
    if (filterTipo !== "all") {
      if (filterTipo === "seminario") {
        filtered = filtered.filter((s) => s.titulo?.toUpperCase().includes("SEMINARIO"))
      } else if (filterTipo === "diplomado") {
        filtered = filtered.filter((s) => s.titulo?.toUpperCase().includes("DIPLOMADO"))
      }
    }

    setFilteredSurveys(filtered)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return formatDateForDisplay(dateString)
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    return formatTimeForDisplay(timeString)
  }

  const handleToggleSurveyClick = (survey: any) => {
    setSurveyToToggle(survey)
    setToggleDialogOpen(true)
  }

  const handleToggleSurveyConfirm = async () => {
    if (!surveyToToggle) return

    try {
      await updateSurvey(surveyToToggle.id, { activa: !surveyToToggle.activa })
      toast({
        title: !surveyToToggle.activa ? "Encuesta habilitada" : "Encuesta deshabilitada",
        description: `La encuesta "${surveyToToggle.titulo}" ha sido ${!surveyToToggle.activa ? "habilitada" : "deshabilitada"}.`,
      })
      loadData()
    } catch (error) {
      console.error("Error actualizando encuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la encuesta.",
        variant: "destructive",
      })
    } finally {
      setToggleDialogOpen(false)
      setSurveyToToggle(null)
    }
  }

  const handleDeleteSurveyClick = (survey: any) => {
    setSurveyToDelete(survey)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSurveyConfirm = async () => {
    if (!surveyToDelete) return

    try {
      await deleteSurvey(surveyToDelete.id)
      toast({
        title: "Encuesta eliminada",
        description: `La encuesta "${surveyToDelete.titulo}" y sus respuestas han sido eliminadas exitosamente.`,
      })
      loadData()
    } catch (error) {
      console.error("Error eliminando encuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la encuesta. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSurveyToDelete(null)
    }
  }

  const handleEditSurvey = (survey: any) => {
    setEditingSurvey(survey)
    setShowCreateDialog(true)
  }

  const handleCloneSurvey = (survey: any) => {
    const clonedSurvey = {
      ...survey,
      titulo: `${survey.titulo} (Copia)`,
      fechaCreacion: new Date().toISOString(),
      activa: false,
    }
    delete clonedSurvey.id
    delete clonedSurvey.respuestas

    setEditingSurvey(clonedSurvey)
    setShowCreateDialog(true)

    toast({
      title: "Encuesta clonada",
      description: `Se ha creado una copia de "${survey.titulo}". Puedes editarla antes de guardar.`,
    })
  }

  const handleViewResults = (survey: any) => {
    setSelectedSurvey(survey)
    setShowResultsDialog(true)
  }

  const handleViewStatistics = (survey: any) => {
    setSelectedSurvey(survey)
    setShowStatisticsDialog(true)
  }

  const handleViewStudents = (survey: any) => {
    setSelectedSurvey(survey)
    setShowStudentsDialog(true)
  }

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open)
    if (!open) {
      setEditingSurvey(null)
    }
  }

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSurveys = filteredSurveys.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value))
    setCurrentPage(1)
  }

  const PaginationControls = () => (
    <div className="flex items-center justify-between py-4 border-t border-emerald-200">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          Mostrando {startIndex + 1} - {Math.min(endIndex, filteredSurveys.length)} de {filteredSurveys.length}{" "}
          encuestas
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-gray-600">Mostrar:</Label>
          <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(page)}
                  className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                >
                  {page}
                </Button>
              )
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <span key={page} className="px-2 text-gray-400">
                  ...
                </span>
              )
            }
            return null
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="gap-1"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-800">Gestión de Encuestas</h2>
          <p className="text-gray-600 mt-1">Crea y administra encuestas para tus estudiantes</p>
        </div>
        <Button
          onClick={() => {
            setEditingSurvey(null)
            setShowCreateDialog(true)
          }}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          size="lg"
        >
          <Plus className="h-5 w-5" />
          Nueva Encuesta
        </Button>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Encuestas Activas</CardTitle>
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">Encuestas en curso</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Respuestas Totales</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">{stats.respuestas}</div>
            <p className="text-xs text-gray-600 mt-1">Estudiantes han respondido</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-gradient-to-br from-teal-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Tasa de Respuesta</CardTitle>
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-teal-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-700">{stats.tasa}%</div>
            <p className="text-xs text-gray-600 mt-1">De estudiantes asignados</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Encuestas Recientes</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
          </Button>
        </div>

        {showFilters && (
          <Card className="mb-4 border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Buscar por nombre</Label>
                  <Input
                    type="text"
                    placeholder="Nombre de la encuesta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo</Label>
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="seminario">Seminarios</SelectItem>
                      <SelectItem value="diplomado">Diplomados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(searchTerm || filterTipo !== "all") && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando {filteredSurveys.length} de {surveys.length} encuestas
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("")
                      setFilterTipo("all")
                    }}
                    className="text-emerald-700 hover:text-emerald-800"
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {filteredSurveys.length === 0 ? (
            <Card className="border-dashed border-2 border-emerald-200">
              <CardContent className="py-16 text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  {surveys.length === 0 ? "No hay encuestas creadas" : "No se encontraron encuestas"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {surveys.length === 0
                    ? "Crea tu primera encuesta para comenzar a recopilar respuestas"
                    : "Intenta ajustar los filtros para ver más resultados"}
                </p>
                {surveys.length === 0 && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Primera Encuesta
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              {totalPages > 1 && <PaginationControls />}

              {paginatedSurveys.map((survey) => (
                <Card
                  key={survey.id}
                  className={`border-emerald-200 hover:shadow-md transition-shadow ${!survey.activa ? "opacity-60" : ""}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-emerald-800 text-xl">{survey.titulo}</CardTitle>
                          {!survey.activa && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">Deshabilitada</span>
                          )}
                        </div>
                        <CardDescription className="mt-2">{survey.descripcion}</CardDescription>

                        {survey.ponenteNombre && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                              <Users className="h-4 w-4" />
                              <span>Ponente: {survey.ponenteNombre}</span>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                          {survey.fechaEncuesta && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-4 w-4 text-emerald-600" />
                              <span>{formatDate(survey.fechaEncuesta)}</span>
                            </div>
                          )}
                          {(survey.horaInicio || survey.horaFin) && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4 text-emerald-600" />
                              <span>
                                {formatTime(survey.horaInicio)}
                                {survey.horaInicio && survey.horaFin && " - "}
                                {formatTime(survey.horaFin)}
                              </span>
                            </div>
                          )}
                        </div>

                        {(survey.programa || survey.nivel || survey.periodo || survey.grupos || survey.auditorio) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {survey.programa && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {survey.programa}
                              </span>
                            )}
                            {survey.nivel && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                Nivel {survey.nivel}
                              </span>
                            )}
                            {survey.periodo && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                                {survey.periodo}
                              </span>
                            )}
                            {survey.grupos && Array.isArray(survey.grupos) && survey.grupos.length > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded cursor-help">
                                      {survey.grupos.length === 1
                                        ? `Grupo: ${survey.grupos[0]}`
                                        : `${survey.grupos.join(", ")}`}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-xs">Grupos asignados:</p>
                                      {survey.grupos.map((grupo: string, idx: number) => (
                                        <p key={idx} className="text-xs">
                                          • {grupo}
                                        </p>
                                      ))}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {survey.auditorio && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded cursor-help">
                                      {survey.auditorio}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">Lugar del evento</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-emerald-700">{survey.respuestas || 0}</div>
                        <div className="text-xs text-gray-600">respuestas</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 mr-auto">
                        <Switch
                          id={`toggle-${survey.id}`}
                          checked={survey.activa}
                          onCheckedChange={() => handleToggleSurveyClick(survey)}
                        />
                        <Label htmlFor={`toggle-${survey.id}`} className="text-sm cursor-pointer">
                          {survey.activa ? "Habilitada" : "Deshabilitada"}
                        </Label>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStudents(survey)}
                        className="border-teal-600 text-teal-700 hover:bg-teal-50 bg-transparent gap-2"
                      >
                        <Users className="h-3 w-3" />
                        Estudiantes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewStatistics(survey)}
                        className="border-purple-600 text-purple-700 hover:bg-purple-50 bg-transparent gap-2"
                      >
                        <BarChart3 className="h-3 w-3" />
                        Estadísticas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCloneSurvey(survey)}
                        className="border-blue-600 text-blue-700 hover:bg-blue-50 bg-transparent gap-2"
                      >
                        <Copy className="h-3 w-3" />
                        Clonar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSurvey(survey)}
                        className="border-orange-600 text-orange-700 hover:bg-orange-50 bg-transparent gap-2"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSurveyClick(survey)}
                        className="border-red-600 text-red-700 hover:bg-red-50 bg-transparent gap-2"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {totalPages > 1 && <PaginationControls />}
            </>
          )}
        </div>
      </div>

      <CreateSurveyDialog
        open={showCreateDialog}
        onOpenChange={handleDialogClose}
        onSuccess={loadData}
        editingSurvey={editingSurvey}
      />

      {selectedSurvey && (
        <>
          <SurveyStudentsDialog
            open={showStudentsDialog}
            onOpenChange={setShowStudentsDialog}
            surveyId={selectedSurvey.id}
            surveyTitle={selectedSurvey.titulo}
            surveyData={selectedSurvey}
          />
          <SurveyResultsDialog
            open={showResultsDialog}
            onOpenChange={setShowResultsDialog}
            surveyId={selectedSurvey.id}
            surveyTitle={selectedSurvey.titulo}
          />
          <SurveyStatisticsDialog
            open={showStatisticsDialog}
            onOpenChange={setShowStatisticsDialog}
            surveyId={selectedSurvey.id}
            surveyTitle={selectedSurvey.titulo}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar encuesta?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar la encuesta "{surveyToDelete?.titulo}"? Esta acción eliminará
              permanentemente la encuesta y todas sus respuestas asociadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSurveyConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {surveyToToggle?.activa ? "¿Deshabilitar encuesta?" : "¿Habilitar encuesta?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {surveyToToggle?.activa
                ? `¿Estás seguro de que deseas deshabilitar la encuesta "${surveyToToggle?.titulo}"? Los estudiantes no podrán responderla mientras esté deshabilitada.`
                : `¿Estás seguro de que deseas habilitar la encuesta "${surveyToToggle?.titulo}"? Los estudiantes podrán responderla una vez habilitada.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSurveyConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              {surveyToToggle?.activa ? "Deshabilitar" : "Habilitar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
