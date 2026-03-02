import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateScore } from '@/lib/quiz-utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { attemptId } = await request.json();

  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId: session.user.id, completedAt: null },
    include: { answers: true },
  });

  if (!attempt) {
    return NextResponse.json({ error: 'Invalid attempt' }, { status: 400 });
  }

  const { score, totalCorrect, totalQuestions, passed } = calculateScore(attempt.answers);

  const completed = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score,
      totalCorrect,
      totalQuestions,
      passed,
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    id: completed.id,
    score,
    totalCorrect,
    totalQuestions,
    passed,
  });
}
