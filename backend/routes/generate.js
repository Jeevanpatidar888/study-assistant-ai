import express from 'express';
import { generateContentFromGemini } from '../services/geminiService.js';
import { validateResponse } from '../utils/validateResponse.js';

const router = express.Router();

/**
 * POST /api/generate
 * Body: { mode: 'flashcards' | 'quiz', input: string }
 */
router.post('/', async (req, res) => {
  try {
    const { mode, input } = req.body || {};

    // 1. Validate request body
    if (!mode || !['flashcards', 'quiz'].includes(mode)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MODE',
          message:
            'Invalid or missing "mode". Supported values are "flashcards" and "quiz".'
        }
      });
    }

    // 2. Validate input
    if (typeof input !== 'string' || !input.trim()) {
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
          message:
            'Please enter at least 3 characters for your topic or notes.'
        }
      });
    }

    // 3. Generate content
    const rawAiResponse = await generateContentFromGemini(
      mode,
      sanitizedInput
    );

    // 4. Parse + strictly validate AI response
    const validatedData = validateResponse(
      rawAiResponse,
      mode
    );

    // 5. Handle unrelated/non-study questions
    if (validatedData.type === 'invalid_input') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STUDY_INPUT',
          message:
            'This is not a valid study-related question. Please ask something related to your studies.'
        }
      });
    }

    // 6. Successful response
    return res.status(200).json({
      success: true,
      data: validatedData
    });

  } catch (err) {
    console.error(
      '[API /api/generate Error]:',
      err
    );

    const message =
      err?.message ||
      'An error occurred while generating study material. Please try again.';

    let statusCode = 500;
    let errorCode = 'GENERATION_FAILED';
    let userMessage =
      'Failed to generate study material. Please try again.';

    const lowerMessage = message.toLowerCase();

    // Authentication / API key
    if (
      lowerMessage.includes('api key') ||
      lowerMessage.includes('permission') ||
      lowerMessage.includes('unauthorized') ||
      lowerMessage.includes('forbidden') ||
      lowerMessage.includes('403')
    ) {
      statusCode = 502;
      errorCode = 'AI_SERVICE_AUTHENTICATION';
      userMessage =
        'The AI service could not be authenticated. Please try again later.';
    }

    // Rate limit / quota
    else if (
      lowerMessage.includes('quota') ||
      lowerMessage.includes('rate limit') ||
      lowerMessage.includes('too many requests') ||
      lowerMessage.includes('429')
    ) {
      statusCode = 429;
      errorCode = 'AI_RATE_LIMIT';
      userMessage =
        'The AI service is temporarily busy. Please try again in a moment.';
    }

    // Timeout
    else if (
      lowerMessage.includes('timeout') ||
      lowerMessage.includes('timed out') ||
      lowerMessage.includes('deadline exceeded')
    ) {
      statusCode = 504;
      errorCode = 'AI_SERVICE_TIMEOUT';
      userMessage =
        'The request took too long. Please try again.';
    }

    // Invalid / malformed AI output
    else if (
      lowerMessage.includes('json') ||
      lowerMessage.includes('parse') ||
      lowerMessage.includes('schema') ||
      lowerMessage.includes('expected type') ||
      lowerMessage.includes('malformed') ||
      lowerMessage.includes('invalid response') ||
      lowerMessage.includes('missing required')
    ) {
      statusCode = 502;
      errorCode = 'MALFORMED_AI_OUTPUT';
      userMessage =
        'The AI returned an invalid response. Please try again.';
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode,
        message: userMessage
      }
    });
  }
});

export default router;
