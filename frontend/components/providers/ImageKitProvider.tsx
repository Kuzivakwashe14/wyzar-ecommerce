// components/providers/ImageKitProvider.tsx
// ImageKit context provider for React components

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ImageKitProvider as IKProvider } from '@imagekit/react';
import { fetchImageKitConfig } from '@/lib/imagekit';

interface ImageKitContextType {
  isConfigured: boolean;
  urlEndpoint: string;
  publicKey: string;
}

const ImageKitConfigContext = createContext<ImageKitContextType>({
  isConfigured: false,
  urlEndpoint: '',
  publicKey: '',
});

export function useImageKitConfig() {
  return useContext(ImageKitConfigContext);
}

export function ImageKitProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ImageKitContextType>({
    isConfigured: false,
    urlEndpoint: '',
    publicKey: '',
  });

  useEffect(() => {
    // Fetch ImageKit configuration on mount
    fetchImageKitConfig()
      .then((data) => {
        setConfig({
          isConfigured: true,
          urlEndpoint: data.urlEndpoint,
          publicKey: data.publicKey,
        });
      })
      .catch((error) => {
        console.error('Failed to initialize ImageKit:', error);
      });
  }, []);

  if (!config.isConfigured) {
    // Return children without ImageKit context if not configured
    return <>{children}</>;
  }

  return (
    <ImageKitConfigContext.Provider value={config}>
      <IKProvider
        urlEndpoint={config.urlEndpoint}
      >
        {children}
      </IKProvider>
    </ImageKitConfigContext.Provider>
  );
}
