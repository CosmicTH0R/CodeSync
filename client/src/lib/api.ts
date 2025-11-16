import { env } from '../config/env'

export type SupportedLanguage = 'cpp' | 'javascript' | 'python' | 'java'

export interface RoomProblem {
  id?: string
  title?: string
  difficulty?: string
  description?: string
  constraints?: string[]
  examples?: Array<{
    input: string
    output: string
    explanation: string
  }>
}

export interface RoomMetadata {
  roomId: string
  createdBy: string
  createdAt: string
  problem?: RoomProblem
  defaultLanguage: SupportedLanguage
  starterCode: Record<SupportedLanguage, string>
  defaultTestCases: string
  submissions?: SubmissionEntry[]
}

export interface ExecutionResponse {
  status: 'Waiting' | 'Running...' | 'Accepted' | 'Wrong Answer' | 'Runtime Error'
  language: SupportedLanguage
  input: string
  stdout: string
  stderr: string
  message?: string
  time: number
  memory: number
  submittedAt: string
}

export interface SubmissionEntry {
  id: string
  code: string
  input: string
  stdout: string
  stderr: string
  language: SupportedLanguage
  status: ExecutionResponse['status']
  createdAt: string
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody?.message || 'Unexpected server error'
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export const api = {
  async createRoom(payload?: { problemId?: string; displayName?: string }) {
    const response = await fetch(`${env.apiBaseUrl}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload ?? {})
    })
    return handleResponse<RoomMetadata>(response)
  },

  async getRoom(roomId: string) {
    const response = await fetch(`${env.apiBaseUrl}/rooms/${roomId}`)
    return handleResponse<RoomMetadata>(response)
  },

  async executeCode(payload: { code: string; language: SupportedLanguage; input: string }) {
    const response = await fetch(`${env.apiBaseUrl}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse<ExecutionResponse>(response)
  },

  async getSubmissions(roomId: string) {
    const response = await fetch(`${env.apiBaseUrl}/rooms/${roomId}/submissions`)
    return handleResponse<SubmissionEntry[]>(response)
  },

  async createSubmission(
    roomId: string,
    payload: Omit<SubmissionEntry, 'id' | 'createdAt'>
  ) {
    const response = await fetch(`${env.apiBaseUrl}/rooms/${roomId}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return handleResponse<SubmissionEntry>(response)
  }
}

