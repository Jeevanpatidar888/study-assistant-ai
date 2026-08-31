import React from 'react';
import { Loader2, Sparkles, Brain, Cpu } from 'lucide-react';

/**
 * Polished loading state with animated status cues and skeleton preview.
 * @param {object} props
 * @param {'flashcards' | 'quiz'} props.mode
 */
export default function LoadingState({ mode }) {
  return (
    <div className="loading-state-card" role="status" aria-live="polite">
      <div className="loading-animation-container">
        <div className="pulsing-halo" />
        <div className="loading-icon-center">
          <Brain className="brain-pulse-icon" size={32} />
        </div>
      </div>

      <div className="loading-meta">
        <h3 className="loading-title">
          Synthesizing {mode === 'flashcards' ? 'Flashcards' : 'Quiz'}
        </h3>
        <p className="loading-subtitle">
          Gemini is analyzing your notes, extracting key concepts, and structuring verified JSON...
        </p>
      </div>

      {/* Progress Skeleton Simulation */}
      <div className="skeleton-preview-box">
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-body-1" />
        <div className="skeleton-line skeleton-body-2" />
        <div className="skeleton-line skeleton-btn" />
      </div>

      <div className="loading-safety-note">
        <span>Protected against network stalls and stale requests</span>
      </div>
    </div>
  );
}
