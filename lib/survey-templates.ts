import { collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from "firebase/firestore"
import { db } from "./firebase"
import type { SurveyQuestion } from "./surveys"

export interface SurveyTemplate {
  nombre: string
  descripcion: string
  preguntas: SurveyQuestion[]
  categoria?: string
  fechaCreacion: string
}

export async function createTemplate(templateData: SurveyTemplate) {
  try {
    const templatesRef = collection(db, "plantillas_encuestas")
    const docRef = await addDoc(templatesRef, {
      ...templateData,
      fechaCreacion: new Date().toISOString(),
    })
    console.log("[v0] Plantilla creada con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creando plantilla:", error)
    throw error
  }
}

export async function getTemplates() {
  try {
    const templatesRef = collection(db, "plantillas_encuestas")
    const q = query(templatesRef, orderBy("fechaCreacion", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("[v0] Error obteniendo plantillas:", error)
    return []
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    const templateRef = doc(db, "plantillas_encuestas", templateId)
    await deleteDoc(templateRef)
    console.log("[v0] Plantilla eliminada:", templateId)
  } catch (error) {
    console.error("[v0] Error eliminando plantilla:", error)
    throw error
  }
}

export async function createSurveyFromTemplate(
  templateId: string,
  surveyData: {
    titulo: string
    descripcion: string
    ponenteId: string
    asignacion: any
    programa?: string
    nivel?: string
    periodo?: string
    grupo?: string
    fechaEncuesta?: string
    horaInicio?: string
    horaFin?: string
  },
) {
  try {
    const templates = await getTemplates()
    const template = templates.find((t: any) => t.id === templateId)

    if (!template) {
      throw new Error("Plantilla no encontrada")
    }

    return {
      ...surveyData,
      preguntas: template.preguntas,
      activa: true,
      fechaCreacion: new Date().toISOString(),
    }
  } catch (error) {
    console.error("[v0] Error creando encuesta desde plantilla:", error)
    throw error
  }
}
