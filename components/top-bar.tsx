"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RoleType = "admin" | "estudiante" | "uparsistem" | "relaciones_corporativas"

const ROLE_LABELS: Record<RoleType, string> = {
  admin: "Admin",
  estudiante: "Estudiante",
  uparsistem: "Uparsistem",
  relaciones_corporativas: "Relaciones Corporativas",
}

interface TopBarProps {
  selectedRole: RoleType
  onRoleChange: (role: RoleType) => void
  userRole: string
  sidebarCollapsed?: boolean
}

export function TopBar({ selectedRole, onRoleChange, userRole, sidebarCollapsed = false }: TopBarProps) {
  const isAdmin = userRole === "admin"

  return (
    <header
      className="sticky top-0 z-30 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-all duration-300"
      style={{ paddingLeft: sidebarCollapsed ? "80px" : "256px" }}
    >
      <div className="flex h-14 items-center justify-between px-6 transition-all duration-300">
        <div />

        {isAdmin && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Ver/Crear como:</span>
            <Select value={selectedRole} onValueChange={(v) => onRoleChange(v as RoleType)}>
              <SelectTrigger className="h-9 w-[200px] border-border bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uparsistem">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Uparsistem
                  </div>
                </SelectItem>
                <SelectItem value="relaciones_corporativas">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    Relaciones Corporativas
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">
                {ROLE_LABELS[selectedRole]}
              </span>
            </div>
          </div>
        )}

        {!isAdmin && (
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs font-medium text-primary">
              {ROLE_LABELS[userRole as RoleType]}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}