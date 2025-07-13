"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Github, Loader2 } from 'lucide-react';
import { GoogleIcon, RenderriLogo } from '@/components/icons';

export default function LoginPage() {
  const { user, loading, signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('hasInvite') !== 'true') {
        router.push('/invite');
    }
  }, [router]);

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setIsAuthLoading(true);
    try {
      if (action === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsAuthLoading(false);
    }
  };
  
  const handleOAuth = async (provider: 'google' | 'github') => {
    setIsAuthLoading(true);
    try {
      if (provider === 'google') {
          await signInWithGoogle();
      } else {
          await signInWithGitHub();
      }
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Authentication Error',
        description: error.code === 'auth/popup-closed-by-user' ? 'Sign-in process was cancelled.' : error.message,
        variant: 'destructive',
      });
    } finally {
        setIsAuthLoading(false);
    }
  }


  if (loading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
            <RenderriLogo className="h-12 w-12 text-primary mb-2" />
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue to Renderri</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
                <Button variant="outline" onClick={() => handleOAuth('google')} disabled={isAuthLoading}>
                    <GoogleIcon className="mr-2 h-5 w-5" /> Google
                </Button>
                <Button variant="outline" onClick={() => handleOAuth('github')} disabled={isAuthLoading}>
                    <Github className="mr-2 h-5 w-5" /> GitHub
                </Button>
            </div>

            <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="signin">
                    <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signIn'); }}>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-signin">Email</Label>
                                <Input id="email-signin" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isAuthLoading}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-signin">Password</Label>
                                <Input id="password-signin" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isAuthLoading}/>
                            </div>
                            <Button type="submit" className="w-full" disabled={isAuthLoading}>
                                {isAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign In
                            </Button>
                        </div>
                    </form>
                </TabsContent>
                <TabsContent value="signup">
                    <form onSubmit={(e) => { e.preventDefault(); handleAuthAction('signUp'); }}>
                        <div className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="email-signup">Email</Label>
                                <Input id="email-signup" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isAuthLoading}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-signup">Password</Label>
                                <Input id="password-signup" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isAuthLoading}/>
                            </div>
                            <Button type="submit" className="w-full" disabled={isAuthLoading}>
                                {isAuthLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sign Up
                            </Button>
                        </div>
                    </form>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
