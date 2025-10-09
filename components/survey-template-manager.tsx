"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTemplates, deleteTemplate } from "@/lib/survey-templates"
import { FileText, Trash2, Calendar, ListChecks } from "lucide-react"
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

interface SurveyTemplateManagerProps {
  onSelectTemplate?: (templateId: string) => void
}

export function SurveyTemplateManager({ onSelectTemplate }: SurveyTemplateManagerProps) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setLoading(true)
    const data = await getTemplates()
    setTemplates(data)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!templateToDelete) return

    try {
      await deleteTemplate(templateToDelete)
      await loadTemplates()
      setDeleteDialogOpen(false)
      setTemplateToDelete(null)
    } catch (error) {
      console.error("Error eliminando plantilla:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Cargando plantillas...</div>
      </div>
    )
  }

  if (templates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No hay plantillas disponibles</p>
          <p className="text-sm text-gray-500">
            Crea una plantilla desde una encuesta existente para reutilizar las preguntas
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    {template.nombre}
                  </CardTitle>
                  {template.categoria && (
                    <Badge variant="secondary" className="mt-2">
                      {template.categoria}
                    </Badge>
                  )}
                </div>
              </div>
              <CardDescription className="mt-2">{template.descripcion}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ListChecks className="h-4 w-4" />
                <span>{template.preguntas?.length || 0} preguntas</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>{new Date(template.fechaCreacion).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 pt-2">
                {onSelectTemplate && (
                  <Button
                    type="button"
                    onClick={() => onSelectTemplate(template.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    size="sm"
                  >
                    Usar Plantilla
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setTemplateToDelete(template.id)
                    setDeleteDialogOpen(true)
                  }}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La plantilla será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
