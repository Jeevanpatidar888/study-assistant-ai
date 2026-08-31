import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  RotateCcw, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Award,
  HelpCircle
} from 'lucide-react';
import QuizQuestion from './QuizQuestion.jsx';
import ProgressBar from './ProgressBar.jsx';

/**
 * Full Quiz management component.
 * Tracks user score, tracks incorrect questions, allows re-testing only wrong answers,
 * and displays comprehensive performance insights.
 * @param {object} props
 * @param {object} props.data { type: 'quiz', title: string, questions: Array }
 */
export default function Quiz({ data }) {
  const allQuestions = data?.questions || [];
  const [activeQuestionList, setActiveQuestionList] = useState(allQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState({}); // { [questionId]: { isCorrect, selectedOption } }
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRetestMode, setIsRetestMode] = useState(false);

  // Synchronize when incoming data changes
  useEffect(() => {
    setActiveQuestionList(data?.questions || []);
    setCurrentIndex(0);
    setAnswersMap({});
    setIsCompleted(false);
    setIsRetestMode(false);
  }, [data]);

  const currentQuestion = activeQuestionList[currentIndex];
  const totalInCurrentRun = activeQuestionList.length;

  const handleAnswerSubmitted = ({ questionId, selectedOption, isCorrect }) => {
    setAnswersMap(prev => ({
      ...prev,
      [questionId]: { isCorrect, selectedOption }
    }));

    if (currentIndex < totalInCurrentRun - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  // Full retry from question 1
  const handleRestartFull = () => {
    setActiveQuestionList(allQuestions);
    setCurrentIndex(0);
    setAnswersMap({});
    setIsCompleted(false);
    setIsRetestMode(false);
  };

  // Retest ONLY questions answered incorrectly in this run
  const handleRetestWrong = () => {
    const wrongQuestions = allQuestions.filter(q => {
      const recorded = answersMap[q.id];
      return recorded && !recorded.isCorrect;
    });

    if (wrongQuestions.length === 0) return;

    setActiveQuestionList(wrongQuestions);
    setCurrentIndex(0);
    // Keep past answers or reset subset
    const newAnswers = { ...answersMap };
    wrongQuestions.forEach(q => delete newAnswers[q.id]);
    setAnswersMap(newAnswers);
    setIsCompleted(false);
    setIsRetestMode(true);
  };

  if (!allQuestions || allQuestions.length === 0) {
    return (
      <div className="empty-quiz">
        <p>No questions generated for this quiz.</p>
      </div>
    );
  }

  // Calculate scores
  const answeredCount = Object.keys(answersMap).length;
  const correctCount = Object.values(answersMap).filter(a => a.isCorrect).length;
  const wrongCount = answeredCount - correctCount;
  const scorePercent = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

  // Render Completion Screen
  if (isCompleted) {
    return (
      <div className="quiz-summary-card animate-fade-in">
        <div className="quiz-summary-header">
          <div className="trophy-badge">
            <Trophy size={36} className="trophy-icon" />
          </div>
          <h2 className="summary-title">Quiz Completed!</h2>
          <p className="summary-subtitle">{data.title}</p>
        </div>

        {/* Score Circle / Metric */}
        <div className="score-metric-box">
          <div className="score-huge">{scorePercent}%</div>
          <div className="score-breakdown-row">
            <span className="breakdown-tag success">
              <CheckCircle2 size={16} /> {correctCount} Correct
            </span>
            <span className="breakdown-tag danger">
              <XCircle size={16} /> {wrongCount} Incorrect
            </span>
            <span className="breakdown-tag neutral">
              <HelpCircle size={16} /> {answeredCount} Total
            </span>
          </div>
        </div>

        {/* Performance assessment message */}
        <div className="performance-feedback">
          {scorePercent >= 80 ? (
            <p className="feedback-text high">
              <Award size={18} /> Outstanding mastery! You have a firm grasp of these concepts.
            </p>
          ) : scorePercent >= 50 ? (
            <p className="feedback-text medium">
              <CheckCircle2 size={18} /> Good effort! Review the missed concepts to solidify your recall.
            </p>
          ) : (
            <p className="feedback-text low">
              <AlertTriangle size={18} /> Keep practicing! Active recall builds stronger retention over time.
            </p>
          )}
        </div>

        {/* Action Buttons: Retry Full or Re-test Incorrect */}
        <div className="quiz-summary-actions">
          {wrongCount > 0 && (
            <button
              type="button"
              className="action-btn retest-wrong-btn"
              onClick={handleRetestWrong}
            >
              <RefreshCw size={17} />
              <span>Re-test {wrongCount} Missed Question{wrongCount > 1 ? 's' : ''}</span>
            </button>
          )}

          <button
            type="button"
            className="action-btn retry-full-btn"
            onClick={handleRestartFull}
          >
            <RotateCcw size={17} />
            <span>Retake Full Quiz</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="quiz-section" aria-label="Diagnostic Quiz Session">
      {/* Quiz Header */}
      <div className="quiz-header-bar">
        <div className="quiz-title-box">
          <span className="quiz-status-pill">
            {isRetestMode ? 'Focus Drill (Missed Questions)' : 'Diagnostic Quiz'}
          </span>
          <h2 className="quiz-main-title">{data.title}</h2>
        </div>

        <button
          type="button"
          className="restart-link-btn"
          onClick={handleRestartFull}
          title="Restart quiz from beginning"
        >
          <RotateCcw size={14} /> Restart Quiz
        </button>
      </div>

      {/* Progress Bar */}
      <ProgressBar
        current={currentIndex + 1}
        total={totalInCurrentRun}
        label={`Question ${currentIndex + 1} of ${totalInCurrentRun}`}
      />

      {/* Active Question Component */}
      {currentQuestion && (
        <QuizQuestion
          questionObj={currentQuestion}
          index={currentIndex}
          isLastQuestion={currentIndex === totalInCurrentRun - 1}
          onAnswerSubmitted={handleAnswerSubmitted}
        />
      )}
    </section>
  );
}
