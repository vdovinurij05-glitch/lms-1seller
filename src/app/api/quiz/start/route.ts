import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { shuffleArray } from '@/lib/quiz-utils';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await request.json();

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      questions: {
        include: { options: { orderBy: { orderNum: 'asc' } } },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Shuffle questions and options
  const shuffledQuestions = shuffleArray(course.questions).map(q => ({
    ...q,
    options: shuffleArray(q.options),
  }));

  // Create attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId: session.user.id,
      courseId,
      totalQuestions: shuffledQuestions.length,
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    totalQuestions: shuffledQuestions.length,
    questions: shuffledQuestions.map((q, idx) => ({
      index: idx,
      id: q.id,
      type: q.type,
      category: q.category,
      text: q.text,
      options: q.options.map(o => ({
        id: o.id,
        text: o.text,
      })),
    })),
  });
}
