# Server Modular Architecture - Visual Guide

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      server.js                          │
│                   (Entry Point)                         │
└────────┬────────────────┬────────────────┬──────────────┘
         │                │                │
    ┌────▼────┐   ┌──────▼───────┐  ┌────▼────┐
    │ config  │   │  MongoDB      │  │ Express │
    │ Setup   │   │  Connection   │  │  API    │
    └─────────┘   └───────────────┘  └────┬────┘
                                           │
        ┌──────────────────────────────────┼─────────────────────────┐
        │                                  │                         │
    ┌───▼────────┐  ┌───────────┐  ┌──────▼──────┐  ┌────────────┐
    │  database  │  │  models   │  │  executor   │  │ websocket  │
    │  (MongoDB) │  │  (Builders)  │  │  (Code Exec)│  │ (Yjs)      │
    └────────────┘  └───────────┘  └─────────────┘  └────────────┘
        │               │               │                 │
    CRUD Ops       Response         Compile/            Real-time
    • Get          Formatting      Run Code            Collaboration
    • Save         • Rooms         • C++
    • Delete       • Submissions   • Java
    • Query        • Execution     • Python
                                   • JS
```

## 📊 Data Flow Diagram

### Creating a Room
```
Client
   │
   ├─ POST /api/rooms
   │  {title, createdBy}
   │
   ▼
api.js
   │
   ├─ Validate request
   │
   ├─ Call: buildRoomPayload() ────► models.js
   │
   ├─ Call: saveRoomToDB() ────► database.js ────► MongoDB
   │
   ▼
Response: {roomId, createdBy, problem, submissions}
   │
   ▼
Client
```

### Executing Code
```
Client
   │
   ├─ POST /api/execute
   │  {code, language, input}
   │
   ▼
api.js
   │
   ├─ Validate code & language
   │
   ├─ Call: executeCode() ────► executor.js
   │                               │
   │                               ├─ Create temp file
   │                               ├─ Compile (if needed)
   │                               ├─ Execute
   │                               ├─ Capture output
   │                               └─ Cleanup
   │
   ├─ Call: createExecutionResponse() ────► models.js
   │
   ▼
Response: {status, stdout, stderr, time, memory}
   │
   ▼
Client
```

### Real-time Collaboration
```
Client 1              Client 2
   │                    │
   └─ WebSocket ────────┘
         │
         ▼
    websocket.js
         │
         ├─ Setup connection
         │
         └─► Yjs + LevelDB
             (document sync)
```

## 🔄 Module Dependency Graph

```
                    ┌─────────────┐
                    │  server.js  │
                    │ (Main Entry)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┬──────────────┐
              │            │            │              │
         ┌────▼────┐  ┌────▼────┐  ┌──▼───┐    ┌────▼──────┐
         │ config  │  │database  │  │ api  │    │ websocket │
         └────┬────┘  └────┬────┘  └─┬────┘    └─┬─────────┘
              │            │         │          │
              │       ┌────▼────┐    │          └──► utils.js
              │       │ mongodb  │    │
              │       └──────────┘    │
              │                       │
              └───────────┬───────────┘
                          │
                    ┌─────▼──────┐
                    │  models.js │
                    └──────┬─────┘
                           │
                    ┌──────▼────────┐
                    │ executor.js   │
                    │ (child_process)
                    └───────────────┘
```

## 📁 File Responsibilities

```
server/
│
├─ server.js (43 lines)
│  ├─ Imports all modules
│  ├─ Initialize config
│  ├─ Connect database
│  ├─ Start API server
│  ├─ Start WebSocket
│  └─ Handle shutdown
│
└─ src/
   │
   ├─ config.js (18 lines)
   │  └─ Environment variables
   │     • MONGODB_URI
   │     • HTTP_PORT
   │     • WS_PORT
   │     • CLIENT_ORIGINS
   │
   ├─ database.js (47 lines)
   │  ├─ MongoDB connection
   │  ├─ Index creation
   │  └─ CRUD operations
   │     • getRoomFromDB()
   │     • saveRoomToDB()
   │     • deleteRoomFromDB()
   │     • getRoomsFromDB()
   │
   ├─ models.js (50 lines)
   │  ├─ buildRoomPayload()
   │  ├─ createSubmissionEntry()
   │  └─ createExecutionResponse()
   │
   ├─ executor.js (220+ lines)
   │  ├─ executeCode() [Main]
   │  ├─ executeJavaScript()
   │  ├─ executePython()
   │  ├─ executeCpp()
   │  └─ executeJava()
   │
   ├─ api.js (128 lines)
   │  ├─ createApp()
   │  ├─ Endpoints
   │  │  ├─ GET /health
   │  │  ├─ GET /rooms/:id
   │  │  ├─ POST /rooms
   │  │  ├─ GET /rooms/:id/submissions
   │  │  ├─ POST /rooms/:id/submissions
   │  │  └─ POST /execute
   │  └─ Error handling
   │
   ├─ websocket.js (30 lines)
   │  ├─ createWebSocketServer()
   │  ├─ Connection handling
   │  ├─ Yjs integration
   │  └─ LevelDB persistence
   │
   └─ utils.js (35 lines)
      ├─ ensurePersistenceDir()
      └─ gracefulShutdown()
