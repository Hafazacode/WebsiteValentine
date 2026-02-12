"use client";

import { useEffect, useRef, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, RotateCcw, Heart, Star, AlertCircle, ThumbsUp } from "lucide-react";

// --- KONFIGURASI GAME ---
const GAME_DURATION = 60000; // DURASI GAME (60 Detik). Musik akan stop di sini.
const APPROACH_RATE = 1500; 
const PERFECT_WINDOW = 250; 
const GOOD_WINDOW = 500; 

// Tipe Data
type NoteData = {
  id: number;
  x: number;
  y: number;
  hitTime: number;
};

type FeedbackData = {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
};

// --- KOMPONEN NOTE (VISUAL) ---
const GameNote = memo(({ data, onInteract }: { data: NoteData, onInteract: (id: number, x: number, y: number) => void }) => {
  
  const handleInput = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onInteract(data.id, data.x, data.y);
  };

  return (
    <div
      className="absolute w-32 h-32 -ml-16 -mt-16 flex items-center justify-center cursor-pointer touch-none z-50"
      style={{ left: `${data.x}%`, top: `${data.y}%` }}
      onPointerDown={handleInput}
    >
      {/* 1. Lingkaran Target (Bibir) */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="w-20 h-20 bg-pink-500 rounded-full border-4 border-white shadow-[0_0_25px_rgba(236,72,153,0.9)] flex items-center justify-center relative z-10 active:scale-95 transition-transform"
      >
        <span className="text-4xl select-none pointer-events-none">💋</span>
      </motion.div>

      {/* 2. Lingkaran Pengecil (Timer) */}
      <motion.div
        initial={{ scale: 2, opacity: 0 }}
        animate={{ scale: 0, opacity: 1 }} 
        transition={{ 
            duration: (APPROACH_RATE * 2) / 1000, 
            ease: "linear" 
        }}
        className="absolute w-20 h-20 rounded-full border-4 border-white/90 box-border z-20 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)]"
      />
    </div>
  );
});

GameNote.displayName = "GameNote";

