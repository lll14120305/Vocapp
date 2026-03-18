"use client"

import React, { useState, useEffect } from "react"
import { ChevronLeft, BookOpen, BrainCircuit, History, Trophy, Target, AlertTriangle, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Deck } from "@/components/setup-view"

export type TimeLimit = "5" | "10" | "15" | "none"
export type QuestionCount = "10" | "15" | "20" | "30"

interface DashboardViewProps {
  deck: Deck
  vocabulary: any[]
  onStartQuiz: (timeLimit: TimeLimit, questionCount: QuestionCount) => void
  onViewVocabulary: () => void
  onBack: () => void
}

interface TestHistory {
  id: number
  date: string
  score: number
  total: number
}

export function DashboardView({ deck, vocabulary, onStartQuiz, onViewVocabulary, onBack }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview")
  const [timeLimit, setTimeLimit] = useState<TimeLimit>("10")
  const [questionCount, setQuestionCount] = useState<QuestionCount>("15")
  
  // State lưu trữ dữ liệu
  const [stats, setStats] = useState({ newWords: 0, learned: 0, warning: 0, critical: 0 })
  const [history, setHistory] = useState<TestHistory[]>([])

  useEffect(() => {
    // 1. Đọc dữ liệu Tiến độ (4 màu)
    const savedStats = JSON.parse(localStorage.getItem(`stats-${deck.id}`) || "{}")
    let newW = 0, learn = 0, warn = 0, crit = 0

    const validVocab = vocabulary.filter(v => (v["Từ vựng"] || v.kanji || v.Word) && (v["Ý nghĩa"] || v.meaning || v.Meaning))

    validVocab.forEach(v => {
      const word = v["Từ vựng"] || v.kanji || v.Word
      const wordStat = savedStats[word]
      
      if (!wordStat || wordStat.attempts === 0) newW++
      else if (wordStat.mistakes >= 2) crit++
      else if (wordStat.mistakes === 1) warn++
      else learn++
    })

    setStats({ newWords: newW, learned: learn, warning: warn, critical: crit })

    // 2. Đọc dữ liệu Lịch sử thi
    const savedHistory = JSON.parse(localStorage.getItem(`history-${deck.id}`) || "[]")
    setHistory(savedHistory.reverse()) // Đảo ngược để bài mới nhất lên đầu
  }, [deck.id, vocabulary])

  const totalWords = stats.newWords + stats.learned + stats.warning + stats.critical
  const progressPercent = totalWords === 0 ? 0 : Math.round((stats.learned / totalWords) * 100)

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/50 pb-20">
      {/* Header */}
      <header className="bg-white p-6 pb-4 border-b shadow-sm">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-primary transition-colors mb-4">
          <ChevronLeft size={18} /> ĐỔI BỘ TỪ VỰNG
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{deck.name}</h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Tổng cộng: {totalWords} từ vựng</p>
      </header>

      {/* Tabs */}
      <div className="flex px-4 pt-4 bg-white border-b">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Tiến độ học
        </button>
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${activeTab === "history" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"}`}
        >
          Lịch sử thi
        </button>
      </div>

      <div className="p-6">
        {activeTab === "overview" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Card */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Độ thông thạo</p>
                  <h2 className="text-4xl font-black text-slate-800">{progressPercent}%</h2>
                </div>
                <Trophy size={40} className={progressPercent >= 80 ? "text-yellow-400" : "text-slate-200"} />
              </div>

              {/* Thanh biểu đồ ngang */}
              <div className="h-4 flex rounded-full overflow-hidden bg-slate-100 mb-4">
                <div style={{ width: `${(stats.learned / totalWords) * 100}%` }} className="bg-green-500"></div>
                <div style={{ width: `${(stats.warning / totalWords) * 100}%` }} className="bg-amber-400"></div>
                <div style={{ width: `${(stats.critical / totalWords) * 100}%` }} className="bg-rose-500"></div>
              </div>

              {/* Chú thích 4 màu */}
              <div className="grid grid-cols-2 gap-3 text-sm font-medium">
                <div className="flex items-center gap-2 text-slate-600"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Mới: {stats.newWords}</div>
                <div className="flex items-center gap-2 text-green-600"><div className="w-3 h-3 rounded-full bg-green-500"></div> Đã thuộc: {stats.learned}</div>
                <div className="flex items-center gap-2 text-amber-600"><div className="w-3 h-3 rounded-full bg-amber-400"></div> Cần nhớ: {stats.warning}</div>
                <div className="flex items-center gap-2 text-rose-600"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Hay sai: {stats.critical}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button onClick={onViewVocabulary} className="flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 p-6 rounded-3xl transition-colors">
                <BookOpen size={32} />
                <span className="font-bold">Xem từ vựng</span>
              </button>
              <button onClick={() => onStartQuiz(timeLimit, questionCount)} className="flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground p-6 rounded-3xl transition-colors shadow-md shadow-primary/20">
                <PlayCircle size={32} />
                <span className="font-bold">Thi ngay</span>
              </button>
            </div>

            {/* Quiz Settings */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={18} /> Cài đặt bài thi</h3>
              
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Số lượng câu hỏi</p>
                <div className="flex gap-2">
                  {(["10", "15", "20", "30"] as QuestionCount[]).map((q) => (
                    <button key={q} onClick={() => setQuestionCount(q)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${questionCount === q ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{q}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase">Thời gian</p>
                <div className="flex gap-2">
                  {(["5", "10", "15", "none"] as TimeLimit[]).map((t) => (
                    <button key={t} onClick={() => setTimeLimit(t)} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${timeLimit === t ? "bg-primary text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{t === "none" ? "∞" : `${t}p`}</button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-10 text-center text-slate-400">
                <History size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Chưa có dữ liệu thi.</p>
                <p className="text-sm">Hãy làm bài kiểm tra đầu tiên nhé!</p>
              </div>
            ) : (
              history.map((record) => {
                const percent = Math.round((record.score / record.total) * 100);
                return (
                  <div key={record.id} className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 mb-1">{record.date}</p>
                      <p className="font-bold text-slate-800">Kết quả: {record.score} / {record.total} </p>
                    </div>
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-black ${
                      percent >= 80 ? "bg-green-100 text-green-600" : percent >= 50 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                    }`}>
                      {percent}%
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}