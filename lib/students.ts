import { collection, query, where, getDocs, writeBatch, doc, onSnapshot } from "firebase/firestore"
import { db } from "./firebase"
import * as XLSX from "xlsx"

export interface Student {
  id?: string
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  documento: string
  jornada: string
  programa: string
  grupo: string
  periodo: string
  nivel: string
}

export interface StudentData {
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  documento: string
  jornada: string
  programa: string
  grupo: string
  periodo: string
  nivel: string
}

export async function uploadStudentsFromExcel(file: File): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = []
  let success = 0

  try {
    console.log("[v0] Iniciando procesamiento de archivo Excel:", file.name)
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    console.log("[v0] Total de filas encontradas:", jsonData.length)

    const estudiantesRef = collection(db, "estudiantes")
    const existingStudentsSnap = await getDocs(estudiantesRef)

    // Crear un mapa de estudiantes existentes: documento+programa+grupo+nivel -> datos
    const existingStudentsMap = new Map<string, any>()
    existingStudentsSnap.docs.forEach((d) => {
      const data = d.data()
      const key = `${data.documento}|${data.programa}|${data.grupo}|${data.nivel}`
      existingStudentsMap.set(key, { id: d.id, ...data })
    })

    console.log("[v0] Estudiantes existentes encontrados en BD:", existingStudentsSnap.size)

    const usuariosRef = collection(db, "usuarios")
    const existingUserDocs = new Set<string>()
    const usuariosSnap = await getDocs(usuariosRef)
    usuariosSnap.docs.forEach((d) => existingUserDocs.add(d.data().documento))

    let batch = writeBatch(db)
    let batchCount = 0
    const BATCH_SIZE = 500

    for (let i = 0; i < jsonData.length; i++) {
      const row: any = jsonData[i]

      try {
        const requiredFields = [
          "Primer nombre",
          "Primer apellido",
          "Número de identificación",
          "Jornada",
          "Programa",
          "Grupo",
          "Período",
          "Nivel",
        ]

        const missingFields = requiredFields.filter((field) => !row[field])
        if (missingFields.length > 0) {
          errors.push(`Fila ${i + 2}: Faltan campos requeridos: ${missingFields.join(", ")}`)
          continue
        }

        const documento = row["Número de identificación"].toString()
        const primerNombre = row["Primer nombre"]
        const programa = row["Programa"]
        const grupo = row["Grupo"]
        const nivel = row["Nivel"].toString()

        const key = `${documento}|${programa}|${grupo}|${nivel}`
        const existingStudent = existingStudentsMap.get(key)

        if (existingStudent) {
          errors.push(
            `Fila ${i + 2}: Estudiante ${primerNombre} con documento ${documento} ya existe con el mismo programa (${programa}), grupo (${grupo}) y nivel (${nivel}). No se creará duplicado.`,
          )
          console.log(`[v0] Registro duplicado encontrado (skip): ${documento} - ${programa} - ${grupo} - ${nivel}`)
          continue
        }

        const studentData: Student = {
          primerNombre: primerNombre,
          segundoNombre: row["Segundo nombre"] || "",
          primerApellido: row["Primer apellido"],
          segundoApellido: row["Segundo apellido"] || "",
          documento: documento,
          jornada: row["Jornada"],
          programa: programa,
          grupo: grupo,
          periodo: row["Período"],
          nivel: nivel,
        }

        const estudianteDocRef = doc(collection(db, "estudiantes"))
        batch.set(estudianteDocRef, studentData)
        batchCount++
        existingStudentsMap.set(key, { id: estudianteDocRef.id, ...studentData })

        // Crear usuario si no existe
        if (!existingUserDocs.has(documento)) {
          const usuarioDocRef = doc(collection(db, "usuarios"))
          batch.set(usuarioDocRef, {
            documento: documento,
            nombre:
              `${studentData.primerNombre} ${studentData.segundoNombre} ${studentData.primerApellido} ${studentData.segundoApellido}`.trim(),
            email: `${documento}@estudiante.edu.co`,
            rol: "estudiante",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          })
          batchCount++
          existingUserDocs.add(documento)
        }

        if (batchCount >= BATCH_SIZE) {
          await batch.commit()
          console.log("[v0] Batch de", batchCount, "operaciones ejecutado")
          batch = writeBatch(db)
          batchCount = 0
        }

        success++
      } catch (error) {
        console.error("[v0] Error procesando fila", i + 2, ":", error)
        errors.push(`Fila ${i + 2}: Error procesando estudiante - ${error}`)
      }
    }

    if (batchCount > 0) {
      await batch.commit()
      console.log("[v0] Último batch de", batchCount, "operaciones ejecutado")
    }

    console.log("[v0] Proceso completado. Éxitos:", success, "- Errores:", errors.length)
    return { success, errors }
  } catch (error) {
    console.error("[v0] Error procesando archivo Excel:", error)
    throw new Error("Error al procesar el archivo Excel")
  }
}

