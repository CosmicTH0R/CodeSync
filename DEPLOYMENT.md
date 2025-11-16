# Deployment Guide

## Pre-Deployment Checklist

- [x] Local code execution implemented (C++, Java, Python, JavaScript)
- [x] MongoDB integration complete
- [x] Environment variables configured
- [x] Error handling in place
- [ ] Set up MongoDB in production
- [ ] Configure environment variables in hosting platform
- [ ] Test full workflow in production environment

## Deployment Options

### Option 1: Vercel (Recommended for Frontend)
**Frontend deployment:**
```bash
cd client
npm install
npm run build
# Deploy the dist/ folder to Vercel
```

**Notes:**
- Frontend is static after build
- Just need to point API_BASE_URL to your backend

### Option 2: Railway/Render (Recommended for Backend + MongoDB)
**Create account:**
1. Sign up at railway.app or render.com
2. Connect GitHub repository

**Environment Variables to Set:**
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codesync
HTTP_PORT=4000
WS_PORT=1234
CLIENT_ORIGINS=https://yourdomain.com
```

**Deploy Backend:**
```bash
git push  # They auto-deploy
```

### Option 3: AWS/Google Cloud (Advanced)
**Backend:**
- EC2 instance (AWS) or Compute Engine (Google Cloud)
- Install Node.js and MongoDB (or use cloud MongoDB service)
- Run: `node server.js`

**Database:**
- Use AWS RDS (MongoDB), Google Cloud Database, or MongoDB Atlas

### Option 4: Docker Deployment (Recommended)
**Build & Run Locally:**
```bash
cd C:\CodeSync - Copy
docker-compose up -d  # Starts MongoDB
cd server
docker build -t codesync-server .
docker run -p 4000:4000 -p 1234:1234 --env-file .env codesync-server
```

## Setup Production MongoDB

### Using MongoDB Atlas (Free Tier Available)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and login
3. Create new project → Create cluster (M0 free tier)
4. Add IP address: Allow access from anywhere (0.0.0.0/0) for simplicity
5. Create database user with username/password
6. Copy connection string: `mongodb+srv://user:password@cluster.mongodb.net/codesync`
7. Add to your `.env`:
```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codesync
```

## Environment Variables Required

Create `.env` file in `/server`:
```
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/codesync

# Server
HTTP_PORT=4000
WS_PORT=1234
NODE_ENV=production

# CORS
CLIENT_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Optional
JUDGE0_API_KEY=your_key_here
```

## Security Best Practices

1. **Never commit .env file** - Add to `.gitignore`
2. **Use environment variables** for all secrets
3. **Enable CORS only for your domain** - Update CLIENT_ORIGINS
4. **Rate limit API** - Add rate limiting middleware
5. **Validate user input** - Sanitize all incoming data
6. **Set resource limits** - Code execution timeout: 5 seconds
7. **Monitor MongoDB** - Enable auto-backups in Atlas
8. **Use HTTPS** - Essential for production
9. **Add authentication** - For submission history (future enhancement)

## Post-Deployment Testing

```bash
# Test REST API
curl http://your-domain:4000/api/rooms

# Test WebSocket
# Use browser DevTools to verify WebSocket connection to ws://your-domain:1234

# Test code execution
curl -X POST http://your-domain:4000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"#include <iostream>\nint main() { std::cout << \"Hello\"; return 0; }", "language":"cpp"}'
```

## Troubleshooting

**MongoDB Connection Error:**
- Check MONGODB_URI is correct
- Verify MongoDB is running
- Check IP whitelist on MongoDB Atlas

**WebSocket Connection Failed:**
- Ensure WS_PORT is open on firewall
- Check CORS settings
- Verify CLIENT_ORIGINS includes your domain

**Code Execution Timeout:**
- C++/Java compilation takes time
- Increase timeout in server.js if needed
- Use pre-compiled binaries for production

**Performance Issues:**
- Add MongoDB indexes (already done in code)
- Enable connection pooling (automatic)
- Implement caching for frequently accessed rooms

## Monitoring & Logs

**Access logs:**
- Most hosting platforms provide log viewing
- Check WebSocket connections
- Monitor code execution times

**Database backups:**
- MongoDB Atlas: Automatic daily backups
- Set retention policy: 7-30 days recommended

## Next Steps

1. Set up MongoDB Atlas cluster
2. Deploy to Railway or Vercel
3. Update frontend API endpoint
4. Test all features in production
5. Monitor for errors and performance issues
6. Plan for scaling as user base grows
