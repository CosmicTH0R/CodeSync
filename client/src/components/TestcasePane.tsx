import React, { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import type { TestResult } from '../types/testResult'

interface TestcasePaneProps {
  yTestCases: Y.Text
  awareness: Awareness
  result?: TestResult | null
}

const TestcasePane: React.FC<TestcasePaneProps> = ({ yTestCases, result }) => {
  const [value, setValue] = useState(yTestCases.toString())

  useEffect(() => {
    const observer = () => setValue(yTestCases.toString())
    yTestCases.observe(observer)

    return () => yTestCases.unobserve(observer)
  }, [yTestCases])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    yTestCases.delete(0, yTestCases.length)
    yTestCases.insert(0, e.target.value)
  }

  const output =
    result?.stdout?.trim() || result?.stderr?.trim() || (result ? 'No output produced.' : null)

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-gray-900 dark:bg-[#101010] dark:text-gray-100">
      <div>
        <h2 className="text-lg font-semibold">Custom Input</h2>
        <textarea
          value={value}
          onChange={handleChange}
          className="mt-3 min-h-[220px] w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#181818] dark:text-gray-100"
        />
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter newline separated inputs to drive your solution.
        </p>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Output
        </p>
        <div className="mt-2 min-h-[140px] rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-sm text-gray-900 dark:border-gray-700 dark:bg-[#181818] dark:text-gray-100">
          {output ?? 'Run your code to see stdout here.'}
        </div>
        {result?.stderr ? (
          <div className="mt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Errors
            </p>
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-4 font-mono text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              {result.stderr}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default TestcasePane
