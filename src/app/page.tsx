import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-blue-50 to-white font-sans">
      <header className="w-full flex flex-col items-center pt-10 pb-4">
        <Image
          src="/LOGO_CLEANOVACIRCLE.jpg"
          alt="Cleanova Circle Logo"
          width={120}
          height={120}
          className="rounded-full shadow-lg mb-4 border-2 border-blue-400 bg-white"
        />
        <h1 className="text-3xl font-extrabold text-blue-800 mb-2 text-center drop-shadow-sm">Cleanova Circle</h1>
        <p className="text-lg text-gray-700 max-w-xl text-center mb-2">
          Platform edukasi berbayar berisi tips & trik kebersihan rumah tangga, pakaian, kamar mandi, dan perhiasan. Dapatkan akses ke video eksklusif dan komunitas inspiratif!
        </p>
      </header>
      <main className="flex flex-col items-center w-full flex-1 gap-8">
        <LoginForm />
        <div className="w-full max-w-sm bg-blue-50 border border-blue-100 rounded-lg p-4 mt-2 text-center">
          <h3 className="font-semibold text-blue-700 mb-1">Belum punya akun?</h3>
          <p className="text-gray-600 text-sm mb-2">
            Konten eksklusif Cleanova Circle hanya untuk member berlangganan. Untuk berlangganan dan mendapatkan akun, silakan hubungi admin kami via WhatsApp.
          </p>
          <a
            href="whatsapp://send?phone=+6287855310680&text=Halo%20Admin%2C%20saya%20tertarik%20untuk%20berlangganan%20Cleanova%20Circle."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full shadow transition-colors mt-1 mb-1"
          >
            Berlangganan Sekarang
          </a>
          <p className="text-xs text-gray-400 mt-1">Akun akan dibuat & dikirimkan oleh admin setelah pembayaran terverifikasi.</p>
        </div>
      </main>
      <footer className="w-full text-center py-4 text-gray-400 text-xs border-t mt-8">
        &copy; {new Date().getFullYear()} Cleanova Circle. All rights reserved. | Kontak: +62 878-5531-0680
      </footer>
    </div>
  );
}
