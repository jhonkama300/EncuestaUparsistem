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
import { Button } from "@/components/ui/button"
import { migrateExistingDataToUparsistem } from "@/lib/migration"
import { useToast } from "@/hooks/use-toast"


interface AdminViewProps {
  user: UserData
  userData?: UserData
  onLogout: () => void
}

export function AdminView({ user, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState("surveys")
  const { toast } = useToast()

  const handleMigrate = async () => {
    try {
      const result = await migrateExistingDataToUparsistem()
      toast({
        title: "Migración completada",
        description: `Se han migrado ${result.total} documentos a las colecciones de uparsistem.`,
      })
    } catch (error) {
      toast({
        title: "Error de migración",
        description: "Ocurrió un error al migrar los datos.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AppSidebar user={user} onLogout={onLogout} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 lg:pl-20 pb-16 lg:pb-0 min-h-screen overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex justify-end">
            <Button variant="outline" onClick={handleMigrate} className="text-xs h-8">
              Migrar Datos Existentes a uparsistem
            </Button>
          </div>
          {activeTab === "surveys" && <SurveyManager user={user} />}
          {activeTab === "students" && <StudentUploader user={user} />}
          {activeTab === "ponentes" && <PonenteUploader user={user} />}
          {activeTab === "statistics" && <AdvancedStatisticsView user={user} />}
          {activeTab === "configuraciones" && <Configuraciones user={user} />}
          {activeTab === "usuarios" && <GestionUsuarios user={user} />}
        </div>
      </main>
    </div>
  )
}
