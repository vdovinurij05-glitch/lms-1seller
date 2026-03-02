'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  const isAdmin = session.user.role === 'ADMIN';

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              1Seller Learn
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition">
                Главная
              </Link>
              <Link href="/courses" className="text-gray-300 hover:text-white transition">
                Курсы
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition">
                  Админ
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <span className="text-gray-400 text-sm">{session.user.name}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition"
            >
              Выйти
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/dashboard" className="block px-3 py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
              Главная
            </Link>
            <Link href="/courses" className="block px-3 py-2 text-gray-300 hover:text-white" onClick={() => setMenuOpen(false)}>
              Курсы
            </Link>
            {isAdmin && (
              <Link href="/admin" className="block px-3 py-2 text-yellow-400" onClick={() => setMenuOpen(false)}>
                Админ
              </Link>
            )}
            <div className="px-3 pt-2 border-t border-gray-700">
              <span className="text-gray-400 text-sm block mb-2">{session.user.name}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded"
              >
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
