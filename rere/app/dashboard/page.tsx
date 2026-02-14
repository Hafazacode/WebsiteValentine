"use client";

import { useState, useEffect, memo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { 
  Heart, Home, Gamepad2, Calendar, StickyNote, Clock, List, Hourglass, Plus, Trash2, X, 
  ArrowDown, RotateCcw, ArrowRight, CheckCircle, AlertOctagon, Bird, CalendarCheck, 
  ChevronLeft, ChevronRight, Hand, CircleDot, Gift, Play as PlayIcon, Pause, SkipForward, 
  SkipBack, Music, Volume2, Loader2, Smartphone, Mic2,
  Smile, Frown, Zap, Lightbulb, Star, CloudRain, Flame, Disc, AlertTriangle
} from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";

// --- IMPORT GAME (Sesuaikan path import ini dengan projectmu) ---
import FlappyBirdGame from "@/components/FlappyBirdGame"; 
import TicTacToeGame from "@/components/TicTacToeGame";
import AyangIoGame from "@/components/AyangIoGame";
import ChessGame from "@/components/ChessGame";
import RhythmKissGame from "@/components/RhythmKissGame";

// =======================================================
// KONFIGURASI 
// =======================================================
const TGL_LAHIR_AYANG = 23; 
const BLN_LAHIR_AYANG = 3;  
const TGL_LAHIR_KAMU = 3;  
const BLN_LAHIR_KAMU = 9;  

const MONTH_IMAGES = [
  "/Januari.jpeg", "/Februari.jpeg", "/Maret.jpeg", "/April.jpeg",
  "/Mei.jpeg", "/Juni.jpeg", "/Juli.jpeg", "/Agustus.jpeg",
  "/September.jpeg", "/Oktober.jpeg", "/November.jpeg", "/Desember.jpeg"      
];

// --- Tipe Data ---
type EventData = { id: number; title: string; date: string; description: string; };
type CategoryData = { id: string | number; name: string; icon: string; color: string; };
type NoteData = { id: number; title: string; content: string; color: string; x: number; y: number; };
type SongData = { id: number; title: string; url: string; categoryId?: string; cover_url?: string | null; };

// Helper untuk mengecek apakah string adalah kode Hex Color (#RRGGBB)
const isHexColor = (color: string) => color?.startsWith('#');

const NOTE_COLORS = [
  { name: "yellow", bg: "bg-yellow-200" }, { name: "pink", bg: "bg-pink-200" },
  { name: "blue", bg: "bg-blue-200" }, { name: "green", bg: "bg-green-200" },
  { name: "purple", bg: "bg-purple-200" }, { name: "orange", bg: "bg-orange-200" },
];

const MOOD_ICONS = [
  { id: 'love', icon: Heart, label: 'Cinta' }, { id: 'happy', icon: Smile, label: 'Senang' },
  { id: 'sad', icon: Frown, label: 'Sedih' }, { id: 'angry', icon: Flame, label: 'Marah' },
  { id: 'idea', icon: Lightbulb, label: 'Ide' }, { id: 'dream', icon: CloudRain, label: 'Galau' },
  { id: 'star', icon: Star, label: 'Fav' }, { id: 'urgent', icon: Zap, label: 'Semangat' },
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

// --- BACKGROUND HEARTS ---
const BackgroundHearts = memo(() => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 8 }).map((_, index) => (
         <motion.div key={index} className="absolute text-white/20"
            style={{ left: `${Math.random() * 100}vw`, fontSize: `${Math.random() * 20 + 10}px` }}
            initial={{ y: "110vh", opacity: 0 }}
            animate={{ y: "-10vh", opacity: [0, 0.5, 0] }}
            transition={{ duration: Math.random() * 10 + 15, repeat: Infinity, delay: Math.random() * 10, ease: "linear" }}
         >❤️</motion.div>
      ))}
    </div>
  );
});
BackgroundHearts.displayName = "BackgroundHearts";

// --- DRAGGABLE NOTE ---
const DraggableNote = ({ note, onDelete, onUpdatePos, containerRef }: { note: NoteData, onDelete: (id: number) => void, onUpdatePos: (id: number, x: number, y: number) => void, containerRef: any }) => {
    return (
        <motion.div drag dragMomentum={false} dragConstraints={containerRef} 
            initial={{ x: note.x, y: note.y, scale: 0 }} animate={{ x: note.x, y: note.y, scale: 1 }}
            whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
            onDragEnd={(event, info) => { onUpdatePos(note.id, note.x + info.offset.x, note.y + info.offset.y); }}
            className={`absolute w-36 md:w-52 min-h-[140px] md:min-h-[180px] p-4 shadow-md rounded-sm ${note.color} flex flex-col justify-between touch-none`}
            style={{ left: 0, top: 0 }}
        >
            <div>
                <h4 className="font-bold text-gray-800 text-sm md:text-lg mb-1 leading-tight line-clamp-2" style={{ fontFamily: 'cursive' }}>{note.title}</h4>
                <p className="text-gray-700 text-xs md:text-sm whitespace-pre-wrap leading-snug" style={{ fontFamily: 'cursive' }}>{note.content}</p>
            </div>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(note.id)} className="self-end mt-1 text-gray-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
        </motion.div>
    );
};

// --- TIMERS ---
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

