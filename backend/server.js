import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRouter from './routes/generate.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Parsing Middlewares
app.use(cors({
  origin: '*', // Allow frontend development requests
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// Healthcheck route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim())
  });
});

// Main generation route
app.use('/api/generate', generateRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found.`
    }
  });
});

// Global error handling middleware (prevents unhandled exceptions from crashing the server)
app.use((err, req, res, next) => {
  // Handle invalid JSON body syntax errors gracefully
  if (err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON_PAYLOAD',
        message: 'Malformed JSON payload sent in request body.'
      }
    });
  }

  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred on the server.'
    }
  });
});

// Start listening
app.listen(PORT, () => {
  console.log(`[Study Assistant Backend] Server running on http://localhost:${PORT}`);
  console.log(`[Study Assistant Backend] Gemini Key status: ${process.env.GEMINI_API_KEY ? 'Configured' : 'Missing (Using demo fallback)'}`);
});
