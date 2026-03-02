'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AnswerDetail {
  id: string;
  isCorrect: boolean;
  question: {
    id: string;
    text: string;
    type: string;
    category: string;
    explanation: string | null;
    options: {
      id: string;
      text: string;
      isCorrect: boolean;
    }[];
  };
  selectedOptions: { optionId: string }[];
}

interface AttemptResult {
  id: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  passed: boolean;
  completedAt: string;
  course: { id: string; title: string };
  answers: AnswerDetail[];
}

export default function ResultsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated' && params.id) {
      fetch(`/api/quiz/results/${params.id}`)
        .then(r => r.json())
        .then(data => {
          setResult(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router, params.id]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Результат не найден</p>
      </div>
    );
  }

  // Category stats
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  result.answers.forEach(a => {
    const cat = a.question.category;
    if (!categoryStats[cat]) categoryStats[cat] = { correct: 0, total: 0 };
    categoryStats[cat].total++;
    if (a.isCorrect) categoryStats[cat].correct++;
  });

  const wrongAnswers = result.answers.filter(a => !a.isCorrect);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Score card */}
      <div className={`rounded-2xl p-8 text-center mb-6 ${
        result.passed
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200'
          : 'bg-gradient-to-br from-red-50 to-orange-50 border border-red-200'
      }`}>
        <div className={`text-6xl font-bold mb-2 ${
          result.passed ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.score}%
        </div>
        <div className={`text-xl font-semibold mb-1 ${
          result.passed ? 'text-green-700' : 'text-red-700'
        }`}>
          {result.passed ? 'Тест пройден!' : 'Тест не пройден'}
        </div>
        <p className="text-gray-500">
          {result.totalCorrect} из {result.totalQuestions} правильных ответов
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {new Date(result.completedAt).toLocaleString('ru-RU')}
        </p>
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Результаты по категориям</h3>
        <div className="space-y-3">
          {Object.entries(categoryStats).map(([cat, stats]) => {
            const pct = Math.round((stats.correct / stats.total) * 100);
            return (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{cat}</span>
                  <span className={pct >= 70 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                    {stats.correct}/{stats.total} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${pct >= 70 ? 'bg-green-500' : 'bg-red-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {wrongAnswers.length > 0 && (
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-xl transition"
          >
            {showErrors ? 'Скрыть ошибки' : `Посмотреть ошибки (${wrongAnswers.length})`}
          </button>
        )}
        <Link
          href={`/courses/${result.course.id}`}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition text-center"
        >
          Пройти заново
        </Link>
      </div>

      {/* Wrong answers detail */}
      {showErrors && (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900">Ошибки:</h3>
          {wrongAnswers.map((answer, idx) => {
            const selectedIds = answer.selectedOptions.map(so => so.optionId);
            return (
              <div key={answer.id} className="bg-white rounded-xl border border-red-100 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {answer.question.category}
                  </span>
                  <span className="text-xs text-gray-400">Вопрос {idx + 1}</span>
                </div>
                <p className="font-medium text-gray-900 mb-3">{answer.question.text}</p>
                <div className="space-y-2 mb-3">
                  {answer.question.options.map(opt => {
                    const isSelected = selectedIds.includes(opt.id);
                    const isCorrect = opt.isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          isCorrect
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : isSelected
                              ? 'bg-red-50 border border-red-200 text-red-800'
                              : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {opt.text}
                        {isCorrect && ' ✓'}
                        {isSelected && !isCorrect && ' ✗'}
                      </div>
                    );
                  })}
                </div>
                {answer.question.explanation && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    {answer.question.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm">
          ← Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
