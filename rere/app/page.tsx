"use client";
export default function ValentinePage() {
  return (
    <main className="min-h-screen bg-pink-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm">
        <h1 className="text-3xl font-bold text-pink-600 mb-4">
          Happy Valentine! ❤️
        </h1>
        <p className="text-gray-600 mb-6">
          Aku punya sesuatu buat kamu...
        </p>
        <button 
          onClick={() => alert('I Love You!')}
          className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-full transition-all transform hover:scale-110"
        >
          Klik di sini
        </button>
      </div>
    </main>
  );
}