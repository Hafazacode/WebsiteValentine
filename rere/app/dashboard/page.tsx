"use client";

import { useState, useEffect, memo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { 
  Heart, Home, Gamepad2, Calendar, StickyNote, Clock, List, Hourglass, Plus, Trash2, X, 
  ArrowDown, RotateCcw, ArrowRight, CheckCircle, AlertOctagon, Bird, CalendarCheck, 
  ChevronLeft, ChevronRight, Hand, CircleDot, Gift, Play as PlayIcon, Pause, SkipForward, 
  SkipBack, Music, Volume2, VolumeX, Loader2, Smartphone, Mic2
} from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";

// --- IMPORT GAME ---
import FlappyBirdGame from "@/components/FlappyBirdGame"; 
import TicTacToeGame from "@/components/TicTacToeGame";
import AyangIoGame from "@/components/AyangIoGame";
import ChessGame from "@/components/ChessGame";
import RhythmKissGame from "@/components/RhythmKissGame";

// =======================================================
// KONFIGURASI TANGGAL ULANG TAHUN 
// =======================================================
const TGL_LAHIR_AYANG = 23; 
const BLN_LAHIR_AYANG = 3;  

const TGL_LAHIR_KAMU = 3;  
const BLN_LAHIR_KAMU = 9;  
// =======================================================

// --- KONFIGURASI FOTO BULANAN ---
const MONTH_IMAGES = [
  "/Januari.jpeg",    
  "/Februari.jpeg",   
  "/Maret.jpeg",
  "/April.jpeg",
  "/Mei.jpeg",
  "/Juni.jpeg",
  "/Juli.jpeg",
  "/Agustus.jpeg",
  "/September.jpeg",
  "/Oktober.jpeg",
  "/November.jpeg",
  "/Desember.jpeg"    
];

// --- Tipe Data ---
type EventData = {
  id: number;
  title: string;
  date: string; 
  description: string;
};

type NoteData = {
  id: number;
  title: string;
  content: string;
  color: string;
  x: number;
  y: number;
};

type SongData = {
  id: number;
  title: string;
  url: string;
};

const NOTE_COLORS = [
  { name: "yellow", bg: "bg-yellow-200" },
  { name: "pink", bg: "bg-pink-200" },
  { name: "blue", bg: "bg-blue-200" },
  { name: "green", bg: "bg-green-200" },
];

// --- KOMPONEN TYPEWRITER ---
const Typewriter = ({ text, onComplete, speed = 50, delayAfter = 1000, className = "" }: { text: string, onComplete?: () => void, speed?: number, delayAfter?: number, className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    setDisplayedText(""); 
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => {
        if (index >= text.length) return prev;
        return text.slice(0, index + 1);
      });
      index++;
      if (index > text.length) {
        clearInterval(interval);
        if (onCompleteRef.current) setTimeout(() => { if (onCompleteRef.current) onCompleteRef.current(); }, delayAfter);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, delayAfter]); 

  return <span className={className}>{displayedText}<span className="animate-pulse ml-1">|</span></span>;
};

// --- OPTIMIZED BACKGROUND HEARTS ---
const BackgroundHearts = memo(() => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 8 }).map((_, index) => (
         <motion.div
            key={index}
            className="absolute text-white/20"
            style={{ 
                left: `${Math.random() * 100}vw`,
                fontSize: `${Math.random() * 20 + 10}px` 
            }}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.5, 0] }}
            transition={{ 
                duration: Math.random() * 10 + 15,
                repeat: Infinity, 
                delay: Math.random() * 10,
                ease: "linear" 
            }}
         >❤️</motion.div>
      ))}
    </div>
  );
});
BackgroundHearts.displayName = "BackgroundHearts";

// --- KOMPONEN STICKY NOTE ---
const DraggableNote = ({ note, onDelete, onUpdatePos, containerRef }: { note: NoteData, onDelete: (id: number) => void, onUpdatePos: (id: number, x: number, y: number) => void, containerRef: any }) => {
    return (
        <motion.div
            drag
            dragMomentum={false} 
            dragConstraints={containerRef} 
            initial={{ x: note.x, y: note.y, scale: 0 }}
            animate={{ x: note.x, y: note.y, scale: 1 }}
            whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
            onDragEnd={(event, info) => {
                const newX = note.x + info.offset.x;
                const newY = note.y + info.offset.y;
                onUpdatePos(note.id, newX, newY);
            }}
            className={`absolute w-36 md:w-52 min-h-[140px] md:min-h-[180px] p-4 shadow-md rounded-sm ${note.color} flex flex-col justify-between touch-none`}
            style={{ left: 0, top: 0 }}
        >
            <div>
                <h4 className="font-bold text-gray-800 text-sm md:text-lg mb-1 leading-tight line-clamp-2" style={{ fontFamily: 'cursive' }}>{note.title}</h4>
                <p className="text-gray-700 text-xs md:text-sm whitespace-pre-wrap leading-snug" style={{ fontFamily: 'cursive' }}>{note.content}</p>
            </div>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(note.id)} className="self-end mt-1 text-gray-400 hover:text-red-600 p-2">
                <Trash2 size={16} />
            </button>
        </motion.div>
    );
};

// --- KOMPONEN RELATIONSHIP TIMER ---
const RelationshipTimer = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const jadianDate = new Date("2025-12-13T11:25:00"); 
    const interval = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - jadianDate.getTime();
      setTime({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
        <div className="bg-white/80 backdrop-blur p-2 rounded-lg text-center"><p className="text-xl font-bold text-pink-600">{time.days}</p><p className="text-[10px] text-gray-500 font-bold">HARI</p></div>
        <div className="bg-white/80 backdrop-blur p-2 rounded-lg text-center"><p className="text-xl font-bold text-pink-500">{time.hours}</p><p className="text-[10px] text-gray-500 font-bold">JAM</p></div>
        <div className="bg-white/80 backdrop-blur p-2 rounded-lg text-center"><p className="text-xl font-bold text-pink-500">{time.minutes}</p><p className="text-[10px] text-gray-500 font-bold">MNT</p></div>
        <div className="bg-white/80 backdrop-blur p-2 rounded-lg text-center"><p className="text-xl font-bold text-red-500">{time.seconds}</p><p className="text-[10px] text-gray-500 font-bold">DTK</p></div>
    </div>
  );
};

