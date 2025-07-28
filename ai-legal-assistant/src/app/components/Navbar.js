'use client';
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const { signOut } = useClerk();

  return (
    <nav className="w-full bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 backdrop-blur-sm shadow-lg border-b border-white/20 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">⚖️</div>
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI Legal Assistant
        </span>
      </div>
      <div className="flex items-center space-x-6">
        <Link 
          href="/" 
          className="text-gray-700 hover:text-blue-600 font-semibold transition-colors duration-200 hover:scale-105 transform"
        >
          🏠 Home
        </Link>
        <Link 
          href="/about" 
          className="text-gray-700 hover:text-blue-600 font-semibold transition-colors duration-200 hover:scale-105 transform"
        >
          ℹ️ About
        </Link>
        <button
          className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          onClick={() => signOut(() => router.replace("/login"))}
        >
          🚪 Logout
        </button>
      </div>
    </nav>);}
