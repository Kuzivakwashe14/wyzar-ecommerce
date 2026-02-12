// lib/imagekit.ts
// ImageKit configuration and utilities for frontend

export interface ImageKitConfig {
  urlEndpoint: string;
  publicKey: string;
}

// ImageKit configuration - will be fetched from backend
let imagekitConfig: ImageKitConfig | null = null;

/**
 * Fetch ImageKit configuration from backend
 */
export async function fetchImageKitConfig(): Promise<ImageKitConfig> {
  if (imagekitConfig) {
    return imagekitConfig;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/imagekit/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch ImageKit configuration');
    }
    const config: ImageKitConfig = await response.json();
    imagekitConfig = config;
    return config;
  } catch (error) {
    console.error('Error fetching ImageKit config:', error);
    throw error;
  }
}

/**
 * Get authentication parameters for ImageKit upload
 */
export async function getImageKitAuth(token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/imagekit/auth`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to authenticate with ImageKit');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting ImageKit auth:', error);
    throw error;
  }
}

/**
 * Generate optimized ImageKit URL with transformations
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'jpg' | 'png';
    blur?: number;
    rotation?: number;
    crop?: string;
    focus?: string;
  }
): string {
  if (!imageUrl) return '';
  
  // If it's already an ImageKit URL, we can add transformations
  if (imageUrl.includes('ik.imagekit.io')) {
    const url = new URL(imageUrl);
    const transforms = [];
    
    if (transformations) {
      if (transformations.width) transforms.push(`w-${transformations.width}`);
      if (transformations.height) transforms.push(`h-${transformations.height}`);
      if (transformations.quality) transforms.push(`q-${transformations.quality}`);
      if (transformations.format) transforms.push(`f-${transformations.format}`);
      if (transformations.blur) transforms.push(`bl-${transformations.blur}`);
      if (transformations.rotation) transforms.push(`rt-${transformations.rotation}`);
      if (transformations.crop) transforms.push(`c-${transformations.crop}`);
      if (transformations.focus) transforms.push(`fo-${transformations.focus}`);
    }
    
    if (transforms.length > 0) {
      // Insert transformations in the URL path
      const pathParts = url.pathname.split('/');
      // Find the position to insert transformations (after version identifier if present)
      const insertIndex = pathParts.findIndex(part => part.startsWith('tr:')) > -1
        ? pathParts.findIndex(part => part.startsWith('tr:'))
        : 3; // Default position after domain/version
      
      pathParts.splice(insertIndex, 0, `tr:${transforms.join(',')}`);
      url.pathname = pathParts.join('/');
    }
    
    return url.toString();
  }
  
  // Return as-is if not an ImageKit URL
  return imageUrl;
}

/**
 * Get thumbnail URL
 */
export function getThumbnailUrl(imageUrl: string, size: number = 400): string {
  return getOptimizedImageUrl(imageUrl, {
    width: size,
    height: size,
    quality: 80,
    format: 'auto',
    crop: 'at_max'
  });
}

/**
 * Get responsive image srcset for different screen sizes
 */
export function getResponsiveSrcSet(imageUrl: string): string {
  if (!imageUrl || !imageUrl.includes('ik.imagekit.io')) return imageUrl;
  
  const sizes = [320, 640, 768, 1024, 1280, 1920];
  return sizes
    .map(size => `${getOptimizedImageUrl(imageUrl, { width: size, quality: 80, format: 'auto' })} ${size}w`)
    .join(', ');
}

/**
 * Preload image for better performance
 */
export function preloadImage(imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = imageUrl;
  });
}
