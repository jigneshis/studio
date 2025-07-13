"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { RenderriLogo } from '@/components/icons';

const VALID_INVITE_CODE = 'RENDERRI_INVITE';

export default function InvitePage() {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (localStorage.getItem('hasInvite') === 'true') {
      router.push('/login');
    }
  }, [router]);

  const handleContinue = () => {
    setIsLoading(true);
    if (inviteCode === VALID_INVITE_CODE) {
      localStorage.setItem('hasInvite', 'true');
      toast({
        title: 'Success!',
        description: "You're in! Let's get you signed in.",
      });
      router.push('/login');
    } else {
      toast({
        title: 'Invalid Invite Code',
        description: 'Please check your invite code and try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <RenderriLogo className="h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-2xl">Welcome to Renderri</CardTitle>
          <CardDescription>Enter your invite code to get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="••••••••••••"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleContinue()}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleContinue} disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
