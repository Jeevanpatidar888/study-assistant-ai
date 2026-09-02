/**
 * Utility for parsing and strictly validating AI output.
 *
 * Guarantees that only well-formed, complete JSON data
 * conforming to the requested schema (flashcards or quiz)
 * reaches the client.
 */

/**
 * Strips potential markdown code fences from the raw text.
 *
 * Example:
 * ```json
 * { ... }
 * ```
 *
 * or
 *
 * ```
 * { ... }
 * ```
 *
 * @param {string} text
 * @returns {string} Clean JSON string
 */
export function cleanRawText(text) {
  if (typeof text !== 'string') {
    throw new Error('Raw response is not a string');
  }

  let cleaned = text.trim();

  // Strip leading code fences
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');

  // Strip trailing code fences
  cleaned = cleaned.replace(/\s*```$/i, '');

  return cleaned.trim();
}


/**
 * Validates flashcards schema:
 *
 * {
 *   "type": "flashcards",
 *   "title": string,
 *   "cards": [
 *     {
 *       "id": string,
 *       "question": string,
 *       "answer": string
 *     }
 *   ]
 * }
 *
 * @param {object} data
 * @returns {object} Validated flashcard data
 */
export function validateFlashcards(data) {
  // Check that data is an object
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new Error(
      'Flashcard output must be a JSON object'
    );
  }

  // Check type
  if (data.type !== 'flashcards') {
    throw new Error(
      `Expected type to be "flashcards", but received "${data.type}"`
    );
  }

  // Check title
  if (
    !data.title ||
    typeof data.title !== 'string' ||
    !data.title.trim()
  ) {
    throw new Error(
      'Flashcard output is missing a non-empty "title" string'
    );
  }

  // Flashcards must contain 4 to 8 cards
  if (
    !Array.isArray(data.cards) ||
    data.cards.length < 4 ||
    data.cards.length > 8
  ) {
    throw new Error(
      'Flashcard output must contain between 4 and 8 cards'
    );
  }

  const validatedCards = data.cards.map((card, index) => {
    // Check card object
    if (
      !card ||
      typeof card !== 'object' ||
      Array.isArray(card)
    ) {
      throw new Error(
        `Card at index ${index} must be a valid object`
      );
    }

    // ID must be provided by AI
    const id =
      typeof card.id === 'string'
        ? card.id.trim()
        : '';

    const question =
      typeof card.question === 'string'
        ? card.question.trim()
        : '';

    const answer =
      typeof card.answer === 'string'
        ? card.answer.trim()
        : '';

    // Check ID
    if (!id) {
      throw new Error(
        `Card at index ${index} is missing a required "id" string`
      );
    }

    // Check question
    if (!question) {
      throw new Error(
        `Card at index ${index} is missing a required "question" string`
      );
    }

    // Check answer
    if (!answer) {
      throw new Error(
        `Card at index ${index} is missing a required "answer" string`
      );
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
 *
 * {
 *   "type": "quiz",
 *   "title": string,
 *   "questions": [
 *     {
 *       "id": string,
 *       "question": string,
 *       "options": string[],
 *       "correctAnswer": string,
 *       "explanation": string
 *     }
 *   ]
 * }
 *
 * @param {object} data
 * @returns {object} Validated quiz data
 */
export function validateQuiz(data) {
  // Check that data is an object
  if (
    !data ||
    typeof data !== 'object' ||
    Array.isArray(data)
  ) {
    throw new Error(
      'Quiz output must be a JSON object'
    );
  }

  // Check type
  if (data.type !== 'quiz') {
    throw new Error(
      `Expected type to be "quiz", but received "${data.type}"`
    );
  }

  // Check title
  if (
    !data.title ||
    typeof data.title !== 'string' ||
    !data.title.trim()
  ) {
    throw new Error(
      'Quiz output is missing a non-empty "title" string'
    );
  }

  // Quiz must contain 3 to 6 questions
  if (
    !Array.isArray(data.questions) ||
    data.questions.length < 3 ||
    data.questions.length > 6
  ) {
    throw new Error(
      'Quiz output must contain between 3 and 6 questions'
    );
  }

  const validatedQuestions = data.questions.map((q, index) => {
    // Check question object
    if (
      !q ||
      typeof q !== 'object' ||
      Array.isArray(q)
    ) {
      throw new Error(
        `Question at index ${index} must be a valid object`
      );
    }

    // ID must be provided by AI
    const id =
      typeof q.id === 'string'
        ? q.id.trim()
        : '';

    const question =
      typeof q.question === 'string'
        ? q.question.trim()
        : '';

    const explanation =
      typeof q.explanation === 'string'
        ? q.explanation.trim()
        : '';

    const correctAnswer =
      typeof q.correctAnswer === 'string'
        ? q.correctAnswer.trim()
        : '';

    // Check ID
    if (!id) {
      throw new Error(
        `Question at index ${index} is missing a required "id" string`
      );
    }

    // Check question
    if (!question) {
      throw new Error(
        `Question at index ${index} is missing a required "question" string`
      );
    }

    // Check options
    if (
      !Array.isArray(q.options) ||
      q.options.length !== 4
    ) {
      throw new Error(
        `Question at index ${index} must have exactly 4 options`
      );
    }

    // Convert options to trimmed strings
    const cleanOptions = q.options.map(opt =>
      typeof opt === 'string'
        ? opt.trim()
        : String(opt).trim()
    );

    // Check empty options
    if (
      cleanOptions.some(opt => opt.length === 0)
    ) {
      throw new Error(
        `Question at index ${index} contains empty option choices`
      );
    }

    // Check duplicate options
    const uniqueOptions = new Set(
      cleanOptions.map(opt => opt.toLowerCase())
    );

    if (uniqueOptions.size !== cleanOptions.length) {
      throw new Error(
        `Question at index ${index} contains duplicate options`
      );
    }

    // Check correct answer
    if (!correctAnswer) {
      throw new Error(
        `Question at index ${index} is missing a required "correctAnswer" string`
      );
    }

    // Verify correctAnswer exists in options
    const exactMatch = cleanOptions.find(
      opt =>
        opt.toLowerCase() ===
        correctAnswer.toLowerCase()
    );

    if (!exactMatch) {
      throw new Error(
        `Question at index ${index} has "correctAnswer" ("${correctAnswer}") that does not match any choice in options: [${cleanOptions.join(', ')}]`
      );
    }

    // Explanation is required
    if (!explanation) {
      throw new Error(
        `Question at index ${index} is missing a required "explanation" string`
      );
    }

    return {
      id,
      question,
      options: cleanOptions,
      correctAnswer: exactMatch,
      explanation
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
 *
 * Handles:
 * - Empty AI response
 * - Markdown wrapped JSON
 * - Malformed JSON
 * - Wrong JSON shape
 * - Invalid study input
 * - Invalid flashcard schema
 * - Invalid quiz schema
 * - Unsupported mode
 *
 * @param {string} rawText Raw output from AI model
 * @param {'flashcards' | 'quiz'} mode Expected mode
 * @returns {object} Validated structured object
 */
export function validateResponse(rawText, mode) {
  // --------------------------------------------------
  // 1. EMPTY AI RESPONSE
  // --------------------------------------------------

  if (
    !rawText ||
    typeof rawText !== 'string' ||
    !rawText.trim()
  ) {
    throw new Error(
      'AI returned an empty response. Please try again.'
    );
  }


  // --------------------------------------------------
  // 2. CLEAN MARKDOWN CODE FENCES
  // --------------------------------------------------

  const cleaned = cleanRawText(rawText);


  // --------------------------------------------------
  // 3. PARSE JSON
  // --------------------------------------------------

  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(
      `Failed to parse AI output as JSON: ${err.message}. ` +
      `Raw output preview: "${cleaned.slice(0, 100)}..."`
    );
  }


  // --------------------------------------------------
  // 4. JSON MUST BE AN OBJECT
  // --------------------------------------------------

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      'AI output must be a JSON object.'
    );
  }


  // --------------------------------------------------
  // 5. HANDLE INVALID / UNRELATED STUDY INPUT
  // --------------------------------------------------

  /*
   * Gemini can return:
   *
   * {
   *   "type": "invalid_input",
   *   "message": "This is not a valid study-related question. Please ask something related to your studies."
   * }
   *
   * This must be checked BEFORE flashcard/quiz validation.
   */

  if (parsed.type === 'invalid_input') {
    if (
      typeof parsed.message !== 'string' ||
      !parsed.message.trim()
    ) {
      throw new Error(
        'Invalid input response is missing a valid "message".'
      );
    }

    return {
      type: 'invalid_input',
      message: parsed.message.trim()
    };
  }


  // --------------------------------------------------
  // 6. VALIDATE ACCORDING TO MODE
  // --------------------------------------------------

  if (mode === 'flashcards') {
    return validateFlashcards(parsed);
  }

  if (mode === 'quiz') {
    return validateQuiz(parsed);
  }


  // --------------------------------------------------
  // 7. UNSUPPORTED MODE
  // --------------------------------------------------

  throw new Error(
    `Unsupported mode: "${mode}". Must be "flashcards" or "quiz".`
  );
}
