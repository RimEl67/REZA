/**
 * Utility function to transform image URLs to production URLs
 * Converts localhost URLs or relative paths to production API URLs
 * Ensures images are accessible from all domains (api.wellbe.ma, my.wellbe.ma, etc.)
 */
export function transformImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  // Get the API base URL from environment
  const apiBaseUrl = process.env.BACKEND_URL || process.env.API_URL || 'https://api.wellbe.ma';
  
  // If it's already a full URL with the correct domain, return as is
  if (imageUrl.startsWith('https://api.wellbe.ma') || imageUrl.startsWith('http://api.wellbe.ma')) {
    return imageUrl;
  }

  // If it's a localhost URL, replace it with production URL
  if (imageUrl.includes('localhost:5000') || imageUrl.includes('127.0.0.1:5000')) {
    return imageUrl.replace(/https?:\/\/[^/]+/, apiBaseUrl);
  }

  // If it's a relative path starting with /uploads, make it absolute
  if (imageUrl.startsWith('/uploads/')) {
    return `${apiBaseUrl}${imageUrl}`;
  }

  // If it's already a full URL (but not our domain), return as is
  // This handles external URLs (e.g., CDN, external image hosting)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // For any other relative path, assume it's an upload
  if (imageUrl.startsWith('/')) {
    return `${apiBaseUrl}${imageUrl}`;
  }

  // Return as is if we can't determine the format
  return imageUrl;
}


