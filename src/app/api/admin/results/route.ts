import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results = await prisma.quizAttempt.findMany({
    where: { completedAt: { not: null } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { completedAt: 'desc' },
  });

  // Stats
  const totalAttempts = results.length;
  const passedAttempts = results.filter(r => r.passed).length;
  const avgScore = totalAttempts > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / totalAttempts)
    : 0;

  return NextResponse.json({
    results,
    stats: {
      totalAttempts,
      passedAttempts,
      failedAttempts: totalAttempts - passedAttempts,
      passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      avgScore,
    },
  });
}
