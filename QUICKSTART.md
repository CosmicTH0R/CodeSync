# Quick Start: Running CodeSync with MongoDB

## Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas cloud)

## Option A: Local MongoDB Setup (Windows)

### 1. Install MongoDB Community Edition
- Download: https://www.mongodb.com/try/download/community
- Run installer
- During installation, check "Install MongoDB as a Service"
- MongoDB will auto-start

### 2. Verify Installation
```powershell
mongosh
# Should connect to local MongoDB
# Type: exit
```

### 3. Run CodeSync
```powershell
# Terminal 1: Start Backend
cd 'C:\CodeSync - Copy\server'
node server.js

# Terminal 2: Start Frontend  
cd 'C:\CodeSync - Copy\client'
npm run dev
```

### 4. Open Browser
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

---

## Option B: MongoDB Atlas (Cloud)

### 1. Create Free MongoDB Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free account)
3. Create cluster (M0 free tier)
4. Wait for cluster to be ready (~5 mins)

### 2. Get Connection String
1. Click "Connect" button
2. Add IP: 0.0.0.0/0 (allow anywhere)
3. Create database user (username + password)
4. Copy connection string: `mongodb+srv://user:password@cluster.mongodb.net/codesync`

### 3. Update .env
Open `server/.env` and update:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codesync
```

### 4. Run CodeSync
```powershell
# Terminal 1: Start Backend
cd 'C:\CodeSync - Copy\server'
node server.js

# Terminal 2: Start Frontend
cd 'C:\CodeSync - Copy\client'
npm run dev
```

---

## Verify It's Working

### Check Backend
```powershell
curl http://localhost:4000/api/rooms
# Should return: []
```

### Create a Test Room
```powershell
curl -X POST http://localhost:4000/api/rooms `
  -H "Content-Type: application/json" `
  -d '{"title":"Test Problem","createdBy":"TestUser"}'
# Should return room details
```

### Check MongoDB Directly
```powershell
mongosh
use codesync
db.rooms.find()
# Should show your test room
```

---

## Troubleshooting

**Error: MongoDB connection failed**
- Local: Is mongod running? Check Services app
- Atlas: Wrong connection string? Copy it exactly
- Atlas: IP whitelist? Make sure 0.0.0.0/0 is added

**Port already in use**
- Change ports in `.env`:
  ```
  HTTP_PORT=5000
  WS_PORT=5001
  ```

**Code execution not working**
- C++: Need `g++` installed (comes with most dev tools)
- Python: Need `python` in PATH
- Java: Need `javac` and `java` installed

---

## What's Next?

1. ✅ Local development works
2. ⚠️ **Ready to Deploy** - See DEPLOYMENT.md
3. 📱 Add user authentication (optional)
4. 🔄 Add real-time collaboration features
5. 📊 Add problem difficulty ratings

---

## File Structure
```
C:\CodeSync - Copy\
├── server/
│   ├── server.js           # Main backend (uses MongoDB)
│   ├── .env               # Config (MONGODB_URI, ports)
│   └── package.json       # Dependencies
├── client/
│   ├── src/
│   ├── vite.config.ts
│   └── package.json
├── docker-compose.yml     # For MongoDB Docker setup
├── MONGODB_SETUP.md       # Detailed MongoDB setup
├── MONGODB_MIGRATION.md   # What changed in migration
└── DEPLOYMENT.md          # Production deployment guide
```

Enjoy coding! 🚀
