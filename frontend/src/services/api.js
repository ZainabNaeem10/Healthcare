import axios from "axios";

const API_URL =
  process.env.REACT_APP_BACKEND_URL ||
  "https://zooming-luck-production.up.railway.app";

const api = axios.create({
  baseURL: API_URL
});

// FIX: read token from user object
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default api;
