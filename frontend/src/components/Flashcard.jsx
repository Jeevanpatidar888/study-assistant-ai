import React, { useState } from 'react';
import { RotateCw, CheckCircle2, HelpCircle } from 'lucide-react';

/**
 * Interactive 3D flip card component for active recall.
 * @param {object} props
 * @param {object} props.card { id, question, answer }
 * @param {number} props.index Current card index (0-based)
 * @param {boolean} [props.isFlipped] External flip state or controlled
 * @param {function} [props.onFlip] Callback on flip
 */
export default function Flashcard({ card, index, isFlipped, onFlip }) {
  const [internalFlipped, setInternalFlipped] = useState(false);

  // Support both controlled and uncontrolled flip state
  const flipped = isFlipped !== undefined ? isFlipped : internalFlipped;

  const handleToggleFlip = () => {
    if (onFlip) {
      onFlip(!flipped);
    } else {
      setInternalFlipped(!flipped);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleFlip();
    }
  };

  return (
    <div 
      className={`flashcard-scene ${flipped ? 'flipped' : ''}`}
      onClick={handleToggleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Flashcard ${index + 1}. ${flipped ? 'Showing Answer: ' + card.answer : 'Showing Question: ' + card.question}. Press Enter or Space to flip.`}
      aria-pressed={flipped}
    >
      <div className="flashcard-inner">
        {/* Front Side: Question */}
        <div className="flashcard-face flashcard-front">
          <div className="card-top-bar">
            <span className="card-badge question-badge">
              <HelpCircle size={14} className="icon-sm" /> Question
            </span>
            <span className="card-flip-prompt">
              <RotateCw size={13} className="spin-hover" /> Click or Space to flip
            </span>
          </div>

          <div className="card-body">
            <p className="card-text">{card.question}</p>
          </div>

          <div className="card-footer">
            <span className="card-hint">Test your active recall before flipping!</span>
          </div>
        </div>

        {/* Back Side: Answer */}
        <div className="flashcard-face flashcard-back">
          <div className="card-top-bar">
            <span className="card-badge answer-badge">
              <CheckCircle2 size={14} className="icon-sm" /> Answer
            </span>
            <span className="card-flip-prompt">
              <RotateCw size={13} /> Click or Space to flip back
            </span>
          </div>

          <div className="card-body">
            <p className="card-text answer-text">{card.answer}</p>
          </div>

          <div className="card-footer">
            <span className="card-hint">Did you recall this correctly?</span>
          </div>
        </div>
      </div>
    </div>
  );
}
