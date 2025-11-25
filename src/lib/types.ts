export type FileData = {
  id: string;
  name: string;
  size: number; // in bytes
  uploadedAt: Date;
  // In a real app, this would be a URL to the file in cloud storage
  // For this demo, it will be unused.
  url: string;
};
