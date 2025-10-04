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
  activa: boolean
  fechaCreacion: string
}

export async function createSurvey(surveyData: SurveyData) {
  try {
    const surveysRef = collection(db, "encuestas")
    const docRef = await addDoc(surveysRef, surveyData)
    console.log("[v0] Encuesta creada con ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("[v0] Error creando encuesta:", error)
    throw error
  }
}

export async function updateSurvey(surveyId: string, surveyData: Partial<SurveyData>) {
  try {
    const surveyRef = doc(db, "encuestas", surveyId)
    await updateDoc(surveyRef, surveyData)
    console.log("[v0] Encuesta actualizada:", surveyId)
  } catch (error) {
    console.error("[v0] Error actualizando encuesta:", error)
    throw error
  }
}

export async function deleteSurvey(surveyId: string) {
  try {
    const surveyRef = doc(db, "encuestas", surveyId)
    await deleteDoc(surveyRef)
    console.log("[v0] Encuesta eliminada:", surveyId)
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

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error obteniendo encuestas:", error)
    return []
  }
}

export async function getAssignedSurveys(documento: string) {
  try {
    const estudiantesRef = collection(db, "estudiantes")
    const qEstudiante = query(estudiantesRef, where("documento", "==", documento))
    const estudianteSnapshot = await getDocs(qEstudiante)

    if (estudianteSnapshot.empty) {
      return []
    }

    const estudiante = estudianteSnapshot.docs[0].data()

    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("activa", "==", true))
    const surveysSnapshot = await getDocs(qSurveys)

    const assignedSurveys = surveysSnapshot.docs.filter((doc) => {
      const survey = doc.data()
      const asignacion = survey.asignacion || {}

      // Verificar si está en estudiantes individuales
      if (asignacion.estudiantesIndividuales?.includes(documento)) {
        return true
      }

      // Verificar si coincide con algún grupo
      if (asignacion.grupos && asignacion.grupos.length > 0) {
        return asignacion.grupos.some((grupo: any) => {
          return (
            (!grupo.jornada || grupo.jornada === estudiante.jornada) &&
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
    const surveysWithStatus = await Promise.all(
      assignedSurveys.map(async (surveyDoc) => {
        const qRespuesta = query(
          respuestasRef,
          where("encuestaId", "==", surveyDoc.id),
          where("documento", "==", documento),
        )
        const respuestaSnapshot = await getDocs(qRespuesta)

        return {
          id: surveyDoc.id,
          ...surveyDoc.data(),
          completada: !respuestaSnapshot.empty,
        }
      }),
    )

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

export async function getSurveyStats() {
  try {
    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("activa", "==", true))
    const surveysSnapshot = await getDocs(qSurveys)

    const respuestasRef = collection(db, "respuestas")
    const respuestasSnapshot = await getDocs(respuestasRef)

    const estudiantesRef = collection(db, "estudiantes")
    const estudiantesSnapshot = await getDocs(estudiantesRef)

    const totalSurveys = surveysSnapshot.size
    const totalRespuestas = respuestasSnapshot.size
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
