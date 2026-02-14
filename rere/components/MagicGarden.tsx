"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
// PERBAIKAN: Menambahkan Droplets ke dalam import
import { Zap, Star, X, Bug, CloudRain, Skull, ShieldAlert, Heart, Droplets } from "lucide-react";

// --- TIPE DATA ---
type Particle = { id: number; x: number; y: number; color: string; size: number; };
type FloatingText = { id: number; x: number; y: number; text: string; color: string; size: number; };
type BossType = { id: number; hp: number; maxHp: number; name: string; type: 'worm' | 'boss'; };

const LEVELS = [
  { threshold: 0, name: "Bibit Harapan", color: "from-slate-900 to-slate-800", icon: "🌱", scale: 1 },
  { threshold: 500, name: "Tunas Cinta", color: "from-emerald-900 to-teal-900", icon: "🌿", scale: 1.2 },
  { threshold: 1500, name: "Pohon Kasih", color: "from-green-800 to-lime-900", icon: "🪴", scale: 1.5 },
  { threshold: 3000, name: "Dahan Rindu", color: "from-cyan-800 to-blue-900", icon: "🌳", scale: 2 },
  { threshold: 5000, name: "Eternal Blossom", color: "from-pink-900 to-purple-900", icon: "🌸", scale: 2.2 },
  { threshold: 10000, name: "Galaxy Guardian", color: "from-indigo-950 to-violet-950", icon: "🌌", scale: 2.5 },
];

