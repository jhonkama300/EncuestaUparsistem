"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, Loader2 } from "lucide-react"
import { collection, addDoc, query, where, getDocs } from "firebase/firestore"
import { db, getRoleCollectionName } from "@/lib/firebase"
import type { StudentData } from "@/lib/students"
import { getUniqueStudentValues } from "@/lib/students"
import type { UserData } from "@/lib/auth"

interface AddStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  user: UserData
}

export function AddStudentDialog({ open, onOpenChange, onSuccess, user }: AddStudentDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<StudentData>({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    documento: "",
    jornada: "",
    programa: "",
    grupo: "",
    periodo: "",
    nivel: "",
  })

  const [uniqueValues, setUniqueValues] = useState<{
    jornadas: string[]
    programas: string[]
    grupos: string[]
    periodos: string[]
  }>({
    jornadas: [],
    programas: [],
    grupos: [],
    periodos: [],
  })

  useEffect(() => {
    if (open) {
      loadUniqueValues()
    }
  }, [open, user.rol])

  const loadUniqueValues = async () => {
    try {
      const values = await getUniqueStudentValues(user.rol)
      setUniqueValues({
        jornadas: values.jornadas,
        programas: values.programas,
        grupos: values.grupos,
        periodos: values.periodos,
      })
    } catch (error) {
      console.error("Error cargando valores únicos:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar campos requeridos
      if (
        !formData.primerNombre ||
        !formData.primerApellido ||
        !formData.documento ||
        !formData.jornada ||
        !formData.programa ||
        !formData.grupo ||
        !formData.periodo ||
        !formData.nivel
      ) {
        alert("Por favor completa todos los campos requeridos")
        setLoading(false)
        return
      }

      // Verificar si el estudiante ya existe
      const estudiantesRef = collection(db, getRoleCollectionName("estudiantes", user.rol))
      const qEstudiante = query(estudiantesRef, where("documento", "==", formData.documento))
      const estudianteSnapshot = await getDocs(qEstudiante)

      if (!estudianteSnapshot.empty) {
        alert(`Ya existe un estudiante con el documento ${formData.documento}`)
        setLoading(false)
        return
      }

      // Agregar estudiante
      await addDoc(collection(db, getRoleCollectionName("estudiantes", user.rol)), formData)

      // Verificar si el usuario ya existe
      const usuariosRef = collection(db, "usuarios")
      const qUsuario = query(usuariosRef, where("documento", "==", formData.documento))
      const usuarioSnapshot = await getDocs(qUsuario)

      // Agregar usuario si no existe
      if (usuarioSnapshot.empty) {
        await addDoc(collection(db, "usuarios"), {
          documento: formData.documento,
          nombre:
            `${formData.primerNombre} ${formData.segundoNombre} ${formData.primerApellido} ${formData.segundoApellido}`.trim(),
          email: `${formData.documento}@estudiante.edu.co`,
          rol: "estudiante",
          activo: true,
          fechaCreacion: new Date().toISOString(),
        })
      }

      alert("Estudiante agregado exitosamente")
      setFormData({
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        documento: "",
        jornada: "",
        programa: "",
        grupo: "",
        periodo: "",
        nivel: "",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error agregando estudiante:", error)
      alert("Error al agregar estudiante")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-emerald-800 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Agregar Estudiante
          </DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo estudiante</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primerNombre">
                Primer Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="primerNombre"
                value={formData.primerNombre}
                onChange={(e) => setFormData({ ...formData, primerNombre: e.target.value })}
                placeholder="Ej: Juan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segundoNombre">Segundo Nombre</Label>
              <Input
                id="segundoNombre"
                value={formData.segundoNombre}
                onChange={(e) => setFormData({ ...formData, segundoNombre: e.target.value })}
                placeholder="Ej: Carlos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="primerApellido">
                Primer Apellido <span className="text-red-500">*</span>
              </Label>
              <Input
                id="primerApellido"
                value={formData.primerApellido}
                onChange={(e) => setFormData({ ...formData, primerApellido: e.target.value })}
                placeholder="Ej: Pérez"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="segundoApellido">Segundo Apellido</Label>
              <Input
                id="segundoApellido"
                value={formData.segundoApellido}
                onChange={(e) => setFormData({ ...formData, segundoApellido: e.target.value })}
                placeholder="Ej: García"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">
                Número de Identificación <span className="text-red-500">*</span>
              </Label>
              <Input
                id="documento"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                placeholder="Ej: 1234567890"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jornada">
                Jornada <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.jornada} onValueChange={(value) => setFormData({ ...formData, jornada: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar jornada" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueValues.jornadas.length > 0 ? (
                    uniqueValues.jornadas.map((jornada) => (
                      <SelectItem key={jornada} value={jornada}>
                        {jornada}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No hay jornadas disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="programa">
                Programa <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.programa}
                onValueChange={(value) => setFormData({ ...formData, programa: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueValues.programas.length > 0 ? (
                    uniqueValues.programas.map((programa) => (
                      <SelectItem key={programa} value={programa}>
                        {programa}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No hay programas disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grupo">
                Grupo <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.grupo} onValueChange={(value) => setFormData({ ...formData, grupo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueValues.grupos.length > 0 ? (
                    uniqueValues.grupos.map((grupo) => (
                      <SelectItem key={grupo} value={grupo}>
                        {grupo}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No hay grupos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodo">
                Período <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.periodo} onValueChange={(value) => setFormData({ ...formData, periodo: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueValues.periodos.length > 0 ? (
                    uniqueValues.periodos.map((periodo) => (
                      <SelectItem key={periodo} value={periodo}>
                        {periodo}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-data" disabled>
                      No hay períodos disponibles
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nivel">
                Nivel <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.nivel} onValueChange={(value) => setFormData({ ...formData, nivel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar nivel" />
                </SelectTrigger>
                <SelectContent>
                  {["CICLO I", "CICLO II", "CICLO III", "CICLO IV", "CICLO V", "CICLO VI"].map((ciclo) => (
                    <SelectItem key={ciclo} value={ciclo}>
                      {ciclo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Estudiante
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
