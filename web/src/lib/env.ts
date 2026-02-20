const frontendUrlFromVite = import.meta.env.VITE_FRONTEND_URL as string | undefined
const backendUrlFromVite = import.meta.env.VITE_BACKEND_URL as string | undefined

// Quando a página e a API estão na mesma origem (ex.: Docker servindo SPA + API na 3333), usa URL relativa
function defaultBackendUrl(): string {
  if (typeof window !== "undefined") {
    const origin = window.location.origin
    const apiOrigin = `${window.location.protocol}//${window.location.hostname}:3333`
    if (origin === apiOrigin) return "" // mesma origem: chamadas relativas (/links)
    return apiOrigin
  }
  return "http://localhost:3333"
}

export const env = {
  FRONTEND_URL: frontendUrlFromVite ?? (typeof window !== "undefined" ? window.location.origin : ""),
  BACKEND_URL: backendUrlFromVite ?? defaultBackendUrl(),
}
