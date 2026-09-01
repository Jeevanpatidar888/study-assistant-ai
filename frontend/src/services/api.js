/**
 * Frontend API client service for Study Assistant.
 * Handles network requests, AbortController timeouts, and structured error responses.
 */

const API_BASE = 'https://study-assistant-ai-oxd1.onrender.com/api';

/**
 * Sends a generation request to the backend with timeout and abort signal support.
 * @param {object} params
 * @param {'flashcards' | 'quiz'} params.mode
 * @param {string} params.input
 * @param {AbortSignal} [params.signal]
 * @param {number} [params.timeoutMs=30000]
 * @returns {Promise<object>} Structured data object { type, title, cards|questions }
 */
export async function generateStudyMaterial({ mode, input, signal, timeoutMs = 30000 }) {
  // Set up an internal timeout controller that cascades to the fetch
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new Error('REQUEST_TIMEOUT'));
  }, timeoutMs);

  // Link external signal (from App.jsx) if provided
  if (signal) {
    signal.addEventListener('abort', () => {
      timeoutController.abort(signal.reason);
    });
  }

  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ mode, input }),
      signal: timeoutController.signal
    });

    clearTimeout(timeoutId);

    const result = await response.json();

    if (!response.ok || !result.success) {
      const errorMessage = result?.error?.message || `Server returned HTTP ${response.status}`;
      const errorCode = result?.error?.code || 'HTTP_ERROR';
      const error = new Error(errorMessage);
      error.code = errorCode;
      error.status = response.status;
      throw error;
    }

    return result.data;
  } catch (err) {
    clearTimeout(timeoutId);

    // Differentiate user-initiated / superseded abort vs genuine network error
    if (err.name === 'AbortError' || err.message === 'REQUEST_TIMEOUT') {
      if (err.message === 'REQUEST_TIMEOUT') {
        const timeoutError = new Error('The request timed out after 30 seconds. Gemini might be experiencing high latency. Please retry.');
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      // Re-throw abort error for App.jsx to recognize as supersession
      throw err;
    }

    // Generic network error (e.g. backend down)
    if (!err.status) {
      const networkError = new Error('Unable to connect to the backend server. Please verify the backend is running on port 5000.');
      networkError.code = 'NETWORK_ERROR';
      throw networkError;
    }

    throw err;
  }
}

/**
 * Checks backend health and Gemini configuration status.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { healthy: false };
    const data = await res.json();
    return { healthy: true, hasGeminiKey: data.hasGeminiKey };
  } catch {
    return { healthy: false, hasGeminiKey: false };
  }
}
