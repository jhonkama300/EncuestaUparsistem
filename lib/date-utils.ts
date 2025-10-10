/**
 * Convierte una fecha del input date (YYYY-MM-DD) a un string ISO
 * manteniendo la fecha local sin conversión de zona horaria
 */
export function dateInputToLocalISO(dateString: string): string {
  if (!dateString) return ""

  // El input date retorna "YYYY-MM-DD"
  // Agregamos la hora local para evitar conversión de zona horaria
  const [year, month, day] = dateString.split("-")
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day), 12, 0, 0)

  return date.toISOString()
}

/**
 * Convierte un string ISO a formato de input date (YYYY-MM-DD)
 * manteniendo la fecha local sin conversión de zona horaria
 */
export function localISOToDateInput(isoString: string): string {
  if (!isoString) return ""

  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha ISO para mostrar en formato legible
 * Ejemplo: "9 de octubre de 2025"
 */
export function formatDateForDisplay(isoString: string): string {
  if (!isoString) return ""

  const date = new Date(isoString)
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Formatea una hora en formato 24h a formato 12h con AM/PM
 * Ejemplo: "08:00" -> "8:00 AM"
 */
export function formatTimeForDisplay(time24: string): string {
  if (!time24) return ""

  const [hours, minutes] = time24.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12

  return `${hour12}:${minutes} ${ampm}`
}
