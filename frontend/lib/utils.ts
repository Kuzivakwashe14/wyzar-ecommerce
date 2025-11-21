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
  // Remove leading slash if present to avoid double slashes
  const finalPath = cleanPath.startsWith("/") ? cleanPath.slice(1) : cleanPath;

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  return `${baseUrl}/${finalPath}`;
}
