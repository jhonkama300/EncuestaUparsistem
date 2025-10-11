"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, FileSpreadsheet, Upload, Users } from "lucide-react"
import type { UserData } from "@/lib/auth"
import { SurveyManager } from "./survey-manager"
import { StudentUploader } from "./student-uploader"
import { PonenteUploader } from "./ponente-uploader"
import Image from "next/image"

interface AdminViewProps {
  user: UserData
  onLogout: () => void
}

export function AdminView({ user, onLogout }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<"surveys" | "students" | "ponentes">("surveys")

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <header className="border-b border-emerald-200 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-12 w-12 relative">
                  <Image src="/images/logoupar.png" alt="Logo Uparsistem" fill className="object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">UPARSISTEM</h1>
                  <p className="text-sm text-emerald-100">Panel de Administración</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right text-white">
                <p className="text-sm text-emerald-100">Administrador</p>
                <p className="font-semibold">{user.nombre}</p>
              </div>
              <Button
                variant="outline"
                onClick={onLogout}
                className="gap-2 border-white bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeTab === "surveys"
                ? "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50"
                : "hover:border-emerald-300"
            }`}
            onClick={() => setActiveTab("surveys")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    activeTab === "surveys" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Encuestas</CardTitle>
                  <CardDescription>Gestionar encuestas</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeTab === "students"
                ? "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50"
                : "hover:border-emerald-300"
            }`}
            onClick={() => setActiveTab("students")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    activeTab === "students" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Estudiantes</CardTitle>
                  <CardDescription>Cargar desde Excel</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              activeTab === "ponentes"
                ? "ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50"
                : "hover:border-emerald-300"
            }`}
            onClick={() => setActiveTab("ponentes")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                    activeTab === "ponentes" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Ponentes</CardTitle>
                  <CardDescription>Gestionar ponentes</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-emerald-100 p-6">
          {activeTab === "surveys" && <SurveyManager />}
          {activeTab === "students" && <StudentUploader />}
          {activeTab === "ponentes" && <PonenteUploader />}
        </div>
      </div>
    </div>
  )
}
