// components/ui/OptimizedImage.tsx
// Optimized image component using ImageKit

'use client';

import React from 'react';
import { Image as IKImage } from '@imagekit/react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  transformation?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    blur?: number;
    rotation?: number;
    crop?: string;
    focus?: string;
  };
  onClick?: () => void;
}

/**
 * Optimized Image component that uses ImageKit for images
 * Falls back to Next.js Image for non-ImageKit images
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 80,
  className = '',
  priority = false,
  loading = 'lazy',
  onClick,
}: OptimizedImageProps) {
  // Check if it's an ImageKit URL
  const isImageKitUrl = src?.includes('ik.imagekit.io');

  if (!src) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400">No image</span>
      </div>
    );
  }

  // Use ImageKit component for ImageKit URLs
  if (isImageKitUrl) {
    // For ImageKit images, use IKImage with src prop
    return (
      <IKImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        className={className}
        onClick={onClick}
        lqip={{ active: true }}
      />
    );
  }

  // Fallback to Next.js Image for non-ImageKit URLs (like local uploads)
  return (
    <Image
      src={src.startsWith('/') ? src : `/${src}`}
      alt={alt}
      width={width || 800}
      height={height || 600}
      quality={quality}
      className={className}
      priority={priority}
      loading={loading}
      onClick={onClick}
    />
  );
}

/**
 * Product Image component with default optimizations for product listings
 */
export function ProductImage({
  src,
  alt,
  className = '',
  size = 'medium',
  onClick,
}: {
  src: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}) {
  const sizes = {
    small: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    large: { width: 800, height: 800 },
  };

  const { width, height } = sizes[size];

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      quality={85}
      className={className}
      transformation={{
        format: 'auto',
        crop: 'at_max',
      }}
      onClick={onClick}
    />
  );
}

/**
 * Avatar Image component with circle crop
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={90}
      className={`rounded-full ${className}`}
      transformation={{
        format: 'auto',
        crop: 'at_max',
      }}
    />
  );
}
