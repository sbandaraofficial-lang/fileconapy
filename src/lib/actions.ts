'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { FileData } from './types';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// --- Firebase Admin SDK Initialization ---
// This block ensures the Admin SDK is initialized only once.
let app: App;
if (!getApps().length) {
  // In a real production environment, you would use a more secure way to handle credentials,
  // such as environment variables or a secret manager. For this demo, we use a static user ID.
  app = initializeApp();
} else {
  app = getApps()[0];
}

const firestore = getFirestore(app);
const storage = getStorage(app).bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);

// For this demo app, we'll use a static user ID for all server operations.
// In a real multi-user app, you would get this from a server-side session.
const userId = "default-user";

const ITEMS_PER_PAGE = 10;

export async function getFiles({ page = 1 }: { page: number }) {
  const filesCollection = firestore.collection(`users/${userId}/files`);
  const q = filesCollection.orderBy('uploadedAt', 'desc');

  const snapshot = await q.get();
  
  const files: FileData[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      size: data.size,
      // Firestore Timestamps need to be converted to Dates
      uploadedAt: data.uploadedAt.toDate(), 
      url: data.storageUrl,
    };
  });

  const totalFiles = files.length;
  
  const paginatedFiles = files.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return {
    files: paginatedFiles,
    totalPages: Math.ceil(totalFiles / ITEMS_PER_PAGE),
  };
}

const fileSchema = z.object({
  file: z
    .any()
    .refine((file) => file instanceof File && file.size > 0, { message: 'File is required.' })
    .refine((file) => file.size <= 50 * 1024 * 1024, { message: 'File size must be less than 50MB.' }),
});


export async function uploadFile(prevState: any, formData: FormData) {
  const validatedFields = fileSchema.safeParse({
    file: formData.get('file'),
  });

  if (!validatedFields.success) {
    return {
      message: validatedFields.error.flatten().fieldErrors.file?.[0] ?? 'Invalid file.',
      success: false,
    };
  }

  const { file } = validatedFields.data;

  try {
    const filePath = `users/${userId}/${Date.now()}-${file.name}`;
    const fileRef = storage.file(filePath);

    // Buffer the file in memory. For large files, consider streams.
    const fileBuffer = await file.arrayBuffer();
    
    await fileRef.save(Buffer.from(fileBuffer), {
      metadata: { contentType: file.type },
    });
    
    // The Admin SDK's getDownloadURL is different. We make the file public and construct the URL.
    await fileRef.makePublic();
    const downloadURL = fileRef.publicUrl();

    const newFile = {
      userId,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      storageUrl: downloadURL,
      storagePath: filePath, // Store the path for future deletions
    };

    await firestore.collection(`users/${userId}/files`).add(newFile);

    revalidatePath('/');
    return { message: `Successfully uploaded "${file.name}"`, success: true };
  } catch (error: any) {
    console.error("Upload failed:", error);
    return { message: error.message || 'Failed to upload file.', success: false };
  }
}

export async function deleteFile(fileId: string) {
  const fileDocRef = firestore.doc(`users/${userId}/files/${fileId}`);

  try {
    const fileDoc = await fileDocRef.get();
    if (!fileDoc.exists) {
      return { success: false, message: 'File not found.' };
    }
    
    const fileData = fileDoc.data();
    if (fileData && fileData.storagePath) {
      const storagePath = fileData.storagePath;
      const fileRef = storage.file(storagePath);
      await fileRef.delete();
    }
    
    await fileDocRef.delete();

    revalidatePath('/');
    return { success: true, message: `File has been deleted.` };
  } catch (error: any) {
    console.error("Deletion failed:", error);
    return { success: false, message: 'Failed to delete file.' };
  }
}
