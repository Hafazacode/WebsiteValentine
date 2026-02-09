"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Memindahkan user ke halaman welcome secara otomatis
    router.push('/welcome');
  }, [router]);

  return (
    // Menampilkan layar kosong sebentar saat proses redirect
    <main className="min-h-screen bg-pink-100" />
  );
}