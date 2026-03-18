"use client"

import React, { useState, useEffect, useMemo, memo } from "react"
import { ChevronLeft, Search, Eye, EyeOff, X, Shuffle, AlertCircle, Skull } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Deck } from "@/components/setup-view"

interface VocabularyListViewProps {
  deck: Deck
  vocabulary: any[]
  onBack: () => void
}

const cleanForSearch = (text: string) => {
  if (!text) return "";
  return text.replace(/\[/g, "").replace(/\]/g, "").toLowerCase();
}

const FuriganaText = ({ text, fontSizeClass }: { text: string, fontSizeClass: string }) => {
  if (!text) return <span>---</span>;
  const regex = /\[([^\[\]]+)\[([^\[\]]+)\]\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>);
    }
    parts.push(
      <ruby key={match.index} className="mx-0.5">
        {match[1]}
        <rt className="text-[0.55em] text-muted-foreground font-normal mb-0.5 select-none">
          {match[2]}
        </rt>
      </ruby>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
  }
  return <span className={`${fontSizeClass} transition-all duration-300`}>{parts}</span>;
};

// COMPONENT TỪNG Ô TỪ VỰNG
const VocabularyCard = memo(({ item, stats, hideMeanings }: any) => {
  // ĐÃ SỬA LỖI --- : Khôi phục lại khả năng đọc cột tiếng Anh (Word, Meaning, Reading)
  const word = item["Từ vựng"] || item.kanji || item.Word || "";
  const reading = item["Cách đọc"] || item.kana || item.Reading || "";
  const meaning = item["Ý nghĩa"] || item.meaning || item.Meaning || "";
  
  const { mistakes = 0, attempts = 0 } = stats || {};

  const getFontSize = (str: string) => {
    const len = cleanForSearch(str).length;
    if (len > 15) return "text-sm sm:text-base";
    if (len > 10) return "text-lg sm:text-xl";
    return "text-2xl sm:text-3xl";
  };

  // LOGIC 4 TRẠNG THÁI
  let statusStyles = "";
  let badge = null;

  if (attempts === 0) {
    // 1. CHƯA HỌC: Khung xám đậm, rất rõ ràng
    statusStyles = "border-slate-400 bg-white shadow-sm opacity-100";
    badge = <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-500 text-[9px] font-black text-white uppercase shadow-sm">Mới</div>;
  } else if (mistakes >= 2) {
    // 2. ĐỎ: Nguy hiểm (Sai >= 2 lần)
    statusStyles = "border-rose-500 bg-rose-50/50 shadow-rose-100 animate-pulse-subtle";
    badge = <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-[9px] font-black text-white uppercase shadow-sm"><Skull size={10} /> Hay sai</div>;
  } else if (mistakes === 1) {
    // 3. VÀNG: Cảnh báo (Sai 1 lần)
    statusStyles = "border-amber-400 bg-amber-50/50 shadow-amber-100";
    badge = <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-[9px] font-black text-white uppercase shadow-sm"><AlertCircle size={10} /> Cần nhớ</div>;
  } else {
    // 4. ĐÃ THUỘC: Khung nhạt, mờ đi để học sinh tập trung vào từ khác
    statusStyles = "border-slate-100 bg-slate-50/30 opacity-60 hover:opacity-100 transition-opacity";
    badge = <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-green-500 text-[9px] font-black text-white uppercase shadow-sm">Đã thuộc</div>;
  }

  return (
    <div className={`relative flex flex-col rounded-3xl border-2 transition-all duration-500 overflow-hidden h-full ${statusStyles}`}>
      {badge}

      <div className="flex flex-col items-center justify-center p-4 pt-10 pb-6 min-h-[110px]">
        <div className="font-bold text-foreground text-center leading-tight break-words max-w-full px-2">
          <FuriganaText text={word} fontSizeClass={getFontSize(word)} />
        </div>
        {!word.includes('[') && reading && (
          <div className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {reading}
          </div>
        )}
      </div>

      <div className="h-px w-full bg-slate-200/50"></div>

      <div className={`flex items-center justify-center p-5 pt-8 pb-6 min-h-[80px] text-center transition-all duration-700 ${hideMeanings ? "opacity-0 invisible blur-md" : "opacity-100 visible"}`}>
        <p className="text-sm font-bold text-slate-600 leading-snug italic">
          {meaning}
        </p>
      </div>
    </div>
  );
});

