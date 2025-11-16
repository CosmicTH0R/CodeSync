# Docker-based Secure Code Execution

This system provides sandboxed, multi-user code execution using Docker containers with strict resource limits.

## Architecture

```
User Code → Queue → Docker Container → Output → WebSocket Broadcast
```

### Components

1. **Execution Queue** (`server/src/execution-queue.js`)
   - Manages up to 3 concurrent executions
   - Prevents resource exhaustion
   - Supports callbacks for completion/error handling

2. **Docker Executor** (`server/src/docker-executor.js`)
   - Runs code in isolated containers
   - Resource limits:
     - Memory: 256 MB
     - CPU: 0.5 cores
     - Time: 5 seconds
     - Network: Disabled
   - Temporary filesystem per execution
   - Automatic cleanup

3. **API Integration** (`server/src/api.js`)
   - `POST /api/execute` queues code execution
   - Returns immediately with job ID
   - Results broadcast via WebSocket
   - `GET /api/queue/stats` shows queue status

4. **WebSocket Broadcasting** (`server/src/websocket.js`)
   - Broadcasts execution results to all connected clients in a room
   - Real-time updates for multiple users

## Setup

### Prerequisites

- Docker installed and running
- Node.js 18+
- MongoDB (Docker or local)

### Steps

1. **Build Docker Image**

```bash
cd server
docker build -t codesync-executor:latest -f Dockerfile .
```

2. **Start Backend**

```bash
cd server
npm run dev
```

The server will:
- Check Docker availability
- Connect to MongoDB
- Start REST API on port 4000
- Start WebSocket server on port 1234
- Initialize execution queue

3. **Verify Setup**

```bash
# Check Docker image
docker images | grep codesync-executor

# Check health
curl http://localhost:4000/api/health

# Check queue stats
curl http://localhost:4000/api/queue/stats
```

## Security Features

✅ **Process Isolation**: Each execution runs in a separate Docker container
✅ **Resource Limits**: CPU, memory, and time limits prevent DoS
✅ **Network Disabled**: No internet access inside containers
✅ **Read-only Filesystem**: Only `/tmp` is writable
✅ **Non-root User**: Code runs as unprivileged `executor` user
✅ **Immediate Cleanup**: Containers destroyed after execution
✅ **Input/Output Validation**: Limited to 10 MB output

## Supported Languages

- C++ (g++ with O2 optimization)
- Python 3
- JavaScript (Node.js)
- Java 17

## Execution Flow

1. **Client** → Sends `POST /api/execute` with code
2. **API** → Validates and enqueues job (returns immediately with jobId)
3. **Queue** → Waits for slot (max 3 concurrent)
4. **Executor** → Creates Docker container and runs code
5. **Container** → Compiles (if needed) and executes with input
6. **Result** → Sent via WebSocket to all clients in room
7. **Cleanup** → Container destroyed, temp files removed

## Fallback Mode

If Docker is unavailable, the system automatically falls back to local execution using Node.js `child_process`. This is suitable for development but **not for production multi-user environments**.

## Monitoring

Check queue status:
```bash
curl http://localhost:4000/api/queue/stats
```

Response:
```json
{
  "queued": 2,
  "active": 1,
  "maxConcurrent": 3
}
```

## Performance

- **Typical Execution**: 200-500ms (including container overhead)
- **Queue Throughput**: 3 concurrent executions
- **Memory Per Container**: 256 MB
- **Total Safe Load**: ~768 MB (3 × 256 MB)

## Next Steps (Production)

1. Replace in-memory queue with Redis Queue or RabbitMQ
2. Add WebSocket room tracking for accurate broadcast filtering
3. Implement execution result persistence
4. Add rate limiting per user
5. Monitor Docker daemon health
6. Implement metric collection (Prometheus)
7. Add container image versioning
8. Set up container registry for scaling

## Troubleshooting

**Docker not found**
```bash
docker --version  # Should print version
systemctl start docker  # On Linux
```

**Container fails to build**
```bash
docker build -t codesync-executor:latest -f Dockerfile . --no-cache
```

**Queue stuck**
```bash
# Check active containers
docker ps | grep codesync

# Kill stuck container
docker kill <container-id>
```

**Permission errors**
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
newgrp docker
```
