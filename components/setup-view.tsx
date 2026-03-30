"use client"

import { useState, useEffect } from "react"
import { BookOpen, GraduationCap, Briefcase, Plus, Trash2, Link2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export interface Deck {
  id: string
  name: string
  icon: string
  csvUrl: string
  isCustom?: boolean
}

// Trong file components/setup-view.tsx

const INITIAL_DECKS: Deck[] = [
  {
    id: "n5",
    name: "JLPT N5",
    icon: "book",
    // 1. Dán link CSV N5 thật của bạn vào đây
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTortzPoNcfMgIZMp5f3aBwGOYCpBqYTPitdzhJEe0JzTK6WTsFkAWpSma6iCMivZcQgj5AftbHRdeD/pub?gid=1401053622&single=true&output=csv",
  },
  {
    id: "n1",
    name: "JLPT N4",
    icon: "grad",
    // 2. Dán link CSV N1 thật của bạn vào đây
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTortzPoNcfMgIZMp5f3aBwGOYCpBqYTPitdzhJEe0JzTK6WTsFkAWpSma6iCMivZcQgj5AftbHRdeD/pub?gid=2134199508&single=true&output=csv",
  },
  {
    id: "biz",
    name: "50 bài đầu",
    icon: "briefcase",
    // 3. Dán link CSV Business thật của bạn vào đây
    csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTortzPoNcfMgIZMp5f3aBwGOYCpBqYTPitdzhJEe0JzTK6WTsFkAWpSma6iCMivZcQgj5AftbHRdeD/pub?gid=1656424521&single=true&output=csv",
  },
]

interface SetupViewProps {
  onConnect: (deck: Deck) => void
}

export function SetupView({ onConnect }: SetupViewProps) {
  const [decks, setDecks] = useState<Deck[]>(INITIAL_DECKS)
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  
  // State cho ô nhập liệu
  const [newName, setNewName] = useState("")
  const [newUrl, setNewUrl] = useState("")

  // 2. TỰ ĐỘNG LOAD DỮ LIỆU ĐÃ LƯU KHI MỞ APP
  useEffect(() => {
    const saved = localStorage.getItem("my-custom-decks")
    if (saved) {
      const customDecks = JSON.parse(saved)
      setDecks([...INITIAL_DECKS, ...customDecks])
    }
  }, [])

  // 3. HÀM LƯU DECK MỚI
  const handleSaveDeck = () => {
    if (!newName || !newUrl) return
    
    const newDeck: Deck = {
      id: Date.now().toString(),
      name: newName,
      icon: "book",
      csvUrl: newUrl,
      isCustom: true
    }

    const updatedCustomDecks = [...decks.filter(d => d.isCustom), newDeck]
    localStorage.setItem("my-custom-decks", JSON.stringify(updatedCustomDecks))
    
    setDecks([...INITIAL_DECKS, ...updatedCustomDecks])
    setNewName("")
    setNewUrl("")
    setIsAdding(false)
  }

  // 4. HÀM XÓA DECK
  const handleDeleteDeck = (e: React.MouseEvent, id: string) => {
    e.stopPropagation() // Ngăn không cho bấm trúng nút Chọn Deck
    if (!confirm("Bạn có chắc muốn xóa Deck này?")) return

    const updatedCustomDecks = decks.filter(d => d.isCustom && d.id !== id)
    localStorage.setItem("my-custom-decks", JSON.stringify(updatedCustomDecks))
    setDecks([...INITIAL_DECKS, ...updatedCustomDecks])
  }

  return (
    <div className="flex min-h-dvh flex-col px-6 py-10">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground text-center">Chọn bộ từ vựng</h1>
      
      <div className="mt-8 space-y-4 flex-1">
        {decks.map((deck) => (
          <Card
            key={deck.id}
            onClick={() => setSelectedDeckId(deck.id)}
            className={`relative flex cursor-pointer items-center gap-4 p-5 transition-all border-2 ${
              selectedDeckId === deck.id ? "border-primary bg-primary/5 shadow-md" : "border-border hover:border-primary/40"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
               {deck.icon === "grad" ? <GraduationCap size={20}/> : deck.icon === "briefcase" ? <Briefcase size={20}/> : <BookOpen size={20}/>}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{deck.name}</p>
            </div>
            
            {/* Nút xóa chỉ hiện cho Deck tự thêm */}
            {deck.isCustom && (
              <button onClick={(e) => handleDeleteDeck(e, deck.id)} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 size={18} />
              </button>
            )}
          </Card>
        ))}

        {/* PHẦN THÊM MỚI */}
        {!isAdding ? (
          <Button variant="outline" className="w-full h-16 border-dashed border-2" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-5 w-5" /> Thêm bài mới
          </Button>
        ) : (
          <Card className="p-5 border-2 border-primary/40 space-y-3">
            <Input placeholder="Deck Name (Ví dụ: Từ vựng N2)" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Google Sheets CSV URL" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleSaveDeck}>Save Deck</Button>
            </div>
          </Card>
        )}
      </div>

      <Button 
        disabled={!selectedDeckId} 
        className="mt-8 h-14 w-full text-lg font-bold shadow-lg"
        onClick={() => {
          const deck = decks.find(d => d.id === selectedDeckId)
          if (deck) onConnect(deck)
        }}
      >
        Bắt đầu học
      </Button>
    </div>
  )
}