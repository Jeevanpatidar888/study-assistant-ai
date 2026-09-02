import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  Check,
  Layers
} from 'lucide-react';
import Flashcard from './Flashcard.jsx';
import ProgressBar from './ProgressBar.jsx';

/**
 * Deck manager for flashcards.
 * Handles card flipping, pagination, navigation, restart, and keyboard shortcuts.
 *
 * @param {object} props
 * @param {object} props.data
 * @param {function} [props.onResetAll] Optional full app reset
 */
export default function FlashcardDeck({ data, onResetAll }) {
  const initialCards = data?.cards || [];

  const [cards, setCards] = useState(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState(new Set());

  // Reset when new data is passed
  useEffect(() => {
    setCards(data?.cards || []);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
  }, [data]);

  const currentCard = cards[currentIndex];
  const totalCards = cards.length;

  // Go to next card
  const handleNext = useCallback(() => {
    if (currentIndex < totalCards - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, totalCards]);

  // Go to previous card
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Restart deck
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredIds(new Set());
  }, []);

  // Shuffle cards
  const handleShuffle = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);

    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [cards]);

  // Mark / unmark current card as mastered
  const handleToggleMastered = useCallback(() => {
    if (!currentCard) return;

    setMasteredIds(prev => {
      const next = new Set(prev);

      if (next.has(currentCard.id)) {
        next.delete(currentCard.id);
      } else {
        next.add(currentCard.id);
      }

      return next;
    });
  }, [currentCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not capture keyboard shortcuts when user is typing
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        // Previous card
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;

        // Next card
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;

        // Flip card
        case ' ':
        case 'Enter':
          e.preventDefault();
          setIsFlipped(prev => !prev);
          break;

        // Restart
        case 'r':
        case 'R':
          e.preventDefault();
          handleRestart();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNext, handlePrev, handleRestart]);

  // Empty state
  if (!cards || cards.length === 0) {
    return (
      <div className="empty-deck">
        <p>No flashcards available in this deck.</p>

        {onResetAll && (
          <button
            type="button"
            className="action-pill-btn"
            onClick={onResetAll}
          >
            Create New Deck
          </button>
        )}
      </div>
    );
  }

  const isCurrentMastered = currentCard
    ? masteredIds.has(currentCard.id)
    : false;

  return (
    <section
      className="flashcard-deck-section"
      aria-label="Flashcard Study Session"
    >
      {/* Deck Header */}
      <div className="deck-header">
        <div className="deck-title-row">
          <div className="deck-badge">
            <Layers size={16} />
            Flashcard Deck
          </div>

          <h2 className="deck-title">
            {data?.title || 'Flashcard Deck'}
          </h2>
        </div>

        <div className="deck-quick-actions">
          <button
            type="button"
            className="action-pill-btn"
            onClick={handleShuffle}
            title="Shuffle card order"
          >
            <Shuffle size={14} />
            Shuffle
          </button>

          <button
            type="button"
            className="action-pill-btn"
            onClick={handleRestart}
            title="Restart session from card 1"
          >
            <RotateCcw size={14} />
            Restart
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        current={currentIndex + 1}
        total={totalCards}
        label="Deck Progress"
      />

      {/* Main Flashcard Display */}
      <div className="active-card-wrapper">
        <Flashcard
          card={currentCard}
          index={currentIndex}
          isFlipped={isFlipped}
          onFlip={setIsFlipped}
        />
      </div>

      {/* Controls & Pagination Bar */}
      <div className="deck-controls-bar">
        {/* Previous */}
        <button
          type="button"
          className="nav-btn prev-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous card"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        {/* Center Actions */}
        <div className="deck-center-actions">
          <button
            type="button"
            className={`master-toggle-btn ${
              isCurrentMastered ? 'mastered' : ''
            }`}
            onClick={handleToggleMastered}
            title={
              isCurrentMastered
                ? 'Mark as unmastered'
                : 'Mark as mastered'
            }
          >
            <Check size={16} />

            <span>
              {isCurrentMastered
                ? 'Mastered'
                : 'Mark Mastered'}
            </span>
          </button>

          <span className="card-counter-tag">
            Card {currentIndex + 1} of {totalCards}
          </span>
        </div>

        {/* Next */}
        <button
          type="button"
          className="nav-btn next-btn"
          onClick={handleNext}
          disabled={currentIndex === totalCards - 1}
          aria-label="Next card"
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Keyboard Shortcut Hints */}
      <div className="keyboard-shortcuts-guide">
        <span className="shortcut-item">
          <kbd>&larr;</kbd> Previous
        </span>

        <span className="shortcut-item">
          <kbd>&rarr;</kbd> Next
        </span>

        <span className="shortcut-item">
          <kbd>Space</kbd> / <kbd>Enter</kbd> Flip
        </span>

        <span className="shortcut-item">
          <kbd>R</kbd> Restart
        </span>
      </div>
    </section>
  );
}
