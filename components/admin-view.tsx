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

interface AdminViewProps {
  user: UserData
  userData?: UserData
  onLogout: () => void
}

export function AdminView({ user, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState("surveys")

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar user={user} onLogout={onLogout} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 lg:pl-20 pb-16 lg:pb-0 min-h-screen overflow-auto">
        <div className="p-6">
          {activeTab === "surveys" && <SurveyManager />}
          {activeTab === "students" && <StudentUploader />}
          {activeTab === "ponentes" && <PonenteUploader />}
          {activeTab === "statistics" && <AdvancedStatisticsView />}
          {activeTab === "configuraciones" && <Configuraciones />}
          {activeTab === "usuarios" && <GestionUsuarios />}
        </div>
      </main>
    </div>
  )
}
