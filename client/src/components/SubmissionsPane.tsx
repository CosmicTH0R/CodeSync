import React from 'react'
import type { SubmissionEntry } from '../lib/api'

interface SubmissionsPaneProps {
  submissions: SubmissionEntry[]
  onSaveSnapshot: () => void
  canSave: boolean
  isSaving: boolean
}

const statusColors: Record<string, string> = {
  Accepted: 'text-green-600 dark:text-green-300',
  'Wrong Answer': 'text-red-500 dark:text-red-300',
  'Runtime Error': 'text-yellow-500 dark:text-yellow-300',
}

const SubmissionsPane: React.FC<SubmissionsPaneProps> = ({
  submissions,
  onSaveSnapshot,
  canSave,
  isSaving,
}) => {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-gray-900 dark:bg-[#101010] dark:text-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Submissions</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Save snapshots of your current code and output to revisit later.
          </p>
        </div>

        <button
          onClick={onSaveSnapshot}
          disabled={!canSave || isSaving}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save current result'}
        </button>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
          No snapshots yet. Run your code, then save the result to keep a log.
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-[#141414]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    {new Date(submission.createdAt).toLocaleString()}
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {submission.language.toUpperCase()}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    statusColors[submission.status] ?? 'text-gray-500'
                  }`}
                >
                  {submission.status}
                </span>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Block label="Input" value={submission.input || '—'} />
                <Block label="Output" value={submission.stdout || '—'} />
              </div>

              {submission.stderr ? (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 font-mono text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {submission.stderr}
                </div>
              ) : null}

              {submission.code ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Code snapshot
                  </p>
                  <pre className="mt-1 max-h-48 overflow-hidden rounded-lg border border-gray-200 bg-black/80 p-3 text-xs text-gray-100 dark:border-gray-700">
                    <code>{submission.code}</code>
                  </pre>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const Block = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <div className="mt-1 min-h-20 rounded-lg border border-gray-200 bg-white p-3 font-mono text-xs text-gray-900 dark:border-gray-700 dark:bg-[#181818] dark:text-gray-100">
      {value}
    </div>
  </div>
)

export default SubmissionsPane

