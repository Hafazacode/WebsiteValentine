"use client";

import { useState, useEffect } from "react";
import NextImage from "next/image"; 
import { X, Circle, RotateCcw, ArrowLeft, User, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Player = "X" | "O" | null;

export default function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); 
  const [winner, setWinner] = useState<Player | "Draw" | null>(null);
  const [gameMode, setGameMode] = useState<"PvP" | "PvE" | null>(null); 

  // --- LOGIC BOT SUPER CERDAS (MINIMAX ALGORITHM) ---
  useEffect(() => {
    if (gameMode === "PvE" && !isXNext && !winner) {
      // Delay dikit biar kelihatan mikir (padahal aslinya cepet bgt)
      const timer = setTimeout(() => {
        const bestMove = getBestMove(board);
        if (bestMove !== -1) {
          handleClick(bestMove, true);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isXNext, winner, gameMode, board]);

  // 1. Fungsi Utama Mencari Langkah Terbaik
  const getBestMove = (currentBoard: Player[]) => {
    let bestScore = -Infinity;
    let move = -1;

    // Cek semua kotak kosong
    for (let i = 0; i < 9; i++) {
      if (currentBoard[i] === null) {
        // Coba jalan di kotak itu
        currentBoard[i] = "O";
        // Hitung skor pakai minimax
        let score = minimax(currentBoard, 0, false);
        // Balikin kotak jadi kosong lagi
        currentBoard[i] = null;

        // Kalau skornya lebih bagus, simpan langkah ini
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  };

  // 2. Algoritma Minimax (Otak AI)
  const minimax = (board: Player[], depth: number, isMaximizing: boolean) => {
    const result = checkWinner(board);
    if (result === "O") return 10 - depth; // Bot Menang (Skor Positif)
    if (result === "X") return depth - 10; // Manusia Menang (Skor Negatif)
    if (result === "Draw") return 0;       // Seri

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "O";
          let score = minimax(board, depth + 1, false);
          board[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = "X";
          let score = minimax(board, depth + 1, true);
          board[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const checkWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], 
      [0, 3, 6], [1, 4, 7], [2, 5, 8], 
      [0, 4, 8], [2, 4, 6]             
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    // Cek Draw
    if (squares.every((square) => square !== null)) return "Draw";
    return null;
  };

  const handleClick = (index: number, isBot = false) => {
    if (board[index] || winner || (gameMode === "PvE" && !isXNext && !isBot)) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);
    
    const gameResult = checkWinner(newBoard);
    if (gameResult) {
      setWinner(gameResult as Player | "Draw"); // Casting tipe biar aman
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  const handleBackToMenu = () => {
    resetGame();
    setGameMode(null);
  };

  // --- RENDER MENU PILIH MODE ---
  if (!gameMode) {
    return (
      <div className="absolute inset-0 z-50 bg-pink-50 flex flex-col items-center justify-center p-6 animate-in zoom-in">
         <button onClick={onBack} className="absolute top-4 left-4 bg-white p-2 rounded-full shadow-md text-gray-500"><ArrowLeft size={24}/></button>
         <h2 className="text-3xl font-bold text-pink-600 mb-2 text-center font-valentine">Tic-Tac-Jidat</h2>
         <p className="text-gray-500 mb-8 text-center text-sm">Main XOXO di atas jidat ayang! 🤣</p>
         
         <div className="space-y-4 w-full max-w-xs">
            <button onClick={() => setGameMode("PvE")} className="w-full bg-white border-2 border-pink-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-pink-400 transition">
                <div className="bg-pink-100 p-3 rounded-full"><Cpu className="text-pink-600"/></div>
                <div className="text-left"><h3 className="font-bold text-gray-700">Lawan Ayang (Bot)</h3><p className="text-xs text-gray-400">Jidatnya pinter lho (Mustahil Menang)</p></div>
            </button>
            <button onClick={() => setGameMode("PvP")} className="w-full bg-white border-2 border-blue-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md hover:border-blue-400 transition">
                <div className="bg-blue-100 p-3 rounded-full"><User className="text-blue-600"/></div>
                <div className="text-left"><h3 className="font-bold text-gray-700">Lawan Teman</h3><p className="text-xs text-gray-400">Gantian hp-nya</p></div>
            </button>
         </div>
      </div>
    );
  }

  // --- RENDER GAMEPLAY ---
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-start overflow-hidden bg-black">
      
      {/* BACKGROUND JIDAT AYANG */}
      <div className="absolute inset-0 z-0">
        <NextImage 
            src="/JidatAyang.jpeg" 
            alt="Jidat Ayang"
            fill
            className="object-contain opacity-80"
            priority
        />
      </div>
      
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[0px]"></div>

      {/* Header Back Button */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
         <button onClick={handleBackToMenu} className="bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/30"><ArrowLeft size={24}/></button>
      </div>

      {/* CONTAINER GAME */}
      {/* HP (Mobile): mt-24 (Tetap)
          PC (Desktop): md:mt-10 (Naik ke atas biar pas di dahi layar lebar) 
      */}
      <div className="z-10 w-full max-w-md px-6 flex flex-col items-center mt-24 md:mt-10">
        
        {/* 1. PAPAN XOXO */}
        <div className="grid grid-cols-3 gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-3xl shadow-2xl border border-white/30">
            {board.map((cell, index) => (
                <button
                    key={index}
                    onClick={() => handleClick(index)}
                    disabled={!!cell || !!winner}
                    className="w-20 h-20 md:w-24 md:h-24 bg-white/25 rounded-xl flex items-center justify-center text-4xl shadow-inner hover:bg-white/40 transition active:scale-95 disabled:cursor-not-allowed"
                >
                    <AnimatePresence>
                        {cell === "X" && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <X size={44} className="text-blue-400 drop-shadow-md" strokeWidth={3} />
                            </motion.div>
                        )}
                        {cell === "O" && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                <Circle size={36} className="text-pink-400 drop-shadow-md" strokeWidth={3} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            ))}
        </div>

        {/* 2. STATUS GILIRAN / WINNER */}
        <div className="mt-8 bg-white/90 backdrop-blur px-6 py-2 rounded-full shadow-xl border-2 border-white flex items-center gap-2">
            {winner ? (
                <span className="font-bold text-pink-600 text-lg">
                    {winner === "Draw" ? "SERI! 😐" : `Pemenangnya: ${winner} 🎉`}
                </span>
            ) : (
                <>
                    <span className="text-gray-500 text-sm font-bold">Giliran:</span>
                    {isXNext ? <X size={20} className="text-blue-500 font-bold"/> : <Circle size={18} className="text-pink-500 font-bold"/>}
                </>
            )}
        </div>

        {/* 3. Tombol Reset */}
        <AnimatePresence>
            {winner && (
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={resetGame}
                    className="mt-4 bg-pink-500 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:bg-pink-600 flex items-center gap-2 active:scale-95 transition"
                >
                    <RotateCcw size={20}/> Main Lagi
                </motion.button>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}