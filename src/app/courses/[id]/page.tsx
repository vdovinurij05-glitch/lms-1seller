'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CourseInfo {
  id: string;
  title: string;
  description: string | null;
  _count: { questions: number };
}

export default function CoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && params.id) {
      fetch(`/api/courses/${params.id}`)
        .then(r => r.json())
        .then(data => {
          setCourse(data);
          setLoading(false);
        });
    }
  }, [status, router, params.id]);

  const handleStart = async () => {
    if (!course || starting) return;
    setStarting(true);

    const res = await fetch('/api/quiz/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId: course.id }),
    });

    const data = await res.json();
    sessionStorage.setItem(`quiz-${data.attemptId}`, JSON.stringify(data));
    router.push(`/courses/${course.id}/quiz?attempt=${data.attemptId}`);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Курс не найден</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{course.title}</h1>
        {course.description && (
          <p className="text-gray-500 mb-6">{course.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{course._count.questions}</div>
            <div className="text-sm text-gray-500">Вопросов</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">70%</div>
            <div className="text-sm text-gray-500">Порог прохождения</div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-medium text-blue-900 mb-2">Правила:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Вопросы и варианты ответов перемешиваются</li>
            <li>- Нельзя вернуться к предыдущему вопросу</li>
            <li>- После ответа показывается объяснение</li>
            <li>- Для прохождения нужно набрать от 70%</li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl transition text-lg"
        >
          {starting ? 'Загрузка...' : 'Начать тест'}
        </button>
      </div>
    </div>
  );
}
