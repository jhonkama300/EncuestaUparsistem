import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore"
import { db } from "./firebase"

export interface PonenteData {
  nombre: string
  numero?: string // Added numero field
  descripcion: string
  cargo?: string
  institucion?: string
  jornada?: string
  programa?: string
  grupo?: string
  periodo?: string
  nivel?: string
  imagen?: string // Added imagen field
  fechaCreacion: string
  activo: boolean
}

export async function getStudentFilters() {
  try {
    const estudiantesRef = collection(db, "estudiantes")
    const snapshot = await getDocs(estudiantesRef)

    const jornadas = new Set<string>()
    const programas = new Set<string>()
    const grupos = new Set<string>()
    const periodos = new Set<string>()
    const niveles = new Set<string>()

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      if (data.jornada) jornadas.add(data.jornada)
      if (data.programa) programas.add(data.programa)
      if (data.grupo) grupos.add(data.grupo)
      if (data.periodo) periodos.add(data.periodo)
      if (data.nivel) niveles.add(data.nivel)
    })

    return {
      jornadas: Array.from(jornadas).sort(),
      programas: Array.from(programas).sort(),
      grupos: Array.from(grupos).sort(),
      periodos: Array.from(periodos).sort(),
      niveles: Array.from(niveles).sort(),
    }
  } catch (error) {
    console.error("[v0] Error obteniendo filtros de estudiantes:", error)
    return {
      jornadas: [],
      programas: [],
      grupos: [],
      periodos: [],
      niveles: [],
    }
  }
}

export async function addPonente(ponenteData: PonenteData): Promise<string> {
  try {
    console.log("[v0] Agregando ponente:", ponenteData.nombre)
    const ponentesRef = collection(db, "ponentes")
    const docRef = await addDoc(ponentesRef, {
      ...ponenteData,
      fechaCreacion: new Date().toISOString(),
      activo: true,
    })
    console.log("[v0] Ponente agregado con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error agregando ponente:", error)
    throw error
  }
}

export async function getPonentes(): Promise<any[]> {
  try {
    const ponentesRef = collection(db, "ponentes")
    const q = query(ponentesRef, where("activo", "==", true))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("[v0] Error obteniendo ponentes:", error)
    return []
  }
}

export async function getPonentesByFilters(filters: {
  jornada?: string
  programa?: string
  grupo?: string
  periodo?: string
  nivel?: string
}): Promise<any[]> {
  try {
    const ponentesRef = collection(db, "ponentes")
    const q = query(ponentesRef, where("activo", "==", true))

    const snapshot = await getDocs(q)

    // Filtrar en memoria para mayor flexibilidad
    const ponentes = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((ponente) => {
        if (filters.jornada && ponente.jornada && ponente.jornada !== filters.jornada) return false
        if (filters.programa && ponente.programa && ponente.programa !== filters.programa) return false
        if (filters.grupo && ponente.grupo && ponente.grupo !== filters.grupo) return false
        if (filters.periodo && ponente.periodo && ponente.periodo !== filters.periodo) return false
        if (filters.nivel && ponente.nivel && ponente.nivel !== filters.nivel) return false
        return true
      })

    return ponentes
  } catch (error) {
    console.error("[v0] Error obteniendo ponentes filtrados:", error)
    return []
  }
}

export async function deletePonente(ponenteId: string): Promise<void> {
  try {
    console.log("[v0] Eliminando ponente de la BD:", ponenteId)
    const ponenteRef = doc(db, "ponentes", ponenteId)
    await deleteDoc(ponenteRef)
    console.log("[v0] Ponente eliminado completamente:", ponenteId)
  } catch (error) {
    console.error("[v0] Error eliminando ponente:", error)
    throw error
  }
}

export async function updatePonente(ponenteId: string, ponenteData: Partial<PonenteData>): Promise<void> {
  try {
    console.log("[v0] Actualizando ponente:", ponenteId)
    const ponenteRef = doc(db, "ponentes", ponenteId)
    await updateDoc(ponenteRef, {
      ...ponenteData,
      fechaActualizacion: new Date().toISOString(),
    })
    console.log("[v0] Ponente actualizado exitosamente:", ponenteId)
  } catch (error) {
    console.error("[v0] Error actualizando ponente:", error)
    throw error
  }
}

export function subscribeToPonentes(callback: (ponentes: any[]) => void) {
  try {
    const ponentesRef = collection(db, "ponentes")
    const q = query(ponentesRef, where("activo", "==", true))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ponentes = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      callback(ponentes)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error suscribiéndose a ponentes:", error)
    return () => {}
  }
}

export async function calculatePonenteAverageRating(ponenteId: string): Promise<number> {
  try {
    console.log("[v0] Calculando promedio de calificaciones para ponente:", ponenteId)

    // Obtener todas las encuestas del ponente
    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("ponenteId", "==", ponenteId))
    const surveysSnapshot = await getDocs(qSurveys)

    if (surveysSnapshot.empty) {
      console.log("[v0] No hay encuestas para este ponente")
      return 0
    }

    const surveyIds = surveysSnapshot.docs.map((doc) => doc.id)
    console.log("[v0] Encuestas encontradas:", surveyIds.length)

    // Obtener todas las respuestas de esas encuestas
    const respuestasRef = collection(db, "respuestas")
    let totalSum = 0
    let totalCount = 0

    for (const surveyId of surveyIds) {
      const qRespuestas = query(respuestasRef, where("encuestaId", "==", surveyId))
      const respuestasSnapshot = await getDocs(qRespuestas)

      // Obtener las preguntas de la encuesta
      const surveyDoc = surveysSnapshot.docs.find((doc) => doc.id === surveyId)
      const preguntas = surveyDoc?.data().preguntas || []

      respuestasSnapshot.docs.forEach((respuestaDoc) => {
        const respuesta = respuestaDoc.data()
        const respuestas = respuesta.respuestas || {}

        // Procesar cada respuesta
        Object.keys(respuestas).forEach((key) => {
          const answer = respuestas[key]
          const answerStr = String(answer).toLowerCase().trim()

          // Mapeo de respuestas a valores numéricos
          const SCALE_VALUES: Record<string, number> = {
            excelente: 5,
            bueno: 4,
            aceptable: 3,
            regular: 2,
            malo: 1,
          }

          const value = SCALE_VALUES[answerStr]
          if (value !== undefined && !isNaN(value)) {
            totalSum += value
            totalCount++
          }
        })
      })
    }

    const average = totalCount > 0 ? totalSum / totalCount : 0
    console.log("[v0] Promedio calculado:", average, "de", totalCount, "respuestas")

    return average
  } catch (error) {
    console.error("[v0] Error calculando promedio de calificaciones:", error)
    return 0
  }
}
