"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chess } from "chess.js";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeft, Users, Plus, Play, Copy, CheckCircle, 
  Bot, Swords, AlertTriangle, Heart, RotateCcw, 
  Wifi, WifiOff, Loader2, RefreshCw
} from "lucide-react";

// --- GAMBAR BIDAK CATUR SPESIAL VALENTINE ---
const PIECE_IMAGES: Record<string, string> = {
  'wp': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
  'wn': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
  'wb': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
  'wr': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
  'wq': '/MyQueen.jpeg', 
  'wk': '/King.jpeg',    
  'bp': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
  'bn': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
  'bb': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
  'br': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
  'bq': '/MyQueen.jpeg', 
  'bk': '/King.jpeg',    
};

// --- PST (Positional Square Tables) untuk Bot ---
const pst_pawn = [
    [0,  0,  0,  0,  0,  0,  0,  0], [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10], [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0], [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5], [0,  0,  0,  0,  0,  0,  0,  0]
];
const pst_knight = [
    [-50,-40,-30,-30,-30,-30,-40,-50], [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30], [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30], [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40], [-50,-40,-30,-30,-30,-30,-40,-50]
];
const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const evaluateBoard = (chessInstance: Chess) => {
  let totalEvaluation = 0;
  const board = chessInstance.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) {
        let val = pieceValues[p.type];
        if (p.type === 'p') val += (p.color === 'w' ? pst_pawn[r][c] : pst_pawn[7-r][c]);
        if (p.type === 'n') val += (p.color === 'w' ? pst_knight[r][c] : pst_knight[7-r][c]);
        totalEvaluation += p.color === 'w' ? val : -val;
      }
    }
  }
  return totalEvaluation;
};

// --- MINIMAX ---
const minimax = (game: Chess, depth: number, alpha: number, beta: number, isMax: boolean): number => {
  if (depth === 0 || game.isGameOver()) return evaluateBoard(game);
  const moves = game.moves();
  if (isMax) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
};

