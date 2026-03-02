'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import QuizQuestion from '@/components/QuizQuestion';
import QuizProgress from '@/components/QuizProgress';

interface QuestionData {
  index: number;
  id: string;
  type: string;
  category: string;
  text: string;
  options: { id: string; text: string }[];
}

interface QuizData {
  attemptId: string;
  totalQuestions: number;
  questions: QuestionData[];
}

function QuizContent() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (attemptId) {
      const stored = sessionStorage.getItem(`quiz-${attemptId}`);
      if (stored) {
        setQuiz(JSON.parse(stored));
      } else {
        router.push(`/courses/${params.id}`);
      }
    }
  }, [status, attemptId, router, params.id]);

  const handleAnswer = async (selectedIds: string[]) => {
    if (!quiz) throw new Error('No quiz data');

    const question = quiz.questions[currentIndex];

    const res = await fetch('/api/quiz/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId: quiz.attemptId,
        questionId: question.id,
        selectedOptionIds: selectedIds,
      }),
    });

    const data = await res.json();

    if (data.isCorrect) {
      setCorrect(prev => prev + 1);
    } else {
      setWrong(prev => prev + 1);
    }

    return data;
  };

  const handleNext = async () => {
    if (!quiz) return;

    if (currentIndex + 1 >= quiz.totalQuestions) {
      // Complete the quiz
      const res = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: quiz.attemptId }),
      });

      const data = await res.json();
      sessionStorage.removeItem(`quiz-${quiz.attemptId}`);
      router.push(`/results/${data.id}`);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (status === 'loading' || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <QuizProgress
        current={currentIndex}
        total={quiz.totalQuestions}
        correct={correct}
        wrong={wrong}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <QuizQuestion
          key={currentQuestion.id}
          index={currentIndex}
          total={quiz.totalQuestions}
          type={currentQuestion.type}
          category={currentQuestion.category}
          text={currentQuestion.text}
          options={currentQuestion.options}
          onAnswer={handleAnswer}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    }>
      <QuizContent />
    </Suspense>
  );
}
