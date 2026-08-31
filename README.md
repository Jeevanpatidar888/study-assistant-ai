# StudySphere AI — Interactive AI Study Assistant

A production-quality, two-tier web application built with **React (Vite)** and **Node.js (Express)** that transforms free-form notes and topics into structured, interactive study materials: **3D Active Recall Flashcards** and a **Diagnostic Multiple-Choice Quiz with Wrong-Answer Re-testing**.

> **Evaluation Focus**: Frontend Software Engineering Internship Assignment  
> **Key Principle**: **No Chatbot**. The application strictly rejects chat bubbles and unstructured text streams. It requests, validates, and renders pure structured JSON contracts as rich, stateful interactive components.

---

## Table of Contents

1. [Project Overview & Rationale](#1-project-overview--rationale)
2. [Key Features](#2-key-features)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Project Directory Structure](#4-project-directory-structure)
5. [Prerequisites](#5-prerequisites)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Variables](#7-environment-variables)
8. [How to Run the Backend](#8-how-to-run-the-backend)
9. [How to Run the Frontend](#9-how-to-run-the-frontend)
10. [Example API Payloads](#10-example-api-payloads)
11. [AI Output Strict JSON Schemas](#11-ai-output-strict-json-schemas)
12. [13-Point Failure Handling Strategy](#12-13-point-failure-handling-strategy)
13. [Stale Response & Race Condition Protection](#13-stale-response--race-condition-protection)
14. [Security Considerations](#14-security-considerations)
15. [Automated Testing](#15-automated-testing)
16. [Known Limitations](#16-known-limitations)
17. [AI Usage Disclosure](#17-ai-usage-disclosure)
18. [Time Spent](#18-time-spent)

---

## 1. Project Overview & Rationale

Most AI interfaces default to conversational chatbots. While great for open dialogue, chatbots are suboptimal for systematic studying because:
- They bury core facts in verbose narrative fluff.
- They lack structured progress tracking, active recall mechanics, and quantifiable performance metrics.
- They cannot be easily navigated via keyboard shortcuts or drilled repeatedly.

**StudySphere AI** solves this by enforcing an architectural boundary between AI generation and component rendering:
- The user provides topic notes and selects their learning mode (`flashcards` or `quiz`).
- The backend prompts Gemini with strict JSON schemas using `@google/genai`.
- A dedicated parsing barrier inspects, strips fences, parses, and validates the shape.
- The React frontend renders validated data using interactive components.

---

## 2. Key Features

### 🎴 Flashcard Mode
- **3D Flip Cards**: Smooth CSS perspective flips between Question (front) and Answer (back).
- **Session Pagination**: Previous/Next controls, direct card counter, and progress bar.
- **Card Mastery**: Mark individual cards as mastered.
- **Deck Shuffling & Restart**: Instant card randomization and session restarts.
- **Keyboard Shortcuts**: Navigate cards with Left/Right arrow keys; flip with Space or Enter.

### 📝 Quiz Mode
- **Diagnostic Multiple-Choice**: 4 plausible options with clean selection states.
- **Immediate Visual Feedback**: Green/Red indicator styling upon submission.
- **In-Depth Explanations**: Contextual breakdown explaining why the correct answer is right and why distractors are misconceptions.
- **Quantifiable Score Metric**: Final percentage score, breakdown tags (Correct vs. Incorrect), and qualitative feedback tier.
- **Wrong-Answer Re-testing**: Single-click focus drill that filters the quiz to re-test *only* the questions missed in the initial run.

---

## 3. System Architecture & Data Flow

```
[ User Input (Topic/Notes + Mode) ]
               │
               ▼
   [ React Frontend (Port 3000) ]
        ├── AbortController (Cancels superseded requests)
        └── Sequential requestIdRef Guard
               │
      HTTP POST /api/generate (proxied)
               │
               ▼
   [ Node/Express Backend (Port 5000) ]
        ├── Request validation (mode, input length)
        ├── Gemini Service (@google/genai + gemini-2.5-flash)
        └── validateResponse.js (Strict JSON Schema Barrier)
               │
               ▼
[ Validated Structured JSON Payload ]
               │
               ▼
   [ Interactive UI Components ]
        ├── FlashcardDeck / Flashcard / ProgressBar
        └── Quiz / QuizQuestion / Score Screen
```

---

## 4. Project Directory Structure

```
study-assistant-ai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmptyState.jsx       # Welcome prompt & sample starter topics
│   │   │   ├── ErrorState.jsx       # User-facing error message with 1-click retry
│   │   │   ├── Flashcard.jsx        # 3D interactive flip card with active recall hints
│   │   │   ├── FlashcardDeck.jsx    # Pagination, keyboard shortcuts, shuffling, progress
│   │   │   ├── InputForm.jsx        # Free-form topic/notes input & mode toggle
│   │   │   ├── LoadingState.jsx     # Pulse animation and skeleton preview
│   │   │   ├── ProgressBar.jsx      # Accessible step progress tracker (ARIA)
│   │   │   ├── Quiz.jsx             # Quiz manager, score metrics, wrong-answer drill
│   │   │   └── QuizQuestion.jsx     # Multiple choice options & instant explanations
│   │   ├── services/
│   │   │   └── api.js               # Frontend API client with AbortController & timeouts
│   │   ├── App.jsx                  # Root state coordinator & stale response guard
│   │   ├── App.css                  # Custom design system & 3D CSS perspective
│   │   └── main.jsx                 # Vite application entrypoint
│   ├── index.html
│   ├── vite.config.js               # Port 3000 config + /api proxy to backend
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   └── generate.js              # POST /api/generate endpoint handler
│   ├── services/
│   │   └── geminiService.js         # Gemini API prompt builder & demo engine fallback
│   ├── utils/
│   │   └── validateResponse.js      # Robust JSON parser, fence stripper, schema validator
│   ├── tests/
│   │   └── validateResponse.test.js # Automated unit tests for validation & edge cases
│   ├── server.js                    # Express app, CORS, error handling middleware
│   ├── package.json                 # Express, @google/genai, dotenv, cors
│   └── .env.example                 # GEMINI_API_KEY=, PORT=5000
│
├── .gitignore                       # node_modules, .env, dist, logs, OS files
└── README.md                        # Assignment documentation
```

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on `v24.14.1`)
- **npm**: `v9.0.0` or higher (tested on `v11.11.0`)

---

## 6. Installation & Setup

Clone the repository and install dependencies in both `frontend` and `backend`:

```bash
# 1. Navigate to backend and install
cd study-assistant-ai/backend
npm install

# 2. Navigate to frontend and install
cd ../frontend
npm install
```

---

## 7. Environment Variables

In `study-assistant-ai/backend`, copy `.env.example` to `.env`:

```bash
cd study-assistant-ai/backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Reviewer Convenience Note**: If `GEMINI_API_KEY` is not set, the backend runs an **intelligent demo fallback engine**. This allows evaluators to run and test the complete application without configuring an API key. Once a valid key is provided, it automatically connects to Google's `gemini-2.5-flash` model.

---

## 8. How to Run the Backend

```bash
cd study-assistant-ai/backend
npm start
```
*Runs on `http://localhost:5000`*.

For development with hot-reloading:
```bash
npm run dev
```

---

## 9. How to Run the Frontend

```bash
cd study-assistant-ai/frontend
npm run dev
```
*Opens on `http://localhost:3000` with automated proxying to the backend on port 5000*.

To create an optimized production build:
```bash
npm run build
```

---

## 10. Example API Payloads

### POST `/api/generate`

**Request Headers:**
```http
Content-Type: application/json
```

**Request Body (Flashcards):**
```json
{
  "mode": "flashcards",
  "input": "React hooks: useState and useEffect"
}
```

**Request Body (Quiz):**
```json
{
  "mode": "quiz",
  "input": "Operating system page replacement algorithms"
}
```

**Successful Response Body (Flashcards):**
```json
{
  "success": true,
  "data": {
    "type": "flashcards",
    "title": "Study Deck: React hooks",
    "cards": [
      {
        "id": "1",
        "question": "What is the purpose of useEffect dependency array?",
        "answer": "It controls when the effect executes; omitting it runs on every render, an empty array runs once on mount, and listing values reruns when those values change."
      }
    ]
  }
}
```

---

## 11. AI Output Strict JSON Schemas

### Flashcards Schema
```json
{
  "type": "flashcards",
  "title": "string (non-empty)",
  "cards": [
    {
      "id": "string (non-empty)",
      "question": "string (non-empty)",
      "answer": "string (non-empty)"
    }
  ]
}
```

### Quiz Schema
```json
{
  "type": "quiz",
  "title": "string (non-empty)",
  "questions": [
    {
      "id": "string (non-empty)",
      "question": "string (non-empty)",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string (must match one entry in options)",
      "explanation": "string (non-empty)"
    }
  ]
}
```

---

## 12. 13-Point Failure Handling Strategy

The system is designed so that unexpected AI output or network volatility will **never crash the UI**:

| # | Failure Mode | Protection Mechanism | User Experience |
|---|---|---|---|
| 1 | **Empty user input** | Frontend and backend validate string emptiness before any network call. | Inline input validation message. |
| 2 | **Input under 3 chars** | Backend rejects with HTTP 400 (`INPUT_TOO_SHORT`). | User-friendly prompt to enter more detail. |
| 3 | **Gemini API authentication error** | Backend catches 401/403 and maps to HTTP 502 (`AI_SERVICE_AUTHENTICATION`). | ErrorState card with troubleshooting steps. |
| 4 | **Gemini rate limits (429)** | Backend maps rate limits to HTTP 429 (`AI_RATE_LIMIT`). | Prompts user to retry shortly. |
| 5 | **Network failure / Backend down** | Frontend `api.js` catches fetch rejections and maps to `NETWORK_ERROR`. | Informs user that backend on port 5000 is unreachable. |
| 6 | **Slow response / Timeout** | `AbortController` triggers after 30 seconds timeout. | Prompts user to retry without hanging indefinitely. |
| 7 | **Markdown-wrapped JSON** | `cleanRawText()` regex removes ```` ```json ```` and trailing fences. | Transparently parsed into clean JSON. |
| 8 | **Malformed / Truncated JSON syntax** | `JSON.parse` wrapped in try/catch; returns HTTP 502 with error details. | UI catches error, prevents crash, offers Retry button. |
| 9 | **Wrong JSON shape / Wrong type** | Schema validator asserts `data.type === mode`. | Rejects mismatched shape before reaching client. |
| 10 | **Missing required fields** | Validates every card (`question`, `answer`) and question (`options`, `correctAnswer`). | Prevents undefined property access in UI components. |
| 11 | **Invalid quiz options** | Checks `options.length >= 2` and asserts choices are non-empty. | Guarantees all rendered questions have valid choices. |
| 12 | **Quiz correctAnswer mismatch** | Confirms `correctAnswer` is present in the `options` array. | Prevents unwinnable questions with missing answers. |
| 13 | **Malformed JSON in request body** | Express error middleware intercepts bad request syntax before route execution. | Returns structured HTTP 400 instead of generic 500 HTML. |

---

## 13. Stale Response & Race Condition Protection

When a user triggers multiple generation requests in rapid succession (e.g. submitting a topic, changing mind, and submitting another), network arrival order cannot be guaranteed. A slower, older request might resolve *after* a newer one, causing stale data to overwrite the UI.

**StudySphere AI employs a two-tier race condition guard**:
1. **Active Abort via `AbortController`**: When a new request starts, `abortControllerRef.current.abort('SUPERSEDED_BY_NEW_REQUEST')` terminates the in-flight HTTP connection immediately.
2. **Sequential `requestIdRef` Counter**: An incrementing counter ensures that even if an aborted response arrives during cleanup, it is discarded because `thisRequestId !== requestIdRef.current`.

---

## 14. Security Considerations

- **No API Keys in Frontend**: The React client has zero knowledge of `GEMINI_API_KEY`. It communicates exclusively with `/api/generate`.
- **Backend Environment Isolation**: `GEMINI_API_KEY` is loaded securely on the Node.js server via `dotenv`.
- **Git Protection**: `.env` is explicitly included in root `.gitignore`.
- **CORS Restriction**: Explicit origin headers prevent unauthorized cross-domain exploitation.
- **Input Sanitization & Length Limits**: Request payloads are limited to 5MB and input strings are trimmed and validated.

---

## 15. Automated Testing

The backend includes an automated unit test suite testing parsing and schema validation rules:

```bash
cd study-assistant-ai/backend
npm test
```

### Test Coverage:
- `cleanRawText` removes markdown code fences (` ```json `).
- `cleanRawText` handles clean JSON without fences.
- `validateFlashcards` accepts valid flashcard objects.
- `validateFlashcards` rejects mismatched types, empty cards, or missing fields.
- `validateQuiz` accepts conforming multiple-choice quizzes.
- `validateQuiz` rejects `correctAnswer` values not found in `options`.
- `validateResponse` handles full markdown-wrapped JSON payloads.
- `validateResponse` rejects broken JSON syntax with descriptive error messages.
- `validateResponse` rejects empty or whitespace strings.

---

## 16. Known Limitations

- **Single Generation Scope**: The application focuses on single-topic generation rather than persistent user accounts with cloud database sync.
- **Free-Tier Rate Limits**: Gemini API free tier may experience rate limits (15 RPM) during high traffic; the app gracefully reports this via `AI_RATE_LIMIT`.
- **Model Output Length**: Notes exceeding 10,000 words should be chunked to avoid hitting context output limits.

---

## 17. AI Usage Disclosure

In compliance with assignment requirements, AI coding assistance (Antigravity with Google Gemini) was utilized during the development of this project for:
- Formulating the initial two-tier folder structure and build configuration.
- Refining the prompt engineering system instructions for `@google/genai`.
- Constructing edge-case unit test scenarios for schema validation.
- Crafting CSS 3D perspective animations for flashcard flipping.

All code, architectural patterns, state machines, and failure handling mechanisms were systematically tested, reviewed, and verified.

---

## 18. Time Spent

- **Architecture Planning & Schema Design**: 45 mins
- **Backend Express, Gemini Service & Schema Validation**: 1 hour 15 mins
- **Automated Validation Unit Tests**: 30 mins
- **Frontend React Components, CSS 3D Perspective & Stale Guard**: 1 hour 45 mins
- **Integration, Failure Mode Testing & Build Verification**: 45 mins
- **Comprehensive Documentation**: 45 mins
- **Total Time**: ~5.5 hours
