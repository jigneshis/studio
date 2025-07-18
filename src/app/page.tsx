// src/app/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { generateImage } from '@/ai/flows/generate-image';
import { magicEdit } from '@/ai/flows/magic-edit-flow';
import { uploadImage as uploadImageToSupabase } from '@/services/storage';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Loader2, LogOut, Moon, Sun, Library, Upload, Download, Eye, Wand2, Sparkles, Trash2, Brush } from 'lucide-react';
import { RenderriLogo } from '@/components/icons';
import { useTheme } from 'next-themes';
import { useToast } from '@/hooks/use-toast';
import { ImageEditorCanvas, type ImageEditorCanvasRef } from '@/components/image-editor-canvas';
import { Slider } from '@/components/ui/slider';


const creativePrompts = [
  "A majestic lion wearing a crown, sitting on a throne in a futuristic city.",
  "An enchanted forest where the trees have glowing leaves and the rivers flow with liquid starlight.",
  "A steampunk dragon with intricate gears and brass plating, breathing fire made of clockwork.",
  "A serene underwater city inhabited by mermaids, with buildings made of coral and kelp.",
  "A retro-futuristic diner on Mars, with robot waiters and alien customers.",
  "A knight in shining armor riding a giant, fluffy Corgi into battle.",
  "A floating island held up by giant, glowing crystals, with waterfalls cascading into the clouds below.",
  "A cyberpunk alleyway at night, with neon signs reflecting in the puddles on the street.",
];