const getBestMove = (game: Chess, depth: number) => {
  const moves = game.moves();
  if (moves.length === 0) return null;
  const isWhite = game.turn() === 'w';
  let bestVal = isWhite ? -Infinity : Infinity;
  let bestMove = moves[0];
  
  for (const move of moves) {
    game.move(move);
    const val = minimax(game, depth - 1, -Infinity, Infinity, !isWhite);
    game.undo();
    if (isWhite ? val > bestVal : val < bestVal) {
      bestVal = val;
      bestMove = move;
    }
  }
  return bestMove;
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResultMsg, setGameResultMsg] = useState("");
  const [copied, setCopied] = useState(false);
  
  // -- STATES BARU UNTUK STABILITAS --
  const [isOnline, setIsOnline] = useState(true);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const gameRef = useRef(game);
  const fenRef = useRef(fen);
  
  // Ref untuk timer bot
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync Ref
  useEffect(() => { 
    fenRef.current = fen; 
    gameRef.current = game; 
  }, [fen, game]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 3000);
  };

  const updateGameLocal = useCallback((newFen: string, updateDb: boolean = false) => {
    if (newFen === fenRef.current) return;

    try {
      const newG = new Chess(newFen);
      setGame(newG);
      setFen(newFen);
      
      if (updateDb && gameMode === "multiplayer" && roomCode) {
        supabase.from("chess_rooms").update({ fen: newFen }).eq("room_code", roomCode).then(({ error }) => {
            if (error) setIsOnline(false);
            else setIsOnline(true);
        });
      }
    } catch (e) { console.error("Invalid FEN:", e); }
  }, [gameMode, roomCode]);

  // --- 1. POLLING AGRESIF (1 Detik) ---
  useEffect(() => {
    if (gameMode !== "multiplayer" || status !== "playing" || !roomCode) return;

    // Fungsi Fetch Manual
    const fetchLatestState = async () => {
        const { data, error } = await supabase.from("chess_rooms").select("fen").eq("room_code", roomCode).single();
        if (!error && data && data.fen !== fenRef.current) {
            updateGameLocal(data.fen, false);
            setIsOnline(true);
        } else if (error) {
            setIsOnline(false);
        }
    };

    // Jalankan segera saat mount
    fetchLatestState();

    // Jalankan interval setiap 1 detik (sangat cepat)
    const interval = setInterval(fetchLatestState, 1000);

    // Event listener saat user balik ke tab browser (Force Refresh)
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') fetchLatestState();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [roomCode, status, gameMode, updateGameLocal]);

  // --- 2. MULTIPLAYER REALTIME (UTAMA) ---
  useEffect(() => {
    if (!roomCode || status !== "playing" || gameMode !== "multiplayer") return;

    const channel = supabase.channel(`room-${roomCode}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chess_rooms", filter: `room_code=eq.${roomCode}` },
        (payload) => {
          const remoteFen = payload.new.fen;
          if (remoteFen && remoteFen !== fenRef.current) {
            updateGameLocal(remoteFen, false);
          }
        }
      ).subscribe((status) => {
        setIsOnline(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [roomCode, status, gameMode, updateGameLocal]);

  // --- GAME OVER CHECK ---
  useEffect(() => {
    if (status !== "playing") return;
    if (game.isGameOver()) {
      setIsGameOver(true);
      if (game.isCheckmate()) {
        const winner = game.turn() === "w" ? "Peach" : "Putih";
        setGameResultMsg(`SKAKMAT! Tim ${winner} Menang! 🎉`);
      } else {
        setGameResultMsg("Permainan Seri! 🤝");
      }
    } else {
      setIsGameOver(false);
    }
  }, [fen, status, game]);

  // --- BOT LOGIC ---
  useEffect(() => {
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  }, []);

  useEffect(() => {
    if (status !== "playing" || gameMode !== "bot" || game.isGameOver()) return;
    
    const currentTurnColor = game.turn() === "w" ? "white" : "black";
    const isBotTurn = currentTurnColor !== playerColor;

    if (!isBotTurn || isBotThinking) return;

    setIsBotThinking(true);

    botTimerRef.current = setTimeout(() => {
        const gameCopy = new Chess(fenRef.current);
        const depth = botDifficulty === "jago" ? 3 : (botDifficulty === "standar" ? 2 : 1);
        let move;
        try {
            move = botDifficulty === "cupu" 
              ? gameCopy.moves()[Math.floor(Math.random() * gameCopy.moves().length)]
              : getBestMove(gameCopy, depth);
        } catch (e) {
            const moves = gameCopy.moves();
            move = moves[Math.floor(Math.random() * moves.length)];
        }
        
        if (move) {
          gameCopy.move(move);
          setGame(gameCopy);
          setFen(gameCopy.fen());
        }
        setIsBotThinking(false);
    }, 500); 

  }, [fen, status, gameMode, botDifficulty, playerColor, isBotThinking]); 

  // --- ROOM SETUP ---
  const cleanUpOldRooms = async () => {
      const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();
      await supabase.from("chess_rooms").delete().lt("created_at", tenHoursAgo);
  };

  const createRoom = async () => {
    await cleanUpOldRooms();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const newG = new Chess();
    const { error } = await supabase.from("chess_rooms").insert([{ room_code: code, fen: newG.fen() }]);
    
    if (!error) {
      setRoomCode(code);
      setGameMode("multiplayer");
      setPlayerColor("white");
      setStatus("playing");
      setGame(newG);
      setFen(newG.fen());
    } else showError("Gagal bikin room! Cek koneksi.");
  };

  const joinRoom = async () => {
    if (!inputCode) return showError("Isi kode dulu.");
    const { data, error } = await supabase.from("chess_rooms").select("*").eq("room_code", inputCode).single();
    if (data && !error) {
      setRoomCode(inputCode);
      setGameMode("multiplayer");
      setPlayerColor("black");
      updateGameLocal(data.fen);
      setStatus("playing");
    } else showError("Room tidak ditemukan / Kadaluarsa.");
  };

  const startBotMatch = () => {
    const newG = new Chess();
    setGame(newG);
    setFen(newG.fen());
    setGameMode("bot");
    setPlayerColor(botPlayerColor); 
    setStatus("playing");
    setIsBotThinking(false);
  };

  const handleSquareClick = (squareId: string) => {
    if (isGameOver || isBotThinking) return; 
    
    const playerTurnChar = playerColor === "white" ? "w" : "b";
    
    if (gameMode === "multiplayer" && game.turn() !== playerTurnChar) {
      showError("Sabar sayang! Belum giliran kamu jalan 😡");
      return;
    }
    
    if (gameMode === "bot" && game.turn() !== (playerColor === "white" ? "w" : "b")) return; 

    if (!selectedSquare) {
      const piece = game.get(squareId as any);
      if (piece && piece.color === game.turn()) setSelectedSquare(squareId);
      return;
    }

    const clickedPiece = game.get(squareId as any);
    if (clickedPiece && clickedPiece.color === game.turn()) {
      setSelectedSquare(squareId);
      return;
    }

    try {
      const moveGame = new Chess(game.fen());
      const move = moveGame.move({ from: selectedSquare, to: squareId, promotion: 'q' });
      
      if (move) {
        updateGameLocal(moveGame.fen(), true);
        setSelectedSquare(null);
      }
    } catch (e) {
      showError("Gerakan dilarang sayang! 🤨");
      setSelectedSquare(null);
    }
  };

  const resetGame = () => {
    const newG = new Chess();
    updateGameLocal(newG.fen(), true);
    setIsGameOver(false);
    setSelectedSquare(null);
    setIsBotThinking(false);
  };

  const renderCustomBoard = () => {
    const ranks = playerColor === 'black' ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
    const files = playerColor === 'black' ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];

    return (
      <div className="relative w-full max-w-[360px] aspect-square shadow-2xl rounded-lg overflow-hidden border-4 border-[#FBCB9E] mx-auto">
        <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply bg-[#FFF5EC]" style={{ backgroundImage: "url('/AyangkuManis.png')", filter: "blur(2px)" }} />
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
                      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="w-full h-full flex items-center justify-center relative z-10 p-1">
                        {(piece.type === 'q' || piece.type === 'k') ? (
                          <div className="relative w-[85%] h-[85%] flex items-center justify-center">
                            <div className="absolute -top-3 z-20 text-[10px] md:text-xs drop-shadow-md">{piece.type === 'k' ? '♔' : '♕'}</div>
                            <div className={`w-full h-full rounded-full bg-cover bg-center border-2 shadow-lg ${piece.color === 'w' ? 'border-white' : 'border-[#FBCB9E] filter brightness-90 saturate-150'}`} style={{ backgroundImage: `url(${PIECE_IMAGES[`${piece.color}${piece.type}`]})` }} />
                          </div>
                        ) : (
                          <img 
                            src={PIECE_IMAGES[`${piece.color}${piece.type}`]} 
                            className={`w-[85%] h-[85%] object-contain drop-shadow-md ${piece.color === 'b' ? 'filter invert(85%) sepia(20%) saturate(1000%) hue-rotate(335deg) brightness(105%)' : ''}`} 
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

        {/* STATUS BAR SINYAL & BOT THINKING */}
        <div className="absolute top-2 right-2 flex gap-2 z-20">
           {gameMode === 'multiplayer' && (
               isOnline ? <Wifi size={16} className="text-green-600 bg-white/50 rounded-full p-0.5" /> : <WifiOff size={16} className="text-red-500 animate-pulse bg-white/50 rounded-full p-0.5" />
           )}
           {isBotThinking && (
               <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full shadow-sm border border-orange-200">
                   <Loader2 size={12} className="animate-spin text-orange-500"/> 
                   <span className="text-[10px] font-bold text-orange-500">Mikir..</span>
               </div>
           )}
        </div>

        {/* MANUAL REFRESH BUTTON (Backup kalau macet) */}
        {gameMode === 'multiplayer' && (
             <button 
                onClick={() => updateGameLocal("", false)} // Trigger manual fetch
                className="absolute top-2 left-2 z-20 bg-white/50 p-1.5 rounded-full text-orange-500 hover:bg-white active:scale-95 transition"
             >
                <RefreshCw size={14} />
             </button>
        )}

        <AnimatePresence>
          {isGameOver && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white p-6 rounded-2xl shadow-2xl text-center border-4 border-[#FBCB9E] w-full">
                <h3 className="text-xl font-black text-gray-800 mb-2">{gameResultMsg}</h3>
                <button onClick={resetGame} className="bg-orange-400 hover:bg-orange-500 text-white w-full py-3 rounded-xl font-bold flex justify-center items-center gap-2"><RotateCcw size={18} /> Main Lagi</button>
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
      <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-orange-100 rounded-full shadow text-orange-600 z-50"><ArrowLeft size={20} /></button>
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
          <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2"><Bot className="text-orange-500" size={24} /><h3 className="font-bold text-gray-700">Lawan Komputer</h3></div>
            <div className="flex gap-2">
              {["cupu", "standar", "jago"].map((lvl) => (
                <button key={lvl} onClick={() => setBotDifficulty(lvl as any)} className={`flex-1 py-2 text-[10px] font-black rounded-xl capitalize border-2 transition-all ${botDifficulty === lvl ? 'bg-orange-400 border-orange-400 text-white' : 'bg-orange-50 border-orange-100 text-orange-300'}`}>{lvl.toUpperCase()}</button>
              ))}
            </div>
            <div className="flex gap-2 bg-orange-50 p-1.5 rounded-xl border border-orange-100">
              <button onClick={() => setBotPlayerColor("white")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${botPlayerColor === 'white' ? 'bg-white text-orange-600 shadow' : 'text-orange-300 hover:text-orange-400'}`}>Tim Ayang ⚪</button>
              <button onClick={() => setBotPlayerColor("black")} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${botPlayerColor === 'black' ? 'bg-orange-600 text-white shadow' : 'text-orange-300 hover:text-orange-400'}`}>Tim Kamu 🍑</button>
            </div>
            <button onClick={startBotMatch} className="w-full bg-gradient-to-r from-orange-400 to-amber-500 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg active:scale-95 transition mt-1"><Play size={18} fill="currentColor"/> Main Sekarang!</button>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-lg border border-orange-100 space-y-4">
            <div className="flex items-center gap-2 border-b border-orange-50 pb-2"><Users className="text-orange-500" size={24} /><h3 className="font-bold text-gray-700">Mabar Online</h3></div>
            <button onClick={createRoom} className="bg-orange-50 hover:bg-orange-100 text-orange-600 p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition border border-orange-200 text-xs">BUAT ROOM BARU</button>
            <div className="flex gap-2 mt-1">
              <input type="text" placeholder="KODE" className="flex-1 p-3 bg-orange-50 rounded-xl border border-orange-100 text-center font-mono uppercase font-bold text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200" value={inputCode} onChange={(e) => setInputCode(e.target.value.toUpperCase())}/>
              <button onClick={joinRoom} className="bg-orange-500 hover:bg-orange-600 text-white px-5 rounded-xl font-bold text-sm shadow-md active:scale-95 transition">MASUK</button>
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