import React, { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

interface NotesPaneProps {
  yNotes: Y.Text
  awareness: Awareness
  theme: 'light' | 'dark'
}

const NotesPane: React.FC<NotesPaneProps> = ({ yNotes }) => {
  const [value, setValue] = useState(yNotes.toString())

  useEffect(() => {
    const observer = () => setValue(yNotes.toString())
    yNotes.observe(observer)

    return () => yNotes.unobserve(observer)
  }, [yNotes])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    yNotes.delete(0, yNotes.length)
    yNotes.insert(0, e.target.value)
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl bg-white p-4 text-gray-900 dark:bg-[#101010] dark:text-gray-100">
      <div>
        <h2 className="text-lg font-semibold">Personal Notes</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Jot down your thoughts, approach, or anything you want to remember.
        </p>
      </div>

      <textarea
        value={value}
        onChange={handleChange}
        placeholder="Start typing your notes here..."
        className="flex-1 min-h-[300px] w-full rounded-lg border border-gray-300 bg-white p-4 text-sm text-gray-900 outline-none transition resize-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#181818] dark:text-gray-100 dark:placeholder-gray-500 dark:caret-gray-100"
        style={{
          caretColor: 'inherit',
        }}
      />
    </div>
  )
}

export default NotesPane
