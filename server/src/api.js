import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { getRoomFromDB, saveRoomToDB } from './database.js'
import { buildRoomPayload, createSubmissionEntry, createExecutionResponse } from './models.js'
import { executeCode } from './executor.js'
import { v4 as uuid } from 'uuid'

let wss = null

// Set WebSocket server reference for broadcasting
export const setWebSocketServer = (wsServer) => {
  wss = wsServer
}

export const createApp = () => {
  const app = express()
  app.use(cors({ origin: config.CLIENT_ORIGINS, credentials: true }))
  app.use(express.json({ limit: '1mb' }))

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    })
  })

  // Get room by ID
  app.get('/api/rooms/:roomId', async (req, res) => {
    try {
      const room = await getRoomFromDB(req.params.roomId)
      if (!room) {
        return res.status(404).json({ message: `Room ${req.params.roomId} was not found.` })
      }
      res.json(room)
    } catch (error) {
      console.error('[API] Error fetching room:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  })

  // Create new room
  app.post('/api/rooms', async (req, res) => {
    try {
      const { title, createdBy } = req.body ?? {}
      const roomId = uuid()
      const room = buildRoomPayload({ roomId, createdBy, title })

      await saveRoomToDB(room)
      res.status(201).json(room)
    } catch (error) {
      console.error('[API] Error creating room:', error)
      res.status(500).json({ message: 'Failed to create room' })
    }
  })

  // Get room submissions
  app.get('/api/rooms/:roomId/submissions', async (req, res) => {
    try {
      const room = await getRoomFromDB(req.params.roomId)
      if (!room) {
        return res.status(404).json({ message: `Room ${req.params.roomId} was not found.` })
      }
      res.json(room.submissions || [])
    } catch (error) {
      console.error('[API] Error fetching submissions:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  })

  // Add submission to room
  app.post('/api/rooms/:roomId/submissions', async (req, res) => {
    try {
      const room = await getRoomFromDB(req.params.roomId)
      if (!room) {
        return res.status(404).json({ message: `Room ${req.params.roomId} was not found.` })
      }

      const { code, input, language, stdout, stderr, status } = req.body ?? {}
      if (!language || !status) {
        return res.status(400).json({ message: 'language and status are required.' })
      }

      const entry = createSubmissionEntry(code, input, language, stdout, stderr, status)
      room.submissions = room.submissions || []
      room.submissions.unshift(entry)
      await saveRoomToDB(room)

      res.status(201).json(entry)
    } catch (error) {
      console.error('[API] Error adding submission:', error)
      res.status(500).json({ message: 'Failed to add submission' })
    }
  })

  // Execute code (synchronous for immediate feedback)
  app.post('/api/execute', async (req, res) => {
    try {
      const { code, language, input, roomId } = req.body ?? {}

      if (!code || !language) {
        return res.status(400).json({ message: 'Code and language are required.' })
      }

      if (!code.trim()) {
        return res.json({
          status: 'Runtime Error',
          language,
          input: input ?? '',
          stdout: '',
          stderr: 'Program exited because the solution was empty.',
          message: 'Please provide a solution before running the tests.',
          time: 0,
          memory: 0,
          submittedAt: new Date().toISOString()
        })
      }

      console.log(`[API] Executing ${language} code...`)
      const result = await executeCode(language, code, input || '')
      const execution = createExecutionResponse(result, language, input)
      
      console.log(`[API] Execution result:`, execution.status)

      // Also broadcast to WebSocket clients for real-time updates
      if (wss && roomId) {
        broadcastExecutionResult(roomId, execution)
      }

      res.json(execution)
    } catch (error) {
      console.error('[API] Error executing code:', error)
      res.status(500).json({
        status: 'Runtime Error',
        message: 'Failed to execute code. Please try again.',
        submittedAt: new Date().toISOString()
      })
    }
  })

  // Get execution queue stats
  app.get('/api/queue/stats', (_req, res) => {
    res.json({ message: 'Synchronous execution (no queue)' })
  })

  return app
}

/**
 * Broadcast execution result to all WebSocket clients in a room
 */
function broadcastExecutionResult(roomId, result) {
  if (!wss) return

  console.log(`[Broadcast] Sending execution result to room ${roomId}`)

  // Get all connected clients
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      // You would need to track which rooms each client is connected to
      // For now, broadcast to all (production should filter by room)
      try {
        client.send(JSON.stringify({
          type: 'execution-result',
          roomId,
          result
        }))
      } catch (err) {
        console.error('[Broadcast] Failed to send message:', err)
      }
    }
  })
}

export const handlePortError = (error, port, label) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `[${label}] Port ${port} is already in use. Stop the other process or set a different ${
        label === 'REST' ? 'HTTP_PORT' : 'WS_PORT'
      } environment variable.`,
    )
    process.exit(1)
  }

  console.error(`[${label}] Failed to start`, error)
  process.exit(1)
}
