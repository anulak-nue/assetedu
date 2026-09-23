import {
  getFirestore,
  collection,
  doc,
  setDoc,
  onSnapshot,
  writeBatch,
  Firestore,
  Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { app, auth } from './googleAuth';
import { AssetItem } from '../types';

let firestoreDb: Firestore | null = null;

try {
  firestoreDb = getFirestore(app);
  // If no user is logged in, allow anonymous auth as fallback for team collaboration
  if (!auth.currentUser) {
    signInAnonymously(auth).catch((err) => {
      // Ignore if auth restricted or already logged in
      console.debug('Anonymous auth fallback status:', err.message);
    });
  }
} catch (err) {
  console.warn('Firestore initialization warning:', err);
}

export function initFirebase(_unusedConfig?: any) {
  return { app, db: firestoreDb, auth };
}

export function subscribeToAssets(
  onUpdate: (assets: AssetItem[], fromCache: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!firestoreDb) return null;

  try {
    const colRef = collection(firestoreDb, 'assets_inventory');
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        const items: AssetItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AssetItem;
          items.push({
            ...data,
            id: d.id,
            sapNo: data.sapNo || d.id,
          });
        });
        const fromCache = snapshot.metadata.fromCache;
        onUpdate(items, fromCache);
      },
      (error) => {
        console.warn('Firestore subscription warning:', error);
        if (onError) onError(error);
      }
    );
    return unsub;
  } catch (err) {
    console.error('Failed to subscribe to Firestore:', err);
    return null;
  }
}

export async function saveAssetToFirestore(asset: AssetItem): Promise<boolean> {
  if (!firestoreDb) return false;
  try {
    const docId = String(asset.sapNo || asset.id).trim();
    if (!docId) return false;

    const docRef = doc(firestoreDb, 'assets_inventory', docId);
    await setDoc(docRef, asset, { merge: true });
    return true;
  } catch (err) {
    console.warn('Error saving asset to Firestore:', err);
    return false;
  }
}

export async function batchSaveAssetsToFirestore(assets: AssetItem[]): Promise<number> {
  if (!firestoreDb || assets.length === 0) return 0;
  try {
    const CHUNK_SIZE = 450;
    let savedCount = 0;

    for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
      const chunk = assets.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(firestoreDb);

      chunk.forEach((item) => {
        const docId = String(item.sapNo || item.id).trim();
        if (docId) {
          const docRef = doc(firestoreDb!, 'assets_inventory', docId);
          batch.set(docRef, item, { merge: true });
          savedCount++;
        }
      });

      await batch.commit();
    }

    return savedCount;
  } catch (err) {
    console.warn('Error batch saving to Firestore:', err);
    return 0;
  }
}
