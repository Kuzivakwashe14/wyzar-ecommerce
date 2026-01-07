import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return "/placeholder.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Handle potential backslashes from Windows paths
  const cleanPath = imagePath.replace(/\\/g, "/");

  // Images are served by Express static middleware at /uploads
  // E.g., /uploads/products/image.jpg -> http://localhost:5000/uploads/products/image.jpg
  // Use NEXT_PUBLIC_API_URL (without /api) for static file serving
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  
  // If path already starts with /, just append to base URL
  if (cleanPath.startsWith("/")) {
    return `${baseUrl}${cleanPath}`;
  }
  
  // Otherwise add / before appending
  return `${baseUrl}/${cleanPath}`;
}
