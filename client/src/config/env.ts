const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const websocketUrl = import.meta.env.VITE_WS_URL ?? 'ws://localhost:1234'

export const env = {
  apiBaseUrl,
  websocketUrl
}