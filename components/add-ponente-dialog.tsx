"use client"
import { useState, useEffect, useCallback } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Loader2, Pencil, ImageIcon } from "lucide-react"
import { addPonente, updatePonente } from "@/lib/ponentes"
import type { PonenteData } from "@/lib/ponentes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddPonenteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editMode?: boolean
  ponenteData?: any
}

const IMAGENES_PONENTES = [
  { value: "ponente-1", label: "Ponente 1 (Hombre formal)", url: "/images/ponentes/ponente-1.jpg" },
  { value: "ponente-2", label: "Ponente 2 (Mujer formal)", url: "/images/ponentes/ponente-2.jpg" },
  { value: "ponente-3", label: "Ponente 3 (Hombre casual)", url: "/images/ponentes/ponente-3.jpg" },
  { value: "ponente-4", label: "Ponente 4 (Mujer casual)", url: "/images/ponentes/ponente-4.jpg" },
  { value: "default", label: "Sin imagen", url: "" },
]

export function AddPonenteDialog({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  ponenteData,
}: AddPonenteDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    numero: "",
    cargo: "",
    descripcion: "",
    imagen: "default",
  })

  useEffect(() => {
    if (open && editMode && ponenteData) {
      setFormData({
        nombre: ponenteData.nombre || "",
        numero: ponenteData.numero || "",
        cargo: ponenteData.cargo || "",
        descripcion: ponenteData.descripcion || "",
        imagen: ponenteData.imagen || "default",
      })
    } else if (!open) {
      setFormData({
        nombre: "",
        numero: "",
        cargo: "",
        descripcion: "",
        imagen: "default",
      })
    }
  }, [open, editMode, ponenteData])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert("El nombre del ponente es requerido")
      return
    }

    setLoading(true)
    try {
      const imagenSeleccionada = IMAGENES_PONENTES.find((img) => img.value === formData.imagen)
      const imagenUrl = imagenSeleccionada?.url || ""

      if (editMode && ponenteData?.id) {
        const updateData: Partial<PonenteData> = {
          nombre: formData.nombre,
          numero: formData.numero || undefined,
          cargo: formData.cargo || undefined,
          descripcion: formData.descripcion,
          imagen: imagenUrl,
        }
        await updatePonente(ponenteData.id, updateData)
        alert("Ponente actualizado exitosamente")
      } else {
        const newPonenteData: PonenteData = {
          nombre: formData.nombre,
          numero: formData.numero || undefined,
          cargo: formData.cargo || undefined,
          descripcion: formData.descripcion,
          imagen: imagenUrl,
          fechaCreacion: new Date().toISOString(),
          activo: true,
        }
        await addPonente(newPonenteData)
        alert("Ponente agregado exitosamente")
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(`Error ${editMode ? "actualizando" : "agregando"} ponente:`, error)
      alert(`Error al ${editMode ? "actualizar" : "agregar"} el ponente`)
    } finally {
      setLoading(false)
    }
  }

  const imagenSeleccionada = IMAGENES_PONENTES.find((img) => img.value === formData.imagen)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white -m-6 mb-0 p-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {editMode ? <Pencil className="h-6 w-6" /> : <UserPlus className="h-6 w-6" />}
            {editMode ? "Editar Ponente" : "Agregar Nuevo Ponente"}
          </DialogTitle>
          <DialogDescription className="text-emerald-50">
            {editMode ? "Actualiza la información del ponente" : "Registra un nuevo ponente con su información básica"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-emerald-900">
                Nombre Completo *
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder="Ej: Dr. Juan Pérez"
                required
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero" className="text-emerald-900">
                Número del Ponente
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange("numero", e.target.value)}
                placeholder="Ej: 1234567890"
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="cargo" className="text-emerald-900">
                Cargo del Ponente
              </Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleInputChange("cargo", e.target.value)}
                placeholder="Ej: Director de Investigación"
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imagen" className="text-emerald-900 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Imagen del Ponente
              </Label>
              <Select value={formData.imagen} onValueChange={(value) => handleInputChange("imagen", value)}>
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500">
                  <SelectValue placeholder="Seleccionar imagen" />
                </SelectTrigger>
                <SelectContent>
                  {IMAGENES_PONENTES.map((img) => (
                    <SelectItem key={img.value} value={img.value}>
                      {img.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {imagenSeleccionada && imagenSeleccionada.url && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-emerald-300">
                    <img
                      src={imagenSeleccionada.url || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/diverse-avatars.png"
                      }}
                    />
                  </div>
                  <p className="text-sm text-emerald-700">Vista previa de la imagen seleccionada</p>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion" className="text-emerald-900">
                Descripción / Tema *
              </Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => handleInputChange("descripcion", e.target.value)}
                placeholder="Describe el tema de la ponencia o información relevante..."
                rows={4}
                required
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editMode ? "Actualizando..." : "Agregando..."}
                </>
              ) : (
                <>
                  {editMode ? <Pencil className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {editMode ? "Actualizar Ponente" : "Agregar Ponente"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
