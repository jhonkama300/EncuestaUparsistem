"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, FileText, Users, TrendingUp, Edit, Trash2, Eye, Calendar, Clock, Filter, Copy } from "lucide-react"
import { CreateSurveyDialog } from "./create-survey-dialog"
import { SurveyResultsDialog } from "./survey-results-dialog"
import { getAllSurveys, getSurveyStats, deleteSurvey, updateSurvey } from "@/lib/surveys"
import { useToast } from "@/hooks/use-toast"
import { getUniqueStudentValues } from "@/lib/students"

export function SurveyManager() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, respuestas: 0, tasa: 0 })
  const [editingSurvey, setEditingSurvey] = useState<any>(null)
  const { toast } = useToast()

  const [filterPrograma, setFilterPrograma] = useState("")
  const [filterNivel, setFilterNivel] = useState("")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [filterGrupo, setFilterGrupo] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [uniqueValues, setUniqueValues] = useState({
    programas: [],
    niveles: [],
    periodos: [],
    grupos: [],
  })

  useEffect(() => {
    loadData()
    loadFilters()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [surveys, filterPrograma, filterNivel, filterPeriodo, filterGrupo])

  const loadData = async () => {
    const surveysData = await getAllSurveys()
    const statsData = await getSurveyStats()
    setSurveys(surveysData)
    setStats(statsData)
  }

  const loadFilters = async () => {
    const values = await getUniqueStudentValues()
    setUniqueValues(values)
  }

  const applyFilters = () => {
    let filtered = [...surveys]

    if (filterPrograma) {
      filtered = filtered.filter((s) => s.programa?.toLowerCase().includes(filterPrograma.toLowerCase()))
    }
    if (filterNivel) {
      filtered = filtered.filter((s) => s.nivel?.toLowerCase().includes(filterNivel.toLowerCase()))
    }
    if (filterPeriodo) {
      filtered = filtered.filter((s) => s.periodo?.toLowerCase().includes(filterPeriodo.toLowerCase()))
    }
    if (filterGrupo) {
      filtered = filtered.filter((s) => s.grupo?.toLowerCase().includes(filterGrupo.toLowerCase()))
    }

    setFilteredSurveys(filtered)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    return timeString
  }

  const handleToggleSurvey = async (surveyId: string, currentStatus: boolean, surveyTitle: string) => {
    try {
      await updateSurvey(surveyId, { activa: !currentStatus })
      toast({
        title: !currentStatus ? "Encuesta habilitada" : "Encuesta deshabilitada",
        description: `La encuesta "${surveyTitle}" ha sido ${!currentStatus ? "habilitada" : "deshabilitada"}.`,
      })
      loadData()
    } catch (error) {
      console.error("Error actualizando encuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la encuesta.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteSurvey = async (surveyId: string, surveyTitle: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar la encuesta "${surveyTitle}"? Esto también eliminará todas las respuestas asociadas.`,
      )
    ) {
      return
    }

    try {
      await deleteSurvey(surveyId)
      toast({
        title: "Encuesta eliminada",
        description: `La encuesta "${surveyTitle}" y sus respuestas han sido eliminadas exitosamente.`,
      })
      loadData()
    } catch (error) {
      console.error("Error eliminando encuesta:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la encuesta. Intenta de nuevo.",
        variant: "destructive",
      })
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

  const handleDialogClose = (open: boolean) => {
    setShowCreateDialog(open)
    if (!open) {
      setEditingSurvey(null)
    }
  }

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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Programa</Label>
                  <Input
                    type="text"
                    placeholder="Filtrar por programa..."
                    value={filterPrograma}
                    onChange={(e) => setFilterPrograma(e.target.value)}
                    list="filter-programas-list"
                  />
                  <datalist id="filter-programas-list">
                    {uniqueValues.programas.map((p: string) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nivel</Label>
                  <Input
                    type="text"
                    placeholder="Filtrar por nivel..."
                    value={filterNivel}
                    onChange={(e) => setFilterNivel(e.target.value)}
                    list="filter-niveles-list"
                  />
                  <datalist id="filter-niveles-list">
                    {uniqueValues.niveles.map((n: string) => (
                      <option key={n} value={n} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Período</Label>
                  <Input
                    type="text"
                    placeholder="Filtrar por período..."
                    value={filterPeriodo}
                    onChange={(e) => setFilterPeriodo(e.target.value)}
                    list="filter-periodos-list"
                  />
                  <datalist id="filter-periodos-list">
                    {uniqueValues.periodos.map((p: string) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Grupo</Label>
                  <Input
                    type="text"
                    placeholder="Filtrar por grupo..."
                    value={filterGrupo}
                    onChange={(e) => setFilterGrupo(e.target.value)}
                    list="filter-grupos-list"
                  />
                  <datalist id="filter-grupos-list">
                    {uniqueValues.grupos.map((g: string) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
              </div>

              {(filterPrograma || filterNivel || filterPeriodo || filterGrupo) && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando {filteredSurveys.length} de {surveys.length} encuestas
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFilterPrograma("")
                      setFilterNivel("")
                      setFilterPeriodo("")
                      setFilterGrupo("")
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
            filteredSurveys.map((survey) => (
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

                      {(survey.programa || survey.nivel || survey.periodo || survey.grupo) && (
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
                          {survey.grupo && (
                            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">
                              Grupo {survey.grupo}
                            </span>
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
                        onCheckedChange={() => handleToggleSurvey(survey.id, survey.activa, survey.titulo)}
                      />
                      <Label htmlFor={`toggle-${survey.id}`} className="text-sm cursor-pointer">
                        {survey.activa ? "Habilitada" : "Deshabilitada"}
                      </Label>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewResults(survey)}
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 bg-transparent gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Ver Resultados
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCloneSurvey(survey)}
                      className="border-purple-600 text-purple-700 hover:bg-purple-50 bg-transparent gap-2"
                    >
                      <Copy className="h-3 w-3" />
                      Clonar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditSurvey(survey)}
                      className="border-blue-600 text-blue-700 hover:bg-blue-50 bg-transparent gap-2"
                    >
                      <Edit className="h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSurvey(survey.id, survey.titulo)}
                      className="border-red-600 text-red-700 hover:bg-red-50 bg-transparent gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                      Eliminar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
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
        <SurveyResultsDialog
          open={showResultsDialog}
          onOpenChange={setShowResultsDialog}
          surveyId={selectedSurvey.id}
          surveyTitle={selectedSurvey.titulo}
        />
      )}
    </>
  )
}
