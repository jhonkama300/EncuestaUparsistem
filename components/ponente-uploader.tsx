"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2 } from "lucide-react"
import { addPonente, getStudentFilters, getPonentes } from "@/lib/ponentes"
import type { PonenteData } from "@/lib/ponentes"

export function PonenteUploader() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<any>({
    jornadas: [],
    programas: [],
    grupos: [],
    periodos: [],
    niveles: [],
  })
  const [ponentes, setPonentes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    cargo: "",
    institucion: "",
    jornada: "all",
    programa: "all",
    grupo: "all",
    periodo: "all",
    nivel: "all",
  })

  useEffect(() => {
    loadFilters()
    loadPonentes()
  }, [])

  const loadFilters = async () => {
    const data = await getStudentFilters()
    setFilters(data)
  }

  const loadPonentes = async () => {
    const data = await getPonentes()
    setPonentes(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert("El nombre del ponente es requerido")
      return
    }

    setLoading(true)
    try {
      const ponenteData: PonenteData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        cargo: formData.cargo || undefined,
        institucion: formData.institucion || undefined,
        jornada: formData.jornada === "all" ? undefined : formData.jornada,
        programa: formData.programa === "all" ? undefined : formData.programa,
        grupo: formData.grupo === "all" ? undefined : formData.grupo,
        periodo: formData.periodo === "all" ? undefined : formData.periodo,
        nivel: formData.nivel === "all" ? undefined : formData.nivel,
        fechaCreacion: new Date().toISOString(),
        activo: true,
      }

      await addPonente(ponenteData)
      alert("Ponente agregado exitosamente")

      // Limpiar formulario
      setFormData({
        nombre: "",
        descripcion: "",
        cargo: "",
        institucion: "",
        jornada: "all",
        programa: "all",
        grupo: "all",
        periodo: "all",
        nivel: "all",
      })

      // Recargar lista de ponentes
      loadPonentes()
    } catch (error) {
      console.error("Error agregando ponente:", error)
      alert("Error al agregar el ponente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <UserPlus className="h-5 w-5" />
            Agregar Ponente
          </CardTitle>
          <CardDescription className="text-emerald-700">
            Registra un nuevo ponente y asígnalo a grupos específicos de estudiantes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-emerald-900">
                  Nombre Completo *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Dr. Juan Pérez"
                  required
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cargo" className="text-emerald-900">
                  Cargo
                </Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ej: Director de Investigación"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="institucion" className="text-emerald-900">
                  Institución
                </Label>
                <Input
                  id="institucion"
                  value={formData.institucion}
                  onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                  placeholder="Ej: Universidad Nacional"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="descripcion" className="text-emerald-900">
                  Descripción / Tema
                </Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el tema de la ponencia o información relevante..."
                  rows={3}
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <h3 className="mb-3 font-semibold text-emerald-900">Asignación a Grupos</h3>
              <p className="mb-4 text-sm text-emerald-700">
                Selecciona los filtros para asignar este ponente a grupos específicos de estudiantes
              </p>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="jornada" className="text-emerald-900">
                    Jornada
                  </Label>
                  <Select
                    value={formData.jornada}
                    onValueChange={(value) => setFormData({ ...formData, jornada: value })}
                  >
                    <SelectTrigger className="border-emerald-200 bg-white">
                      <SelectValue placeholder="Todas las jornadas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las jornadas</SelectItem>
                      {filters.jornadas.map((j: string) => (
                        <SelectItem key={j} value={j}>
                          {j}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="programa" className="text-emerald-900">
                    Programa
                  </Label>
                  <Select
                    value={formData.programa}
                    onValueChange={(value) => setFormData({ ...formData, programa: value })}
                  >
                    <SelectTrigger className="border-emerald-200 bg-white">
                      <SelectValue placeholder="Todos los programas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los programas</SelectItem>
                      {filters.programas.map((p: string) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo" className="text-emerald-900">
                    Grupo
                  </Label>
                  <Select value={formData.grupo} onValueChange={(value) => setFormData({ ...formData, grupo: value })}>
                    <SelectTrigger className="border-emerald-200 bg-white">
                      <SelectValue placeholder="Todos los grupos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grupos</SelectItem>
                      {filters.grupos.map((g: string) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo" className="text-emerald-900">
                    Período
                  </Label>
                  <Select
                    value={formData.periodo}
                    onValueChange={(value) => setFormData({ ...formData, periodo: value })}
                  >
                    <SelectTrigger className="border-emerald-200 bg-white">
                      <SelectValue placeholder="Todos los períodos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los períodos</SelectItem>
                      {filters.periodos.map((p: string) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nivel" className="text-emerald-900">
                    Nivel
                  </Label>
                  <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                    <SelectTrigger className="border-emerald-200 bg-white">
                      <SelectValue placeholder="Todos los niveles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los niveles</SelectItem>
                      {filters.niveles.map((n: string) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Agregar Ponente
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
          <CardTitle className="text-emerald-900">Ponentes Registrados</CardTitle>
          <CardDescription className="text-emerald-700">
            Total: {ponentes.length} ponente{ponentes.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {ponentes.length === 0 ? (
            <p className="text-center text-gray-500">No hay ponentes registrados</p>
          ) : (
            <div className="space-y-3">
              {ponentes.map((ponente) => (
                <div
                  key={ponente.id}
                  className="rounded-lg border border-emerald-200 bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-emerald-900">{ponente.nombre}</h3>
                      {ponente.cargo && <p className="text-sm text-emerald-700">{ponente.cargo}</p>}
                      {ponente.institucion && <p className="text-sm text-gray-600">{ponente.institucion}</p>}
                      {ponente.descripcion && <p className="mt-2 text-sm text-gray-700">{ponente.descripcion}</p>}

                      <div className="mt-2 flex flex-wrap gap-2">
                        {ponente.jornada && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700">
                            {ponente.jornada}
                          </span>
                        )}
                        {ponente.programa && (
                          <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                            {ponente.programa}
                          </span>
                        )}
                        {ponente.grupo && (
                          <span className="rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-700">
                            Grupo {ponente.grupo}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
