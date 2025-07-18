// src/app/library/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { listUserImages } from '@/services/storage';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, ArrowLeft, ImageOff } from 'lucide-react';
import { RenderriLogo } from '@/components/icons';

function ImageGrid({ images, isLoading }: { images: string[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 rounded-lg border-2 border-dashed">
        <ImageOff className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Images Found</h3>
        <p className="mt-1 text-sm text-muted-foreground">It looks like you haven't created any images yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((url) => (
        <Card key={url} className="overflow-hidden group">
          <div className="aspect-square relative w-full">
            <Image
              src={url}
              alt="User image"
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}


export default function LibraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchImages() {
      if (user?.email) {
        setIsLoading(true);
        try {
          const [uploaded, generated] = await Promise.all([
            listUserImages('chat-attachments', user.email),
            listUserImages('generated-files', user.email),
          ]);
          setUploadedImages(uploaded);
          setGeneratedImages(generated);
        } catch (error) {
          console.error("Failed to fetch images:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    if (user) {
      fetchImages();
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div className="flex items-center gap-2">
                <RenderriLogo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold text-foreground">My Library</h1>
            </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="generated" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="generated">Generated Images</TabsTrigger>
            <TabsTrigger value="uploaded">Uploaded Images</TabsTrigger>
          </TabsList>
          <TabsContent value="generated" className="mt-6">
            <ImageGrid images={generatedImages} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="uploaded" className="mt-6">
            <ImageGrid images={uploadedImages} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
