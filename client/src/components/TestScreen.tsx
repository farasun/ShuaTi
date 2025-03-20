
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
  
  // If there's no active test, don't render anything
  if (!activeTest || !currentQuestion) return null;
  
  // Create answer change handler
  const handleOptionSelect = (optionIndex: number) => {
    selectAnswer(optionIndex);
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-gray-600">
              问题 {progress.current}/{progress.total}
            </div>
            <div className="text-sm font-medium text-gray-600">
              {Math.round(progress.percentage)}%
            </div>
          </div>
          <Progress value={progress.percentage} />
        </CardContent>
      </Card>
      
      {/* Current question */}
      <Card className="shadow-md animate-fade-in">
        <CardContent className="p-6">
          <div className="mb-2 text-sm text-gray-500">{currentQuestion.chapter}</div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{currentQuestion.text}</h3>
          
          {/* Answer options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => (
              <label 
                key={index} 
                className="question-option block relative cursor-pointer"
              >
                <input 
                  type="radio" 
                  name="answer" 
                  className="absolute opacity-0" 
                  checked={selectedAnswer === index}
                  onChange={() => handleOptionSelect(index)}
                />
                <div className={`flex items-start p-4 rounded-lg border ${
                  selectedAnswer === index 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <div className={`h-5 w-5 rounded-full border-2 ${
                    selectedAnswer === index 
                      ? 'border-primary' 
                      : 'border-gray-300'
                  } flex-shrink-0 flex items-center justify-center mr-3 mt-0.5`}>
                    <div className={`h-2.5 w-2.5 rounded-full bg-primary ${
                      selectedAnswer === index ? '' : 'hidden'
                    }`}></div>
                  </div>
                  <div className="text-gray-700">{option}</div>
                </div>
              </label>
            ))}
          </div>
          
          {/* Chapter info */}
          <div className="flex items-center text-xs text-gray-500">
            <Info className="h-4 w-4 mr-1" />
            <span>难度: {currentQuestion.difficulty}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
