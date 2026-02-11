"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { supabase } from "@/lib/supabaseClient";
import { ArrowLeft, Users, Plus, Play, Copy, CheckCircle, Bot, Swords, AlertTriangle, Heart, RotateCcw } from "lucide-react";

// --- GAMBAR BIDAK CATUR SPESIAL VALENTINE ---
const PIECE_IMAGES: Record<string, string> = {
  'wp': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'wn': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'wb': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'wr': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'wq': '/MyQueen.jpeg', // RATU PUTIH = AYANG
  'wk': '/King.jpeg',    // RAJA PUTIH = KAMU
  'bp': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'bn': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'bb': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'br': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'bq': '/MyQueen.jpeg', // RATU HITAM = AYANG
  'bk': '/King.jpeg',    // RAJA HITAM = KAMU
};

// --- SILUET MASKING UNTUK RAJA DAN RATU ---
const MASK_QUEEN = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12zM9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-21.5-1.5-27 0z"/></svg>')`;
const MASK_KING = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="M22.5 11.63V6M20 8h5M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10.5 5 10.5V37zM11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0"/></svg>')`;

// --- LOGIKA KECERDASAN BUATAN (BOT) ---
const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const evaluateBoard = (chessInstance: Chess) => {
  let totalEvaluation = 0;
  const board = chessInstance.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        let val = pieceValues[piece.type] || 0;
        if (piece.type !== 'k' && piece.type !== 'r') {
          const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
          val += (7 - centerDist) * 5; 
        }
        if (piece.type === 'p') {
          if (piece.color === 'w') val += (7 - r) * 4; 
          if (piece.color === 'b') val += r * 4;       
        }
        if (piece.type === 'k') {
          const centerDist = Math.abs(3.5 - r) + Math.abs(3.5 - c);
          val -= (7 - centerDist) * 5; 
        }
        totalEvaluation += piece.color === 'w' ? val : -val;
      }
    }
  }
  return totalEvaluation;
};

