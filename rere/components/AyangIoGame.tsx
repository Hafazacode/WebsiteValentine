"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, RotateCcw, LocateFixed, Trophy, Crown, User } from "lucide-react";

// --- KONFIGURASI GAME (SMOOTH NAVIGATION FIX) ---
const WORLD_SIZE = 4000; 
const FOOD_COUNT = 400; 
const BOT_COUNT = 18;   
const START_RADIUS = 25; 
const BASE_SPEED = 3.5; 

// CONFIG BALANCING
const PVP_EAT_EFFICIENCY = 0.4; 
const FOOD_EAT_EFFICIENCY = 1.0; 
const SIZE_TO_EAT_RATIO = 1.05; 

// Helper: Warna Acak
const randomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 85%, 65%)`;

type GameObject = {
    id: string;
    x: number;
    y: number;
    r: number;
    color: string;
    vx?: number;
    vy?: number;
    name?: string;
    isPlayer?: boolean;
    // Props untuk AI Navigation
    targetX?: number; 
    targetY?: number; 
    wanderAngle?: number; 
};

type LeaderboardItem = {
    id: string;
    name: string;
    score: number;
    isPlayer: boolean;
};

export default function AyangIoGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State UI
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0); 
  const [highScore, setHighScore] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [eatenBy, setEatenBy] = useState<string>("");
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  // --- REFS ---
  const isGameOverRef = useRef(false); 
  const requestRef = useRef<number>(0); 
  const frameCounterRef = useRef(0); 

  const player = useRef<GameObject>({ id: 'player', x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, r: START_RADIUS, color: "#ec4899", vx: 0, vy: 0, name: "Kamu", isPlayer: true });
  const foods = useRef<GameObject[]>([]);
  const bots = useRef<GameObject[]>([]);
  
  // --- INPUT REFS ---
  const mousePos = useRef<{ x: number, y: number } | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const joystickData = useRef<{ dx: number, dy: number, active: boolean }>({ dx: 0, dy: 0, active: false });
  const tiltData = useRef<{ beta: number, gamma: number }>({ beta: 0, gamma: 0 }); 
  const joystickBaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ayangIo_highscore');
    if (saved) setHighScore(parseInt(saved));
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // --- FUNGSI SAFE SPAWN ---
  const getSafeSpawnPosition = (radius: number) => {
      let x, y, safe;
      let attempts = 0;
      do {
          const padding = 200;
          x = Math.random() * (WORLD_SIZE - padding * 2) + padding;
          y = Math.random() * (WORLD_SIZE - padding * 2) + padding;
          
          safe = true;
          const distToPlayer = Math.hypot(x - player.current.x, y - player.current.y);
          if (distToPlayer < 500) safe = false; 
          
          if (safe) {
              for (const bot of bots.current) {
                  const dist = Math.hypot(x - bot.x, y - bot.y);
                  if (dist < bot.r + 300) { 
                      safe = false;
                      break;
                  }
              }
          }
          attempts++;
      } while (!safe && attempts < 10);
      return { x, y };
  };

  // --- RESET DATA ---
  const resetGameData = useCallback(() => {
    player.current = { 
        id: 'player', 
        x: WORLD_SIZE / 2, 
        y: WORLD_SIZE / 2, 
        r: START_RADIUS, 
        color: "#ec4899", 
        vx: 0, vy: 0,
        name: "Kamu",
        isPlayer: true
    };

    foods.current = Array.from({ length: FOOD_COUNT }, (_, i) => ({
      id: `food-${i}`, x: Math.random() * WORLD_SIZE, y: Math.random() * WORLD_SIZE, r: 5 + Math.random() * 3, color: randomColor(),
    }));

    const botNames = ["Ayang Galak", "Ayang Manja", "Si Cantik", "Tukang Ngambek", "My Love", "Bebenyu", "Si Pesek", "Mantan", "Gebetan", "Kang Ghosting", "Buaya Darat", "Si Setia", "Playboy", "Si Polos", "Kang Tikung"];
    
    bots.current = [];
    
    for (let i = 0; i < BOT_COUNT; i++) {
        const r = Math.random() * 15 + 20; 
        const spawnPos = getSafeSpawnPosition(r);

        bots.current.push({
            id: `bot-${i}`,
            x: spawnPos.x, 
            y: spawnPos.y, 
            r,
            color: randomColor(),
            vx: 0, vy: 0,
            name: botNames[i % botNames.length],
            wanderAngle: Math.random() * Math.PI * 2
        });
    }

    setScore(START_RADIUS);
    setEatenBy("");
    setIsNewRecord(false);
    isGameOverRef.current = false;
    joystickData.current = { dx: 0, dy: 0, active: false };
  }, []);

  const handleRestart = () => {
    resetGameData(); 
    setGameOver(false); 
  };

  const triggerGameOver = (killerName: string) => {
    isGameOverRef.current = true; 
    setEatenBy(killerName);
    setGameOver(true); 
    
    setScore((currentScore) => {
        const savedHigh = parseInt(localStorage.getItem('ayangIo_highscore') || '0');
        if (currentScore > savedHigh) {
            setHighScore(currentScore);
            localStorage.setItem('ayangIo_highscore', currentScore.toString());
            setIsNewRecord(true);
        }
        return currentScore;
    });
  };

  // --- EVENT LISTENERS ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
    const handleMouseMove = (e: MouseEvent) => { mousePos.current = { x: e.clientX, y: e.clientY }; };
    
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
        const clamp = (val: number | null, min: number, max: number) => Math.min(Math.max(val || 0, min), max);
        tiltData.current = { 
            gamma: clamp(e.gamma, -30, 30) / 30, 
            beta: clamp(e.beta, -30, 30) / 30 
        };
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("mousemove", handleMouseMove);
    if (window.DeviceOrientationEvent && isMobile) {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
    }

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        window.removeEventListener("mousemove", handleMouseMove);
        if (window.DeviceOrientationEvent && isMobile) {
            window.removeEventListener("deviceorientation", handleDeviceOrientation);
        }
    };
  }, [isMobile]);


  // --- GAME ENGINE ---
  useEffect(() => {
    if (!gameOver) {
        resetGameData();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    handleResize(); 

    // >>> UPDATE LOGIC <<<
    const updateGame = () => {
      if (isGameOverRef.current) return;
      
      const p = player.current;

      // --- 1. MOVEMENT PLAYER ---
      let inputDx = 0;
      let inputDy = 0;

      if (isMobile) {
          if (joystickData.current.active) {
              inputDx = joystickData.current.dx;
              inputDy = joystickData.current.dy;
          } else {
              inputDx = tiltData.current.gamma * 1.5;
              inputDy = tiltData.current.beta * 1.5;
          }
      } else {
          const k = keysPressed.current;
          if (k['KeyW'] || k['ArrowUp']) inputDy -= 1;
          if (k['KeyS'] || k['ArrowDown']) inputDy += 1;
          if (k['KeyA'] || k['ArrowLeft']) inputDx -= 1;
          if (k['KeyD'] || k['ArrowRight']) inputDx += 1;

          if (inputDx === 0 && inputDy === 0 && mousePos.current) {
              const centerX = window.innerWidth / 2;
              const centerY = window.innerHeight / 2;
              inputDx = mousePos.current.x - centerX;
              inputDy = mousePos.current.y - centerY;
          }
      }

      const dist = Math.hypot(inputDx, inputDy);
      const speedMultiplier = BASE_SPEED / Math.pow(p.r / 20, 0.45); 
      
      if (dist > 0) {
         p.vx = (inputDx / dist) * speedMultiplier;
         p.vy = (inputDy / dist) * speedMultiplier;
      } else {
         p.vx! *= 0.95; p.vy! *= 0.95; 
      }

      p.x = Math.max(p.r, Math.min(WORLD_SIZE - p.r, p.x + p.vx!));
      p.y = Math.max(p.r, Math.min(WORLD_SIZE - p.r, p.y + p.vy!));

      // --- 2. BOT LOGIC (SMOOTH NAVIGATION) ---
      bots.current.forEach(bot => {
        // Init Vectors
        let moveX = 0;
        let moveY = 0;
        
        let predatorDist = Infinity;
        let targetDist = Infinity;
        
        let predator: GameObject | null = null;
        let target: GameObject | null = null;

        const sensorRange = 600 + bot.r; 
        const unsafeMargin = 80; // Jarak makanan yang dianggap "berbahaya" (terlalu pinggir)

        // 1. SCAN LINGKUNGAN
        const allObjects = [...foods.current, p, ...bots.current];
        for (const obj of allObjects) {
            if (obj.id === bot.id) continue;
            
            // --- LOGIC ANTI STUCK: ABAIKAN MAKANAN DI PINGGIR ---
            if (obj.x < unsafeMargin || obj.x > WORLD_SIZE - unsafeMargin || 
                obj.y < unsafeMargin || obj.y > WORLD_SIZE - unsafeMargin) {
                continue; // Skip makanan ini, jangan dikejar!
            }

            const d = Math.hypot(bot.x - obj.x, bot.y - obj.y);

            // Cek Predator
            if (obj.r > bot.r * SIZE_TO_EAT_RATIO && d < sensorRange) { 
                if (d < predatorDist) {
                    predatorDist = d;
                    predator = obj;
                }
            } 
            // Cek Target
            else if (bot.r > obj.r * SIZE_TO_EAT_RATIO && d < sensorRange * 1.2) {
                if (d < targetDist) {
                    targetDist = d;
                    target = obj;
                }
            }
        }

        // 2. TENTUKAN ARAH (Vector Calculation)
        if (predator) {
            moveX = bot.x - predator.x;
            moveY = bot.y - predator.y;
        } else if (target) {
            moveX = target.x - bot.x;
            moveY = target.y - bot.y;
        } else {
            // Wandering Halus
            bot.wanderAngle = (bot.wanderAngle || 0) + (Math.random() - 0.5) * 0.3;
            moveX = Math.cos(bot.wanderAngle) * 100;
            moveY = Math.sin(bot.wanderAngle) * 100;
        }

        // 3. NORMALIZE VECTOR (Penting agar gerakan konsisten)
        const len = Math.hypot(moveX, moveY);
        if (len > 0) {
            moveX /= len;
            moveY /= len;
        }

        // 4. WALL GLIDING (Kunci Anti Stuck!)
        // Alih-alih memantul keras, kita "belokkan" vektor jika dekat dinding
        const wallSensor = 150; // Jarak mulai mendeteksi dinding
        
        // Bobot tolakan dinding (Semakin dekat semakin kuat, tapi tidak absolut)
        let wallForceX = 0;
        let wallForceY = 0;

        if (bot.x < wallSensor) wallForceX = 1; // Dorong Kanan
        else if (bot.x > WORLD_SIZE - wallSensor) wallForceX = -1; // Dorong Kiri

        if (bot.y < wallSensor) wallForceY = 1; // Dorong Bawah
        else if (bot.y > WORLD_SIZE - wallSensor) wallForceY = -1; // Dorong Atas

        // GABUNGKAN VEKTOR
        // Jika dekat dinding, vektor dinding mengambil alih sebagian kontrol
        // Ini menciptakan efek "meluncur" (Gliding) sepanjang dinding
        moveX += wallForceX * 1.5; 
        moveY += wallForceY * 1.5;

        // Re-Normalize Final Vector
        const finalLen = Math.hypot(moveX, moveY);
        if (finalLen > 0) {
            moveX /= finalLen;
            moveY /= finalLen;
        }

        // 5. APPLY MOVEMENT
        const botSpeed = (BASE_SPEED * 0.9) / Math.pow(bot.r / 20, 0.45); 
        
        bot.vx = moveX * botSpeed;
        bot.vy = moveY * botSpeed;

        bot.x += bot.vx;
        bot.y += bot.vy;

        // 6. HARD CLAMP (Safety Net Terakhir)
        bot.x = Math.max(bot.r, Math.min(WORLD_SIZE - bot.r, bot.x));
        bot.y = Math.max(bot.r, Math.min(WORLD_SIZE - bot.r, bot.y));
      });

      // --- 3. EATING LOGIC ---
      const handleEating = (eater: GameObject, eaten: GameObject, efficiency: number) => {
        const gainedArea = (Math.PI * eaten.r * eaten.r) * efficiency;
        const currentArea = Math.PI * eater.r * eater.r;
        eater.r = Math.sqrt((currentArea + gainedArea) / Math.PI);
        if (eater.id === 'player') setScore(Math.floor(eater.r));
      };

      // Makan Food
      foods.current = foods.current.filter(f => {
          if (Math.hypot(p.x - f.x, p.y - f.y) < p.r - f.r/2) {
              handleEating(p, f, FOOD_EAT_EFFICIENCY); return false;
          } return true;
      });

      bots.current.forEach(bot => {
        foods.current = foods.current.filter(f => {
            if (Math.hypot(bot.x - f.x, bot.y - f.y) < bot.r - f.r/2) {
                handleEating(bot, f, FOOD_EAT_EFFICIENCY); return false;
            } return true;
        });
      });
      
      // Respawn Food
      while (foods.current.length < FOOD_COUNT) {
        foods.current.push({ id: `food-${Math.random()}`, x: Math.random()*WORLD_SIZE, y: Math.random()*WORLD_SIZE, r: 5+Math.random()*3, color: randomColor() });
      }

      // --- PVP SYSTEM ---
      const allEntities = [p, ...bots.current];
      const deadEntityIds = new Set<string>();
      let playerDiedNow = false;
      let killerName = "";

      allEntities.sort((a, b) => b.r - a.r);

      for (let i = 0; i < allEntities.length; i++) {
          const eater = allEntities[i];
          if (deadEntityIds.has(eater.id)) continue;

          for (let j = i + 1; j < allEntities.length; j++) {
              const eaten = allEntities[j];
              if (deadEntityIds.has(eaten.id)) continue;

              const dist = Math.hypot(eater.x - eaten.x, eater.y - eaten.y);
              
              if (eater.r > eaten.r * SIZE_TO_EAT_RATIO && dist < eater.r - eaten.r * 0.3) {
                  handleEating(eater, eaten, PVP_EAT_EFFICIENCY);
                  deadEntityIds.add(eaten.id);

                  if (eaten.id === 'player') {
                      playerDiedNow = true;
                      killerName = eater.name || "Unknown";
                  }
              }
          }
      }

      bots.current = bots.current.filter(b => !deadEntityIds.has(b.id));

      if (playerDiedNow) {
          triggerGameOver(killerName);
          return; 
      }
      
      // Bot Respawn Logic
      if(bots.current.length < BOT_COUNT) {
         if (Math.random() < 0.05) { 
             const botNames = ["Ayang Galak", "Ayang Manja", "Si Cantik", "Tukang Ngambek", "My Love", "Bebenyu", "Si Pesek", "Mantan", "Gebetan", "Kang Ghosting", "Buaya Darat", "Si Setia"];
             const spawnPos = getSafeSpawnPosition(25);
             
             bots.current.push({
                 id: `bot-respawn-${Math.random()}`, 
                 x: spawnPos.x, 
                 y: spawnPos.y, 
                 r: Math.random()*10 + 20, 
                 color: randomColor(), 
                 vx:0, vy:0, 
                 name: botNames[Math.floor(Math.random() * botNames.length)],
                 wanderAngle: Math.random() * Math.PI * 2
            });
         }
      }

      frameCounterRef.current++;
      if (frameCounterRef.current % 30 === 0) { 
          const sorted = [p, ...bots.current]
            .sort((a, b) => b.r - a.r)
            .slice(0, 5)
            .map(e => ({
                id: e.id,
                name: e.name || "Unknown",
                score: Math.floor(e.r),
                isPlayer: e.id === 'player'
            }));
          setLeaderboard(sorted);
      }
    };

    // >>> DRAW LOGIC <<<
    const drawGame = () => {
        if (isGameOverRef.current) return;
        const p = player.current;
        
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.fillStyle = '#fce7f3';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        
        const camX = screenCenterX - p.x;
        const camY = screenCenterY - p.y;
        
        ctx.translate(camX, camY);

        // Grid
        ctx.strokeStyle = "rgba(0,0,0,0.05)"; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = 0; x <= WORLD_SIZE; x += 100) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_SIZE); }
        for (let y = 0; y <= WORLD_SIZE; y += 100) { ctx.moveTo(0, y); ctx.lineTo(WORLD_SIZE, y); }
        ctx.stroke();
        
        ctx.strokeStyle = "#f43f5e"; ctx.lineWidth = 20;
        ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

        const drawCircle = (obj: GameObject) => {
            ctx.beginPath();
            ctx.arc(obj.x, obj.y, obj.r, 0, Math.PI * 2);
            ctx.fillStyle = obj.color;
            ctx.fill();
            if(obj.id === 'player') {
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.stroke();
                ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = `bold ${Math.max(12, obj.r/2)}px sans-serif`;
                ctx.fillText(obj.name || "Kamu", obj.x, obj.y + obj.r/4);
            } else if (obj.name && obj.r > 20) {
                 ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.textAlign = "center"; ctx.font = `bold ${Math.max(10, obj.r/2.5)}px sans-serif`;
                 ctx.fillText(obj.name, obj.x, obj.y + obj.r/4);
            }
        };

        const renderQueue = [...foods.current, ...bots.current, p].sort((a,b) => a.r - b.r);
        renderQueue.forEach(obj => drawCircle(obj));

        requestRef.current = requestAnimationFrame(() => {
            updateGame();
            drawGame();
        });
    };

    drawGame();

    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [gameOver, resetGameData, isMobile]);

  // --- JOYSTICK ---
  const handleJoystickStart = (e: React.TouchEvent) => {
      if (!joystickBaseRef.current) return;
      const rect = joystickBaseRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      handleJoystickMove(e, centerX, centerY);
      joystickData.current.active = true;
  };
  const handleJoystickMove = (e: React.TouchEvent, centerX?: number, centerY?: number) => {
      if (!joystickBaseRef.current) return;
      if (!centerX || !centerY) {
          const rect = joystickBaseRef.current.getBoundingClientRect();
          centerX = rect.left + rect.width / 2;
          centerY = rect.top + rect.height / 2;
      }
      const touch = e.touches[0];
      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;
      joystickData.current = { dx: deltaX, dy: deltaY, active: true };
      
      const knob = joystickBaseRef.current.firstChild as HTMLDivElement;
      const distance = Math.min(Math.hypot(deltaX, deltaY), 40);
      const angle = Math.atan2(deltaY, deltaX);
      knob.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
  };
  const handleJoystickEnd = () => {
      joystickData.current = { dx: 0, dy: 0, active: false };
      if (joystickBaseRef.current) {
         (joystickBaseRef.current.firstChild as HTMLDivElement).style.transform = 'translate(0px, 0px)';
      }
  };


  return (
    <div className="fixed inset-0 z-[100] bg-pink-100 overflow-hidden touch-none select-none">
      <canvas ref={canvasRef} className="touch-none block w-full h-full" />

      {/* UI HUD: SKOR & LEADERBOARD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none z-10">
        
        {/* LEFT: BUTTON & SCORE */}
        <div className="flex flex-col gap-2">
            <button onClick={onBack} className="bg-white/80 p-2 rounded-full shadow-md pointer-events-auto self-start hover:bg-white transition"><ArrowLeft className="text-pink-600" /></button>
            <div className="flex gap-2">
                <div className="bg-pink-500/90 text-white px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm border-2 border-pink-400">
                    Skor: {score}
                </div>
                <div className="bg-yellow-400/90 text-yellow-900 px-4 py-2 rounded-full font-bold shadow-lg backdrop-blur-sm border-2 border-yellow-300 flex items-center gap-1">
                    <Trophy size={16}/> {highScore}
                </div>
            </div>
        </div>

        {/* RIGHT: LEADERBOARD */}
        <div className="bg-black/20 backdrop-blur-md p-3 rounded-xl border border-white/20 w-48 shadow-xl">
            <h3 className="text-white font-bold text-sm mb-2 flex items-center gap-2 border-b border-white/20 pb-1">
                <Crown size={14} className="text-yellow-300"/> Leaderboard
            </h3>
            <ul className="space-y-1">
                {leaderboard.map((item, index) => (
                    <li key={item.id} className={`flex justify-between items-center text-xs font-bold px-2 py-1 rounded ${item.isPlayer ? "bg-yellow-400 text-yellow-900 animate-pulse" : "text-white"}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            <span className="opacity-70 w-3">{index + 1}.</span>
                            <span className="truncate max-w-[80px]">{item.name}</span>
                            {item.isPlayer && <User size={10}/>}
                        </div>
                        <span>{item.score}</span>
                    </li>
                ))}
                {leaderboard.length === 0 && <li className="text-white/50 text-xs italic">Loading...</li>}
            </ul>
        </div>
      </div>
      
      {/* Instruksi PC */}
      {!isMobile && !gameOver && (
          <div className="absolute bottom-4 left-4 bg-white/60 p-3 rounded-xl text-gray-600 text-sm pointer-events-none backdrop-blur-sm z-10">
              <p className="font-bold text-pink-500 mb-1">Cara Main:</p>
              <ul className="list-disc list-inside">
                  <li>Gerakan Mouse untuk arah</li>
                  <li>Makan dot kecil & musuh kecil</li>
                  <li>Hindari musuh besar!</li>
              </ul>
          </div>
      )}

      {/* MOBILE JOYSTICK */}
      {isMobile && !gameOver && (
        <>
            <div className="absolute bottom-16 right-12 pointer-events-auto z-10"
                ref={joystickBaseRef}
                onTouchStart={handleJoystickStart}
                onTouchMove={handleJoystickMove}
                onTouchEnd={handleJoystickEnd}
            >
                <div className="w-28 h-28 bg-black/10 rounded-full relative flex items-center justify-center backdrop-blur-sm border border-white/40 shadow-lg">
                    <div className="w-12 h-12 bg-pink-500 rounded-full shadow-md transition-transform duration-75 ease-out border-2 border-white"></div>
                </div>
            </div>
             <div className="absolute bottom-6 w-full text-center text-pink-700 text-xs opacity-60 pointer-events-none font-bold z-10">
                 <LocateFixed size={14} className="inline mr-1"/>Analog atau Miringkan HP
             </div>
        </>
      )}

      {/* GAME OVER SCREEN */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in zoom-in duration-300 z-[200]">
          
          <div className="mb-6 relative">
            {isNewRecord && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full font-bold text-sm shadow-lg flex items-center gap-1 whitespace-nowrap animate-bounce">
                    <Crown size={16}/> REKOR BARU!
                </div>
            )}
            <h2 className="text-6xl font-black text-pink-500 font-valentine drop-shadow-[0_4px_0_rgba(255,255,255,1)] stroke-white">YAHHH!</h2>
          </div>

          <p className="text-xl font-medium text-gray-200 mb-2">Kamu dimakan oleh:</p>
          <div className="bg-red-500/20 border border-red-500/50 px-6 py-2 rounded-full text-red-300 font-bold text-lg mb-8">
            ☠️ {eatenBy}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10 w-full max-w-xs">
              <div className="bg-white/10 p-4 rounded-2xl flex flex-col items-center">
                  <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Skor Kamu</span>
                  <span className="text-3xl font-bold text-white">{score}</span>
              </div>
              <div className="bg-yellow-500/20 p-4 rounded-2xl border border-yellow-500/30 flex flex-col items-center">
                  <span className="text-xs text-yellow-300 uppercase font-bold tracking-wider">High Score</span>
                  <span className="text-3xl font-bold text-yellow-400">{highScore}</span>
              </div>
          </div>

          <button onClick={handleRestart} className="group relative bg-gradient-to-r from-pink-500 to-purple-600 w-64 py-4 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-all active:scale-95">
            <span className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <div className="flex items-center justify-center gap-3">
                <RotateCcw size={28} className="group-hover:-rotate-180 transition-transform duration-500"/> 
                MAIN LAGI
            </div>
          </button>
          
          <button onClick={onBack} className="mt-6 text-gray-400 hover:text-white text-sm font-medium hover:underline">
              Kembali ke Dashboard
          </button>
        </div>
      )}
    </div>
  );
}