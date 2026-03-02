import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

interface QuizQuestion {
  id: number;
  type: 'single' | 'multiple';
  category: string;
  question: string;
  options: string[];
  correct: number[];
  explanation: string;
}

interface QuizData {
  course: {
    title: string;
    description: string;
    version: string;
  };
  questions: QuizQuestion[];
}

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin1seller2024', 12);
  await prisma.user.upsert({
    where: { email: 'admin@1seller.ru' },
    update: {},
    create: {
      email: 'admin@1seller.ru',
      name: 'Администратор',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created: admin@1seller.ru');

  // Load quiz data
  const dataPath = join(__dirname, '..', 'src', 'data', 'quiz_data.json');
  const raw = readFileSync(dataPath, 'utf-8');
  const quizData: QuizData = JSON.parse(raw);

  // Delete existing courses for re-seed
  await prisma.course.deleteMany();

  // Create course
  const course = await prisma.course.create({
    data: {
      title: quizData.course.title,
      description: quizData.course.description,
      version: quizData.course.version,
    },
  });
  console.log(`Course created: ${course.title}`);

  // Create questions
  for (const q of quizData.questions) {
    await prisma.question.create({
      data: {
        courseId: course.id,
        orderNum: q.id,
        type: q.type === 'single' ? 'SINGLE' : 'MULTIPLE',
        category: q.category,
        text: q.question,
        explanation: q.explanation,
        options: {
          create: q.options.map((opt, idx) => ({
            orderNum: idx,
            text: opt,
            isCorrect: q.correct.includes(idx),
          })),
        },
      },
    });
  }

  console.log(`Loaded ${quizData.questions.length} questions`);
  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
