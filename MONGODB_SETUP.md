# MongoDB Setup Guide for Windows

## Option 1: Using MongoDB Community Edition (Local Installation)
1. Download from: https://www.mongodb.com/try/download/community
2. Run the installer (.msi file)
3. During installation, select "Install MongoDB as a Service"
4. MongoDB will start automatically
5. Test connection: `mongosh` or `mongo`

## Option 2: Using Docker (Recommended for Deployment)
1. Install Docker Desktop from: https://www.docker.com/products/docker-desktop
2. Run MongoDB container:
   ```bash
   cd C:\CodeSync - Copy
   docker-compose up -d
   ```
3. MongoDB will be available at `mongodb://localhost:27017`

## Option 3: Using MongoDB Atlas (Cloud - Best for Production)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string like: `mongodb+srv://user:password@cluster.mongodb.net/codesync`
4. Update `.env` file with your connection string
5. Update `MONGODB_URI` in `server/.env`

## Testing MongoDB Connection
After setting up, test with:
```bash
# Using Node.js in your project directory
node -e "const { MongoClient } = require('mongodb'); new MongoClient('mongodb://localhost:27017').connect().then(() => console.log('Connected!')).catch(e => console.error(e))"
```

## Current Setup
Your server.js is now configured to use MongoDB at: `mongodb://localhost:27017/codesync`

Update this in server/.env if you use a different connection string.
