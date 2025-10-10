import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"

export interface SurveyQuestion {
  id: string
  texto: string
  tipo: "opcion_multiple" | "texto_corto" | "texto_largo" | "escala" | "checkbox"
  opciones?: string[]
  requerida: boolean
}

export interface SurveyData {
  titulo: string
  descripcion: string
  preguntas: SurveyQuestion[]
  ponenteId: string
  asignacion: {
    tipo: "grupos" | "individual" | "mixto"
    grupos?: {
      jornada?: string
      programa?: string
      grupo?: string
      periodo?: string
      nivel?: string
    }[]
    estudiantesIndividuales?: string[]
  }
  // Categorization fields
  programa?: string
  nivel?: string
  periodo?: string
  grupo?: string
  // Date/time fields
  fechaEncuesta?: string // Date when survey was conducted
  horaInicio?: string // Start time of seminar (e.g., "06:00")
  horaFin?: string // End time of seminar (e.g., "20:00")
  activa: boolean
  fechaCreacion: string
}

function deepClean(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined
  }

  if (Array.isArray(obj)) {
    const cleaned = obj.map((item) => deepClean(item)).filter((item) => item !== undefined)
    return cleaned.length > 0 ? cleaned : undefined
  }

  if (typeof obj === "object") {
    const cleaned: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = deepClean(value)
      if (cleanedValue !== undefined && cleanedValue !== "" && cleanedValue !== null) {
        cleaned[key] = cleanedValue
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined
  }

  return obj === "" ? undefined : obj
}

export async function createSurvey(surveyData: SurveyData) {
  try {
    const cleanedData = deepClean(surveyData)

    const surveysRef = collection(db, "encuestas")
    const docRef = await addDoc(surveysRef, cleanedData)
    console.log("[v0] Encuesta creada con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creando encuesta:", error)
    throw error
  }
}

export async function updateSurvey(surveyId: string, surveyData: Partial<SurveyData>) {
  try {
    if (surveyData.asignacion) {
      surveyData.asignacion = {
        tipo: surveyData.asignacion.tipo || "grupos",
        grupos: Array.isArray(surveyData.asignacion.grupos)
          ? surveyData.asignacion.grupos.filter((g) => g && typeof g === "object")
          : [],
        estudiantesIndividuales: Array.isArray(surveyData.asignacion.estudiantesIndividuales)
          ? surveyData.asignacion.estudiantesIndividuales.filter((e) => e && typeof e === "string")
          : [],
      }
    }

    const cleanedData = deepClean(surveyData)

    if (cleanedData.asignacion) {
      if (!cleanedData.asignacion.grupos) {
        cleanedData.asignacion.grupos = []
      }
      if (!cleanedData.asignacion.estudiantesIndividuales) {
        cleanedData.asignacion.estudiantesIndividuales = []
      }
    }

    const surveyRef = doc(db, "encuestas", surveyId)
    await updateDoc(surveyRef, cleanedData)
    console.log("[v0] Encuesta actualizada:", surveyId)
  } catch (error) {
    console.error("[v0] Error actualizando encuesta:", error)
    throw error
  }
}

export async function deleteSurvey(surveyId: string) {
  try {
    // Delete all responses associated with this survey
    const respuestasRef = collection(db, "respuestas")
    const q = query(respuestasRef, where("encuestaId", "==", surveyId))
    const respuestasSnapshot = await getDocs(q)

    await Promise.all(
      respuestasSnapshot.docs.map(async (respuestaDoc) => {
        await deleteDoc(doc(db, "respuestas", respuestaDoc.id))
      }),
    )

    // Delete the survey itself
    const surveyRef = doc(db, "encuestas", surveyId)
    await deleteDoc(surveyRef)
    console.log("[v0] Encuesta y respuestas eliminadas:", surveyId)
  } catch (error) {
    console.error("[v0] Error eliminando encuesta:", error)
    throw error
  }
}

export async function getSurveys() {
  try {
    const surveysRef = collection(db, "encuestas")
    const q = query(surveysRef, where("activa", "==", true))
    const querySnapshot = await getDocs(q)

    const respuestasRef = collection(db, "respuestas")

    // Get all surveys with their response counts
    const surveysWithCounts = await Promise.all(
      querySnapshot.docs.map(async (surveyDoc) => {
        const qRespuestas = query(respuestasRef, where("encuestaId", "==", surveyDoc.id))
        const respuestasSnapshot = await getDocs(qRespuestas)

        return {
          id: surveyDoc.id,
          ...surveyDoc.data(),
          respuestas: respuestasSnapshot.size,
        }
      }),
    )

    return surveysWithCounts
  } catch (error) {
    console.error("Error obteniendo encuestas:", error)
    return []
  }
}

export async function getAllSurveys() {
  try {
    const surveysRef = collection(db, "encuestas")
    const querySnapshot = await getDocs(surveysRef)

    const respuestasRef = collection(db, "respuestas")

    const surveysWithCounts = await Promise.all(
      querySnapshot.docs.map(async (surveyDoc) => {
        const qRespuestas = query(respuestasRef, where("encuestaId", "==", surveyDoc.id))
        const respuestasSnapshot = await getDocs(qRespuestas)

        return {
          id: surveyDoc.id,
          ...surveyDoc.data(),
          respuestas: respuestasSnapshot.size,
        }
      }),
    )

    return surveysWithCounts
  } catch (error) {
    console.error("Error obteniendo todas las encuestas:", error)
    return []
  }
}

