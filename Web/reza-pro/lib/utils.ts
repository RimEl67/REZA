import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize image path for <img src>.
 * - Absolute Unsplash/CDN: unchanged
 * - /uploads/... : same-origin relative (Next rewrite → backend)
 * - absolute API hosts with /uploads/... : strip to relative for rewrite
 * Avoids http://localhost:5000 which CSP img-src blocks (https: + 'self' only).
 */
export function getImageUrl(imagePath: string | null | undefined): string {
  if (!imagePath) return '';

  const imagePathStr = String(imagePath);

  const uploadOnHost = imagePathStr.match(
    /^https?:\/\/(?:localhost:5000|127\.0\.0\.1:5000|api\.wellbe\.ma)(\/uploads\/.+)$/i
  );
  if (uploadOnHost) {
    return uploadOnHost[1];
  }

  if (imagePathStr.startsWith('http://') || imagePathStr.startsWith('https://')) {
    return imagePathStr;
  }

  if (imagePathStr.startsWith('/')) {
    return imagePathStr;
  }

  return imagePathStr;
}
