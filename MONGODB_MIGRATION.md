# MongoDB Migration Summary

## What Changed

### Storage Migration
- **Before**: Data stored in `rooms-state.json` (file-based)
- **After**: Data stored in MongoDB (database)

### Benefits
1. **Scalability**: Handle millions of rooms efficiently
2. **Concurrency**: Multiple servers can write simultaneously
3. **Queries**: Rich query capabilities (search, filter, sort)
4. **Real-time**: Better support for collaborative features
5. **Cloud Ready**: Easy to deploy to production services (AWS, GCP, Azure)
6. **Backups**: Built-in backup and recovery tools

### Code Changes in server.js

**New Functions:**
- `connectMongoDB()` - Establishes connection to MongoDB
- `getRoomFromDB(roomId)` - Fetches single room
- `getRoomsFromDB()` - Fetches all rooms
- `saveRoomToDB(room)` - Saves/updates room data
- `deleteRoomFromDB(roomId)` - Deletes room

**Updated Endpoints:**
- `GET /api/rooms/:roomId` - Now fetches from MongoDB
- `POST /api/rooms` - Saves new rooms to MongoDB
- `GET /api/rooms/:roomId/submissions` - Fetches from MongoDB
- `POST /api/rooms/:roomId/submissions` - Saves submissions to MongoDB

**Removed:**
- File-based persistence (`rooms-state.json`)
- `loadRoomsFromDisk()` function
- `persistRoomsToDisk()` function
- `roomsStore` Map (in-memory storage)

## Installation Steps

### 1. Install MongoDB
**Option A: Local (Windows)**
- Download from: https://www.mongodb.com/try/download/community
- Run installer with "Install as Service" option

**Option B: Docker**
```bash
cd C:\CodeSync - Copy
docker-compose up -d
```

**Option C: MongoDB Atlas (Cloud)**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create cluster and get connection string

### 2. Update .env
```
MONGODB_URI=mongodb://localhost:27017/codesync
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codesync
```

### 3. Restart Server
```bash
cd C:\CodeSync - Copy\server
npm install mongodb  # Already done
node server.js
```

## Data Format
All room data in MongoDB follows this structure:
```javascript
{
  roomId: "uuid",
  createdBy: "username",
  createdAt: "2025-11-14T...",
  problem: {
    id: "uuid",
    title: "",
    difficulty: "Custom",
    description: "",
    constraints: [],
    examples: []
  },
  defaultLanguage: "cpp",
  starterCode: { cpp: "", javascript: "", python: "", java: "" },
  defaultTestCases: "",
  submissions: [
    {
      id: "uuid",
      code: "...",
      language: "cpp",
      status: "Accepted",
      stdout: "...",
      stderr: "",
      createdAt: "2025-11-14T..."
    }
  ]
}
```

## Migration Notes
- Old `rooms-state.json` is NOT automatically migrated
- If you need old data, manually import it or start fresh
- Database automatically creates indexes for fast lookups
- MongoDB will handle all persistence automatically

## Deployment Considerations
- **Local dev**: Use `mongodb://localhost:27017/codesync`
- **Production**: Use MongoDB Atlas or managed MongoDB service
- **Environment variables**: Store `MONGODB_URI` securely in your hosting platform
- **Connection pooling**: MongoDB driver handles connection pooling automatically
- **Scaling**: MongoDB can handle thousands of concurrent users
