const frontendUrlFromVite = import.meta.env.VITE_FRONTEND_URL as string | undefined
const backendUrlFromVite = import.meta.env.VITE_BACKEND_URL as string | undefined

// No browser: usa o mesmo host da página na porta 3333 (funciona no celular na mesma rede)
function defaultBackendUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3333`
  }
  return "http://localhost:3333"
}

export const env = {
  FRONTEND_URL: frontendUrlFromVite ?? (typeof window !== "undefined" ? window.location.origin : ""),
  BACKEND_URL: backendUrlFromVite ?? defaultBackendUrl(),
}
