"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { uploadStudentsFromExcel } from "@/lib/students"

export function StudentUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success: number; errors: string[] } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    try {
      const uploadResult = await uploadStudentsFromExcel(file)
      setResult(uploadResult)
      setFile(null)
    } catch (error) {
      console.error("Error subiendo archivo:", error)
      setResult({ success: 0, errors: ["Error al procesar el archivo"] })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-emerald-800">Cargar Estudiantes desde Excel</h2>
        <p className="text-gray-600">Sube un archivo Excel con la información de los estudiantes</p>
      </div>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Formato del Archivo</CardTitle>
          <CardDescription>El archivo Excel debe contener las siguientes columnas:</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Primer nombre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Segundo nombre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Primer apellido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Segundo apellido</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Número de identificación</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Jornada</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Programa</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Grupo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Período</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              <span className="font-medium">Nivel</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-800">Subir Archivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-emerald-300 bg-emerald-50 p-6 transition-colors hover:border-emerald-400 hover:bg-emerald-100">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="font-medium text-emerald-800">{file ? file.name : "Seleccionar archivo Excel"}</p>
                  <p className="text-sm text-gray-600">Formatos: .xlsx, .xls</p>
                </div>
              </div>
            </label>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Subiendo..." : "Subir Estudiantes"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className={result.errors.length > 0 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.errors.length > 0 ? (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              )}
              <CardTitle className={result.errors.length > 0 ? "text-yellow-800" : "text-green-800"}>
                Resultado de la Carga
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-2 font-medium">{result.success} estudiante(s) cargado(s) exitosamente</p>
            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 font-medium text-yellow-800">Errores encontrados:</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
