"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, Pencil, Trash2 } from "lucide-react"
import { getPonentes, deletePonente } from "@/lib/ponentes"
import { AddPonenteDialog } from "./add-ponente-dialog"

export function PonenteUploader() {
  const [ponentes, setPonentes] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadPonentes()
  }, [])

  const loadPonentes = async () => {
    const data = await getPonentes()
    setPonentes(data)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Gestión de Ponentes</h2>
          <p className="text-sm text-emerald-700 mt-1">
            Total: {ponentes.length} ponente{ponentes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
        >
          <UserPlus className="h-4 w-4" />
          Agregar Ponente
        </Button>
      </div>

      <AddPonenteDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={loadPonentes} />

      <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
          <CardTitle className="text-emerald-900">Ponentes Registrados</CardTitle>
          <CardDescription className="text-emerald-700">
            Lista de todos los ponentes activos en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {ponentes.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay ponentes registrados</p>
              <p className="text-gray-400 text-sm mt-2">Haz clic en "Agregar Ponente" para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ponentes.map((ponente) => (
                <div
                  key={ponente.id}
                  className="rounded-lg border border-emerald-200 bg-white p-5 transition-all hover:shadow-md hover:border-emerald-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-emerald-900">{ponente.nombre}</h3>
                          {ponente.numero && (
                            <p className="text-sm text-emerald-600 font-medium">Número: {ponente.numero}</p>
                          )}
                        </div>
                      </div>

                      {ponente.cargo && (
                        <p className="text-sm text-emerald-700 font-medium mb-1">
                          <span className="font-semibold">Cargo:</span> {ponente.cargo}
                        </p>
                      )}

                      {ponente.descripcion && (
                        <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-3 rounded-md">
                          <span className="font-semibold text-gray-900">Tema:</span> {ponente.descripcion}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {ponente.jornada && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                            📅 {ponente.jornada}
                          </span>
                        )}
                        {ponente.programa && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                            🎓 {ponente.programa}
                          </span>
                        )}
                        {ponente.grupo && (
                          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700">
                            👥 Grupo {ponente.grupo}
                          </span>
                        )}
                        {ponente.periodo && (
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                            📆 {ponente.periodo}
                          </span>
                        )}
                        {ponente.nivel && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
                            📊 Nivel {ponente.nivel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                        onClick={() => alert("Función de editar próximamente")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                        onClick={() => handleDelete(ponente.id, ponente.nombre)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
