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
        <rt className="text-[0.5em] text-muted-foreground">{match[2]}</rt>
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
    if (percentage >= 90) return "Rất tốt, phát huy nhé!"
    if (percentage >= 70) return "Làm bài tốt lắm!"
    if (percentage >= 50) return "Khá, cần rèn thêm nha!"
    return "Chưa đạt, cố gắng lên nhé!"
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 px-6 py-8">
      {/* Header with Back Button */}
      <header className="mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại
        </button>
      </header>

      {/* Score Header */}
      <div className="mb-8 text-center bg-white p-6 rounded-[2rem] shadow-sm border">
        <p className="mb-1 text-xs font-black uppercase tracking-widest text-slate-500">
          KẾT QUẢ
        </p>
        <p className="text-2xl font-black text-slate-900">
          {score}/{totalQuestions}
        </p>
        <p className="mt-2 text-sm font-bold text-slate-500">Chính xác {percentage}%</p>
        <p className="mt-2 text-sm font-black text-primary uppercase tracking-tight">{getScoreMessage()}</p>
      </div>

      {/* --- PHẦN REVIEW ĐÃ ĐƯỢC SỬA LẠI BỐ CỤC --- */}
      <div className="mb-6 flex-1 flex flex-col overflow-hidden">
        <h2 className="mb-4 text-lg font-black text-slate-800 tracking-tight">Xem lại bài làm</h2>
        <div className="flex-1 space-y-6 overflow-y-auto pb-10 pr-1">
          {answers.map((answer, index) => (
            <div
              key={index}
              className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm flex flex-col min-h-[220px]"
            >
              {/* Số câu nằm góc trên */}
              <div className="mb-2">
                <span className="text-[16px] font-black text-slate-600 uppercase tracking-widest">Câu {index + 1}</span>
              </div>

              {/* KHU VỰC TỪ VỰNG: TO VÀ CĂN GIỮA KHOẢNG TRỐNG */}
              <div className="flex-1 flex items-center justify-center py-4">
                <div className="text-4xl sm:text-5xl font-black text-slate-800 text-center leading-tight">
                  <FuriganaText text={answer.word || answer.question} />
                </div>
              </div>

              {/* KHU VỰC ĐÁP ÁN: ĐẨY XUỐNG DƯỚI CÙNG */}
              <div className="mt-4 space-y-2 pt-4 border-t border-slate-50">
                {/* Đáp án của học sinh */}
                <div className={`flex items-center gap-3 rounded-xl p-3 ${
                  answer.isCorrect 
                    ? "bg-green-50 text-green-700" 
                    : "bg-rose-50 text-rose-700"
                }`}>
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${
                    answer.isCorrect ? "bg-green-500" : "bg-rose-500"
                  }`}>
                    {answer.isCorrect ? <Check className="h-4 w-4 text-white" /> : <X className="h-4 w-4 text-white" />}
                  </div>
                  <span className="text-xs font-bold uppercase opacity-60">Chọn:</span>
                  <span className="text-sm font-black">{answer.userAnswer || "Chưa chọn"}</span>
                </div>

                {/* Đáp án đúng (chỉ hiện khi sai) */}
                {!answer.isCorrect && (
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-green-700 border border-green-100">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shrink-0">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs font-bold uppercase opacity-60 text-slate-400">Đúng:</span>
                    <span className="text-sm font-black">{answer.correctAnswer}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto pt-4 bg-slate-50/80 backdrop-blur-md -mx-6 px-6">
        <Button
          onClick={onStudyAgain}
          className="h-16 w-full text-lg font-bold rounded-2xl shadow-lg shadow-primary/20"
        >
          <RotateCcw className="mr-2 h-6 w-6" />
          Luyện tập lại
        </Button>
      </div>
    </div>
  )
}