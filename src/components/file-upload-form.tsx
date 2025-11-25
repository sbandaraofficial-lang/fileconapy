'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { uploadFile } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const initialState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-primary hover:bg-primary/90">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? 'Uploading...' : 'Upload'}
    </Button>
  );
}

export function FileUploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [state, formAction] = useFormState(uploadFile, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        onUploadSuccess();
        formRef.current?.reset();
      } else {
        toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast, onUploadSuccess]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 py-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file">File</Label>
        <Input id="file" name="file" type="file" required className="file:text-foreground" />
      </div>
      <SubmitButton />
    </form>
  );
}