export async function getUniqueStudentValues() {
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
    console.error("Error obteniendo valores únicos:", error)
    return { jornadas: [], programas: [], grupos: [], periodos: [], niveles: [] }
  }
}

export const getStudentFilters = getUniqueStudentValues

export async function getStudentsByFilters(filtros: {
  jornada?: string
  programa?: string
  grupo?: string
  periodo?: string
  nivel?: string
}) {
  try {
    const estudiantesRef = collection(db, "estudiantes")
    let q = query(estudiantesRef)

    if (filtros.jornada) {
      q = query(q, where("jornada", "==", filtros.jornada))
    }
    if (filtros.programa) {
      q = query(q, where("programa", "==", filtros.programa))
    }
    if (filtros.grupo) {
      q = query(q, where("grupo", "==", filtros.grupo))
    }
    if (filtros.periodo) {
      q = query(q, where("periodo", "==", filtros.periodo))
    }
    if (filtros.nivel) {
      q = query(q, where("nivel", "==", filtros.nivel))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error obteniendo estudiantes por filtros:", error)
    return []
  }
}

export async function getAllStudents() {
  try {
    const estudiantesRef = collection(db, "estudiantes")
    const snapshot = await getDocs(estudiantesRef)

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error obteniendo todos los estudiantes:", error)
    return []
  }
}

export async function resetStudentsByPrograma(programa: string): Promise<number> {
  try {
    console.log("[v0] Reseteando estudiantes del programa:", programa)
    const estudiantesRef = collection(db, "estudiantes")
    const q = query(estudiantesRef, where("programa", "==", programa))
    const snapshot = await getDocs(q)

    const batch = writeBatch(db)
    snapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
    })

    await batch.commit()
    console.log("[v0] Estudiantes eliminados:", snapshot.size)
    return snapshot.size
  } catch (error) {
    console.error("[v0] Error reseteando estudiantes por programa:", error)
    throw error
  }
}

export async function resetStudentsByGrupo(grupo: string): Promise<number> {
  try {
    console.log("[v0] Reseteando estudiantes del grupo:", grupo)
    const estudiantesRef = collection(db, "estudiantes")
    const q = query(estudiantesRef, where("grupo", "==", grupo))
    const snapshot = await getDocs(q)

    const batch = writeBatch(db)
    snapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
    })

    await batch.commit()
    console.log("[v0] Estudiantes eliminados:", snapshot.size)
    return snapshot.size
  } catch (error) {
    console.error("[v0] Error reseteando estudiantes por grupo:", error)
    throw error
  }
}

export async function resetAllStudents(): Promise<number> {
  try {
    console.log("[v0] Reseteando TODOS los estudiantes")
    const estudiantesRef = collection(db, "estudiantes")
    const usuariosRef = collection(db, "usuarios")

    const estudiantesSnapshot = await getDocs(estudiantesRef)
    const qUsuarios = query(usuariosRef, where("rol", "==", "estudiante"))
    const usuariosSnapshot = await getDocs(qUsuarios)

    let batch = writeBatch(db)
    let count = 0
    const BATCH_SIZE = 500

    estudiantesSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
      count++

      if (count % BATCH_SIZE === 0) {
        batch.commit()
        batch = writeBatch(db)
      }
    })

    usuariosSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "usuarios", docSnap.id))

      if (count % BATCH_SIZE === 0) {
        batch.commit()
        batch = writeBatch(db)
      }
    })

    await batch.commit()
    console.log("[v0] Total de registros eliminados:", count)
    return count
  } catch (error) {
    console.error("[v0] Error reseteando todos los estudiantes:", error)
    throw error
  }
}

export async function deleteStudentByDocumento(documento: string): Promise<boolean> {
  try {
    console.log("[v0] Eliminando TODOS los registros del estudiante con documento:", documento)
    const estudiantesRef = collection(db, "estudiantes")
    const usuariosRef = collection(db, "usuarios")

    const qEstudiante = query(estudiantesRef, where("documento", "==", documento))
    const estudianteSnapshot = await getDocs(qEstudiante)

    if (estudianteSnapshot.empty) {
      console.log("[v0] No se encontró estudiante con documento:", documento)
      return false
    }

    const batch = writeBatch(db)

    // Eliminar TODOS los registros del estudiante (todas sus inscripciones)
    estudianteSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
    })

    // Eliminar usuario
    const qUsuario = query(usuariosRef, where("documento", "==", documento))
    const usuarioSnapshot = await getDocs(qUsuario)
    usuarioSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "usuarios", docSnap.id))
    })

    await batch.commit()
    console.log("[v0] Estudiante eliminado exitosamente (todas las inscripciones):", documento)
    return true
  } catch (error) {
    console.error("[v0] Error eliminando estudiante:", error)
    throw error
  }
}

