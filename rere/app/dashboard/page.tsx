"use client";

import { useState, useEffect, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Home, Gamepad2, Calendar, StickyNote, Clock, List, Hourglass, Plus, Trash2, X, ArrowDown, RotateCcw, ArrowRight, CheckCircle, AlertOctagon } from "lucide-react"; 
import { supabase } from "@/lib/supabaseClient";

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

const NOTE_COLORS = [
  { name: "yellow", bg: "bg-yellow-200" },
  { name: "pink", bg: "bg-pink-200" },
  { name: "blue", bg: "bg-blue-200" },
  { name: "green", bg: "bg-green-200" },
];

// --- KOMPONEN TYPEWRITER ---
const Typewriter = ({ text, onComplete, speed = 100, delayAfter = 1000, className = "" }: { text: string, onComplete?: () => void, speed?: number, delayAfter?: number, className?: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => text.slice(0, index + 1)); 
      index++;
      
      if (index > text.length) {
        clearInterval(interval);
        if (onComplete) {
          setTimeout(onComplete, delayAfter);
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, delayAfter, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      <span className="animate-pulse ml-1">|</span>
    </span>
  );
};

// --- KOMPONEN BACKGROUND HEARTS ---
const BackgroundHearts = memo(() => {
  const [hearts, setHearts] = useState<number[]>([]);
  useEffect(() => { setHearts(Array.from({ length: 12 })); }, []);
  return (
    <>
      {hearts.map((_, index) => (
         <motion.div
            key={index}
            className="absolute left-0 text-white/30 pointer-events-none z-0"
            style={{ fontSize: `${Math.random() * 20 + 20}px`, willChange: "transform, opacity" }}
            initial={{ opacity: 0, y: "110vh", x: `${Math.floor(Math.random() * 100)}vw` }}
            animate={{ opacity: [0, 0.6, 0.6, 0], y: "-10vh" }}
            transition={{ duration: Math.random() * 6 + 10, repeat: Infinity, delay: Math.random() * 5, ease: "linear" }}
         >❤️</motion.div>
      ))}
    </>
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
            whileDrag={{ scale: 1.05, zIndex: 100, rotate: 0, cursor: 'grabbing' }}
            onDragEnd={(event, info) => {
                const newX = note.x + info.offset.x;
                const newY = note.y + info.offset.y;
                onUpdatePos(note.id, newX, newY);
            }}
            className={`absolute w-32 md:w-52 min-h-[140px] md:min-h-[180px] p-3 md:p-5 shadow-lg rounded-sm ${note.color} transform rotate-1 flex flex-col justify-between touch-none`}
            style={{ 
                boxShadow: "5px 5px 15px rgba(0,0,0,0.1)",
                left: 0, top: 0 
            }}
        >
            <div>
                <h4 className="font-bold text-gray-800 text-xs md:text-lg mb-1 leading-tight line-clamp-2" style={{ fontFamily: 'cursive' }}>{note.title}</h4>
                <p className="text-gray-700 text-[10px] md:text-sm whitespace-pre-wrap leading-snug" style={{ fontFamily: 'cursive' }}>{note.content}</p>
            </div>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={() => onDelete(note.id)} className="self-end mt-1 text-gray-500 hover:text-red-600 p-1">
                <Trash2 size={14} className="md:w-4 md:h-4" />
            </button>
            <div className="absolute -top-2 md:-top-3 left-1/2 -translate-x-1/2 w-12 md:w-20 h-4 md:h-8 bg-white/40 rotate-1 backdrop-blur-sm"></div>
        </motion.div>
    );
};

// --- KOMPONEN RELATIONSHIP TIMER ---
const RelationshipTimer = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const jadianDate = new Date("2023-01-01T00:00:00"); 
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
    <div className="grid grid-cols-2 gap-3 w-full max-w-sm mx-auto">
        <div className="bg-pink-100 p-3 rounded-xl border border-pink-300 shadow-sm"><p className="text-2xl md:text-3xl font-bold text-pink-600">{time.days}</p><p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Hari</p></div>
        <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 shadow-sm"><p className="text-2xl md:text-3xl font-bold text-pink-500">{time.hours}</p><p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Jam</p></div>
        <div className="bg-pink-50 p-3 rounded-xl border border-pink-200 shadow-sm"><p className="text-2xl md:text-3xl font-bold text-pink-500">{time.minutes}</p><p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Menit</p></div>
        <div className="bg-white p-3 rounded-xl border border-pink-200 shadow-sm relative overflow-hidden"><p className="text-2xl md:text-3xl font-bold text-red-500">{time.seconds}</p><p className="text-[10px] md:text-xs text-gray-500 uppercase font-bold">Detik</p></div>
    </div>
  );
};

