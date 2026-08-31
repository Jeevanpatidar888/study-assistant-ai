import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, HelpCircle, ArrowRight } from 'lucide-react';

/**
 * Renders a single diagnostic multiple-choice question.
 * Provides instant feedback, accessible option states, and detailed explanations.
 * @param {object} props
 * @param {object} props.questionObj { id, question, options, correctAnswer, explanation }
 * @param {number} props.index
 * @param {function} props.onAnswerSubmitted Callback with { isCorrect, selectedOption }
 * @param {boolean} props.isLastQuestion
 */
export default function QuizQuestion({
  questionObj,
  index,
  onAnswerSubmitted,
  isLastQuestion
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setIsSubmitted(false);
  }, [questionObj]);

  const handleSelect = (option) => {
    if (isSubmitted) return; // Prevent changing after submission
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
  };

  const handleProceed = () => {
    const isCorrect = selectedOption.toLowerCase() === questionObj.correctAnswer.toLowerCase();
    onAnswerSubmitted({
      questionId: questionObj.id,
      selectedOption,
      isCorrect
    });
  };

  // Keyboard shortcut listener for options (1-4, A-D) and Enter
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (!isSubmitted) {
        // Map 1-4 or a-d to options
        const key = e.key.toUpperCase();
        let selectedIdx = -1;
        if (['1', '2', '3', '4'].includes(key)) {
          selectedIdx = parseInt(key, 10) - 1;
        } else if (['A', 'B', 'C', 'D'].includes(key)) {
          selectedIdx = key.charCodeAt(0) - 65;
        }

        if (selectedIdx >= 0 && selectedIdx < questionObj.options.length) {
          e.preventDefault();
          handleSelect(questionObj.options[selectedIdx]);
        } else if (e.key === 'Enter' && selectedOption) {
          e.preventDefault();
          handleSubmitAnswer();
        }
      } else {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleProceed();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitted, selectedOption, questionObj, handleProceed]);

  const isCurrentCorrect =
    selectedOption &&
    selectedOption.toLowerCase() === questionObj.correctAnswer.toLowerCase();

  return (
    <div className="quiz-question-card" role="region" aria-label={`Question ${index + 1}`}>
      {/* Question Header */}
      <div className="quiz-q-header">
        <span className="quiz-q-badge">
          <HelpCircle size={15} /> Question {index + 1}
        </span>
      </div>

      <h3 className="quiz-q-text">{questionObj.question}</h3>

      {/* Options List */}
      <div className="quiz-options-list" role="radiogroup" aria-label="Multiple choice options">
        {questionObj.options.map((option, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx); // A, B, C, D
          const isSelected = selectedOption === option;
          const isCorrectOption =
            option.toLowerCase() === questionObj.correctAnswer.toLowerCase();

          // Dynamic option styling based on submission state
          let optionClass = 'quiz-option-btn';
          if (isSelected) optionClass += ' selected';
          if (isSubmitted) {
            if (isCorrectOption) {
              optionClass += ' correct';
            } else if (isSelected && !isCorrectOption) {
              optionClass += ' incorrect';
            } else {
              optionClass += ' dimmed';
            }
          }

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={isSubmitted}
              className={optionClass}
              onClick={() => handleSelect(option)}
            >
              <span className="option-prefix">{letter}</span>
              <span className="option-text">{option}</span>

              {isSubmitted && isCorrectOption && (
                <CheckCircle2 className="option-status-icon success" size={18} />
              )}
              {isSubmitted && isSelected && !isCorrectOption && (
                <XCircle className="option-status-icon danger" size={18} />
              )}
            </button>
          );
        })}
      </div>

      {/* Submission / Next Action */}
      {!isSubmitted ? (
        <div className="quiz-action-row">
          <button
            type="button"
            className="submit-answer-btn"
            disabled={!selectedOption}
            onClick={handleSubmitAnswer}
          >
            Submit Answer
          </button>
        </div>
      ) : (
        <div className="explanation-box-wrapper animate-fade-in">
          {/* Result Header */}
          <div className={`answer-banner ${isCurrentCorrect ? 'banner-correct' : 'banner-wrong'}`}>
            {isCurrentCorrect ? (
              <>
                <CheckCircle2 size={20} />
                <span>Correct! Excellent recall.</span>
              </>
            ) : (
              <>
                <XCircle size={20} />
                <span>
                  Incorrect. Correct answer was: <strong>{questionObj.correctAnswer}</strong>
                </span>
              </>
            )}
          </div>

          {/* Explanation text */}
          <div className="explanation-content">
            <span className="explanation-title">Explanation:</span>
            <p className="explanation-text">{questionObj.explanation}</p>
          </div>

          {/* Next question or finish button */}
          <button
            type="button"
            className="next-q-btn"
            onClick={handleProceed}
          >
            <span>{isLastQuestion ? 'Complete Quiz & View Score' : 'Next Question'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
