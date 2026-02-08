# CodeSync

> **Real-time collaborative coding platform for pair programming**

[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248)](https://www.mongodb.com/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-FF6B6B)](https://yjs.dev/)

---

## 📖 What Is This?

### The Real-World Problem

Imagine you're conducting a technical interview remotely. You need to:

> "See the candidate write code in real-time, just like you would in person."

At the same time, you want to:

> "Let them run the code, see the output, and collaborate together."

**CodeSync solves this** — a platform that enables:
1. Real-time collaborative code editing (like Google Docs)
2. Multi-language code execution with metrics
3. Persistent rooms with submission history

### What Is Real-Time Collaboration?

When two people edit the same document simultaneously, **conflicts happen**:

| Problem | Example |
|---------|---------|
| **Lost updates** | Alice types "hello", Bob types "world" → one gets lost |
| **Inconsistent state** | Alice sees "helloworld", Bob sees "worldhello" |
| **Race conditions** | Who typed first? Network latency makes this hard |

### How Does CodeSync Handle This?

**We use CRDTs (Conflict-free Replicated Data Types)** via **Yjs**:

```
┌──────────────────┐       ┌──────────────────┐
│   Alice's View   │       │    Bob's View    │
│  ─────────────── │       │  ─────────────── │
│  function foo()  │       │  function foo()  │
│    ↓ types "x"   │       │    ↓ types "y"   │
└────────┬─────────┘       └────────┬─────────┘
         │                          │
         ▼                          ▼
    ┌─────────────────────────────────────┐
    │         WebSocket Server            │
    │   (Yjs merges operations via CRDT)  │
    └─────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐
│   Alice sees:    │       │    Bob sees:     │
│  function fooxy  │       │  function fooxy  │
│  (SAME result!)  │       │  (SAME result!)  │
└──────────────────┘       └──────────────────┘
```

**No conflicts. No lost updates. Always consistent.**

### Why Is This Hard?

Building a simple shared document is easy. Building a **production-grade collaborative coding platform** is hard because:

| Challenge | Why It Matters |
|-----------|----------------|
| **Latency** | Typing must feel instant, even over slow networks |
| **Consistency** | Everyone must see the same code, always |
| **Persistence** | If the server restarts, no code should be lost |
| **Execution** | Running code requires sandboxing and resource limits |
| **Multi-cursor** | See where collaborators are typing in real-time |

### What Makes This Project Special?

| Feature | Implementation |
|---------|----------------|
| **CRDT-based sync** | Yjs handles merge conflicts automatically |
| **Monaco Editor** | Same editor as VS Code |
| **Real execution metrics** | Actual time (ms) and memory (KB) reported |
| **Persistent rooms** | MongoDB + LevelDB for durability |
| **Theme support** | Dark/light mode with Tailwind CSS v4 |

---

## 🎯 Project Goal

Build a **real-time collaborative coding platform** suitable for:
- Technical interviews
- Pair programming sessions
- Coding workshops and education

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React + Vite)                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
│  │  Monaco       │  │  Problem      │  │  Test Cases   │               │
│  │  Editor       │  │  Description  │  │  & Results    │               │
│  │  (yCode)      │  │  (yProblem)   │  │  (yTestCases) │               │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘               │
│          │                  │                  │                        │
│          └──────────────────┼──────────────────┘                        │
│                             │                                           │
│                    ┌────────▼────────┐                                  │
│                    │  WebSocket      │                                  │
│                    │  (y-websocket)  │                                  │
│                    └────────┬────────┘                                  │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   WebSocket       │ Port 1234
                    │   Server (Yjs)    │
                    │   + LevelDB       │
                    └─────────┬─────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                           │
│                             │                                           │
│  ┌──────────────────────────▼──────────────────────────────────────┐    │
│  │                         REST API                                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │ POST /rooms │  │ GET /rooms  │  │ POST /execute           │  │   │
│  │  │ (create)    │  │ (fetch)     │  │ (run code)              │  │   │
│  │  └─────────────┘  └─────────────┘  └───────────┬─────────────┘  │   │
│  └────────────────────────────────────────────────┼─────────────────┘   │
│                                                   │                     │
│  ┌────────────────────────────────────────────────▼─────────────────┐   │
│  │                        EXECUTOR                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │  │
│  │  │  C++ (g++)  │  │  Python 3   │  │   Node.js   │  │  Java    │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘  │  │
│  │                                                                   │  │
│  │  Returns: { stdout, stderr, time (s), memory (KB), status }      │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                   │                     │
│  ┌────────────────────────────────────────────────▼─────────────────┐   │
│  │                        MongoDB                                    │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │
│  │  │   Rooms     │  │  Problems   │  │     Submissions         │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Key Design Decisions

