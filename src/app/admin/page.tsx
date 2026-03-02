'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  passRate: number;
  avgScore: number;
}

interface Result {
  id: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
  user: { id: string; name: string; email: string };
  course: { title: string };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [sortField, setSortField] = useState<string>('completedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        router.push('/dashboard');
        return;
      }
      fetch('/api/admin/results')
        .then(r => r.json())
        .then(data => {
          setStats(data.stats);
          setResults(data.results);
          setLoading(false);
        });
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const filteredResults = results.filter(r => {
    if (filter === 'passed') return r.passed;
    if (filter === 'failed') return !r.passed;
    return true;
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let aVal: string | number, bVal: string | number;
    switch (sortField) {
      case 'name': aVal = a.user.name; bVal = b.user.name; break;
      case 'email': aVal = a.user.email; bVal = b.user.email; break;
      case 'score': aVal = a.score; bVal = b.score; break;
      case 'completedAt':
      default: aVal = a.completedAt; bVal = b.completedAt; break;
    }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          <p className="text-gray-500">Результаты тестирования сотрудников</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/users"
            className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-xl transition text-sm"
          >
            Сотрудники
          </Link>
          <a
            href="/api/admin/export"
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-xl transition text-sm"
          >
            Экспорт CSV
          </a>
        </div>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-gray-900">{stats.totalAttempts}</div>
            <div className="text-sm text-gray-500">Всего попыток</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-green-600">{stats.passRate}%</div>
            <div className="text-sm text-gray-500">Процент прохождения</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-blue-600">{stats.avgScore}%</div>
            <div className="text-sm text-gray-500">Средний балл</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="text-3xl font-bold text-red-500">{stats.failedAttempts}</div>
            <div className="text-sm text-gray-500">Не прошли</div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'passed', 'failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'passed' ? 'Прошли' : 'Не прошли'}
          </button>
        ))}
      </div>

      {/* Results table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  { key: 'name', label: 'Имя' },
                  { key: 'email', label: 'Email' },
                  { key: 'score', label: 'Балл' },
                  { key: 'completedAt', label: 'Дата' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  >
                    {col.label}
                    {sortField === col.key && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                ))}
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedResults.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{r.user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${r.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                      {r.score}%
                    </span>
                    <span className="text-xs text-gray-400 ml-1">
                      ({r.totalCorrect}/{r.totalQuestions})
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(r.completedAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      r.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {r.passed ? 'Пройден' : 'Не пройден'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/results/${r.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
                      Детали
                    </Link>
                  </td>
                </tr>
              ))}
              {sortedResults.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Нет результатов
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
