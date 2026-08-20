/** Silent offline audio cache using IndexedDB (no Save As dialog). */

const DB_NAME = 'riwu-music-offline';
const STORE = 'tracks';
const DB_VERSION = 1;

export type OfflineTrackMeta = {
  trackId: string;
  title: string;
  artist: string;
  mimeType: string;
  cachedAt: number;
  size: number;
};

type OfflineRecord = OfflineTrackMeta & { blob: Blob };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'trackId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function hasOfflineTrack(trackId: string): Promise<boolean> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const result = await reqToPromise(tx.objectStore(STORE).getKey(trackId));
    return result !== undefined;
  } finally {
    db.close();
  }
}

export async function listOfflineTrackIds(): Promise<string[]> {
  const tracks = await listOfflineTracks();
  return tracks.map((t) => t.trackId);
}

export async function listOfflineTracks(): Promise<OfflineTrackMeta[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const records = (await reqToPromise(tx.objectStore(STORE).getAll())) as OfflineRecord[];
    return records.map(({ blob: _blob, ...meta }) => meta);
  } finally {
    db.close();
  }
}

export async function getOfflineObjectUrl(trackId: string): Promise<string | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const record = (await reqToPromise(tx.objectStore(STORE).get(trackId))) as OfflineRecord | undefined;
    if (!record?.blob) return null;
    return URL.createObjectURL(record.blob);
  } finally {
    db.close();
  }
}

export async function cacheOfflineTrack(input: {
  trackId: string;
  title: string;
  artist: string;
  blob: Blob;
  mimeType?: string;
}): Promise<void> {
  const db = await openDb();
  try {
    const record: OfflineRecord = {
      trackId: input.trackId,
      title: input.title,
      artist: input.artist,
      mimeType: input.mimeType || input.blob.type || 'audio/mpeg',
      cachedAt: Date.now(),
      size: input.blob.size,
      blob: input.blob,
    };
    const tx = db.transaction(STORE, 'readwrite');
    await reqToPromise(tx.objectStore(STORE).put(record));
  } finally {
    db.close();
  }
}

export async function removeOfflineTrack(trackId: string): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    await reqToPromise(tx.objectStore(STORE).delete(trackId));
  } finally {
    db.close();
  }
}
