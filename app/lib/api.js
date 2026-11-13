const configuredBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE_URL = configuredBase.replace(/\/$/, "");
export function apiUrl(path) { return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`; }
