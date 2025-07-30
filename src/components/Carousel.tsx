"use client";
export default function Carousel() {
  return (
    <div className="w-full flex gap-4 overflow-x-auto pb-2">
      <div className="min-w-[300px] h-40 bg-blue-200 rounded-lg flex items-center justify-center font-bold text-blue-900 text-xl shadow">Tips Kebersihan Rumah</div>
      <div className="min-w-[300px] h-40 bg-yellow-100 rounded-lg flex items-center justify-center font-bold text-yellow-700 text-xl shadow">Promo Produk Cleannova</div>
      <div className="min-w-[300px] h-40 bg-green-100 rounded-lg flex items-center justify-center font-bold text-green-700 text-xl shadow">Komunitas & Event</div>
    </div>
  );
} 