/**
 * Build a full URL for a media file (profile image, attachment, etc.)
 * Uses VITE_API_URL so it works on any network, not just localhost.
 */
import { API_BASE_URL } from './axiosConfig';

export function mediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}
