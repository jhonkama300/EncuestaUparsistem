"use client"

import { useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import {
  Users,
  LogOut,
  BarChart3,
  Sun,
  Moon,
  FileSpreadsheet,
  Upload,
  Ellipsis,
  X,
  GraduationCap,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"
import type { UserData } from "@/lib/auth"

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  roles: string[]
}

interface AppSidebarProps {
  user: UserData
  onLogout: () => void
  activeTab: string
  onTabChange: (tab: string) => void
}

const navItems: NavItem[] = [
  {
    id: "surveys",
    label: "Encuestas",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    roles: ["admin", "ponente"],
  },
  {
    id: "students",
    label: "Estudiantes",
    icon: <Upload className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    id: "ponentes",
    label: "Ponentes",
    icon: <Users className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    id: "statistics",
    label: "Estadísticas",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["admin"],
  },
  {
    id: "mi-encuesta",
    label: "Mi Encuesta",
    icon: <ClipboardList className="h-5 w-5" />,
    roles: ["estudiante"],
  },
]

export function AppSidebar({ user, onLogout, activeTab, onTabChange }: AppSidebarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)

  const handleLogout = () => {
    onLogout()
  }

  const userRole = user.rol?.toLowerCase() || "estudiante"
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole))
  const mobileMainItems = filteredNavItems.slice(0, 3)
  const mobileMoreItems = filteredNavItems.slice(3)

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const isExpanded = isHovered

  return (
    <>
      {/* ========== MOBILE BOTTOM NAV ========== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-card border-t border-border safe-bottom">
        <div className="flex items-stretch justify-around h-16">
          {mobileMainItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground active:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
                <div className={cn("h-5 w-5", isActive && "text-primary")}>{item.icon}</div>
                <span className="truncate max-w-[56px]">{item.label}</span>
              </button>
            )
          })}
          <button
            onClick={() => setMobileMoreOpen(!mobileMoreOpen)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-medium transition-colors",
              mobileMoreOpen ? "text-primary" : "text-muted-foreground",
            )}
          >
            {mobileMoreOpen ? <X className="h-5 w-5" /> : <Ellipsis className="h-5 w-5" />}
            <span>Más</span>
          </button>
        </div>
      </nav>

      {/* ========== MOBILE "MORE" PANEL ========== */}
      {mobileMoreOpen && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setMobileMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-2xl shadow-xl max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/60 ring-2 ring-primary/20 ring-offset-1 ring-offset-card overflow-hidden flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{user.nombre || "Usuario"}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{userRole}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-9 w-9 p-0 flex-shrink-0">
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="p-3 grid grid-cols-4 gap-1">
              {mobileMoreItems.map((item) => {
                const isActive = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id)
                      setMobileMoreOpen(false)
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 px-2 py-3 rounded-xl text-center transition-colors",
                      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted active:bg-muted",
                    )}
                  >
                    <div className="h-5 w-5">{item.icon}</div>
                    <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="h-px bg-border mx-4" />

            <div className="p-3">
              <button
                onClick={() => {
                  setMobileMoreOpen(false)
                  setShowLogoutModal(true)
                }}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== DESKTOP SIDEBAR ========== */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 bottom-0 z-20 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 shadow-lg",
          isExpanded ? "w-64" : "w-20",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo */}
        <div className={cn("p-4 border-b border-sidebar-border", !isExpanded && "px-2 py-3")}>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "relative flex-shrink-0 transition-all duration-300",
                isExpanded ? "w-full h-12" : "w-10 h-10",
              )}
            >
              <Image src="/images/logoupar.png" alt="Uparsistem" fill className="object-contain" priority />
            </div>
          </div>
          {isExpanded && (
            <p className="text-xs text-muted-foreground mt-2 text-center font-semibold">UPARSISTEM</p>
          )}
        </div>

        {/* Theme Toggle */}
        <div className={cn("px-3 py-3 border-b border-sidebar-border", !isExpanded && "px-2")}>
          <Button
            variant="outline"
            className={cn(
              "w-full bg-transparent border-sidebar-border hover:bg-sidebar-accent transition-all text-sidebar-foreground",
              !isExpanded && "px-2",
            )}
            onClick={toggleTheme}
          >
            {resolvedTheme === "dark" ? (
              <Sun className={cn("h-5 w-5 flex-shrink-0 text-amber-500", !isExpanded && "h-6 w-6")} />
            ) : (
              <Moon className={cn("h-5 w-5 flex-shrink-0 text-primary", !isExpanded && "h-6 w-6")} />
            )}
            {isExpanded && <span className="ml-2">{resolvedTheme === "dark" ? "Claro" : "Oscuro"}</span>}
          </Button>
        </div>

        {/* User Info */}
        <div className={cn("px-3 py-3 border-b border-sidebar-border", !isExpanded && "px-2")}>
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/30",
              !isExpanded && "justify-center p-1",
            )}
          >
            <div className="relative flex-shrink-0">
              <div className="relative w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/60 ring-2 ring-primary/20 ring-offset-1 ring-offset-sidebar overflow-hidden flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-sidebar rounded-full" />
            </div>
            {isExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-sidebar-foreground text-sm truncate">{user.nombre || "Usuario"}</span>
                <span className="text-xs text-muted-foreground truncate capitalize">{userRole}</span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-sm font-medium group relative",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                  !isExpanded && "justify-center px-2",
                )}
                title={!isExpanded ? item.label : undefined}
              >
                {isActive && isExpanded && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <div
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                    !isExpanded && "h-6 w-6",
                  )}
                >
                  {item.icon}
                </div>
                {isExpanded && <span className="flex-1">{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* Logout */}
        <div className={cn("p-4 border-t border-sidebar-border", !isExpanded && "px-2")}>
          <Button
            className={cn(
              "w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all shadow-sm",
              !isExpanded && "px-2",
            )}
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className={cn("h-5 w-5 flex-shrink-0", !isExpanded && "h-6 w-6")} />
            {isExpanded && <span className="ml-2">Salir</span>}
          </Button>
        </div>
      </aside>

      {/* ========== LOGOUT DIALOG ========== */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Cierre de Sesión</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro de cerrar sesión? Deberás volver a iniciar sesión para acceder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground">
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
