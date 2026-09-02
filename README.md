# StudySphere AI — Interactive AI Study Assistant

A production-quality, two-tier web application built with **React (Vite)** and **Node.js (Express)** that transforms free-form notes and topics into structured, interactive study materials: **3D Active Recall Flashcards** and a **Diagnostic Multiple-Choice Quiz with Wrong-Answer Re-testing**.

> **Evaluation Focus**: Frontend Software Engineering Internship Assignment  
> **Key Principle**: **No Chatbot**. The application does not use chat bubbles or unstructured text streams. It requests, validates, and renders structured JSON contracts as rich, stateful interactive components.

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
12. [14-Point Failure Handling Strategy](#12-14-point-failure-handling-strategy)
13. [Stale Response & Race Condition Protection](#13-stale-response--race-condition-protection)
14. [Security Considerations](#14-security-considerations)
15. [Automated Testing](#15-automated-testing)
16. [Known Limitations](#16-known-limitations)
17. [AI Usage Disclosure](#17-ai-usage-disclosure)
18. [Time Spent](#18-time-spent)

---

## 1. Project Overview & Rationale

Most AI interfaces default to conversational chatbots. While useful for open dialogue, chatbots are suboptimal for systematic studying because:

- They bury core facts in verbose narrative responses.
- They lack structured study interactions and measurable performance feedback.
- They are not optimized for active recall and repeated practice.

**StudySphere AI** solves this by enforcing an architectural boundary between AI generation and component rendering:

- The user provides a study-related topic or notes and selects a learning mode (`flashcards` or `quiz`).
- The backend prompts Gemini using strict output instructions through `@google/genai`.
- The backend parses and validates the AI response before it reaches the frontend.
- Unrelated/non-study requests are rejected with a structured `invalid_input` response.
- The React frontend renders only validated structured data using interactive components.

---

## 2. Key Features

### 🎴 Flashcard Mode

- **3D Flip Cards**: Smooth CSS perspective flips between Question (front) and Answer (back).
- **Session Pagination**: Previous/Next controls, card counter, and progress bar.
- **Card Mastery**: Mark individual cards as mastered.
- **Deck Shuffling & Restart**: Randomize cards and restart the study session.
- **Keyboard Shortcuts**: Navigate cards with Left/Right arrow keys and flip with Space or Enter.

### 📝 Quiz Mode

- **Multiple-Choice Quiz**: Each generated question contains exactly 4 options.
- **Immediate Visual Feedback**: Visual feedback is provided after answer submission.
- **In-Depth Explanations**: Each question includes an explanation for the correct answer.
- **Quantifiable Score Metric**: Final score and performance feedback are displayed.
- **Wrong-Answer Re-testing**: Users can focus on questions they answered incorrectly.

### 🛡️ Input & AI Safety Handling

- Study-related requests are processed normally.
- Clearly unrelated requests are rejected with:
  `This is not a valid study-related question. Please ask something related to your studies.`
- The system is designed to handle arbitrary unrelated requests rather than relying on a fixed hard-coded list.
- General topics can be accepted when the user clearly provides an educational/study context.

---

## 3. System Architecture & Data Flow

```text
[ User Input (Topic/Notes + Mode) ]
               │
               ▼
   [ React Frontend (Port 3000) ]
        ├── Loading / Error / Empty States
        ├── AbortController
        └── requestIdRef Stale Response Guard
               │
      HTTP POST /api/generate
               │
               ▼
   [ Node/Express Backend (Port 5000) ]
        ├── Request validation
        ├── Gemini Service (@google/genai + gemini-3.6-flash)
        └── validateResponse.js
               │
               ▼
 [ Validated Structured JSON Payload ]
               │
               ▼
   [ Interactive UI Components ]
        ├── FlashcardDeck / Flashcard / ProgressBar
        └── Quiz / QuizQuestion / Score Screen
```

### Request Flow

1. The user selects `flashcards` or `quiz`.
2. The frontend validates the input and sends a POST request to `/api/generate`.
3. The backend validates the request.
4. Gemini receives strict instructions for either valid study content or an `invalid_input` response.
5. The backend parses and validates the returned JSON.
6. Invalid or malformed AI output is rejected before reaching the frontend.
7. Valid structured data is returned to React.
8. React renders the corresponding interactive study component.

---

## 4. Project Directory Structure

```text
study-assistant-ai/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── Flashcard.jsx
│   │   │   ├── FlashcardDeck.jsx
│   │   │   ├── InputForm.jsx
│   │   │   ├── LoadingState.jsx
│   │   │   ├── ProgressBar.jsx
│   │   │   ├── Quiz.jsx
│   │   │   └── QuizQuestion.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/
│   ├── routes/
│   │   └── generate.js
│   ├── services/
│   │   └── geminiService.js
│   ├── utils/
│   │   └── validateResponse.js
│   ├── tests/
│   │   └── validateResponse.test.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 5. Prerequisites

- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- A valid **Google Gemini API key**

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

In `study-assistant-ai/backend`, create a `.env` file based on `.env.example`.

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

The Gemini API key is kept on the backend and is never exposed to the React frontend.

The application uses the `gemini-3.6-flash` model through the `@google/genai` package.

---

## 8. How to Run the Backend

```bash
cd study-assistant-ai/backend
npm start
```

The backend runs on:

```text
http://localhost:5000
```

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

The Vite development server runs on:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
```

The frontend communicates with the configured backend API.

---

## 10. Example API Payloads

### POST `/api/generate`

### Request Headers

```http
Content-Type: application/json
```

### Request Body — Flashcards

```json
{
  "mode": "flashcards",
  "input": "React hooks: useState and useEffect"
}
```

### Request Body — Quiz

```json
{
  "mode": "quiz",
  "input": "Operating system page replacement algorithms"
}
```

### Successful Flashcard Response

> Example shortened for readability; production validation requires 4–8 flashcards.

```json
{
  "success": true,
  "data": {
    "type": "flashcards",
    "title": "Study Deck: React Hooks",
    "cards": [
      {
        "id": "1",
        "question": "What is the purpose of the useEffect dependency array?",
        "answer": "It controls when the effect executes based on dependency changes."
      }
    ]
  }
}
```

### Invalid Study Input Response

For an unrelated request, the backend can return:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STUDY_INPUT",
    "message": "This is not a valid study-related question. Please ask something related to your studies."
  }
}
```

---

## 11. AI Output Strict JSON Schemas

### Flashcards Schema

The validator requires between **4 and 8 flashcards**.

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

The validator requires between **3 and 6 questions**.

Each question must contain exactly **4 unique options**, a matching `correctAnswer`, and a non-empty `explanation`.

```json
{
  "type": "quiz",
  "title": "string (non-empty)",
  "questions": [
    {
      "id": "string (non-empty)",
      "question": "string (non-empty)",
      "options": [
        "string",
        "string",
        "string",
        "string"
      ],
      "correctAnswer": "string (must match one entry in options)",
      "explanation": "string (non-empty)"
    }
  ]
}
```

### Invalid Input Schema

```json
{
  "type": "invalid_input",
  "message": "This is not a valid study-related question. Please ask something related to your studies."
}
```

---

## 12. 14-Point Failure Handling Strategy

The system is designed so that unexpected AI output, invalid input, or network problems are handled without crashing the UI.

| # | Failure Mode | Protection Mechanism | User Experience |
|---|---|---|---|
| 1 | **Empty user input** | Frontend/backend input validation | Inline validation message |
| 2 | **Input under 3 characters** | Backend rejects with `INPUT_TOO_SHORT` | User is asked to provide more detail |
| 3 | **Unrelated/non-study request** | Gemini classifies the request and returns `invalid_input` | User sees the study-related input message |
| 4 | **Gemini authentication error** | Backend maps authentication failures to a structured error | User sees a retry-friendly error |
| 5 | **Gemini rate limit** | Backend maps rate-limit failures to `AI_RATE_LIMIT` | User is asked to retry later |
| 6 | **Network failure / Backend unavailable** | Frontend maps connection failures to `NETWORK_ERROR` | User sees a connection error |
| 7 | **Slow response / Timeout** | Frontend `AbortController` timeout after 30 seconds | User can retry instead of waiting indefinitely |
| 8 | **Markdown-wrapped JSON** | `cleanRawText()` removes JSON code fences | Valid JSON is parsed normally |
| 9 | **Malformed / truncated JSON** | `JSON.parse()` is protected with `try/catch` | Error is shown with Retry option |
| 10 | **Wrong JSON shape/type** | Schema validator checks the expected structure and type | Invalid AI output is rejected |
| 11 | **Missing required fields** | Cards and quiz questions are strictly validated | Invalid data never reaches UI components |
| 12 | **Invalid quiz options/correct answer** | Exactly 4 options, duplicate checks, and answer matching | Invalid questions are rejected |
| 13 | **Malformed JSON in request body** | Express error middleware handles invalid request syntax | Structured HTTP 400 response |
| 14 | **Stale response / race condition** | `AbortController` + `requestIdRef` | Older responses cannot overwrite newer results |

---

## 13. Stale Response & Race Condition Protection

When multiple generation requests are triggered quickly, network responses may arrive in a different order from the order in which requests were started.

For example:

```text
Request #1 → slow response
Request #2 → fast response
```

Without protection, Request #1 could overwrite the newer result from Request #2.

**StudySphere AI uses two layers of protection:**

1. **AbortController**

   When a new request starts, the previous in-flight request is aborted.

2. **Sequential `requestIdRef`**

   Every request receives a unique sequential request ID. Before updating the UI, the response is checked against the latest request ID.

   If the response belongs to an older request, it is discarded.

This ensures stale responses cannot overwrite newer study results.

---

## 14. Security Considerations

- **No API Key in Frontend**: `GEMINI_API_KEY` is stored only on the backend.
- **Backend Environment Isolation**: Environment variables are loaded through `dotenv`.
- **Git Protection**: `.env` is excluded through `.gitignore`.
- **Backend API Boundary**: The frontend communicates with Gemini indirectly through the backend API.
- **CORS Handling**: The backend enables CORS so the separately deployed frontend can call the API. For a stricter production deployment, the allowed origin can be restricted to the frontend domain.
- **Input Validation**: Request mode and input length are validated before generation.

---

## 15. Automated Testing

The backend includes unit tests for response parsing and schema validation.

Run:

```bash
cd study-assistant-ai/backend
npm test
```

### Test Coverage

- `cleanRawText` removes Markdown JSON fences.
- Clean JSON responses are parsed successfully.
- Valid flashcard objects are accepted.
- Invalid flashcard types are rejected.
- Missing flashcard fields are rejected.
- Flashcard count outside the allowed range is rejected.
- Valid quiz objects are accepted.
- Quiz questions with invalid option counts are rejected.
- Duplicate quiz options are rejected.
- `correctAnswer` values not found in `options` are rejected.
- Missing quiz explanations are rejected.
- Markdown-wrapped JSON is validated correctly.
- Broken JSON syntax is rejected.
- Empty or whitespace AI responses are rejected.
- `invalid_input` responses are validated correctly.

---

## 16. Known Limitations

- **Single Generation Scope**: The application focuses on generating study material for the current session rather than persistent user accounts and cloud synchronization.
- **Gemini Dependency**: Generation and semantic study-topic classification depend on the Gemini API.
- **API Rate Limits**: Gemini API usage may be subject to provider rate limits.
- **Model Classification Is Probabilistic**: Unrelated-input detection is performed through the AI model, so it is designed as a practical classification layer rather than an absolute mathematical guarantee.
- **Large Inputs**: Very large study notes may need to be split into smaller sections depending on model/context limits.

---

## 17. AI Usage Disclosure

In compliance with assignment requirements, AI coding assistance was used during development.

AI assistance was used for:

- Refining the two-tier project structure and configuration.
- Improving Gemini prompt instructions and structured JSON output requirements.
- Designing edge-case scenarios for response validation.
- Reviewing error-handling and race-condition scenarios.
- Assisting with CSS 3D perspective animations and UI implementation.

The generated suggestions were reviewed, integrated, tested, and adapted as part of the final implementation.

---

## 18. Time Spent

- **Architecture Planning & Schema Design**: 45 mins
- **Backend Express, Gemini Service & Schema Validation**: 1 hour 15 mins
- **Automated Validation Unit Tests**: 30 mins
- **Frontend React Components, CSS 3D Perspective & Stale Guard**: 1 hour 45 mins
- **Integration, Failure Mode Testing & Build Verification**: 45 mins
- **Comprehensive Documentation**: 45 mins
- **Total Time**: ~5.5 hours
