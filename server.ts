import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { db } from './src/db/index.ts';
import { apiRouter } from './src/api/index.ts';

async function startServer() {
  const app = express();
  const PORT = 3000; // Force 3000 for AI Studio environment

  app.set('trust proxy', 1);

  // Security headers - Modified for AI Studio iframe compatibility
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Eval often needed for Vite/HMR
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org", "https://picsum.photos"],
        connectSrc: ["'self'", "https://*.sentry.io", "wss:", "ws:"], // Allow WebSockets for Vite
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        frameSrc: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'", "*"], // Allow iframe embedding
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Allow iframe embedding
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
  }));

  // Separate middleware for Permissions-Policy
  app.use((req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  app.disable('x-powered-by');

  app.use(express.json({ limit: '1mb' })); // Limit JSON payload size to prevent DoS
  app.use(cookieParser());

  // API Routes
  app.use('/api', apiRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.log(`Attempting to listen on port ${PORT}...`);
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});