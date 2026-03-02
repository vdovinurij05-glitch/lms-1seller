'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  _count: { questions: number };
  attempts: {
    id: string;
    score: number | null;
    passed: boolean | null;
    completedAt: string | null;
    startedAt: string;
  }[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/courses')
        .then(r => r.json())
        .then(data => {
          setCourses(data);
          setLoading(false);
        });
    }
  }, [status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Привет, {session?.user?.name}!
        </h1>
        <p className="text-gray-500 mt-1">Ваши доступные курсы и история прохождения</p>
      </div>

      <div className="grid gap-6">
        {courses.map(course => {
          const lastAttempt = course.attempts[0];
          const bestScore = course.attempts.length > 0
            ? Math.max(...course.attempts.filter(a => a.score !== null).map(a => a.score!))
            : null;

          return (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
                  {course.description && (
                    <p className="text-gray-500 mt-1 text-sm">{course.description}</p>
                  )}
                  <div className="flex gap-4 mt-3 text-sm text-gray-400">
                    <span>{course._count.questions} вопросов</span>
                    <span>{course.attempts.length} попыток</span>
                    {bestScore !== null && (
                      <span className={bestScore >= 70 ? 'text-green-600 font-medium' : 'text-red-500'}>
                        Лучший: {bestScore}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Link
                    href={`/courses/${course.id}`}
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm"
                  >
                    {course.attempts.length > 0 ? 'Пройти заново' : 'Начать тест'}
                  </Link>
                  {lastAttempt?.completedAt && (
                    <span className="text-xs text-gray-400">
                      Последняя: {new Date(lastAttempt.completedAt).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>

              {course.attempts.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-2">История попыток:</p>
                  <div className="flex flex-wrap gap-2">
                    {course.attempts.filter(a => a.completedAt).map(attempt => (
                      <Link
                        key={attempt.id}
                        href={`/results/${attempt.id}`}
                        className={`text-xs px-3 py-1 rounded-full ${
                          attempt.passed
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {attempt.score}% — {new Date(attempt.completedAt!).toLocaleDateString('ru-RU')}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {courses.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            Пока нет доступных курсов
          </div>
        )}
      </div>
    </div>
  );
}
