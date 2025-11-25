import { initializeApp, getApp, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

if (!getApps().length) {
  app = initializeApp();
} else {
  app = getApp();
}

const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

export function initializeFirebase() {
  return { app, auth, firestore, storage };
}