export default function MagicGarden({ onBack }: { onBack: () => void }) {
  // GAME STATE
  const [exp, setExp] = useState(0);
  const [level, setLevel] = useState(0);
  const [health, setHealth] = useState(100); // Kesehatan Pohon
  
  // ENEMIES & EVENTS
  const [boss, setBoss] = useState<BossType | null>(null);
  const [isRaining, setIsRaining] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // VISUALS
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floaters, setFloaters] = useState<FloatingText[]>([]);
  const [shake, setShake] = useState(0); // Untuk screen shake

  // REFS
  const containerRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef(null);

  // --- HAPTIC FEEDBACK ---
  const vibrate = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  };

  // ==========================================
  // 1. GAME LOOP (The Heartbeat)
  // ==========================================
  useEffect(() => {
    const loop = setInterval(() => {
      // Regenerasi HP Pohon pelan-pelan kalau aman
      if (!boss && health < 100) setHealth(h => Math.min(h + 1, 100));

      // BOSS ATTACK LOGIC
      if (boss) {
        // Kalau ada boss, darah pohon berkurang!
        setHealth(h => {
            const dmg = boss.type === 'boss' ? 2 : 0.5;
            const newHealth = Math.max(h - dmg, 0);
            if (newHealth <= 0) gameOver(); // Logika game over (turun level)
            return newHealth;
        });
        setShake(prev => (prev === 0 ? 5 : -5)); // Layar getar terus pas ada boss
      } else {
        setShake(0);
      }

      // RANDOM SPAWN EVENT (Cek setiap detik)
      if (!boss && Math.random() < 0.05) spawnBoss(); // 5% chance per tick

    }, 1000);

    return () => clearInterval(loop);
  }, [boss, health]);

  // ==========================================
  // 2. BOSS SYSTEM (THE "HAMA")
  // ==========================================
  const spawnBoss = () => {
    const isBigBoss = Math.random() > 0.7; // 30% chance boss besar
    setBoss({
        id: Date.now(),
        hp: isBigBoss ? 50 : 20,
        maxHp: isBigBoss ? 50 : 20,
        name: isBigBoss ? "RAJANYA HAMA! 👹" : "Ulat Nakal 🐛",
        type: isBigBoss ? 'boss' : 'worm'
    });
    setShowWarning(true);
    vibrate([200, 100, 200]);
    setTimeout(() => setShowWarning(false), 2000);
  };

  const hitBoss = (e: any) => {
    e.stopPropagation(); // Biar gak ngetap pohon
    if (!boss) return;

    const crit = Math.random() > 0.8;
    const dmg = crit ? 5 : 1;
    const newHp = boss.hp - dmg;

    spawnFloater(e.clientX, e.clientY, `-${dmg}`, crit ? "#ef4444" : "#ffffff", crit ? 30 : 20);
    vibrate(crit ? 50 : 10);

    if (newHp <= 0) {
        // BOSS MATI
        setBoss(null);
        setExp(prev => prev + (boss.type === 'boss' ? 500 : 100)); // Hadiah Gede
        spawnFloater(window.innerWidth/2, window.innerHeight/2, "VICTORY! +EXP", "#22c55e", 40);
        vibrate([50, 50, 50, 50]);
    } else {
        setBoss({ ...boss, hp: newHp });
    }
  };

  const gameOver = () => {
    setBoss(null);
    setHealth(100);
    setExp(prev => Math.max(0, prev - 200)); // Hukuman
    spawnFloater(window.innerWidth/2, window.innerHeight/2, "POHON PINGSAN! -EXP", "#ef4444", 30);
    alert("Yah! Pohonnya pingsan dimakan hama! Jangan dicuekin dong ayang 😭");
  };

  // ==========================================
  // 3. PLAYER ACTION (TAP)
  // ==========================================
  const handleTap = (e: any) => {
    // Kalau ada Boss Gede, GABISA TAP POHON (Harus bunuh boss dulu)
    if (boss && boss.type === 'boss') {
        spawnFloater(e.clientX, e.clientY, "BLOCKED!", "#ef4444", 20);
        vibrate(100);
        return;
    }

    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;

    // Tambah EXP
    const amount = isRaining ? 5 : 1; // Hujan = Bonus EXP
    setExp(prev => {
        const next = prev + amount;
        checkLevelUp(next);
        return next;
    });

    spawnParticle(clientX, clientY);
    spawnFloater(clientX, clientY - 50, `+${amount}`, "#fbbf24", 20);
  };

  // ==========================================
  // 4. WEATHER SYSTEM (INTERACTIVE CLOUD)
  // ==========================================
  const handleDragCloud = (event: any, info: any) => {
    const treeX = window.innerWidth / 2;
    const treeY = window.innerHeight - 100;
    const dist = Math.sqrt(Math.pow(info.point.x - treeX, 2) + Math.pow(info.point.y - treeY, 2));

    if (dist < 150) { // Kalau awan di atas pohon
        setIsRaining(true);
        // Hujan nambah HP pohon juga
        setHealth(prev => Math.min(prev + 0.5, 100));
        spawnParticle(treeX + (Math.random() * 100 - 50), treeY);
    } else {
        setIsRaining(false);
    }
  };

  // --- HELPERS ---
  const checkLevelUp = (currentExp: number) => {
    const nextLevelIdx = LEVELS.findIndex(l => currentExp < l.threshold) - 1;
    const maxIdx = LEVELS.length - 1;
    const actualIdx = nextLevelIdx === -2 ? maxIdx : (nextLevelIdx === -1 ? 0 : nextLevelIdx);
    if (actualIdx > level) {
        setLevel(actualIdx);
        spawnFloater(window.innerWidth/2, window.innerHeight/3, `LEVEL UP! ${LEVELS[actualIdx].name}`, "#fbbf24", 40);
        vibrate([100, 100, 100]);
    }
  };

  const spawnFloater = (x: number, y: number, text: string, color: string, size: number) => {
    const id = Date.now() + Math.random();
    setFloaters(prev => [...prev, { id, x, y, text, color, size }]);
    setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 1000);
  };

  const spawnParticle = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    setParticles(prev => [...prev, { id, x, y, color: `hsl(${Math.random()*60 + 40}, 100%, 50%)`, size: Math.random()*8+4 }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 600);
  };

  // --- RENDER VARS ---
  const currentTheme = LEVELS[level];
  const nextThreshold = LEVELS[level + 1]?.threshold || exp * 1.5;
  const progress = Math.min(((exp - (LEVELS[level-1]?.threshold || 0)) / (nextThreshold - (LEVELS[level-1]?.threshold || 0))) * 100, 100);

  return (
    <div 
        ref={containerRef}
        className={`fixed inset-0 z-[9999] overflow-hidden touch-none select-none bg-gradient-to-b ${boss ? 'from-red-900 to-black' : currentTheme.color} transition-colors duration-1000`}
        onClick={handleTap}
        style={{ x: shake }} // Screen shake effect
    >
        {/* --- UI ATAS: HP BAR POHON & EXP --- */}
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <div className="flex flex-col w-full mr-4">
                    {/* EXP BAR */}
                    <div className="flex justify-between text-xs text-white mb-1 font-bold">
                        <span>{currentTheme.name} (Lvl {level + 1})</span>
                        <span>{exp.toLocaleString()} EXP</span>
                    </div>
                    <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/20">
                        <motion.div animate={{ width: `${progress}%` }} className="h-full bg-yellow-400" />
                    </div>

                    {/* HEALTH BAR POHON */}
                    <div className="flex items-center gap-2 mt-2">
                        <Heart size={16} className="text-red-500 fill-red-500" />
                        <div className="h-2 flex-1 bg-black/50 rounded-full overflow-hidden border border-white/20">
                            <motion.div animate={{ width: `${health}%` }} className={`h-full ${health < 30 ? 'bg-red-500' : 'bg-green-500'}`} />
                        </div>
                    </div>
                </div>
                <button onClick={(e)=>{e.stopPropagation(); onBack()}} className="bg-white/10 p-2 rounded-full text-white"><X/></button>
            </div>
        </div>

        {/* --- BOSS LAYER (PALING DEPAN) --- */}
        <AnimatePresence>
            {boss && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1, y: [0, -20, 0] }}
                    exit={{ scale: 0, opacity: 0, rotate: 180 }}
                    transition={{ y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                    className="absolute top-1/3 left-0 right-0 flex flex-col items-center justify-center z-40 pointer-events-auto"
                    onClick={hitBoss}
                >
                    {/* BOSS HEALTH BAR */}
                    <div className="w-40 h-4 bg-gray-800 border-2 border-red-500 rounded-full mb-2 overflow-hidden">
                        <motion.div 
                            className="h-full bg-red-600" 
                            animate={{ width: `${(boss.hp / boss.maxHp) * 100}%` }}
                        />
                    </div>
                    
                    {/* BOSS VISUAL */}
                    <div className={`relative flex items-center justify-center ${boss.type === 'boss' ? 'w-48 h-48' : 'w-24 h-24'}`}>
                        {boss.type === 'boss' ? (
                            <Skull className="w-full h-full text-white drop-shadow-[0_0_15px_rgba(255,0,0,0.8)] animate-pulse" />
                        ) : (
                            <Bug className="w-full h-full text-red-400 drop-shadow-lg" />
                        )}
                    </div>
                    <p className="text-red-500 font-black text-xl mt-2 animate-bounce uppercase">{boss.name}</p>
                    <p className="text-white text-xs bg-black/50 px-2 py-1 rounded">TAP TAP UNTUK BUNUH!</p>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- RED ALERT WARNING --- */}
        <AnimatePresence>
            {showWarning && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-red-500/30 z-[39] flex items-center justify-center pointer-events-none">
                    <h1 className="text-6xl font-black text-red-600 tracking-tighter -rotate-12 border-4 border-red-600 p-4 rounded-xl bg-black">WARNING!!</h1>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- INTERACTIVE CLOUD (DRAGGABLE) --- */}
        <motion.div 
            drag dragConstraints={containerRef} dragElastic={0.2}
            onDrag={handleDragCloud}
            className="absolute z-30 cursor-grab active:cursor-grabbing top-32 left-10"
        >
            <div className={`p-3 rounded-full ${isRaining ? 'bg-blue-500/20' : 'bg-white/20'} backdrop-blur-md border border-white/30`}>
                <CloudRain size={40} className={`text-white ${isRaining ? 'animate-bounce' : ''}`}/>
            </div>
            {!isRaining && <p className="text-[10px] text-white/50 text-center mt-1 pointer-events-none">Geser ke Pohon</p>}
        </motion.div>

        {/* --- VISUAL EFFECTS --- */}
        {/* Hujan */}
        {isRaining && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-full z-20 pointer-events-none bg-gradient-to-b from-blue-400/20 to-transparent">
                {/* Simple CSS Rain */}
                <div className="absolute inset-0 flex justify-center pt-20">
                    <Droplets className="text-blue-300 animate-bounce" size={24} />
                    <Droplets className="text-blue-300 animate-bounce delay-100" size={16} />
                </div>
            </div>
        )}

        {/* Particles */}
        {particles.map(p => (
            <motion.div key={p.id} initial={{ scale: 0, x: p.x, y: p.y }} animate={{ scale: 1, y: p.y - 100, opacity: 0 }} className="absolute rounded-full z-20" style={{ width: p.size, height: p.size, backgroundColor: p.color }} />
        ))}

        {/* Floating Text */}
        {floaters.map(f => (
            <motion.div key={f.id} initial={{ y: f.y, opacity: 1, scale: 0.5 }} animate={{ y: f.y - 100, opacity: 0, scale: 1.5 }} className="absolute z-50 font-black pointer-events-none" style={{ left: f.x, color: f.color, fontSize: f.size }}>{f.text}</motion.div>
        ))}

        {/* --- MAIN POHON --- */}
        <div className="absolute bottom-20 left-0 right-0 flex justify-center items-end pointer-events-none z-10">
            <motion.div 
                animate={{ 
                    scale: [1, 1.05, 1], 
                    filter: boss ? "grayscale(100%)" : "grayscale(0%)" // Pohon jadi abu-abu kalau ada boss
                }} 
                transition={{ repeat: Infinity, duration: boss ? 0.2 : 2 }} // Getar takut kalau ada boss
                className="relative"
            >
                <div className="text-[180px] leading-none drop-shadow-2xl" style={{ transform: `scale(${currentTheme.scale})` }}>
                    {currentTheme.icon}
                </div>
                {/* Health Bar Pohon kalau sekarat */}
                {health < 50 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/50 px-2 py-1 rounded text-red-500 font-bold text-xs animate-pulse">
                        TOLONG! 😭
                    </div>
                )}
            </motion.div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-5 w-full text-center text-white/30 text-xs font-mono pointer-events-none">
            {boss ? "⚠️ SERANGAN HAMA TERDETEKSI! ⚠️" : "Tap layar untuk merawat pohon"}
        </div>
    </div>
  );
}