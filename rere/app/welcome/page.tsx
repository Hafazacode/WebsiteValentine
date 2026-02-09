"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function WelcomePage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hearts = Array.from({ length: 30 });

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 to-red-300 flex items-center justify-center p-6 overflow-hidden relative">
      
      {/* 1. Animasi Hati (Sama seperti sebelumnya) */}
      {isClient && hearts.map((_, index) => {
        const randomX = Math.floor(Math.random() * 100); 
        const randomDuration = Math.random() * 6 + 6;
        const randomDelay = Math.random() * 2; 

        return (
          <motion.div
            key={index}
            className="absolute left-0 text-white/40 pointer-events-none z-0 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
            initial={{ opacity: 0, y: "110vh", x: `${randomX}vw`, scale: Math.random() * 0.5 + 0.5 }}
            animate={{ opacity: [0, 0.6, 0.6, 0], y: "-10vh", x: [`${randomX}vw`, `${randomX + (Math.random() * 10 - 5)}vw`, `${randomX}vw`] }}
            transition={{ duration: randomDuration, repeat: Infinity, delay: randomDelay, ease: "linear" }}
            style={{ fontSize: `${Math.random() * 20 + 20}px` }}
          >
            ❤️
          </motion.div>
        );
      })}

      {/* 2. FOTO PACAR DI TENAH (MENYATU TOTAL) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 0.2, scale: 1 }} // Opacity 0.2 agar sangat halus seperti bayangan
        transition={{ duration: 2.5, ease: "easeOut" }}
      >
        <div 
          className="relative w-[80%] h-[80%] max-w-[600px] max-h-[600px]"
          style={{
            // MAGIC SAKTI: Memudarkan pinggiran gambar secara halus
            WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)',
            maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 20%, rgba(0,0,0,0) 70%)',
          }}
        >
          <Image 
            src="/MyLove.png" 
            alt="Ayang"
            fill
            className="object-cover grayscale-[40%] mix-blend-multiply" 
            // mix-blend-multiply: membuat warna putih/terang di foto hilang & menyatu ke pink
          />
        </div>
      </motion.div>

      {/* 3. Konten Utama */}
      <motion.div 
        className="text-center z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1 
          className="text-5xl md:text-7xl text-white drop-shadow-lg mb-6 font-valentine"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Halo Sayang...❤️
        </motion.h1>
        
        <motion.p 
          className="text-white text-lg md:text-xl mb-8 opacity-90 font-medium font-valentine"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Selamat hari Valentine, manisssss!
        </motion.p>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
          <button
            onClick={() => router.push('/')}
            className="bg-white text-pink-500 font-bold py-3 px-10 rounded-full shadow-2xl hover:bg-pink-50 transition-all transform hover:scale-110 active:scale-95"
          >
            Lanjuttt
          </button>
        </motion.div>
      </motion.div>
    </main>
  );
}