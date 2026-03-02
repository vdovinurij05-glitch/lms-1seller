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
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { completedAt: 'desc' },
  });

  const csvHeader = 'Имя,Email,Курс,Балл %,Правильных,Всего,Статус,Дата\n';
  const csvRows = results.map(r => {
    const date = r.completedAt ? new Date(r.completedAt).toLocaleDateString('ru-RU') : '';
    return `"${r.user.name}","${r.user.email}","${r.course.title}",${r.score},${r.totalCorrect},${r.totalQuestions},${r.passed ? 'Пройден' : 'Не пройден'},"${date}"`;
  }).join('\n');

  const csv = csvHeader + csvRows;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="results.csv"',
    },
  });
}
