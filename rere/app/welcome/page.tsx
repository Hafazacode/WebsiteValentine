"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function WelcomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // State buat animasi keluar

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLanjut = () => {
    setIsExiting(true); // 1. Mulai geser ke atas
    setTimeout(() => {
      router.push('/dashboard'); // 2. Pindah ke folder dashboard
    }, 600); // Tunggu 0.6 detik biar animasi kelar dulu
  };

  const hearts = Array.from({ length: 30 });

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 to-red-300 overflow-hidden relative">
      
      {/* Container Utama - Ini yang bakal terbang ke atas */}
      <motion.div
        className="w-full h-screen relative"
        animate={{ y: isExiting ? "-100vh" : "0vh" }} // Animasi Sundul
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Background Hearts */}
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

        {/* Konten Tengah */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
          
          {/* Foto Pacar */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none p-4"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.15, scale: 1 }}
            transition={{ duration: 2.5 }}
          >
            <div className="relative w-full h-full max-w-[90vw] max-h-[70vh] md:max-w-[600px]">
              <div className="absolute inset-0 w-full h-full" style={{
                  WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
                  maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
              }}>
                  <Image src="/MyLove.png" alt="Ayang" fill className="object-contain grayscale-[30%] mix-blend-multiply blur-[1px]" />
              </div>
            </div>
          </motion.div>

          <div className="z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg mb-6 font-valentine">
              Halo Sayang... ❤️
            </h1>
            <p className="text-white text-lg mb-8 opacity-90 font-medium font-valentine">
              Selamat hari Valentine, manisssss!
            </p>
            
            <button
              onClick={handleLanjut}
              className="bg-white text-pink-500 font-bold py-3 px-10 rounded-full shadow-2xl hover:bg-pink-50 hover:scale-110 transition-all active:scale-95 cursor-pointer"
            >
              Lanjuttt
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}