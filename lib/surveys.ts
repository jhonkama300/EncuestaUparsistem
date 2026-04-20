import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore"
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
  grupos?: string[] // Agregado campo para múltiples grupos
  // Date/time fields
  fechaEncuesta?: string // Date when survey was conducted
  horaInicio?: string // Start time of seminar (e.g., "06:00")
  horaFin?: string // End time of seminar (e.g., "20:00")
  auditorio?: string // Agregado campo para auditorio/ubicación
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
    const ponentesRef = collection(db, "ponentes")

    const surveysWithCounts = await Promise.all(
      querySnapshot.docs.map(async (surveyDoc) => {
        const surveyData = surveyDoc.data()
        const qRespuestas = query(respuestasRef, where("encuestaId", "==", surveyDoc.id))
        const respuestasSnapshot = await getDocs(qRespuestas)

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
          respuestas: respuestasSnapshot.size,
          ponenteNombre,
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

    const inscripciones = estudianteSnapshot.docs.map((doc) => doc.data())
    console.log("[v0] getAssignedSurveys - Inscripciones encontradas:", inscripciones.length)

    const surveysRef = collection(db, "encuestas")
    const qSurveys = query(surveysRef, where("activa", "==", true))
    const surveysSnapshot = await getDocs(qSurveys)

    const assignedSurveysMap = new Map()

    surveysSnapshot.docs.forEach((doc) => {
      const survey = doc.data()
      const asignacion = survey.asignacion || {}

      // Verificar asignación individual
      if (asignacion.estudiantesIndividuales?.includes(documento)) {
        if (!assignedSurveysMap.has(doc.id)) {
          assignedSurveysMap.set(doc.id, { surveyDoc: doc, grupoAsignado: null })
        }
        return
      }

      if (asignacion.grupos && asignacion.grupos.length > 0) {
        for (const inscripcion of inscripciones) {
          const grupoCoincidente = asignacion.grupos.find((grupo: any) => {
            const matchPrograma = !grupo.programa || grupo.programa === inscripcion.programa
            const matchGrupo = !grupo.grupo || grupo.grupo === inscripcion.grupo
            const matchPeriodo = !grupo.periodo || grupo.periodo === inscripcion.periodo
            const matchNivel = !grupo.nivel || grupo.nivel === inscripcion.nivel

            return matchPrograma && matchGrupo && matchPeriodo && matchNivel
          })

          if (grupoCoincidente) {
            if (!assignedSurveysMap.has(doc.id)) {
              assignedSurveysMap.set(doc.id, {
                surveyDoc: doc,
                grupoAsignado: inscripcion.grupo || null,
                programaAsignado: inscripcion.programa || null,
                nivelAsignado: inscripcion.nivel || null,
                periodoAsignado: inscripcion.periodo || null,
              })
            }
            break
          }
        }
      }
    })

    const respuestasRef = collection(db, "respuestas")
    const ponentesRef = collection(db, "ponentes")

    const surveysWithStatus = await Promise.all(
      Array.from(assignedSurveysMap.values()).map(
        async ({ surveyDoc, grupoAsignado, programaAsignado, nivelAsignado, periodoAsignado }) => {
          const surveyData = surveyDoc.data()
          const qRespuesta = query(
            respuestasRef,
            where("encuestaId", "==", surveyDoc.id),
            where("documento", "==", documento),
          )
          const respuestaSnapshot = await getDocs(qRespuesta)

          let ponenteNombre = null
          let ponenteImagen = null

          if (surveyData.ponenteId) {
            console.log("[v0] Buscando ponente con ID:", surveyData.ponenteId)
            const ponenteDocRef = doc(db, "ponentes", surveyData.ponenteId)
            const ponenteDoc = await getDocs(
              query(collection(db, "ponentes"), where("__name__", "==", surveyData.ponenteId)),
            )

            if (!ponenteDoc.empty) {
              const ponenteData = ponenteDoc.docs[0].data()
              ponenteNombre = ponenteData.nombre
              ponenteImagen = ponenteData.imagen
              console.log("[v0] Ponente encontrado:", ponenteNombre, "- Tiene imagen:", ponenteImagen ? "SÍ" : "NO")
            } else {
              console.log("[v0] Ponente no encontrado para ID:", surveyData.ponenteId)
            }
          }

          return {
            id: surveyDoc.id,
            ...surveyData,
            grupoAsignado,
            programaAsignado,
            nivelAsignado,
            periodoAsignado,
            completada: !respuestaSnapshot.empty,
            ponenteNombre,
            ponenteImagen,
          }
        },
      ),
    )

    console.log("[v0] getAssignedSurveys - Encuestas asignadas (sin duplicados):", surveysWithStatus.length)
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
    const surveyRef = doc(db, "encuestas", surveyId)
    const surveyDoc = await getDocs(query(collection(db, "encuestas"), where("__name__", "==", surveyId)))
    const encuesta = surveyDoc.empty ? null : { id: surveyDoc.docs[0].id, ...surveyDoc.docs[0].data() }

    const respuestasRef = collection(db, "respuestas")
    const q = query(respuestasRef, where("encuestaId", "==", surveyId))
    const respuestasSnapshot = await getDocs(q)

    const estudiantesRef = collection(db, "estudiantes")

    console.log("[v0] getSurveyResponses - Total respuestas:", respuestasSnapshot.size)

    const responsesWithStudents = await Promise.all(
      respuestasSnapshot.docs.map(async (respuestaDoc) => {
        const respuesta = respuestaDoc.data()
        console.log("[v0] Procesando respuesta:", respuesta.documento)
        console.log("[v0] Respuestas del estudiante:", respuesta.respuestas)

        const qEstudiante = query(estudiantesRef, where("documento", "==", respuesta.documento))
        const estudianteSnapshot = await getDocs(qEstudiante)

        const estudiante = estudianteSnapshot.empty ? null : estudianteSnapshot.docs[0].data()
        console.log("[v0] Estudiante encontrado:", estudiante)

        let nombreCompleto = `Estudiante ${respuesta.documento}`
        if (estudiante) {
          const nombres = [
            estudiante.primerNombre,
            estudiante.segundoNombre,
            estudiante.primerApellido,
            estudiante.segundoApellido,
          ]
            .filter(Boolean)
            .join(" ")
          nombreCompleto = nombres || nombreCompleto
        }

        return {
          id: respuestaDoc.id,
          ...respuesta,
          nombreEstudiante: nombreCompleto,
          grupoEstudiante: estudiante?.grupo || "N/A",
          programaEstudiante: estudiante?.programa || "N/A",
          nivelEstudiante: estudiante?.nivel || "N/A",
        }
      }),
    )

    console.log("[v0] Respuestas procesadas:", responsesWithStudents)

    return {
      encuesta,
      respuestas: responsesWithStudents,
    }
  } catch (error) {
    console.error("Error obteniendo respuestas de encuesta:", error)
    return {
      encuesta: null,
      respuestas: [],
    }
  }
}

export async function getSurveyStats() {
  try {
    // 3 parallel fetches instead of N×M sequential queries
    const [surveysSnapshot, estudiantesSnapshot, respuestasSnapshot] = await Promise.all([
      getDocs(collection(db, "encuestas")),
      getDocs(collection(db, "estudiantes")),
      getDocs(collection(db, "respuestas")),
    ])

    const estudiantes = estudiantesSnapshot.docs.map((d) => ({ id: d.id, ...d.data() as any }))
    const totalRespuestas = respuestasSnapshot.size

    let totalEstudiantesAsignados = 0
    let totalActive = 0

    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyData = surveyDoc.data()
      if (surveyData.activa) totalActive++
      const asignacion = surveyData.asignacion || {}
      const individuales: string[] = asignacion.estudiantesIndividuales || []

      totalEstudiantesAsignados += individuales.length

      if (Array.isArray(asignacion.grupos) && asignacion.grupos.length > 0) {
        for (const est of estudiantes) {
          if (individuales.includes(est.documento)) continue
          const matched = asignacion.grupos.some((g: any) =>
            (!g.programa || g.programa === est.programa) &&
            (!g.grupo    || g.grupo    === est.grupo)    &&
            (!g.periodo  || g.periodo  === est.periodo)  &&
            (!g.nivel    || g.nivel    === est.nivel)
          )
          if (matched) totalEstudiantesAsignados++
        }
      }
    }

    const tasa = totalEstudiantesAsignados > 0 ? Math.round((totalRespuestas / totalEstudiantesAsignados) * 100) : 0

    return { total: totalActive, respuestas: totalRespuestas, tasa, estudiantesAsignados: totalEstudiantesAsignados }
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    return { total: 0, respuestas: 0, tasa: 0, estudiantesAsignados: 0 }
  }
}

export function subscribeToSurveys(callback: (surveys: any[]) => void) {
  try {
    const surveysRef = collection(db, "encuestas")
    const q = query(surveysRef, where("activa", "==", true))

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
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

      callback(surveysWithCounts)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error suscribiéndose a encuestas:", error)
    return () => {}
  }
}

export function subscribeToAllSurveys(callback: (surveys: any[]) => void) {
  try {
    const surveysRef = collection(db, "encuestas")

    const unsubscribe = onSnapshot(surveysRef, async (querySnapshot) => {
      const respuestasRef = collection(db, "respuestas")
      const ponentesRef = collection(db, "ponentes")

      const surveysWithCounts = await Promise.all(
        querySnapshot.docs.map(async (surveyDoc) => {
          const surveyData = surveyDoc.data()
          const qRespuestas = query(respuestasRef, where("encuestaId", "==", surveyDoc.id))
          const respuestasSnapshot = await getDocs(qRespuestas)

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
            respuestas: respuestasSnapshot.size,
            ponenteNombre,
          }
        }),
      )

      callback(surveysWithCounts)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error suscribiéndose a todas las encuestas:", error)
    return () => {}
  }
}
