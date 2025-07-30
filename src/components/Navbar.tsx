"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

interface NavbarProps {
  userEmail?: string;
  categories?: Array<{ id: string; name: string }>;
}

export default function Navbar({ userEmail, categories }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center shadow-md">
                <Image 
                  src="/LOGO_CLEANOVACIRCLE.jpg" 
                  alt="Cleanova Logo" 
                  width={32} 
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Cleanova</span>
                <span className="text-xs text-gray-500">Circle</span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
            
            {/* Categories Dropdown */}
            {categories && categories.length > 0 && (
              <div className="relative group">
                <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
                  <span>Kategori</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/videos/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {userEmail && (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">{userEmail}</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 