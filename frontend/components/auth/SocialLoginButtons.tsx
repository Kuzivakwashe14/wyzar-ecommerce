"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { socialLogin } from '@/lib/auth-client';
import { Chrome } from 'lucide-react';

interface SocialLoginButtonsProps {
  mode?: 'login' | 'signup';
}

export default function SocialLoginButtons({ mode = 'login' }: SocialLoginButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google') => {
    setIsLoading(provider);
    try {
      // Social login redirects to provider, so we don't wait for response
      socialLogin.google();
      // Don't clear loading state - user is being redirected
    } catch (error) {
      console.error(`${provider} login failed:`, error);
      const message = error instanceof Error ? error.message : 'Please try again later.';
      toast.error('Google Login Failed', {
        description: message,
      });
      setIsLoading(null);
    }
  };

  const actionText = mode === 'login' ? 'Sign in with' : 'Sign up with';

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => handleSocialLogin('google')}
        disabled={!!isLoading}
      >
        {isLoading === 'google' ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Chrome className="h-4 w-4 text-red-500" />
        )}
        <span>{actionText} Google</span>
      </Button>
    </div>
  );
}
