"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createTemplate } from "@/lib/survey-templates"
import { FileText, CheckCircle } from "lucide-react"

interface CreateTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  surveyData?: {
    titulo: string
    descripcion: string
    preguntas: any[]
  }
}

export function CreateTemplateDialog({ open, onOpenChange, onSuccess, surveyData }: CreateTemplateDialogProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoria, setCategoria] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await createTemplate({
        nombre,
        descripcion,
        preguntas: surveyData?.preguntas || [],
        categoria: categoria || undefined,
        fechaCreacion: new Date().toISOString(),
      })

      onSuccess()
      onOpenChange(false)
      setNombre("")
      setDescripcion("")
      setCategoria("")
    } catch (error) {
      console.error("Error creando plantilla:", error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Crear Plantilla de Encuesta
          </DialogTitle>
          <DialogDescription>
            Guarda las preguntas de esta encuesta como plantilla para reutilizarlas en el futuro
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Plantilla *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Evaluación de Seminarios"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe el propósito de esta plantilla..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoría (Opcional)</Label>
            <Input
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ej: Seminarios, Eventos, Cursos"
            />
          </div>

          {surveyData && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                <strong>{surveyData.preguntas.length}</strong> preguntas serán guardadas en esta plantilla
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving || !nombre}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              {saving ? (
                "Guardando..."
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Crear Plantilla
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