| Decision | Rationale | Interview Defense |
|----------|-----------|-------------------|
| **Yjs for sync** | CRDTs guarantee eventual consistency without central locking | "OT (Operational Transform) requires a central server; CRDTs work peer-to-peer." |
| **Monaco Editor** | Industry-standard (VS Code), rich API, IntelliSense support | "Users already know this editor. Zero learning curve." |
| **LevelDB persistence** | Fast key-value store for Yjs document state | "Embedded DB, no separate process. Perfect for document storage." |
| **BigInt timing** | `process.hrtime.bigint()` for nanosecond precision | "Date.now() resolution is ms. We need sub-ms accuracy." |
| **Separate WS port** | Isolate real-time traffic from REST API | "WebSocket upgrades can block HTTP. Separate ports = separate concerns." |
| **Tailwind v4 dark mode** | CSS-based class strategy with `@custom-variant` | "v4 moves config to CSS. Smaller bundle, faster builds." |

---

## � Project Structure

```
CodeSync/
├── client/                          # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── CodePane.tsx         # Monaco editor wrapper
│   │   │   ├── Modal.tsx            # Reusable confirmation modal
│   │   │   ├── NotesPane.tsx        # Collaborative notes
│   │   │   ├── ProblemPane.tsx      # Problem description editor
│   │   │   ├── TestcasePane.tsx     # Input/output test cases
│   │   │   ├── TestResultPane.tsx   # Execution results display
│   │   │   ├── SubmissionsPane.tsx  # Submission history
│   │   │   ├── LeftPaneTabs.tsx     # Tab navigation
│   │   │   └── EditorHeader.tsx     # Language selector + controls
│   │   ├── pages/
│   │   │   ├── HomePage.tsx         # Room creation/joining
│   │   │   └── RoomPage.tsx         # Main collaboration room
│   │   ├── context/
│   │   │   └── ThemeContext.tsx     # Dark/light mode provider
│   │   ├── lib/
│   │   │   └── api.ts               # REST API client
│   │   ├── config/
│   │   │   └── env.ts               # Environment configuration
│   │   └── index.css                # Tailwind v4 imports
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
│
├── server/                          # Node.js + Express
│   ├── src/
│   │   ├── api.js                   # REST endpoints
│   │   ├── executor.js              # Code execution engine
│   │   ├── database.js              # MongoDB operations
│   │   ├── websocket.js             # Yjs WebSocket server
│   │   ├── models.js                # Data models + starter code
│   │   └── config.js                # Environment config
│   ├── server.js                    # Entry point
│   └── package.json
│
├── docker-compose.yml               # MongoDB container
└── README.md                        # This file
```

---

## 🧱 Core Components

### 1. Yjs Document Structure

Each room has three synchronized Yjs Text types:

```typescript
const ydoc = new Y.Doc()

// Synced across all clients in the room
const yCode = ydoc.getText('code')           // Editor content
const yProblem = ydoc.getText('problem')     // Problem description
const yTestCases = ydoc.getText('testcases') // Test case inputs
```

**Why separate Y.Text instances?**
- Independent undo/redo stacks
- Can sync different parts at different frequencies
- Cleaner conflict resolution

### 2. Code Executor

```javascript
// executor.js - Execution with metrics
export async function executeCode(code, language, input) {
  const startTime = process.hrtime.bigint()
  const startMem = process.memoryUsage()
  
  const result = await runInSandbox(code, language, input)
  
  const endTime = process.hrtime.bigint()
  const endMem = process.memoryUsage()
  
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: determineStatus(result),
    time: Number(endTime - startTime) / 1e9,  // seconds
    memory: (endMem.heapUsed - startMem.heapUsed) / 1024  // KB
  }
}
```

**Supported Languages:**

| Language | Compiler/Runtime | Template |
|----------|------------------|----------|
| C++ | g++ -std=c++17 | iostream main() |
| JavaScript | Node.js | solution() function |
| Python | python3 | solution() with main guard |
| Java | javac + java | Main class |

### 3. Room Lifecycle

```
┌─────────────────┐
│  User Visits    │
│  HomePage       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Create Room    │────►│  POST /api/rooms │
│  (New Code)     │     │  → MongoDB insert│
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Navigate to    │────►│  WebSocket      │
│  /room/:id      │     │  Connection     │
└────────┬────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Yjs syncs      │
│  code/problem   │
│  across clients │
└─────────────────┘
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/api/health` | Health check | - |
| POST | `/api/rooms` | Create room | `{ createdBy, title }` |
| GET | `/api/rooms/:id` | Get room details | - |
| POST | `/api/execute` | Execute code | `{ code, language, input }` |
| POST | `/api/rooms/:id/submissions` | Save submission | `{ code, language, ... }` |
| GET | `/api/rooms/:id/submissions` | Get submissions | - |