const minimax = (chessInstance: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number => {
  if (depth === 0 || chessInstance.isGameOver()) return evaluateBoard(chessInstance);
  const moves = chessInstance.moves();
  if (isMaximizingPlayer) {
    let bestVal = -Infinity;
    for (let move of moves) {
      chessInstance.move(move);
      bestVal = Math.max(bestVal, minimax(chessInstance, depth - 1, alpha, beta, false));
      chessInstance.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (let move of moves) {
      chessInstance.move(move);
      bestVal = Math.min(bestVal, minimax(chessInstance, depth - 1, alpha, beta, true));
      chessInstance.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
};

const getBestMove = (chessInstance: Chess, depth: number, botColor: "w" | "b") => {
  const moves = chessInstance.moves();
  if (moves.length === 0) return null;
  let bestMoves: string[] = [];
  let bestVal = botColor === "w" ? -Infinity : Infinity; 
  for (let move of moves) {
    chessInstance.move(move);
    const isMaximizingNext = botColor === "b"; 
    const boardVal = minimax(chessInstance, depth - 1, -Infinity, Infinity, isMaximizingNext);
    chessInstance.undo();
    if (botColor === "w") {
      if (boardVal > bestVal) { bestVal = boardVal; bestMoves = [move]; }
      else if (boardVal === bestVal) bestMoves.push(move);
    } else {
      if (boardVal < bestVal) { bestVal = boardVal; bestMoves = [move]; }
      else if (boardVal === bestVal) bestMoves.push(move);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
};

export default function ChessGame({ onBack }: { onBack: () => void }) {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen()); 
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null);
  const [status, setStatus] = useState<"menu" | "playing">("menu");
  const [gameMode, setGameMode] = useState<"multiplayer" | "bot" | null>(null);
  const [botDifficulty, setBotDifficulty] = useState<"cupu" | "standar" | "jago">("standar");
  const [botPlayerColor, setBotPlayerColor] = useState<"white" | "black">("white"); 
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState("");

  // KUNCI MULTIPLAYER: useRef ini bakal menyimpan data FEN terbaru 
  // tanpa harus me-restart useEffect Supabase!
  const fenRef = useRef(fen);
  useEffect(() => {
    fenRef.current = fen;
  }, [fen]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000); 
  };

  useEffect(() => {
    if (status !== "playing") return;
    if (game.isGameOver()) {
      setIsGameOver(true);
      if (game.isCheckmate()) {
        const winner = game.turn() === "w" ? "Peach" : "Putih";
        setGameResultMsg(`SKAKMAT! Tim ${winner} Menang! 🎉`);
      } else if (game.isDraw() || game.isStalemate()) {
        setGameResultMsg("Seri! Pertandingan imbang 🤝");
      } else {
        setGameResultMsg("Game Over!");
      }
    } else {
      setIsGameOver(false);
    }
  }, [fen, status, game]);

  // --- MULTIPLAYER SYNC (DIJAMIN LANCAR) ---
  useEffect(() => {
    if (!roomCode || status !== "playing" || gameMode !== "multiplayer") return;
    
    const channel = supabase
      .channel(`room-${roomCode}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chess_rooms", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const newFen = payload.new.fen;
          // Cek menggunakan FEN REF, bukan State FEN!
          // Supaya tidak terjadi looping dan miss connection
          if (newFen && newFen !== fenRef.current) {
            try {
              const newGameInstance = new Chess(newFen);
              setGame(newGameInstance);
              setFen(newFen);
            } catch (err) { }
          }
        }
      ).subscribe();
      
    // Di sini kita HAPUS `game.fen()` dari dependency array!
    // Ini yg bikin error sebelumnya! Sekarang channelnya hidup terus!
    return () => { supabase.removeChannel(channel); };
  }, [roomCode, status, gameMode]); 

  // --- BOT SYNC ---
  useEffect(() => {
    if (status !== "playing" || gameMode !== "bot" || game.isGameOver()) return;
    const currentTurnColor = game.turn() === "w" ? "white" : "black";
    if (currentTurnColor !== playerColor) {
      const timer = setTimeout(() => {
        const gameCopy = new Chess(game.fen());
        const possibleMoves = gameCopy.moves();
        if (possibleMoves.length === 0) return;
        let selectedMove;
        try {
          if (botDifficulty === "cupu") {
            selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          } else {
            const depth = botDifficulty === "jago" ? 4 : 3;
            selectedMove = getBestMove(gameCopy, depth, gameCopy.turn());
          }
          if (selectedMove) {
            gameCopy.move(selectedMove);
            setGame(gameCopy);
            setFen(gameCopy.fen());
          }
        } catch (err) {
          selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
          gameCopy.move(selectedMove);
          setGame(gameCopy);
          setFen(gameCopy.fen());
        }
      }, 500); 
      return () => clearTimeout(timer);
    }
  }, [fen, status, gameMode, botDifficulty, playerColor]);

  const resetGame = () => {
    const newG = new Chess();
    setGame(newG);
    setFen(newG.fen());
    setSelectedSquare(null);
    setIsGameOver(false);
    if (gameMode === "multiplayer") {
      supabase.from("chess_rooms").update({ fen: newG.fen() }).eq("room_code", roomCode).then();
    }
  };

  const createRoom = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const newGame = new Chess();
    setGame(newGame);
    setFen(newGame.fen());
    const { error } = await supabase.from("chess_rooms").insert([{ room_code: code, fen: newGame.fen() }]);
    if (!error) {
      setRoomCode(code);
      setGameMode("multiplayer");
      setPlayerColor("white");
      setStatus("playing");
      setSelectedSquare(null);
      setIsGameOver(false);
    } else {
      showError("Gagal bikin room!");
    }
  };

  const joinRoom = async () => {
    if (!inputCode) return showError("Isi kode dulu.");
    const { data, error } = await supabase.from("chess_rooms").select("*").eq("room_code", inputCode).single();
    if (data && !error) {
      setRoomCode(inputCode);
      setGameMode("multiplayer");
      setPlayerColor("black");
      setSelectedSquare(null);
      setIsGameOver(false);
      try {
        const newG = new Chess(data.fen);
        setGame(newG);
        setFen(newG.fen());
      } catch (e) {
        setGame(new Chess());
      }
      setStatus("playing");
    } else {
      showError("Room tidak ditemukan.");
    }
  };

  const startBotMatch = () => {
    const newG = new Chess();
    setGame(newG);
    setFen(newG.fen());
    setGameMode("bot");
    setPlayerColor(botPlayerColor); 
    setSelectedSquare(null);
    setIsGameOver(false);
    setStatus("playing");
  };

  const handleSquareClick = (squareId: string) => {
    if (isGameOver) return;
    const currentTurnChar = game.turn(); 
    const playerTurnChar = playerColor === "white" ? "w" : "b";

    if (currentTurnChar !== playerTurnChar) {
      showError("Sabar sayang! Belum giliran kamu jalan 😡");
      return;
    }

    if (!selectedSquare) {
      const piece = game.get(squareId as any);
      if (piece && piece.color === playerTurnChar) {
        setSelectedSquare(squareId); 
      }
      return;
    }

    const clickedPiece = game.get(squareId as any);
    if (clickedPiece && clickedPiece.color === playerTurnChar) {
      setSelectedSquare(squareId);
      return;
    }

    const gameCopy = new Chess(game.fen());
    let move = null;
    try {
      move = gameCopy.move({ from: selectedSquare, to: squareId, promotion: 'q' });
    } catch (e) {
      try { move = gameCopy.move({ from: selectedSquare, to: squareId }); } catch (e2) {}
    }

    if (move) {
      setGame(gameCopy);
      setFen(gameCopy.fen());
      setSelectedSquare(null);
      
      if (gameMode === "multiplayer") {
        supabase.from("chess_rooms").update({ fen: gameCopy.fen() }).eq("room_code", roomCode).then();
      }
    } else {
      showError("Gerakan dilarang sayang! 🤨");
      setSelectedSquare(null);
    }
  };

  const renderCustomBoard = () => {
    const ranks = playerColor === 'black' ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
    const files = playerColor === 'black' ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];

    return (
      <div className="relative w-full max-w-[360px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-[#FBCB9E] mx-auto">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply bg-[#FFF5EC]" style={{ backgroundImage: "url('/Oktober.jpeg')", filter: "blur(2px)" }} />
        <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 bg-white/20 backdrop-blur-sm">
          {ranks.map((rank, rowIndex) => files.map((file, colIndex) => {
              const squareId = file + rank;
              const piece = game.get(squareId as any);
              const isDark = (rowIndex + colIndex) % 2 !== 0; 
              const isSelected = selectedSquare === squareId; 
              
              let squareBg = isDark ? 'bg-[#FFCC99]/80' : 'bg-[#FFF5EC]/60';
              if (isSelected) squareBg = 'bg-orange-400/70 ring-inset ring-4 ring-orange-500 shadow-inner';

              return (
                <div key={squareId} onClick={() => handleSquareClick(squareId)} className={`flex items-center justify-center relative cursor-pointer transition-colors duration-200 ${squareBg}`}>
                  <AnimatePresence>
                    {piece && (
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="w-full h-full flex items-center justify-center relative z-10 p-1">
                        {(piece.type === 'q' || piece.type === 'k') ? (
                          <div className="relative w-[85%] h-[85%] flex items-center justify-center">
                            <div className="absolute -top-3 z-20 text-[10px] md:text-xs drop-shadow-md">{piece.type === 'k' ? '♔' : '♕'}</div>
                            <div 
                              className={`w-full h-full rounded-full bg-cover bg-center border-2 shadow-[0_4px_6px_rgba(0,0,0,0.3)]
                                ${piece.color === 'w' ? 'border-white shadow-white/30' : 'border-[#FBCB9E] shadow-orange-900/50 filter brightness-90 saturate-150'}`}
                              style={{ backgroundImage: `url(${PIECE_IMAGES[`${piece.color}${piece.type}`]})` }}
                            />
                          </div>
                        ) : (
                          <img 
                            src={PIECE_IMAGES[`${piece.color}${piece.type}`]} 
                            className={`w-[85%] h-[85%] object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.5)] ${piece.color === 'b' ? 'filter invert(85%) sepia(20%) saturate(1000%) hue-rotate(335deg) brightness(105%) contrast(100%)' : ''}`} 
                            alt={piece.type}
                          />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isSelected && <Heart className="absolute text-orange-600/40 w-full h-full p-2" />}
                </div>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {isGameOver && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="bg-white p-6 rounded-2xl shadow-2xl text-center border-4 border-[#FBCB9E] w-[85%]">
                <h3 className="text-xl font-black text-gray-800 mb-2">{gameResultMsg}</h3>
                <p className="text-gray-500 text-xs mb-6 font-bold">Permainan Selesai.</p>
                <button onClick={resetGame} className="bg-orange-400 hover:bg-orange-500 text-white w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition active:scale-95 shadow-md"><RotateCcw size={18} /> Main Lagi</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col items-center justify-start p-2 md:p-6 bg-orange-50/10 backdrop-blur-md rounded-2xl w-full overflow-y-auto z-50 no-scrollbar">
      <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-orange-100 rounded-full shadow hover:bg-orange-200 text-orange-600 z-50"><ArrowLeft size={20} /></button>
      <AnimatePresence>
        {errorMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[999] bg-orange-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-sm border-2 border-white min-w-max">
            <AlertTriangle size={18} /> {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-2xl font-bold text-orange-500 mt-12 mb-6 text-center flex items-center gap-2 tracking-wide uppercase italic">
        <Heart className="text-orange-600" fill="currentColor"/> Catur Peach
      </h2>

      {status === "menu" ? (
        <div className="w-full max-w-sm flex flex-col gap-6 pb-10">
          <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-100 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2"><Bot className="text-orange-500" size={24} /><h3 className="font-bold text-gray-700">Lawan Komputer</h3></div>
            <div className="flex gap-2">
              {(["cupu", "standar", "jago"] as const).map((lvl) => (
                <button key={lvl} onClick={() => setBotDifficulty(lvl)} className={`flex-1 py-2 text-[10px] font-black rounded-xl capitalize border-2 transition-all ${botDifficulty === lvl ? 'bg-orange-50 border-orange-400 text-orange-600' : 'bg-white border-orange-100 text-gray-400 hover:border-orange-200'}`}>{lvl.toUpperCase()}</button>
              ))}
            </div>
            <div className="flex gap-2 bg-orange-50 p-1.5 rounded-xl border border-orange-100">
              <button onClick={() => setBotPlayerColor("white")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${botPlayerColor === 'white' ? 'bg-white text-orange-600 shadow border border-orange-200' : 'text-orange-300 hover:text-orange-400'}`}>Tim Ayang ⚪</button>
              <button onClick={() => setBotPlayerColor("black")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${botPlayerColor === 'black' ? 'bg-orange-600 text-white shadow' : 'text-orange-300 hover:text-orange-400'}`}>Tim Kamu 🍑</button>
            </div>
            <button onClick={startBotMatch} className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition mt-1"><Play size={18} fill="currentColor"/> Main Sekarang!</button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-orange-200"></div>
            <span className="flex-shrink-0 mx-4 text-orange-300 text-xs font-bold">ATAU ONLINE</span>
            <div className="flex-grow border-t border-orange-200"></div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-100 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2"><Users className="text-orange-500" size={24} /><h3 className="font-bold text-gray-700">Mabar Sama Ayang</h3></div>
            <button onClick={createRoom} className="bg-orange-50 hover:bg-orange-100 text-orange-600 p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition active:scale-95 border border-orange-100"><Plus size={18} /> Bikin Room Baru</button>
            <div className="flex gap-2 mt-1">
              <input type="text" placeholder="KODE" className="flex-1 p-3 bg-orange-50 rounded-xl border border-orange-100 text-center font-mono uppercase font-bold text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())}/>
              <button onClick={joinRoom} className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition">Masuk</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-[400px] flex flex-col items-center gap-4 pb-20">
          <div className="w-full bg-white p-3 rounded-2xl shadow-md border border-orange-100 flex items-center justify-between px-5">
             <div className="flex items-center gap-2">
               {gameMode === "multiplayer" ? <Users size={16} className="text-orange-400"/> : <Bot size={16} className="text-orange-400" />}
               <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{gameMode === "multiplayer" ? roomCode : botDifficulty}</span>
             </div>
             {gameMode === "multiplayer" && (
                <button onClick={copyCode} className="text-orange-400 hover:text-orange-600">
                  {copied ? <CheckCircle size={18} className="text-green-500" /> : <Copy size={18} />}
                </button>
             )}
          </div>

          {renderCustomBoard()}

          <div className="flex gap-3 w-full px-2">
            <div className="flex-1 bg-white p-3 rounded-2xl shadow-sm border border-orange-100 text-center flex flex-col justify-center">
              <span className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Tim Kamu</span>
              <span className="font-bold text-xs text-orange-500">{playerColor === 'white' ? 'Putih (Ayang)' : 'Peach (Kamu)'}</span>
            </div>
            <div className={`flex-1 p-3 rounded-2xl shadow-sm border text-center flex flex-col justify-center transition-colors ${game.turn() === (playerColor === 'white' ? 'w' : 'b') ? 'bg-orange-100 border-orange-300' : 'bg-white border-orange-100'}`}>
              <span className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Giliran</span>
              <span className="font-bold text-xs text-gray-800">
                {game.isGameOver() ? 'Selesai' : (game.turn() === 'w' ? 'Tim Putih' : 'Tim Peach')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}