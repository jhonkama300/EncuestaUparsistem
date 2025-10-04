"use client"

import { useState } from "react"
import { loginWithDocument, loginWithDocumentAndPassword, type UserData } from "@/lib/auth"
import { LoginView } from "@/components/login-view"
import { StudentView } from "@/components/student-view"
import { AdminView } from "@/components/admin-view"
import { MainView } from "@/components/main-view"

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)

  const handleLoginStudent = async (documentNumber: string) => {
    const userData = await loginWithDocument(documentNumber)
    setUser(userData)
    setUserData(userData)
    return userData
  }

  const handleLoginAdmin = async (documentNumber: string, password: string) => {
    const userData = await loginWithDocumentAndPassword(documentNumber, password)
    setUser(userData)
    setUserData(userData)
    return userData
  }

  const handleLogout = () => {
    setUser(null)
    setUserData(null)
  }

  if (!user) {
    return <LoginView onLoginStudent={handleLoginStudent} onLoginAdmin={handleLoginAdmin} />
  }

  if (userData && userData.rol === "admin") {
    return <AdminView user={user} userData={userData} onLogout={handleLogout} />
  } else if (userData && userData.rol === "estudiante") {
    return <StudentView user={user} userData={userData} onLogout={handleLogout} />
  } else {
    return <MainView user={user} userData={userData} onLogout={handleLogout} />
  }
}