export async function searchStudentByName(searchTerm: string) {
  try {
    console.log("[v0] Buscando estudiante por nombre:", searchTerm)
    const estudiantesRef = collection(db, "estudiantes")
    const snapshot = await getDocs(estudiantesRef)

    const searchLower = searchTerm.toLowerCase()
    const results = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((student: any) => {
        const fullName =
          `${student.primerNombre} ${student.segundoNombre || ""} ${student.primerApellido} ${student.segundoApellido || ""}`.toLowerCase()
        return fullName.includes(searchLower) || student.documento?.toLowerCase().includes(searchLower)
      })

    return results
  } catch (error) {
    console.error("[v0] Error buscando estudiante:", error)
    return []
  }
}

export async function assignStudentToGroup(documento: string, nuevoGrupo: string): Promise<boolean> {
  try {
    console.log("[v0] Asignando estudiante", documento, "al grupo:", nuevoGrupo)
    const estudiantesRef = collection(db, "estudiantes")
    const qEstudiante = query(estudiantesRef, where("documento", "==", documento))
    const estudianteSnapshot = await getDocs(qEstudiante)

    if (estudianteSnapshot.empty) {
      console.log("[v0] No se encontró estudiante con documento:", documento)
      return false
    }

    const batch = writeBatch(db)

    // Actualizar TODAS las inscripciones del estudiante
    estudianteSnapshot.docs.forEach((docSnap) => {
      const estudianteRef = doc(db, "estudiantes", docSnap.id)
      batch.update(estudianteRef, { grupo: nuevoGrupo })
    })

    await batch.commit()

    console.log("[v0] Estudiante asignado al grupo exitosamente")
    return true
  } catch (error) {
    console.error("[v0] Error asignando estudiante a grupo:", error)
    throw error
  }
}

export async function assignMultipleStudentsToGroup(
  documentos: string[],
  nuevoGrupo: string,
): Promise<{ success: number; errors: string[] }> {
  try {
    console.log("[v0] Asignando", documentos.length, "estudiantes al grupo:", nuevoGrupo)
    const estudiantesRef = collection(db, "estudiantes")

    let batch = writeBatch(db)
    let batchCount = 0
    let success = 0
    const errors: string[] = []
    const BATCH_SIZE = 500

    for (const documento of documentos) {
      try {
        const qEstudiante = query(estudiantesRef, where("documento", "==", documento))
        const estudianteSnapshot = await getDocs(qEstudiante)

        if (estudianteSnapshot.empty) {
          errors.push(`Estudiante con documento ${documento} no encontrado`)
          continue
        }

        // Actualizar TODAS las inscripciones del estudiante
        estudianteSnapshot.docs.forEach((docSnap) => {
          const estudianteRef = doc(db, "estudiantes", docSnap.id)
          batch.update(estudianteRef, { grupo: nuevoGrupo })
          batchCount++
        })

        success++

        if (batchCount >= BATCH_SIZE) {
          await batch.commit()
          console.log("[v0] Batch de", batchCount, "operaciones ejecutado")
          batch = writeBatch(db)
          batchCount = 0
        }
      } catch (error) {
        errors.push(`Error asignando estudiante ${documento}: ${error}`)
      }
    }

    if (batchCount > 0) {
      await batch.commit()
      console.log("[v0] Último batch de", batchCount, "operaciones ejecutado")
    }

    console.log("[v0] Asignación completada. Éxitos:", success, "- Errores:", errors.length)
    return { success, errors }
  } catch (error) {
    console.error("[v0] Error asignando estudiantes a grupo:", error)
    throw error
  }
}

export async function createNewGroup(
  grupoNombre: string,
  filtros?: {
    jornada?: string
    programa?: string
    periodo?: string
    nivel?: string
  },
): Promise<number> {
  try {
    console.log("[v0] Creando nuevo grupo:", grupoNombre, "con filtros:", filtros)

    if (!filtros || Object.keys(filtros).length === 0) {
      console.log("[v0] No se proporcionaron filtros, no se asignarán estudiantes")
      return 0
    }

    const estudiantes = await getStudentsByFilters(filtros)

    if (estudiantes.length === 0) {
      console.log("[v0] No se encontraron estudiantes con los filtros proporcionados")
      return 0
    }

    const documentos = estudiantes.map((e: any) => e.documento)
    const result = await assignMultipleStudentsToGroup(documentos, grupoNombre)

    console.log("[v0] Grupo creado con", result.success, "estudiantes asignados")
    return result.success
  } catch (error) {
    console.error("[v0] Error creando nuevo grupo:", error)
    throw error
  }
}

export function subscribeToStudents(callback: (students: any[]) => void) {
  try {
    const estudiantesRef = collection(db, "estudiantes")

    const unsubscribe = onSnapshot(estudiantesRef, (querySnapshot) => {
      const students = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      callback(students)
    })

    return unsubscribe
  } catch (error) {
    console.error("Error suscribiéndose a estudiantes:", error)
    return () => {}
  }
}
