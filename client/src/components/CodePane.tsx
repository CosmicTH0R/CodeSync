import React, { useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { MonacoBinding } from 'y-monaco'
import * as Y from 'yjs'
import { editor } from 'monaco-editor'
import { Awareness } from 'y-protocols/awareness'

import EditorHeader from './EditorHeader'
import type { SupportedLanguage } from '../lib/api'

interface CodePaneProps {
  yCode: Y.Text
  awareness: Awareness
  theme: 'light' | 'dark'
  language: SupportedLanguage
  onLanguageChange: (language: SupportedLanguage) => void
  onResetToStarter: () => void
}

const CodePane: React.FC<CodePaneProps> = ({
  yCode,
  awareness,
  theme,
  language,
  onLanguageChange,
  onResetToStarter,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const [isFormatting, setIsFormatting] = useState(false)

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance
    const model = editorInstance.getModel()
    if (model) {
      new MonacoBinding(yCode, model, new Set([editorInstance]), awareness)
    }
  }

  const handleFormat = async () => {
    const ed = editorRef.current
    if (!ed) {
      console.warn('Editor not available for formatting')
      return
    }

    setIsFormatting(true)
    try {
      const model = ed.getModel()
      if (!model) return

      const code = model.getValue()

      // Try language-specific formatting
      if (language === 'javascript') {
        try {
          const prettier = await import('prettier/standalone')
          const formatted = (prettier as any).format(code, {
            parser: 'babel',
          })
          model.setValue(formatted)
          console.log('Formatted with Prettier (JavaScript)')
          return
        } catch (err) {
          console.warn('Prettier not available, falling back to Monaco')
        }
      }

      // Use Monaco formatter for all languages (C++, Python, Java, JavaScript, etc.)
      const action = ed.getAction('editor.action.formatDocument')
      if (action && action.run) {
        console.log(`Formatting ${language} with Monaco formatter`)
        await action.run()
        console.log('Format completed')
      } else {
        console.warn('Format action not available for this language')
      }
    } catch (err) {
      console.error('Format error:', err)
    } finally {
      setIsFormatting(false)
    }
  }

  return (
    <div className="flex h-full flex-col border-l border-gray-200 bg-white shadow-inner dark:border-gray-800 dark:bg-[#1b1b1b]">
      <div className="h-12 border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-800 dark:bg-[#151515]">
        <EditorHeader
          language={language}
          onLanguageChange={onLanguageChange}
          onReset={onResetToStarter}
          onFormat={handleFormat}
          isFormatting={isFormatting}
        />
      </div>

      <div className="flex-1 bg-white dark:bg-[#1b1b1b]">
        <Editor
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          language={language}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            smoothScrolling: true,
            padding: { top: 14 },
          }}
        />
      </div>
    </div>
  )
}

export default CodePane
