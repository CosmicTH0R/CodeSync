import React from 'react'

import type { TestResult } from '../types/testResult'

interface TestResultPaneProps {
  result: TestResult | null
}

const statusColors: Record<string, string> = {
  Accepted: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  'Wrong Answer': 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200',
  'Runtime Error': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-200',
  'Running...': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200',
  Waiting: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-200',
}

const TestResultPane: React.FC<TestResultPaneProps> = ({ result }) => {
  const status = result?.status ?? 'Waiting'

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-gray-900 dark:bg-[#111111] dark:text-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">Execution</p>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Test Result</h2>
        </div>

        <span
          className={`rounded-full px-4 py-1 text-xs font-semibold ${statusColors[status] ?? statusColors.Waiting}`}
        >
          {status}
        </span>
      </div>

      {result ? (
        <>
          <div className="space-y-3 text-sm">
            {result.message ? (
              <p className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-800 dark:border-gray-800 dark:bg-[#1b1b1b] dark:text-gray-200">
                {result.message}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1b1b1b]">
                <p className="text-xs uppercase tracking-wide text-gray-500">Runtime</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {result.time ?? '—'}s
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-[#1b1b1b]">
                <p className="text-xs uppercase tracking-wide text-gray-500">Memory</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {result.memory ? `${result.memory} MB` : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <ResultBlock title="Input" value={result.input} />
            <ResultBlock title="Stdout" value={result.stdout || result.output} />
            <ResultBlock title="Stderr" value={result.stderr} />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
          Run your code to see verdicts, stdout, stderr and telemetry here.
        </div>
      )}
    </div>
  )
}

const ResultBlock = ({ title, value }: { title: string; value?: string }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
    <div className="mt-2 min-h-[80px] rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-800 dark:border-gray-800 dark:bg-[#1b1b1b] dark:text-gray-200">
      {value && value.trim().length > 0 ? value : '—'}
    </div>
  </div>
)

export default TestResultPane
