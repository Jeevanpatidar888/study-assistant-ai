import React from 'react';
import { AlertCircle, RefreshCw, HelpCircle, ShieldAlert } from 'lucide-react';

/**
 * Polished user-facing error state with actionable recovery.
 * @param {object} props
 * @param {Error|object} props.error
 * @param {function} props.onRetry
 */
export default function ErrorState({ error, onRetry }) {
  const errorMessage = error?.message || 'An unexpected error occurred while processing your request.';
  const errorCode = error?.code || 'UNEXPECTED_ERROR';

  return (
    <div className="error-state-card" role="alert">
      <div className="error-icon-wrapper">
        <AlertCircle size={36} className="error-icon" />
      </div>

      <div className="error-details">
        <span className="error-code-badge">{errorCode}</span>
        <h3 className="error-title">Generation Error</h3>
        <p className="error-message-text">{errorMessage}</p>
      </div>

      <div className="error-troubleshooting-tips">
        <span className="tips-title">Possible resolutions:</span>
        <ul className="tips-list">
          <li>Check that your backend server is running at <code>http://localhost:5000</code>.</li>
          <li>Verify your <code>GEMINI_API_KEY</code> in <code>backend/.env</code>, or run without key for smart demo data.</li>
          <li>Try simplifying or rephrasing your input notes.</li>
        </ul>
      </div>

      {onRetry && (
        <div className="error-actions-row">
          <button
            type="button"
            className="retry-button"
            onClick={onRetry}
          >
            <RefreshCw size={16} />
            <span>Retry Request</span>
          </button>
        </div>
      )}
    </div>
  );
}
