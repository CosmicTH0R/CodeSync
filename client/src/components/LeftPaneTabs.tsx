import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

import ProblemPane from './ProblemPane'
import TestcasePane from './TestcasePane'
import TestResultPane from './TestResultPane'
import SubmissionsPane from './SubmissionsPane'
import NotesPane from './NotesPane'
import type { SubmissionEntry } from '../lib/api'
import type { TestResult } from '../types/testResult'

interface LeftPaneTabsProps {
  yProblem: Y.Text
  yTestCases: Y.Text
  yNotes: Y.Text
  yMeta: Y.Map<unknown>
  awareness: Awareness
  theme: 'light' | 'dark'
  testResult: TestResult | null
  isCreator: boolean
  submissions: SubmissionEntry[]
  onSaveSubmission: () => void
  canSaveSubmission: boolean
  isSavingSubmission: boolean
}

const tabs = ['Description', 'Testcase', 'Test Result', 'Submissions', 'Notes'] as const

const LeftPaneTabs: React.FC<LeftPaneTabsProps> = ({
  yProblem,
  yTestCases,
  yNotes,
  yMeta,
  awareness,
  theme,
  testResult,
  isCreator,
  submissions,
  onSaveSubmission,
  canSaveSubmission,
  isSavingSubmission,
}) => {
  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white text-gray-900 dark:border-gray-800 dark:bg-[#101010] dark:text-gray-100">
      <Tabs.Root defaultValue={tabs[0]} className="flex h-full flex-col">
        <Tabs.List className="flex h-12 items-center gap-5 border-b border-gray-200 px-5 text-sm font-semibold text-gray-600 dark:border-gray-800 dark:text-gray-400">
          {tabs.map((tab) => (
            <Tabs.Trigger
              key={tab}
              value={tab}
              className="pb-1 transition hover:text-gray-900 radix-state-active:border-b-2 radix-state-active:border-yellow-500 radix-state-active:text-gray-900 dark:hover:text-gray-200 dark:radix-state-active:text-yellow-300"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1 overflow-y-auto bg-white p-4 dark:bg-[#101010]">
          <Tabs.Content value="Description" className="h-full">
            <ProblemPane yProblem={yProblem} metaMap={yMeta} isCreator={isCreator} />
          </Tabs.Content>

          <Tabs.Content value="Testcase" className="h-full">
            <TestcasePane
              yTestCases={yTestCases}
              awareness={awareness}
              result={testResult}
            />
          </Tabs.Content>

          <Tabs.Content value="Test Result" className="h-full">
            <TestResultPane result={testResult} />
          </Tabs.Content>

          <Tabs.Content value="Submissions" className="h-full">
            <SubmissionsPane
              submissions={submissions}
              onSaveSnapshot={onSaveSubmission}
              canSave={canSaveSubmission}
              isSaving={isSavingSubmission}
            />
          </Tabs.Content>

          <Tabs.Content value="Notes" className="h-full">
            <NotesPane yNotes={yNotes} awareness={awareness} theme={theme} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  )
}

export default LeftPaneTabs