export async function getAssignedSurveys(documento: string) {
  try {
    console.log("[v0] getAssignedSurveys - Buscando estudiante:", documento)
    const estudiantesRef = collection(db, "estudiantes")
    const qEstudiante = query(estudiantesRef, where("documento", "==", documento))
    const estudianteSnapshot = await getDocs(qEstudiante)

    if (estudianteSnapshot.empty) {
      console.log("[v0] getAssignedSurveys - Estudiante no encontrado en colección estudiantes")
      return []
    }

    const estudiante = estudianteSnapshot.docs[0].data()
    console.log("[v0] getAssignedSurveys - Estudiante encontrado:", estudiante)

    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("activa", "==", true))
    const surveysSnapshot = await getDocs(qSurveys)

    const assignedSurveys = surveysSnapshot.docs.filter((doc) => {
      const survey = doc.data()
      const asignacion = survey.asignacion || {}

      if (asignacion.estudiantesIndividuales?.includes(documento)) {
        return true
      }

      if (asignacion.grupos && asignacion.grupos.length > 0) {
        return asignacion.grupos.some((grupo: any) => {
          return (
            (!grupo.programa || grupo.programa === estudiante.programa) &&
            (!grupo.grupo || grupo.grupo === estudiante.grupo) &&
            (!grupo.periodo || grupo.periodo === estudiante.periodo) &&
            (!grupo.nivel || grupo.nivel === estudiante.nivel)
          )
        })
      }

      return false
    })

    const respuestasRef = collection(db, "respuestas")
    const ponentesRef = collection(db, "ponentes")

    const surveysWithStatus = await Promise.all(
      assignedSurveys.map(async (surveyDoc) => {
        const surveyData = surveyDoc.data()
        const qRespuesta = query(
          respuestasRef,
          where("encuestaId", "==", surveyDoc.id),
          where("documento", "==", documento),
        )
        const respuestaSnapshot = await getDocs(qRespuesta)

        let ponenteNombre = null
        if (surveyData.ponenteId) {
          const qPonente = query(ponentesRef, where("__name__", "==", surveyData.ponenteId))
          const ponenteSnapshot = await getDocs(qPonente)
          if (!ponenteSnapshot.empty) {
            ponenteNombre = ponenteSnapshot.docs[0].data().nombre
          }
        }

        return {
          id: surveyDoc.id,
          ...surveyData,
          completada: !respuestaSnapshot.empty,
          ponenteNombre,
        }
      }),
    )

    console.log("[v0] getAssignedSurveys - Encuestas asignadas:", surveysWithStatus.length)
    return surveysWithStatus
  } catch (error) {
    console.error("[v0] Error obteniendo encuestas asignadas:", error)
    return []
  }
}

export async function submitSurveyResponse(surveyId: string, documento: string, responses: any) {
  try {
    const respuestasRef = collection(db, "respuestas")
    await addDoc(respuestasRef, {
      encuestaId: surveyId,
      documento,
      respuestas: responses,
      fechaRespuesta: new Date().toISOString(),
    })
    console.log("Respuesta guardada exitosamente")
  } catch (error) {
    console.error("Error guardando respuesta:", error)
    throw error
  }
}

export async function getSurveyResponses(surveyId: string) {
  try {
    const respuestasRef = collection(db, "respuestas")
    const q = query(respuestasRef, where("encuestaId", "==", surveyId))
    const respuestasSnapshot = await getDocs(q)

    const estudiantesRef = collection(db, "estudiantes")

    const responsesWithStudents = await Promise.all(
      respuestasSnapshot.docs.map(async (respuestaDoc) => {
        const respuesta = respuestaDoc.data()
        const qEstudiante = query(estudiantesRef, where("documento", "==", respuesta.documento))
        const estudianteSnapshot = await getDocs(qEstudiante)

        const estudiante = estudianteSnapshot.empty ? null : estudianteSnapshot.docs[0].data()

        return {
          id: respuestaDoc.id,
          ...respuesta,
          nombreEstudiante: estudiante?.nombre || "Desconocido",
          grupoEstudiante: estudiante?.grupo || "N/A",
        }
      }),
    )

    return responsesWithStudents
  } catch (error) {
    console.error("Error obteniendo respuestas de encuesta:", error)
    return []
  }
}

export async function getSurveyStats() {
  try {
    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("activa", "==", true))
    const surveysSnapshot = await getDocs(qSurveys)

    const respuestasRef = collection(db, "respuestas")
    const respuestasSnapshot2 = await getDocs(respuestasRef)

    const estudiantesRef = collection(db, "estudiantes")
    const estudiantesSnapshot = await getDocs(estudiantesRef)

    const totalSurveys = surveysSnapshot.size
    const totalRespuestas = respuestasSnapshot2.size
    const totalEstudiantes = estudiantesSnapshot.size

    const tasa = totalEstudiantes > 0 ? Math.round((totalRespuestas / (totalEstudiantes * totalSurveys)) * 100) : 0

    return {
      total: totalSurveys,
      respuestas: totalRespuestas,
      tasa,
    }
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return { total: 0, respuestas: 0, tasa: 0 }
  }
}
