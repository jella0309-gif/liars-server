import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { config } from './config.js';
import { logger } from './utils/logger.js';
import { registerSocketHandlers } from './socket/handlers.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve static client build if it exists
import fs from 'fs';
const possibleClientPaths = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist')
];
const clientPath = possibleClientPaths.find(p => fs.existsSync(p));

if (clientPath) {
  app.use(express.static(clientPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send("Liar's Bar Game Server is running. In development mode, open http://localhost:5173 to play.");
  });
}

// Socket IO Handlers
registerSocketHandlers(io);

httpServer.listen(config.PORT, () => {
  logger.info(`Server listening on port ${config.PORT}`);
});
