import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const app = getApps().length
  ? getApp()
  : initializeApp();


function getSdks(app: FirebaseApp) {
  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
    storage: getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  };
}

export function initializeFirebase() {
    return getSdks(app);
}