### Execute Response

```json
{
  "status": "Accepted",
  "language": "javascript",
  "stdout": "Hello World!\n",
  "stderr": "",
  "time": 0.042,
  "memory": 128,
  "submittedAt": "2024-02-08T14:30:00.000Z"
}
```

**Status Values:**

| Status | Meaning |
|--------|---------|
| `Accepted` | Code ran successfully |
| `Runtime Error` | Exception or crash |
| `Compilation Error` | Syntax error (C++/Java) |
| `Time Limit Exceeded` | Exceeded 10s timeout |

---

## 🎨 Theme System

**Tailwind CSS v4 Configuration:**

```css
/* index.css */
@import "tailwindcss";

/* Enable dark mode with class strategy */
@custom-variant dark (&:where(.dark, .dark *));
```

**Theme Context:**

```typescript
// ThemeContext.tsx
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => 
    localStorage.getItem('theme') ?? 'dark'
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  
  return <ThemeContext.Provider value={{ theme, setTheme }}>
    {children}
  </ThemeContext.Provider>
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- g++ (for C++ execution)
- Python 3 (for Python execution)
- Java 17+ (for Java execution)

### Installation

```bash
# Clone the repository
git clone https://github.com/CosmicTH0R/CodeSync.git
cd CodeSync

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Configuration

```bash
# server/.env
MONGODB_URI=mongodb://localhost:27017/codesync
HTTP_PORT=4000
WS_PORT=1234
CLIENT_ORIGINS=http://localhost:5173
```

### Running

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

Open http://localhost:5173 🎉

---

## 🧪 Testing

### Manual Testing Flow

1. Create a room on HomePage
2. Copy room link and open in second browser
3. Type in one browser → see changes in other
4. Run code and verify metrics
5. Switch themes and verify UI

### Key Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Concurrent typing | Both users see merged result |
| Language switch | Modal prompts for template |
| Reset code | Modal confirms action |
| Room refresh | Code persists from LevelDB |
| Network disconnect | Reconnects and syncs |

---

## 🎓 Interview Defense Cheat Sheet

**Q: Why Yjs instead of Operational Transform (OT)?**
> CRDTs don't require a central coordinator. Each client can apply operations locally and sync later. OT requires a server to transform operations, adding latency and complexity.

**Q: How do you handle conflicts?**
> Yjs uses a CRDT called Y.Text. It assigns unique IDs to each character insertion based on client ID + logical clock. Conflicts are resolved deterministically by ordering these IDs.

**Q: Why separate WebSocket and HTTP ports?**
> WebSocket connections are long-lived. HTTP is request-response. Mixing them on one port can cause head-of-line blocking. Separation allows independent scaling.

**Q: How do you measure execution time accurately?**
> `process.hrtime.bigint()` provides nanosecond precision using the monotonic clock. `Date.now()` is wall-clock time with only millisecond resolution and can be affected by NTP adjustments.

**Q: Why MongoDB for rooms but LevelDB for Yjs?**
> MongoDB stores structured data (room metadata, submissions). LevelDB is optimized for key-value blobs (Yjs binary document updates). Each tool fits its use case.

**Q: How do you prevent code injection?**
> Code runs in a child process with:
> - Timeout (10s max)
> - Temp file isolation
> - No network access (future: Docker sandbox)

---

## 🛡️ Security Considerations

| Risk | Mitigation |
|------|------------|
| Code injection | Sandboxed execution, timeouts |
| XSS | React auto-escapes, CSP headers |
| CSRF | Same-origin WebSocket validation |
| DoS | Rate limiting (TODO) |
| Data leak | Room IDs are UUIDs (hard to guess) |

---

## 📍 Roadmap

- [x] **Phase 1**: Core real-time editor with Yjs
- [x] **Phase 2**: Multi-language code execution
- [x] **Phase 3**: Execution metrics (time/memory)
- [x] **Phase 4**: Dark/Light theme support
- [x] **Phase 5**: Custom modal UI components
- [x] **Phase 6**: Language templates
- [x] **Phase 7**: Docker-based sandboxing
- [ ] **Phase 8**: Authentication & rate limiting
- [ ] **Phase 9**: Room expiration & cleanup
- [ ] **Phase 10**: Video/voice integration

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

<p align="center">
  <b>Built for collaboration. Designed for interviews. Ready for pair programming.</b>
</p>
