import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTest } from '@/context/TestContext';
import { TestResult, UserStats } from '@shared/types';
import { getTestResults, getUserStats, clearAllData } from '@/lib/storage';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export const WelcomeScreen: React.FC = () => {
  const { startNewTest, activeTest } = useTest();
  const [questionCount, setQuestionCount] = useState<number>(10); // 默认10题

  const handleClearData = async () => {
    // 添加确认对话框
    const confirmed = window.confirm("确定要清除所有数据吗？此操作不可恢复。");
    if (!confirmed) return;

    await clearAllData();
    // Reload data
    const tests = await getTestResults();
    const userStats = await getUserStats();
    setRecentTests(tests);
    setStats(userStats);
  };
  const [recentTests, setRecentTests] = useState<TestResult[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalTests: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    wrongAnswers: 0
  });

  // Load recent tests and stats
  useEffect(() => {
    const loadData = async () => {
      const tests = await getTestResults();
      const userStats = await getUserStats();
      //Process wrong answers to count unique questions
      const uniqueWrongAnswers = new Set();
      tests.forEach(test => {
        test.wrongAnswers.forEach(wa => uniqueWrongAnswers.add(wa.qid));
      });
      const updatedStats = {...userStats, wrongAnswers: uniqueWrongAnswers.size};
      setRecentTests(tests);
      setStats(updatedStats);
    };

    loadData();
  }, []);

  // Format date to display in a readable format
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + 
      date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // If there's an active test, don't show welcome screen
  if (activeTest) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center">
              <FileText className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">成人技能考试刷题工具</h2>
          <p className="text-gray-600 mb-4">轻松生成模拟测试，随时随地提升考试通过率</p>

          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">选择题目数量:</h3>
            <RadioGroup 
              defaultValue="10" 
              className="flex space-x-2 justify-center"
              onValueChange={(value) => setQuestionCount(Number(value))}
            >
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="10" id="option-10" />
                <Label htmlFor="option-10">10题</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="20" id="option-20" />
                <Label htmlFor="option-20">20题</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="50" id="option-50" />
                <Label htmlFor="option-50">50题</Label>
              </div>
              <div className="flex items-center space-x-1">
                <RadioGroupItem value="100" id="option-100" />
                <Label htmlFor="option-100">100题</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={() => startNewTest(questionCount)} 
            className="w-full py-3 px-4"
            size="lg"
          >
            开始新测试
          </Button>
        </CardContent>
      </Card>

      {/* Recent tests section */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">最近测试</h3>

          {recentTests.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">暂无测试记录</p>
            </div>
          ) : (
            <>
              {recentTests.map((test, index) => (
                <div 
                  key={index} 
                  className={`border-b border-gray-200 py-3 ${
                    index === recentTests.length - 1 ? 'border-b-0' : ''
                  } flex justify-between items-center`}
                >
                  <div>
                    <div className="font-medium">{formatDate(test.timestamp)}</div>
                    <div className="text-sm text-gray-600">
                      得分: {test.score}/{test.total} ({test.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>



      {/* Quick stats card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">学习统计</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalTests}</div>
              <div className="text-sm text-gray-600">已完成测试</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-amber-500">{stats.wrongAnswers}</div>
              <div className="text-sm text-gray-600">错题数量</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clear data button */}
      <div className="text-center pt-4">
        <Button 
          variant="outline"
          onClick={handleClearData}
          className="text-sm text-gray-500"
          size="sm"
        >
          清除所有数据
        </Button>
      </div>
    </div>
  );
};