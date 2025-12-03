"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get('error');
    const provider = searchParams.get('provider');

    if (error) {
      toast.error('Authentication Failed', {
        description: `Failed to sign in with ${provider}. Please try again.`,
      });
      router.push('/login');
    } else {
      toast.success('Welcome!', {
        description: 'You have successfully signed in.',
      });
      router.push('/');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-shop_dark_green mx-auto"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