// --- KOMPONEN UTAMA GAME ---
export default function RhythmKissGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<"menu" | "playing" | "result">("menu");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  
  // Statistik Detail
  const [stats, setStats] = useState({ perfect: 0, good: 0, miss: 0 });
  
  // Visual State
  const [activeNotes, setActiveNotes] = useState<NoteData[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([]);

  // Refs Logic
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beatmapRef = useRef<NoteData[]>([]);
  const nextNoteIndexRef = useRef(0);
  const gameLoopIdRef = useRef<number>(0);
  const startTimeRef = useRef(0);

  // --- 1. SETUP ---
  useEffect(() => {
    audioRef.current = new Audio("/backsound.mp3"); 
    audioRef.current.volume = 0.6;

    // --- GENERATE BEATMAP ---
    const notes: NoteData[] = [];
    const bpm = 100; 
    const beatInterval = 60000 / bpm; 
    
    // Generate note sampai batas durasi game
    for (let t = 1000; t < GAME_DURATION - 1000; t += beatInterval) {
      if (Math.random() > 0.80) continue; 

      let safePositionFound = false;
      let attempts = 0;
      let newX = 50;
      let newY = 50;

      while (!safePositionFound && attempts < 15) {
          newX = Math.random() * 70 + 15;
          newY = Math.random() * 60 + 20;

          const recentNotes = notes.slice(-5); 
          const isTooClose = recentNotes.some(prevNote => {
              const dist = Math.hypot(prevNote.x - newX, prevNote.y - newY);
              return dist < 25; 
          });

          if (!isTooClose) {
              safePositionFound = true;
          }
          attempts++;
      }

      notes.push({ id: t, x: newX, y: newY, hitTime: t });
    }
    beatmapRef.current = notes;

    return () => stopGame();
  }, []);

  // --- 2. GAME ENGINE ---
  const startGame = () => {
    if (!audioRef.current) return;
    
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setStats({ perfect: 0, good: 0, miss: 0 }); // Reset Stats
    setActiveNotes([]);
    setFeedbacks([]);
    setGameState("playing");
    
    nextNoteIndexRef.current = 0;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(e => console.log("Audio fail:", e));
    startTimeRef.current = Date.now();

    cancelAnimationFrame(gameLoopIdRef.current);
    loop();
  };

  const stopGame = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cancelAnimationFrame(gameLoopIdRef.current);
  };

  const loop = () => {
    // TIMER BASED ENDING
    // Jika waktu main sudah melebihi durasi game, stop paksa.
    const currentTime = Date.now() - startTimeRef.current;
    
    if (currentTime >= GAME_DURATION) {
        stopGame();
        setGameState("result");
        return;
    }

    // 1. SPAWN NOTES
    const nextNote = beatmapRef.current[nextNoteIndexRef.current];
    if (nextNote && currentTime >= nextNote.hitTime - APPROACH_RATE) {
      setActiveNotes(prev => [...prev, nextNote]);
      nextNoteIndexRef.current++;
    }

    // 2. CHECK MISS
    setActiveNotes(prev => {
      const missed = prev.filter(n => currentTime > n.hitTime + GOOD_WINDOW);
      
      if (missed.length > 0) {
        setCombo(0);
        // Update Stats Miss
        setStats(curr => ({ ...curr, miss: curr.miss + missed.length }));
        missed.forEach(m => addFeedback(m.x, m.y, "Miss 😭", "text-red-500"));
      }

      return prev.filter(n => currentTime <= n.hitTime + GOOD_WINDOW);
    });

    gameLoopIdRef.current = requestAnimationFrame(loop);
  };

  // --- 3. INPUT HANDLER ---
  const handleInteract = (id: number, x: number, y: number) => {
    const currentTime = Date.now() - startTimeRef.current;
    
    const noteIndex = activeNotes.findIndex(n => n.id === id);
    if (noteIndex === -1) return;

    const note = activeNotes[noteIndex];
    const diff = Math.abs(currentTime - note.hitTime);

    // Hit Logic
    if (diff <= GOOD_WINDOW) {
        let scoreAdd = 0;
        let text = "";
        let color = "";

        if (diff <= PERFECT_WINDOW) {
            scoreAdd = 300;
            text = "Perfect! 😍";
            color = "text-yellow-300 scale-125";
            setStats(curr => ({ ...curr, perfect: curr.perfect + 1 }));
        } else {
            scoreAdd = 100;
            text = "Good 😘";
            color = "text-white";
            setStats(curr => ({ ...curr, good: curr.good + 1 }));
        }

        setScore(prev => prev + scoreAdd + (combo * 5));
        setCombo(prev => {
            const next = prev + 1;
            if (next > maxCombo) setMaxCombo(next);
            return next;
        });

        addFeedback(x, y, text, color);
        setActiveNotes(prev => prev.filter(n => n.id !== id));
    } 
  };

  const addFeedback = (x: number, y: number, text: string, color: string) => {
    const id = Math.random();
    setFeedbacks(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== id)), 800);
  };

  // --- 4. RENDER UI ---
  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col justify-center items-center touch-none select-none">
      
      {/* BACKGROUND */}
      <div 
          className="absolute inset-0 opacity-40 bg-cover bg-center transition-transform duration-[2000ms]" 
          style={{ 
              backgroundImage: "url('/AyangkuManis.png')",
              transform: combo > 10 ? 'scale(1.05)' : 'scale(1)'
          }} 
      />
      <div className="absolute inset-0 bg-gradient-to-b from-pink-900/50 to-black/80 backdrop-blur-[2px]"></div>

      {/* HEADER SCORE */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50 pointer-events-none">
          <button onClick={onBack} className="bg-white/10 p-2 rounded-full text-white backdrop-blur-md pointer-events-auto hover:bg-white/20 active:scale-90 transition"><X /></button>
          
          <div className="flex flex-col items-end">
             <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-white italic tracking-tighter drop-shadow-lg font-sans">{score.toLocaleString()}</span>
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={combo}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className={`text-xl font-bold ${combo > 10 ? 'text-yellow-400' : 'text-pink-300'}`}
                    >
                        {combo > 0 ? `${combo}x Combo` : ''}
                    </motion.div>
                </AnimatePresence>
             </div>
          </div>
      </div>

      {/* GAMEPLAY AREA */}
      {gameState === "playing" && (
        <div className="relative w-full h-full max-w-4xl mx-auto overflow-hidden">
           {activeNotes.map(note => (
             <GameNote 
                key={note.id} 
                data={note} 
                onInteract={handleInteract} 
             />
           ))}

           {/* FEEDBACK POPUPS */}
           <AnimatePresence>
             {feedbacks.map(fb => (
                <motion.div
                    key={fb.id}
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -50, scale: 1.2 }}
                    exit={{ opacity: 0, y: -70 }}
                    transition={{ duration: 0.4 }}
                    className={`absolute font-black text-3xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-50 pointer-events-none ${fb.color}`}
                    style={{ left: `${fb.x}%`, top: `${fb.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    {fb.text}
                </motion.div>
             ))}
           </AnimatePresence>

           {/* PROGRESS BAR (TIMER BASED) */}
           <div className="absolute bottom-0 left-0 w-full h-3 bg-white/10">
               <motion.div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: GAME_DURATION / 1000, ease: "linear" }}
               />
           </div>
        </div>
      )}

      {/* MENU START */}
      {gameState === "menu" && (
        <div className="z-40 text-center relative p-8 bg-black/50 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in w-[90%] max-w-sm">
            <Heart size={80} className="text-pink-500 mx-auto mb-6 animate-pulse" fill="currentColor"/>
            <h1 className="text-4xl font-black text-white mb-2">Kiss Rhythm</h1>
            <p className="text-gray-300 mb-8 text-sm">
                Tangkap bibir saat lingkaran <b className="text-white">Putih</b> mengecil & pas dengan target! 🎯
            </p>
            <button onClick={startGame} className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg flex justify-center items-center gap-2 active:scale-95 transition">
                <Play fill="currentColor" size={24}/> MULAI
            </button>
        </div>
      )}

      {/* MENU RESULT (STATS DETAIL) */}
      {gameState === "result" && (
        <div className="z-40 text-center relative p-6 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl animate-in zoom-in w-[90%] max-w-sm">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 p-4 rounded-full shadow-lg border-4 border-white">
                {score > 5000 ? '🏆' : '👍'}
            </div>
            <h2 className="text-3xl font-black text-slate-800 mt-6 mb-1">Selesai Sayang!</h2>
            
            {/* SCORE UTAMA */}
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 mb-4 mt-4">
                <p className="text-[10px] text-pink-400 font-bold uppercase">TOTAL SCORE</p>
                <p className="text-4xl font-black text-pink-600">{score.toLocaleString()}</p>
                <p className="text-xs text-purple-500 font-bold mt-1">Max Combo: {maxCombo}x</p>
            </div>

            {/* DETAIL STATS */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-yellow-50 p-2 rounded-xl border border-yellow-200">
                    <Star size={20} className="mx-auto text-yellow-500 mb-1" fill="currentColor"/>
                    <p className="text-[10px] text-yellow-600 font-bold uppercase">PERFECT</p>
                    <p className="text-xl font-black text-yellow-700">{stats.perfect}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                    <ThumbsUp size={20} className="mx-auto text-blue-500 mb-1"/>
                    <p className="text-[10px] text-blue-600 font-bold uppercase">GOOD</p>
                    <p className="text-xl font-black text-blue-700">{stats.good}</p>
                </div>
                <div className="bg-red-50 p-2 rounded-xl border border-red-200">
                    <AlertCircle size={20} className="mx-auto text-red-500 mb-1"/>
                    <p className="text-[10px] text-red-600 font-bold uppercase">MISS</p>
                    <p className="text-xl font-black text-red-700">{stats.miss}</p>
                </div>
            </div>

            <button onClick={startGame} className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition mb-3">
                <RotateCcw size={18}/> Main Lagi
            </button>
            <button onClick={onBack} className="w-full text-gray-400 hover:text-gray-600 font-bold text-sm py-2">
                Kembali
            </button>
        </div>
      )}
    </div>
  );
}