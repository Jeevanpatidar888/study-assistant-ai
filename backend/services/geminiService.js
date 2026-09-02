import { GoogleGenAI } from '@google/genai';

/**
 * Service to interact with the Gemini API.
 * Generates either study material or an invalid-input response.
 */

const apiKey = process.env.GEMINI_API_KEY
  ? process.env.GEMINI_API_KEY.trim()
  : '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Builds the prompt for Gemini.
 *
 * Important:
 * The examples are only examples.
 * Do NOT hard-code a small list of invalid questions.
 * Gemini must determine whether the user's request is study-related.
 *
 * @param {'flashcards' | 'quiz'} mode
 * @param {string} input
 * @returns {{ prompt: string, systemInstruction: string }}
 */
function buildPrompt(mode, input) {
  const systemInstruction = `
You are a strict Study Assistant.

Your first responsibility is to determine whether the user's request is related to studying, learning, education, academics, programming, computer science, mathematics, science, technology, exam preparation, or another educational topic.

IMPORTANT:
- Do NOT use a fixed list of invalid questions.
- The examples below are ONLY examples.
- You must classify ANY unrelated request as invalid, even if it is a completely new question that was not listed in the examples.
- Do not answer unrelated questions.

Examples of unrelated requests include:
- asking about politics or political leaders as general information
- asking for travel recommendations
- asking about restaurants or entertainment
- asking for shopping recommendations
- asking about celebrities
- asking for personal advice unrelated to education
- asking for weather information
- asking general questions that have no educational/study purpose

However, a normally general topic IS VALID if the user clearly asks for it for educational purposes.

For example:
"Explain the French Revolution for my history exam."
=> VALID

"Explain how the Indian government works for my civics class."
=> VALID

"Who is the Prime Minister?"
=> INVALID

"Which city should I visit?"
=> INVALID

If the request is NOT study-related, return ONLY this JSON:

{
  "type": "invalid_input",
  "message": "This is not a valid study-related question. Please ask something related to your studies."
}

If the request IS study-related, generate the requested study material.

Never answer an invalid request with actual information.

Never add markdown fences.
Never add explanations outside JSON.
Always return valid JSON.
`;

  if (mode === 'flashcards') {
    return {
      systemInstruction: `${systemInstruction}

For a valid study-related request, return EXACTLY this schema:

{
  "type": "flashcards",
  "title": "Clear concise title of the study topic",
  "cards": [
    {
      "id": "1",
      "question": "Concise, focused question testing active recall",
      "answer": "Accurate, clear, and comprehensive answer"
    }
  ]
}

Rules for flashcards:
1. Generate between 4 and 8 cards.
2. Every card must have a unique non-empty string id.
3. Every card must contain question and answer.
4. Cover the most important concepts.
5. Keep questions focused and useful for learning.`,
      prompt: `
Determine whether this request is study-related.

If it is unrelated, return the invalid_input JSON.

If it is study-related, generate flashcards.

USER REQUEST:
${input}
`
    };
  }

  return {
    systemInstruction: `${systemInstruction}

For a valid study-related request, return EXACTLY this schema:

{
  "type": "quiz",
  "title": "Clear concise title of the quiz",
  "questions": [
    {
      "id": "1",
      "question": "Clearly formulated conceptual or scenario-based question",
      "options": [
        "Choice A text",
        "Choice B text",
        "Choice C text",
        "Choice D text"
      ],
      "correctAnswer": "Choice A text",
      "explanation": "Clear explanation of why this answer is correct."
    }
  ]
}

Rules for quiz:
1. Generate between 3 and 6 questions.
2. Every question must have exactly 4 distinct options.
3. Options must be plausible.
4. correctAnswer MUST exactly match one option.
5. Provide an educational explanation.
6. Cover important concepts from the requested topic.`,
    prompt: `
Determine whether this request is study-related.

If it is unrelated, return the invalid_input JSON.

If it is study-related, generate a multiple-choice quiz.

USER REQUEST:
${input}
`
  };
}

/**
 * Demo fallback when Gemini API key is not configured.
 */
function generateDemoData(mode, input) {
  const cleanTopic =
    input.length > 50 ? input.slice(0, 47) + '...' : input;

  if (mode === 'flashcards') {
    return {
      type: 'flashcards',
      title: `Study Deck: ${cleanTopic}`,
      cards: [
        {
          id: '1',
          question: `What is the core principle behind ${cleanTopic}?`,
          answer:
            `${cleanTopic} emphasizes understanding core concepts, structure, and practical application.`
        },
        {
          id: '2',
          question: `Why is understanding ${cleanTopic} important?`,
          answer:
            `Understanding the fundamentals helps you apply the concept correctly and solve related problems.`
        },
        {
          id: '3',
          question: `What is an important concept related to ${cleanTopic}?`,
          answer:
            `Important concepts should be understood through definitions, examples, use cases, and edge cases.`
        },
        {
          id: '4',
          question: `How can you practice ${cleanTopic}?`,
          answer:
            `You can practice it by studying examples, solving problems, and testing your understanding with active recall.`
        }
      ]
    };
  }

  return {
    type: 'quiz',
    title: `Diagnostic Quiz: ${cleanTopic}`,
    questions: [
      {
        id: '1',
        question: `Which approach is most useful for understanding ${cleanTopic}?`,
        options: [
          'Understand the fundamentals and practice examples.',
          'Avoid studying the basic concepts.',
          'Only memorize unrelated information.',
          'Never test your understanding.'
        ],
        correctAnswer:
          'Understand the fundamentals and practice examples.',
        explanation:
          'Understanding fundamentals and practicing examples helps build strong conceptual knowledge.'
      },
      {
        id: '2',
        question: `What is a good way to improve your knowledge of ${cleanTopic}?`,
        options: [
          'Practice problems and active recall.',
          'Avoid reviewing mistakes.',
          'Only read the topic once.',
          'Ignore practical examples.'
        ],
        correctAnswer: 'Practice problems and active recall.',
        explanation:
          'Practice and active recall improve understanding and long-term retention.'
      },
      {
        id: '3',
        question: `What should you do when learning a difficult concept?`,
        options: [
          'Break it into smaller concepts and practice them.',
          'Stop studying immediately.',
          'Ignore the difficult parts.',
          'Memorize random information.'
        ],
        correctAnswer:
          'Break it into smaller concepts and practice them.',
        explanation:
          'Breaking complex concepts into smaller parts makes them easier to understand and apply.'
      }
    ]
  };
}

/**
 * Main service call to generate study content.
 *
 * @param {'flashcards' | 'quiz'} mode
 * @param {string} input
 * @returns {Promise<string>}
 */
export async function generateContentFromGemini(mode, input) {
  // Gemini API key is required for intelligent
  // study/non-study classification.
  if (!ai) {
    console.warn(
      '[GeminiService] GEMINI_API_KEY is not configured.'
    );

    // IMPORTANT:
    // Without Gemini we cannot reliably determine whether
    // an arbitrary question is study-related.
    // Therefore we return a clear configuration error instead
    // of accidentally answering unrelated questions.
    throw new Error(
      'GEMINI_API_KEY is not configured. Please configure the Gemini API key.'
    );
  }

  const { prompt, systemInstruction } = buildPrompt(mode, input);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    if (!response || !response.text) {
      throw new Error(
        'Gemini API returned an empty response text.'
      );
    }

    return response.text;
  } catch (error) {
    console.error(
      '[GeminiService] Error calling Gemini API:',
      error.message
    );

    throw error;
  }
}
