"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Users, UserCheck, Filter, Check, ChevronsUpDown } from "lucide-react"
import { getUniqueStudentValues, getStudentsByFilters } from "@/lib/students"
import { getPonentes } from "@/lib/ponentes"
import type { UserData } from "@/lib/auth"
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
  user?: UserData
}

export function SurveyAssignmentSelector({
  ponenteId,
  grupos,
  estudiantesIndividuales,
  onPonenteChange,
  onGruposChange,
  onEstudiantesIndividualesChange,
  onCategorizacionChange,
  user,
}: SurveyAssignmentSelectorProps) {
  const [allProgramas, setAllProgramas] = useState<string[]>([])
  const [ponentes, setPonentes] = useState<any[]>([])

  const [openPonente, setOpenPonente] = useState(false)
  const [openPrograma, setOpenPrograma] = useState(false)
  const [openNivel, setOpenNivel] = useState(false)
  const [openPeriodo, setOpenPeriodo] = useState(false)
  const [openGrupo, setOpenGrupo] = useState(false)

  const [filterPrograma, setFilterPrograma] = useState("")
  const [filterNivel, setFilterNivel] = useState("")
  const [filterPeriodo, setFilterPeriodo] = useState("")
  const [filterGrupo, setFilterGrupo] = useState("")

  // Data-driven available options per step
  const [availableNiveles, setAvailableNiveles] = useState<string[]>([])
  const [availablePeriodos, setAvailablePeriodos] = useState<string[]>([])
  const [availableGrupos, setAvailableGrupos] = useState<string[]>([])

  const [totalAsignados, setTotalAsignados] = useState(0)

  // Sequential dependency: only enable if previous step selected AND options exist in DB
  const canSelectNivel = !!filterPrograma && availableNiveles.length > 0
  const canSelectPeriodo = !!filterNivel && availablePeriodos.length > 0
  const canSelectGroup = !!filterPeriodo && availableGrupos.length > 0

  useEffect(() => {
    loadInitialData()
  }, [])

  // Load programas list once
  const loadInitialData = async () => {
    const values = await getUniqueStudentValues(user?.rol || "estudiante")
    setAllProgramas(values.programas)
    const ponentesData = await getPonentes(user?.rol || "estudiante")
    setPonentes(ponentesData)
  }

  // When programa changes → fetch available niveles from DB
  useEffect(() => {
    if (!filterPrograma) {
      setAvailableNiveles([])
      setFilterNivel("")
      setFilterPeriodo("")
      setFilterGrupo("")
      return
    }
    getStudentsByFilters({ programa: filterPrograma }, user?.rol || "estudiante").then((students) => {
      const set = new Set(students.map((s: any) => s.nivel).filter(Boolean))
      setAvailableNiveles(Array.from(set as Set<string>).sort())
    })
  }, [filterPrograma])

  // When nivel changes → fetch available periodos from DB
  useEffect(() => {
    if (!filterNivel) {
      setAvailablePeriodos([])
      setFilterPeriodo("")
      setFilterGrupo("")
      return
    }
    getStudentsByFilters({ programa: filterPrograma, nivel: filterNivel }, user?.rol || "estudiante").then((students) => {
      const set = new Set(students.map((s: any) => s.periodo).filter(Boolean))
      setAvailablePeriodos(Array.from(set as Set<string>).sort())
    })
  }, [filterNivel])

  // When periodo changes → fetch available grupos from DB
  useEffect(() => {
    if (!filterPeriodo) {
      setAvailableGrupos([])
      setFilterGrupo("")
      return
    }
    getStudentsByFilters({ programa: filterPrograma, nivel: filterNivel, periodo: filterPeriodo }, user?.rol || "estudiante").then((students) => {
      const set = new Set(students.map((s: any) => s.grupo).filter(Boolean))
      setAvailableGrupos(Array.from(set as Set<string>).sort())
    })
  }, [filterPeriodo])

  useEffect(() => {
    const timer = setTimeout(() => {
      calculateTotalAsignados()
    }, 300)
    return () => clearTimeout(timer)
  }, [grupos])

  const calculateTotalAsignados = async () => {
    if (grupos.length === 0) {
      setTotalAsignados(0)
      return
    }
    const groupCounts = await Promise.all(
      grupos.map(async (grupo) => {
        const students = await getStudentsByFilters(grupo, user?.rol || "estudiante")
        return students.length
      }),
    )
    setTotalAsignados(groupCounts.reduce((sum, count) => sum + count, 0))
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

  return (
    <div className="space-y-6">
      {/* Ponente */}
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
            <Popover open={openPonente} onOpenChange={setOpenPonente} modal={false}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openPonente}
                  className="w-full justify-between h-auto min-h-10 py-2 bg-transparent"
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
              <PopoverContent className="w-100 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar ponente por nombre, cargo o número..." />
                  <CommandList className="max-h-64 overflow-y-auto">
                    <CommandEmpty>No se encontraron ponentes.</CommandEmpty>
                    <CommandGroup>
                      {ponentes.map((ponente) => (
                        <CommandItem
                          key={ponente.id}
                          value={`${ponente.nombre} ${ponente.cargo || ""} ${ponente.numero || ""}`}
                          onSelect={() => {
                            onPonenteChange(ponente.id === ponenteId ? "" : ponente.id)
                            setOpenPonente(false)
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Asignación (Opcional)
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Los filtros se habilitan en orden según los datos existentes: Programa → Nivel → Período → Grupo
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Programa */}
            <div className="space-y-2">
              <Label className="text-sm">Programa</Label>
              <Popover open={openPrograma} onOpenChange={setOpenPrograma} modal={false}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                    <span className={filterPrograma ? "text-foreground" : "text-muted-foreground"}>
                      {filterPrograma || "Seleccionar programa..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-70 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar programa..." />
                    <CommandList className="max-h-64 overflow-y-auto">
                      <CommandEmpty>No encontrado.</CommandEmpty>
                      <CommandGroup>
                        {allProgramas.map((p) => (
                          <CommandItem
                            key={p}
                            value={p}
                            onSelect={(val) => {
                              setFilterPrograma(val === filterPrograma ? "" : val)
                              setOpenPrograma(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", filterPrograma === p ? "opacity-100" : "opacity-0")} />
                            <span className="text-sm">{p}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {filterPrograma && (
                <Badge variant="secondary" className="gap-1">
                  {filterPrograma}
                  <button type="button" onClick={() => setFilterPrograma("")} className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Nivel */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                Nivel
                {filterPrograma && availableNiveles.length === 0 && (
                  <span className="text-xs text-red-500 font-normal">(Sin datos)</span>
                )}
                {!filterPrograma && (
                  <span className="text-xs text-amber-600 font-normal">(Requiere Programa)</span>
                )}
              </Label>
              <Popover open={openNivel} onOpenChange={canSelectNivel ? setOpenNivel : undefined} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!canSelectNivel}
                    className="w-full justify-between font-normal"
                  >
                    <span className={filterNivel ? "text-foreground" : "text-muted-foreground"}>
                      {filterNivel || "Seleccionar nivel..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-70 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar nivel..." />
                    <CommandList className="max-h-64 overflow-y-auto">
                      <CommandEmpty>No encontrado.</CommandEmpty>
                      <CommandGroup>
                        {availableNiveles.map((n) => (
                          <CommandItem
                            key={n}
                            value={n}
                            onSelect={(val) => {
                              setFilterNivel(val === filterNivel ? "" : val)
                              setOpenNivel(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", filterNivel === n ? "opacity-100" : "opacity-0")} />
                            <span className="text-sm">{n}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {filterNivel && (
                <Badge variant="secondary" className="gap-1">
                  {filterNivel}
                  <button type="button" onClick={() => setFilterNivel("")} className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                Período
                {filterNivel && availablePeriodos.length === 0 && (
                  <span className="text-xs text-red-500 font-normal">(Sin datos)</span>
                )}
                {!filterNivel && (
                  <span className="text-xs text-amber-600 font-normal">(Requiere Nivel)</span>
                )}
              </Label>
              <Popover open={openPeriodo} onOpenChange={canSelectPeriodo ? setOpenPeriodo : undefined} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!canSelectPeriodo}
                    className="w-full justify-between font-normal"
                  >
                    <span className={filterPeriodo ? "text-foreground" : "text-muted-foreground"}>
                      {filterPeriodo || "Seleccionar período..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-70 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar período..." />
                    <CommandList className="max-h-64 overflow-y-auto">
                      <CommandEmpty>No encontrado.</CommandEmpty>
                      <CommandGroup>
                        {availablePeriodos.map((p) => (
                          <CommandItem
                            key={p}
                            value={p}
                            onSelect={(val) => {
                              setFilterPeriodo(val === filterPeriodo ? "" : val)
                              setOpenPeriodo(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", filterPeriodo === p ? "opacity-100" : "opacity-0")} />
                            <span className="text-sm">{p}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {filterPeriodo && (
                <Badge variant="secondary" className="gap-1">
                  {filterPeriodo}
                  <button type="button" onClick={() => setFilterPeriodo("")} className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>

            {/* Grupo */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                Grupo
                {filterPeriodo && availableGrupos.length === 0 && (
                  <span className="text-xs text-red-500 font-normal">(Sin datos)</span>
                )}
                {!filterPeriodo && (
                  <span className="text-xs text-amber-600 font-normal">(Requiere Período)</span>
                )}
              </Label>
              <Popover open={openGrupo} onOpenChange={canSelectGroup ? setOpenGrupo : undefined} modal={false}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!canSelectGroup}
                    className="w-full justify-between font-normal"
                  >
                    <span className={filterGrupo ? "text-foreground" : "text-muted-foreground"}>
                      {filterGrupo || "Seleccionar grupo..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-70 p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar grupo..." />
                    <CommandList className="max-h-64 overflow-y-auto">
                      <CommandEmpty>No encontrado.</CommandEmpty>
                      <CommandGroup>
                        {availableGrupos.map((g) => (
                          <CommandItem
                            key={g}
                            value={g}
                            onSelect={(val) => {
                              setFilterGrupo(val === filterGrupo ? "" : val)
                              setOpenGrupo(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", filterGrupo === g ? "opacity-100" : "opacity-0")} />
                            <span className="text-sm">{g}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {filterGrupo && (
                <Badge variant="secondary" className="gap-1">
                  {filterGrupo}
                  <button type="button" onClick={() => setFilterGrupo("")} className="hover:text-red-600">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>

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
              <div className="space-y-2 max-h-75 overflow-y-auto">
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
                      className="h-4 w-4 p-0 hover:bg-red-100 shrink-0"
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