VocabularyCard.displayName = "VocabularyCard";

export function VocabularyListView({ deck, vocabulary, onBack }: VocabularyListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [hideMeanings, setHideMeanings] = useState(false)
  // ĐÃ SỬA LỖI: Nhận dữ liệu stats thay vì chỉ mistake
  const [statsData, setStatsData] = useState<Record<string, {mistakes: number, attempts: number}>>({})
  const [displayMode, setDisplayMode] = useState<"all" | "random">("all")
  const [randomPool, setRandomPool] = useState<any[]>([])

  // ĐÃ SỬA LỖI: Load đúng tên file lịch sử (stats-)
  useEffect(() => {
    const saved = localStorage.getItem(`stats-${deck.id}`);
    if (saved) setStatsData(JSON.parse(saved));
  }, [deck.id]);

  const filteredVocab = useMemo(() => {
    const source = displayMode === "random" ? randomPool : vocabulary;
    if (!searchQuery) return source;
    const query = searchQuery.toLowerCase();
    return source.filter((item) => {
      // ĐÃ SỬA LỖI: Thêm fallback đọc cột tiếng Anh cho phần tìm kiếm
      const vocab = cleanForSearch(item["Từ vựng"] || item.kanji || item.Word || "");
      const reading = cleanForSearch(item["Cách đọc"] || item.kana || item.Reading || "");
      const meaning = (item["Ý nghĩa"] || item.meaning || item.Meaning || "").toLowerCase();
      return vocab.includes(query) || reading.includes(query) || meaning.includes(query);
    });
  }, [displayMode, randomPool, vocabulary, searchQuery]);

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50/50 pb-20">
      <header className="sticky top-0 z-30 bg-white/80 p-6 pb-4 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-primary transition-colors">
            <ChevronLeft size={18} /> BACK
          </button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              const shuffled = [...vocabulary].sort(() => 0.5 - Math.random()).slice(0, 15);
              setRandomPool(shuffled);
              setDisplayMode("random");
              setSearchQuery("");
            }} 
            className="h-9 gap-2 border-primary/20 text-primary hover:bg-primary/10 rounded-2xl px-4 font-bold"
          >
            <Shuffle size={14} /> 15 TỪ NGẪU NHIÊN
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              {displayMode === "random" ? "Học Ngẫu Nhiên" : deck.name}
            </h1>
            {displayMode === "random" && (
              <button onClick={() => setDisplayMode("all")} className="text-[10px] font-black text-destructive uppercase tracking-widest border-b-2 border-destructive/20">Thoát</button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Tìm kiếm nhanh..." className="pl-10 h-12 bg-slate-100 border-none rounded-2xl focus-visible:ring-primary/20 font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button variant="ghost" size="icon" className={`h-12 w-12 rounded-2xl ${hideMeanings ? "bg-primary/10 text-primary shadow-inner" : "bg-slate-100"}`} onClick={() => setHideMeanings(!hideMeanings)}>
              {hideMeanings ? <EyeOff size={20} /> : <Eye size={20} />}
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 grid grid-cols-2 gap-4">
        {filteredVocab.map((item, idx) => {
          const word = item["Từ vựng"] || item.kanji || item.Word || "";
          return (
            <VocabularyCard 
              key={idx} 
              item={item} 
              // ĐÃ SỬA LỖI: Truyền toàn bộ object (attempts, mistakes) vào thay vì 1 số
              stats={statsData[word] || {}} 
              hideMeanings={hideMeanings}
            />
          )
        })}
      </div>
    </div>
  )
}