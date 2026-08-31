import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Layers, 
  HelpCircle, 
  BookOpen, 
  RotateCcw,
  CheckCircle2,
  Cpu,
  AlertTriangle,
  Github
} from 'lucide-react';
import InputForm from './components/InputForm.jsx';
import FlashcardDeck from './components/FlashcardDeck.jsx';
import Quiz from './components/Quiz.jsx';
import LoadingState from './components/LoadingState.jsx';
import ErrorState from './components/ErrorState.jsx';
import EmptyState from './components/EmptyState.jsx';
import { generateStudyMaterial, checkBackendHealth } from './services/api.js';

export default function App() {
  // Primary application states
  const [studyData, setStudyData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentMode, setCurrentMode] = useState('flashcards');
  const [lastParams, setLastParams] = useState(null); // Used for 1-click retry

  // Backend connection & key status
  const [serverHealth, setServerHealth] = useState({ healthy: false, hasGeminiKey: false });

  // RACE CONDITION & STALE RESPONSE PROTECTION:
  // 1. requestIdRef: Incremented monotonically on every new submission.
  //    Responses matching an older requestId are ignored even if they finish.
  // 2. abortControllerRef: Cancels in-flight fetch request immediately when a new request is made.
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(setServerHealth);
  }, []);

  /**
   * Dispatches generation request with complete race-condition safety.
   */
  const handleGenerate = async ({ mode, input }) => {
    // 1. Abort previous in-flight request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('SUPERSEDED_BY_NEW_REQUEST');
    }

    // 2. Increment request ID for sequential stale response protection
    requestIdRef.current += 1;
    const thisRequestId = requestIdRef.current;

    // 3. Create fresh AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 4. Update UI states
    setCurrentMode(mode);
    setLastParams({ mode, input });
    setIsLoading(true);
    setError(null);
    setStudyData(null);

    try {
      const data = await generateStudyMaterial({
        mode,
        input,
        signal: controller.signal
      });

      // 5. Stale Response Protection Check:
      // If user fired another submission while this was resolving, ignore this result!
      if (thisRequestId !== requestIdRef.current) {
        console.warn(`[StaleResponseGuard] Discarding response from request #${thisRequestId} (Current is #${requestIdRef.current})`);
        return;
      }

      setStudyData(data);
      setError(null);
    } catch (err) {
      // If aborted because a newer request started, do not show error to user
      if (err.name === 'AbortError' || err === 'SUPERSEDED_BY_NEW_REQUEST') {
        console.log(`[AbortController] Request #${thisRequestId} was aborted in favor of a newer request.`);
        return;
      }

      // Check if this request is still the active one before setting error
      if (thisRequestId === requestIdRef.current) {
        setError(err);
        setStudyData(null);
      }
    } finally {
      // Only clear loading state if this is still the active request
      if (thisRequestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleRetry = () => {
    if (lastParams) {
      handleGenerate(lastParams);
    }
  };

  const handleClearSession = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('USER_CLEARED_SESSION');
    }
    setStudyData(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <header className="app-header">
        <div className="header-inner container">
          <div className="brand-group">
            <div className="brand-icon-box">
              <Sparkles size={22} className="brand-sparkle" />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">StudySphere AI</h1>
              <span className="brand-subtitle">Interactive AI Learning Workspace</span>
            </div>
          </div>

          <div className="header-status-indicators">
            <div className={`status-pill ${serverHealth.hasGeminiKey ? 'pill-active' : 'pill-demo'}`} title={serverHealth.hasGeminiKey ? 'Gemini 2.5 Flash active' : 'Running in intelligent demo mode'}>
              <Cpu size={14} />
              <span>{serverHealth.hasGeminiKey ? 'Gemini 2.5 Active' : 'Demo Engine (No Key Required)'}</span>
            </div>

            {studyData && (
              <button
                type="button"
                className="clear-session-btn"
                onClick={handleClearSession}
                title="Start a new study session"
              >
                <RotateCcw size={14} />
                <span>New Session</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content container">
        {/* Step 1: Input Panel */}
        <section className="input-section" aria-label="Input Topic and Configuration">
          <InputForm
            onSubmit={handleGenerate}
            isLoading={isLoading}
            initialMode={currentMode}
          />
        </section>

        {/* Step 2: Interactive Study Area */}
        <section className="display-section" aria-label="Study Results Display">
          {isLoading && <LoadingState mode={currentMode} />}

          {!isLoading && error && (
            <ErrorState error={error} onRetry={handleRetry} />
          )}

          {!isLoading && !error && !studyData && (
            <EmptyState />
          )}

          {!isLoading && !error && studyData && (
            <div className="study-data-display animate-fade-in">
              {studyData.type === 'flashcards' && (
                <FlashcardDeck data={studyData} />
              )}
              {studyData.type === 'quiz' && (
                <Quiz data={studyData} />
              )}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner container">
          <p className="footer-text">
            Frontend Internship Assignment &bull; Structured AI Output &bull; Zero Chatbot UI
          </p>
          <div className="footer-badges">
            <span className="footer-badge">React 18</span>
            <span className="footer-badge">Vite</span>
            <span className="footer-badge">Express</span>
            <span className="footer-badge">Gemini API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
