"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCog, UserPlus, Pencil, Trash2, Shield, Users } from "lucide-react"
import { getUsers, createUser, updateUser, deleteUser, type AppUser, type AppRole } from "@/lib/users"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  uparsistem: "Uparsistem",
  relaciones_corporativas: "Relaciones Corporativas",
  estudiante: "Estudiante",
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-100 text-red-800",
  uparsistem: "bg-emerald-100 text-emerald-800",
  relaciones_corporativas: "bg-blue-100 text-blue-800",
  estudiante: "bg-gray-100 text-gray-800",
}

const MANAGEABLE_ROLES: AppRole[] = ["admin", "uparsistem", "relaciones_corporativas"]

export function GestionUsuarios() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null)

  const [formNombre, setFormNombre] = useState("")
  const [formDocumento, setFormDocumento] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRol, setFormRol] = useState<AppRole>("uparsistem")
  const [formActivo, setFormActivo] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data.filter((u) => u.rol !== "estudiante"))
    } catch (error) {
      console.error("Error cargando usuarios:", error)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingUser(null)
    setFormNombre("")
    setFormDocumento("")
    setFormPassword("")
    setFormRol("uparsistem")
    setFormActivo(true)
    setDialogOpen(true)
  }

  const openEdit = (user: AppUser) => {
    setEditingUser(user)
    setFormNombre(user.nombre)
    setFormDocumento(user.documento)
    setFormPassword(user.password || "")
    setFormRol(user.rol)
    setFormActivo(user.activo)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formNombre.trim() || !formDocumento.trim()) return
    setSaving(true)
    try {
      const data: Omit<AppUser, "id"> = {
        nombre: formNombre.trim(),
        documento: formDocumento.trim(),
        password: formPassword.trim() || undefined,
        rol: formRol,
        activo: formActivo,
      }
      if (editingUser?.id) {
        await updateUser(editingUser.id, data)
      } else {
        await createUser(data)
      }
      setDialogOpen(false)
      loadUsers()
    } catch (error) {
      console.error("Error guardando usuario:", error)
      alert("Error al guardar usuario")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (user: AppUser) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete?.id) return
    try {
      await deleteUser(userToDelete.id)
      loadUsers()
    } catch {
      alert("Error al eliminar usuario")
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-emerald-900">Gestión de Usuarios</h2>
            <p className="text-sm text-emerald-700 mt-1">Administra usuarios y asigna roles del sistema</p>
          </div>
          <Button
            onClick={openCreate}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            <UserPlus className="h-4 w-4" />
            Agregar Usuario
          </Button>
        </div>

        {/* Roles summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { rol: "admin" as AppRole, desc: "Acceso completo al sistema", icon: <Shield className="h-5 w-5" /> },
              {
                rol: "uparsistem" as AppRole,
                desc: "Gestión de encuestas, estudiantes y ponentes",
                icon: <Users className="h-5 w-5" />,
              },
              {
                rol: "relaciones_corporativas" as AppRole,
                desc: "Visualización de encuestas y estadísticas",
                icon: <UserCog className="h-5 w-5" />,
              },
            ] as const
          ).map(({ rol, desc, icon }) => (
            <Card key={rol} className="border-emerald-100">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${ROLE_COLORS[rol]}`}>{icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{ROLE_LABELS[rol]}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                    <p className="text-xs font-medium text-emerald-700 mt-1">
                      {users.filter((u) => u.rol === rol).length} usuario(s)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-emerald-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardTitle className="text-emerald-900">Usuarios del Sistema</CardTitle>
            <CardDescription className="text-emerald-700">
              Lista de usuarios con acceso administrativo
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center py-8 text-gray-500">Cargando usuarios...</p>
            ) : users.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No hay usuarios registrados</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.documento}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.rol]}`}
                        >
                          {ROLE_LABELS[user.rol]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.activo ? "default" : "secondary"}
                          className={user.activo ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : ""}
                        >
                          {user.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-emerald-300 text-emerald-600 hover:bg-emerald-50 bg-transparent"
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Usuario"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario"
                : "Completa los datos para crear un nuevo usuario"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input
                placeholder="Nombre del usuario"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Número de documento</Label>
              <Input
                placeholder="Documento de identidad"
                value={formDocumento}
                onChange={(e) => setFormDocumento(e.target.value)}
                disabled={!!editingUser}
              />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input
                type="password"
                placeholder="Contraseña de acceso"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={formRol} onValueChange={(v) => setFormRol(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANAGEABLE_ROLES.map((rol) => (
                    <SelectItem key={rol} value={rol}>
                      {ROLE_LABELS[rol]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formActivo ? "activo" : "inactivo"}
                onValueChange={(v) => setFormActivo(v === "activo")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formNombre.trim() || !formDocumento.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? "Guardando..." : editingUser ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de eliminar al usuario "{userToDelete?.nombre}"? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
