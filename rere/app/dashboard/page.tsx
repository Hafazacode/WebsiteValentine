"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Heart, Home, Image as ImageIcon, Mail } from "lucide-react"; 

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [noBtnPos, setNoBtnPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const moveNoButton = () => {
    const x = Math.random() * 200 - 100;
    const y = Math.random() * 200 - 100;
    setNoBtnPos({ x, y });
  };

  const hearts = Array.from({ length: 30 });

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 to-red-300 relative overflow-hidden font-sans text-slate-800 flex items-center justify-center p-4">
      
      {/* Background Hearts (Tetap ada biar background ga kosong saat transisi) */}
      {isClient && hearts.map((_, index) => (
         <motion.div
            key={index}
            className="absolute left-0 text-white/30 pointer-events-none z-0"
            initial={{ opacity: 0, y: "110vh", x: `${Math.floor(Math.random() * 100)}vw` }}
            animate={{ opacity: [0, 0.6, 0.6, 0], y: "-10vh" }}
            transition={{ duration: Math.random() * 6 + 6, repeat: Infinity, delay: Math.random() * 2 }}
            style={{ fontSize: `${Math.random() * 20 + 20}px` }}
         >❤️</motion.div>
      ))}

      {/* --- DASHBOARD CONTAINER --- */}
      <motion.div
        className="w-full max-w-4xl h-[85vh] flex flex-col relative z-10"
        
        // EFEK MASUK DARI BAWAH (Seolah-olah didorong halaman welcome)
        initial={{ y: "100vh" }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }} // Durasi samain kayak welcome biar smooth
      >
        
        {/* MENU BAR ATAS */}
        <div className="bg-white/80 backdrop-blur-md rounded-full px-6 py-3 mb-6 shadow-lg flex justify-between items-center mx-2 md:mx-0">
           <div className="flex items-center gap-2">
             <div className="bg-pink-500 p-2 rounded-full text-white">
               <Heart size={20} fill="white" />
             </div>
             <span className="font-bold text-pink-600 hidden md:block">LoveApp</span>
           </div>

           <nav className="flex gap-4 md:gap-8 text-gray-600 font-medium text-sm md:text-base">
             <button className="text-pink-600 border-b-2 border-pink-500 pb-1 flex gap-2 items-center">
                <Home size={18}/> Home
             </button>
             <button className="hover:text-pink-500 transition-colors flex gap-2 items-center">
                <ImageIcon size={18}/> Gallery
             </button>
             <button className="hover:text-pink-500 transition-colors flex gap-2 items-center">
                <Mail size={18}/> Letter
             </button>
           </nav>

           <div className="w-8 h-8 rounded-full bg-pink-200 overflow-hidden border-2 border-pink-400">
              <Image src="/MyLove.png" width={32} height={32} alt="Profile" className="object-cover w-full h-full" />
           </div>
        </div>

        {/* KOTAK PUTIH UTAMA */}
        <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden border border-white/50">
          
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-pink-300 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-300 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-pink-600 mb-4">
              Kamu Manis sayanggg....
            </h2>
            <p className="text-gray-500 mb-10 text-lg">
              Jangan pencet gakkkkk
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 relative">
              <button 
                onClick={() => alert("Yeay! I Love You Muachhhhh! ❤️")}
                className="bg-gradient-to-r from-pink-500 to-red-400 text-white font-bold py-4 px-12 rounded-full shadow-lg hover:shadow-pink-500/50 hover:scale-105 transition-all text-xl"
              >
                Iya aku manis!
              </button>
              
              <motion.button
                animate={{ x: noBtnPos.x, y: noBtnPos.y }}
                onHoverStart={moveNoButton} 
                onClick={moveNoButton}
                className="bg-gray-200 text-gray-500 font-bold py-4 px-12 rounded-full hover:bg-gray-300 transition-colors text-xl"
              >
                Gak Manis
              </motion.button>
            </div>
          </div>
        </div>

      </motion.div>
    </main>
  );
}