```

## 🔌 Endpoints Map

```
REST API (Express)
│
├─ GET  /api/health
│       └─ Health check
│
├─ GET  /api/rooms/:roomId
│       └─ Fetch room from MongoDB
│
├─ POST /api/rooms
│       ├─ Validate request
│       ├─ Generate roomId
│       ├─ Create payload
│       └─ Save to MongoDB
│
├─ GET  /api/rooms/:roomId/submissions
│       └─ Fetch submissions from MongoDB
│
├─ POST /api/rooms/:roomId/submissions
│       ├─ Fetch room
│       ├─ Add submission
│       └─ Save to MongoDB
│
└─ POST /api/execute
        ├─ Validate code
        ├─ Compile (if needed)
        ├─ Execute
        ├─ Format response
        └─ Send to client

WebSocket Server (Yjs)
│
└─ ws://localhost:1234
   ├─ Document updates
   ├─ Real-time sync
   └─ Persistence
```

## 🔄 Request Handling Flow

```
┌─ Incoming Request ─┐
│  POST /api/rooms   │
└────────┬───────────┘
         │
         ▼
    api.js
    ├─ Express route match
    ├─ Parse JSON body
    │
    ├─ Validate request
    │  └─ Check required fields
    │
    ├─ Call business logic
    │  └─ buildRoomPayload()
    │
    ├─ Persist data
    │  └─ saveRoomToDB()
    │     └─ MongoDB.updateOne()
    │
    ├─ Format response
    │  └─ JSON.stringify()
    │
    └─ Send HTTP response
       └─ 201 Created

┌─ Client Response ──┐
│  HTTP/201          │
│  {room object}     │
└────────────────────┘
```

## 💾 Database Integration

```
MongoDB Atlas / Local MongoDB
      │
      ├─ codesync (database)
      │
      └─ rooms (collection)
         │
         ├─ roomId (indexed)
         ├─ problem
         ├─ submissions []
         ├─ starterCode {}
         └─ defaultLanguage
```

## 🚀 Startup Sequence

```
Node.js Process Start
     │
     ▼
1. Import dotenv
   └─ Load .env file

     ▼
2. Import all modules
   ├─ config.js
   ├─ database.js
   ├─ models.js
   ├─ executor.js
   ├─ api.js
   ├─ websocket.js
   └─ utils.js

     ▼
3. ensurePersistenceDir()
   └─ Create ./db directory

     ▼
4. createApp()
   └─ Create Express app
      ├─ CORS setup
      ├─ JSON parser
      └─ Routes defined

     ▼
5. connectMongoDB()
   ├─ Create connection
   ├─ Create indexes
   └─ Log "Connected"

     ▼
6. app.listen(4000)
   ├─ Bind to port
   ├─ Error handler
   └─ Log "REST API listening"

     ▼
7. createWebSocketServer()
   ├─ Create WebSocket
   ├─ Bind to port 1234
   ├─ Error handler
   └─ Log "WebSocket listening"

     ▼
8. Setup signal handlers
   ├─ SIGINT (Ctrl+C)
   ├─ SIGTERM (kill)
   └─ SIGUSR2 (restart)

     ▼
✅ Server Ready
   └─ Listening to requests
```

## 🔐 Security Layers

```
Request → CORS Check → JSON Parse → Route Match 
    → Validate Input → Execute Logic 
    → Sanitize Output → Send Response
```

## 📈 Scaling Strategy

```
Current Setup (Single Process)
┌─ REST API (4000)
├─ WebSocket (1234)
└─ MongoDB (Remote)

Future: Multiple Processes
┌─ Load Balancer
├─ Process 1 (4001)
├─ Process 2 (4002)
├─ Process 3 (4003)
└─ MongoDB Cluster (Remote)
```

## ✨ Key Features

```
✅ Modular Design         Separated concerns
✅ Single Responsibility  Each file has one job
✅ Low Coupling          Minimal dependencies
✅ High Cohesion         Related code together
✅ Testable             Easy unit testing
✅ Scalable             Add features easily
✅ Maintainable         Clear structure
✅ Production Ready      Best practices
```

---

**Total Lines of Code Distribution:**
- Before: 538 lines (single file)
- After: ~570 lines (7 focused modules)

**Better organization with minimal code increase!** 🎉
