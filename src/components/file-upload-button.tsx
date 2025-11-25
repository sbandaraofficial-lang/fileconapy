"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { FileUploadForm } from './file-upload-form';

export default function FileUploadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload a new file</DialogTitle>
          <DialogDescription>
            Select a file from your device. Max file size is 50MB.
          </DialogDescription>
        </DialogHeader>
        <FileUploadForm onUploadSuccess={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
