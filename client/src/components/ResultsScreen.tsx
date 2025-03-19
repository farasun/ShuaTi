import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Home, RepeatIcon, Loader2 } from 'lucide-react';
import { useTest } from '@/context/TestContext';

export const ResultsScreen: React.FC = () => {
  const { 
    testResults, 
    startNewTest,
    showWrongAnswers,
    closeWrongAnswersReview
  } = useTest();
  
  // If there are no test results or wrong answers are being shown, don't render
  if (!testResults || showWrongAnswers) return null;
  
  // 回到首页 - 使用状态管理而非页面刷新
  const [isNavigating, setIsNavigating] = useState(false);
  
  const goToHome = () => {
    // 显示导航反馈
    setIsNavigating(true);
    
    // 使用setTimeout确保UI状态更新，但不延迟导航
    setTimeout(() => {
      closeWrongAnswersReview(); // 确保关闭任何打开的错题页面
      startNewTest(0); // 使用0作为参数，表示不启动测试但重置状态
    }, 50);
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-primary/10 mb-4">
            <Check className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">测试完成!</h2>
          <div className="text-4xl font-bold text-primary mb-2">
            {testResults.score}/{testResults.total}
          </div>
          <p className="text-xl text-gray-600 mb-6">{testResults.percentage}%</p>
          
          {/* Performance summary */}
          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-green-500 font-bold text-2xl">{testResults.score}</div>
              <div className="text-sm text-gray-600">正确</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-red-500 font-bold text-2xl">{testResults.total - testResults.score}</div>
              <div className="text-sm text-gray-600">错误</div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <Button 
              onClick={() => startNewTest()}
              size="lg"
              className="flex items-center justify-center"
            >
              <RepeatIcon className="h-5 w-5 mr-2" /> 再次测试
            </Button>
            
            <Button 
              onClick={goToHome}
              variant="outline"
              size="lg"
              className="flex items-center justify-center"
              disabled={isNavigating}
            >
              {isNavigating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" /> 正在返回...
                </>
              ) : (
                <>
                  <Home className="h-5 w-5 mr-2" /> 回到首页
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
