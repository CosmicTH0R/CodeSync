import 'dotenv/config'
import { config } from './src/config.js'
import { connectMongoDB, closeMongoDB } from './src/database.js'
import { createApp, handlePortError, setWebSocketServer } from './src/api.js'
import { createWebSocketServer } from './src/websocket.js'
import { ensurePersistenceDir, gracefulShutdown } from './src/utils.js'

// Initialize
ensurePersistenceDir()

// Create app instances
const app = createApp()

// Start servers
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectMongoDB()

    // Start REST API
    const httpServer = app.listen(config.HTTP_PORT, () => {
      console.log(`[Server] REST API listening on http://localhost:${config.HTTP_PORT}`)
    })
    httpServer.on('error', (error) => handlePortError(error, config.HTTP_PORT, 'REST'))

    // Start WebSocket server
    const wss = createWebSocketServer()
    wss.on('error', (error) => handlePortError(error, config.WS_PORT, 'WebSocket'))
    console.log(`[Server] WebSocket server listening on ws://localhost:${config.WS_PORT}`)

    // Pass WebSocket server to API for broadcasting
    setWebSocketServer(wss)

    console.log('[Server] All systems initialized successfully')

    // Graceful shutdown
    const shutdown = gracefulShutdown('UNKNOWN', httpServer, wss, closeMongoDB)
    process.on('SIGINT', () => shutdown())
    process.on('SIGTERM', () => shutdown())
    process.once('SIGUSR2', () => {
      shutdown()
      process.kill(process.pid, 'SIGUSR2')
    })
  } catch (error) {
    console.error('[Server] Failed to start:', error.message)
    process.exit(1)
  }
}

startServer()
