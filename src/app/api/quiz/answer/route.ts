import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkAnswer } from '@/lib/quiz-utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { attemptId, questionId, selectedOptionIds } = await request.json();

  // Verify attempt belongs to user
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, userId: session.user.id, completedAt: null },
  });

  if (!attempt) {
    return NextResponse.json({ error: 'Invalid attempt' }, { status: 400 });
  }

  // Check if already answered
  const existing = await prisma.answer.findFirst({
    where: { attemptId, questionId },
  });

  if (existing) {
    return NextResponse.json({ error: 'Already answered' }, { status: 400 });
  }

  // Get question with correct options
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { options: true },
  });

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  const correctOptionIds = question.options
    .filter(o => o.isCorrect)
    .map(o => o.id);

  const isCorrect = checkAnswer(question.type, selectedOptionIds, correctOptionIds);

  // Save answer
  const answer = await prisma.answer.create({
    data: {
      attemptId,
      questionId,
      isCorrect,
      selectedOptions: {
        create: selectedOptionIds.map((optionId: string) => ({
          optionId,
        })),
      },
    },
  });

  // Update current question counter
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { currentQuestion: { increment: 1 } },
  });

  return NextResponse.json({
    answerId: answer.id,
    isCorrect,
    explanation: question.explanation,
    correctOptionIds,
  });
}
