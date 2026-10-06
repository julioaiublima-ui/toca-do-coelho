const API_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:5000/api'

export type ApiCharacter = {
  id: number
  name: string
  system: string
  role: string
  level: string
  visibility: 'private' | 'public'
  data: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('toca_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error ?? 'Não foi possível concluir a solicitação.')
  return payload as T
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  register: (email: string, password: string, displayName: string) => request<{ token: string }>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  login: (email: string, password: string) => request<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  characters: () => request<ApiCharacter[]>('/characters'),
  createCharacter: (character: Omit<ApiCharacter, 'id' | 'createdAt' | 'updatedAt' | 'data'> & { data?: Record<string, unknown> }) => request<ApiCharacter>('/characters', { method: 'POST', body: JSON.stringify(character) }),
  updateCharacter: (id: number, character: Partial<ApiCharacter>) => request<ApiCharacter>(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(character) }),
  history: (id: number) => request<{ id: number; event: string; createdAt: string }[]>(`/characters/${id}/history`),
  addHistory: (id: number, event: string) => request<{ id: number; event: string }>(`/characters/${id}/history`, { method: 'POST', body: JSON.stringify({ event }) }),
  campaigns: () => request('/campaigns'),
  createCampaign: (title: string, system: string, description = '') => request('/campaigns', { method: 'POST', body: JSON.stringify({ title, system, description }) }),
}
