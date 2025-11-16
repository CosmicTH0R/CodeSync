import fs from 'fs';
import { config } from './config.js';

export const ensurePersistenceDir = () => {
  if (!fs.existsSync(config.PERSISTENCE_DIR)) {
    fs.mkdirSync(config.PERSISTENCE_DIR, { recursive: true });
  }
};

export const gracefulShutdown = (signal, httpServer, wss, mongoClose) => {
  let shuttingDown = false;
  
  return () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);

    if (wss) {
      wss.close(() => {
        console.log('[Server] WebSocket server closed');
      });
    }

    if (httpServer) {
      httpServer.close(() => {
        console.log('[Server] REST API stopped');
        mongoClose?.();
        process.exit(0);
      });
    }

    setTimeout(() => {
      console.warn('[Server] Forcing shutdown');
      process.exit(1);
    }, 5000).unref();
  };
};
