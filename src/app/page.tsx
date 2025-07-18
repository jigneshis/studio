
// src/app/page.tsx
"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { generateImage } from '@/ai/flows/generate-image';
import { uploadImage as uploadImageToSupabase } from '@/services/storage';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, LogOut, Moon, Sun, Library, Lock, Upload } from 'lucide-react';
import { RenderriLogo } from '@/components/icons';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) {
      return;
    }

    setIsUploading(true);
    setUploadedImageUrl(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const publicUrl = await uploadImageToSupabase(base64String, 'chat-attachments', user.email!);
        setUploadedImageUrl(publicUrl);
        setGeneratedImage(null);
        toast({ title: "Image Uploaded", description: "Your image is ready to be used as a reference." });
      };
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ title: "Upload Failed", description: "Could not upload your image. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerate = async () => {
      if (!prompt.trim()) {
          toast({ title: "Prompt is empty", description: "Please enter a prompt.", variant: "destructive" });
          return;
      }
      if (!user?.email) {
          toast({ title: "Not logged in", description: "You need to be logged in to generate images.", variant: "destructive" });
          return;
      }
      setIsGenerating(true);
      setGeneratedImage(null);
      try {
          const result = await generateImage({
              prompt: prompt,
              photoUrl: uploadedImageUrl ?? undefined,
              userId: user.uid,
              userEmail: user.email,
          });
          setGeneratedImage(result.imageUrl);
          setUploadedImageUrl(null);
      } catch (error) {
          console.error(error);
          toast({ title: "Generation Failed", description: "Could not generate image. Please try again.", variant: "destructive" });
      } finally {
          setIsGenerating(false);
      }
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const isLoading = isGenerating || isUploading;

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
        <div className="flex items-center gap-2">
          <RenderriLogo className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Renderri</h1>
        </div>
        <div className="flex items-center gap-4">
           <Button variant="outline" size="sm" onClick={() => setIsUsageDialogOpen(true)}>
              Unlimited Credits!
            </Button>
           <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                  <AvatarFallback>{user.displayName?.charAt(0) ?? user.email?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/library">
                  <Library className="mr-2 h-4 w-4" />
                  <span>Library</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto">
        <div className="grid h-full grid-cols-1 md:grid-cols-3">
          {/* Left Panel: Controls */}
          <div className="md:col-span-1 flex flex-col gap-6 p-6 overflow-y-auto border-r border-border">
            <div className="space-y-2">
                <h2 className="text-lg font-semibold">Create an image from text prompt</h2>
                <Textarea 
                    placeholder="Describe what you'd like to generate"
                    className="min-h-[100px] bg-card"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <div className="flex flex-col gap-2">
                <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Submit
                </Button>
                 <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                    Upload Image
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={isLoading}
                />
            </div>


            <div className="space-y-3">
                <h3 className="font-semibold">Choose a model</h3>
                <Tabs defaultValue="hd" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="standard" disabled={isLoading}>Standard</TabsTrigger>
                        <TabsTrigger value="hd" disabled={isLoading}>HD</TabsTrigger>
                        <TabsTrigger value="genius" disabled className="flex items-center gap-2">Genius <Lock className="w-3 h-3"/></TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            <div className="space-y-3">
                <h3 className="font-semibold">Preference</h3>
                <Tabs defaultValue="speed" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="speed" disabled={isLoading}>Speed</TabsTrigger>
                        <TabsTrigger value="quality" disabled={isLoading}>Quality</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
          </div>

          {/* Right Panel: Image Display */}
          <div className="md:col-span-2 flex items-center justify-center p-6 bg-muted/20">
            <Card className="w-full max-w-2xl aspect-square bg-card overflow-hidden">
                {(isGenerating || isUploading) && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-muted-foreground">
                        <Loader2 className="w-12 h-12 animate-spin text-primary" />
                        <p>{isGenerating ? 'Generating your masterpiece...' : 'Uploading your image...'}</p>
                    </div>
                )}
                {!isLoading && generatedImage && (
                    <Image src={generatedImage} alt="Generated image" width={1024} height={1024} className="w-full h-full object-contain"/>
                )}
                {!isLoading && uploadedImageUrl && !generatedImage && (
                    <Image src={uploadedImageUrl} alt="Uploaded image" width={1024} height={1024} className="w-full h-full object-contain"/>
                )}
                 {!isLoading && !generatedImage && !uploadedImageUrl && (
                    <div className="w-full h-full flex items-center justify-center">
                       <RenderriLogo className="h-32 w-32 text-muted-foreground opacity-20"/>
                    </div>
                )}
            </Card>
          </div>
        </div>
      </main>

      <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Account Usage</DialogTitle>
            <DialogDescription>
              Here's an overview of your current plan and usage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Remaining Credits</span>
                <Badge variant="secondary">Unlimited</Badge>
              </div>
              <Progress value={100} aria-label="Unlimited credits" />
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Your unlimited access is valid through September 15th.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
