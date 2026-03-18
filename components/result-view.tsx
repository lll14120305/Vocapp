"use client"

import { CheckCircle2, XCircle, RotateCcw, Settings2, ChevronLeft, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizAnswer } from "@/app/page"

// BỘ LỌC TỰ ĐỘNG HIỂN THỊ FURIGANA
const FuriganaText = ({ text }: { text: string }) => {
  if (!text) return <span>---</span>;
  const regex = /\[([^\[\]]+)\[([^\[\]]+)\]\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    parts.push(
      <ruby key={`ruby-${match.index}`} className="mx-0.5">
        {match[1]}
        <rt className="text-[0.6em] text-muted-foreground">{match[2]}</rt>
      </ruby>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }
  return <>{parts}</>;
};

interface ResultViewProps {
  score: number
  totalQuestions: number
  answers: QuizAnswer[]
  onStudyAgain: () => void
  onUpdateData: () => void
  onBack: () => void
}

export function ResultView({
  score,
  totalQuestions,
  answers,
  onStudyAgain,
  onUpdateData,
  onBack,
}: ResultViewProps) {
  const percentage = Math.round((score / totalQuestions) * 100)

  const getScoreMessage = () => {
    if (percentage >= 90) return "Excellent work!"
    if (percentage >= 70) return "Great job!"
    if (percentage >= 50) return "Good effort!"
    return "Keep practicing!"
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      {/* Header with Back Button */}
      <header className="mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </header>

      {/* Score Header */}
      <div className="mb-6 text-center">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Your Score
        </p>
        <p className="text-5xl font-bold text-foreground">
          {score}/{totalQuestions}
        </p>
        <p className="mt-2 text-lg text-muted-foreground">{percentage}% Correct</p>
        <p className="mt-1 text-sm font-medium text-primary">{getScoreMessage()}</p>
      </div>

      {/* Review Your Answers Section */}
      <div className="mb-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Review Your Answers</h2>
        <div className="flex-1 space-y-4 overflow-auto max-h-[calc(100dvh-400px)]">
          {answers.map((answer, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card p-4"
            >
              {/* Question */}
              <div className="mb-3">
                <span className="text-xs font-medium text-muted-foreground">Question {index + 1}</span>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {/* ĐÃ LẮP BỘ LỌC FURIGANA VÀO ĐÂY */}
                  <FuriganaText text={answer.question} />
                </p>
              </div>

              {/* User's Answer */}
              <div className={`mb-2 flex items-center gap-2 rounded-lg p-2 ${
                answer.isCorrect 
                  ? "bg-green-50 dark:bg-green-950/30" 
                  : "bg-red-50 dark:bg-red-950/30"
              }`}>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${
                  answer.isCorrect 
                    ? "bg-green-500" 
                    : "bg-red-500"
                }`}>
                  {answer.isCorrect ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <X className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">Your answer:</span>
                <span className={`text-sm font-medium ${
                  answer.isCorrect 
                    ? "text-green-700 dark:text-green-400" 
                    : "text-red-700 dark:text-red-400"
                }`}>
                  {answer.userAnswer || "Chưa chọn đáp án"}
                </span>
              </div>

              {/* Correct Answer (only show if incorrect) */}
              {!answer.isCorrect && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/30 p-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Correct answer:</span>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    {answer.correctAnswer}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <Button
          onClick={onStudyAgain}
          className="h-14 w-full text-base font-medium"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          Study Again
        </Button>
      </div>
    </div>
  )
}