// --- MAIN DASHBOARD PAGE ---
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home");
  const [calendarTab, setCalendarTab] = useState("relationship");
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });
  const constraintsRef = useRef(null);
  
  // STATE ANIMASI
  // 0: Awal -> 1: Ngeledek -> 2: Muji -> 3: Foto Bukti -> 4: Tebak Makanan -> 5: Sukses
  const [surpriseStep, setSurpriseStep] = useState(0);
  
  // State untuk Notifikasi Salah Pilih
  const [wrongGuessAlert, setWrongGuessAlert] = useState(false);

  // --- DATABASE STATES ---
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", description: "" });
  
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [newNote, setNewNote] = useState({ title: "", content: "", color: NOTE_COLORS[0].bg });
  const [showNoteForm, setShowNoteForm] = useState(false);
  
  const [selectedCountdownId, setSelectedCountdownId] = useState<string>("");
  const [countdownTime, setCountdownTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => { fetchEvents(); fetchNotes(); }, []);

  // --- LOGIC TEBAK-TEBAKAN ---
  const handleFoodClick = (isCorrect: boolean) => {
    if (isCorrect) {
        setSurpriseStep(5); // Masuk step sukses
    } else {
        setWrongGuessAlert(true);
        setTimeout(() => setWrongGuessAlert(false), 2000); // Hilang setelah 2 detik
    }
  };

  // --- CRUD HELPERS (Disederhanakan untuk brevity) ---
  const fetchEvents = async () => {
    setLoadingEvents(true);
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    setEvents(data || []);
    setLoadingEvents(false);
  };
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.date) return alert("Isi lengkap dulu dong!");
    const { error } = await supabase.from('events').insert([newEvent]);
    if (!error) { fetchEvents(); setNewEvent({ title: "", date: "", description: "" }); }
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
    const { error } = await supabase.from('notes').insert([{ ...newNote, x: randomX, y: randomY }]);
    if(!error) { fetchNotes(); setNewNote({ title: "", content: "", color: NOTE_COLORS[0].bg }); setShowNoteForm(false); }
  };
  const handleDeleteNote = async (id: number) => {
    if(!confirm("Buang catatan ini?")) return;
    setNotes(prev => prev.filter(n => n.id !== id));
    await supabase.from('notes').delete().eq('id', id);
  };
  const handleUpdateNotePos = async (id: number, x: number, y: number) => {
    await supabase.from('notes').update({ x, y }).eq('id', id);
  };

  // --- COUNTDOWN LOGIC ---
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

  // --- RENDER SECTION: CALENDAR ---
  const renderCalendar = () => (
    <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/3 bg-pink-50 md:border-r border-pink-100 p-2 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0 no-scrollbar">
             {[
               { id: 'relationship', icon: Clock, label: 'Timer', sub: 'Waktu Bersama' },
               { id: 'events', icon: List, label: 'Events', sub: 'Acara & Tambah' },
               { id: 'countdown', icon: Hourglass, label: 'Countdown', sub: 'Hitung Mundur' }
             ].map(item => (
               <button key={item.id} onClick={() => setCalendarTab(item.id)} 
                 className={`p-3 rounded-xl text-left flex items-center gap-3 transition-all min-w-[140px] md:min-w-0 flex-1 md:flex-none
                 ${calendarTab===item.id ? 'bg-white text-pink-600 shadow-sm ring-1 ring-pink-200' : 'text-gray-500 hover:bg-white/50'}`}>
                 <div className={`p-2 rounded-full ${calendarTab===item.id ? 'bg-pink-500 text-white' : 'bg-gray-200'}`}><item.icon size={18}/></div>
                 <div><p className="font-bold text-sm whitespace-nowrap">{item.label}</p><p className="text-[10px] opacity-70 hidden md:block">{item.sub}</p></div>
               </button>
             ))}
        </div>
        
        <div className="flex-1 p-4 md:p-6 flex flex-col items-center justify-start md:justify-center overflow-y-auto w-full">
            {calendarTab === 'relationship' && (
                <div className="w-full animate-in fade-in zoom-in text-center mt-4 md:mt-0">
                    <h3 className="text-lg font-bold text-pink-500 mb-4">Kita sudah bersama:</h3>
                    <RelationshipTimer />
                    <p className="mt-8 text-sm text-gray-400 italic">"Setiap detiknya berharga..."</p>
                </div>
            )}
            {calendarTab === 'events' && (
                <div className="w-full max-w-md flex flex-col h-full animate-in fade-in zoom-in">
                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                        {loadingEvents ? <p className="text-gray-400 text-center">Loading...</p> : events.map(ev => (
                            <div key={ev.id} className="flex justify-between items-center bg-white p-3 rounded-xl border-l-4 border-pink-500 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="text-center min-w-[40px]">
                                    <span className="block text-lg font-bold text-gray-800 leading-none">{new Date(ev.date).getDate()}</span>
                                    <span className="block text-[10px] text-pink-500 font-bold uppercase">{new Date(ev.date).toLocaleString('default', { month: 'short' })}</span>
                                  </div>
                                  <div><p className="font-bold text-sm text-gray-700 line-clamp-1">{ev.title}</p><p className="text-xs text-gray-400 line-clamp-1">{ev.description || ev.date}</p></div>
                                </div>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                        {events.length === 0 && !loadingEvents && <p className="text-center text-sm text-gray-400 py-4">Belum ada acara nih.</p>}
                    </div>
                    <div className="bg-pink-50 p-4 rounded-xl border border-pink-200 shrink-0">
                        <p className="text-xs font-bold text-pink-500 mb-2 flex items-center gap-1"><Plus size={14}/> Tambah Acara</p>
                        <div className="flex gap-2 mb-2">
                           <input className="flex-1 p-2 rounded-lg text-sm border focus:outline-pink-500" placeholder="Judul" value={newEvent.title} onChange={e=>setNewEvent({...newEvent, title: e.target.value})}/>
                           <input type="date" className="w-32 p-2 rounded-lg text-sm border focus:outline-pink-500" value={newEvent.date} onChange={e=>setNewEvent({...newEvent, date: e.target.value})}/>
                        </div>
                        <button onClick={handleAddEvent} className="w-full bg-pink-500 text-white py-2 rounded-lg text-sm font-bold shadow-md hover:bg-pink-600 active:scale-95 transition">Simpan</button>
                    </div>
                </div>
            )}
            {calendarTab === 'countdown' && (
                <div className="w-full max-w-sm flex flex-col items-center animate-in fade-in zoom-in mt-4 md:mt-0">
                    <h3 className="text-lg font-bold text-pink-500 mb-4">Hitung Mundur ⏳</h3>
                    <select className="w-full p-3 mb-6 border rounded-xl bg-white text-sm" onChange={e=>setSelectedCountdownId(e.target.value)} value={selectedCountdownId}>
                        <option value="">-- Pilih Acara --</option>
                        {events.filter(e=>new Date(e.date)>new Date()).map(e=><option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                    {selectedCountdownId ? (
                         <div className="grid grid-cols-4 gap-2 text-center w-full">
                            <div className="bg-orange-100 p-2 rounded-lg"><span className="text-xl font-bold block text-orange-700">{countdownTime.days}</span><span className="text-[10px] text-orange-600">Hari</span></div>
                            <div className="bg-orange-50 p-2 rounded-lg"><span className="text-xl font-bold block text-orange-600">{countdownTime.hours}</span><span className="text-[10px] text-orange-500">Jam</span></div>
                            <div className="bg-orange-50 p-2 rounded-lg"><span className="text-xl font-bold block text-orange-600">{countdownTime.minutes}</span><span className="text-[10px] text-orange-500">Mnt</span></div>
                            <div className="bg-white p-2 rounded-lg border border-orange-200"><span className="text-xl font-bold block text-red-500">{countdownTime.seconds}</span><span className="text-[10px] text-gray-400">Dtk</span></div>
                        </div>
                    ) : (
                        <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center"><p className="text-gray-400 text-sm">Pilih acara di atas dulu ya 👆</p></div>
                    )}
                </div>
            )}
        </div>
    </div>
  );

  return (
    <main className="fixed inset-0 bg-gradient-to-br from-pink-400 to-red-300 font-sans text-slate-800 overflow-hidden">
      <BackgroundHearts />
      
      {/* NOTIFIKASI GABOLEH */}
      <AnimatePresence>
        {wrongGuessAlert && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.5, y: -100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed top-10 left-0 right-0 z-[100] flex justify-center pointer-events-none"
            >
                <motion.div 
                    animate={{ x: [-5, 5, -5, 5, 0] }} // Shake effect
                    transition={{ duration: 0.3 }}
                    className="bg-red-500 text-white px-8 py-4 rounded-full shadow-2xl border-4 border-white flex items-center gap-3"
                >
                    <AlertOctagon size={32} />
                    <span className="text-2xl font-black uppercase tracking-widest">GABOLEH!!! 😡</span>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full h-full flex flex-col items-center justify-start pt-4 pb-24 md:pb-4 md:justify-center px-4">
        
        <div className="md:hidden absolute top-4 left-6 z-10 flex items-center gap-2">
            <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full"><Heart size={16} fill="white" className="text-white"/></div>
            <span className="font-bold text-white text-lg tracking-wide font-valentine">LoveApp</span>
        </div>

        <div className="w-full max-w-5xl h-[80vh] md:h-[85vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex flex-col relative mt-12 md:mt-0">
           
           <div className="hidden md:flex justify-between items-center p-6 border-b border-pink-50">
               <div className="flex items-center gap-2"><div className="bg-pink-500 p-2 rounded-full text-white"><Heart size={20} fill="white" /></div><span className="font-bold text-pink-600 text-xl">LoveApp</span></div>
               <div className="flex gap-6">
                   {[
                       {id: 'home', label: 'Home'}, {id: 'game', label: 'Game'}, {id: 'calendar', label: 'Calendar'}, {id: 'notes', label: 'Notes'}
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
                                        <button onClick={() => setSurpriseStep(1)} className="w-full md:w-auto bg-gradient-to-r from-pink-500 to-red-400 text-white font-bold py-3 md:py-4 px-8 rounded-full shadow-lg hover:shadow-pink-500/50 active:scale-95 transition-all text-lg">Iya aku manis!</button>
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

                            {/* STEP 4: TEBAK MAKANAN (REVISI POSISI) */}
                            {surpriseStep === 4 && (
                                <motion.div 
                                    key="step4"
                                    className="flex flex-col items-center justify-center h-full w-full"
                                >
                                    {/* Judul: Diberi margin bawah agar tidak tertabrak */}
                                    <motion.h3 
                                        initial={{ y: -50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="text-2xl md:text-3xl font-bold text-pink-600 mb-10 z-20 text-center px-4"
                                    >
                                        Si manis ini suka apa ya?? 🤔
                                    </motion.h3>

                                    {/* WADAH ORBIT: Kotak imajiner di tengah untuk memastikan simetri */}
                                    <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                                        
                                        {/* Foto Tengah: Tepat di pusat */}
                                        <motion.div
                                            layoutId="main-photo"
                                            initial={{ scale: 1.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden z-10"
                                        >
                                            <img src="/AyangkuManis.png" alt="Foto Pacar" className="w-full h-full object-cover" />
                                        </motion.div>

                                        {/* --- MAKANAN DI 4 SUDUT (POSISI ABSOLUT SIMETRIS) --- */}
                                        
                                        {/* 1. SEBLAK (Kiri Atas) */}
                                        <motion.button
                                            initial={{ scale: 0, x: -50, y: -50 }}
                                            animate={{ scale: 1, x: 0, y: 0 }}
                                            whileHover={{ scale: 1.1, rotate: [-5, 5, -5, 5, 0] }}
                                            onClick={() => handleFoodClick(false)}
                                            className="absolute -top-4 -left-4 md:-top-6 md:-left-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20"
                                        >
                                            <img src="/Seblak.jpeg" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Seblak" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Seblak</span>
                                        </motion.button>

                                        {/* 2. RUJAK (Kanan Atas) */}
                                        <motion.button
                                            initial={{ scale: 0, x: 50, y: -50 }}
                                            animate={{ scale: 1, x: 0, y: 0 }}
                                            whileHover={{ scale: 1.1, rotate: [-5, 5, -5, 5, 0] }}
                                            onClick={() => handleFoodClick(false)}
                                            className="absolute -top-4 -right-4 md:-top-6 md:-right-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20"
                                        >
                                            <img src="/Rujak.jpeg" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Rujak" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Rujak</span>
                                        </motion.button>

                                        {/* 3. NANAS (Kiri Bawah) */}
                                        <motion.button
                                            initial={{ scale: 0, x: -50, y: 50 }}
                                            animate={{ scale: 1, x: 0, y: 0 }}
                                            whileHover={{ scale: 1.1, rotate: [-5, 5, -5, 5, 0] }}
                                            onClick={() => handleFoodClick(false)}
                                            className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg z-20"
                                        >
                                            <img src="https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=150&q=80" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Nanas" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Nanas</span>
                                        </motion.button>

                                        {/* 4. MATCHA (Kanan Bawah - BENAR) */}
                                        <motion.button
                                            initial={{ scale: 0, x: 50, y: 50 }}
                                            animate={{ scale: 1, x: 0, y: 0 }}
                                            whileHover={{ scale: 1.1, rotate: [-5, 5, -5, 5, 0] }}
                                            onClick={() => handleFoodClick(true)}
                                            className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 pointer-events-auto bg-white p-2 rounded-xl shadow-lg border-2 border-transparent hover:border-green-400 z-20"
                                        >
                                            <img src="/Matcha.jpg" className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg" alt="Matcha" />
                                            <span className="text-[10px] md:text-xs font-bold text-gray-600 mt-1 block">Matcha</span>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {/* STEP 5: SUCCESS */}
                            {surpriseStep === 5 && (
                                <motion.div 
                                    key="step5"
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center h-full text-center p-6"
                                >
                                    <div className="bg-green-100 p-4 rounded-full mb-6">
                                        <CheckCircle size={64} className="text-green-500" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Yeyyy! Sayangku akhirnya manuttt! 🎉</h2>
                                    <p className="text-gray-500 mb-8">Kamu emang kesayangan aku yang paling manissss!</p>
                                    <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXN6aG16YjF6aG16YjF6aG16YjF6aG16YjF6aG16YjF6aG16YjF6YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/MDJ9IbxxvDUQM/giphy.gif" alt="Cute Cat" className="w-48 rounded-xl shadow-lg mb-6" />
                                    <button onClick={() => setSurpriseStep(0)} className="text-pink-500 hover:underline text-sm flex items-center gap-1"><RotateCcw size={14}/> Ulangi</button>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                )}

                {activeTab === "game" && (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in">
                        <Gamepad2 size={64} className="text-pink-200 mb-4"/>
                        <h2 className="text-2xl font-bold text-pink-600 mb-2">Mini Game</h2>
                        <p className="text-gray-400 text-sm">Sabar ya, lagi dibikin... 🛠️</p>
                    </div>
                )}

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

        <div className="md:hidden fixed bottom-6 left-6 right-6 h-16 bg-white/90 backdrop-blur-lg rounded-full shadow-2xl border border-white/50 z-50 flex items-center justify-between px-6">
            {[
                { id: "home", icon: Home },
                { id: "game", icon: Gamepad2 },
                { id: "calendar", icon: Calendar },
                { id: "notes", icon: StickyNote },
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

      </div>
    </main>
  );
}