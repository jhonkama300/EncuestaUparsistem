"use client"
import { useState } from "react"
import type { UserData } from "@/lib/auth"
import { SurveyManager } from "./survey-manager"
import { StudentUploader } from "./student-uploader"
import { PonenteUploader } from "./ponente-uploader"
import { AdvancedStatisticsView } from "./advanced-statistics-view"
import { Configuraciones } from "./configuraciones"
import { GestionUsuarios } from "./gestion-usuarios"
import { AppSidebar } from "./app-sidebar"
import { TopBar } from "./top-bar"

interface AdminViewProps {
  user: UserData
  userData?: UserData
  onLogout: () => void
}

type RoleType = "admin" | "estudiante" | "uparsistem" | "relaciones_corporativas"

export function AdminView({ user, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState("surveys")
  const [selectedRole, setSelectedRole] = useState<RoleType>("uparsistem")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const effectiveRole: RoleType = user.rol === "admin" ? selectedRole : user.rol
  const sidebarWidth = sidebarCollapsed ? 80 : 256

  return (
    <div className={`min-h-screen bg-background flex ${
      effectiveRole === "relaciones_corporativas" ? "theme-relaciones" :
      effectiveRole === "admin" ? "theme-admin" : ""
    }`}>
      <AppSidebar
        user={user}
        onLogout={onLogout}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <main
        className="flex-1 pb-16 lg:pb-0 min-h-screen overflow-auto transition-all duration-300"
        style={{ paddingLeft: `${sidebarWidth}px` }}
      >
        <TopBar
          selectedRole={selectedRole}
          onRoleChange={setSelectedRole}
          userRole={user.rol}
          sidebarCollapsed={sidebarCollapsed}
        />
        <div className="p-6">
          {activeTab === "surveys" && <SurveyManager key={effectiveRole} user={{...user, rol: effectiveRole}} />}
          {activeTab === "students" && <StudentUploader key={effectiveRole + "-students"} user={{...user, rol: effectiveRole}} />}
          {activeTab === "ponentes" && <PonenteUploader key={effectiveRole + "-ponentes"} user={{...user, rol: effectiveRole}} />}
          {activeTab === "statistics" && <AdvancedStatisticsView key={effectiveRole + "-stats"} user={{...user, rol: effectiveRole}} />}
          {activeTab === "configuraciones" && <Configuraciones key={effectiveRole + "-config"} user={{...user, rol: effectiveRole}} />}
          {activeTab === "usuarios" && <GestionUsuarios user={user} />}
        </div>
      </main>
    </div>
  )
}