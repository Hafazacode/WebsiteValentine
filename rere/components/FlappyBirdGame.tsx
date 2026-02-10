"use client";

import { useEffect, useRef, useState } from "react";
import { X, RotateCcw, Trophy } from "lucide-react";

export default function FlappyBirdGame({ onBack }: { onBack: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game Constants
  const GRAVITY = 0.6;
  const JUMP = -8;
  const PIPE_SPEED = 3;
  const PIPE_SPAWN_RATE = 100; // Frames

  useEffect(() => {
    // Load highscore dari local storage saat pertama buka
    const saved = localStorage.getItem("flappyHighScore");
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size sesuai layar HP agar tajam
    const resizeCanvas = () => {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let animationFrameId: number;
    let frames = 0;

    // Game State Refs (Use refs for mutable game data to avoid re-renders)
    let bird = { x: 50, y: canvas.height / 2, velocity: 0, radius: 15 };
    let pipes: { x: number; width: number; gap: number; topHeight: number; passed: boolean }[] = [];
    
    // Reset Game Logic
    const resetGame = () => {
        bird = { x: 50, y: canvas.height / 2, velocity: 0, radius: 15 };
        pipes = [];
        frames = 0;
        setScore(0);
        setIsGameOver(false);
        setIsPlaying(true);
    };

    if (isPlaying && !isGameOver) {
        // --- GAME LOOP ---
        const loop = () => {
            frames++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // 1. Draw Background (Langit)
            ctx.fillStyle = "#70c5ce"; // Warna khas flappy bird
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // 2. Physics Bird
            bird.velocity += GRAVITY;
            bird.y += bird.velocity;

            // Draw Bird
            ctx.fillStyle = "#FFD700"; // Kuning
            ctx.beginPath();
            ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Mata burung (biar lucu)
            ctx.fillStyle = "#000";
            ctx.beginPath();
            ctx.arc(bird.x + 8, bird.y - 5, 2, 0, Math.PI * 2);
            ctx.fill();

            // 3. Logic Pipes
            if (frames % PIPE_SPAWN_RATE === 0) {
                const gap = 150; // Jarak antar pipa atas bawah
                const minHeight = 50;
                const maxHeight = canvas.height - gap - minHeight;
                const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
                
                pipes.push({
                    x: canvas.width,
                    width: 50,
                    gap: gap,
                    topHeight: topHeight,
                    passed: false
                });
            }

            for (let i = 0; i < pipes.length; i++) {
                const p = pipes[i];
                p.x -= PIPE_SPEED;

                // Draw Top Pipe
                ctx.fillStyle = "#73BF2E";
                ctx.fillRect(p.x, 0, p.width, p.topHeight);
                ctx.strokeStyle = "#558c22"; // Border pipa
                ctx.lineWidth = 2;
                ctx.strokeRect(p.x, 0, p.width, p.topHeight);

                // Draw Bottom Pipe
                const bottomY = p.topHeight + p.gap;
                const bottomHeight = canvas.height - bottomY;
                ctx.fillRect(p.x, bottomY, p.width, bottomHeight);
                ctx.strokeRect(p.x, bottomY, p.width, bottomHeight);

                // Collision Detection (Tabrakan)
                // Cek Tanah & Atap
                if (bird.y + bird.radius >= canvas.height || bird.y - bird.radius <= 0) {
                    endGame();
                }

                // Cek Pipa
                if (
                    bird.x + bird.radius > p.x && 
                    bird.x - bird.radius < p.x + p.width && 
                    (bird.y - bird.radius < p.topHeight || bird.y + bird.radius > bottomY)
                ) {
                    endGame();
                }

                // Score Check
                if (p.x + p.width < bird.x && !p.passed) {
                    setScore(prev => prev + 1);
                    p.passed = true;
                }
            }

            // Remove pipes off screen
            if (pipes.length > 0 && pipes[0].x < -50) {
                pipes.shift();
            }

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
        
        // Cek Highscore manual karena state highscore mungkin belum update di dalam closure
        const currentHigh = parseInt(localStorage.getItem("flappyHighScore") || "0");
        if (score > currentHigh) { // Note: score disini closure lama, tapi kita handle di useEffect score change atau logic render
             // Di canvas agak tricky sync state, jadi kita update di render cycle berikutnya via state isGameOver
        }
    };

    // Input Handler (Tap / Click)
    const handleInput = (e: any) => {
        e.preventDefault(); // Mencegah scrolling di HP
        if (!isPlaying && !isGameOver) {
            resetGame();
        } else if (isPlaying) {
            bird.velocity = JUMP;
        }
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

  // Update Highscore ketika score berubah dan game over
  useEffect(() => {
    if (isGameOver) {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem("flappyHighScore", score.toString());
        }
    }
  }, [isGameOver, score, highScore]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 absolute inset-0 z-50">
        {/* Header UI */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
            <button onClick={onBack} className="bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/30">
                <X size={24}/>
            </button>
        </div>
        
        <div className="absolute top-4 right-4 z-10 text-white font-bold text-xl drop-shadow-md">
            Score: {score}
        </div>

        {/* Canvas Game Area */}
        <canvas 
            ref={canvasRef} 
            className="w-full h-full max-w-md bg-[#70c5ce] shadow-2xl block touch-none"
        />

        {/* Overlay Menu Start / Game Over */}
        {(!isPlaying) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                <div className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-xs w-full mx-4 animate-in zoom-in">
                    {isGameOver ? (
                        <>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">YAH KENA! 😭</h2>
                            <div className="flex justify-center items-center gap-2 mb-4 text-orange-500 font-bold">
                                <Trophy size={20}/> High Score: {highScore}
                            </div>
                            <p className="text-gray-500 mb-6 text-sm">Skor kamu: <span className="text-2xl font-bold text-pink-500">{score}</span></p>
                            <button 
                                onClick={() => { setIsGameOver(false); setIsPlaying(true); setScore(0); }} 
                                className="w-full bg-pink-500 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-pink-600 transition flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={20}/> Coba Lagi
                            </button>
                        </>
                    ) : (
                        <>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Flappy Love 🐦</h2>
                            <p className="text-gray-500 mb-6 text-sm">Tap layar buat terbang. Jangan nabrak pipa ya sayang!</p>
                            <button 
                                onClick={() => setIsPlaying(true)} 
                                className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition"
                            >
                                MULAI MAIN
                            </button>
                        </>
                    )}
                </div>
            </div>
        )}
    </div>
  );
}