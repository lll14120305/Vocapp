"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import type { QuizAnswer } from "@/app/page"
import type { TimeLimit, QuestionCount } from "@/components/dashboard-view"
import type { Deck } from "@/components/setup-view" // Đã thêm import Deck

interface QuizQuestion {
  id: number
  sentence: string
  options: string[]
  correctAnswer: string
}

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

interface QuizViewProps {
  deck: Deck // Đã thêm cổng nhận thông tin Deck
  vocabulary: any[]
  timeLimit: TimeLimit
  questionCount: QuestionCount
  onComplete: (answers: QuizAnswer[], score: number) => void
  onQuit: () => void
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

export function QuizView({ deck, vocabulary, timeLimit, questionCount, onComplete, onQuit }: QuizViewProps) {
  const numQuestions = parseInt(questionCount)
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([])
  const [showEndModal, setShowEndModal] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(() => {
    if (timeLimit === "none") return null
    return parseInt(timeLimit) * 60
  })

  // NÃO BỘ TẠO ĐỀ THI THEO TỶ LỆ (Đã sửa lỗi nhận diện Deck)
  useEffect(() => {
    const validVocab = vocabulary.filter(v => 
      (v["Từ vựng"] || v.kanji || v.Word) && (v["Ý nghĩa"] || v.meaning || v.Meaning)
    )

    if (validVocab.length < 4) {
      alert("Kho từ vựng của bạn phải có ít nhất 4 từ để tạo trắc nghiệm!");
      onQuit();
      return;
    }

    // Lấy lịch sử học tập chuẩn xác của Deck đang học
    const stats = JSON.parse(localStorage.getItem(`stats-${deck.id}`) || "{}"); 

    const pools = {
      unlearned: validVocab.filter(v => (stats[v["Từ vựng"] || v.kanji || v.Word]?.attempts || 0) === 0),
      red: validVocab.filter(v => (stats[v["Từ vựng"] || v.kanji || v.Word]?.mistakes || 0) >= 2),
      yellow: validVocab.filter(v => (stats[v["Từ vựng"] || v.kanji || v.Word]?.mistakes || 0) === 1),
      learned: validVocab.filter(v => (stats[v["Từ vựng"] || v.kanji || v.Word]?.attempts || 0) > 0 && (stats[v["Từ vựng"] || v.kanji || v.Word]?.mistakes || 0) === 0)
    };

    const pickRandom = (arr: any[], count: number) => shuffleArray(arr).slice(0, count);

    let selected: any[] = [];
    selected = [...selected, ...pickRandom(pools.unlearned, Math.round(numQuestions * 0.5))];
    selected = [...selected, ...pickRandom(pools.red, Math.round(numQuestions * 0.25))];
    selected = [...selected, ...pickRandom(pools.yellow, Math.round(numQuestions * 0.20))];
    selected = [...selected, ...pickRandom(pools.learned, Math.round(numQuestions * 0.05))];

    if (selected.length < numQuestions) {
      const remaining = validVocab.filter(v => !selected.includes(v));
      selected = [...selected, ...pickRandom(remaining, numQuestions - selected.length)];
    }

    const finalSelection = shuffleArray(selected).slice(0, numQuestions);

    const generatedQuestions = finalSelection.map((item, index) => {
      const word = item["Từ vựng"] || item.kanji || item.Word || "";
      const correct = item["Ý nghĩa"] || item.meaning || item.Meaning || "";
      
      const distractors = shuffleArray(validVocab.filter(v => (v["Ý nghĩa"] || v.meaning || v.Meaning) !== correct))
                          .slice(0, 3)
                          .map(v => v["Ý nghĩa"] || v.meaning || v.Meaning);

      return {
        id: index + 1,
        sentence: `Nghĩa của từ "${word}" là gì?`,
        options: shuffleArray([correct, ...distractors]),
        correctAnswer: correct
      };
    });

    setQuestions(generatedQuestions);
    setSelectedAnswers(Array(generatedQuestions.length).fill(null));
  }, [vocabulary, numQuestions, deck.id, onQuit]);

  // HÀM NỘP BÀI
  const handleSubmit = useCallback(() => {
    if (questions.length === 0) return;
    const answers: QuizAnswer[] = questions.map((q, idx) => ({
      question: q.sentence,
      userAnswer: selectedAnswers[idx] || "",
      correctAnswer: q.correctAnswer,
      isCorrect: selectedAnswers[idx] === q.correctAnswer,
    }))
    const finalScore = answers.filter((a) => a.isCorrect).length
    onComplete(answers, finalScore)
  }, [questions, selectedAnswers, onComplete])

  // ĐÃ KHÔI PHỤC: ĐỒNG HỒ ĐẾM NGƯỢC
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  // ĐÃ KHÔI PHỤC: TỰ ĐỘNG NỘP BÀI KHI HẾT GIỜ
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "∞"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSelectAnswer = (answer: string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleNavigateQuestion = (index: number) => {
    setCurrentQuestion(index)
  }

  const handleEndTestClick = () => {
    setShowEndModal(true)
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Đang tạo đề thi thông minh...</p>
      </div>
    )
  }

  const totalQuestions = questions.length
  const question = questions[currentQuestion]
  const optionLabels = ["A", "B", "C", "D"]
  const unansweredCount = selectedAnswers.filter((a) => a === null).length

  return (
    <div className="flex min-h-dvh flex-col px-6 py-8">
      {/* Header with Timer and End Test Button */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Quiz in Progress</span>
        
        <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-sm font-semibold ${
          timeRemaining !== null && timeRemaining <= 60 
            ? "bg-destructive/10 text-destructive animate-pulse" 
            : "bg-secondary text-foreground"
        }`}>
          {formatTime(timeRemaining)}
        </div>

        <Button onClick={handleEndTestClick} variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
          End Test
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">
            Question {currentQuestion + 1} of {totalQuestions}
          </span>
          <span className="text-muted-foreground">
            {totalQuestions - unansweredCount} answered
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((totalQuestions - unansweredCount) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-center text-2xl font-medium leading-relaxed text-foreground">
            <FuriganaText text={question.sentence}/>
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="mb-6 space-y-3 flex-1">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
              selectedAnswers[currentQuestion] === option
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold shrink-0 ${
                selectedAnswers[currentQuestion] === option
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {optionLabels[index]}
            </span>
            <span className="text-lg font-medium text-foreground">{option}</span>
          </button>
        ))}
      </div>

      {/* Question Navigator */}
      <div className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground mb-3 text-center">Question Navigator</p>
        <div className="flex flex-wrap justify-center gap-2">
          {questions.map((_, index) => {
            const isAnswered = selectedAnswers[index] !== null
            const isCurrent = index === currentQuestion
            return (
              <button
                key={index}
                onClick={() => handleNavigateQuestion(index)}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                  isCurrent
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary text-primary-foreground"
                    : isAnswered
                    ? "bg-primary/80 text-primary-foreground"
                    : "bg-secondary text-muted-foreground border border-border hover:border-primary/50"
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* End Test Confirmation Modal */}
      <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finish and Submit?</DialogTitle>
            <DialogDescription>Are you sure you want to end the test?</DialogDescription>
          </DialogHeader>
          {unansweredCount > 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
              <p className="text-sm font-medium text-amber-600 dark:text-amber-500">
                Warning: You still have {unansweredCount} unanswered question{unansweredCount > 1 ? "s" : ""}!
              </p>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowEndModal(false)} className="flex-1 sm:flex-none">
              Return to Quiz
            </Button>
            <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}