import React from 'react'
import { RotateCcw } from 'lucide-react'
import { Loader2, Sparkles } from 'lucide-react'

import type { SupportedLanguage } from '../lib/api'

const languageLabels: Record<SupportedLanguage, string> = {
  cpp: 'C++17',
  javascript: 'JavaScript',
  python: 'Python 3',
  java: 'Java 17',
}

interface EditorHeaderProps {
  language: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  onReset: () => void
  onFormat?: () => void
  isFormatting?: boolean
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
  language,
  onLanguageChange,
  onReset,
  onFormat,
  isFormatting,
}) => {
  return (
    <div className="flex h-full items-center justify-between">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          Language
        </label>
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-100"
        >
          {Object.entries(languageLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            console.log('Format button clicked')
            onFormat?.()
          }}
          disabled={isFormatting}
          title={isFormatting ? 'Formatting…' : 'Format code'}
          className={`flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-100 disabled:opacity-70 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800`}
        >
          {isFormatting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {isFormatting ? 'Formatting...' : 'Format'}
        </button>

        <button
          onClick={() => {
            console.log('Reset button clicked')
            onReset?.()
          }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>
    </div>
  )
}

export default EditorHeader
