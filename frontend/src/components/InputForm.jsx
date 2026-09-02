import React, { useState } from 'react';
import { BookOpen, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';

const SAMPLE_TOPICS = [
  {
    title: 'React Hooks Lifecycle',
    snippet: 'Explain useState, useEffect dependencies, useRef mutations, and cleanups in React.'
  },
  {
    title: 'TCP vs UDP Protocols',
    snippet: 'Compare TCP connection handshake and reliability with UDP low-latency connectionless datagrams.'
  },
  {
    title: 'Photosynthesis Stages',
    snippet: 'Light-dependent reactions in thylakoid membranes and the Calvin cycle light-independent carbon fixation.'
  },
  {
    title: 'REST vs GraphQL',
    snippet: 'Key architectural differences, over-fetching vs under-fetching, endpoint design, and caching tradeoffs.'
  }
];

export default function InputForm({ onSubmit, isLoading, initialMode = 'flashcards' }) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState(initialMode);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    const trimmed = input.trim();

    if (!trimmed) {
        setValidationError('Please enter a question.');
        return;
    }

    if (trimmed.length < 3) {
        setValidationError('Please enter at least 3 characters.');
        return;
    }
    setValidationError('');
    onSubmit({ mode, input: trimmed });
  };

  const handleSelectSample = (sample) => {
    setInput(sample.snippet);
    setValidationError('');
  };

  return (
    <div className="input-card">
      <form onSubmit={handleSubmit} className="study-form">
        {/* Mode Selector */}
        <div className="mode-selector-group">
          <label className="section-label">1. Choose Study Format</label>
          <div className="mode-tabs" role="tablist" aria-label="Study Format">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'flashcards'}
              className={`mode-btn ${mode === 'flashcards' ? 'active' : ''}`}
              onClick={() => setMode('flashcards')}
              disabled={isLoading}
            >
              <BookOpen className="icon" size={18} />
              <div className="mode-text">
                <span className="mode-title">Flashcards</span>
                <span className="mode-desc">Active recall flip cards</span>
              </div>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={mode === 'quiz'}
              className={`mode-btn ${mode === 'quiz' ? 'active' : ''}`}
              onClick={() => setMode('quiz')}
              disabled={isLoading}
            >
              <HelpCircle className="icon" size={18} />
              <div className="mode-text">
                <span className="mode-title">Quiz</span>
                <span className="mode-desc">Multiple-choice test</span>
              </div>
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="input-group">
          <div className="input-label-row">
            <label htmlFor="study-input" className="section-label">
              2. Enter Topic or Paste Notes
            </label>
            <span className="char-count">{input.length} characters</span>
          </div>

          <textarea
            id="study-input"
            rows={5}
            className={`study-textarea ${validationError ? 'has-error' : ''}`}
            placeholder="e.g. Paste notes on binary search trees, or type 'Kubernetes Pod lifecycle and scheduling'..."
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (validationError) setValidationError('');
            }}
            disabled={isLoading}
          />

          {validationError && (
            <p className="field-error-text" role="alert">
              {validationError}
            </p>
          )}
        </div>

        {/* Starter Topic Chips */}
        <div className="sample-prompts-container">
          <span className="sample-label">Quick Suggestions:</span>
          <div className="sample-chips">
            {SAMPLE_TOPICS.map((sample) => (
              <button
                key={sample.title}
                type="button"
                className="sample-chip"
                onClick={() => handleSelectSample(sample)}
                disabled={isLoading}
              >
                {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="generate-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-sm" aria-hidden="true" />
              <span>Synthesizing with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="icon" size={18} />
              <span>Generate {mode === 'flashcards' ? 'Flashcards' : 'Quiz'}</span>
              <ArrowRight className="icon-end" size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
