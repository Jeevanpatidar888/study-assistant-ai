/**
 * Utility for parsing and strictly validating AI output.
 * Guarantees that only well-formed, complete JSON data conforming
 * to the requested schema (flashcards or quiz) reaches the client.
 */

/**
 * Strips potential markdown code fences from the raw text.
 * e.g., ```json ... ``` or ``` ... ```
 * @param {string} text 
 * @returns {string} Clean JSON string
 */
export function cleanRawText(text) {
  if (typeof text !== 'string') {
    throw new Error('Raw response is not a string');
  }

  let cleaned = text.trim();

  // Strip leading code fences (e.g. ```json or ```)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  // Strip trailing code fences
  cleaned = cleaned.replace(/\s*```$/i, '');

  return cleaned.trim();
}

/**
 * Validates flashcards schema:
 * {
 *   "type": "flashcards",
 *   "title": string,
 *   "cards": [
 *     { "id": string|number, "question": string, "answer": string }
 *   ]
 * }
 * @param {object} data
 * @returns {object} Validated flashcard data
 */
export function validateFlashcards(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Flashcard output must be a JSON object');
  }

  if (data.type !== 'flashcards') {
    throw new Error(`Expected type to be "flashcards", but received "${data.type}"`);
  }

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('Flashcard output is missing a non-empty "title" string');
  }

  if (!Array.isArray(data.cards) || data.cards.length === 0) {
    throw new Error('Flashcard output must contain a non-empty "cards" array');
  }

  const validatedCards = data.cards.map((card, index) => {
    if (!card || typeof card !== 'object' || Array.isArray(card)) {
      throw new Error(`Card at index ${index} must be a valid object`);
    }

    const id = card.id ? String(card.id).trim() : `card-${index + 1}`;
    const question = typeof card.question === 'string' ? card.question.trim() : '';
    const answer = typeof card.answer === 'string' ? card.answer.trim() : '';

    if (!question) {
      throw new Error(`Card at index ${index} is missing a required "question" string`);
    }
    if (!answer) {
      throw new Error(`Card at index ${index} is missing a required "answer" string`);
    }

    return {
      id,
      question,
      answer
    };
  });

  return {
    type: 'flashcards',
    title: data.title.trim(),
    cards: validatedCards
  };
}

/**
 * Validates quiz schema:
 * {
 *   "type": "quiz",
 *   "title": string,
 *   "questions": [
 *     {
 *       "id": string|number,
 *       "question": string,
 *       "options": string[],
 *       "correctAnswer": string,
 *       "explanation": string
 *     }
 *   ]
 * }
 * @param {object} data
 * @returns {object} Validated quiz data
 */
export function validateQuiz(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Quiz output must be a JSON object');
  }

  if (data.type !== 'quiz') {
    throw new Error(`Expected type to be "quiz", but received "${data.type}"`);
  }

  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('Quiz output is missing a non-empty "title" string');
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('Quiz output must contain a non-empty "questions" array');
  }

  const validatedQuestions = data.questions.map((q, index) => {
    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      throw new Error(`Question at index ${index} must be a valid object`);
    }

    const id = q.id ? String(q.id).trim() : `q-${index + 1}`;
    const question = typeof q.question === 'string' ? q.question.trim() : '';
    const explanation = typeof q.explanation === 'string' ? q.explanation.trim() : '';
    const correctAnswer = typeof q.correctAnswer === 'string' ? q.correctAnswer.trim() : '';

    if (!question) {
      throw new Error(`Question at index ${index} is missing a required "question" string`);
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question at index ${index} must have an "options" array with at least 2 choices`);
    }

    const cleanOptions = q.options.map(opt => (typeof opt === 'string' ? opt.trim() : String(opt).trim()));

    // Check for empty options
    if (cleanOptions.some(opt => opt.length === 0)) {
      throw new Error(`Question at index ${index} contains empty option choices`);
    }

    if (!correctAnswer) {
      throw new Error(`Question at index ${index} is missing a required "correctAnswer" string`);
    }

    // Verify correctAnswer is actually one of the options
    const matchFound = cleanOptions.some(opt => opt.toLowerCase() === correctAnswer.toLowerCase());
    if (!matchFound) {
      throw new Error(
        `Question at index ${index} has "correctAnswer" ("${correctAnswer}") that does not match any choice in options: [${cleanOptions.join(', ')}]`
      );
    }

    // Normalize correctAnswer casing to exact option casing
    const exactMatch = cleanOptions.find(opt => opt.toLowerCase() === correctAnswer.toLowerCase());

    return {
      id,
      question,
      options: cleanOptions,
      correctAnswer: exactMatch,
      explanation: explanation || 'No additional explanation provided.'
    };
  });

  return {
    type: 'quiz',
    title: data.title.trim(),
    questions: validatedQuestions
  };
}

/**
 * Main parser and validator function.
 * @param {string} rawText Raw output from AI model
 * @param {'flashcards' | 'quiz'} mode Expected mode
 * @returns {object} Validated structured object
 */
export function validateResponse(rawText, mode) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('AI returned an empty response. Please try again.');
  }

  const cleaned = cleanRawText(rawText);
  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Failed to parse AI output as JSON: ${err.message}. Raw output preview: "${cleaned.slice(0, 100)}..."`);
  }

  if (mode === 'flashcards') {
    return validateFlashcards(parsed);
  } else if (mode === 'quiz') {
    return validateQuiz(parsed);
  } else {
    throw new Error(`Unsupported mode: "${mode}". Must be "flashcards" or "quiz".`);
  }
}
