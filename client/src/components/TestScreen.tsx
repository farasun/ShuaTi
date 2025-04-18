import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, BookOpen, GraduationCap } from 'lucide-react';
import { useTest } from '@/context/TestContext';

export const TestScreen: React.FC = () => {
  const { 
    activeTest, 
    currentQuestion, 
    selectedAnswer, 
    selectAnswer 
  } = useTest();

  // 添加页面刷新确认
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeTest && !activeTest.completed) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTest]);

  // If there's no active test, don't render anything
  if (!activeTest || !currentQuestion) return null;

  return (
    <div className="space-y-2"> {/* Reduced spacing */}
      {/* Top Bar with Progress */}
      <div className="bg-purple-200 p-4 flex justify-between items-center">
        <div>
          <span className="text-lg font-semibold text-gray-700">
            {activeTest.currentQuestionIndex + 1} / {activeTest.questions.length}
          </span>
        </div>
      </div>

      {/* Question card */}
      <Card className="shadow-sm mb-2"> {/* Reduced spacing */}
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Question text */}
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {currentQuestion.text}
            </h3>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => selectAnswer(index)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedAnswer === index
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Difficulty and Knowledge Point & Chapter */}
            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
              {currentQuestion.chapter && (
                <div className="flex items-center text-sm text-gray-500">
                  Chapter: {currentQuestion.chapter}
                </div>
              )}
              {currentQuestion.difficulty && (
                <div className="flex items-center text-sm text-gray-500">
                  <GraduationCap className="h-4 w-4 mr-1" />
                  难度 {currentQuestion.difficulty}
                </div>
              )}
              {currentQuestion.knowledgePointId && (
                <div className="flex items-center text-sm text-gray-500">
                  <BookOpen className="h-4 w-4 mr-1" />
                  {currentQuestion.knowledgePointId}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};