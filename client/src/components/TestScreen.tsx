import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Info } from 'lucide-react';
import { useTest } from '@/context/TestContext';

export const TestScreen: React.FC = () => {
  const { 
    activeTest, 
    currentQuestion, 
    selectedAnswer, 
    selectAnswer, 
    progress 
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
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progress} />
        <div className="text-sm text-gray-500 text-right">
          {activeTest.currentQuestionIndex + 1} / {activeTest.questions.length}
        </div>
      </div>

      {/* Question card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
                  {currentQuestion.text}
                </h3>
              </div>
              {currentQuestion.chapter && (
                <div className="text-sm text-gray-500 whitespace-nowrap">
                  {currentQuestion.chapter}
                </div>
              )}
            </div>

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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};