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

  // If path starts with /static/, it's served by Nginx on port 80
  if (cleanPath.startsWith("/static/")) {
    return `http://localhost${cleanPath}`;
  }

  // For other paths, use the API base URL
  const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${baseUrl}/${finalPath}`;
}
