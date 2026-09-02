/**
 * Frontend API client service for Study Assistant.
 *
 * Handles:
 * - Backend API requests
 * - Request timeout
 * - AbortController
 * - Structured backend errors
 * - Network/backend-down errors
 * - Retry-friendly error codes
 */

const API_BASE =
  'https://study-assistant-ai-oxd1.onrender.com/api';


/**
 * Sends a generation request to the backend.
 *
 * @param {object} params
 * @param {'flashcards' | 'quiz'} params.mode
 * @param {string} params.input
 * @param {AbortSignal} [params.signal]
 * @param {number} [params.timeoutMs=30000]
 *
 * @returns {Promise<object>}
 */
export async function generateStudyMaterial({
  mode,
  input,
  signal,
  timeoutMs = 30000
}) {
  // --------------------------------------------------
  // 1. Create internal timeout controller
  // --------------------------------------------------

  const timeoutController = new AbortController();

  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;

    timeoutController.abort();
  }, timeoutMs);


  // --------------------------------------------------
  // 2. Connect external AbortController
  //    from App.jsx to internal controller
  // --------------------------------------------------

  const handleExternalAbort = () => {
    timeoutController.abort();
  };

  if (signal) {
    // If request was already aborted
    if (signal.aborted) {
      timeoutController.abort();
    } else {
      signal.addEventListener(
        'abort',
        handleExternalAbort,
        { once: true }
      );
    }
  }


  try {
    // --------------------------------------------------
    // 3. Send request to backend
    // --------------------------------------------------

    const response = await fetch(
      `${API_BASE}/generate`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({
          mode,
          input
        }),

        signal: timeoutController.signal
      }
    );


    // --------------------------------------------------
    // 4. Parse backend response safely
    // --------------------------------------------------

    let result;

    try {
      result = await response.json();
    } catch {
      const error = new Error(
        'The backend returned an invalid response. Please try again.'
      );

      error.code = 'INVALID_SERVER_RESPONSE';
      error.status = response.status;

      throw error;
    }


    // --------------------------------------------------
    // 5. Handle backend errors
    // --------------------------------------------------

    if (!response.ok || !result.success) {
      const errorMessage =
        result?.error?.message ||
        `Server returned HTTP ${response.status}`;

      const errorCode =
        result?.error?.code ||
        'HTTP_ERROR';

      const error = new Error(errorMessage);

      error.code = errorCode;
      error.status = response.status;

      throw error;
    }


    // --------------------------------------------------
    // 6. Validate successful response
    // --------------------------------------------------

    if (!result.data) {
      const error = new Error(
        'Backend returned an empty data response.'
      );

      error.code = 'EMPTY_SERVER_DATA';
      error.status = response.status;

      throw error;
    }


    return result.data;

  } catch (err) {

    // --------------------------------------------------
    // 7. Timeout handling
    // --------------------------------------------------

    if (timedOut) {
      const timeoutError = new Error(
        'The request timed out after 30 seconds. ' +
        'Gemini might be experiencing high latency. ' +
        'Please retry.'
      );

      timeoutError.code = 'TIMEOUT';

      throw timeoutError;
    }


    // --------------------------------------------------
    // 8. User-initiated / superseded request
    // --------------------------------------------------

    if (
      err?.name === 'AbortError' ||
      signal?.aborted
    ) {
      // Do not convert this into a network error.
      // App.jsx uses this to ignore cancelled requests.
      throw err;
    }


    // --------------------------------------------------
    // 9. Backend/network error
    // --------------------------------------------------

    if (
      err instanceof TypeError ||
      !err?.status
    ) {
      const networkError = new Error(
        'Unable to connect to the backend server. ' +
        'Please check your internet connection or try again later.'
      );

      networkError.code = 'NETWORK_ERROR';

      throw networkError;
    }


    // --------------------------------------------------
    // 10. Re-throw structured backend error
    // --------------------------------------------------

    throw err;

  } finally {

    // --------------------------------------------------
    // 11. Always clean up timeout and event listener
    // --------------------------------------------------

    clearTimeout(timeoutId);

    if (signal) {
      signal.removeEventListener(
        'abort',
        handleExternalAbort
      );
    }
  }
}


/**
 * Checks backend health and Gemini configuration status.
 *
 * @returns {Promise<object>}
 */
export async function checkBackendHealth() {
  try {

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);


    const response = await fetch(
      `${API_BASE}/health`,
      {
        signal: controller.signal
      }
    );


    clearTimeout(timeoutId);


    if (!response.ok) {
      return {
        healthy: false,
        hasGeminiKey: false
      };
    }


    const data = await response.json();


    return {
      healthy: true,
      hasGeminiKey: Boolean(data.hasGeminiKey)
    };

  } catch {

    return {
      healthy: false,
      hasGeminiKey: false
    };
  }
}
