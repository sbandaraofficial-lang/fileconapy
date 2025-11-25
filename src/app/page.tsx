'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { 
  Upload, 
  File as FileIcon, 
  Trash2, 
  Download, 
  Loader2, 
  FileText,
  FileArchive,
  FileAudio,
  FileImage,
  FileVideo,
  FolderKanban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { firebaseConfig } from '@/firebase/config';


// --- Firebase Initialization ---
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// --- Helper Functions & Components ---

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};


const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return <FileIcon className="h-5 w-5" />;

  const iconProps = { className: "h-5 w-5 text-muted-foreground" };

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return <FileImage {...iconProps} />;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) return <FileVideo {...iconProps} />;
  if (['mp3', 'wav', 'ogg'].includes(extension)) return <FileAudio {...iconProps} />;
  if (['zip', 'rar', '7z', 'tar'].includes(extension)) return <FileArchive {...iconProps} />;
  if (['txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return <FileText {...iconProps} />;
  
  return <FileIcon {...iconProps} />;
};


// --- Main App Component ---

interface FileData {
  id: string;
  name: string;
  size: number;
  storagePath: string;
  url: string;
  uploadedAt: Timestamp;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 1. Authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth error:", err);
        toast({ title: 'Authentication Error', description: 'Failed to sign in anonymously.', variant: 'destructive' });
      } finally {
        setLoadingAuth(false);
      }
    };
    
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if(!currentUser) {
        setLoadingAuth(true);
        initAuth();
      } else {
        setLoadingAuth(false);
      }
    });
    
    return () => unsubscribe();
  }, [toast]);

  // 2. Data Fetching (Files)
  useEffect(() => {
    if (!user) {
      setFiles([]);
      return;
    }

    const filesQuery = query(collection(db, 'users', user.uid, 'files'), orderBy('uploadedAt', 'desc'));

    const unsubscribe = onSnapshot(filesQuery, 
      (snapshot) => {
        const fileList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FileData));
        setFiles(fileList);
      },
      (err) => {
        console.error("Snapshot error:", err);
        toast({ title: 'Error Loading Files', description: 'Could not retrieve file list from the database.', variant: 'destructive' });
      }
    );

    return () => unsubscribe();
  }, [user, toast]);

  // 3. Handlers
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({ title: 'File Too Large', description: 'File size cannot exceed 50MB.', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);

    const filePath = `users/${user.uid}/${Date.now()}-${file.name}`;
    const fileStorageRef = storageRef(storage, filePath);

    try {
      // Upload to Storage
      const uploadResult = await uploadBytes(fileStorageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // Add metadata to Firestore
      await addDoc(collection(db, 'users', user.uid, 'files'), {
        name: file.name,
        size: file.size,
        storagePath: filePath,
        url: downloadURL,
        uploadedAt: serverTimestamp()
      });
      
      toast({ title: 'Success', description: `"${file.name}" uploaded successfully.` });
    } catch (err: any) {
      console.error("Upload error:", err);
      toast({ title: 'Upload Failed', description: err.message || 'Could not upload the file.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (file: FileData) => {
    if (!user) return;
    try {
      // Delete from Storage
      const fileStorageRef = storageRef(storage, file.storagePath);
      await deleteObject(fileStorageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'files', file.id));

      toast({ title: 'File Deleted', description: `"${file.name}" has been removed.` });
    } catch (err: any) {
      console.error("Delete error:", err);
      toast({ title: 'Deletion Failed', description: err.message || 'Could not delete the file.', variant: 'destructive' });
    }
  };
  
  const handleDownload = (file: FileData) => {
      window.open(file.url, '_blank');
  };

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        <span className="font-medium">Initializing FileHaven...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <FolderKanban className="h-7 w-7 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold font-headline text-primary">
                  FileHaven
                </h1>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                className="hidden" 
              />
              <Button onClick={handleUploadClick} disabled={uploading} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload File</span>
                  </>
                )}
              </Button>
            </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card>
          <CardContent className="pt-6">
            {files.length === 0 && !uploading ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileIcon />
                <h3 className="mt-4 text-lg font-semibold text-foreground">No files yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">Upload your first file to get started.</p>
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] hidden sm:table-cell">Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell w-[250px]">Date Uploaded</TableHead>
                      <TableHead className="hidden sm:table-cell w-[150px]">Size</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="hidden sm:table-cell">{getFileIcon(file.name)}</TableCell>
                        <TableCell className="font-medium truncate max-w-xs">{file.name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                           {file.uploadedAt ? format(file.uploadedAt.toDate(), "PPp") : 'Just now'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{formatBytes(file.size)}</TableCell>
                        <TableCell className="text-right space-x-1">
                           <Button variant="ghost" size="icon" onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4" />
                           </Button>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(file)}>
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