const BirthdayTimer = ({ title, targetDate, targetMonth, imgSrc, reverse = false }: { title: string, targetDate: number, targetMonth: number, imgSrc: string, reverse?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let currentYear = now.getFullYear();
      let bday = new Date(currentYear, targetMonth - 1, targetDate);
      if (now.getTime() > bday.getTime() && now.getDate() !== targetDate) bday = new Date(currentYear + 1, targetMonth - 1, targetDate);
      else if (now.getDate() === targetDate && now.getMonth() === targetMonth - 1) { setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      const diff = bday.getTime() - now.getTime();
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)), hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60), seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetMonth]);
  const isToday = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;
  return (
    <div className={`flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-pink-100 ${reverse ? 'flex-row-reverse' : 'flex-row'}`}>
       <div className="w-20 h-20 shrink-0 rounded-full overflow-hidden border-4 border-pink-200 shadow-md"><img src={imgSrc} alt={title} className="w-full h-full object-cover" /></div>
       <div className={`flex-1 flex flex-col ${reverse ? 'items-end text-right' : 'items-start text-left'}`}>
           <h4 className="font-bold text-pink-600 mb-2 leading-tight">{title}</h4>
           {isToday ? <div className="animate-pulse text-base font-black text-red-500 flex items-center gap-1">🎉 HAPPY BIRTHDAY! 🎉</div> : (
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
      <div className="text-center mb-2"><h2 className="text-xl md:text-2xl font-bold text-pink-600 flex items-center justify-center gap-2 mb-1"><Gift className="text-red-400" /> Countdown Ultah Kita</h2><p className="text-gray-500 text-xs md:text-sm">Menghitung mundur hari spesial kesayangan ❤️</p></div>
      <BirthdayTimer title="Ulang Tahun Ayang 👑" targetDate={TGL_LAHIR_AYANG} targetMonth={BLN_LAHIR_AYANG} imgSrc="/MyAyang.jpeg" />
      <BirthdayTimer title="Ulang Tahun Kamu 🤴" targetDate={TGL_LAHIR_KAMU} targetMonth={BLN_LAHIR_KAMU} imgSrc="/MyPhoto.jpeg" reverse />
  </div>
);


// --- MAIN PAGE ---
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [calendarTab, setCalendarTab] = useState("relationship");
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const [selectedGame, setSelectedGame] = useState<string | null>(null); 
  const constraintsRef = useRef(null);
  
  // Surprise & Game States
  const [surpriseStep, setSurpriseStep] = useState(0);
  const [wrongGuessAlert, setWrongGuessAlert] = useState(false);
  const [pinchCount, setPinchCount] = useState(0); 
  const [step7Sub, setStep7Sub] = useState(0); 
  const [step8Choices, setStep8Choices] = useState<number[]>([]); 
  const [step9Ranges, setStep9Ranges] = useState({ val1: 0, val2: 0, val3: 0 }); 
  const [step10Mosquitos, setStep10Mosquitos] = useState([1, 2, 3, 4, 5]); 
  const [step12Sub, setStep12Sub] = useState(0); 
  const [step12Hug, setStep12Hug] = useState(0); 
  const [isStep12Holding, setIsStep12Holding] = useState(false); 
  const [step13Sub, setStep13Sub] = useState(0); 

  // Audio States
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  
  // Music & Categories
  const [playlist, setPlaylist] = useState<SongData[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newSongFile, setNewSongFile] = useState<File | null>(null); 
  const [newSongImage, setNewSongImage] = useState<File | null>(null); 
  const [isUploadingSong, setIsUploadingSong] = useState(false); 
  const [showAddSong, setShowAddSong] = useState(false);
  
  // State Kategori
  const [categories, setCategories] = useState<CategoryData[]>([{ id: 'all', name: 'Semua', icon: 'star', color: '#ffffff' }]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | number>('all');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  // State Delete Modal Custom
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    categoryId: null as string | number | null,
    categoryName: "",
    songCount: 0
  });
  
  // DEFAULT COLOR HEX untuk input picker
  const [newCategory, setNewCategory] = useState({ name: "", icon: "happy", color: "#EC4899" }); 
  const [newSongCategory, setNewSongCategory] = useState<string | number>("all");

  // Database States
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "", color: NOTE_COLORS[0].bg });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [selectedCountdownId, setSelectedCountdownId] = useState<string>("");
  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // Variables
  const x = useMotionValue(0); const y = useMotionValue(0);
  const scaleX = useTransform(x, [-150, 150], [0.6, 1.6]); 
  const rotate = useTransform(y, [-150, 150], [-10, 10]);
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const wasPlayingRef = useRef(false); 

  // --- USE EFFECTS ---
  useEffect(() => {
      if (selectedGame === 'rhythm' || selectedGame === 'ayangio') {
          if (audioRef.current && !audioRef.current.paused) {
              wasPlayingRef.current = true; audioRef.current.pause(); setIsPlayingAudio(false);
          } else { wasPlayingRef.current = false; }
      } else if (!selectedGame) {
           if (wasPlayingRef.current && audioRef.current && audioRef.current.paused && surpriseStep !== 11) {
              audioRef.current.play().catch(e => console.log("Resume failed", e)); setIsPlayingAudio(true);
          }
      }
      if (surpriseStep === 11) { 
        if (audioRef.current && !audioRef.current.paused) {
            wasPlayingRef.current = true; audioRef.current.pause(); setIsPlayingAudio(false);
        }
      }
  }, [selectedGame, surpriseStep]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (surpriseStep === 12 && isStep12Holding && step12Hug < 100) {
      interval = setInterval(() => { setStep12Hug((prev) => { if (prev >= 100) return 100; return prev + 1; }); }, 30);
    }
    return () => clearInterval(interval);
  }, [isStep12Holding, step12Hug, surpriseStep]);

  useEffect(() => {
    if (surpriseStep === 12 && step12Hug >= 100) {
        const timeout = setTimeout(() => { setSurpriseStep(13); }, 500); return () => clearTimeout(timeout);
    }
  }, [step12Hug, surpriseStep]);

  const handleResetSurprise = () => {
      setIsStep12Holding(false); setStep12Hug(0);
      setTimeout(() => {
        setSurpriseStep(0); setStep7Sub(0); setStep8Choices([]);
        setStep9Ranges({ val1: 0, val2: 0, val3: 0 }); setStep10Mosquitos([1, 2, 3, 4, 5]);
        setStep12Sub(0); setStep13Sub(0);
      }, 50);
  };

  useEffect(() => { 
      if (activeTab === 'calendar' && events.length === 0) fetchEvents();
      if (activeTab === 'notes' && notes.length === 0) fetchNotes();
      fetchCategories();
  }, [activeTab]);

  useEffect(() => { fetchPlaylist(); }, []);

  // --- MUSIC LOGIC ---

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
        console.error("Gagal load kategori:", error);
    } else {
        const dbCats = data?.map((c: any) => ({
            id: c.id, 
            name: c.name, 
            icon: c.icon, 
            color: c.color 
        })) || [];
        setCategories([{ id: 'all', name: 'Semua', icon: 'star', color: '#ffffff' }, ...dbCats]);
    }
  };

  const handleAddCategory = async () => {
    if(!newCategory.name) return;
    
    const { error } = await supabase.from('categories').insert([{
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color
    }]);

    if(error) {
        alert("Gagal simpan kategori: " + error.message);
    } else {
        fetchCategories(); 
        setNewCategory({ name: "", icon: "happy", color: "#EC4899" }); 
        setShowAddCategory(false);
    }
  };

  // 1. Initiate Delete (Cek lagu dulu, lalu buka modal custom)
  const initiateDeleteCategory = async (id: string | number, categoryName: string) => {
    if (id === 'all') return;
    
    // Cek jumlah lagu
    const { count, error: countError } = await supabase
        .from('songs')
        .select('*', { count: 'exact', head: true })
        .eq('categoryId', id);

    if (countError) {
        alert("Gagal mengecek data lagu: " + countError.message);
        return;
    }

    // Buka Modal Konfirmasi
    setDeleteModal({
        isOpen: true,
        categoryId: id,
        categoryName: categoryName,
        songCount: count || 0
    });
  };

  // 2. Execute Delete (Dipanggil setelah tombol "Hapus" di modal ditekan)
  const executeDeleteCategory = async () => {
     const { categoryId, songCount } = deleteModal;
     if (!categoryId) return;

     // Hapus lagu dulu jika ada
     if (songCount > 0) {
        const { error: delSongsError } = await supabase.from('songs').delete().eq('categoryId', categoryId);
        if (delSongsError) {
            alert("Gagal menghapus lagu dalam kategori: " + delSongsError.message);
            return;
        }
     }

     // Hapus Kategori
     const { error } = await supabase.from('categories').delete().eq('id', categoryId);
     if (error) {
        alert("Gagal hapus kategori: " + error.message);
     } else {
        setSelectedCategoryId('all'); 
        fetchCategories(); 
        fetchPlaylist(); 
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: "", songCount: 0 }); // Tutup modal
     }
  };

  const fetchPlaylist = async () => {
      const { data } = await supabase.from('songs').select('*').order('id', { ascending: true });
      if (data && data.length > 0) setPlaylist(data);
      else setPlaylist([{ id: 0, title: "Lagu Romantis Default", url: "/backsound.mp3", cover_url: null }]);
  };

  const getFilteredPlaylist = () => {
      if (selectedCategoryId === 'all') return playlist;
      return playlist.filter(s => String(s.categoryId) === String(selectedCategoryId) || !s.categoryId);
  };
  
  const handleAddSong = async () => {
      if (!newSongTitle || !newSongFile) return alert("Isi judul dan pilih file lagunya!");
      setIsUploadingSong(true);
      
      const uniquePrefix = `${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // 1. Upload Audio
      const audioExt = newSongFile.name.split('.').pop();
      const audioFileName = `${uniquePrefix}_audio.${audioExt}`;
      const { data: audioData, error: audioError } = await supabase.storage.from('songs').upload(audioFileName, newSongFile);

      if (audioError) { 
        alert("Gagal mengunggah audio: " + audioError.message); 
        setIsUploadingSong(false); return; 
      }
      
      const { data: { publicUrl: audioPublicUrl } } = supabase.storage.from('songs').getPublicUrl(audioFileName);

      // 2. Upload Image (Optional)
      let coverPublicUrl = null;
      if (newSongImage) {
        const imgExt = newSongImage.name.split('.').pop();
        const imgFileName = `${uniquePrefix}_cover.${imgExt}`;
        const { data: imgData, error: imgError } = await supabase.storage.from('songs').upload(imgFileName, newSongImage);
        
        if (!imgError) {
             const { data: { publicUrl } } = supabase.storage.from('songs').getPublicUrl(imgFileName);
             coverPublicUrl = publicUrl;
        } else {
             console.log("Cover image upload failed, skipping...", imgError);
        }
      }

      // 3. Save to Database
      const { error: dbError } = await supabase.from('songs').insert([{ 
          title: newSongTitle, 
          url: audioPublicUrl, 
          cover_url: coverPublicUrl, 
          categoryId: newSongCategory 
      }]);

      if (!dbError) { 
          fetchPlaylist(); 
          setNewSongTitle(""); 
          setNewSongFile(null); 
          setNewSongImage(null); 
          setShowAddSong(false); 
      } else { 
          alert("Gagal menyimpan ke database"); 
      }
      setIsUploadingSong(false);
  };

  const handleDeleteSong = async (id: number) => {
    if(!confirm("Yakin mau hapus lagu ini?")) return;
    
    // Hapus dari database (Row)
    const { error } = await supabase.from('songs').delete().eq('id', id);
    
    if (error) {
        alert("Gagal menghapus lagu: " + error.message);
    } else {
        // Jika sedang memutar lagu yang dihapus, stop player
        if (playlist[currentSongIndex]?.id === id) {
             if (audioRef.current) { audioRef.current.pause(); }
             setIsPlayingAudio(false);
             setCurrentSongIndex(0);
        }
        fetchPlaylist();
    }
  };

  useEffect(() => {
      const activeList = getFilteredPlaylist();
      if (activeList.length > 0) {
          const songUrl = activeList[currentSongIndex]?.url || activeList[0].url;
          if (!audioRef.current) {
              audioRef.current = new Audio(songUrl); audioRef.current.volume = 0.5; audioRef.current.addEventListener('ended', nextSong);
          } else {
              const currentAudioSrc = audioRef.current.src;
              if (currentAudioSrc !== songUrl && currentAudioSrc !== window.location.origin + songUrl) {
                  const wasPlaying = !audioRef.current.paused; audioRef.current.src = songUrl;
                  if ((wasPlaying || isPlayingAudio) && !selectedGame && surpriseStep !== 11) { audioRef.current.play().catch(e => console.error(e)); }
              }
          }
      }
      return () => { if (audioRef.current) audioRef.current.removeEventListener('ended', nextSong); };
  }, [currentSongIndex, playlist, selectedCategoryId]); 

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) { audioRef.current.pause(); setIsPlayingAudio(false); wasPlayingRef.current = false; } 
      else { audioRef.current.play().catch(e => console.log("Play failed:", e)); setIsPlayingAudio(true); wasPlayingRef.current = true; }
    }
  };

  const nextSong = () => {
      const activeList = getFilteredPlaylist(); if (activeList.length === 0) return;
      setCurrentSongIndex((prev) => (prev + 1) % activeList.length);
  };
  const prevSong = () => {
      const activeList = getFilteredPlaylist(); if (activeList.length === 0) return;
      setCurrentSongIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
  };

  // --- GENERAL HANDLERS ---
  const handleFirstInteraction = () => {
    if (!userInteracted) {
        setUserInteracted(true);
        if (audioRef.current && !isPlayingAudio && !selectedGame && surpriseStep !== 11) {
            audioRef.current.play().then(() => { setIsPlayingAudio(true); wasPlayingRef.current = true; }).catch(() => console.log("Auto-play blocked"));
        }
    }
  };

  const handleFoodClick = (isCorrect: boolean) => {
    if (isCorrect) setSurpriseStep(5);
    else { setWrongGuessAlert(true); setTimeout(() => setWrongGuessAlert(false), 2000); }
  };

  const handlePinchStart = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    setPinchCount(prev => prev + 1);
  };

  // --- CRUD FUNCTIONS ---
  const fetchEvents = async () => { setLoadingEvents(true); const { data } = await supabase.from('events').select('*').order('date', { ascending: true }); setEvents(data || []); setLoadingEvents(false); };
  const handleAddEvent = async () => { if (!newEvent.title || !newEvent.date) return alert("Isi lengkap!"); await supabase.from('events').insert([newEvent]); fetchEvents(); setNewEvent({ title: "", date: "", description: "" }); };
  const handleDeleteEvent = async (id: number) => { if(!confirm("Hapus?")) return; await supabase.from('events').delete().eq('id', id); fetchEvents(); };

  const fetchNotes = async () => { setLoadingNotes(true); const { data } = await supabase.from('notes').select('*'); setNotes(data || []); setLoadingNotes(false); };
  
  const handleAddNote = async () => { if (!newNote.title || !newNote.content) return alert("Tulis dulu!"); const randomX = Math.floor(Math.random() * 50); const randomY = Math.floor(Math.random() * 50); await supabase.from('notes').insert([{ ...newNote, x: randomX, y: randomY }]); fetchNotes(); setNewNote({ title: "", content: "", color: NOTE_COLORS[0].bg }); setShowNoteForm(false); };
  const handleDeleteNote = async (id: number) => { if(!confirm("Buang?")) return; setNotes(prev => prev.filter(n => n.id !== id)); await supabase.from('notes').delete().eq('id', id); };
  const handleUpdateNotePos = async (id: number, x: number, y: number) => { await supabase.from('notes').update({ x, y }).eq('id', id); };

  // Helper Calendar
  useEffect(() => {
    if (!selectedCountdownId) return;
    const targetEvent = events.find(e => e.id.toString() === selectedCountdownId); if (!targetEvent) return;
    const target = new Date(targetEvent.date + "T00:00:00");
    const interval = setInterval(() => {
        const now = new Date(); const diff = target.getTime() - now.getTime();
        if(diff<=0) clearInterval(interval); else setCountdownTime({ days: Math.floor(diff / (1000 * 60 * 60 * 24)), hours: Math.floor((diff / (1000 * 60 * 60)) % 24), minutes: Math.floor((diff / 1000 / 60) % 60), seconds: Math.floor((diff / 1000) % 60), });
    }, 1000); return () => clearInterval(interval);
  }, [selectedCountdownId, events]);

  const moveNoButton = () => { setNoBtnPos({ x: Math.random()*150-75, y: Math.random()*150-75 }); };
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear(); const month = date.getMonth(); const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = []; for (let i = 0; i < firstDay; i++) days.push(null); for (let i = 1; i <= daysInMonth; i++) days.push(i); return days;
  };
  const changeMonth = (offset: number) => { setCurrentCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1)); };

  // =======================================================
  // RENDER SECTIONS
  // =======================================================
  const renderSurpriseContent = () => (
        <AnimatePresence mode="wait">
            {surpriseStep === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col items-center">
                    <h2 className="text-4xl md:text-6xl font-bold text-pink-600 mb-4 font-valentine drop-shadow-sm">Kamu Manis Sayang...</h2>
                    <p className="text-gray-500 mb-8 text-base md:text-lg max-w-xs md:max-w-none mx-auto">Jangan pencet tombol abu-abu yaaa 😡</p>
                    <div className="flex flex-col md:flex-row items-center gap-4 relative w-full max-w-md mx-auto">
                        <button onClick={() => { setSurpriseStep(1); handleFirstInteraction(); }} className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-red-400 text-white font-bold py-3 md:py-4 px-8 rounded-full shadow-lg hover:shadow-pink-500/50 active:scale-95 transition-all text-lg">Iya aku manis!</button>
                        <motion.button animate={{ x: noBtnPos.x, y: noBtnPos.y }} onHoverStart={moveNoButton} onClick={moveNoButton} className="w-full md:w-auto bg-gray-200 text-gray-500 font-bold py-3 md:py-4 px-8 rounded-full active:scale-95 transition-colors text-lg">Gak Manis</motion.button>
                    </div>
                </motion.div>
            )}
            {surpriseStep === 1 && <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto"><Typewriter text="Hehehe kamu ngaku manis ya sayanggg... 🤭" speed={80} delayAfter={2000} onComplete={() => setSurpriseStep(2)} className="text-2xl md:text-4xl font-bold text-gray-700" /></motion.div>}
            {surpriseStep === 2 && <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-md mx-auto"><Typewriter text="Iya kok sayang, kamu emang maniss banget! ❤️" speed={80} delayAfter={2000} onComplete={() => setSurpriseStep(3)} className="text-3xl md:text-5xl text-pink-600 font-valentine" /></motion.div>}
            {surpriseStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.8 }} className="flex flex-col items-center justify-center h-full w-full max-w-lg mx-auto">
                    <Typewriter text="Ini buktinya 👇" speed={100} delayAfter={0} className="text-gray-500 mb-2 block" />
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, y: [0, 10, 0] }} transition={{ delay: 1.5, repeat: Infinity, duration: 1.5 }}><ArrowDown className="text-pink-400 mb-4" size={32}/></motion.div>
                    <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 2, type: "spring" }} className="relative p-2 bg-white shadow-xl rotate-2 border border-gray-100 rounded-xl mb-6">
                        <img src="/AyangkuManis.png" alt="Foto Kamu" className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg" />
                        <div className="absolute -bottom-5 right-0 rotate-12"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-sm font-bold border border-yellow-200">Manis bgt kan?</span></div>
                    </motion.div>
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} onClick={() => setSurpriseStep(4)} className="bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2">Next <ArrowRight size={18}/></motion.button>
                </motion.div>
            )}
             {surpriseStep === 4 && (
                <motion.div key="step4" className="flex flex-col items-center justify-center h-full w-full">
                    <motion.h3 initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-2xl md:text-3xl font-bold text-pink-600 mb-10 z-20 text-center px-4">Si manis ini suka apa ya?? 🤔</motion.h3>
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                        <motion.div initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10">
                            <img src="/AyangkuManis.png" alt="Foto Pacar" className="w-full h-full object-cover" />
                        </motion.div>
                        {[
                            { id: 1, img: '/Seblak.jpeg', label: 'Seblak', correct: false, pos: '-top-4 -left-4', rot: [-3, 3, -3] },
                            { id: 2, img: '/Rujak.jpeg', label: 'Rujak', correct: false, pos: '-top-4 -right-4', rot: [3, -3, 3] },
                            { id: 3, img: 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=150&q=80', label: 'Nanas', correct: false, pos: '-bottom-4 -left-4', rot: [-3, 3, -3] },
                            { id: 4, img: '/Matcha.jpg', label: 'Matcha', correct: true, pos: '-bottom-4 -right-4', rot: [3, -3, 3] },
                        ].map((item) => (
                            <motion.button key={item.id} initial={{ scale: 0 }} animate={{ scale: 1, rotate: item.rot as any }} transition={{ duration: 0.5, rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" } }} whileHover={{ scale: 1.2 }} onClick={() => handleFoodClick(item.correct)} className={`absolute ${item.pos} pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20`}>
                                <img src={item.img} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt={item.label} />
                                <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">{item.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}
             {surpriseStep === 5 && (
                <motion.div key="step5" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="bg-green-100 p-4 rounded-full mb-6"><CheckCircle size={64} className="text-green-500" /></div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Yeyyy! Akhirnya sayangkuu manuttttt! 🎉</h2>
                    <p className="text-gray-500 mb-8">Kamu emang kesayangan aku yang paling manisss!</p>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setSurpriseStep(6)} className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2 text-lg">Lanjut sayang ❤️ <ArrowRight size={20}/></motion.button>
                </motion.div>
            )}
            {surpriseStep === 6 && (
                <motion.div key="step6" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity:0, y:-100 }} className="flex flex-col items-center justify-center h-full text-center p-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-pink-600 mb-2 font-valentine">Cubit Pipi Karet! 🤏</h2>
                    <p className="text-gray-500 mb-8 text-sm max-w-xs mx-auto">Tarik bagian <b>Pipi Kanan</b> buat nyubit!</p>
                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
                        <motion.div style={{ x, y, scaleX, rotate, transformOrigin: "20% 50%" }} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} dragElastic={0.15} whileTap={{ cursor: "grabbing" }} onPointerDown={handlePinchStart} className="w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing relative z-10 bg-pink-200 touch-none">
                            <img src="/FotoCubit.jpeg" alt="Foto Cubit" className="w-full h-full object-cover pointer-events-none" />
                            <motion.div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 active:opacity-100 transition-opacity"><span className="bg-white text-pink-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg whitespace-nowrap">Melarrr! 🤣</span></motion.div>
                        </motion.div>
                        <motion.div animate={{ x: [5, 20, 5], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute top-1/2 right-0 md:right-4 transform -translate-y-1/2 text-pink-400 pointer-events-none"><Hand size={32} className="rotate-90"/></motion.div>
                    </div>
                    <div className="bg-white/50 px-4 py-2 rounded-lg border border-pink-100 mb-6"><span className="text-pink-500 font-bold">{pinchCount}</span> <span className="text-gray-500 text-sm">kali ditarik 🤕</span></div>
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={() => setSurpriseStep(7)} className="bg-white border-2 border-pink-200 text-pink-500 hover:bg-pink-50 px-6 py-2 rounded-full font-bold flex items-center gap-2">Masih ada lagi nih 👇</motion.button>
                </motion.div>
            )}
             {surpriseStep === 7 && (
                 <motion.div key="step7" className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto">
                    {step7Sub === 0 ? (
                        <motion.div key="text1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 className="text-2xl md:text-3xl font-bold text-pink-600 mb-6">Ga sakit kan cubitnya??? 🥺</h2>
                            <button onClick={() => setStep7Sub(1)} className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold shadow-lg">Engga kok</button>
                        </motion.div>
                    ) : (
                        <motion.div key="text2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <h2 className="text-2xl md:text-4xl font-valentine text-pink-600 mb-6">Jadi percaya dong kalo ketemu ku cubit? 😏</h2>
                            <div className="text-6xl mb-8">🤭</div>
                            <button onClick={() => setSurpriseStep(8)} className="bg-white border-2 border-pink-500 text-pink-500 px-6 py-2 rounded-full font-bold">Iya dehhh</button>
                        </motion.div>
                    )}
                 </motion.div>
            )}
            {surpriseStep === 8 && (
                <motion.div key="step8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full w-full relative">
                     <h3 className="text-xl font-bold text-gray-700 mb-10 text-center px-4 bg-white/80 p-2 rounded-xl backdrop-blur-sm z-20">Si manis ini sering ngomong apa ya? (Klik semua)</h3>
                     <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] flex items-center justify-center">
                        <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10">
                            <img src="/Simanis.jpeg" alt="Ayang" className="w-full h-full object-cover" />
                        </div>
                        {[
                            {id:1, txt: "Kamu ga bosen sama aku? 🥺", pos: "top-0 left-1/2 -translate-x-1/2"},
                            {id:2, txt: "Kamu sayang aku ga? 👉👈", pos: "right-0 top-1/2 -translate-y-1/2 translate-x-4"},
                            {id:3, txt: "Kamu ga kangen sama aku? ☹️", pos: "bottom-0 left-1/2 -translate-x-1/2"},
                            {id:4, txt: "Pretttt 🤪", pos: "left-0 top-1/2 -translate-y-1/2 -translate-x-4"}
                        ].map(c => (
                            <motion.button key={c.id} onClick={() => !step8Choices.includes(c.id) && setStep8Choices([...step8Choices, c.id])} className={`absolute ${c.pos} px-4 py-3 rounded-2xl shadow-lg border-2 text-xs md:text-sm font-bold transition-all z-20 w-32 md:w-40 text-center ${step8Choices.includes(c.id) ? 'bg-green-500 text-white border-green-600' : 'bg-white text-pink-600 border-pink-200'}`}>
                                {step8Choices.includes(c.id) && <CheckCircle size={12} className="inline mr-1"/>}{c.txt}
                            </motion.button>
                        ))}
                     </div>
                     {step8Choices.length === 4 && (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setSurpriseStep(9)} className="absolute bottom-10 bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-xl hover:bg-pink-600 z-30 flex items-center gap-2">Bener semua wkwk <ArrowRight size={18}/></motion.button>
                     )}
                </motion.div>
            )}
             {surpriseStep === 9 && (
                <motion.div key="step9" initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center justify-center h-full p-6 w-full max-w-md mx-auto text-center">
                    <h2 className="text-xl font-bold text-gray-700 mb-2">Tarik slider ini biar percaya!</h2>
                    <div className="w-full space-y-6">
                        {[{l:'Sayang', v:'val1'}, {l:'Kangen', v:'val2'}, {l:'Nyaman', v:'val3'}].map((s, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-pink-100">
                                <div className="flex justify-between mb-2"><label className="text-xs font-bold text-pink-500">{s.l}</label><span className="text-xs font-black text-pink-600">{(step9Ranges as any)[s.v]}%</span></div>
                                <input type="range" min="0" max="1000" value={(step9Ranges as any)[s.v]} onChange={(e) => setStep9Ranges({...step9Ranges, [s.v]: parseInt(e.target.value)})} className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500" />
                            </div>
                        ))}
                    </div>
                    {step9Ranges.val1 === 1000 && step9Ranges.val2 === 1000 && step9Ranges.val3 === 1000 && (
                        <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={() => setSurpriseStep(10)} className="mt-8 bg-pink-600 text-white px-8 py-3 rounded-full font-bold shadow-lg animate-bounce">Full 1000% Sayang! Lanjut! ❤️</motion.button>
                    )}
                </motion.div>
            )}
             {surpriseStep === 10 && (
                <motion.div key="step10" className="flex flex-col items-center justify-center h-full w-full relative overflow-hidden">
                    <div className="text-center z-20 pointer-events-none mb-20 px-4"><h2 className="text-xl md:text-2xl font-bold text-pink-600 mb-2">Bantuin semprot nyamuk asrama! 🦟</h2></div>
                    <div className="absolute inset-0 z-10">
                        <AnimatePresence>
                            {step10Mosquitos.map((id) => (
                                <motion.button key={id} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1, x: [0, Math.random() * 300 - 150], y: [0, Math.random() * 400 - 200] }} exit={{ scale: 0, opacity: 0, transition: { duration: 0.2 } }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} onClick={(e) => { e.stopPropagation(); setStep10Mosquitos(prev => prev.filter(m => m !== id)); }} className="absolute top-1/2 left-1/2 w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-2xl border border-gray-200 cursor-crosshair active:bg-red-200">🦟</motion.button>
                            ))}
                        </AnimatePresence>
                    </div>
                    {step10Mosquitos.length === 0 && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="z-30 text-center"><h3 className="text-2xl font-bold text-green-600 mb-4">Bersih! ✨</h3><button onClick={() => setSurpriseStep(11)} className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg">Lanjut</button></motion.div>
                    )}
                </motion.div>
            )}
            {surpriseStep === 11 && (
                <motion.div key="step11" className="flex flex-col items-center justify-center h-full p-6 text-center w-full max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-pink-600 mb-4">Si manis ini kayaknya lagi ketagihan ini nih 🎵</h2>
                    <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl mb-6 border-4 border-white">
                        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/fdJrSjMgPFE" title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                    <button onClick={() => { if (wasPlayingRef.current && audioRef.current) { audioRef.current.play(); setIsPlayingAudio(true); } setSurpriseStep(12); }} className="bg-pink-500 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2">Lanjut yok manis <ArrowRight size={18}/></button>
                </motion.div>
            )}
            {surpriseStep === 12 && (
                <motion.div key="step12" className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto">
                    <AnimatePresence mode="wait">
                        {step12Sub === 0 && <Typewriter text="Gimana sayang? Seru enggak? 😁" onComplete={() => setStep12Sub(1)} className="text-2xl font-bold text-gray-700" />}
                        {step12Sub === 1 && <Typewriter text="Maaf ya kalo kurang seru.. 😢" onComplete={() => setStep12Sub(2)} className="text-2xl font-bold text-gray-500" />}
                        {step12Sub === 2 && <Typewriter text="Tapi kalo kamu emang merasa seru dan terhibur, terima kasih ya sayang! 🥰" onComplete={() => setStep12Sub(3)} className="text-2xl font-bold text-pink-600" />}
                        {step12Sub === 3 && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                                <h2 className="text-3xl font-valentine text-pink-600 mb-8">Peluk dulu dong, kangen nih! 🤗</h2>
                                <button onMouseDown={() => setIsStep12Holding(true)} onMouseUp={() => setIsStep12Holding(false)} onTouchStart={() => setIsStep12Holding(true)} onTouchEnd={() => setIsStep12Holding(false)} className="relative w-40 h-40 rounded-full bg-gray-100 border-4 border-pink-200 flex items-center justify-center overflow-hidden shadow-inner active:scale-95 transition-transform">
                                    <div className="absolute bottom-0 left-0 right-0 bg-pink-400 transition-all duration-75 ease-linear" style={{ height: `${step12Hug}%` }}></div>
                                    <Heart size={64} className={`relative z-10 transition-colors ${step12Hug > 50 ? 'text-white' : 'text-pink-300'}`} fill={step12Hug > 50 ? "white" : "none"}/>
                                </button>
                                <p className="mt-4 text-sm text-gray-400 font-bold">{step12Hug}% Pelukan</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
            {surpriseStep === 13 && (
                <motion.div key="step13" className="flex flex-col items-center justify-center h-full p-6 text-center max-w-md mx-auto relative">
                     <div className="absolute inset-0 pointer-events-none">
                        <motion.div animate={{ opacity: [0, 1, 0], y: -50 }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-1/4 left-10 text-2xl">❤️</motion.div>
                        <motion.div animate={{ opacity: [0, 1, 0], y: -50 }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="absolute top-1/3 right-10 text-2xl">💖</motion.div>
                    </div>
                    <AnimatePresence mode="wait">
                        {step13Sub === 0 && <motion.h2 key="t1" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-2xl font-bold text-pink-600">Sayang, makasih pelukannya! 🤗</motion.h2>}
                        {step13Sub === 1 && <motion.h2 key="t2" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-2xl font-bold text-gray-700">Terima kasih juga atas semuanya...</motion.h2>}
                        {step13Sub === 2 && <motion.h2 key="t3" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xl font-bold text-gray-600">Terima kasih kamu sudah bertahan dan berusaha loyal kepadaku.. ❤️</motion.h2>}
                        {step13Sub === 3 && <motion.h2 key="t4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xl font-bold text-gray-600">Terima kasih kamu sudah bersabar menghadapi overthinkingku.. 🧠</motion.h2>}
                        {step13Sub === 4 && <motion.h2 key="t5" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xl font-bold text-gray-600">Terima kasih kamu udah mau berubah walaupun berat, demi menghormati perasaanku. 🥺</motion.h2>}
                        {step13Sub === 5 && <motion.div key="t6" initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} exit={{opacity:0}}><h2 className="text-3xl font-valentine font-bold text-pink-600 mb-4">Thank you a lot, my darling Rere 💝</h2></motion.div>}
                        {step13Sub === 6 && (
                            <motion.div key="t7" initial={{opacity:0}} animate={{opacity:1}} className="flex flex-col items-center">
                                <h1 className="text-4xl md:text-5xl font-valentine font-bold text-red-500 mb-8 drop-shadow-md">I Love You Forever! 💍</h1>
                                <button onClick={handleResetSurprise} className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors text-sm border-b border-transparent hover:border-pink-500 pb-1"><RotateCcw size={14}/> Ulangi Scene Ini</button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    {step13Sub < 6 && (
                        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={() => setStep13Sub(prev => prev + 1)} className="mt-12 bg-white/50 hover:bg-white p-3 rounded-full shadow-sm text-pink-400 hover:text-pink-600 transition-all"><ChevronRight size={24}/></motion.button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );

  const renderCalendar = () => (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden animate-in fade-in">
        <div className="w-full md:w-1/3 bg-pink-50 md:border-r border-pink-100 p-2 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 no-scrollbar">
             {[
               { id: 'relationship', icon: Clock, label: 'Timer' }, { id: 'birthdays', icon: Gift, label: 'Ultah' }, 
               { id: 'events', icon: List, label: 'Events' }, { id: 'countdown', icon: Hourglass, label: 'Countdown' },
               { id: 'realCalendar', icon: CalendarCheck, label: 'Kalender Kita' }
             ].map(item => (
               <button key={item.id} onClick={() => setCalendarTab(item.id)} 
                 className={`p-3 rounded-xl text-left flex items-center gap-3 transition-all flex-1 md:flex-none justify-center md:justify-start whitespace-nowrap ${calendarTab===item.id ? 'bg-white text-pink-600 shadow-sm ring-1 ring-pink-200' : 'text-gray-500 hover:bg-white/50'}`}>
                 <item.icon size={18}/> <span className="text-xs font-bold">{item.label}</span>
               </button>
             ))}
        </div>
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-start md:justify-center overflow-y-auto w-full relative">
            {calendarTab === 'relationship' && ( <div className="w-full text-center mt-4 md:mt-0"> <h3 className="text-lg font-bold text-pink-500 mb-4">Kita sudah bersama:</h3> <RelationshipTimer /> </div> )}
            {calendarTab === 'birthdays' && <BirthdayView />}
            {calendarTab === 'events' && (
                <div className="w-full max-w-md flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                        {loadingEvents ? <p className="text-gray-400 text-center text-xs">Loading...</p> : events.map(ev => (
                            <div key={ev.id} className="flex justify-between items-center bg-white p-3 rounded-xl border-l-4 border-pink-500 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="text-center min-w-[30px]"><span className="block text-lg font-bold text-gray-800 leading-none">{new Date(ev.date).getDate()}</span><span className="block text-[10px] text-pink-500 font-bold uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span></div>
                                  <div><p className="font-bold text-sm text-gray-700 line-clamp-1">{ev.title}</p></div>
                                </div>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 shrink-0">
                        <div className="flex gap-2 mb-2"><input className="flex-1 p-2 rounded-lg text-sm border focus:outline-pink-500" placeholder="Acara..." value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title: e.target.value})}/><input type="date" className="w-28 p-2 rounded-lg text-sm border focus:outline-pink-500" value={newEvent.date} onChange={e=>setNewEvent({...newEvent, date: e.target.value})}/></div>
                        <button onClick={handleAddEvent} className="w-full bg-pink-500 text-white py-2 rounded-lg text-sm font-bold shadow-md">Simpan</button>
                    </div>
                </div>
            )}
            {calendarTab === 'countdown' && (
                <div className="w-full max-w-sm flex flex-col items-center mt-4 md:mt-0">
                    <select className="w-full p-3 mb-6 border rounded-xl bg-white text-sm" onChange={e=>setSelectedCountdownId(e.target.value)} value={selectedCountdownId}><option value="">-- Pilih Acara --</option>{events.filter(e=>new Date(e.date)>new Date()).map(e=><option key={e.id} value={e.id}>{e.title}</option>)}</select>
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
                        <div className="absolute inset-0 transition-all duration-500" style={{ backgroundImage: `url(${MONTH_IMAGES[currentCalDate.getMonth()] || '/AyangkuManis.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                        <div className="absolute inset-0 bg-pink-500/40 mix-blend-hard-light backdrop-blur-[2px]"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-pink-900/60 to-transparent"></div>
                    </div>
                    <div className="relative z-10 flex flex-col h-full p-4 text-white">
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => changeMonth(-1)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm"><ChevronLeft size={20}/></button>
                            <div className="text-center"><h3 className="text-3xl font-black font-valentine drop-shadow-md tracking-wider">{currentCalDate.toLocaleString('default', { month: 'long' })}</h3><p className="text-sm font-bold opacity-80">{currentCalDate.getFullYear()}</p></div>
                            <button onClick={() => changeMonth(1)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 backdrop-blur-sm"><ChevronRight size={20}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">{['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => <span key={i} className="text-xs font-bold text-pink-100">{d}</span>)}</div>
                        <div className="grid grid-cols-7 gap-2 flex-1 content-start">{generateCalendarDays(currentCalDate).map((day, idx) => (<div key={idx} className="aspect-square flex items-center justify-center">{day && (<div className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full text-lg md:text-xl transition-all font-valentine ${(day === new Date().getDate() && currentCalDate.getMonth() === new Date().getMonth() && currentCalDate.getFullYear() === new Date().getFullYear()) ? 'bg-pink-500 text-white shadow-lg scale-110 border-2 border-white' : 'bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm shadow-sm'}`}>{day}</div>)}</div>))}</div>
                    </div>
                </div>
            )}
        </div>
    </div>
  );

  const renderGameContent = () => {
    if (selectedGame === "flappy") return <FlappyBirdGame onBack={() => setSelectedGame(null)} />;
    if (selectedGame === "tictactoe") return <TicTacToeGame onBack={() => setSelectedGame(null)} />;
    if (selectedGame === "chess") return <ChessGame onBack={() => setSelectedGame(null)} />;
    return (
        <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in p-6">
            <h2 className="text-2xl font-bold text-pink-600 mb-6 flex items-center gap-2"><Gamepad2/> Pilih Game</h2>
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <button onClick={() => setSelectedGame("flappy")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group"><div className="bg-cyan-100 p-4 rounded-full group-hover:bg-cyan-200 transition"><Bird size={32} className="text-cyan-600" /></div><span className="font-bold text-gray-700 text-sm">Flappy Rere</span></button>
                <button onClick={() => setSelectedGame("tictactoe")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group"><div className="bg-purple-100 p-4 rounded-full group-hover:bg-purple-200 transition"><div className="text-purple-600"><CircleDot size={32}/></div></div><span className="font-bold text-gray-700 text-sm">Tic-Tac-Jidat</span></button>
                <button onClick={() => setSelectedGame("ayangio")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group"><div className="bg-rose-100 p-4 rounded-full group-hover:bg-rose-200 transition"><CircleDot size={32} className="text-rose-600" /></div><span className="font-bold text-gray-700 text-sm">Ayang.io</span></button>
                <button onClick={() => setSelectedGame("chess")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group"><div className="bg-slate-100 p-4 rounded-full group-hover:bg-slate-200 transition"><div className="text-slate-600"><AlertOctagon size={32}/></div></div><span className="font-bold text-gray-700 text-sm">Catur Ayang</span></button>
                 <button onClick={() => setSelectedGame("rhythm")} className="bg-white p-4 rounded-2xl shadow-lg border border-pink-100 hover:shadow-pink-200 hover:scale-105 transition flex flex-col items-center gap-3 group"><div className="bg-pink-100 p-4 rounded-full group-hover:bg-pink-200 transition"><Mic2 size={32} className="text-pink-600" /></div><span className="font-bold text-gray-700 text-sm">Kiss Rhythm</span></button>
            </div>
        </div>
    );
  };

  // --- 3. RENDER MUSIC PLAYER TAB (UPDATED: DYNAMIC BACKGROUND FOR BAR, PLAYER & PLAYLIST) ---
  const renderMusicTab = () => {
    // 1. Ambil warna aktif dari kategori terpilih
    const activeCategory = categories.find(c => String(c.id) === String(selectedCategoryId)) || categories[0];
    const activeColor = activeCategory?.color || '#ffffff';
    const isHex = isHexColor(activeColor);

    // Style untuk background container utama (Menu Bar)
    const containerStyle = isHex ? { backgroundColor: activeColor } : {};
    const containerClass = isHex ? "" : activeColor; // Untuk tailwind class lama

    return (
        <div className="h-full w-full flex flex-col bg-gray-50/50 backdrop-blur-sm animate-in fade-in">
             {/* CATEGORY BAR: Background berubah sesuai kategori */}
             <div 
                className={`w-full border-b border-pink-100 p-3 overflow-x-auto no-scrollbar shadow-sm sticky top-0 z-20 transition-colors duration-500 ${containerClass}`}
                style={containerStyle}
             >
                <div className="flex gap-2 items-center">
                  <div className="flex gap-2">
                    {categories.map(cat => {
                        const Icon = MOOD_ICONS.find(m => m.id === cat.icon)?.icon || Star;
                        const isSelected = String(selectedCategoryId) === String(cat.id);
                        
                        return (
                            <button 
                                key={cat.id} 
                                onClick={() => setSelectedCategoryId(cat.id)} 
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border 
                                    ${isSelected 
                                        ? 'bg-white/90 text-gray-800 shadow-lg scale-105 font-bold border-white' // Tombol Aktif jadi Putih/Kontras
                                        : 'bg-white/40 text-gray-700 hover:bg-white/60 border-transparent' // Tombol Tidak Aktif jadi transparan
                                    }
                                `}
                            >
                                <Icon size={14} fill={isSelected ? "currentColor" : "none"}/>
                                <span className="text-xs whitespace-nowrap">{cat.name}</span>
                                
                                {/* TOMBOL HAPUS KATEGORI (Hanya jika aktif & bukan default) */}
                                {isSelected && cat.id !== 'all' && (
                                    <div 
                                        onClick={(e) => { e.stopPropagation(); initiateDeleteCategory(cat.id, cat.name); }}
                                        className="ml-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors cursor-pointer"
                                        title="Hapus Kategori"
                                    >
                                        <Trash2 size={10} />
                                    </div>
                                )}
                            </button>
                        )
                    })}
                  </div>
                  <div className="h-6 w-[1px] bg-black/10 mx-1"></div>
                  <button onClick={() => setShowAddCategory(true)} className="p-1.5 rounded-full bg-white/50 text-gray-600 hover:bg-white hover:text-pink-500 transition shadow-sm"><Plus size={16}/></button>
                </div>
             </div>

             {/* MAIN CONTENT: SPLIT VIEW */}
             <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                 
                 {/* LEFT PANEL: PLAYER */}
                 {/* Background Player juga berubah tapi lebih transparan (tint) */}
                 <div 
                    className="w-full md:w-[350px] shrink-0 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/50 p-4 flex flex-col items-center justify-center relative shadow-sm z-10 transition-colors duration-500"
                    style={{ backgroundColor: isHex ? `${activeColor}20` : '' }} // 20 = hex opacity ~12%
                 >
                      {/* Fallback Tailwind Class kalau bukan hex */}
                      {!isHex && <div className={`absolute inset-0 opacity-10 ${activeColor}`}></div>}

                      <div className="relative w-32 h-32 md:w-64 md:h-64 mb-4 md:mb-8 transition-all duration-500 z-10">
                            {/* GLOW EFFECT MENGIKUTI WARNA */}
                            <div 
                                className={`absolute inset-0 rounded-full blur-3xl opacity-30 scale-110 ${isPlayingAudio ? 'animate-pulse' : ''}`}
                                style={{ backgroundColor: isHex ? activeColor : 'pink' }}
                            ></div>
                            
                            {/* VINYL */}
                            <motion.div 
                                className="w-full h-full rounded-full bg-black shadow-2xl border-[6px] md:border-[10px] border-gray-900 flex items-center justify-center relative overflow-hidden"
                                animate={{ rotate: isPlayingAudio ? 360 : 0 }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            >
                                <div className="absolute inset-0 rounded-full border-[1px] border-white/10"></div>
                                <div className="absolute inset-0 rounded-full border-[20px] md:border-[40px] border-white/5"></div>
                                <img 
                                    src={playlist[currentSongIndex]?.cover_url || "/Desember.jpeg"} 
                                    alt="Album Cover" 
                                    className="w-16 h-16 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-800" 
                                    onError={(e) => { e.currentTarget.src = "/Desember.jpeg"; }}
                                />
                            </motion.div>
                      </div>

                      {/* SONG INFO */}
                      <div className="text-center w-full mb-4 z-10">
                          <h3 className="font-bold text-gray-800 text-lg md:text-xl line-clamp-1">{playlist[currentSongIndex]?.title || "Pilih Lagu"}</h3>
                          <p 
                            className="text-xs font-bold uppercase tracking-widest mt-1"
                            style={{ color: isHex ? activeColor : '#EC4899' }}
                          >
                            {categories.find(c => String(c.id) === String(selectedCategoryId))?.name || "Playlist Kita"}
                          </p>
                      </div>

                      {/* CONTROLS */}
                      <div className="flex items-center gap-6 z-10">
                          <button onClick={prevSong} className="text-gray-400 hover:text-gray-600 transition active:scale-95"><SkipBack size={28} /></button>
                          
                          {/* FIX: Tombol Play diberi warna Pink jika kategori 'Semua' (biar icon putih kelihatan) */}
                          <button 
                            onClick={toggleAudio} 
                            className="w-14 h-14 md:w-16 md:h-16 rounded-full text-white shadow-lg flex items-center justify-center transition active:scale-90"
                            style={{ 
                                backgroundColor: selectedCategoryId === 'all' 
                                    ? '#EC4899' // Paksa Pink jika 'Semua' 
                                    : (isHex ? activeColor : '#EC4899') 
                            }} 
                          >
                                {isPlayingAudio ? <Pause size={24} fill="white"/> : <PlayIcon size={24} fill="white" className="ml-1"/>}
                          </button>

                          <button onClick={nextSong} className="text-gray-400 hover:text-gray-600 transition active:scale-95"><SkipForward size={28}/></button>
                      </div>
                 </div>

                 {/* RIGHT PANEL: PLAYLIST - MODIFIED TO CHANGE COLOR TOO */}
                 <div 
                    className="flex-1 backdrop-blur-md overflow-y-auto relative transition-colors duration-500"
                    style={{ backgroundColor: isHex ? `${activeColor}10` : 'rgba(255,255,255,0.4)' }} // Menggunakan Opacity 10 (sekitar 6%) agar tetap terbaca tapi berwarna
                 >
                      <div 
                        className="sticky top-0 backdrop-blur-md p-3 border-b border-gray-100/50 flex justify-between items-center z-10 transition-colors duration-500"
                        style={{ backgroundColor: isHex ? `${activeColor}30` : 'rgba(255,255,255,0.8)' }} // Header lebih pekat sedikit
                      >
                          <div className="flex items-center gap-2 text-gray-700 font-bold text-xs uppercase tracking-wider">
                             <List size={14}/> Daftar Lagu
                          </div>
                          
                          {/* FIX: Disable tombol Tambah jika di kategori 'Semua' */}
                          {selectedCategoryId !== 'all' && (
                             <button onClick={() => setShowAddSong(true)} className="text-xs bg-white/50 text-gray-700 font-bold px-3 py-1.5 rounded-full hover:bg-white hover:text-pink-500 transition flex items-center gap-1 shadow-sm"><Plus size={12}/> Tambah</button>
                          )}
                      </div>

                      <div className="p-2 space-y-2 pb-20">
                         {getFilteredPlaylist().length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <Music size={32} className="mb-2 opacity-30"/>
                                <p className="text-xs">Kosong nih, tambahin dong!</p>
                            </div>
                        ) : (
                            getFilteredPlaylist().map((song, idx) => {
                                const isCurrent = playlist[currentSongIndex]?.id === song.id;
                                // Cari nama kategori untuk lagu ini (utk display di tab Semua)
                                const songCategory = categories.find(c => String(c.id) === String(song.categoryId));

                                return (
                                    <div key={song.id} className={`group flex items-center justify-between p-3 rounded-xl transition-all border ${isCurrent ? 'bg-white border-gray-200 shadow-md' : 'bg-white/40 border-transparent hover:bg-white hover:shadow-sm'}`}>
                                        
                                        {/* Klik Area untuk Play */}
                                        <div className="flex items-center gap-3 flex-1 cursor-pointer min-w-0" onClick={() => { 
                                            const mainIdx = playlist.findIndex(s => s.id === song.id);
                                            setCurrentSongIndex(mainIdx); setIsPlayingAudio(true); 
                                        }}>
                                            <div 
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${isCurrent ? 'ring-2' : 'bg-gray-100'}`}
                                                // GUNAKAN --tw-ring-color DAN CASTING TYPE
                                                style={isCurrent && isHex ? { '--tw-ring-color': activeColor } as React.CSSProperties : {}} 
                                            >
                                                {song.cover_url ? (
                                                    <img src={song.cover_url} alt="art" className="w-full h-full object-cover" />
                                                ) : (
                                                    isCurrent && isPlayingAudio ? <Music size={16} style={{ color: isHex ? activeColor : '#EC4899' }} className="animate-bounce"/> : <Disc size={16} className="text-gray-400"/>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className={`text-sm font-bold truncate ${isCurrent ? 'text-gray-900' : 'text-gray-700'}`}>{song.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-gray-400">Audio • Mp3</p>
                                                    {/* FIX: Tampilkan Label Kategori jika sedang di tab 'Semua' */}
                                                    {selectedCategoryId === 'all' && songCategory && (
                                                        <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 truncate max-w-[80px]">
                                                            {songCategory.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {isCurrent && <div className="p-1.5 bg-green-100 text-green-600 rounded-full mr-2"><Volume2 size={12}/></div>}
                                        </div>

                                        {/* Tombol Hapus */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSong(song.id); }}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Hapus Lagu"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                )
                            })
                        )}
                      </div>
                 </div>
             </div>

             {/* MODALS (Add Category & Add Song & Delete Confirmation) */}
             <AnimatePresence>
                {/* 1. Modal Hapus Kategori */}
                {deleteModal.isOpen && (
                    <div className="absolute inset-0 z-[60] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.9, opacity: 0 }} 
                            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center"
                        >
                            <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${deleteModal.songCount > 0 ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600'}`}>
                                <AlertTriangle size={32} />
                            </div>
                            
                            <h3 className="font-bold text-gray-800 text-lg mb-2">Hapus Mood?</h3>
                            
                            <p className="text-sm text-gray-500 mb-6">
                                {deleteModal.songCount > 0 ? (
                                    <>
                                        Waduh! Kategori <b>&quot;{deleteModal.categoryName}&quot;</b> ini berisi <span className="font-bold text-red-500">{deleteModal.songCount} lagu</span>. Semuanya bakal ikut kehapus lho! 😱
                                    </>
                                ) : (
                                    <>
                                        Yakin mau hapus kategori <b>&quot;{deleteModal.categoryName}&quot;</b>?
                                    </>
                                )}
                            </p>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setDeleteModal({ isOpen: false, categoryId: null, categoryName: "", songCount: 0 })} 
                                    className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 hover:bg-gray-200 rounded-xl text-sm transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={executeDeleteCategory} 
                                    className={`flex-1 py-3 text-white font-bold rounded-xl text-sm shadow-md transition-transform active:scale-95 ${deleteModal.songCount > 0 ? 'bg-red-500 hover:bg-red-600' : 'bg-pink-500 hover:bg-pink-600'}`}
                                >
                                    {deleteModal.songCount > 0 ? 'Hapus Semua' : 'Ya, Hapus'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* 2. Modal Tambah Kategori */}
                {showAddCategory && (
                    <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl">
                            <h3 className="font-bold text-gray-800 mb-3">Mood Baru</h3>
                            <input className="w-full p-3 bg-gray-50 rounded-xl mb-3 text-sm border focus:border-pink-300 outline-none" placeholder="Nama Mood... (Contoh: Galau 😭)" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} />
                            
                            {/* COLOR PICKER & ICONS */}
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 mb-2 block">Pilih Warna & Ikon:</label>
                                <div className="flex items-center gap-4 mb-4 bg-gray-50 p-3 rounded-xl">
                                    {/* COLOR PICKER LINGKARAN */}
                                    <div className="relative shrink-0 group">
                                         <input 
                                            type="color" 
                                            value={newCategory.color} 
                                            onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                                            className="w-10 h-10 rounded-full overflow-hidden cursor-pointer border-none p-0 bg-transparent"
                                            title="Pilih Warna"
                                         />
                                         <div className="absolute inset-0 rounded-full ring-2 ring-gray-200 pointer-events-none group-hover:ring-pink-300 transition-all"></div>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Geser warna di lingkaran <br/> sesuai mood kamu!
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2">
                                    {MOOD_ICONS.map((m) => (
                                        <button key={m.id} onClick={() => setNewCategory({...newCategory, icon: m.id})} className={`p-2 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${newCategory.icon === m.id ? 'bg-pink-50 border-pink-500 text-pink-600 shadow-sm' : 'border-gray-100 text-gray-400 hover:bg-gray-50'}`}>
                                            <m.icon size={20}/>
                                            <span className="text-[10px] font-medium">{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2"><button onClick={() => setShowAddCategory(false)} className="flex-1 py-2 text-gray-500 font-bold bg-gray-100 rounded-xl text-sm">Batal</button><button onClick={handleAddCategory} className="flex-1 py-2 text-white font-bold bg-pink-500 rounded-xl text-sm">Simpan</button></div>
                        </motion.div>
                    </div>
                )}
                
                {/* 3. Modal Tambah Lagu */}
                {showAddSong && (
                    <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.9, opacity:0}} className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl overflow-y-auto max-h-[90vh]">
                             <h3 className="font-bold text-gray-800 mb-3">Tambah Lagu</h3>
                             <div className="space-y-3">
                                {/* Judul */}
                                <input type="text" placeholder="Judul Lagu" value={newSongTitle} onChange={e=>setNewSongTitle(e.target.value)} className="w-full p-3 text-sm bg-gray-50 rounded-xl border focus:border-pink-300 outline-none"/>
                                
                                {/* Kategori */}
                                <select value={newSongCategory} onChange={(e) => setNewSongCategory(e.target.value)} className="w-full p-3 text-sm bg-gray-50 rounded-xl border focus:border-pink-300 outline-none text-gray-600">
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                
                                {/* File Audio */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 ml-1">File MP3 (Wajib)</label>
                                    <label className="block w-full p-3 bg-pink-50 border border-dashed border-pink-300 rounded-xl text-center text-xs font-bold text-pink-500 cursor-pointer hover:bg-pink-100 transition truncate">
                                        {newSongFile ? newSongFile.name : "Pilih Audio MP3"}
                                        <input type="file" accept="audio/*" onChange={e => setNewSongFile(e.target.files?.[0] || null)} className="hidden"/>
                                    </label>
                                </div>

                                {/* File Gambar (Cover) */}
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 ml-1">Cover Gambar (Opsional)</label>
                                    <label className="block w-full p-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl text-center text-xs font-bold text-gray-500 cursor-pointer hover:bg-gray-100 transition truncate">
                                        {newSongImage ? newSongImage.name : "Pilih Gambar (JPG/PNG)"}
                                        <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={e => setNewSongImage(e.target.files?.[0] || null)} className="hidden"/>
                                    </label>
                                </div>
                             </div>
                             
                             <div className="flex gap-2 mt-6">
                                <button onClick={() => setShowAddSong(false)} className="flex-1 py-2 text-gray-500 font-bold bg-gray-100 rounded-xl text-sm">Batal</button>
                                <button onClick={handleAddSong} disabled={isUploadingSong} className="flex-1 py-2 text-white font-bold bg-pink-500 rounded-xl text-sm flex justify-center items-center gap-2">
                                    {isUploadingSong ? <Loader2 size={14} className="animate-spin"/> : "Upload"}
                                </button>
                             </div>
                        </motion.div>
                    </div>
                )}
             </AnimatePresence>
        </div>
    );
  };


  // --- 4. RETURN UTAMA ---
  if (selectedGame === 'ayangio' || selectedGame === 'rhythm') {
      return (
        <div className="fixed inset-0 z-[9999] bg-white overflow-hidden flex flex-col justify-center items-center">
            <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none md:hidden opacity-70"><div className="bg-black/50 text-white px-4 py-1 rounded-full text-xs flex items-center gap-2"><Smartphone size={14} className="animate-pulse"/> Mode Landscape Lebih Seru!</div></div>
            {selectedGame === 'ayangio' && <AyangIoGame onBack={() => setSelectedGame(null)} />}
            {selectedGame === 'rhythm' && <RhythmKissGame onBack={() => setSelectedGame(null)} />}
        </div>
      );
  }

  return (
    <main className="fixed inset-0 bg-gradient-to-br from-pink-400 to-red-300 font-sans text-slate-800 overflow-hidden" onClick={handleFirstInteraction}>
      {activeTab === 'home' && !selectedGame && <BackgroundHearts />}
      <AnimatePresence>{wrongGuessAlert && (<motion.div initial={{ opacity: 0, scale: 0.5, y: -100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed top-10 left-0 right-0 z-[100] flex justify-center pointer-events-none"><motion.div animate={{ x: [-5, 5, -5, 5, 0] }} transition={{ duration: 0.3 }} className="bg-red-500 text-white px-8 py-4 rounded-full shadow-2xl border-4 border-white flex items-center gap-3"><AlertOctagon size={32} /><span className="text-2xl font-black uppercase tracking-widest">GABOLEH!!! 😡</span></motion.div></motion.div>)}</AnimatePresence>

      <div className="w-full h-full flex flex-col items-center justify-start pt-4 pb-24 md:pb-4 md:justify-center px-4">
        
        <div className="md:hidden absolute top-4 left-6 z-10 flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full"><Heart size={16} fill="white" className="text-white"/></div>
            <span className="font-bold text-white text-lg tracking-wide font-valentine">Rere Sayang</span>
        </div>

        <div className="w-full max-w-5xl h-[80vh] md:h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex flex-col relative mt-12 md:mt-0">
           {/* TOP NAV (DESKTOP) */}
           <div className="hidden md:flex justify-between items-center p-6 border-b border-pink-50">
               <div className="flex items-center gap-2"><div className="bg-pink-500 p-2 rounded-full text-white"><Heart size={20} fill="white" /></div><span className="font-bold text-pink-600 text-xl">Rere Sayang</span></div>
               <div className="flex gap-6">
                   {[{id: 'home', label: 'Home'}, {id: 'game', label: 'Game'}, {id: 'calendar', label: 'Calendar'}, {id: 'music', label: 'Music'}, {id: 'notes', label: 'Notes'}].map(link => (
                       <button key={link.id} onClick={()=>setActiveTab(link.id)} className={`text-sm font-bold transition-colors ${activeTab===link.id ? 'text-pink-600 bg-pink-50 px-3 py-1 rounded-full' : 'text-gray-400 hover:text-pink-500'}`}>{link.label}</button>
                   ))}
               </div>
           </div>

           <div className="flex-1 relative overflow-hidden">
                {activeTab === "home" && <div className="h-full flex flex-col items-center justify-center p-6 text-center">{renderSurpriseContent()}</div>}
                {activeTab === "game" && renderGameContent()}
                {activeTab === "calendar" && renderCalendar()}
                {activeTab === "music" && renderMusicTab()}
                {activeTab === "notes" && (
                  <div className="relative w-full h-full bg-orange-50 flex flex-col">
                      <div className="flex-1 w-full h-full overflow-auto relative touch-pan-x touch-pan-y" ref={constraintsRef}>
                          <div className="absolute inset-0 opacity-10 pointer-events-none sticky top-0 left-0 min-w-full min-h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                          <div className="min-w-[120vw] min-h-[120vh] md:min-w-full md:min-h-full relative pb-20">
                              {notes.map((note) => (<DraggableNote key={note.id} note={note} onDelete={handleDeleteNote} onUpdatePos={handleUpdateNotePos} containerRef={constraintsRef}/>))}
                              {notes.length === 0 && !loadingNotes && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-gray-400 w-full px-4"><StickyNote size={48} className="mx-auto mb-2 opacity-20"/><p className="text-sm">Belum ada catatan.<br/>Klik + di pojok kanan!</p></div>)}
                          </div>
                      </div>
                      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 flex flex-col items-end gap-3 z-50">
                          {showNoteForm && (
                              <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white p-4 rounded-2xl shadow-xl border border-pink-100 w-[260px] md:w-80">
                                  <div className="flex justify-between items-center mb-3"><h4 className="font-bold text-gray-700">Tulis Catatan 📝</h4><button onClick={() => setShowNoteForm(false)}><X size={18} className="text-gray-400"/></button></div>
                                  <input className="w-full mb-2 p-3 bg-gray-50 rounded-xl text-sm focus:outline-pink-500" placeholder="Judul..." value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})}/>
                                  <textarea className="w-full mb-3 p-3 bg-gray-50 rounded-xl text-sm focus:outline-pink-500 min-h-[80px]" placeholder="Isi catatan..." value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})}></textarea>
                                  <div className="flex justify-between items-center"><div className="flex gap-2">{NOTE_COLORS.map(c => (<button key={c.name} onClick={() => setNewNote({...newNote, color: c.bg})} className={`w-6 h-6 rounded-full border-2 ${c.bg} ${newNote.color === c.bg ? 'border-gray-500 scale-110' : 'border-transparent'}`}/>))}</div><button onClick={handleAddNote} className="bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-pink-600">Tempel</button></div>
                              </motion.div>
                          )}
                          <button onClick={() => setShowNoteForm(!showNoteForm)} className="bg-pink-500 hover:bg-pink-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95">{showNoteForm ? <X size={28}/> : <Plus size={28}/>}</button>
                      </div>
                  </div>
                )}
           </div>
        </div>

      {!selectedGame && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-lg rounded-full shadow-2xl border border-white/50 z-50 flex items-center justify-between px-6">
            {[{ id: "home", icon: Home }, { id: "game", icon: Gamepad2 }, { id: "calendar", icon: Calendar }, { id: "music", icon: Disc }, { id: "notes", icon: StickyNote }].map((item) => {
                const isActive = activeTab === item.id;
                return (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`relative flex flex-col items-center justify-center w-10 h-10 transition-all duration-300 ${isActive ? '-translate-y-1' : 'opacity-50 hover:opacity-100'}`}>
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