// --- KOMPONEN BIRTHDAY TIMER ---
const BirthdayTimer = ({ title, targetDate, targetMonth, imgSrc, reverse = false }: { title: string, targetDate: number, targetMonth: number, imgSrc: string, reverse?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let currentYear = now.getFullYear();
      let bday = new Date(currentYear, targetMonth - 1, targetDate);

      if (now.getTime() > bday.getTime() && now.getDate() !== targetDate) {
        bday = new Date(currentYear + 1, targetMonth - 1, targetDate);
      } else if (now.getDate() === targetDate && now.getMonth() === targetMonth - 1) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const diff = bday.getTime() - now.getTime();
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetMonth]);

  const isToday = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className={`flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-pink-100 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
       <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden border-4 border-pink-200 shadow-md">
           <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
       </div>
       <div className={`flex-1 flex flex-col ${reverse ? 'items-end text-right' : 'items-start text-left'}`}>
           <h4 className="font-bold text-pink-600 mb-2 leading-tight">{title}</h4>
           {isToday ? (
               <div className="animate-pulse text-base font-black text-red-500 flex items-center gap-1">
                   🎉 HAPPY BIRTHDAY! 🎉
               </div>
           ) : (
               <div className={`grid grid-cols-4 gap-1.5 w-full max-w-[200px] ${reverse ? 'mr-0 ml-auto' : ''}`}>
                   <div className="bg-pink-50 rounded-lg p-1 text-center"><span className="block font-black text-pink-500 text-sm">{timeLeft.days}</span><span className="block text-[8px] text-pink-400 uppercase font-bold">Hr</span></div>
                   <div className="bg-pink-50 rounded-lg p-1 text-center"><span className="block font-black text-pink-500 text-sm">{timeLeft.hours}</span><span className="block text-[8px] text-pink-400 uppercase font-bold">Jm</span></div>
                   <div className="bg-pink-50 rounded-lg p-1 text-center"><span className="block font-black text-pink-500 text-sm">{timeLeft.minutes}</span><span className="block text-[8px] text-pink-400 uppercase font-bold">Mn</span></div>
                   <div className="bg-white border border-pink-100 rounded-lg p-1 text-center"><span className="block font-black text-red-400 text-sm">{timeLeft.seconds}</span><span className="block text-[8px] text-gray-400 uppercase font-bold">Dt</span></div>
               </div>
           )}
       </div>
    </div>
  )
};

const BirthdayView = () => (
  <div className="w-full max-w-md flex flex-col gap-5 p-2 animate-in fade-in zoom-in">
      <div className="text-center mb-2">
         <h2 className="text-xl md:text-2xl font-bold text-pink-600 flex items-center justify-center gap-2 mb-1">
             <Gift className="text-red-400" /> Countdown Ultah Kita
         </h2>
         <p className="text-gray-500 text-xs md:text-sm">Menghitung mundur hari spesial kesayangan ❤️</p>
      </div>
      
      <BirthdayTimer 
          title="Ulang Tahun Ayang 👑" 
          targetDate={TGL_LAHIR_AYANG} 
          targetMonth={BLN_LAHIR_AYANG} 
          imgSrc="/MyAyang.jpeg" 
      />
      
      <BirthdayTimer 
          title="Ulang Tahun Kamu 🤴" 
          targetDate={TGL_LAHIR_KAMU} 
          targetMonth={BLN_LAHIR_KAMU} 
          imgSrc="/MyPhoto.jpeg" 
          reverse 
      />
  </div>
);


// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [calendarTab, setCalendarTab] = useState("relationship");
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const [selectedGame, setSelectedGame] = useState<string | null>(null); 
  const constraintsRef = useRef(null);
  
  const [surpriseStep, setSurpriseStep] = useState(0);
  const [wrongGuessAlert, setWrongGuessAlert] = useState(false);
  
  // --- STATE LAMA SCENE 6 ---
  const [pinchCount, setPinchCount] = useState(0); 

  // --- STATE BARU UNTUK SCENE 7-13 ---
  const [step7Sub, setStep7Sub] = useState(0); // Step 7 text
  const [step8Choices, setStep8Choices] = useState<number[]>([]); // Step 8 Game Choice
  const [step9Ranges, setStep9Ranges] = useState({ val1: 0, val2: 0, val3: 0 }); // Step 9 Sliders
  const [step10Mosquitos, setStep10Mosquitos] = useState([1, 2, 3, 4, 5]); // Step 10 Nyamuk
  const [step12Sub, setStep12Sub] = useState(0); // Step 12 Text
  const [step12Hug, setStep12Hug] = useState(0); // Step 12 Hug Logic
  const [isStep12Holding, setIsStep12Holding] = useState(false); // Step 12 Hug Hold status
  const [step13Sub, setStep13Sub] = useState(0); // Step 13 Final Text

  // --- AUDIO STATES ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  
  // --- AUDIO MANAGER ---
  const wasPlayingRef = useRef(false); 

  // Efek untuk Pause/Resume lagu saat game atau video
  useEffect(() => {
      // 1. Logic Game Berat
      if (selectedGame === 'rhythm' || selectedGame === 'ayangio') {
          if (audioRef.current && !audioRef.current.paused) {
              wasPlayingRef.current = true;
              audioRef.current.pause();
              setIsPlayingAudio(false);
          } else {
              wasPlayingRef.current = false;
          }
      } else if (!selectedGame) {
          // Balik ke dashboard dari game
           if (wasPlayingRef.current && audioRef.current && audioRef.current.paused && surpriseStep !== 11) {
              audioRef.current.play().catch(e => console.log("Resume failed", e));
              setIsPlayingAudio(true);
          }
      }

      // 2. Logic Step 11 (YouTube Video)
      if (surpriseStep === 11) {
        if (audioRef.current && !audioRef.current.paused) {
            wasPlayingRef.current = true;
            audioRef.current.pause();
            setIsPlayingAudio(false);
        }
      }
  }, [selectedGame, surpriseStep]);

  // ==========================================
  // PERBAIKAN LOGIC HUG (STEP 12) - FIXED
  // ==========================================
  
  // 1. Logic Mengisi (Hanya mengisi jika ditahan DAN di step 12)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (surpriseStep === 12 && isStep12Holding && step12Hug < 100) {
      interval = setInterval(() => {
        setStep12Hug((prev) => {
            if (prev >= 100) return 100;
            return prev + 1; // Kecepatan isi bar peluk
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isStep12Holding, step12Hug, surpriseStep]);

  // 2. Logic Pindah Scene (STRICT MODE: Cek surpriseStep === 12)
  useEffect(() => {
    if (surpriseStep === 12 && step12Hug >= 100) {
        const timeout = setTimeout(() => {
            setSurpriseStep(13); // Lanjut ke step 13 setelah 0.5 detik
        }, 500);
        return () => clearTimeout(timeout);
    }
  }, [step12Hug, surpriseStep]);

  // Fungsi Reset Scene Total - FIXED
  const handleResetSurprise = () => {
      // Pastikan state holding mati dulu
      setIsStep12Holding(false);
      setStep12Hug(0);
      
      // Delay sedikit reset step utama agar state lain clear dulu
      setTimeout(() => {
        setSurpriseStep(0);
        setStep7Sub(0);
        setStep8Choices([]);
        setStep9Ranges({ val1: 0, val2: 0, val3: 0 });
        setStep10Mosquitos([1, 2, 3, 4, 5]);
        setStep12Sub(0);
        setStep13Sub(0);
      }, 50);
  };

  // --- MUSIC PLAYLIST STATES ---
  const [playlist, setPlaylist] = useState<SongData[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongFile, setNewSongFile] = useState<File | null>(null); 
  const [isUploadingSong, setIsUploadingSong] = useState(false); 
  const [showAddSong, setShowAddSong] = useState(false);

  // --- DATABASE STATES ---
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", color: NOTE_COLORS[0].bg });
  const [showNoteForm, setShowNoteForm] = useState(false);
  
  const [selectedCountdownId, setSelectedCountdownId] = useState<string>("");
  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // --- VARIABLES FOR RUBBER CHEEK EFFECT ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scaleX = useTransform(x, [-150, 150], [0.6, 1.6]); 
  const rotate = useTransform(y, [-150, 150], [-10, 10]);

  const [currentCalDate, setCurrentCalDate] = useState(new Date());

  // FETCH ALL DATA
  useEffect(() => { 
      if (activeTab === 'calendar' && events.length === 0) fetchEvents();
      if (activeTab === 'notes' && notes.length === 0) fetchNotes();
  }, [activeTab]);

  useEffect(() => {
      fetchPlaylist();
  }, []);

  // --- AUDIO LOGIC ---
  const fetchPlaylist = async () => {
      const { data } = await supabase.from('songs').select('*').order('id', { ascending: true });
      if (data && data.length > 0) {
          setPlaylist(data);
      } else {
          setPlaylist([{ id: 0, title: "Lagu Romantis Default", url: "/backsound.mp3" }]);
      }
  };

  const handleAddSong = async () => {
      if (!newSongTitle || !newSongFile) return alert("Isi judul dan pilih file lagunya!");
      
      setIsUploadingSong(true);

      const fileExt = newSongFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('songs')
          .upload(fileName, newSongFile);

      if (uploadError) {
          alert("Gagal mengunggah lagu: " + uploadError.message);
          setIsUploadingSong(false);
          return;
      }

      const { data: { publicUrl } } = supabase.storage
          .from('songs')
          .getPublicUrl(fileName);

      const { error: dbError } = await supabase.from('songs').insert([{ 
          title: newSongTitle, 
          url: publicUrl 
      }]);

      if (!dbError) {
          fetchPlaylist();
          setNewSongTitle("");
          setNewSongFile(null);
          setShowAddSong(false);
      } else {
          alert("Lagu terupload, tapi gagal menyimpannya ke database.");
      }

      setIsUploadingSong(false);
  };

  useEffect(() => {
      if (playlist.length > 0) {
          const songUrl = playlist[currentSongIndex].url;

          if (!audioRef.current) {
              audioRef.current = new Audio(songUrl);
              audioRef.current.volume = 0.5;
              audioRef.current.addEventListener('ended', nextSong);
          } else {
              const currentAudioSrc = audioRef.current.src;
              const tempAudio = new Audio(songUrl);
              
              if (currentAudioSrc !== tempAudio.src) {
                  const wasPlaying = !audioRef.current.paused;
                  audioRef.current.src = songUrl;
                  if ((wasPlaying || isPlayingAudio) && !selectedGame && surpriseStep !== 11) {
                        audioRef.current.play().catch(e => console.error(e));
                  }
              }
          }
      }
      return () => {
          if (audioRef.current) {
              audioRef.current.removeEventListener('ended', nextSong);
          }
      };
  }, [currentSongIndex, playlist]); 

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
        wasPlayingRef.current = false; 
      } else {
        audioRef.current.play().catch(e => console.log("Play failed:", e));
        setIsPlayingAudio(true);
        wasPlayingRef.current = true; 
      }
    }
  };

  const nextSong = () => {
      if (playlist.length === 0) return;
      setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
  };

  const prevSong = () => {
      if (playlist.length === 0) return;
      setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  const handleFirstInteraction = () => {
    if (!userInteracted) {
        setUserInteracted(true);
        if (audioRef.current && !isPlayingAudio && !selectedGame && surpriseStep !== 11) {
            audioRef.current.play()
            .then(() => {
                setIsPlayingAudio(true);
                wasPlayingRef.current = true;
            })
            .catch(() => console.log("Auto-play blocked"));
        }
    }
  };

  const handleFoodClick = (isCorrect: boolean) => {
    if (isCorrect) {
        setSurpriseStep(5);
    } else {
        setWrongGuessAlert(true);
        setTimeout(() => setWrongGuessAlert(false), 2000);
    }
  };

  const handlePinchStart = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setPinchCount(prev => prev + 1);
  };


  // --- CRUD DATA ---
  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    setEvents(data || []);
    setLoadingEvents(false);
  };
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert("Isi lengkap dulu dong!");
    await supabase.from('events').insert([newEvent]);
    fetchEvents(); setNewEvent({ title: "", date: "", description: "" });
  };
  const handleDeleteEvent = async (id: number) => {
    if(!confirm("Hapus acara ini?")) return;
    await supabase.from('events').delete().eq('id', id);
    fetchEvents();
  };
  const fetchNotes = async () => {
    setLoadingNotes(true);
    const { data } = await supabase.from('notes').select('*');
    setNotes(data || []);
    setLoadingNotes(false);
  };
  const handleAddNote = async () => {
    if(!newNote.title || !newNote.content) return alert("Tulis dulu catatannya!");
    const randomX = Math.floor(Math.random() * 50); 
    const randomY = Math.floor(Math.random() * 50);
    await supabase.from('notes').insert([{ ...newNote, x: randomX, y: randomY }]);
    fetchNotes(); setNewNote({ title: "", content: "", color: NOTE_COLORS[0].bg }); setShowNoteForm(false);
  };
  const handleDeleteNote = async (id: number) => {
    if(!confirm("Buang catatan ini?")) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };
  const handleUpdateNotePos = async (id: number, x: number, y: number) => {
    await supabase.from('notes').update({ x, y }).eq('id', id);
  };

  useEffect(() => {
    if (!selectedCountdownId) return;
    const targetEvent = events.find(e => e.id.toString() === selectedCountdownId);
    if (!targetEvent) return;
    const target = new Date(targetEvent.date + "T00:00:00");
    const interval = setInterval(() => {
        const now = new Date();
        const diff = target.getTime() - now.getTime();
        if(diff<=0) clearInterval(interval);
        else setCountdownTime({
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / 1000 / 60) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedCountdownId, events]);

  const moveNoButton = () => { setNoBtnPos({ x: Math.random()*150-75, y: Math.random()*150-75 }); };

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const changeMonth = (offset: number) => {
    setCurrentCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const renderCalendar = () => (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden animate-in fade-in">
        <div className="w-full md:w-1/3 bg-pink-50 md:border-r border-pink-100 p-2 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 no-scrollbar">
             {[
               { id: 'relationship', icon: Clock, label: 'Timer' },
               { id: 'birthdays', icon: Gift, label: 'Ultah' }, 
               { id: 'events', icon: List, label: 'Events' },
               { id: 'countdown', icon: Hourglass, label: 'Countdown' },
               { id: 'realCalendar', icon: CalendarCheck, label: 'Kalender Kita' }
             ].map(item => (
               <button key={item.id} onClick={() => setCalendarTab(item.id)} 
                 className={`p-3 rounded-xl text-left flex items-center gap-3 transition-all flex-1 md:flex-none justify-center md:justify-start whitespace-nowrap
                 ${calendarTab===item.id ? 'bg-white text-pink-600 shadow-sm ring-1 ring-pink-200' : 'text-gray-500 hover:bg-white/50'}`}>
                 <item.icon size={18}/> <span className="text-xs font-bold">{item.label}</span>
               </button>
             ))}
        </div>
        
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-start md:justify-center overflow-y-auto w-full relative">
            {calendarTab === 'relationship' && (
                <div className="w-full text-center mt-4 md:mt-0">
                    <h3 className="text-lg font-bold text-pink-500 mb-4">Kita sudah bersama:</h3>
                    <RelationshipTimer />
                </div>
            )}
            {/* TAMPILAN VIEW ULTAH DI DALAM KALENDER */}
            {calendarTab === 'birthdays' && (
                <BirthdayView />
            )}
            {calendarTab === 'events' && (
                <div className="w-full max-w-md flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                        {loadingEvents ? <p className="text-gray-400 text-center text-xs">Loading...</p> : events.map(ev => (
                            <div key={ev.id} className="flex justify-between items-center bg-white p-3 rounded-xl border-l-4 border-pink-500 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="text-center min-w-[30px]">
                                    <span className="block text-lg font-bold text-gray-800 leading-none">{new Date(ev.date).getDate()}</span>
                                    <span className="block text-[10px] text-pink-500 font-bold uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                                  </div>
                                  <div><p className="font-bold text-sm text-gray-700 line-clamp-1">{ev.title}</p></div>
                                </div>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 shrink-0">
                        <div className="flex gap-2 mb-2">
                           <input className="flex-1 p-2 rounded-lg text-sm border focus:outline-pink-500" placeholder="Acara..." value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title: e.target.value})}/>
                           <input type="date" className="w-28 p-2 rounded-lg text-sm border focus:outline-pink-500" value={newEvent.date} onChange={e=>setNewEvent({...newEvent, date: e.target.value})}/>
                        </div>
                        <button onClick={handleAddEvent} className="w-full bg-pink-500 text-white py-2 rounded-lg text-sm font-bold shadow-md">Simpan</button>
                    </div>
                </div>
            )}
            {calendarTab === 'countdown' && (
                <div className="w-full max-w-sm flex flex-col items-center mt-4 md:mt-0">
                    <select className="w-full p-3 mb-6 border rounded-xl bg-white text-sm" onChange={e=>setSelectedCountdownId(e.target.value)} value={selectedCountdownId}>
                        <option value="">-- Pilih Acara --</option>
                        {events.filter(e=>new Date(e.date)>new Date()).map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    {selectedCountdownId && (
                         <div className="grid grid-cols-4 gap-2 text-center w-full">
                            <div className="bg-orange-100 p-2 rounded-lg"><span className="text-xl font-bold block text-orange-700">{countdownTime.days}</span><span className="text-[10px] text-orange-600">Hr</span></div>
                            <div className="bg-orange-50 p-2 rounded-lg"><span className="text-xl font-bold block text-orange-600">{countdownTime.hours}</span><span className="text-[10px] text-orange-500">Jm</span></div>
                            <div className="bg-orange-50 p-2 rounded-lg"><span className="text-xl font-bold block text-orange-600">{countdownTime.minutes}</span><span className="text-[10px] text-orange-500">Mn</span></div>
                            <div className="bg-white p-2 rounded-lg border border-orange-200"><span className="text-xl font-bold block text-red-500">{countdownTime.seconds}</span><span className="text-[10px] text-gray-400">Dt</span></div>
                        </div>
                    )}
                </div>
            )}
            {calendarTab === 'realCalendar' && (
                <div className="w-full h-full max-w-sm mx-auto flex flex-col relative rounded-2xl overflow-hidden shadow-2xl bg-pink-100">
                    <div className="absolute inset-0 z-0">
                        <div 
                            className="absolute inset-0 transition-all duration-500"
                            style={{
                                backgroundImage: `url(${MONTH_IMAGES[currentCalDate.getMonth()] || '/AyangkuManis.png'})`, 
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className="absolute inset-0 bg-pink-500/40 mix-blend-hard-light backdrop-blur-[2px]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 to-transparent"></div>
                    </div>
                    <div className="relative z-10 flex flex-col h-full p-4 text-white">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => changeMonth(-1)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm"><ChevronLeft size={20}/></button>
                            <div className="text-center">
                                <h3 className="text-3xl font-black font-valentine drop-shadow-md tracking-wider">
                                    {currentCalDate.toLocaleString('default', { month: 'long' })}
                                </h3>
                                <p className="text-sm font-bold opacity-80">{currentCalDate.getFullYear()}</p>
                            </div>
                            <button onClick={() => changeMonth(1)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm"><ChevronRight size={20}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                                <span key={i} className="text-xs font-bold text-pink-100">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 flex-1 content-start">
                            {generateCalendarDays(currentCalDate).map((day, idx) => (
                                <div key={idx} className="aspect-square flex items-center justify-center">
                                    {day && (
                                        <div className={`
                                            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-lg md:text-xl transition-all font-valentine
                                            ${(day === new Date().getDate() && currentCalDate.getMonth() === new Date().getMonth() && currentCalDate.getFullYear() === new Date().getFullYear()) 
                                                ? 'bg-pink-500 text-white shadow-lg scale-110 border-2 border-white' 
                                                : 'bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm shadow-sm'
                                            }
                                        `}>
                                            {day}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  const renderGameContent = () => {
    if (selectedGame === "flappy") {
        return <FlappyBirdGame onBack={() => setSelectedGame(null)} />;
    }
    if (selectedGame === "tictactoe") {
        return <TicTacToeGame onBack={() => setSelectedGame(null)} />;
    }
    if (selectedGame === "chess") {
        return <ChessGame onBack={() => setSelectedGame(null)} />;
    }
    return (
        <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
            <h2 className="text-2xl font-bold text-pink-600 mb-6 flex items-center gap-2">
                <Gamepad2/> Pilih Game
            </h2>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {/* Game 1: Flappy */}
                <button onClick={() => setSelectedGame("flappy")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group">
                    <div className="bg-cyan-100 p-4 rounded-full group-hover:bg-cyan-200 transition"><Bird size={32} className="text-cyan-600" /></div>
                    <span className="font-bold text-gray-700 text-sm">Flappy Rere</span>
                </button>
                
                {/* Game 2: TicTacToe */}
                <button onClick={() => setSelectedGame("tictactoe")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group">
                    <div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                    </div>
                    <span className="font-bold text-gray-700 text-sm">Tic-Tac-Jidat</span>
                </button>

                {/* Game 3: Ayang.io */}
                <button onClick={() => setSelectedGame("ayangio")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group">
                    <div className="bg-rose-100 p-4 rounded-full group-hover:bg-rose-200 transition">
                        <CircleDot size={32} className="text-rose-600" />
                    </div>
                    <span className="font-bold text-gray-700 text-sm">Ayang.io</span>
                </button>

                {/* Game 4: Catur */}
                <button onClick={() => setSelectedGame("chess")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group">
                    <div className="bg-slate-100 p-4 rounded-full group-hover:bg-slate-200 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M2 19h20"/><path d="M12 22v-3"/><path d="M7 19v-4"/><path d="M17 19v-4"/><path d="M12 15V8"/><path d="M15 8l-3-3-3 3"/></svg>
                    </div>
                    <span className="font-bold text-gray-700 text-sm">Catur Ayang</span>
                </button>

                {/* GAME BARU: RHYTHM KISS */}
                <button onClick={() => setSelectedGame("rhythm")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group">
                    <div className="bg-pink-100 p-4 rounded-full group-hover:bg-pink-200 transition">
                        <Mic2 size={32} className="text-pink-600" />
                    </div>
                    <span className="font-bold text-gray-700 text-sm">Kiss Rhythm</span>
                </button>
            </div>
        </div>
    );
  };

  // --- RETURN UTAMA ---
  // JIKA GAME AYANG IO ATAU RHYTHM DIPILIH, RENDER FULLSCREEN LEPAS DARI DASHBOARD
  if (selectedGame === 'ayangio' || selectedGame === 'rhythm') {
      return (
        <div className="fixed inset-0 z-[9999] bg-white overflow-hidden flex flex-col justify-center items-center">
            {/* Warning Rotate HP */}
            <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden opacity-70">
                <div className="bg-black/50 text-white px-4 py-1 rounded-full text-xs flex items-center gap-2">
                    <Smartphone size={14} className="animate-pulse"/> Mode Landscape Lebih Seru!
                </div>
            </div>
            {selectedGame === 'ayangio' && <AyangIoGame onBack={() => setSelectedGame(null)} />}
            {selectedGame === 'rhythm' && <RhythmKissGame onBack={() => setSelectedGame(null)} />}
        </div>
      );
  }

  // JIKA TIDAK, RENDER DASHBOARD BIASA
  return (
    <main className="fixed inset-0 bg-gradient-to-br from-pink-400 to-red-300 font-sans text-slate-800 overflow-hidden" onClick={handleFirstInteraction}>
      {activeTab === 'home' && !selectedGame && <BackgroundHearts />}
      
      <AnimatePresence>
        {wrongGuessAlert && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: -100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed top-10 left-0 right-0 z-[100] flex justify-center pointer-events-none"
            >
                <motion.div 
                    animate={{ x: [-5, 5, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                    className="bg-red-500 text-white px-8 py-4 rounded-full shadow-2xl border-4 border-white flex items-center gap-3"
                >
                    <AlertOctagon size={32} />
                    <span className="text-2xl font-black uppercase tracking-widest">GABOLEH!!! 😡</span>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING MUSIC PLAYER --- */}
      <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
          <motion.div 
            layout
            className="flex items-center gap-2 bg-white/40 hover:bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-lg cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setIsMusicExpanded(!isMusicExpanded); }}
          >
              <Music size={18} className="text-pink-600" />
              <AnimatePresence>
                  {isMusicExpanded && playlist.length > 0 && (
                      <motion.span 
                        initial={{ opacity: 0, width: 0 }} 
                        animate={{ opacity: 1, width: "auto" }} 
                        exit={{ opacity: 0, width: 0 }}
                        className="text-xs font-bold text-pink-700 whitespace-nowrap overflow-hidden"
                      >
                          {playlist[currentSongIndex].title}
                      </motion.span>
                  )}
              </AnimatePresence>
              {isPlayingAudio ? <Volume2 size={18} className="text-pink-600 ml-1" /> : <VolumeX size={18} className="text-pink-600 ml-1" />}
          </motion.div>

          <AnimatePresence>
            {isMusicExpanded && (
              <motion.div 
                initial={{ opacity: 0, y: -10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 bg-white p-4 rounded-2xl shadow-2xl border border-pink-100 w-64 origin-top-right"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-sm text-gray-700">Playlist Ayang 🎶</h4>
                  <button onClick={() => setShowAddSong(!showAddSong)} className="text-pink-500 hover:bg-pink-50 p-1 rounded-md transition"><Plus size={16}/></button>
                </div>
                
                {/* Kontrol Utama */}
                <div className="flex justify-center items-center gap-4 mb-4 bg-pink-50 py-2 rounded-xl border border-pink-100">
                    <button onClick={prevSong} className="text-pink-500 hover:text-pink-700"><SkipBack size={20}/></button>
                    <button onClick={toggleAudio} className="bg-pink-500 text-white p-2 rounded-full shadow-md hover:scale-105 active:scale-95 transition">
                        {isPlayingAudio ? <Pause size={20}/> : <PlayIcon size={20}/>}
                    </button>
                    <button onClick={nextSong} className="text-pink-500 hover:text-pink-700"><SkipForward size={20}/></button>
                </div>

                {/* List Lagu */}
                <div className="max-h-32 overflow-y-auto space-y-1 mb-2 pr-1 custom-scrollbar">
                    {playlist.length === 0 ? <p className="text-xs text-gray-400 text-center">Belum ada lagu.</p> : playlist.map((song, idx) => (
                        <div 
                            key={song.id} 
                            onClick={() => { setCurrentSongIndex(idx); setIsPlayingAudio(true); }}
                            className={`text-xs p-2 rounded-lg cursor-pointer truncate transition-colors ${idx === currentSongIndex ? 'bg-pink-100 font-bold text-pink-700 border border-pink-200' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            {idx + 1}. {song.title}
                        </div>
                    ))}
                </div>

                {/* Form Tambah Lagu */}
                <AnimatePresence>
                    {showAddSong && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2 mt-2">
                                <input 
                                    type="text" 
                                    placeholder="Judul Lagu" 
                                    value={newSongTitle} 
                                    onChange={e=>setNewSongTitle(e.target.value)} 
                                    className="w-full p-2 text-xs bg-gray-50 rounded border focus:outline-pink-400"
                                />
                                
                                <input 
                                    type="file" 
                                    accept="audio/mp3, audio/*" 
                                    onChange={e => setNewSongFile(e.target.files?.[0] || null)} 
                                    className="w-full p-2 text-xs bg-gray-50 rounded border focus:outline-pink-400 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-pink-100 file:text-pink-600 hover:file:bg-pink-200 cursor-pointer"
                                />

                                <button 
                                    onClick={handleAddSong} 
                                    disabled={isUploadingSong}
                                    className="w-full bg-pink-500 text-white text-xs py-2 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition"
                                >
                                    {isUploadingSong ? (
                                        <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                                    ) : "Simpan Lagu"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      <div className="w-full h-full flex flex-col items-center justify-start pt-4 pb-24 md:pb-4 md:justify-center px-4">
        
        <div className="md:hidden absolute top-4 left-6 z-10 flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full"><Heart size={16} fill="white" className="text-white"/></div>
            <span className="font-bold text-white text-lg tracking-wide font-valentine">Rere Sayang</span>
        </div>

        <div className="w-full max-w-5xl h-[80vh] md:h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex flex-col relative mt-12 md:mt-0">
            
           <div className="hidden md:flex justify-between items-center p-6 border-b border-pink-50">
               <div className="flex items-center gap-2"><div className="bg-pink-500 p-2 rounded-full text-white"><Heart size={20} fill="white" /></div><span className="font-bold text-pink-600 text-xl">Rere Sayang</span></div>
               <div className="flex gap-6">
                   {[
                       {id: 'home', label: 'Home'}, 
                       {id: 'game', label: 'Game'}, 
                       {id: 'calendar', label: 'Calendar'}, 
                       {id: 'notes', label: 'Notes'}
                   ].map(link => (
                       <button key={link.id} onClick={()=>setActiveTab(link.id)} className={`text-sm font-bold transition-colors ${activeTab===link.id ? 'text-pink-600 bg-pink-50 px-3 py-1 rounded-full' : 'text-gray-400 hover:text-pink-500'}`}>
                           {link.label}
                       </button>
                   ))}
               </div>
           </div>

           <div className="flex-1 relative overflow-hidden">
                {activeTab === "home" && (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <AnimatePresence mode="wait">
                            
                            {/* STEP 0: TOMBOL AWAL */}
                            {surpriseStep === 0 && (
                                <motion.div 
                                    key="step0"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="flex flex-col items-center"
                                >
                                    <h2 className="text-4xl md:text-6xl font-bold text-pink-600 mb-4 font-valentine drop-shadow-sm">Kamu Manis Sayang...</h2>
                                    <p className="text-gray-500 mb-8 text-base md:text-lg max-w-xs md:max-w-none mx-auto">Jangan pencet tombol abu-abu yaaa 😡</p>
                                    <div className="flex flex-col md:flex-row items-center gap-4 relative w-full max-w-md mx-auto">
                                        <button onClick={() => { setSurpriseStep(1); handleFirstInteraction(); }} className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-red-400 text-white font-bold py-3 md:py-4 px-8 rounded-full shadow-lg hover:shadow-pink-500/50 active:scale-95 transition-all text-lg">Iya aku manis!</button>
                                        <motion.button animate={{ x: noBtnPos.x, y: noBtnPos.y }} onHoverStart={moveNoButton} onClick={moveNoButton} className="w-full md:w-auto bg-gray-200 text-gray-500 font-bold py-3 md:py-4 px-8 rounded-full active:scale-95 transition-colors text-lg">Gak Manis</motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 1-2: TYPEWRITER */}
                            {surpriseStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto">
                                    <Typewriter text="Hehehe kamu ngaku manis ya sayanggg... 🤭" speed={80} delayAfter={2000} onComplete={() => setSurpriseStep(2)} className="text-2xl md:text-4xl font-bold text-gray-700" />
                                </motion.div>
                            )}
                            {surpriseStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto">
                                    <Typewriter text="Iya kok sayang, kamu emang maniss banget! ❤️" speed={80} delayAfter={2000} onComplete={() => setSurpriseStep(3)} className="text-3xl md:text-5xl text-pink-600 font-valentine" />
                                </motion.div>
                            )}

                            {/* STEP 3: BUKTI FOTO */}
                            {surpriseStep === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.8 }}
                                    className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto"
                                >
                                    <Typewriter text="Ini buktinya 👇" speed={100} delayAfter={0} className="text-gray-500 mb-2 block" />
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 10, 0] }} transition={{ delay: 1.5, repeat: Infinity, duration: 1.5 }}>
                                        <ArrowDown className="text-pink-400 mb-4" size={32}/>
                                    </motion.div>
                                    <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 2, type: "spring" }} className="relative p-2 bg-white shadow-xl rotate-2 border border-gray-100 rounded-xl mb-6">
                                        <img src="/AyangkuManis.png" alt="Foto Kamu" className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg" />
                                        <div className="absolute -bottom-5 right-0 rotate-12"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-sm font-bold border border-yellow-200">Manis bgt kan?</span></div>
                                    </motion.div>
                                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} onClick={() => setSurpriseStep(4)} className="bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2">
                                        Next <ArrowRight size={18}/>
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* STEP 4: TEBAK MAKANAN */}
                            {surpriseStep === 4 && (
                                <motion.div 
                                    key="step4"
                                    className="flex flex-col items-center justify-center h-full w-full"
                                >
                                    <motion.h3 
                                        initial={{ y: -50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-2xl md:text-3xl font-bold text-pink-600 mb-10 z-20 text-center px-4"
                                    >
                                        Si manis ini suka apa ya?? 🤔
                                    </motion.h3>

                                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                                        <motion.div
                                            initial={{ scale: 1.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10"
                                        >
                                            <img src="/AyangkuManis.png" alt="Foto Pacar" className="w-full h-full object-cover" />
                                        </motion.div>

                                        {/* MAKANAN BUTTONS */}
                                        <motion.button
                                            initial={{ scale: 0, x: -50, y: -50 }}
                                            animate={{ scale: 1, x: 0, y: 0, rotate: [-3, 3, -3] }}
                                            transition={{ default: { duration: 0.5 }, rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                                            whileHover={{ scale: 1.2 }} whileTap={{ scale: 1.2 }}
                                            onClick={() => handleFoodClick(false)}
                                            className="absolute -top-4 -left-4 md:-top-6 md:-left-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20"
                                        >
                                            <img src="/Seblak.jpeg" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Seblak" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Seblak</span>
                                        </motion.button>

                                        <motion.button
                                            initial={{ scale: 0, x: 50, y: -50 }}
                                            animate={{ scale: 1, x: 0, y: 0, rotate: [3, -3, 3] }}
                                            transition={{ default: { duration: 0.5 }, rotate: { repeat: Infinity, duration: 2.2, ease: "easeInOut" } }}
                                            whileHover={{ scale: 1.2 }} whileTap={{ scale: 1.2 }}
                                            onClick={() => handleFoodClick(false)}
                                            className="absolute -top-4 -right-4 md:-top-6 md:-right-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20"
                                        >
                                            <img src="/Rujak.jpeg" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Rujak" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Rujak</span>
                                        </motion.button>

                                        <motion.button
                                            initial={{ scale: 0, x: -50, y: 50 }}
                                            animate={{ scale: 1, x: 0, y: 0, rotate: [-3, 3, -3] }}
                                            transition={{ default: { duration: 0.5 }, rotate: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
                                            whileHover={{ scale: 1.2 }} whileTap={{ scale: 1.2 }}
                                            onClick={() => handleFoodClick(false)}
                                            className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20"
                                        >
                                            <img src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=150&q=80" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Nanas" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Nanas</span>
                                        </motion.button>

                                        <motion.button
                                            initial={{ scale: 0, x: 50, y: 50 }}
                                            animate={{ scale: 1, x: 0, y: 0, rotate: [3, -3, 3] }}
                                            transition={{ default: { duration: 0.5 }, rotate: { repeat: Infinity, duration: 2.1, ease: "easeInOut" } }}
                                            whileHover={{ scale: 1.2 }} whileTap={{ scale: 1.2 }}
                                            onClick={() => handleFoodClick(true)}
                                            className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg border-2 border-transparent hover:border-green-400 z-20"
                                        >
                                            <img src="/Matcha.jpg" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Matcha" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Matcha</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: SUCCESS & LANJUT BUTTON */}
                            {surpriseStep === 5 && (
                                <motion.div 
                                    key="step5"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex flex-col items-center justify-center h-full text-center p-6"
                                >
                                    <div className="bg-green-100 p-4 rounded-full mb-6">
                                        <CheckCircle size={64} className="text-green-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Yeyyy! Akhirnya sayangkuu manuttttt! 🎉</h2>
                                    <p className="text-gray-500 mb-8">Kamu emang kesayangan aku yang paling manisss!</p>
                                    <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXN6aG16YjF6aG16YjF6aG16YjF6aG16YjF6YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.gif" alt="Cute Cat" className="w-48 rounded-xl shadow-lg mb-6" />
                                    
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setSurpriseStep(6)} 
                                        className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2 text-lg"
                                    >
                                        Lanjut sayang ❤️ <ArrowRight size={20}/>
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* STEP 6: CUBIT PIPI (NEW FEATURE) */}
                            {surpriseStep === 6 && (
                                <motion.div 
                                    key="step6"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ opacity:0, y:-100 }}
                                    className="flex flex-col items-center justify-center h-full text-center p-6"
                                >
                                    <h2 className="text-2xl md:text-3xl font-bold text-pink-600 mb-2 font-valentine">
                                        Cubit Pipi Karet! 🤏
                                    </h2>
                                    <p className="text-gray-500 mb-8 text-sm max-w-xs mx-auto">
                                        Tarik bagian <b>Pipi Kanan</b> buat nyubit! (Yang kiri aku paku biar gak lari 😝)
                                    </p>

                                    {/* AREA CUBIT (ELASTIC DRAG) */}
                                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
                                        <motion.div
                                            style={{ 
                                                x, 
                                                y, 
                                                scaleX, // Ini yang bikin efek MELAR (Stretch)
                                                rotate,
                                                transformOrigin: "20% 50%" // PAKU DI KIRI (Telinga Kiri)
                                            }}
                                            drag
                                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} 
                                            dragElastic={0.15} // Makin kecil makin "berat" karetnya
                                            whileTap={{ cursor: "grabbing" }}
                                            onPointerDown={handlePinchStart}
                                            className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing relative z-10 bg-pink-200 touch-none"
                                        >
                                            <img 
                                                src="/FotoCubit.jpeg" 
                                                alt="Foto Cubit" 
                                                className="w-full h-full object-cover pointer-events-none" 
                                            />
                                            
                                            {/* Text Bubble saat dicubit */}
                                            <motion.div 
                                                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"
                                            >
                                                <span className="bg-white text-pink-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">
                                                    Melarrr! 🤣
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                        
                                        {/* Icon Tangan Petunjuk (Di Pipi Kanan) */}
                                        <motion.div 
                                            animate={{ x: [5, 20, 5], opacity: [0.5, 1, 0.5] }}
                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="absolute top-1/2 right-0 md:right-4 transform -translate-y-1/2 text-pink-400 pointer-events-none"
                                        >
                                            <Hand size={32} className="rotate-90"/>
                                        </motion.div>
                                    </div>
                                    
                                    <div className="bg-white/50 px-4 py-2 rounded-lg border border-pink-100 mb-6">
                                        <span className="text-pink-500 font-bold">{pinchCount}</span> <span className="text-gray-500 text-sm">kali ditarik 🤕</span>
                                    </div>

                                    {/* MODIFIED: TOMBOL LANJUT KE SCENE BERIKUTNYA */}
                                    <motion.button 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }} 
                                        transition={{ delay: 1 }}
                                        onClick={() => setSurpriseStep(7)} 
                                        className="bg-white border-2 border-pink-200 text-pink-500 hover:bg-pink-50 px-6 py-2 rounded-full font-bold flex items-center gap-2"
                                    >
                                        Masih ada lagi nih 👇
                                    </motion.button>
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 7: PERCAYA CUBIT                       */}
                            {/* ============================================================ */}
                            {surpriseStep === 7 && (
                                <motion.div key="step7" className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto">
                                    <AnimatePresence mode="wait">
                                        {step7Sub === 0 && (
                                            <motion.div 
                                                key="text1"
                                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                            >
                                                <h2 className="text-2xl md:text-3xl font-bold text-pink-600 mb-6">Ga sakit kan cubitnya??? 🥺</h2>
                                                <button onClick={() => setStep7Sub(1)} className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">Engga kok</button>
                                            </motion.div>
                                        )}
                                        {step7Sub === 1 && (
                                            <motion.div 
                                                key="text2"
                                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                                            >
                                                <h2 className="text-2xl md:text-4xl font-valentine text-pink-600 mb-6">Jadi percaya dong kalo ketemu ku cubit? 😏</h2>
                                                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl mb-8">🤭</motion.div>
                                                <button onClick={() => setSurpriseStep(8)} className="bg-white border-2 border-pink-500 text-pink-500 px-6 py-2 rounded-full font-bold hover:bg-pink-50">Iya dehhh</button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 8: CHOICE CIRCLE                       */}
                            {/* ============================================================ */}
                            {surpriseStep === 8 && (
                                <motion.div key="step8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full w-full relative">
                                    <h3 className="text-xl font-bold text-gray-700 mb-10 text-center px-4 bg-white/80 p-2 rounded-xl backdrop-blur-sm z-20">
                                        Si manis ini sering ngomong apa ya? 🤔
                                        <span className="block text-xs font-normal text-gray-400 mt-1">(Klik semua kotak ucapan)</span>
                                    </h3>

                                    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
                                        {/* FOTO TENGAH */}
                                        <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10">
                                            <img src="/Simanis.jpeg" alt="Ayang" className="w-full h-full object-cover" />
                                        </div>

                                        {/* CHOICE 1 - ATAS */}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => !step8Choices.includes(1) && setStep8Choices([...step8Choices, 1])}
                                            className={`absolute top-0 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl shadow-lg border-2 text-xs md:text-sm font-bold transition-all z-20 w-40 text-center
                                                ${step8Choices.includes(1) ? 'bg-green-500 text-white border-green-600' : 'bg-white text-pink-600 border-pink-200'}`}
                                        >
                                            {step8Choices.includes(1) && <CheckCircle size={12} className="inline mr-1"/>}
                                            Kamu ga bosen sama aku? 🥺
                                        </motion.button>

                                        {/* CHOICE 2 - KANAN */}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => !step8Choices.includes(2) && setStep8Choices([...step8Choices, 2])}
                                            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 px-4 py-3 rounded-2xl shadow-lg border-2 text-xs md:text-sm font-bold transition-all z-20 w-32 text-center
                                                ${step8Choices.includes(2) ? 'bg-green-500 text-white border-green-600' : 'bg-white text-pink-600 border-pink-200'}`}
                                        >
                                            {step8Choices.includes(2) && <CheckCircle size={12} className="inline mr-1"/>}
                                            Kamu sayang aku ga? 👉👈
                                        </motion.button>

                                        {/* CHOICE 3 - BAWAH */}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => !step8Choices.includes(3) && setStep8Choices([...step8Choices, 3])}
                                            className={`absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-3 rounded-2xl shadow-lg border-2 text-xs md:text-sm font-bold transition-all z-20 w-40 text-center
                                                ${step8Choices.includes(3) ? 'bg-green-500 text-white border-green-600' : 'bg-white text-pink-600 border-pink-200'}`}
                                        >
                                            {step8Choices.includes(3) && <CheckCircle size={12} className="inline mr-1"/>}
                                            Kamu ga kangen sama aku? ☹️
                                        </motion.button>

                                        {/* CHOICE 4 - KIRI */}
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => !step8Choices.includes(4) && setStep8Choices([...step8Choices, 4])}
                                            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 px-4 py-3 rounded-2xl shadow-lg border-2 text-xs md:text-sm font-bold transition-all z-20 w-32 text-center
                                                ${step8Choices.includes(4) ? 'bg-green-500 text-white border-green-600' : 'bg-white text-pink-600 border-pink-200'}`}
                                        >
                                            {step8Choices.includes(4) && <CheckCircle size={12} className="inline mr-1"/>}
                                            Pretttt 🤪
                                        </motion.button>
                                    </div>

                                    {/* BUTTON NEXT */}
                                    <AnimatePresence>
                                        {step8Choices.length === 4 && (
                                            <motion.button
                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                onClick={() => setSurpriseStep(9)}
                                                className="absolute bottom-10 bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-pink-600 z-30 flex items-center gap-2"
                                            >
                                                Bener semua wkwk <ArrowRight size={18}/>
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 9: SLIDER 1000%                        */}
                            {/* ============================================================ */}
                            {surpriseStep === 9 && (
                                <motion.div key="step9" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }} className="flex flex-col items-center justify-center h-full p-6 w-full max-w-md mx-auto text-center">
                                    <h2 className="text-xl font-bold text-gray-700 mb-2">Mungkin kamu ragu...</h2>
                                    <p className="text-sm text-gray-500 mb-8">Tapi coba tarik slider ini biar kamu percaya perasaanku!</p>

                                    <div className="w-full space-y-6">
                                        {/* Slider 1 */}
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                                            <div className="flex justify-between mb-2">
                                                <label className="text-xs font-bold text-pink-500">Seberapa aku sayang kamu?</label>
                                                <span className="text-xs font-black text-pink-600">{step9Ranges.val1}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="1000" 
                                                value={step9Ranges.val1} 
                                                onChange={(e) => setStep9Ranges({...step9Ranges, val1: parseInt(e.target.value)})}
                                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                            />
                                        </div>

                                        {/* Slider 2 */}
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                                            <div className="flex justify-between mb-2">
                                                <label className="text-xs font-bold text-pink-500">Seberapa aku kangen kamu?</label>
                                                <span className="text-xs font-black text-pink-600">{step9Ranges.val2}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="1000" 
                                                value={step9Ranges.val2} 
                                                onChange={(e) => setStep9Ranges({...step9Ranges, val2: parseInt(e.target.value)})}
                                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                            />
                                        </div>

                                        {/* Slider 3 */}
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                                            <div className="flex justify-between mb-2">
                                                <label className="text-xs font-bold text-pink-500">Seberapa nyaman aku?</label>
                                                <span className="text-xs font-black text-pink-600">{step9Ranges.val3}%</span>
                                            </div>
                                            <input 
                                                type="range" min="0" max="1000" 
                                                value={step9Ranges.val3} 
                                                onChange={(e) => setStep9Ranges({...step9Ranges, val3: parseInt(e.target.value)})}
                                                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                            />
                                        </div>
                                    </div>

                                    {step9Ranges.val1 === 1000 && step9Ranges.val2 === 1000 && step9Ranges.val3 === 1000 && (
                                        <motion.button 
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            onClick={() => setSurpriseStep(10)} 
                                            className="mt-8 bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg animate-bounce"
                                        >
                                            Full 1000% Sayang! Lanjut! ❤️
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 10: SEMPROT NYAMUK (FIXED)             */}
                            {/* ============================================================ */}
                            {surpriseStep === 10 && (
                                <motion.div key="step10" className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden">
                                    <div className="text-center z-20 pointer-events-none mb-20 px-4">
                                        <h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-2">Btw kamar asrama banyak nyamuk kan? 🦟</h2>
                                        <p className="text-gray-600 text-sm">Sini aku bantuin semprot! (Klik nyamuknya)</p>
                                    </div>

                                    {/* Area Nyamuk */}
                                    <div className="absolute inset-0 z-10">
                                        <AnimatePresence>
                                            {step10Mosquitos.map((id) => (
                                                <motion.button
                                                    key={id}
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ 
                                                        opacity: 1, scale: 1,
                                                        x: [0, Math.random() * 300 - 150], 
                                                        y: [0, Math.random() * 400 - 200],
                                                        rotate: [0, 10, -10, 0]
                                                    }}
                                                    // FIX: Override transition di exit biar cepet ilang (0.2s)
                                                    exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }} 
                                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Biar klik gak tembus
                                                        setStep10Mosquitos(prev => prev.filter(m => m !== id));
                                                    }}
                                                    className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-2xl border border-gray-200 cursor-crosshair active:bg-red-200"
                                                >
                                                    🦟
                                                </motion.button>
                                            ))}
                                        </AnimatePresence>
                                    </div>

                                    {step10Mosquitos.length === 0 && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-30 text-center">
                                            <h3 className="text-2xl font-bold text-green-600 mb-4">Bersih! ✨</h3>
                                            <button onClick={() => setSurpriseStep(11)} className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg">
                                                Lanjut step berikutnya
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 11: VIDEO YOUTUBE                      */}
                            {/* ============================================================ */}
                            {surpriseStep === 11 && (
                                <motion.div key="step11" className="flex flex-col items-center justify-center h-full p-6 text-center w-full max-w-lg mx-auto">
                                    <h2 className="text-xl font-bold text-pink-600 mb-4">Si manis ini kayaknya lagi ketagihan ini nih 🎵</h2>
                                    
                                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6 border-4 border-white">
                                        <iframe 
                                            width="100%" 
                                            height="100%" 
                                            src="https://www.youtube.com/embed/fdJrSjMgPFE" 
                                            title="YouTube video player" 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen
                                        ></iframe>
                                    </div>

                                    <p className="text-xs text-gray-400 mb-6 italic">*Lagu background otomatis dipause biar ga tabrakan*</p>

                                    <button 
                                        onClick={() => {
                                            if (wasPlayingRef.current && audioRef.current) {
                                                audioRef.current.play(); // Resume lagu dashboard kalo mau
                                                setIsPlayingAudio(true);
                                            }
                                            setSurpriseStep(12);
                                        }} 
                                        className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2"
                                    >
                                        Lanjut yok manis <ArrowRight size={18}/>
                                    </button>
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 12: SEQUENCE TEXT & HUG                */}
                            {/* ============================================================ */}
                            {surpriseStep === 12 && (
                                <motion.div key="step12" className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto">
                                    <AnimatePresence mode="wait">
                                        {step12Sub === 0 && (
                                            <motion.div key="s12-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <Typewriter 
                                                    text="Gimana sayang? Seru enggak? 😁" 
                                                    speed={50} 
                                                    delayAfter={1500}
                                                    onComplete={() => setStep12Sub(1)}
                                                    className="text-2xl font-bold text-gray-700" 
                                                />
                                            </motion.div>
                                        )}
                                        {step12Sub === 1 && (
                                            <motion.div key="s12-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <Typewriter 
                                                    text="Maaf ya kalo kurang seru.. 😢" 
                                                    speed={50} 
                                                    delayAfter={1500}
                                                    onComplete={() => setStep12Sub(2)}
                                                    className="text-2xl font-bold text-gray-500" 
                                                />
                                            </motion.div>
                                        )}
                                        {step12Sub === 2 && (
                                            <motion.div key="s12-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <Typewriter 
                                                    text="Tapi kalo kamu emang merasa seru dan terhibur, terima kasih ya sayang! 🥰" 
                                                    speed={50} 
                                                    delayAfter={2000}
                                                    onComplete={() => setStep12Sub(3)}
                                                    className="text-2xl font-bold text-pink-600" 
                                                />
                                            </motion.div>
                                        )}
                                        {step12Sub === 3 && (
                                            <motion.div key="s12-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                                                <h2 className="text-3xl font-valentine text-pink-600 mb-8">Peluk dulu dong, kangen nih! 🤗</h2>
                                                
                                                <button
                                                    onMouseDown={() => setIsStep12Holding(true)}
                                                    onMouseUp={() => setIsStep12Holding(false)}
                                                    onTouchStart={() => setIsStep12Holding(true)}
                                                    onTouchEnd={() => setIsStep12Holding(false)}
                                                    className="relative w-40 h-40 rounded-full bg-gray-100 border-4 border-pink-200 flex items-center justify-center overflow-hidden shadow-inner active:scale-95 transition-transform"
                                                >
                                                    <div className="absolute bottom-0 left-0 right-0 bg-pink-400 transition-all duration-75 ease-linear" style={{ height: `${step12Hug}%` }}></div>
                                                    <Heart size={64} className={`relative z-10 transition-colors ${step12Hug > 50 ? 'text-white' : 'text-pink-300'}`} fill={step12Hug > 50 ? "white" : "none"}/>
                                                </button>
                                                <p className="mt-4 text-sm text-gray-400 font-bold">{step12Hug}% Pelukan</p>
                                                <p className="text-xs text-gray-300">Tahan tombol love-nya</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}

                            {/* ============================================================ */}
                            {/* STEP 13: FINAL CLOSING                      */}
                            {/* ============================================================ */}
                            {surpriseStep === 13 && (
                                <motion.div key="step13" className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto relative">
                                    {/* Background Effect */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        <motion.div animate={{ opacity: [0, 1, 0], y: -50 }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-1/4 left-10 text-2xl">❤️</motion.div>
                                        <motion.div animate={{ opacity: [0, 1, 0], y: -50 }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="absolute top-1/3 right-10 text-2xl">💖</motion.div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {step13Sub === 0 && (
                                            <motion.h2 key="t1" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-2xl font-bold text-pink-600">
                                                Sayang, makasih pelukannya! 🤗
                                            </motion.h2>
                                        )}
                                        {step13Sub === 1 && (
                                            <motion.h2 key="t2" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-2xl font-bold text-gray-700">
                                                Terima kasih juga atas semuanya...
                                            </motion.h2>
                                        )}
                                        {step13Sub === 2 && (
                                            <motion.h2 key="t3" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-xl font-bold text-gray-600 leading-relaxed">
                                                Terima kasih kamu sudah bertahan dan berusaha loyal kepadaku.. ❤️
                                            </motion.h2>
                                        )}
                                        {step13Sub === 3 && (
                                            <motion.h2 key="t4" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-xl font-bold text-gray-600 leading-relaxed">
                                                Terima kasih kamu sudah bersabar menghadapi overthinkingku.. 🧠
                                            </motion.h2>
                                        )}
                                        {step13Sub === 4 && (
                                            <motion.h2 key="t5" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}} className="text-xl font-bold text-gray-600 leading-relaxed">
                                                Terima kasih kamu udah mau berubah walaupun berat, demi menghormati perasaanku. 🥺
                                            </motion.h2>
                                        )}
                                        {step13Sub === 5 && (
                                            <motion.div key="t6" initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:1.2}}>
                                                <h2 className="text-3xl font-valentine font-bold text-pink-600 mb-4">Thank you a lot, my darling Rere 💝</h2>
                                            </motion.div>
                                        )}
                                        {step13Sub === 6 && (
                                            <motion.div key="t7" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center">
                                                <h1 className="text-4xl md:text-5xl font-valentine font-bold text-red-500 mb-8 drop-shadow-md">I Love You Forever! 💍</h1>
                                                <button onClick={handleResetSurprise} className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors text-sm border-b border-transparent hover:border-pink-500 pb-1">
                                                    <RotateCcw size={14}/> Ulangi Scene Ini
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    {/* Navigation Arrow for Text Sequence */}
                                    {step13Sub < 6 && (
                                        <motion.button 
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                                            onClick={() => setStep13Sub(prev => prev + 1)}
                                            className="mt-12 bg-white/50 hover:bg-white p-3 rounded-full shadow-sm text-pink-400 hover:text-pink-600 transition-all"
                                        >
                                            <ChevronRight size={24}/>
                                        </motion.button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                  )}

                  {activeTab === "game" && renderGameContent()}

                  {activeTab === "calendar" && renderCalendar()}

                  {activeTab === "notes" && (
                    <div className="relative w-full h-full bg-orange-50 flex flex-col">
                        <div className="flex-1 w-full h-full overflow-auto relative touch-pan-x touch-pan-y" ref={constraintsRef}>
                            <div className="absolute inset-0 opacity-10 pointer-events-none sticky top-0 left-0 min-w-full min-h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                            <div className="min-w-[120vw] min-h-[120vh] md:min-w-full md:min-h-full relative pb-20">
                                {notes.map((note) => (
                                    <DraggableNote key={note.id} note={note} onDelete={handleDeleteNote} onUpdatePos={handleUpdateNotePos} containerRef={constraintsRef}/>
                                ))}
                                {notes.length === 0 && !loadingNotes && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 w-full px-4">
                                        <StickyNote size={48} className="mx-auto mb-2 opacity-20"/>
                                        <p className="text-sm">Belum ada catatan.<br/>Klik + di pojok kanan!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col items-end gap-3 z-50">
                            {showNoteForm && (
                                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-xl border border-pink-100 w-[260px] md:w-80">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-700">Tulis Catatan 📝</h4>
                                        <button onClick={() => setShowNoteForm(false)}><X size={18} className="text-gray-400"/></button>
                                    </div>
                                    <input className="w-full mb-2 p-3 bg-gray-50 rounded-xl text-sm focus:outline-pink-500" placeholder="Judul..." value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})}/>
                                    <textarea className="w-full mb-3 p-3 bg-gray-50 rounded-xl text-sm focus:outline-pink-500 min-h-[80px]" placeholder="Isi catatan..." value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})}></textarea>
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            {NOTE_COLORS.map(c => (
                                                <button key={c.name} onClick={() => setNewNote({...newNote, color: c.bg})} className={`w-6 h-6 rounded-full border-2 ${c.bg} ${newNote.color === c.bg ? 'border-gray-500 scale-110' : 'border-transparent'}`}/>
                                            ))}
                                        </div>
                                        <button onClick={handleAddNote} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-pink-600">Tempel</button>
                                    </div>
                                </motion.div>
                            )}
                            <button onClick={() => setShowNoteForm(!showNoteForm)} className="bg-pink-500 hover:bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
                                {showNoteForm ? <X size={28}/> : <Plus size={28}/>}
                            </button>
                        </div>
                    </div>
                  )}
             </div>
          </div>

        {/* BOTTOM NAV BAR (HIDDEN WHEN GAME IS ACTIVE) */}
        {!selectedGame && (
          <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-lg rounded-full shadow-2xl border border-white/50 z-50 flex items-center justify-between px-6">
              {[
                  { id: "home", icon: Home },
                  { id: "game", icon: Gamepad2 },
                  { id: "calendar", icon: Calendar },
                  { id: "notes", icon: StickyNote }
              ].map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                      <button 
                          key={item.id} 
                          onClick={() => setActiveTab(item.id)}
                          className={`relative flex flex-col items-center justify-center w-10 h-10 transition-all duration-300 ${isActive ? '-translate-y-1' : 'opacity-50 hover:opacity-100'}`}
                      >
                          <div className={`absolute inset-0 bg-pink-100 rounded-full scale-0 transition-transform ${isActive ? 'scale-100' : ''}`}></div>
                          <item.icon size={22} className={`relative z-10 ${isActive ? 'text-pink-600' : 'text-gray-600'}`} />
                          {isActive && <span className="absolute -bottom-5 w-1 h-1 bg-pink-500 rounded-full"></span>}
                      </button>
                  )
              })}
          </div>
        )}

      </div>
    </main>
  );
}