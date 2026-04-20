"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Users, UserCheck, Filter, Check, ChevronsUpDown } from "lucide-react"
import { getUniqueStudentValues, getStudentsByFilters } from "@/lib/students"
import { getPonentes } from "@/lib/ponentes"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SurveyAssignmentSelectorProps {
  ponenteId: string
  grupos: Array<{
    programa?: string
    grupo?: string
    periodo?: string
    nivel?: string
  }>
  estudiantesIndividuales: string[]
  onPonenteChange: (ponenteId: string) => void
  onGruposChange: (grupos: any[]) => void
  onEstudiantesIndividualesChange: (estudiantes: string[]) => void
  onCategorizacionChange?: (data: { programa: string; nivel: string; periodo: string; grupo?: string }) => void
}

export function SurveyAssignmentSelector({
  ponenteId,
  grupos,
  estudiantesIndividuales,
  onPonenteChange,
  onGruposChange,
  onEstudiantesIndividualesChange,
  onCategorizacionChange,
}: SurveyAssignmentSelectorProps) {
  const [uniqueValues, setUniqueValues] = useState<{
    programas: string[];
    grupos: string[];
    periodos: string[];
    niveles: string[];
    jornadas: string[];
  }>({
    programas: [],
    grupos: [],
    periodos: [],
    niveles: [],
    jornadas: [],
  })
  const [ponentes, setPonentes] = useState<any[]>([])
  const [openPonenteSearch, setOpenPonenteSearch] = useState(false)

  const [filterPrograma, setFilterPrograma] = useState("")
  const [filterNivel, setFilterNivel] = useState("")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [filterGrupo, setFilterGrupo] = useState("")

  const [searchPrograma, setSearchPrograma] = useState("")
  const [searchNivel, setSearchNivel] = useState("")
  const [searchPeriodo, setSearchPeriodo] = useState("")
  const [searchGrupo, setSearchGrupo] = useState("")

  const [totalAsignados, setTotalAsignados] = useState(0)
  const [filteredGroups, setFilteredGroups] = useState<string[]>([])

  const canSelectNivel = !!filterPrograma
  const canSelectPeriodo = !!filterPrograma && !!filterNivel
  const canSelectGroup = !!filterPrograma && !!filterNivel && !!filterPeriodo

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTotalAsignados()
    }, 300)
    return () => clearTimeout(timer)
  }, [grupos])

  useEffect(() => {
    filterAvailableGroups()
  }, [filterPrograma, filterNivel, filterPeriodo, uniqueValues])

  useEffect(() => {
    setFilterGrupo("")
    setSearchGrupo("")
  }, [filterPrograma, filterNivel, filterPeriodo])

  useEffect(() => {
    if (!filterPrograma) {
      setFilterNivel("")
      setSearchNivel("")
      setFilterPeriodo("")
      setSearchPeriodo("")
      setFilterGrupo("")
      setSearchGrupo("")
    }
  }, [filterPrograma])

  useEffect(() => {
    if (!filterNivel) {
      setFilterPeriodo("")
      setSearchPeriodo("")
      setFilterGrupo("")
      setSearchGrupo("")
    }
  }, [filterNivel])

  useEffect(() => {
    if (!filterPeriodo) {
      setFilterGrupo("")
      setSearchGrupo("")
    }
  }, [filterPeriodo])

  const loadData = async () => {
    const values = await getUniqueStudentValues()
    setUniqueValues(values)
    const ponentesData = await getPonentes()
    setPonentes(ponentesData)
  }

  const filterAvailableGroups = async () => {
    if (!filterPrograma && !filterNivel && !filterPeriodo) {
      setFilteredGroups(uniqueValues.grupos)
      return
    }

    const filters: any = {}
    if (filterPrograma) filters.programa = filterPrograma
    if (filterNivel) filters.nivel = filterNivel
    if (filterPeriodo) filters.periodo = filterPeriodo

    const students = await getStudentsByFilters(filters)
    const gruposSet = new Set(students.map((s: any) => s.grupo).filter(Boolean))
    setFilteredGroups(Array.from(gruposSet).sort())
  }

  const calculateTotalAsignados = async () => {
    if (grupos.length === 0) {
      setTotalAsignados(0)
      return
    }

    const groupCounts = await Promise.all(
      grupos.map(async (grupo) => {
        const students = await getStudentsByFilters(grupo)
        return students.length
      }),
    )
    const total = groupCounts.reduce((sum, count) => sum + count, 0)
    setTotalAsignados(total)
  }

  const addGrupo = () => {
    const newGrupo: any = {}
    if (filterPrograma) newGrupo.programa = filterPrograma
    if (filterNivel) newGrupo.nivel = filterNivel
    if (filterPeriodo) newGrupo.periodo = filterPeriodo
    if (filterGrupo) newGrupo.grupo = filterGrupo

    const exists = grupos.some(
      (g) =>
        g.programa === newGrupo.programa &&
        g.nivel === newGrupo.nivel &&
        g.periodo === newGrupo.periodo &&
        g.grupo === newGrupo.grupo,
    )

    if (!exists && Object.keys(newGrupo).length > 0) {
      onGruposChange([...grupos, newGrupo])
      onCategorizacionChange?.({
        programa: filterPrograma,
        nivel: filterNivel,
        periodo: filterPeriodo,
        grupo: filterGrupo || undefined,
      })
      setFilterPrograma("")
      setFilterNivel("")
      setFilterPeriodo("")
      setFilterGrupo("")
    }
  }

  const removeGrupo = (index: number) => {
    onGruposChange(grupos.filter((_, i) => i !== index))
  }

  const selectedPonente = ponentes.find((p) => p.id === ponenteId)

  const filteredProgramas = uniqueValues.programas.filter((p: string) =>
    p.toLowerCase().includes(searchPrograma.toLowerCase()),
  )
  const filteredNiveles = uniqueValues.niveles.filter((n: string) =>
    n.toLowerCase().includes(searchNivel.toLowerCase()),
  )
  const filteredPeriodos = uniqueValues.periodos.filter((p: string) =>
    p.toLowerCase().includes(searchPeriodo.toLowerCase()),
  )
  const filteredGruposSearch = filteredGroups.filter((g: string) => g.toLowerCase().includes(searchGrupo.toLowerCase()))

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            Seleccionar Ponente a Evaluar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Ponente *</Label>
            <Popover open={openPonenteSearch} onOpenChange={setOpenPonenteSearch}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPonenteSearch}
                  className="w-full justify-between h-auto min-h-[40px] py-2 bg-transparent"
                >
                  {selectedPonente ? (
                    <div className="flex flex-col items-start gap-1 text-left">
                      <span className="font-medium">{selectedPonente.nombre}</span>
                      {selectedPonente.cargo && (
                        <span className="text-xs text-muted-foreground">{selectedPonente.cargo}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Buscar y seleccionar ponente...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar ponente por nombre, cargo o número..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron ponentes.</CommandEmpty>
                    <CommandGroup>
                      {ponentes.map((ponente) => (
                        <CommandItem
                          key={ponente.id}
                          value={`${ponente.nombre} ${ponente.cargo || ""} ${ponente.numero || ""}`}
                          onSelect={() => {
                            onPonenteChange(ponente.id === ponenteId ? "" : ponente.id)
                            setOpenPonenteSearch(false)
                          }}
                          className="flex items-start gap-2 py-3"
                        >
                          <Check
                            className={cn(
                              "mt-1 h-4 w-4 shrink-0",
                              ponenteId === ponente.id ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="font-medium">{ponente.nombre}</span>
                            {ponente.cargo && <span className="text-xs text-blue-700">{ponente.cargo}</span>}
                            {ponente.numero && <span className="text-xs text-blue-600">Número: {ponente.numero}</span>}
                            {ponente.descripcion && (
                              <span className="text-xs text-muted-foreground line-clamp-2">{ponente.descripcion}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {selectedPonente && (
            <div className="p-3 bg-white rounded-lg border border-blue-200 relative">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onPonenteChange("")}
                className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                title="Eliminar ponente seleccionado"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="pr-8">
                <p className="text-sm font-semibold text-blue-900">{selectedPonente.nombre}</p>
                {selectedPonente.cargo && <p className="text-xs text-blue-700 mt-1">{selectedPonente.cargo}</p>}
                {selectedPonente.numero && (
                  <p className="text-xs text-blue-600 mt-1">Número: {selectedPonente.numero}</p>
                )}
                {selectedPonente.descripcion && (
                  <p className="text-xs text-gray-600 mt-2">{selectedPonente.descripcion}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Asignación (Opcional)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Los filtros se habilitan en orden: Programa → Nivel → Período → Grupo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Programa Filter */}
            <div className="space-y-2">
              <Label className="text-sm">Programa *</Label>
              <Input
                type="text"
                placeholder="Buscar programa..."
                value={searchPrograma || filterPrograma}
                onChange={(e) => {
                  setSearchPrograma(e.target.value)
                  const found = filteredProgramas.find((p: string) =>
                    p.toLowerCase().includes(e.target.value.toLowerCase()),
                  )
                  if (found) setFilterPrograma(found)
                }}
                list="programas-list"
              />
              <datalist id="programas-list">
                {filteredProgramas.map((p: string) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {filterPrograma && (
                <Badge variant="secondary" className="mt-1">
                  {filterPrograma}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setFilterPrograma("")
                      setSearchPrograma("")
                    }}
                    className="h-4 w-4 p-0 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>

            {/* Nivel Filter */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                Nivel *
                {!canSelectNivel && <span className="text-xs text-amber-600 font-normal">(Requiere Programa)</span>}
              </Label>
              <Input
                type="text"
                placeholder={canSelectNivel ? "Buscar nivel..." : "Selecciona Programa primero"}
                value={searchNivel || filterNivel}
                onChange={(e) => {
                  if (!canSelectNivel) return
                  setSearchNivel(e.target.value)
                  const found = filteredNiveles.find((n: string) =>
                    n.toLowerCase().includes(e.target.value.toLowerCase()),
                  )
                  if (found) setFilterNivel(found)
                }}
                list="niveles-list"
                disabled={!canSelectNivel}
                className={!canSelectNivel ? "opacity-50 cursor-not-allowed" : ""}
              />
              <datalist id="niveles-list">
                {filteredNiveles.map((n: string) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
              {filterNivel && (
                <Badge variant="secondary" className="mt-1">
                  {filterNivel}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setFilterNivel("")
                      setSearchNivel("")
                    }}
                    className="h-4 w-4 p-0 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>

            {/* Periodo Filter */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                Período *
                {!canSelectPeriodo && (
                  <span className="text-xs text-amber-600 font-normal">(Requiere Programa y Nivel)</span>
                )}
              </Label>
              <Input
                type="text"
                placeholder={canSelectPeriodo ? "Buscar período..." : "Selecciona Programa y Nivel primero"}
                value={searchPeriodo || filterPeriodo}
                onChange={(e) => {
                  if (!canSelectPeriodo) return
                  setSearchPeriodo(e.target.value)
                  const found = filteredPeriodos.find((p: string) =>
                    p.toLowerCase().includes(e.target.value.toLowerCase()),
                  )
                  if (found) setFilterPeriodo(found)
                }}
                list="periodos-list"
                disabled={!canSelectPeriodo}
                className={!canSelectPeriodo ? "opacity-50 cursor-not-allowed" : ""}
              />
              <datalist id="periodos-list">
                {filteredPeriodos.map((p: string) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {filterPeriodo && (
                <Badge variant="secondary" className="mt-1">
                  {filterPeriodo}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setFilterPeriodo("")
                      setSearchPeriodo("")
                    }}
                    className="h-4 w-4 p-0 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>

            {/* Grupo Filter */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                Grupo
                {!canSelectGroup && (
                  <span className="text-xs text-amber-600 font-normal">(Requiere los 3 filtros anteriores)</span>
                )}
              </Label>
              <Input
                type="text"
                placeholder={canSelectGroup ? "Buscar grupo..." : "Completa los 3 filtros anteriores"}
                value={searchGrupo || filterGrupo}
                onChange={(e) => {
                  if (!canSelectGroup) return
                  setSearchGrupo(e.target.value)
                  const found = filteredGruposSearch.find((g: string) =>
                    g.toLowerCase().includes(e.target.value.toLowerCase()),
                  )
                  if (found) setFilterGrupo(found)
                }}
                list="grupos-list"
                disabled={!canSelectGroup}
                className={!canSelectGroup ? "opacity-50 cursor-not-allowed" : ""}
              />
              <datalist id="grupos-list">
                {filteredGruposSearch.map((g: string) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
              {filterGrupo && (
                <Badge variant="secondary" className="mt-1">
                  {filterGrupo}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setFilterGrupo("")
                      setSearchGrupo("")
                    }}
                    className="h-4 w-4 p-0 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>

          {!canSelectGroup && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Nota:</strong> Los filtros se habilitan en orden secuencial. Primero selecciona Programa, luego
                Nivel, después Período, y finalmente podrás elegir un Grupo específico.
              </p>
            </div>
          )}

          <Button
            type="button"
            onClick={addGrupo}
            disabled={!filterPrograma && !filterNivel && !filterPeriodo && !filterGrupo}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Grupo con Filtros Seleccionados
          </Button>

          {grupos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Grupos asignados:</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {grupos.map((grupo, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center justify-between gap-2 py-2 px-3 w-full"
                  >
                    <span className="text-xs flex-1">
                      {grupo.programa && `Programa: ${grupo.programa}`}
                      {grupo.nivel && ` | Nivel: ${grupo.nivel}`}
                      {grupo.periodo && ` | Período: ${grupo.periodo}`}
                      {grupo.grupo && ` | Grupo: ${grupo.grupo}`}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeGrupo(index)}
                      className="h-4 w-4 p-0 hover:bg-red-100 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {grupos.length > 0 && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <Users className="h-5 w-5" />
                  <span className="font-semibold">Total de estudiantes asignados: {totalAsignados}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
