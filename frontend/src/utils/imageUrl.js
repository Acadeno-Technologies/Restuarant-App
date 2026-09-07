/**
 * Resolve image URL to ensure compatibility between local dev and live Render deployment
 */
export const getBackendOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  if (apiUrl) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return '';
};

export const resolveImageUrl = (imagePath, fallback = null) => {
  if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
    return fallback;
  }

  const clean = imagePath.trim();

  // If already absolute or base64 data
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    // Replace local 127.0.0.1:8000 with live backend origin if deployed
    if (clean.includes('127.0.0.1:8000') || clean.includes('localhost:8000')) {
      const backendOrigin = getBackendOrigin();
      if (backendOrigin) {
        return clean.replace(/http:\/\/(127\.0\.0\.1|localhost):8000/, backendOrigin);
      }
    }
    return clean;
  }

  // Relative path to backend media
  const backendOrigin = getBackendOrigin();
  const normalizedPath = clean.startsWith('/') ? clean : `/${clean}`;
  return `${backendOrigin}${normalizedPath}`;
};
