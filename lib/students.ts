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

    // Obtener todos los documentos existentes de una vez
    const existingStudentsQuery = query(estudiantesRef, where("documento", "in", documentos.slice(0, 10)))
    const existingUsersQuery = query(usuariosRef, where("documento", "in", documentos.slice(0, 10)))

    const [existingStudentsSnap, existingUsersSnap] = await Promise.all([
      getDocs(existingStudentsQuery),
      getDocs(existingUsersQuery),
    ])

    const existingStudentDocs = new Set(existingStudentsSnap.docs.map((d) => d.data().documento))
    const existingUserDocs = new Set(existingUsersSnap.docs.map((d) => d.data().documento))

    console.log("[v0] Estudiantes existentes encontrados:", existingStudentDocs.size)

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
          errors.push(`Fila ${i + 2}: Estudiante con documento ${studentData.documento} ya existe`)
          continue
        }

        const estudianteDocRef = doc(collection(db, "estudiantes"))
        batch.set(estudianteDocRef, studentData)
        batchCount++

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
