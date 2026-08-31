import React from 'react';
import { BookOpen, HelpCircle, CheckCircle, Zap, ShieldCheck } from 'lucide-react';

/**
 * Clean empty onboarding state showing how to get started.
 */
export default function EmptyState() {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-cluster">
        <div className="icon-bubble bubble-1">
          <BookOpen size={24} />
        </div>
        <div className="icon-bubble bubble-center">
          <Zap size={28} />
        </div>
        <div className="icon-bubble bubble-2">
          <HelpCircle size={24} />
        </div>
      </div>

      <h3 className="empty-title">Ready to Transform Your Notes?</h3>
      <p className="empty-description">
        Enter any topic, code snippet, or lecture notes above. Select <strong>Flashcards</strong> for spaced active recall, or a <strong>Quiz</strong> for self-assessment.
      </p>

      <div className="feature-badges-row">
        <span className="feature-pill">
          <CheckCircle size={14} /> Strict JSON Validation
        </span>
        <span className="feature-pill">
          <ShieldCheck size={14} /> Stale-Response Protected
        </span>
        <span className="feature-pill">
          <Zap size={14} /> Zero Chatbot Fluff
        </span>
      </div>
    </div>
  );
}
