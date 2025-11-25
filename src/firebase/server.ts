'use server';

import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

/**
 * Initializes and returns Firebase Admin SDK services.
 * This function ensures that the app is initialized only once per instance.
 */
export async function initializeFirebase() {
  let app: App;
  if (getApps().length === 0) {
    app = initializeApp();
  } else {
    app = getApp();
  }

  const firestore = getFirestore(app);
  const auth = getAuth(app);
  const storage = getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

  return { app, auth, firestore, storage };
}
