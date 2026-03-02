import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { userId: session.user.id },
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          score: true,
          passed: true,
          completedAt: true,
          startedAt: true,
        },
      },
    },
  });

  return NextResponse.json(courses);
}
