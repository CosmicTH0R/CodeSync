# Server Module Usage Examples

## Quick Reference

### Using Config Module

```javascript
import { config } from './src/config.js';

console.log(config.HTTP_PORT);      // 4000
console.log(config.WS_PORT);        // 1234
console.log(config.MONGODB_URI);    // mongodb://...
console.log(config.CLIENT_ORIGINS); // ['http://localhost:5173']
console.log(config.PERSISTENCE_DIR);// ./db
```

---

## Database Module Examples

### Get a Single Room

```javascript
import { getRoomFromDB } from './src/database.js';

const room = await getRoomFromDB('550e8400-e29b-41d4-a716-446655440000');

if (room) {
  console.log(room.problem.title);
  console.log(room.submissions.length);
}
```

### Save a Room

```javascript
import { saveRoomToDB } from './src/database.js';

const room = {
  roomId: 'uuid',
  createdBy: 'user123',
  createdAt: new Date().toISOString(),
  problem: { ... },
  submissions: [ ... ]
};

await saveRoomToDB(room);
console.log('Room saved!');
```

### Fetch All Rooms

```javascript
import { getRoomsFromDB } from './src/database.js';

const allRooms = await getRoomsFromDB();
console.log(`Found ${allRooms.length} rooms`);

allRooms.forEach(room => {
  console.log(`${room.roomId}: ${room.problem.title || 'Untitled'}`);
});
```

### Delete a Room

```javascript
import { deleteRoomFromDB } from './src/database.js';

await deleteRoomFromDB('550e8400-e29b-41d4-a716-446655440000');
console.log('Room deleted!');
```

---

## Models Module Examples

### Create a New Room

```javascript
import { buildRoomPayload } from './src/models.js';
import { v4 as uuid } from 'uuid';

const room = buildRoomPayload({
  roomId: uuid(),
  createdBy: 'alice@example.com',
  title: 'Two Sum Problem'
});

console.log(room);
// Output:
// {
//   roomId: '...',
//   createdBy: 'alice@example.com',
//   createdAt: '2025-11-14T...',
//   problem: {
//     id: '...',
//     title: 'Two Sum Problem',
//     difficulty: 'Custom',
//     description: '',
//     constraints: [],
//     examples: []
//   },
//   defaultLanguage: 'cpp',
//   starterCode: { cpp: '', javascript: '', python: '', java: '' },
//   defaultTestCases: '',
//   submissions: []
// }
```

### Create a Submission Entry

```javascript
import { createSubmissionEntry } from './src/models.js';

const submission = createSubmissionEntry(
  'console.log("hello");',           // code
  '',                                // input
  'javascript',                      // language
  'hello\n',                         // stdout
  '',                                // stderr
  'Accepted'                         // status
);

console.log(submission);
// Output:
// {
//   id: '...',
//   code: 'console.log("hello");',
//   input: '',
//   stdout: 'hello\n',
//   stderr: '',
//   language: 'javascript',
//   status: 'Accepted',
//   createdAt: '2025-11-14T...'
// }
```

### Create Execution Response

```javascript
import { createExecutionResponse } from './src/models.js';

const executionResult = {
  status: 'Accepted',
  stdout: 'Hello World',
  stderr: '',
  time: 0.123,
  memory: 2048
};

const response = createExecutionResponse(
  executionResult,
  'cpp',
  'John Doe'
);

console.log(response);
// Output:
// {
//   status: 'Accepted',
//   language: 'cpp',
//   input: 'John Doe',
//   stdout: 'Hello World',
//   stderr: '',
//   message: 'Code executed successfully.',
//   time: 0.123,
//   memory: 2048,
//   submittedAt: '2025-11-14T...'
// }
```

---

## Executor Module Examples

### Execute JavaScript

```javascript
import { executeCode } from './src/executor.js';

const result = await executeCode(
  'javascript',
  'console.log("Hello, World!");',
  ''
);

console.log(result);
// Output:
// {
//   status: 'Accepted',
//   stdout: 'Hello, World!\n',
//   stderr: '',
//   time: 0,
//   memory: 0
// }
```

### Execute C++ Code

```javascript
import { executeCode } from './src/executor.js';

const cppCode = `
#include <iostream>
using namespace std;

int main() {
    int a = 5, b = 3;
    cout << a + b << endl;
    return 0;
}
`;

const result = await executeCode('cpp', cppCode, '');

console.log(result);
// Output:
// {
//   status: 'Accepted',
//   stdout: '8\n',
//   stderr: '',
//   time: 0,
//   memory: 0
// }
```

### Execute with Input

```javascript
import { executeCode } from './src/executor.js';

const pythonCode = `
a = int(input())
b = int(input())
print(a + b)
`;

const result = await executeCode('python', pythonCode, '10\n20\n');

console.log(result);
// Output:
// {
//   status: 'Accepted',
//   stdout: '30\n',
//   stderr: '',
//   time: 0,
//   memory: 0
// }
```

### Handle Compilation Error

