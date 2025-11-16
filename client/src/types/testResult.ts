import type { SupportedLanguage } from '../lib/api'

export type TestStatus =
  | 'Waiting'
  | 'Running...'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Runtime Error'

export interface TestResult {
  status: TestStatus
  language?: SupportedLanguage
  input?: string
  output?: string
  stdout?: string
  stderr?: string
  message?: string
  time?: number
  memory?: number
  submittedAt?: string
}

