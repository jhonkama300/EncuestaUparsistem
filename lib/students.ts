import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore"
import { db } from "./firebase"
import * as XLSX from "xlsx"

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

    const documentos = jsonData.map((row: any) => row["Número de identificación"]?.toString()).filter(Boolean)

    const estudiantesRef = collection(db, "estudiantes")
    const usuariosRef = collection(db, "usuarios")

    const existingStudentDocs = new Set<string>()
    const existingUserDocs = new Set<string>()

    // Dividir documentos en lotes de 10 para consultar
    for (let i = 0; i < documentos.length; i += 10) {
      const batch = documentos.slice(i, i + 10)

      const existingStudentsQuery = query(estudiantesRef, where("documento", "in", batch))
      const existingUsersQuery = query(usuariosRef, where("documento", "in", batch))

      const [existingStudentsSnap, existingUsersSnap] = await Promise.all([
        getDocs(existingStudentsQuery),
        getDocs(existingUsersQuery),
      ])

      existingStudentsSnap.docs.forEach((d) => existingStudentDocs.add(d.data().documento))
      existingUsersSnap.docs.forEach((d) => existingUserDocs.add(d.data().documento))
    }

    console.log("[v0] Estudiantes existentes encontrados en BD:", existingStudentDocs.size)

    let batch = writeBatch(db)
    let batchCount = 0
    const BATCH_SIZE = 500

    for (let i = 0; i < jsonData.length; i++) {
      const row: any = jsonData[i]

      try {
        // Validar campos requeridos
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

        const studentData: StudentData = {
          primerNombre: row["Primer nombre"],
          segundoNombre: row["Segundo nombre"] || "",
          primerApellido: row["Primer apellido"],
          segundoApellido: row["Segundo apellido"] || "",
          documento: row["Número de identificación"].toString(),
          jornada: row["Jornada"],
          programa: row["Programa"],
          grupo: row["Grupo"],
          periodo: row["Período"],
          nivel: row["Nivel"].toString(),
        }

        if (existingStudentDocs.has(studentData.documento)) {
          errors.push(`Fila ${i + 2}: Estudiante con documento ${studentData.documento} ya existe en la base de datos`)
          continue
        }

        const estudianteDocRef = doc(collection(db, "estudiantes"))
        batch.set(estudianteDocRef, studentData)
        batchCount++

        existingStudentDocs.add(studentData.documento)

        // Agregar usuario si no existe
        if (!existingUserDocs.has(studentData.documento)) {
          const usuarioDocRef = doc(collection(db, "usuarios"))
          batch.set(usuarioDocRef, {
            documento: studentData.documento,
            nombre:
              `${studentData.primerNombre} ${studentData.segundoNombre} ${studentData.primerApellido} ${studentData.segundoApellido}`.trim(),
            email: `${studentData.documento}@estudiante.edu.co`,
            rol: "estudiante",
            activo: true,
            fechaCreacion: new Date().toISOString(),
          })
          batchCount++
          existingUserDocs.add(studentData.documento)
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

    if (filtros.jornada) q = query(q, where("jornada", "==", filtros.jornada))
    if (filtros.programa) q = query(q, where("programa", "==", filtros.programa))
    if (filtros.grupo) q = query(q, where("grupo", "==", filtros.grupo))
    if (filtros.periodo) q = query(q, where("periodo", "==", filtros.periodo))
    if (filtros.nivel) q = query(q, where("nivel", "==", filtros.nivel))

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
    const usuariosRef = collection(db, "usuarios")

    const qEstudiantes = query(estudiantesRef, where("programa", "==", programa))
    const estudiantesSnapshot = await getDocs(qEstudiantes)

    const documentos = estudiantesSnapshot.docs.map((doc) => doc.data().documento)

    const batch = writeBatch(db)
    let count = 0

    // Delete students
    estudiantesSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
      count++
    })

    // Delete associated users
    if (documentos.length > 0) {
      const qUsuarios = query(usuariosRef, where("documento", "in", documentos.slice(0, 10)))
      const usuariosSnapshot = await getDocs(qUsuarios)
      usuariosSnapshot.docs.forEach((docSnap) => {
        batch.delete(doc(db, "usuarios", docSnap.id))
      })
    }

    await batch.commit()
    console.log("[v0] Estudiantes eliminados:", count)
    return count
  } catch (error) {
    console.error("[v0] Error reseteando estudiantes por programa:", error)
    throw error
  }
}

export async function resetStudentsByGrupo(grupo: string): Promise<number> {
  try {
    console.log("[v0] Reseteando estudiantes del grupo:", grupo)
    const estudiantesRef = collection(db, "estudiantes")
    const usuariosRef = collection(db, "usuarios")

    const qEstudiantes = query(estudiantesRef, where("grupo", "==", grupo))
    const estudiantesSnapshot = await getDocs(qEstudiantes)

    const documentos = estudiantesSnapshot.docs.map((doc) => doc.data().documento)

    const batch = writeBatch(db)
    let count = 0

    // Delete students
    estudiantesSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
      count++
    })

    // Delete associated users
    if (documentos.length > 0) {
      const qUsuarios = query(usuariosRef, where("documento", "in", documentos.slice(0, 10)))
      const usuariosSnapshot = await getDocs(qUsuarios)
      usuariosSnapshot.docs.forEach((docSnap) => {
        batch.delete(doc(db, "usuarios", docSnap.id))
      })
    }

    await batch.commit()
    console.log("[v0] Estudiantes eliminados:", count)
    return count
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

    // Delete all students
    estudiantesSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
      count++

      if (count % BATCH_SIZE === 0) {
        batch.commit()
        batch = writeBatch(db)
      }
    })

    // Delete all student users
    usuariosSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "usuarios", docSnap.id))

      if (count % BATCH_SIZE === 0) {
        batch.commit()
        batch = writeBatch(db)
      }
    })

    await batch.commit()
    console.log("[v0] Total de estudiantes eliminados:", count)
    return count
  } catch (error) {
    console.error("[v0] Error reseteando todos los estudiantes:", error)
    throw error
  }
}

export async function deleteStudentByDocumento(documento: string): Promise<boolean> {
  try {
    console.log("[v0] Eliminando estudiante con documento:", documento)
    const estudiantesRef = collection(db, "estudiantes")
    const usuariosRef = collection(db, "usuarios")

    // Buscar estudiante por documento
    const qEstudiante = query(estudiantesRef, where("documento", "==", documento))
    const estudianteSnapshot = await getDocs(qEstudiante)

    if (estudianteSnapshot.empty) {
      console.log("[v0] No se encontró estudiante con documento:", documento)
      return false
    }

    const batch = writeBatch(db)

    // Eliminar estudiante
    estudianteSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "estudiantes", docSnap.id))
    })

    // Eliminar usuario asociado
    const qUsuario = query(usuariosRef, where("documento", "==", documento))
    const usuarioSnapshot = await getDocs(qUsuario)
    usuarioSnapshot.docs.forEach((docSnap) => {
      batch.delete(doc(db, "usuarios", docSnap.id))
    })

    await batch.commit()
    console.log("[v0] Estudiante eliminado exitosamente:", documento)
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
