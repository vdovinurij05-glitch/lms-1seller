export function checkAnswer(
  questionType: string,
  selectedOptionIds: string[],
  correctOptionIds: string[]
): boolean {
  if (questionType === 'SINGLE') {
    return selectedOptionIds.length === 1 &&
           correctOptionIds.includes(selectedOptionIds[0]);
  }

  const selectedSet = new Set(selectedOptionIds);
  const correctSet = new Set(correctOptionIds);

  if (selectedSet.size !== correctSet.size) return false;
  for (const id of correctSet) {
    if (!selectedSet.has(id)) return false;
  }
  return true;
}

export function calculateScore(
  answers: { isCorrect: boolean }[]
): { score: number; totalCorrect: number; totalQuestions: number; passed: boolean } {
  const totalQuestions = answers.length;
  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const passed = score >= 70;

  return { score, totalCorrect, totalQuestions, passed };
}

export function getCategoryStats(
  answers: { isCorrect: boolean; question: { category: string } }[]
) {
  const stats: Record<string, { correct: number; total: number }> = {};

  for (const answer of answers) {
    const cat = answer.question.category;
    if (!stats[cat]) stats[cat] = { correct: 0, total: 0 };
    stats[cat].total++;
    if (answer.isCorrect) stats[cat].correct++;
  }

  return Object.entries(stats).map(([category, { correct, total }]) => ({
    category,
    correct,
    total,
    percentage: Math.round((correct / total) * 100),
  }));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
