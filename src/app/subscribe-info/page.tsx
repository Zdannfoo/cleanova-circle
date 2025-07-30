import Link from "next/link";

export default function SubscribeInfoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-blue-800 mb-4">Akses Terbatas</h1>
        <p className="text-gray-600 mb-6">
          Anda perlu berlangganan untuk mengakses konten video kami.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
} 