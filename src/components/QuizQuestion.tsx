'use client';

import { useState } from 'react';

interface Option {
  id: string;
  text: string;
}

interface QuizQuestionProps {
  index: number;
  total: number;
  type: string;
  category: string;
  text: string;
  options: Option[];
  onAnswer: (selectedIds: string[]) => Promise<{
    isCorrect: boolean;
    explanation: string | null;
    correctOptionIds: string[];
  }>;
  onNext: () => void;
}

export default function QuizQuestion({
  index,
  total,
  type,
  category,
  text,
  options,
  onAnswer,
  onNext,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [answered, setAnswered] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    explanation: string | null;
    correctOptionIds: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (optionId: string) => {
    if (answered) return;

    if (type === 'SINGLE') {
      setSelected([optionId]);
    } else {
      setSelected(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmit = async () => {
    if (selected.length === 0 || loading) return;
    setLoading(true);

    const res = await onAnswer(selected);
    setResult(res);
    setAnswered(true);
    setLoading(false);
  };

  const getOptionClass = (optionId: string) => {
    if (!answered) {
      const isSelected = selected.includes(optionId);
      return isSelected
        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
    }

    const isCorrect = result?.correctOptionIds.includes(optionId);
    const isSelected = selected.includes(optionId);

    if (isCorrect) return 'border-green-500 bg-green-50';
    if (isSelected && !isCorrect) return 'border-red-500 bg-red-50';
    return 'border-gray-200 opacity-60';
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {category}
        </span>
        <span className="text-sm text-gray-400">
          {index + 1} / {total}
        </span>
      </div>

      <h2 className="text-xl font-semibold text-gray-900 mb-2">{text}</h2>

      {type === 'MULTIPLE' && !answered && (
        <p className="text-sm text-blue-600 mb-4">
          Выберите все правильные варианты
        </p>
      )}

      <div className="space-y-3 mb-6">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            disabled={answered}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getOptionClass(option.id)}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 flex-shrink-0 rounded-${type === 'SINGLE' ? 'full' : 'md'} border-2 flex items-center justify-center ${
                selected.includes(option.id)
                  ? answered
                    ? result?.correctOptionIds.includes(option.id)
                      ? 'border-green-500 bg-green-500'
                      : 'border-red-500 bg-red-500'
                    : 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {selected.includes(option.id) && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-gray-800">{option.text}</span>
              {answered && result?.correctOptionIds.includes(option.id) && (
                <svg className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {answered && result?.explanation && (
        <div className={`p-4 rounded-xl mb-6 ${result.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`font-semibold mb-1 ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {result.isCorrect ? 'Правильно!' : 'Неправильно'}
          </p>
          <p className="text-gray-700 text-sm">{result.explanation}</p>
        </div>
      )}

      {!answered ? (
        <button
          onClick={handleSubmit}
          disabled={selected.length === 0 || loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition"
        >
          {loading ? 'Проверяю...' : 'Ответить'}
        </button>
      ) : (
        <button
          onClick={onNext}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition"
        >
          {index + 1 < total ? 'Следующий вопрос' : 'Завершить тест'}
        </button>
      )}
    </div>
  );
}