```javascript
import { executeCode } from './src/executor.js';

const badCode = `
#include <iostream>
int main() {
    cout << "Missing semicolon"
    return 0;
}
`;

const result = await executeCode('cpp', badCode, '');

console.log(result);
// Output:
// {
//   status: 'Compilation Error',
//   stdout: '',
//   stderr: '... error: expected \';\' ...',
//   time: 0,
//   memory: 0
// }
```

---

## API Module Examples

### Using the Express App

```javascript
import { createApp } from './src/api.js';

const app = createApp();

// App is ready to use with all endpoints
// All 6 endpoints are pre-configured:
// - GET /api/health
// - GET /api/rooms/:roomId
// - POST /api/rooms
// - GET /api/rooms/:roomId/submissions
// - POST /api/rooms/:roomId/submissions
// - POST /api/execute

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
```

### Adding Custom Middleware

```javascript
import { createApp } from './src/api.js';

const app = createApp();

// Add custom middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.listen(4000);
```

### Error Handling

```javascript
import { createApp, handlePortError } from './src/api.js';

const app = createApp();
const server = app.listen(4000);

server.on('error', (error) => {
  handlePortError(error, 4000, 'REST API');
});
```

---

## WebSocket Module Examples

### Create WebSocket Server

```javascript
import { createWebSocketServer } from './src/websocket.js';

const wss = createWebSocketServer();

console.log('WebSocket server created on port 1234');

// Server handles connections automatically
// Supports real-time collaboration via Yjs
```

### Handle Connection Errors

```javascript
import { createWebSocketServer } from './src/websocket.js';
import { handlePortError } from './src/api.js';

const wss = createWebSocketServer();

wss.on('error', (error) => {
  handlePortError(error, 1234, 'WebSocket');
});
```

---

## Utils Module Examples

### Ensure Persistence Directory

```javascript
import { ensurePersistenceDir } from './src/utils.js';

ensurePersistenceDir();
// Creates ./db directory if it doesn't exist
```

### Graceful Shutdown

```javascript
import { gracefulShutdown } from './src/utils.js';

const httpServer = app.listen(4000);
const wss = createWebSocketServer();

const shutdown = gracefulShutdown(
  'SIGINT',
  httpServer,
  wss,
  closeMongoDB
);

process.on('SIGINT', shutdown);
```

---

## Complete Example: Custom Endpoint

Add a new endpoint to fetch statistics without touching other files:

### Modify `src/api.js`

```javascript
import { getRoomsFromDB } from './database.js';

export const createApp = () => {
  // ... existing code ...

  // New endpoint
  app.get('/api/stats', async (req, res) => {
    try {
      const rooms = await getRoomsFromDB();
      const stats = {
        totalRooms: rooms.length,
        totalSubmissions: rooms.reduce(
          (sum, room) => sum + (room.submissions?.length || 0),
          0
        ),
        languages: {},
        timestamp: new Date().toISOString()
      };

      // Count by language
      rooms.forEach(room => {
        room.submissions?.forEach(sub => {
          stats.languages[sub.language] = 
            (stats.languages[sub.language] || 0) + 1;
        });
      });

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return app;
};
```

### Test It

```bash
curl http://localhost:4000/api/stats

# Response:
# {
#   "totalRooms": 4,
#   "totalSubmissions": 3,
#   "languages": {
#     "cpp": 2,
#     "javascript": 1
#   },
#   "timestamp": "2025-11-14T12:34:56.789Z"
# }
```

**Easy!** No touching other files needed. 🎉

---

## Testing Pattern

```javascript
// test/database.test.js
import { getRoomFromDB, saveRoomToDB } from '../src/database.js';

describe('Database', () => {
  it('should save and retrieve a room', async () => {
    const room = { roomId: 'test-123', problem: { title: 'Test' } };
    
    await saveRoomToDB(room);
    const retrieved = await getRoomFromDB('test-123');
    
    expect(retrieved.roomId).toBe('test-123');
  });
});
```

---

## Environment Variables Pattern

```javascript
// .env.local (for local testing)
MONGODB_URI=mongodb://localhost:27017/codesync-test
HTTP_PORT=3000
WS_PORT=3001
```

---

## Integration Example

Combining modules for a feature:

```javascript
import { buildRoomPayload } from './models.js';
import { saveRoomToDB, getRoomFromDB } from './database.js';
import { createSubmissionEntry } from './models.js';
import { executeCode } from './executor.js';
import { v4 as uuid } from 'uuid';

// Create a room
const room = buildRoomPayload({
  roomId: uuid(),
  createdBy: 'user@example.com',
  title: 'Palindrome Check'
});

await saveRoomToDB(room);

// Execute code
const code = 'console.log("test")';
const result = await executeCode('javascript', code, '');

// Save submission
const submission = createSubmissionEntry(
  code,
  '',
  'javascript',
  result.stdout,
  result.stderr,
  result.status
);

room.submissions.push(submission);
await saveRoomToDB(room);

console.log('Complete workflow executed successfully!');
```

---

**All modules work together seamlessly with clean, simple interfaces!** 🚀
