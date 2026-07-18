import axios from 'axios';

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:5000/api`;
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const adminKey = localStorage.getItem('adminKey');
  if (adminKey) config.headers['x-admin-key'] = adminKey;

  return config;
});

export const getProxyUrl = (url) => {
  if (!url) return '';
  if (url.includes('erome.com')) {
    const proxyBase = API_BASE_URL.replace('/api', '/api/media/stream');
    return `${proxyBase}?url=${encodeURIComponent(url)}`;
  }
  return url;
};

// Derives the thumbnail image from an Erome video URL
// e.g. https://v104.erome.com/8325/abc/XYZ_720p.mp4 → https://s104.erome.com/8325/abc/XYZ.jpg
export const getVideoThumbnail = (videoUrl) => {
  if (!videoUrl) return '';
  try {
    // swap video CDN (v{N}) to image CDN (s{N})
    let thumbUrl = videoUrl.replace(/\/\/v(\d+)\.erome\.com/, '//s$1.erome.com');
    // remove quality suffix and extension → add .jpg
    thumbUrl = thumbUrl.replace(/_\d+p\.mp4$/i, '.jpg').replace(/\.mp4$/i, '.jpg');
    return getProxyUrl(thumbUrl);
  } catch {
    return '';
  }
};

export default api;
