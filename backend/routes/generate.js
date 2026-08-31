import express from 'express';
import { generateContentFromGemini } from '../services/geminiService.js';
import { validateResponse } from '../utils/validateResponse.js';

const router = express.Router();

/**
 * POST /api/generate
 * Body: { mode: 'flashcards' | 'quiz', input: string }
 */
router.post('/', async (req, res) => {
  const { mode, input } = req.body || {};

  // 1. Validate incoming request body
  if (!mode || (mode !== 'flashcards' && mode !== 'quiz')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_MODE',
        message: 'Invalid or missing "mode". Supported values are "flashcards" and "quiz".'
      }
    });
  }

  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'EMPTY_INPUT',
        message: 'Please provide non-empty study notes or a topic.'
      }
    });
  }

  const sanitizedInput = input.trim();
  if (sanitizedInput.length < 3) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INPUT_TOO_SHORT',
        message: 'Please enter at least 3 characters for your topic or notes.'
      }
    });
  }

  try {
    // 2. Call Gemini API service (or demo generator)
    const rawAiResponse = await generateContentFromGemini(mode, sanitizedInput);

    // 3. Parse and strictly validate AI output
    const validatedData = validateResponse(rawAiResponse, mode);

    // 4. Return validated structured JSON
    return res.status(200).json({
      success: true,
      data: validatedData
    });
  } catch (err) {
    console.error(`[API /api/generate Error]:`, err.message);

    // Determine appropriate status code and user-facing message
    let statusCode = 500;
    let errorCode = 'GENERATION_FAILED';

    if (err.message.includes('API key') || err.message.includes('permission') || err.message.includes('403')) {
      statusCode = 502;
      errorCode = 'AI_SERVICE_AUTHENTICATION';
    } else if (err.message.includes('quota') || err.message.includes('rate limit') || err.message.includes('429')) {
      statusCode = 429;
      errorCode = 'AI_RATE_LIMIT';
    } else if (err.message.includes('parse') || err.message.includes('JSON') || err.message.includes('schema') || err.message.includes('Expected type')) {
      statusCode = 502;
      errorCode = 'MALFORMED_AI_OUTPUT';
    } else if (err.message.includes('timeout')) {
      statusCode = 504;
      errorCode = 'AI_SERVICE_TIMEOUT';
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: err.message || 'An error occurred while generating study material. Please try again.'
      }
    });
  }
});

export default router;
