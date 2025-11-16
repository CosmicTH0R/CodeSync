import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { api } from '../lib/api'

const featureHighlights = [
  'Live collaborative editing powered by Yjs',
  'Persistent rooms with starter problems',
  'Server-backed code execution feedback',
  'Dark & light themes with instant switching'
]

const HomePage: React.FC = () => {
  const [roomId, setRoomId] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null)
  const [isCreating, setIsCreating] = React.useState(false)
  const [isJoining, setIsJoining] = React.useState(false)
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const createAndJoinRoom = async () => {
    setStatusMessage(null)
    setIsCreating(true)
    try {
      const room = await api.createRoom({
        displayName: displayName.trim() || undefined
      })

      navigate(`/room/${room.roomId}`, {
        state: { isCreator: true, roomMeta: room }
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create room'
      setStatusMessage(message)
    } finally {
      setIsCreating(false)
    }
  }

  const joinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim() === '') {
      setStatusMessage('Enter a room ID to continue')
      return
    }

    setStatusMessage(null)
    setIsJoining(true)

    try {
      const room = await api.getRoom(roomId.trim())
      navigate(`/room/${room.roomId}`, { state: { isCreator: false } })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'We could not find that room.'
      setStatusMessage(message)
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-white text-gray-900 transition-colors dark:bg-[#080808] dark:text-gray-100"
    >
      <header className="flex items-center justify-between px-8 py-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Collaborative IDE
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CodeSync</h1>
        </div>

        <button
          onClick={toggleTheme}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        </button>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-8 pb-16 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Real-time collaboration
          </p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-gray-900 dark:text-white">
            Ship interview-ready solutions with your team.
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Spin up a secure room, pair program with a teammate, and run your solutions
            against realistic sample test cases in seconds.
          </p>

          <ul className="mt-8 space-y-3 text-base text-gray-700 dark:text-gray-300">
            {featureHighlights.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-[#0f0f0f]">
          <form className="space-y-6" onSubmit={joinRoom}>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Display name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Add a friendly name for teammates"
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#1b1b1b] dark:text-gray-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Room ID
              </label>
              <input
                type="text"
                placeholder="Paste an existing room ID to join"
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#1b1b1b] dark:text-gray-100"
              />
            </div>

            {statusMessage ? (
              <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200">
                {statusMessage}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 md:flex-row">
              <button
                type="button"
                onClick={createAndJoinRoom}
                disabled={isCreating}
                className="flex-1 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Create a new room'}
              </button>

              <button
                type="submit"
                disabled={isJoining}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                {isJoining ? 'Joining...' : 'Join existing room'}
              </button>
            </div>
          </form>

          <div className="mt-10 rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
            <p className="font-semibold text-gray-800 dark:text-gray-200">How it works</p>
            <p className="mt-2">
              Creating a room provisions collaborative storage on the server. Share the
              room ID with your peers to work on the same document, run code against
              backend-powered tests, and leave notes in real time.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage