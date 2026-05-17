import { openDB } from 'idb';

const DB_NAME = 'pdp-photo-queue';
const DB_VERSION = 1;
const STORE = 'pending_uploads';

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function addToPhotoQueue({
  planId,
  blob,
  fileName,
  mimeType = 'image/jpeg',
  fieldType = 'photos',
  questionId = null,
}) {
  const db = await getDB();
  const id = `pq_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.put(STORE, {
    id,
    planId,
    blob,
    fileName,
    mimeType,
    fieldType,
    questionId,
    savedAt: new Date().toISOString(),
  });
  return id;
}

export async function getPendingUploads() {
  return (await getDB()).getAll(STORE);
}

export async function removeFromQueue(id) {
  return (await getDB()).delete(STORE, id);
}

export async function countPendingUploads() {
  return (await getDB()).count(STORE);
}

export async function clearPhotoQueue() {
  return (await getDB()).clear(STORE);
}
