import { API_BASE_URL } from "../../config.js"

export function apiBaseUrl() {
  if (API_BASE_URL && API_BASE_URL.trim()) return API_BASE_URL.replace(/\/+$/, "")
  return location.origin
}

