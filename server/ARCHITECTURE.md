# Server Architecture

## Overview
The server has been refactored into modular, well-organized files for better maintainability and scalability.

## File Structure

```
server/
├── src/
│   ├── config.js           # Configuration management
│   ├── database.js         # MongoDB connection & operations
│   ├── models.js           # Data model builders
│   ├── executor.js         # Code execution engine
│   ├── api.js              # REST API endpoints
│   ├── websocket.js        # WebSocket server setup
│   └── utils.js            # Utility functions
├── server.js               # Entry point (starts all servers)
├── package.json            # Dependencies
├── .env                    # Environment variables
└── db/                     # LevelDB persistence directory
```

## Module Breakdown

### `config.js`
Centralized configuration management for the entire server.

**Exports:**
- `config` - Object containing all configuration values
  - `MONGODB_URI` - MongoDB connection string
  - `HTTP_PORT` - REST API port (default: 4000)
  - `WS_PORT` - WebSocket port (default: 1234)
  - `CLIENT_ORIGINS` - CORS allowed origins
  - `PERSISTENCE_DIR` - Directory for LevelDB files

**Usage:**
```javascript
import { config } from './src/config.js';
console.log(config.HTTP_PORT); // 4000
```

---

### `database.js`
Handles all MongoDB operations and connection management.

**Exports:**
- `connectMongoDB()` - Establishes connection to MongoDB
- `getRoomFromDB(roomId)` - Fetches a single room
- `getRoomsFromDB()` - Fetches all rooms
- `saveRoomToDB(room)` - Saves/updates room data
- `deleteRoomFromDB(roomId)` - Deletes a room
- `closeMongoDB()` - Closes MongoDB connection gracefully

**Database Schema:**
```javascript
{
  _id: ObjectId,
  roomId: string,
  createdBy: string,
  createdAt: ISO8601,
  problem: {
    id: string,
    title: string,
    difficulty: string,
    description: string,
    constraints: array,
    examples: array
  },
  defaultLanguage: string,
  starterCode: { cpp, javascript, python, java },
  defaultTestCases: string,
  submissions: array
}
```

---

### `models.js`
Factory functions for creating data models.

**Exports:**
- `buildRoomPayload(options)` - Creates a new room object
- `createSubmissionEntry(...)` - Creates a submission record
- `createExecutionResponse(...)` - Creates execution response

**Usage:**
```javascript
const room = buildRoomPayload({
  roomId: 'uuid',
  createdBy: 'user',
  title: 'Problem Name'
});
```

---

### `executor.js`
Code execution engine supporting C++, Java, Python, and JavaScript.

**Exports:**
- `executeCode(language, code, input)` - Main execution function

**Supported Languages:**
- `cpp` - C++ (requires g++ compiler)
- `java` - Java (requires javac/java)
- `python` - Python 3 (requires python)
- `javascript` - Node.js (built-in)

**Response Format:**
```javascript
{
  status: 'Accepted|Compilation Error|Runtime Error|...',
  stdout: string,
  stderr: string,
  time: number (seconds),
  memory: number (KB)
}
```

---

### `api.js`
Express REST API setup and endpoint handlers.

**Exports:**
- `createApp()` - Creates and configures Express app
- `handlePortError(error, port, label)` - Port error handler

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/rooms/:roomId` | Get room details |
| POST | `/api/rooms` | Create new room |
| GET | `/api/rooms/:roomId/submissions` | Get submissions |
| POST | `/api/rooms/:roomId/submissions` | Add submission |
| POST | `/api/execute` | Execute code |

---

### `websocket.js`
WebSocket server for real-time collaboration.

**Exports:**
- `createWebSocketServer()` - Creates WebSocket server

**Features:**
- Yjs CRDT for collaborative editing
- LevelDB persistence
- Real-time document sync

---

### `utils.js`
Utility functions for initialization and shutdown.

**Exports:**
- `ensurePersistenceDir()` - Creates db directory if needed
- `gracefulShutdown(signal, httpServer, wss, mongoClose)` - Handles shutdown

---

### `server.js`
Main entry point that orchestrates all modules.

**Responsibilities:**
1. Load environment variables
2. Initialize persistence directory
3. Create Express app
4. Connect to MongoDB
5. Start REST API server
6. Start WebSocket server
7. Set up graceful shutdown handlers

**Startup Sequence:**
1. `connectMongoDB()` - Connect to database
2. `app.listen()` - Start REST API
3. `createWebSocketServer()` - Start WebSocket
4. Log initialization complete
5. Set up SIGINT/SIGTERM handlers

---

## Adding New Endpoints

### Step 1: Define in `api.js`
```javascript
app.get('/api/new-endpoint', async (req, res) => {
  try {
    // Your logic here
    res.json({ data: 'response' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

### Step 2: Use database functions
```javascript
import { getRoomFromDB, saveRoomToDB } from './database.js';

app.post('/api/custom', async (req, res) => {
  const room = await getRoomFromDB(req.params.roomId);
  // Modify room
  await saveRoomToDB(room);
  res.json(room);
});
```

---

## Adding New Code Executor

### Step 1: Add language to `executor.js`
```javascript
else if (language === 'rust') {
  return executeRust(code, input, tempId);
}
```

### Step 2: Implement executor
```javascript
const executeRust = (code, input, tempId) => {
  const rsFile = join(__dirname, `temp_${tempId}.rs`);
  const exeFile = join(__dirname, `temp_${tempId}.exe`);
  
  writeFileSync(rsFile, code);
  try {
    execSync(`rustc "${rsFile}" -o "${exeFile}"`, { ... });
    // Run and cleanup
  } catch (err) {
    // Error handling
  }
};
```

---

## Error Handling

All modules include proper error handling:

- **Database**: Connection errors exit process
- **Code Executor**: Compilation/runtime errors returned in response
- **API**: Try-catch blocks with status codes
- **Startup**: Validation of config before starting

---

## Dependencies

Core modules used:
- `express` - REST API framework
- `mongodb` - Database driver
- `ws` - WebSocket server
- `y-websocket` - Collaborative editing
- `y-leveldb` - LevelDB persistence
- `uuid` - ID generation
- `dotenv` - Environment variables

---

## Environment Variables

Required (with defaults):
```
MONGODB_URI=mongodb://localhost:27017/codesync
HTTP_PORT=4000
WS_PORT=1234
CLIENT_ORIGINS=http://localhost:5173
```

---

## Testing

Start the server:
```bash
cd server
node server.js
```

Test endpoints:
```bash
# Create room
curl -X POST http://localhost:4000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","createdBy":"User"}'

# Execute code
curl -X POST http://localhost:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"console.log(\"hello\")","language":"javascript"}'
```

---

## Deployment

For production:
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas connection string
3. Configure `CLIENT_ORIGINS` to your domain
4. Use process manager (PM2, systemd)
5. Enable HTTPS/WSS
6. Set up monitoring and logging

---

## Future Improvements

- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Add caching layer (Redis)
- [ ] Database migrations system
- [ ] Structured logging (Winston/Pino)
- [ ] Health check endpoints
- [ ] Metrics/monitoring endpoints
- [ ] Input validation middleware
- [ ] Request/response compression
- [ ] API versioning
