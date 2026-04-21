"use client"
import { useState, useEffect, useCallback } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserPlus, Loader2, Pencil, ImageIcon, Upload } from "lucide-react"
import { addPonente, updatePonente } from "@/lib/ponentes"
import type { PonenteData } from "@/lib/ponentes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { UserData } from "@/lib/auth"

const IMAGENES_PONENTES = [
  { value: "default", label: "Avatar por defecto", url: "/placeholder.svg" },
  { value: "ponente1", label: "Ponente 1", url: "/ponente1.svg" },
  { value: "ponente2", label: "Ponente 2", url: "/ponente2.svg" },
  { value: "ponente3", label: "Ponente 3", url: "/ponente3.svg" },
]

interface AddPonenteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editMode?: boolean
  ponenteData?: PonenteData
  user: UserData
}

export function AddPonenteDialog({
  open,
  onOpenChange,
  onSuccess,
  editMode = false,
  ponenteData,
  user,
}: AddPonenteDialogProps) {

  const [loading, setLoading] = useState(false)
  const [customImage, setCustomImage] = useState<string>("")
  const [formData, setFormData] = useState({
    nombre: "",
    numero: "",
    cargo: "",
    descripcion: "",
    imagen: "default",
  })

  useEffect(() => {
    if (open && editMode && ponenteData) {
      const imagenMatch = IMAGENES_PONENTES.find((img) => img.url === ponenteData.imagen)
      if (!imagenMatch && ponenteData.imagen) {
        setCustomImage(ponenteData.imagen)
        setFormData({
          nombre: ponenteData.nombre || "",
          numero: ponenteData.numero || "",
          cargo: ponenteData.cargo || "",
          descripcion: ponenteData.descripcion || "",
          imagen: "custom",
        })
      } else {
        setFormData({
          nombre: ponenteData.nombre || "",
          numero: ponenteData.numero || "",
          cargo: ponenteData.cargo || "",
          descripcion: ponenteData.descripcion || "",
          imagen: imagenMatch?.value || "default",
        })
        setCustomImage("")
      }
    } else if (!open) {
      setFormData({
        nombre: "",
        numero: "",
        cargo: "",
        descripcion: "",
        imagen: "default",
      })
      setCustomImage("")
    }
  }, [open, editMode, ponenteData])

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es muy grande. Por favor selecciona una imagen menor a 10MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setCustomImage(base64String)
      setFormData((prev) => ({ ...prev, imagen: "custom" }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      alert("El nombre del ponente es requerido")
      return
    }

    setLoading(true)
    try {
      let imagenUrl = ""
      if (formData.imagen === "custom") {
        imagenUrl = customImage
      } else {
        const imagenSeleccionada = IMAGENES_PONENTES.find((img) => img.value === formData.imagen)
        imagenUrl = imagenSeleccionada?.url || ""
      }

      if (editMode && ponenteData?.id) {
        const updateData: Partial<PonenteData> = {
          nombre: formData.nombre,
          numero: formData.numero || undefined,
          cargo: formData.cargo || undefined,
          descripcion: formData.descripcion,
          imagen: imagenUrl,
        }
        await updatePonente(ponenteData.id, updateData, user.rol)
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
        await addPonente(newPonenteData, user.rol)
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

  const getImagePreview = () => {
    if (formData.imagen === "custom") {
      return customImage
    }
    const imagenSeleccionada = IMAGENES_PONENTES.find((img) => img.value === formData.imagen)
    return imagenSeleccionada?.url || ""
  }

  const imagePreview = getImagePreview()

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
                  {IMAGENES_PONENTES.map((img: { value: string; label: string; url: string }) => (
                    <SelectItem key={img.value} value={img.value}>
                      {img.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Cargar imagen personalizada</SelectItem>
                </SelectContent>
              </Select>

              {formData.imagen === "custom" && (
                <div className="mt-2">
                  <Label
                    htmlFor="custom-image"
                    className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700">
                      {customImage ? "Cambiar imagen" : "Haz clic para cargar una imagen"}
                    </span>
                  </Label>
                  <Input
                    id="custom-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tamaño máximo: 10MB. Formatos: JPG, PNG, GIF, SVG</p>
                </div>
              )}

              {imagePreview && (
                <div className="mt-2 flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white border-2 border-emerald-300">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-emerald-700">
                    {formData.imagen === "custom"
                      ? "Imagen personalizada cargada"
                      : "Vista previa de la imagen seleccionada"}
                  </p>
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
