const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed.");
  return data;
}
export const getTreks = (profile, search = "") => {
  const params = new URLSearchParams({ ...profile, search });
  return request(`/treks?${params.toString()}`);
};
export const getReports = () => request("/reports");
export const submitReport = (payload) => request("/reports", { method: "POST", body: JSON.stringify(payload) });
export const registerUser = (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
export const loginUser = (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const getWeather = (lat, lon) => request(`/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`);
