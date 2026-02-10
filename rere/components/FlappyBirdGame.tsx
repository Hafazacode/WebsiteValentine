"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Trophy } from "lucide-react";

export default function FlappyBirdGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const birdImg = useRef<HTMLImageElement | null>(null); // Ref untuk gambar ayang
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game Constants
  const GRAVITY = 0.5; // Sedikit lebih ringan agar lebih "smooth"
  const JUMP = -7;
  const PIPE_SPEED = 2.5;
  const PIPE_SPAWN_RATE = 110; 

  // 1. Preload Gambar Ayang
  useEffect(() => {
    const img = new Image();
    img.src = "/FlappyRere.jpeg"; // Pastikan file ini ada di folder public
    img.onload = () => {
      birdImg.current = img;
    };
    
    const saved = localStorage.getItem("flappyHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;
    let frames = 0;

    // Inisialisasi posisi (Radius diperbesar dikit biar wajah keliatan)
    let bird = { x: 50, y: canvas.height / 2, velocity: 0, radius: 25 };
    let pipes: { x: number; width: number; gap: number; topHeight: number; passed: boolean }[] = [];
    
    const resetGame = () => {
        bird = { x: 50, y: canvas.height / 2, velocity: 0, radius: 25 };
        pipes = [];
        frames = 0;
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
    };

    if (isPlaying && !isGameOver) {
        const loop = () => {
            frames++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // --- 1. Draw Background ---
            ctx.fillStyle = "#ffdeeb"; // Pink soft biar romantis
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // --- 2. Physics & Draw Bird (Wajah Ayang) ---
            bird.velocity += GRAVITY;
            bird.y += bird.velocity;

            if (birdImg.current) {
                ctx.save();
                // Bikin clipping bulat
                ctx.beginPath();
                ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();

                // Gambar wajah
                ctx.drawImage(
                    birdImg.current, 
                    bird.x - bird.radius, 
                    bird.y - bird.radius, 
                    bird.radius * 2, 
                    bird.radius * 2
                );
                ctx.restore();

                // Border bulat putih
                ctx.strokeStyle = "#fff";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
                ctx.stroke();
            }

            // --- 3. Logic Pipes (Rintangan) ---
            if (frames % PIPE_SPAWN_RATE === 0) {
                const gap = 160; 
                const minHeight = 50;
                const maxHeight = canvas.height - gap - minHeight;
                const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
                
                pipes.push({ x: canvas.width, width: 60, gap: gap, topHeight: topHeight, passed: false });
            }

            for (let i = 0; i < pipes.length; i++) {
                const p = pipes[i];
                p.x -= PIPE_SPEED;

                // Warna Pipa Pink Tua
                ctx.fillStyle = "#ff85a2";
                ctx.fillRect(p.x, 0, p.width, p.topHeight);
                const bottomY = p.topHeight + p.gap;
                ctx.fillRect(p.x, bottomY, p.width, canvas.height - bottomY);

                // Collision Check
                if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) endGame();
                if (
                    bird.x + bird.radius > p.x && 
                    bird.x - bird.radius < p.x + p.width && 
                    (bird.y - bird.radius < p.topHeight || bird.y + bird.radius > bottomY)
                ) {
                    endGame();
                }

                // Score
                if (p.x + p.width < bird.x && !p.passed) {
                    setScore(prev => prev + 1);
                    p.passed = true;
                }
            }

            pipes = pipes.filter(p => p.x > -100);

            if (!isGameOver) {
                animationFrameId = requestAnimationFrame(loop);
            }
        };
        loop();
    }

    const endGame = () => {
        setIsGameOver(true);
        setIsPlaying(false);
        cancelAnimationFrame(animationFrameId);
    };

    const handleInput = (e: any) => {
        e.preventDefault();
        if (!isPlaying && !isGameOver) resetGame();
        else if (isPlaying) bird.velocity = JUMP;
    };

    canvas.addEventListener("mousedown", handleInput);
    canvas.addEventListener("touchstart", handleInput, { passive: false });

    return () => {
        window.removeEventListener("resize", resizeCanvas);
        canvas.removeEventListener("mousedown", handleInput);
        canvas.removeEventListener("touchstart", handleInput);
        cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (isGameOver && score > highScore) {
        setHighScore(score);
        localStorage.setItem("flappyHighScore", score.toString());
    }
  }, [isGameOver, score, highScore]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 absolute inset-0 z-50 overflow-hidden">
        <div className="absolute top-4 left-4 z-10">
            <button onClick={onBack} className="bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/30">
                <X size={24}/>
            </button>
        </div>
        
        <div className="absolute top-6 w-full text-center z-10 pointer-events-none">
            <span className="bg-white/80 px-4 py-1 rounded-full font-black text-pink-600 shadow-lg border border-white">
                SCORE: {score}
            </span>
        </div>

        <canvas ref={canvasRef} className="w-full h-full max-w-md bg-[#ffdeeb] block touch-none shadow-2xl"/>

        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-500/20 backdrop-blur-sm z-20">
                <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-xs w-full mx-4 border-4 border-pink-200">
                    {isGameOver ? (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <RotateCcw size={40} className="text-red-500"/>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-1">YAH JATUH!</h2>
                            <p className="text-gray-400 text-sm mb-4 italic">Semangat ya sayang...</p>
                            <div className="bg-pink-50 p-4 rounded-2xl mb-6">
                                <p className="text-xs text-pink-400 font-bold uppercase">High Score</p>
                                <p className="text-3xl font-black text-pink-600">{highScore}</p>
                            </div>
                            <button onClick={() => {setIsGameOver(false); setIsPlaying(true); setScore(0);}} 
                                className="w-full bg-pink-500 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-pink-600 flex items-center justify-center gap-2 active:scale-95 transition">
                                MAIN LAGI
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="w-24 h-24 rounded-full border-4 border-pink-500 overflow-hidden mx-auto mb-6 shadow-xl">
                                <img src="/FlappyRere.jpeg" alt="Ayang" className="w-full h-full object-cover" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">Flappy Rere</h2>
                            <p className="text-gray-500 mb-8 text-sm">Bantu wajah manis ini terbang tinggi ya! ☁️</p>
                            <button onClick={() => setIsPlaying(true)} 
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition">
                                MULAI TERBANG
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}