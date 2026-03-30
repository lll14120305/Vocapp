"use client"

import { useState } from "react"
import Papa from "papaparse"
import { SetupView, type Deck } from "@/components/setup-view"
import { DashboardView, type TimeLimit, type QuestionCount } from "@/components/dashboard-view"
import { QuizView } from "@/components/quiz-view"
import { ResultView } from "@/components/result-view"
import { VocabularyListView } from "@/components/vocabulary-list-view"

export type ViewState = "setup" | "dashboard" | "quiz" | "result" | "vocabulary"

// Cấu trúc QuizAnswer đồng bộ với QuizView đã sửa
export interface QuizAnswer {
  word?: string // Thêm để lưu vết từ vựng gốc
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

export default function Home() {
  const [view, setView] = useState<ViewState>("setup")
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null)
  
  const [vocabulary, setVocabulary] = useState<any[]>([])
  const [isFetching, setIsFetching] = useState(false)

  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([])
  const [score, setScore] = useState(0)
  const [timeLimit, setTimeLimit] = useState<TimeLimit>("10")
  const [questionCount, setQuestionCount] = useState<QuestionCount>("15")

  const handleDeckSelect = (deck: Deck) => {
    if (!deck.csvUrl) {
      alert("Deck này chưa có link Google Sheets!");
      return;
    }

    setIsFetching(true);

    Papa.parse(deck.csvUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setVocabulary(results.data);
        setSelectedDeck(deck);
        setIsFetching(false);
        setView("dashboard");
      },
      error: (error) => {
        console.error("Lỗi:", error);
        alert("Không thể tải file! Kiểm tra lại link CSV.");
        setIsFetching(false);
      }
    });
  }

  const handleStartQuiz = (selectedTimeLimit: TimeLimit, selectedQuestionCount: QuestionCount) => {
    setTimeLimit(selectedTimeLimit)
    setQuestionCount(selectedQuestionCount)
    setView("quiz")
  }

  // --- HÀM XỬ LÝ KHI HOÀN THÀNH BÀI THI ---
  const handleQuizComplete = (answers: QuizAnswer[], finalScore: number) => {
    setQuizAnswers(answers)
    setScore(finalScore)
    setView("result")

    if (selectedDeck) {
      // 1. Cập nhật Tiến độ 4 màu (stats)
      const statsKey = `stats-${selectedDeck.id}`;
      const currentStats = JSON.parse(localStorage.getItem(statsKey) || "{}");
      
      answers.forEach((ans) => {
        // Ưu tiên dùng ans.word (đã thêm ở QuizView), nếu không có mới dùng Regex
        const word = ans.word || ans.question.match(/"([^"]+)"/)?.[1];
        
        if (word) {
          if (!currentStats[word]) {
            currentStats[word] = { mistakes: 0, attempts: 0 };
          }
          currentStats[word].attempts += 1;
          
          if (ans.isCorrect) {
            currentStats[word].mistakes = 0; // Trả lời đúng -> Xanh ngay
          } else {
            currentStats[word].mistakes += 1; // Sai -> Tăng bậc cảnh báo
          }
        }
      });
      localStorage.setItem(statsKey, JSON.stringify(currentStats));

      // 2. Cập nhật Lịch sử làm bài (Tối ưu 5 lần gần nhất)
      const historyKey = `history-${selectedDeck.id}`;
      const currentHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
      
      const newRecord = {
        id: Date.now(),
        date: new Date().toLocaleString('vi-VN', { 
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        }),
        score: finalScore,
        total: answers.length,
        details: answers // <-- QUAN TRỌNG: Lưu chi tiết để xem lại ở Dashboard
      };
      
      // Thêm cái mới lên đầu và chỉ lấy 5 cái
      const updatedHistory = [newRecord, ...currentHistory].slice(0, 10);
      localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    }
  }

  return (
    <main className="min-h-dvh bg-slate-50 relative overflow-x-hidden">
      <div className="mx-auto max-w-md h-full min-h-dvh bg-white shadow-2xl shadow-slate-200">
        {isFetching && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md h-dvh">
            <div className="text-center p-8 rounded-3xl bg-white shadow-xl">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="font-black text-slate-800 text-lg">Đang kết nối thư viện...</p>
              <p className="text-sm text-slate-400 mt-2 font-medium">Vui lòng đợi trong giây lát</p>
            </div>
          </div>
        )}
        
        {view === "setup" && <SetupView onConnect={handleDeckSelect} />}
        
        {view === "dashboard" && selectedDeck && (
          <DashboardView 
            deck={selectedDeck} 
            vocabulary={vocabulary} 
            onStartQuiz={handleStartQuiz} 
            onViewVocabulary={() => setView("vocabulary")}
            onBack={() => setView("setup")}
          />
        )}
        
        {view === "quiz" && selectedDeck && (
          <QuizView
            deck={selectedDeck}
            vocabulary={vocabulary}
            timeLimit={timeLimit} 
            questionCount={questionCount} 
            onComplete={handleQuizComplete}
            onQuit={() => setView("dashboard")}
          />
        )}
        
        {view === "result" && (
          <ResultView
            score={score}
            totalQuestions={quizAnswers.length}
            answers={quizAnswers}
            onStudyAgain={() => setView("dashboard")}
            onUpdateData={() => setView("setup")}
            onBack={() => setView("dashboard")}
          />
        )}
        
        {view === "vocabulary" && selectedDeck && (
          <VocabularyListView
            deck={selectedDeck}
            vocabulary={vocabulary}
            onBack={() => setView("dashboard")}
          />
        )}
      </div>
    </main>
  )
}