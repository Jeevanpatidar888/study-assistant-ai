import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  cleanRawText, 
  validateFlashcards, 
  validateQuiz, 
  validateResponse 
} from '../utils/validateResponse.js';

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

test('validateFlashcards - validates conforming flashcard data', () => {
  const validData = {
    type: 'flashcards',
    title: 'Computer Networks',
    cards: [
      { id: '1', question: 'What is TCP?', answer: 'Transmission Control Protocol.' },
      { id: '2', question: 'What is UDP?', answer: 'User Datagram Protocol.' }
    ]
  };

  const result = validateFlashcards(validData);
  assert.equal(result.type, 'flashcards');
  assert.equal(result.title, 'Computer Networks');
  assert.equal(result.cards.length, 2);
  assert.equal(result.cards[0].question, 'What is TCP?');
});

test('validateFlashcards - rejects wrong type or missing cards', () => {
  assert.throws(() => {
    validateFlashcards({ type: 'quiz', title: 'Test', cards: [] });
  }, /Expected type to be "flashcards"/);

  assert.throws(() => {
    validateFlashcards({ type: 'flashcards', title: 'Test', cards: [] });
  }, /non-empty "cards" array/);

  assert.throws(() => {
    validateFlashcards({
      type: 'flashcards',
      title: 'Test',
      cards: [{ id: '1', question: '', answer: 'ans' }]
    });
  }, /missing a required "question"/);
});

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
        explanation: 'let allows block scoping unlike var which is function scoped.'
      }
    ]
  };

  const result = validateQuiz(validQuiz);
  assert.equal(result.type, 'quiz');
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].correctAnswer, 'let');
});

test('validateQuiz - rejects correctAnswer not present in options', () => {
  const invalidQuiz = {
    type: 'quiz',
    title: 'JavaScript Basics',
    questions: [
      {
        id: 'q1',
        question: 'What is 2 + 2?',
        options: ['1', '2', '3'],
        correctAnswer: '4', // Not in options!
        explanation: 'Math'
      }
    ]
  };

  assert.throws(() => {
    validateQuiz(invalidQuiz);
  }, /does not match any choice in options/);
});

test('validateResponse - handles full flow with markdown wrapping', () => {
  const markdownQuiz = '```json\n{"type": "quiz", "title": "Math", "questions": [{"id": "1", "question": "What is 2+2?", "options": ["3", "4"], "correctAnswer": "4", "explanation": "2+2=4"}]}\n```';
  const result = validateResponse(markdownQuiz, 'quiz');
  assert.equal(result.type, 'quiz');
  assert.equal(result.questions[0].correctAnswer, '4');
});

test('validateResponse - rejects malformed JSON gracefully', () => {
  const brokenJson = '{"type": "quiz", "title": "Math", ... broken ...}';
  assert.throws(() => {
    validateResponse(brokenJson, 'quiz');
  }, /Failed to parse AI output as JSON/);
});

test('validateResponse - rejects empty input', () => {
  assert.throws(() => {
    validateResponse('', 'flashcards');
  }, /empty response/);
});