function ImageVariations({ images, onDownload }: { images: string[]; onDownload: (url: string) => void; }) {
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((img, index) => (
        <Card key={index} className="group relative overflow-hidden">
          <Image src={img} alt={`Generated variation ${index + 1}`} width={512} height={512} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="outline" size="icon" onClick={() => onDownload(img)}>
              <Download className="h-5 w-5" />
              <span className="sr-only">Download</span>
            </Button>
            <Button variant="outline" size="icon" asChild>
              <a href={img} target="_blank" rel="noopener noreferrer">
                <Eye className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}


export default function HomePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('generate');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [numVariations, setNumVariations] = useState(4);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brushRadius, setBrushRadius] = useState(20);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const editorCanvasRef = useRef<ImageEditorCanvasRef>(null);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) {
      return;
    }

    setIsUploading(true);
    setUploadedImageUrl(null);
    setGeneratedImages([]);
    setEditedImageUrl(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const publicUrl = await uploadImageToSupabase(base64String, 'chat-attachments', user.email!);
        setUploadedImageUrl(publicUrl);
        setGeneratedImages([]);
        toast({ title: "Image Uploaded", description: "Your image is ready to be used." });
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
      setGeneratedImages([]);
      setEditedImageUrl(null);

      try {
          const result = await generateImage({
              prompt: prompt,
              negativePrompt: negativePrompt,
              photoUrl: uploadedImageUrl ?? undefined,
              userId: user.uid,
              userEmail: user.email,
              numVariations: numVariations
          });
          setGeneratedImages(result.imageUrls);
          if (uploadedImageUrl) setUploadedImageUrl(null);
      } catch (error) {
          console.error(error);
          toast({ title: "Generation Failed", description: "Could not generate image. Please try again.", variant: "destructive" });
      } finally {
          setIsGenerating(false);
      }
  };

  const handleMagicEdit = async () => {
    if (!prompt.trim()) {
        toast({ title: "Prompt is empty", description: "Please enter what you want to edit.", variant: "destructive" });
        return;
    }
    if (!user?.email || !uploadedImageUrl || !editorCanvasRef.current) {
        toast({ title: "Setup error", description: "User or image not ready for editing.", variant: "destructive" });
        return;
    }

    setIsGenerating(true);
    setEditedImageUrl(null);

    try {
        const maskDataUri = await editorCanvasRef.current.getMaskAsDataURI();
        if (!maskDataUri) {
             toast({ title: "Mask is empty", description: "Please draw on the image to select an area to edit.", variant: "destructive" });
             setIsGenerating(false);
             return;
        }

        const result = await magicEdit({
            prompt: prompt,
            photoDataUri: uploadedImageUrl,
            maskDataUri: maskDataUri,
            userId: user.uid,
            userEmail: user.email,
        });

        setEditedImageUrl(result.imageUrl);
        setUploadedImageUrl(result.imageUrl); // Replace original with edited one for further edits
        editorCanvasRef.current.clear();
    } catch (error) {
        console.error("Magic Edit failed:", error);
        toast({ title: "Magic Edit Failed", description: "Could not edit the image. Please try again.", variant: "destructive" });
    } finally {
        setIsGenerating(false);
    }
};

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `renderri-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = creativePrompts[Math.floor(Math.random() * creativePrompts.length)];
    setPrompt(randomPrompt);
  }


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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="grid h-full grid-cols-1 md:grid-cols-3">
              {/* Left Panel: Controls */}
              <div className="md:col-span-1 flex flex-col gap-6 p-6 overflow-y-auto border-r border-border">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="generate"><Sparkles className="mr-2 h-4 w-4"/>Generate</TabsTrigger>
                    <TabsTrigger value="edit"><Wand2 className="mr-2 h-4 w-4"/>Magic Edit</TabsTrigger>
                    <TabsTrigger value="background" disabled>BG Remove</TabsTrigger>
                </TabsList>
                
                {/* Always visible controls */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold">{activeTab === 'edit' ? 'Describe your edit' : 'Create with a prompt'}</h2>
                        {activeTab === 'generate' && (
                            <Button variant="ghost" size="sm" onClick={handleSurpriseMe} disabled={isLoading}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Surprise Me
                            </Button>
                        )}
                    </div>
                    <Textarea 
                        placeholder={activeTab === 'edit' ? "e.g., 'add sunglasses'" : "Describe what you'd like to generate"}
                        className="min-h-[100px] bg-card"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                {activeTab !== 'edit' && (
                  <div className="space-y-2">
                      <h2 className="text-lg font-semibold">Negative Prompt (what to avoid)</h2>
                      <Textarea 
                          placeholder="e.g., blurry, extra limbs, deformed"
                          className="min-h-[70px] bg-card"
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          disabled={isLoading}
                      />
                  </div>
                )}


                <TabsContent value="generate" className="flex flex-col gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Number of variations</h3>
                       <Select
                          value={String(numVariations)}
                          onValueChange={(value) => setNumVariations(Number(value))}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select number of variations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Variation</SelectItem>
                            <SelectItem value="2">2 Variations</SelectItem>
                            <SelectItem value="3">3 Variations</SelectItem>
                            <SelectItem value="4">4 Variations</SelectItem>
                          </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Generate ({numVariations} {numVariations > 1 ? 'variations' : 'variation'})
                        </Button>
                        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                            Upload Reference Image
                        </Button>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold">Image quality</h3>
                        <Tabs defaultValue="hd" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="standard" disabled={isLoading}>Standard</TabsTrigger>
                                <TabsTrigger value="hd" disabled={isLoading}>HD</TabsTrigger>
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
                </TabsContent>
                <TabsContent value="edit" className="flex flex-col gap-6">
                    {!uploadedImageUrl && (
                        <Card className="h-60 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed">
                             <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
                             <h3 className="font-semibold mb-2">Start with an image</h3>
                             <p className="text-sm text-muted-foreground mb-4">Upload an image to start using Magic Edit.</p>
                             <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                                Upload Image
                            </Button>
                        </Card>
                    )}
                    {uploadedImageUrl && (
                        <>
                           <div className="space-y-3">
                                <h3 className="font-semibold">Brush size</h3>
                                <div className="flex items-center gap-4">
                                  <Brush className="h-5 w-5" />
                                  <Slider
                                    value={[brushRadius]}
                                    onValueChange={(value) => setBrushRadius(value[0])}
                                    max={50}
                                    min={5}
                                    step={1}
                                    disabled={isLoading}
                                  />
                                  <span className="text-sm w-8 text-right">{brushRadius}</span>
                                </div>
                            </div>
                            <Button onClick={() => editorCanvasRef.current?.clear()} variant="outline" disabled={isLoading}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear Mask
                            </Button>
                            <Button onClick={handleMagicEdit} disabled={isLoading || !prompt.trim()}>
                                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Generate Edit
                            </Button>
                        </>
                    )}
                </TabsContent>
                <TabsContent value="background">
                    <Card className="h-96 flex items-center justify-center text-muted-foreground">
                        Background Removal coming soon!
                    </Card>
                </TabsContent>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={isLoading}
                />
              </div>

              {/* Right Panel: Image Display */}
              <div className="md:col-span-2 flex flex-col items-center justify-center p-6 bg-muted/20 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    {isLoading && (
                        <Card className="w-full aspect-square bg-card overflow-hidden flex flex-col items-center justify-center gap-4 text-muted-foreground">
                            <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            <p>{isGenerating ? 'Generating...' : 'Uploading...'}</p>
                        </Card>
                    )}
                    {!isLoading && activeTab === 'generate' && generatedImages.length > 0 && (
                        <ImageVariations images={generatedImages} onDownload={handleDownload} />
                    )}
                    {!isLoading && activeTab === 'generate' && uploadedImageUrl && generatedImages.length === 0 && (
                        <Card className="w-full bg-card overflow-hidden">
                           <Image src={uploadedImageUrl} alt="Uploaded image" width={1024} height={1024} className="w-full h-full object-contain"/>
                        </Card>
                    )}
                    
                    {!isLoading && activeTab === 'edit' && uploadedImageUrl && (
                        <ImageEditorCanvas
                            ref={editorCanvasRef}
                            imageUrl={editedImageUrl || uploadedImageUrl}
                            brushRadius={brushRadius}
                        />
                    )}

                    {!isLoading && generatedImages.length === 0 && !uploadedImageUrl && (
                        <Card className="w-full aspect-square bg-card overflow-hidden flex items-center justify-center">
                           <RenderriLogo className="h-32 w-32 text-muted-foreground opacity-20"/>
                        </Card>
                    )}
                </div>
              </div>
            </div>
        </Tabs>
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
