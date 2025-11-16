import React, { useEffect, useState } from 'react'
import * as Y from 'yjs'

interface ProblemPaneProps {
  yProblem: Y.Text
  metaMap: Y.Map<unknown>
  isCreator: boolean
}

const ProblemPane: React.FC<ProblemPaneProps> = ({ yProblem, metaMap, isCreator }) => {
  const [content, setContent] = useState(yProblem.toString())
  const [title, setTitle] = useState<string>((metaMap.get('title') as string) || 'Untitled Problem')
  const [referenceUrl, setReferenceUrl] = useState<string>(
    (metaMap.get('referenceUrl') as string) || '',
  )
  const [isEditing, setIsEditing] = useState<boolean>(true)
  const [published, setPublished] = useState<boolean>(Boolean(metaMap.get('published')))

  useEffect(() => {
    const observer = () => setContent(yProblem.toString())
    yProblem.observe(observer)
    return () => yProblem.unobserve(observer)
  }, [yProblem])

  useEffect(() => {
    const syncMeta = () => {
      setTitle((metaMap.get('title') as string) || 'Untitled Problem')
      setReferenceUrl((metaMap.get('referenceUrl') as string) || '')
      setPublished(Boolean(metaMap.get('published')))

      // Non-creators should never be in edit mode
      if (!isCreator) setIsEditing(false)
      // If published, force read-only view for creator as well
      if (metaMap.get('published')) setIsEditing(false)
    }
    metaMap.observe(syncMeta)
    syncMeta()
    return () => metaMap.unobserve(syncMeta)
  }, [metaMap, isCreator])

  const handleEdit = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    yProblem.delete(0, yProblem.length)
    yProblem.insert(0, event.target.value)
  }

  const updateMeta = (key: string, value: string) => {
    if (value.trim()) {
      metaMap.set(key, value.trim())
    } else {
      metaMap.delete(key)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#151515] relative">
        <div className="flex flex-col gap-2">
          {isCreator ? (
            <>
              <div className="flex items-center justify-between">
                <div />
                <div className="flex items-center gap-2">
                  {!published && isEditing ? (
                    <button
                      onClick={() => {
                        // Publish the current prompt so everyone sees the published view
                        metaMap.set('published', true)
                        metaMap.set('publishedAt', Date.now())
                      }}
                      className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Save
                    </button>
                  ) : null}
                </div>
              </div>

              {(!published && isEditing) ? (
                <>
                  <input
                    value={title}
                    onChange={(event) => {
                      const next = event.target.value
                      setTitle(next)
                      updateMeta('title', next || 'Untitled Problem')
                    }}
                    placeholder="Name this problem"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#1d1d1d] dark:text-gray-100"
                  />

                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Reference link
                  </label>
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(event) => {
                      const next = event.target.value
                      setReferenceUrl(next)
                      updateMeta('referenceUrl', next)
                    }}
                    placeholder="Paste the URL where you sourced this question"
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#1d1d1d] dark:text-gray-100"
                  />
                </>
              ) : (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Current problem
                  </p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Current problem
              </p>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
              {referenceUrl ? (
                <a
                  href={referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-blue-500 underline-offset-2 hover:underline"
                >
                  Open reference
                </a>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-[#151515] relative">
        {isCreator ? (
          isEditing ? (
            <div className="space-y-3">
              <textarea
                value={content}
                onChange={handleEdit}
                placeholder="Paste the entire prompt, constraints, and examples here..."
                className="min-h-80 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#1d1d1d] dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Everyone in this room sees your updates instantly — use this space like the prompt
                panel on LeetCode.
              </p>
            </div>
          ) : (
            <div className="prose max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {content || 'The host has not added a prompt yet.'}
              </div>
            </div>
          )
        ) : (
          <div className="prose max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
              {content || 'The host has not added a prompt yet.'}
            </div>
          </div>
        )}

        {/* Overlay edit button for creator when published */}
        {published && isCreator ? (
          <div className="absolute top-3 right-3">
            <button
              onClick={() => {
                // Unpublish so the creator can edit again
                metaMap.delete('published')
                metaMap.delete('publishedAt')
                setIsEditing(true)
              }}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-200"
            >
              Edit
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ProblemPane

