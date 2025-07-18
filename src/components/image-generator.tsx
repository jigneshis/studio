"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { generateImage } from '@/ai/flows/generate-image';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, ArrowDown, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import { RenderriLogo } from './icons';
import { uploadImage } from '@/services/storage';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface Message {
  id: string;
  type: 'prompt' | 'generated' | 'uploaded' | 'loading' | 'error';
  content: string;
  imageUrl?: string;
  user?: {
    name: string | null;
    avatar: string | null;
  };
}

const getInitialMessage = (): Message[] => {
    return [
        {
            id: 'initial-1',
            type: 'generated',
            content: "Welcome to Renderri! Describe the image you want to create, or upload one to start.",
            imageUrl: "https://placehold.co/1024x768.png",
        }
    ]
}

export default function ImageGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(getInitialMessage());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.email) {
      setLoading(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const dataUri = reader.result as string;
          const publicUrl = await uploadImage(dataUri, 'chat-attachments', user.email!);
          
          setMessages(prev => [
            ...prev,
            {
              id: `uploaded-${Date.now()}`,
              type: 'uploaded',
              content: `Uploaded image to use as reference.`,
              imageUrl: publicUrl,
              user: {
                name: user.displayName || user.email,
                avatar: user.photoURL
              }
            }
          ]);

        } catch (e: any) {
          const errorMessage = e.message || 'Failed to upload image.';
          setMessages(prev => [...prev, { id: `error-${Date.now()}`, type: 'error', content: errorMessage }]);
          toast({
            title: 'Upload Error',
            description: errorMessage,
            variant: 'destructive',
          });
        } finally {
            setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } else if (!user) {
        toast({
            title: 'Authentication Error',
            description: 'You must be logged in to upload an image.',
            variant: 'destructive',
        });
    }
  };

  const getLastUploadedImageUrl = (): string | undefined => {
      for(let i = messages.length -1; i >= 0; i--){
          if(messages[i].type === 'uploaded' && messages[i].imageUrl){
              return messages[i].imageUrl
          }
      }
      return undefined;
  }

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt is empty',
        description: 'Please enter a prompt to generate an image.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user || !user.email) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to generate images.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const newPromptMessage: Message = {
      id: `prompt-${Date.now()}`,
      type: 'prompt',
      content: prompt,
      user: {
        name: user.displayName || user.email,
        avatar: user.photoURL
      }
    };
    setMessages(prev => [...prev, newPromptMessage]);
    setPrompt('');

    const uploadedImageUrl = getLastUploadedImageUrl();

    try {
      const result = await generateImage({ 
        prompt: newPromptMessage.content, 
        photoUrl: uploadedImageUrl, 
        userId: user.uid,
        userEmail: user.email
      });

      if (result.imageUrl) {
        setMessages(prev => [...prev, { 
            id: `generated-${Date.now()}`, 
            type: 'generated', 
            content: newPromptMessage.content,
            imageUrl: result.imageUrl
        }]);
      } else {
        throw new Error('Image could not be generated.');
      }
    } catch (e: any) {
      const errorMessage = e.message || 'An unexpected error occurred.';
      setMessages(prev => [...prev, { id: `error-${Date.now()}`, type: 'error', content: errorMessage }]);
      toast({
        title: 'Generation Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if(!loading) {
            handleGenerateImage();
        }
    }
  }


  return (
    <div className="flex h-full flex-col">
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-8">
            {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-4">
                   {msg.type === 'prompt' ? (
                       <Avatar>
                           <AvatarImage src={msg.user?.avatar ?? ''} />
                           <AvatarFallback>{msg.user?.name?.charAt(0) ?? 'U'}</AvatarFallback>
                       </Avatar>
                   ) : (
                       <Avatar>
                           <AvatarImage asChild src="https://qovhpsmldsalfnlcalnv.supabase.co/storage/v1/object/public/main//Logo.png">
                            <RenderriLogo />
                           </AvatarImage>
                       </Avatar>
                   )}
                   <div className="flex-1 space-y-2">
                        <div className="font-semibold">
                            {msg.type === 'prompt' ? msg.user?.name : 'Renderri'}
                        </div>
                       
                        {msg.type === 'prompt' && <p className="text-foreground/80">{msg.content}</p>}

                        {(msg.type === 'generated' || msg.type === 'uploaded') && msg.imageUrl && (
                            <Card className="overflow-hidden max-w-lg">
                                <Image
                                    src={msg.imageUrl}
                                    alt={msg.content}
                                    width={1024}
                                    height={1024}
                                    className="object-contain w-full h-auto"
                                    priority={msg.type === 'generated'}
                                />
                            </Card>
                        )}
                         {msg.type === 'error' && (
                            <div className="text-destructive font-medium">{msg.content}</div>
                         )}
                   </div>
                </div>
            ))}
            {loading && (
                <div className="flex items-start gap-4">
                    <Avatar>
                         <AvatarImage asChild src="https://qovhpsmldsalfnlcalnv.supabase.co/storage/v1/object/public/main//Logo.png">
                            <RenderriLogo />
                         </AvatarImage>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <div className="font-semibold">Renderri</div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin"/>
                            Generating...
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
      
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-2">
              <div className="relative">
                <Textarea
                  placeholder="e.g., A futuristic city skyline at sunset..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[60px] resize-none border-none p-4 pr-28 shadow-none focus-visible:ring-0"
                  disabled={loading}
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} variant="ghost" size="icon" disabled={loading} aria-label="Upload Image">
                        <Upload className="h-5 w-5" />
                    </Button>
                    <Button onClick={handleGenerateImage} disabled={loading || !prompt.trim()} size="icon" aria-label="Generate Image">
                        <ArrowDown className="h-5 w-5" />
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Renderri can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
}
