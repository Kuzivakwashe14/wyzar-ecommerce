// frontend/components/CsrfInitializer.tsx
'use client';

import { useEffect } from 'react';
import { fetchCsrfToken } from '@/lib/csrf';

/**
 * Component to initialize CSRF token on app load
 * This is a client component that runs once when the app starts
 */
export default function CsrfInitializer() {
  useEffect(() => {
    // Fetch CSRF token on app initialization
    fetchCsrfToken()
      .then(() => {
        console.log('CSRF token initialized');
      })
      .catch((error) => {
        console.error('Failed to initialize CSRF token:', error);
      });
  }, []);

  // This component doesn't render anything
  return null;
}
