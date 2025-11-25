import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { File as FileIcon, FileArchive, FileAudio, FileImage, FileText, FileVideo } from "lucide-react";
import type { FileData } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { FileActions } from "./file-actions";
import PaginationControls from "./pagination-controls";
import React from "react";

function getFileIcon(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return <FileIcon className="h-5 w-5" />;

  const iconProps = { className: "h-5 w-5" };

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return <FileImage {...iconProps} />;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) return <FileVideo {...iconProps} />;
  if (['mp3', 'wav', 'ogg'].includes(extension)) return <FileAudio {...iconProps} />;
  if (['zip', 'rar', '7z', 'tar'].includes(extension)) return <FileArchive {...iconProps} />;
  if (['txt', 'md', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) return <FileText {...iconProps} />;
  
  return <FileIcon {...iconProps} />;
}


export default function FileList({ files, currentPage, totalPages }: { files: FileData[], currentPage: number, totalPages: number }) {
  if (files.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-24">
        <div className="text-center text-muted-foreground">
          <FileIcon className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No files yet</h3>
          <p className="mt-1 text-sm">Upload your first file to get started.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Files</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] hidden sm:table-cell">Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell w-[250px]">Date Uploaded</TableHead>
                <TableHead className="hidden sm:table-cell w-[150px]">Size</TableHead>
                <TableHead className="w-[80px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{getFileIcon(file.name)}</TableCell>
                  <TableCell className="font-medium truncate max-w-xs">{file.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">{format(file.uploadedAt, "PPp")}</TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{formatBytes(file.size)}</TableCell>
                  <TableCell className="text-right">
                    <FileActions file={file} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
           <PaginationControls currentPage={currentPage} totalPages={totalPages} />
        )}
      </CardContent>
    </Card>
  );
}
