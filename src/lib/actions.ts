'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { FileData } from './types';

// Mock database - a simple array
let files: FileData[] = [
  { id: '1', name: 'product-roadmap.pdf', size: 120485, uploadedAt: new Date('2023-10-26T10:00:00Z'), url: '#' },
  { id: '2', name: 'marketing-campaign.zip', size: 15728640, uploadedAt: new Date('2023-10-25T15:30:00Z'), url: '#' },
  { id: '3', name: 'quarterly-report.docx', size: 85204, uploadedAt: new Date('2023-10-25T11:45:00Z'), url: '#' },
  { id: '4', name: 'website-mockups.fig', size: 24117248, uploadedAt: new Date('2023-10-24T09:12:00Z'), url: '#' },
  { id: '5', name: 'logo-assets.svg', size: 5012, uploadedAt: new Date('2023-10-23T18:05:00Z'), url: '#' },
];

const ITEMS_PER_PAGE = 10;

export async function getFiles({ page = 1 }: { page: number }) {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedFiles = files
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
    .slice(start, end);

  return {
    files: paginatedFiles,
    totalPages: Math.ceil(files.length / ITEMS_PER_PAGE),
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
  
  // In a real app, you'd upload the file to a cloud storage service (e.g., Firebase Storage, S3)
  // and get a URL back. For this demo, we're just adding it to our mock array.
  const newFile: FileData = {
    id: Date.now().toString() + Math.random().toString(36).substring(2),
    name: file.name,
    size: file.size,
    uploadedAt: new Date(),
    url: '#', // Placeholder URL
  };

  files.unshift(newFile); // Add to the beginning of the array

  revalidatePath('/');
  return { message: `Successfully uploaded "${file.name}"`, success: true };
}

export async function deleteFile(fileId: string) {
  const fileToDelete = files.find((file) => file.id === fileId);
  if (!fileToDelete) {
    revalidatePath('/');
    return { success: false, message: 'File not found.' };
  }

  files = files.filter((file) => file.id !== fileId);
  revalidatePath('/');
  return { success: true, message: `"${fileToDelete.name}" has been deleted.` };
}
