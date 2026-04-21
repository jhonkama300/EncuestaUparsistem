import { collection, getDocs, writeBatch, doc } from "firebase/firestore"
import { db } from "./firebase"

export async function migrateExistingDataToUparsistem() {
  const collectionsToMigrate = ["encuestas", "estudiantes", "ponentes", "plantillas_encuestas", "respuestas"]
  let totalMigrated = 0

  try {
    for (const colName of collectionsToMigrate) {
      console.log(`Migrating ${colName}...`)
      const sourceRef = collection(db, colName)
      const snapshot = await getDocs(sourceRef)

      if (snapshot.empty) {
        console.log(`No data found in ${colName}, skipping.`)
        continue
      }

      const batch = writeBatch(db)
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data()
        const targetRef = doc(collection(db, `uparsistem_${colName}`))
        
        // We use the same ID to avoid duplicates if run multiple times
        // However, addDoc/collection usually creates new IDs. 
        // To keep IDs, we use doc(db, collectionName, id)
        const targetDocRef = doc(db, `uparsistem_${colName}`, docSnap.id)
        batch.set(targetDocRef, data)
        totalMigrated++
      })

      await batch.commit()
      console.log(`Successfully migrated ${snapshot.size} documents from ${colName} to uparsistem_${colName}`)
    }

    return { success: true, total: totalMigrated }
  } catch (error) {
    console.error("Migration error:", error)
    throw error
  }
}
