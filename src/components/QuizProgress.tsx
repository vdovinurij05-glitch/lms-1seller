'use client';

interface QuizProgressProps {
  current: number;
  total: number;
  correct: number;
  wrong: number;
}

export default function QuizProgress({ current, total, correct, wrong }: QuizProgressProps) {
  const progress = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Вопрос {Math.min(current + 1, total)} из {total}
        </span>
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">{correct} верно</span>
          <span className="text-red-500 font-medium">{wrong} неверно</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-xs text-gray-400">{progress}%</span>
      </div>
    </div>
  );
}
