"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/generate-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { RenderriLogo } from './icons';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setImageUrl(null); 
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter a prompt to generate an image.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const result = await generateImage({ prompt, photoDataUri: uploadedImage || undefined });
      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
      } else {
        throw new Error('Image could not be generated.');
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      setError(errorMessage);
      toast({
        title: 'Generation Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4 md:p-8">
        <div className="mx-auto grid max-w-4xl items-start gap-8 lg:grid-cols-2">
          
          <div className="flex flex-col gap-8 sticky top-24">
            <div className="flex flex-col items-start gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Enhance, Edit, Update, Generate Images</h1>
                <p className="text-muted-foreground">Describe the image you want to create, or upload one to start.</p>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  <Textarea
                    placeholder={uploadedImage ? "e.g., Change the background to a sunny beach." : "e.g., A futuristic city skyline at sunset..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none p-4"
                    disabled={loading}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="outline" disabled={loading}>
                        <Upload className="mr-2" /> Upload Image
                    </Button>
                    <Button onClick={handleGenerateImage} disabled={loading} size="lg">
                        {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating...
                        </>
                        ) : (
                        'Generate Image'
                        )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="w-full flex flex-col gap-4">
              {loading && (
                <div className="aspect-square w-full">
                    <Skeleton className="h-full w-full rounded-lg" />
                </div>
              )}
              {error && !loading && (
                <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive">
                    <RenderriLogo className="h-16 w-16 text-destructive" />
                    <p className="mt-4 text-center font-semibold">{error}</p>
                </div>
              )}
              {!loading && !error && imageUrl && (
                <Card className="overflow-hidden">
                    <div className="aspect-square relative w-full">
                        <Image
                            src={imageUrl}
                            alt={prompt}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority
                        />
                    </div>
                </Card>
              )}
              {!loading && !error && !imageUrl && uploadedImage && (
                <Card className="overflow-hidden group relative">
                    <div className="aspect-square relative w-full">
                        <Image
                            src={uploadedImage}
                            alt="Uploaded preview"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setUploadedImage(null)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </Card>
              )}
              {!loading && !error && !imageUrl && !uploadedImage && (
                <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card">
                  <RenderriLogo className="h-16 w-16 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">Your generated image will appear here</p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
