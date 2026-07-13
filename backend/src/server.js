import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import opendataRoutes from './routes/opendata.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const rawOrigins = process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // allow non-browser requests (e.g., curl, server-to-server)
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed === '*') return true;
      try {
        const normalizedAllowed = new URL(allowed).origin;
        const normalizedOrigin = new URL(origin).origin;
        return normalizedAllowed === normalizedOrigin;
      } catch (error) {
        // fallback to simple string comparison
        return origin === allowed;
      }
    });

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-Client-Token', 'x-client-token'],
  exposedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // preflight 요청 전역 허용
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/opendata', authMiddleware, opendataRoutes);

// 404 handler (must come before error handler)
app.use((req, res, next) => {
  res.status(404).json({
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
    },
  });
});

// Error handling (must be last - Express requires 4 args to identify error middleware)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 OpenData Gateway: http://localhost:${PORT}/opendata`);
});

