"use client"

import { useState } from "react"
import Papa from "papaparse"
import { SetupView, type Deck } from "@/components/setup-view"
import { DashboardView, type TimeLimit, type QuestionCount } from "@/components/dashboard-view"
import { QuizView } from "@/components/quiz-view"
import { ResultView } from "@/components/result-view"
import { VocabularyListView } from "@/components/vocabulary-list-view"

export type ViewState = "setup" | "dashboard" | "quiz" | "result" | "vocabulary"

export interface QuizAnswer {
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

  // ĐÃ SỬA LỖI: Gộp hàm handleQuizComplete lại cho chuẩn
  const handleQuizComplete = (answers: QuizAnswer[], finalScore: number) => {
    setQuizAnswers(answers)
    setScore(finalScore)
    setView("result")

    if (selectedDeck) {
      // 1. Lưu tiến độ 4 màu (stats)
      const statsKey = `stats-${selectedDeck.id}`;
      const currentStats = JSON.parse(localStorage.getItem(statsKey) || "{}");
      
      answers.forEach((ans) => {
        const wordMatch = ans.question.match(/"([^"]+)"/);
        if (wordMatch) {
          const word = wordMatch[1];
          if (!currentStats[word]) {
            currentStats[word] = { mistakes: 0, attempts: 0 };
          }
          currentStats[word].attempts += 1;
          if (ans.isCorrect) {
            currentStats[word].mistakes = 0; 
          } else {
            currentStats[word].mistakes += 1; 
          }
        }
      });
      localStorage.setItem(statsKey, JSON.stringify(currentStats));

      // 2. Lưu lịch sử làm bài thi (history)
      const historyKey = `history-${selectedDeck.id}`;
      const currentHistory = JSON.parse(localStorage.getItem(historyKey) || "[]");
      
      const newRecord = {
        id: Date.now(),
        date: new Date().toLocaleString('vi-VN', { 
          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
        }),
        score: finalScore,
        total: answers.length // Dùng answers.length để đếm số câu thực tế học sinh đã làm
      };
      
      currentHistory.push(newRecord);
      localStorage.setItem(historyKey, JSON.stringify(currentHistory));
    }
  }

  return (
    <main className="min-h-dvh bg-background relative">
      <div className="mx-auto max-w-md h-full">
        {isFetching && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm h-dvh">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-medium animate-pulse">Đang hút dữ liệu từ Sheets...</p>
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
            totalQuestions={quizAnswers.length} // Đồng bộ số câu hiển thị ở trang kết quả
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