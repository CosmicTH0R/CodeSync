import { WebSocketServer } from 'ws'
import { createRequire } from 'module'
import { config } from './config.js'

const require = createRequire(import.meta.url)
const { setupWSConnection, getYDoc, gc } = require('y-websocket/bin/utils')
const { LeveldbPersistence } = require('y-leveldb')

export const createWebSocketServer = () => {
  const ldb = new LeveldbPersistence(config.PERSISTENCE_DIR)

  const wss = new WebSocketServer({ port: config.WS_PORT })

  wss.on('connection', async (ws, req) => {
    try {
      const docName = req.url?.slice(1).split('?')[0] || 'default-room'
      console.log(`[WS] Connection for doc: ${docName}`)

      // Store room ID on the connection for broadcasting
      ws.roomId = docName

      const ydoc = getYDoc(docName, gc)
      setupWSConnection(ws, req, { doc: ydoc })
      
      // Listen for execution-result messages coming from connected peers
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data)
          if (message && message.type === 'execution-result') {
            // Broadcast to all clients in the same room
            wss.clients.forEach((client) => {
              if (client.roomId === message.roomId && client.readyState === 1) {
                client.send(JSON.stringify(message))
              }
            })
          }
        } catch (err) {
          // Ignore non-JSON or parsing errors
        }
      })
    } catch (err) {
      console.error('[WS] Connection handler error', err)
      ws.close()
    }
  })

  return wss
}
