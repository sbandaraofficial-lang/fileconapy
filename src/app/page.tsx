import { getFiles } from '@/lib/actions';
import FileList from '@/components/file-list';
import FileUploadButton from '@/components/file-upload-button';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic'; // Ensure page is re-rendered on data changes

async function Files({ currentPage }: { currentPage: number }) {
  const { files, totalPages } = await getFiles({ page: currentPage });
  return <FileList files={files} currentPage={currentPage} totalPages={totalPages} />;
}

export default async function Home({ searchParams }: { searchParams?: { page?: string } }) {
  const currentPage = Number(searchParams?.page) || 1;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <h1 className="text-2xl sm:text-3xl font-bold font-headline text-primary">
                FileHaven
              </h1>
              <FileUploadButton />
            </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <Files currentPage={currentPage} />
        </Suspense>
      </main>
    </div>
  );
}
