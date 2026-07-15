/**
 * Transform image URLs for API responses.
 * - Absolute external URLs (Unsplash, CDN): unchanged
 * - Relative /uploads/... : kept relative in local/dev so Next rewrites can proxy;
 *   absolutized only when BACKEND_URL or API_URL is set (production)
 */
export function transformImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  const apiBaseUrl = process.env.BACKEND_URL || process.env.API_URL || '';

  // Localhost absolute → relative (clients proxy /uploads via Next rewrite)
  if (imageUrl.includes('localhost:5000') || imageUrl.includes('127.0.0.1:5000')) {
    const path = imageUrl.replace(/^https?:\/\/[^/]+/, '');
    if (apiBaseUrl) {
      return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
    }
    return path;
  }

  // Already our production API host — keep as-is when configured, else strip to relative for proxy
  if (imageUrl.startsWith('https://api.wellbe.ma') || imageUrl.startsWith('http://api.wellbe.ma')) {
    if (apiBaseUrl) {
      return imageUrl.replace(/^https?:\/\/api\.wellbe\.ma/, apiBaseUrl.replace(/\/$/, ''));
    }
    // Dev without BACKEND_URL: relative so localhost frontends can rewrite
    if (process.env.NODE_ENV !== 'production') {
      return imageUrl.replace(/^https?:\/\/api\.wellbe\.ma/, '');
    }
    return imageUrl;
  }

  // Relative upload path
  if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/')) {
    if (apiBaseUrl) {
      return `${apiBaseUrl.replace(/\/$/, '')}${imageUrl}`;
    }
    return imageUrl;
  }

  // External absolute URLs (Unsplash, etc.)
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return imageUrl;
}
