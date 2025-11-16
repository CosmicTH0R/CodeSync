import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Split from 'react-split'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import {
  AlertCircle,
  Check,
  Copy,
  Moon,
  Play,
  Send,
  Sun,
} from 'lucide-react'

import LeftPaneTabs from '../components/LeftPaneTabs'
import CodePane from '../components/CodePane'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'
import type {
  ExecutionResponse,
  RoomMetadata,
  SubmissionEntry,
  SupportedLanguage,
} from '../lib/api'
import { env } from '../config/env'
import type { TestResult } from '../types/testResult'

const userColors = [
  '#30bced',
  '#6eeb83',
  '#ffbc42',
  '#ecd444',
  '#ee6352',
  '#9ac2c9',
  '#804dee',
]

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const roomName = roomId || 'fallback-room'
  const location = useLocation()
  const navigate = useNavigate()

  const locationState = (location.state ?? {}) as {
    isCreator?: boolean
    roomMeta?: RoomMetadata
  }

  const [copyButtonText, setCopyButtonText] = useState('Copy share link')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoadingRoom, setIsLoadingRoom] = useState(!locationState.roomMeta)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [roomDetails, setRoomDetails] = useState<RoomMetadata | null>(
    locationState.roomMeta ?? null,
  )
  const [submissions, setSubmissions] = useState<SubmissionEntry[]>(
    locationState.roomMeta?.submissions ?? [],
  )
  const [isSavingSubmission, setIsSavingSubmission] = useState(false)
  const isCreator = Boolean(locationState.isCreator)

  const { theme, setTheme } = useTheme()
  const [language, setLanguage] = useState<SupportedLanguage>(
    locationState.roomMeta?.defaultLanguage ?? 'cpp',
  )

  const languageInitialized = useRef(Boolean(locationState.roomMeta))

  const ydoc = useMemo(() => new Y.Doc(), [])
  const provider = useMemo(
    () => new WebsocketProvider(env.websocketUrl, roomName, ydoc),
    [roomName, ydoc],
  )

  const awareness = provider.awareness
  const userColor = useMemo(
    () => userColors[Math.floor(Math.random() * userColors.length)],
    [],
  )

  const yProblem = ydoc.getText('problem')
  const yCode = ydoc.getText('code')
  const yTestCases = ydoc.getText('testCases')
  const yNotes = ydoc.getText('notes')
  const yMeta = ydoc.getMap('meta')

  const hasPrimedRef = useRef(false)

  const primeDocument = useCallback(
    (details: RoomMetadata) => {
      if (hasPrimedRef.current) return
      ydoc.transact(() => {
        if (yProblem.length === 0 && details.problem?.description) {
          yProblem.insert(0, details.problem.description)
        }
        if (yCode.length === 0) {
          const starter = details.starterCode[details.defaultLanguage] ?? ''
          yCode.insert(0, starter)
        }
      })
      hasPrimedRef.current = true
      if (!languageInitialized.current) {
        setLanguage(details.defaultLanguage)
        languageInitialized.current = true
      }
    },
    [yCode, yProblem, yTestCases, ydoc],
  )

  useEffect(() => {
    let cancelled = false
    if (roomDetails) {
      primeDocument(roomDetails)
      return
    }

    setIsLoadingRoom(true)
    setRoomError(null)

    api
      .getRoom(roomName)
      .then((metadata) => {
        if (cancelled) return
        setRoomDetails(metadata)
        if (metadata.submissions) {
          setSubmissions(metadata.submissions)
        }
        primeDocument(metadata)
      })
      .catch((error) => {
        if (cancelled) return
        const message =
          error instanceof Error
            ? error.message
            : 'Unable to load this room right now.'
        setRoomError(message)
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoom(false)
      })

    return () => {
      cancelled = true
    }
  }, [primeDocument, roomDetails, roomName])

  useEffect(() => {
    awareness.setLocalStateField('user', {
      name: `Guest ${Math.floor(Math.random() * 1000)}`,
      color: userColor,
    })

    return () => {
      provider.destroy()
    }
  }, [awareness, provider, userColor])

  const runCode = useCallback(async () => {
    setTestResult({ status: 'Running...', language })

    const code = yCode.toString()
    const testCases = yTestCases.toString()

    try {
      const execution: ExecutionResponse = await api.executeCode({
        code,
        language,
        input: testCases,
      })

      setTestResult({
        status: execution.status,
        language: execution.language,
        input: execution.input,
        output: execution.stdout || execution.stderr,
        stdout: execution.stdout,
        stderr: execution.stderr,
        message: execution.message,
        time: execution.time,
        memory: execution.memory,
        submittedAt: execution.submittedAt,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to execute code. Try again shortly.'
      setTestResult({
        status: 'Runtime Error',
        language,
        message,
      })
    }
  }, [language, yCode, yTestCases])

  const handleSubmit = async () => {
    await runCode()
  }

  const handleResetToStarter = () => {
    if (!roomDetails) return
    const starter = roomDetails.starterCode[language]
    if (!starter) return

    const confirmed = window.confirm('Are you sure you want to reset the code to starter? This cannot be undone.')
    if (!confirmed) return

    ydoc.transact(() => {
      yCode.delete(0, yCode.length)
      yCode.insert(0, starter)
    })
  }

  const refreshSubmissions = useCallback(async () => {
    try {
      const data = await api.getSubmissions(roomName)
      setSubmissions(data)
    } catch (error) {
      console.error('Failed to fetch submissions', error)
    }
  }, [roomName])

  useEffect(() => {
    refreshSubmissions()
  }, [refreshSubmissions])

  const handleSaveSubmission = async () => {
    if (!roomDetails || !testResult) return
    const code = yCode.toString()
    const input = yTestCases.toString()

    setIsSavingSubmission(true)
    try {
      const saved = await api.createSubmission(roomDetails.roomId, {
        code,
        input,
        stdout: testResult.stdout ?? '',
        stderr: testResult.stderr ?? '',
        language,
        status: testResult.status,
      })
      setSubmissions((prev) => [saved, ...prev])
    } catch (error) {
      console.error('Failed to save submission snapshot', error)
    } finally {
      setIsSavingSubmission(false)
    }
  }

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopyButtonText('Copied!')
    setTimeout(() => setCopyButtonText('Copy share link'), 2000)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (roomError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center dark:bg-[#050505]">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-10 shadow-sm dark:border-red-500/30 dark:bg-[#0f0f0f]">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">
            We couldn’t open this room
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">{roomError}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-8 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to home
          </button>
        </div>
      </div>
    )
  }

  if (!roomDetails || isLoadingRoom) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-700 dark:bg-[#050505] dark:text-gray-400">
        Loading your collaborative workspace...
      </div>
    )
  }

  const displayTitle = (roomDetails?.problem?.title ?? '').trim() || 'CodeSync'

  return (
    <div className="flex h-screen w-screen flex-col bg-white text-gray-900 dark:bg-[#0e0e0e] dark:text-gray-100">
      <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-[#141414]">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{displayTitle}</p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(roomDetails.roomId)
              alert('Room ID copied to clipboard!')
            }}
            title={`Room ID: ${roomDetails.roomId}`}
            className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-300 dark:hover:bg-[#2a2a2a]"
          >
            Copy Room ID
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runCode}
            disabled={testResult?.status === 'Running...'}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Play size={14} />
            {testResult?.status === 'Running...' ? 'Running' : 'Run code'}
          </button>

          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Send size={14} />
            Submit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={copyLinkToClipboard}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {copyButtonText === 'Copied!' ? <Check size={14} /> : <Copy size={14} />}
            {copyButtonText}
          </button>
        </div>
      </div>

      <Split className="flex flex-1" sizes={[40, 60]} minSize={320} gutterSize={10}>
        <LeftPaneTabs
          yProblem={yProblem}
          yTestCases={yTestCases}
          yNotes={yNotes}
          yMeta={yMeta}
          awareness={awareness}
          theme={theme}
          testResult={testResult}
          isCreator={isCreator}
          submissions={submissions}
          onSaveSubmission={handleSaveSubmission}
          canSaveSubmission={Boolean(testResult)}
          isSavingSubmission={isSavingSubmission}
        />

        <CodePane
          yCode={yCode}
          awareness={awareness}
          theme={theme}
          language={language}
          onLanguageChange={setLanguage}
          onResetToStarter={handleResetToStarter}
        />
      </Split>
    </div>
  )
}

export default RoomPage
