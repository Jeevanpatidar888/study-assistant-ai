import test from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanRawText,
  validateFlashcards,
  validateQuiz,
  validateResponse
} from '../utils/validateResponse.js';


// ============================================================
// cleanRawText TESTS
// ============================================================

test('cleanRawText - removes markdown json fences', () => {
  const input = '```json\n{"test": 123}\n```';

  const cleaned = cleanRawText(input);

  assert.equal(cleaned, '{"test": 123}');
});


test('cleanRawText - handles plain json without fences', () => {
  const input = '{"type": "flashcards"}';

  const cleaned = cleanRawText(input);

  assert.equal(cleaned, '{"type": "flashcards"}');
});


// ============================================================
// validateFlashcards TESTS
// ============================================================

test('validateFlashcards - validates conforming flashcard data', () => {
  const validData = {
    type: 'flashcards',
    title: 'Computer Networks',

    cards: [
      {
        id: '1',
        question: 'What is TCP?',
        answer: 'Transmission Control Protocol.'
      },
      {
        id: '2',
        question: 'What is UDP?',
        answer: 'User Datagram Protocol.'
      },
      {
        id: '3',
        question: 'What is an IP address?',
        answer: 'A logical address used to identify a device on a network.'
      },
      {
        id: '4',
        question: 'What is DNS?',
        answer: 'Domain Name System translates domain names into IP addresses.'
      }
    ]
  };

  const result = validateFlashcards(validData);

  assert.equal(result.type, 'flashcards');
  assert.equal(result.title, 'Computer Networks');
  assert.equal(result.cards.length, 4);
  assert.equal(result.cards[0].question, 'What is TCP?');
});


test('validateFlashcards - rejects wrong type or missing cards', () => {

  // Wrong type
  assert.throws(() => {
    validateFlashcards({
      type: 'quiz',
      title: 'Test',
      cards: []
    });
  }, /Expected type to be "flashcards"/);


  // Empty cards array
  assert.throws(() => {
    validateFlashcards({
      type: 'flashcards',
      title: 'Test',
      cards: []
    });
  }, /non-empty "cards" array/);


  // Missing question
  assert.throws(() => {
    validateFlashcards({
      type: 'flashcards',
      title: 'Test',

      cards: [
        {
          id: '1',
          question: '',
          answer: 'ans'
        },
        {
          id: '2',
          question: 'Valid question',
          answer: 'Valid answer'
        },
        {
          id: '3',
          question: 'Another question',
          answer: 'Another answer'
        },
        {
          id: '4',
          question: 'Fourth question',
          answer: 'Fourth answer'
        }
      ]
    });
  }, /missing a required "question"/);
});


// ============================================================
// validateQuiz TESTS
// ============================================================

test('validateQuiz - validates conforming quiz data', () => {
  const validQuiz = {
    type: 'quiz',
    title: 'JavaScript Basics',

    questions: [
      {
        id: 'q1',
        question: 'Which keyword declares a block-scoped variable?',
        options: ['var', 'let', 'global', 'set'],
        correctAnswer: 'let',
        explanation:
          'let allows block scoping unlike var which is function scoped.'
      },

      {
        id: 'q2',
        question: 'Which symbol is used for strict equality?',
        options: ['=', '==', '===', '!='],
        correctAnswer: '===',
        explanation:
          'The === operator checks both value and type without type coercion.'
      },

      {
        id: 'q3',
        question: 'Which method converts JSON string into a JavaScript object?',
        options: [
          'JSON.parse()',
          'JSON.stringify()',
          'JSON.object()',
          'JSON.convert()'
        ],
        correctAnswer: 'JSON.parse()',
        explanation:
          'JSON.parse() converts a valid JSON string into a JavaScript object.'
      }
    ]
  };

  const result = validateQuiz(validQuiz);

  assert.equal(result.type, 'quiz');
  assert.equal(result.questions.length, 3);
  assert.equal(result.questions[0].correctAnswer, 'let');
  assert.equal(result.questions[1].correctAnswer, '===');
  assert.equal(result.questions[2].correctAnswer, 'JSON.parse()');
});


test('validateQuiz - rejects correctAnswer not present in options', () => {
  const invalidQuiz = {
    type: 'quiz',
    title: 'JavaScript Basics',

    questions: [
      {
        id: 'q1',
        question: 'What is 2 + 2?',
        options: ['1', '2', '3', '5'],
        correctAnswer: '4',
        explanation: 'Math'
      },

      {
        id: 'q2',
        question: 'What is 3 + 3?',
        options: ['5', '6', '7', '8'],
        correctAnswer: '6',
        explanation: '3 + 3 = 6'
      },

      {
        id: 'q3',
        question: 'What is 5 + 5?',
        options: ['8', '9', '10', '11'],
        correctAnswer: '10',
        explanation: '5 + 5 = 10'
      }
    ]
  };

  assert.throws(() => {
    validateQuiz(invalidQuiz);
  }, /does not match any choice in options/);
});


// ============================================================
// validateResponse TESTS
// ============================================================

test('validateResponse - handles full flow with markdown wrapping', () => {

  const markdownQuiz = `\`\`\`json
{
  "type": "quiz",
  "title": "Math",
  "questions": [
    {
      "id": "1",
      "question": "What is 2+2?",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "explanation": "2+2=4"
    },
    {
      "id": "2",
      "question": "What is 3+3?",
      "options": ["5", "6", "7", "8"],
      "correctAnswer": "6",
      "explanation": "3+3=6"
    },
    {
      "id": "3",
      "question": "What is 5+5?",
      "options": ["8", "9", "10", "11"],
      "correctAnswer": "10",
      "explanation": "5+5=10"
    }
  ]
}
\`\`\``;

  const result = validateResponse(markdownQuiz, 'quiz');

  assert.equal(result.type, 'quiz');
  assert.equal(result.questions.length, 3);
  assert.equal(result.questions[0].correctAnswer, '4');
});


test('validateResponse - rejects malformed JSON gracefully', () => {
  const brokenJson =
    '{"type": "quiz", "title": "Math", ... broken ...}';

  assert.throws(() => {
    validateResponse(brokenJson, 'quiz');
  }, /Failed to parse AI output as JSON/);
});


test('validateResponse - rejects empty input', () => {
  assert.throws(() => {
    validateResponse('', 'flashcards');
  }, /empty response/);
});
