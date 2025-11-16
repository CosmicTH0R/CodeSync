import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/codesync',
  HTTP_PORT: Number(process.env.HTTP_PORT) || 4000,
  WS_PORT: Number(process.env.WS_PORT) || 1234,
  CLIENT_ORIGINS: process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173'],
  PERSISTENCE_DIR: join(__dirname, '../db'),
};

export const getEnvPath = () => dirname(dirname(__dirname));
