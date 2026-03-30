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
import type { TimeLimit, QuestionCount } from "@/components/dashboard-view"
import type { Deck } from "@/components/setup-view"

// Cấu trúc câu hỏi nâng cấp: Thêm trường word để lưu vết từ vựng gốc
interface QuizQuestion {
  id: number
  word: string // <--- Lưu từ vựng gốc ở đây
  sentence: string
  options: string[]
  correctAnswer: string
}

// Component hiển thị Furigana (giữ nguyên của bạn)
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
  deck: Deck
  vocabulary: any[]
  timeLimit: TimeLimit
  questionCount: QuestionCount
  // Nâng cấp: onComplete sẽ nhận mảng kết quả chi tiết
  onComplete: (details: any[], score: number) => void
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

  // LOGIC TẠO ĐỀ THI
  useEffect(() => {
    const validVocab = vocabulary.filter(v => 
      (v["Từ vựng"] || v.kanji || v.Word) && (v["Ý nghĩa"] || v.meaning || v.Meaning)
    )

    if (validVocab.length < 4) {
      alert("Kho từ vựng của bạn phải có ít nhất 4 từ để tạo trắc nghiệm!");
      onQuit();
      return;
    }

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
        word: word, // <--- Gán word vào đây
        sentence: `Nghĩa của từ "${word}" là gì?`,
        options: shuffleArray([correct, ...distractors]),
        correctAnswer: correct
      };
    });

    setQuestions(generatedQuestions);
    setSelectedAnswers(Array(generatedQuestions.length).fill(null));
  }, [vocabulary, numQuestions, deck.id, onQuit]);

  // HÀM NỘP BÀI (Đã được sửa để gửi kèm details)
  const handleSubmit = useCallback(() => {
    if (questions.length === 0) return;

    // Tạo mảng kết quả chi tiết để phục vụ Dashboard Review
    const details = questions.map((q, idx) => ({
      word: q.word, // Lấy từ vựng gốc
      userAnswer: selectedAnswers[idx] || "Không trả lời",
      correctAnswer: q.correctAnswer,
      isCorrect: selectedAnswers[idx] === q.correctAnswer,
    }))

    const finalScore = details.filter((a) => a.isCorrect).length
    
    // Gửi details và score về cho trang cha (App/Page)
    onComplete(details, finalScore)
  }, [questions, selectedAnswers, onComplete])

  // ĐỒNG HỒ ĐẾM NGƯỢC
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

  // TỰ ĐỘNG NỘP BÀI KHI HẾT GIỜ
  useEffect(() => {
    if (timeRemaining === 0) {
      handleSubmit()
    }
  }, [timeRemaining, handleSubmit])

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
    
    // Tự động chuyển câu nếu chưa phải câu cuối (Practical UX)
    if (currentQuestion < questions.length - 1) {
       setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    }
  }

  const handleNavigateQuestion = (index: number) => {
    setCurrentQuestion(index)
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
    <div className="flex min-h-dvh flex-col px-6 py-8 bg-slate-50/30">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang làm bài thi</span>
        
        <div className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-mono text-sm font-bold ${
          timeRemaining !== null && timeRemaining <= 60 
            ? "bg-rose-100 text-rose-600 animate-pulse" 
            : "bg-white text-slate-700 shadow-sm border"
        }`}>
          {formatTime(timeRemaining)}
        </div>

        <Button onClick={() => setShowEndModal(true)} variant="ghost" size="sm" className="text-rose-500 font-bold hover:bg-rose-50">
          Dừng thi
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-tight">
          <span className="text-primary">
            Câu {currentQuestion + 1} / {totalQuestions}
          </span>
          <span className="text-slate-400">
             Đã làm {totalQuestions - unansweredCount} câu
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="mb-8">
        <div className="rounded-[2.5rem] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/50 min-h-[180px] flex items-center justify-center text-center">
          <p className="text-2xl font-black leading-relaxed text-slate-800">
            <FuriganaText text={question.sentence}/>
          </p>
        </div>
      </div>

      {/* Options List */}
      <div className="mb-8 space-y-4 flex-1">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`flex w-full items-center gap-4 rounded-3xl border-2 p-5 text-left transition-all active:scale-[0.98] ${
              selectedAnswers[currentQuestion] === option
                ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                : "border-white bg-white shadow-sm hover:border-slate-200"
            }`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-base font-black shrink-0 ${
                selectedAnswers[currentQuestion] === option
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {optionLabels[index]}
            </span>
            <span className="text-lg font-bold text-slate-700">{option}</span>
          </button>
        ))}
      </div>

      {/* Navigator */}
      <div className="bg-white rounded-t-[2.5rem] -mx-6 px-6 pt-6 pb-2 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <p className="text-[10px] font-black text-slate-400 mb-4 text-center uppercase tracking-[0.2em]">Bảng điều hướng</p>
        <div className="flex flex-wrap justify-center gap-2 max-h-32 overflow-y-auto pb-4">
          {questions.map((_, index) => {
            const isAnswered = selectedAnswers[index] !== null
            const isCurrent = index === currentQuestion
            return (
              <button
                key={index}
                onClick={() => handleNavigateQuestion(index)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-black transition-all ${
                  isCurrent
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-110"
                    : isAnswered
                    ? "bg-green-100 text-green-600 border border-green-200"
                    : "bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100"
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal xác nhận */}
      <Dialog open={showEndModal} onOpenChange={setShowEndModal}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Nộp bài ngay?</DialogTitle>
            <DialogDescription className="font-medium">Bạn có chắc chắn muốn kết thúc bài thi và xem kết quả?</DialogDescription>
          </DialogHeader>
          {unansweredCount > 0 && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-sm font-bold text-rose-600">
                Chú ý: Bạn vẫn còn {unansweredCount} câu chưa trả lời!
              </p>
            </div>
          )}
          <DialogFooter className="flex gap-3 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowEndModal(false)} className="flex-1 rounded-2xl py-6 font-bold">
              Làm tiếp
            </Button>
            <Button onClick={handleSubmit} className="flex-1 rounded-2xl py-6 font-bold shadow-lg shadow-primary/20">
              Nộp bài
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}