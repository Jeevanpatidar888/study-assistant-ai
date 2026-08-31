import React from 'react';

/**
 * Accessible, smooth progress bar.
 * @param {object} props
 * @param {number} props.current Current step index (1-based)
 * @param {number} props.total Total number of steps
 * @param {string} [props.label] Optional descriptive label
 */
export default function ProgressBar({ current, total, label }) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal);
  const percentage = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className="progress-container" role="region" aria-label={label || "Progress tracker"}>
      <div className="progress-header">
        <span className="progress-label">{label || 'Progress'}</span>
        <span className="progress-stats">
          <strong className="progress-current">{safeCurrent}</strong> of {safeTotal}
          <span className="progress-percent">({percentage}%)</span>
        </span>
      </div>
      <div 
        className="progress-track"
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={0}
        aria-valuemax={safeTotal}
        aria-valuetext={`Step ${safeCurrent} of ${safeTotal}`}
      >
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
