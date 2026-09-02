import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Cpu
} from 'lucide-react';

import InputForm from './components/InputForm.jsx';
import FlashcardDeck from './components/FlashcardDeck.jsx';
import Quiz from './components/Quiz.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import EmptyState from './components/EmptyState.jsx';

import {
  generateStudyMaterial,
  checkBackendHealth
} from './services/api.js';


export default function App() {

  // --------------------------------------------------
  // PRIMARY APPLICATION STATES
  // --------------------------------------------------

  const [studyData, setStudyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [currentMode, setCurrentMode] =
    useState('flashcards');

  // Used for one-click retry
  const [lastParams, setLastParams] = useState(null);


  // --------------------------------------------------
  // BACKEND HEALTH STATE
  // --------------------------------------------------

  const [serverHealth, setServerHealth] = useState({
    healthy: false,
    hasGeminiKey: false
  });


  // --------------------------------------------------
  // REQUEST / RACE CONDITION PROTECTION
  // --------------------------------------------------

  /*
   * requestIdRef:
   *
   * Every new request gets a new ID.
   *
   * Example:
   *
   * Request A -> ID 1
   * Request B -> ID 2
   *
   * If Request A finishes after Request B,
   * Request A will be ignored.
   */

  const requestIdRef = useRef(0);


  /*
   * abortControllerRef:
   *
   * Stores the currently running request controller.
   *
   * When a new request starts,
   * the previous request is cancelled.
   */

  const abortControllerRef = useRef(null);


  // --------------------------------------------------
  // CHECK BACKEND HEALTH ON APP LOAD
  // --------------------------------------------------

  useEffect(() => {

    checkBackendHealth()
      .then(setServerHealth)
      .catch(() => {
        setServerHealth({
          healthy: false,
          hasGeminiKey: false
        });
      });

  }, []);


  // --------------------------------------------------
  // GENERATE STUDY MATERIAL
  // --------------------------------------------------

  const handleGenerate = async ({ mode, input }) => {

    // ----------------------------------------------
    // 1. CANCEL PREVIOUS REQUEST
    // ----------------------------------------------

    if (abortControllerRef.current) {

      abortControllerRef.current.abort();

    }


    // ----------------------------------------------
    // 2. INCREMENT REQUEST ID
    // ----------------------------------------------

    requestIdRef.current += 1;

    const thisRequestId =
      requestIdRef.current;


    // ----------------------------------------------
    // 3. CREATE NEW ABORT CONTROLLER
    // ----------------------------------------------

    const controller =
      new AbortController();

    abortControllerRef.current =
      controller;


    // ----------------------------------------------
    // 4. UPDATE UI STATES
    // ----------------------------------------------

    setCurrentMode(mode);

    setLastParams({
      mode,
      input
    });

    setIsLoading(true);

    setError(null);

    setStudyData(null);


    try {

      // --------------------------------------------
      // 5. CALL BACKEND API
      // --------------------------------------------

      const data =
        await generateStudyMaterial({
          mode,
          input,
          signal: controller.signal
        });


      // --------------------------------------------
      // 6. STALE RESPONSE PROTECTION
      // --------------------------------------------

      /*
       * If another request has already started,
       * ignore this old response.
       */

      if (
        thisRequestId !==
        requestIdRef.current
      ) {

        console.warn(
          `[StaleResponseGuard] ` +
          `Discarding response from request #${thisRequestId}. ` +
          `Current request is #${requestIdRef.current}.`
        );

        return;
      }


      // --------------------------------------------
      // 7. INVALID DATA PROTECTION
      // --------------------------------------------

      if (
        !data ||
        typeof data !== 'object'
      ) {

        const invalidDataError =
          new Error(
            'The server returned invalid study data. Please try again.'
          );

        invalidDataError.code =
          'INVALID_STUDY_DATA';

        throw invalidDataError;
      }


      // --------------------------------------------
      // 8. HANDLE SUCCESS
      // --------------------------------------------

      setStudyData(data);

      setError(null);

    } catch (err) {

      // --------------------------------------------
      // 9. HANDLE ABORTED REQUEST
      // --------------------------------------------

      /*
       * Abort can happen because:
       *
       * - user submitted another request
       * - user cleared session
       * - timeout happened
       *
       * Timeout is already converted to
       * TIMEOUT by api.js.
       */

      if (
        err?.name === 'AbortError' ||
        controller.signal.aborted
      ) {

        console.log(
          `[AbortController] ` +
          `Request #${thisRequestId} was cancelled.`
        );

        return;
      }


      // --------------------------------------------
      // 10. ONLY ACTIVE REQUEST CAN SET ERROR
      // --------------------------------------------

      if (
        thisRequestId ===
        requestIdRef.current
      ) {

        setError(err);

        setStudyData(null);

      }

    } finally {

      // --------------------------------------------
      // 11. ONLY ACTIVE REQUEST CAN STOP LOADING
      // --------------------------------------------

      if (
        thisRequestId ===
        requestIdRef.current
      ) {

        setIsLoading(false);

      }


      // --------------------------------------------
      // 12. CLEAN CURRENT CONTROLLER
      // --------------------------------------------

      if (
        thisRequestId ===
        requestIdRef.current
      ) {

        abortControllerRef.current =
          null;

      }

    }
  };


  // --------------------------------------------------
  // RETRY
  // --------------------------------------------------

  const handleRetry = () => {

    if (!lastParams) {
      return;
    }

    handleGenerate(lastParams);

  };


  // --------------------------------------------------
  // CLEAR SESSION
  // --------------------------------------------------

  const handleClearSession = () => {

    // Cancel current request
    if (abortControllerRef.current) {

      abortControllerRef.current.abort();

    }


    /*
     * IMPORTANT:
     *
     * Increment request ID so that any old response
     * becomes stale immediately.
     */

    requestIdRef.current += 1;


    // Reset UI
    setStudyData(null);

    setError(null);

    setIsLoading(false);

    setLastParams(null);

  };


  // --------------------------------------------------
  // RENDER UI
  // --------------------------------------------------

  return (
    <div className="app-layout">

      {/* ==========================================
          HEADER
          ========================================== */}

      <header className="app-header">

        <div className="header-inner container">

          {/* BRAND */}

          <div className="brand-group">

            <div className="brand-icon-box">

              <Sparkles
                size={22}
                className="brand-sparkle"
              />

            </div>


            <div className="brand-text">

              <h1 className="brand-title">
                StudySphere AI
              </h1>

              <span className="brand-subtitle">
                Interactive AI Learning Workspace
              </span>

            </div>

          </div>


          {/* STATUS */}

          <div className="header-status-indicators">

            <div
              className={
                `status-pill ${
                  serverHealth.healthy &&
                  serverHealth.hasGeminiKey
                    ? 'pill-active'
                    : 'pill-demo'
                }`
              }

              title={
                serverHealth.healthy &&
                serverHealth.hasGeminiKey
                  ? 'Gemini API is connected'
                  : 'Backend or Gemini API is unavailable'
              }
            >

              <Cpu size={14} />

              <span>
                {
                  serverHealth.healthy &&
                  serverHealth.hasGeminiKey
                    ? 'Gemini 3.6 Active'
                    : 'Backend Unavailable'
                }
              </span>

            </div>


            {/* NEW SESSION BUTTON */}

            {(studyData || error) && (

              <button
                type="button"
                className="clear-session-btn"
                onClick={handleClearSession}
                title="Start a new study session"
              >

                <RotateCcw size={14} />

                <span>
                  New Session
                </span>

              </button>

            )}

          </div>

        </div>

      </header>


      {/* ==========================================
          MAIN CONTENT
          ========================================== */}

      <main className="main-content container">

        {/* ========================================
            STEP 1: INPUT
            ======================================== */}

        <section
          className="input-section"
          aria-label="Input Topic and Configuration"
        >

          <InputForm
            onSubmit={handleGenerate}
            isLoading={isLoading}
            initialMode={currentMode}
          />

        </section>


        {/* ========================================
            STEP 2: RESULTS
            ======================================== */}

        <section
          className="display-section"
          aria-label="Study Results Display"
        >

          {/* LOADING STATE */}

          {isLoading && (
            <LoadingState
              mode={currentMode}
            />
          )}


          {/* ERROR STATE */}

          {!isLoading && error && (

            <ErrorState
              error={error}
              onRetry={handleRetry}
            />

          )}


          {/* EMPTY STATE */}

          {!isLoading &&
            !error &&
            !studyData && (

              <EmptyState />

            )
          }


          {/* SUCCESS STATE */}

          {!isLoading &&
            !error &&
            studyData && (

              <div
                className="study-data-display animate-fade-in"
              >

                {/* FLASHCARDS */}

                {studyData.type === 'flashcards' && (

                  <FlashcardDeck
                    data={studyData}
                  />

                )}


                {/* QUIZ */}

                {studyData.type === 'quiz' && (

                  <Quiz
                    data={studyData}
                  />

                )}

              </div>

            )
          }

        </section>

      </main>


      {/* ==========================================
          FOOTER
          ========================================== */}

      <footer className="app-footer">

        <div className="footer-inner container">

          <p className="footer-text">

            Frontend Internship Assignment
            &bull;
            Structured AI Output
            &bull;
            Zero Chatbot UI

          </p>


          <div className="footer-badges">

            <span className="footer-badge">
              React 18
            </span>

            <span className="footer-badge">
              Vite
            </span>

            <span className="footer-badge">
              Express
            </span>

            <span className="footer-badge">
              Gemini API
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}
