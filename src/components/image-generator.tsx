"use client";

import { useState } from 'react';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/generate-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { RenderriLogo } from './icons';

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();

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
      const result = await generateImage({ prompt });
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
    <div className="container mx-auto flex h-full max-w-4xl flex-col items-center justify-center p-4 py-8 md:p-8">
      <div className="w-full space-y-8">
        <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <RenderriLogo className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Image Generation Studio</h2>
            <p className="mt-2 text-muted-foreground">Describe the image you want to create in the box below.</p>
        </div>
        
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="grid gap-4">
              <Textarea
                placeholder="e.g., A futuristic city skyline at sunset, with flying cars and neon lights, in a photorealistic style."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none p-4"
                disabled={loading}
              />
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
          </CardContent>
        </Card>

        <div className="w-full">
          {loading && (
             <div className="aspect-square w-full">
                <Skeleton className="h-full w-full rounded-lg" />
             </div>
          )}
          {error && !loading && (
            <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-destructive/50 bg-destructive/10 text-destructive">
                <ImageIcon className="h-16 w-16" />
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
          {!loading && !error && !imageUrl && (
            <div className="flex aspect-square w-full flex-col items-center justify-center rounded-lg border-2 border-dashed bg-card">
              <ImageIcon className="h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Your generated image will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
