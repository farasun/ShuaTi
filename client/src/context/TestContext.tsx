import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Question, Test, Answer, TestResult, WrongAnswer, WrongAnswerTemp } from '@shared/types';
import { generateTest } from '../lib/testGenerator';
import { 
  saveCurrentTest, 
  getCurrentTest, 
  clearCurrentTest,
  saveTestResult,
  generateTestId,
  saveWrongAnswer,
  exportWrongAnswersAsJson,
  getWrongAnswers
} from '../lib/storage';
import questionBank from '../../data/questionBank.json';
import { useToast } from '@/hooks/use-toast';

interface TestContextType {
  // Test state
  activeTest: Test | null;
  currentQuestion: Question | null;
  selectedAnswer: number | null;
  isLastQuestion: boolean;
  progress: { current: number; total: number; percentage: number };

  // Test navigation
  startNewTest: (numQuestions?: number) => Promise<void>;
  selectAnswer: (optionIndex: number) => void;
  goToNextQuestion: () => Promise<void>;
  goToPreviousQuestion: () => void;
  submitTest: () => Promise<void>;
  exitTest: () => Promise<void>; // 添加退出测试功能

  // Results
  testResults: TestResult | null;
  wrongAnswers: WrongAnswer[];
  showWrongAnswers: boolean;
  reviewWrongAnswers: () => void;
  closeWrongAnswersReview: () => void;
  exportWrongAnswers: () => void;
}

const TestContext = createContext<TestContextType | undefined>(undefined);

interface TestProviderProps {
  children: ReactNode;
}

export const TestProvider: React.FC<TestProviderProps> = ({ children }) => {
  // State
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [showWrongAnswers, setShowWrongAnswers] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const { toast } = useToast();

  // 修改：不自动恢复测试，确保默认显示首页
  // 自动恢复未完成的测试
  useEffect(() => {
    const loadActiveTest = async () => {
      const savedTest = await getCurrentTest();
      if (savedTest && !savedTest.completed) {
        const confirmResume = window.confirm("发现未完成的测试，是否继续?");
        if (confirmResume) {
          setActiveTest(savedTest);
          setSelectedAnswer(savedTest.questions[savedTest.currentQuestionIndex]?.selectedAnswer ?? null);
        } else {
          await clearCurrentTest();
        }
      }
    };
    loadActiveTest();
  }, []);

  // 自动保存答题进度
  useEffect(() => {
    if (activeTest && !activeTest.completed) {
      saveCurrentTest(activeTest);
    }
  }, [activeTest]);

  useEffect(() => {
    const initializeWrongAnswers = async () => {
      const storedAnswers = await getWrongAnswers();
      if (storedAnswers) {
        setWrongAnswers(storedAnswers);
      }
    };
    initializeWrongAnswers();
  }, []);

  // Getter for current question
  const currentQuestion = activeTest 
    ? activeTest.questions[activeTest.currentQuestionIndex] 
    : null;

  // Calculate progress
  const progress = {
    current: activeTest ? activeTest.currentQuestionIndex + 1 : 0,
    total: activeTest ? activeTest.questions.length : 0,
    percentage: activeTest ? ((activeTest.currentQuestionIndex + 1) / activeTest.questions.length) * 100 : 0
  };

  const isLastQuestion = activeTest ? 
    activeTest.currentQuestionIndex === activeTest.questions.length - 1 : 
    false;

  // Start a new test with custom number of questions (default: 10)
  const startNewTest = async (numQuestions: number = 10) => {
    try {
      // 特殊情况：numQuestions为0时，只重置状态不创建新测试
      if (numQuestions === 0) {
        // 清除当前状态
        setActiveTest(null);
        setSelectedAnswer(null);
        setTestResults(null);
        setShowWrongAnswers(false);
        await clearCurrentTest();
        return;
      }

      // 如果当前有未完成的测试，询问是否要开始新测试
      if (activeTest?.completed === false) {
        const confirmStart = window.confirm("当前有未完成的测试，确定要开始新测试吗？");
        if (!confirmStart) return;
      }

      // 生成测试题目
      console.log(`正在生成${numQuestions}题的测试...`);
      const questions = generateTest(questionBank as Question[], numQuestions);

      if (questions.length === 0) {
        toast({
          title: "错误",
          description: "无法生成测试题目，请检查题库",
          variant: "destructive"
        });
        return;
      }

      // 创建空答案数组
      const answers: Answer[] = questions.map((q, index) => ({
        qid: q.qid,
        questionIndex: index,
        selectedOptionIndex: null,
        correctOptionIndex: q.correctIndex,
        isCorrect: false
      }));

      // 创建新测试
      const newTest: Test = {
        id: generateTestId(),
        questions,
        answers,
        currentQuestionIndex: 0,
        startTime: new Date().toISOString(),
        completed: false
      };

      // 更新状态并保存到存储
      setActiveTest(newTest);
      setSelectedAnswer(null);
      setTestResults(null);
      setShowWrongAnswers(false);
      await saveCurrentTest(newTest);

      // 显示成功提示
      toast({
        description: `已生成${numQuestions}道题的测试`,
        duration: 1500,
      });
    } catch (error) {
      console.error('Error starting new test:', error);
      toast({
        title: "错误",
        description: "创建测试失败，请重试",
        variant: "destructive"
      });
    }
  };

  // Handle answer selection
  const selectAnswer = (optionIndex: number) => {
    if (!activeTest || activeTest.completed) return;

    setSelectedAnswer(optionIndex);

    // Update the test answers
    const updatedTest = { ...activeTest };
    const currentAnswer = updatedTest.answers[updatedTest.currentQuestionIndex];

    // Update the answer
    updatedTest.answers[updatedTest.currentQuestionIndex] = {
      ...currentAnswer,
      selectedOptionIndex: optionIndex,
      isCorrect: optionIndex === currentQuestion?.correctIndex
    };

    // Save the updated test
    setActiveTest(updatedTest);
    saveCurrentTest(updatedTest);

    // Show toast notification with auto-dismiss
    toast({
      description: "已保存答案", // Answer saved
      duration: 500, // 自动消失时间设为0.5秒
      className: "px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-md shadow-sm",
    });
  };

  // Navigate to next question
  const goToNextQuestion = async () => {
    if (!activeTest) return;

    // If there's no selected answer, show a message
    if (selectedAnswer === null) {
      toast({
        title: "Please select an answer",
        description: "You need to select an answer before proceeding.",
        variant: "destructive"
      });
      return;
    }

    // If this is the last question, submit the test
    if (isLastQuestion) {
      await submitTest();
      return;
    }

    // Move to the next question
    const updatedTest = { 
      ...activeTest,
      currentQuestionIndex: activeTest.currentQuestionIndex + 1 
    };

    // Update state and save
    setActiveTest(updatedTest);
    setSelectedAnswer(null);
    await saveCurrentTest(updatedTest);
  };

  // Navigate to previous question
  const goToPreviousQuestion = () => {
    if (!activeTest || activeTest.currentQuestionIndex === 0) return;

    const updatedTest = { 
      ...activeTest,
      currentQuestionIndex: activeTest.currentQuestionIndex - 1 
    };

    // Update state and save
    setActiveTest(updatedTest);

    // Set the previously selected answer for this question
    const prevAnswer = updatedTest.answers[updatedTest.currentQuestionIndex].selectedOptionIndex;
    setSelectedAnswer(prevAnswer);

    saveCurrentTest(updatedTest);
  };

  // Submit the test and calculate results
  const submitTest = async () => {
    if (!activeTest) return;

    try {
      // Mark test as completed
      const completedTest: Test = {
        ...activeTest,
        completed: true,
        endTime: new Date().toISOString()
      };

      // Calculate score
      const correctAnswers = completedTest.answers.filter(a => a.isCorrect).length;
      const totalQuestions = completedTest.questions.length;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      // Create test result
      const result: TestResult = {
        id: completedTest.id,
        timestamp: completedTest.endTime || new Date().toISOString(),
        score: correctAnswers,
        total: totalQuestions,
        percentage
      };

      // Process wrong answers
      const testWrongAnswerTemps: WrongAnswerTemp[] = completedTest.answers
        .filter(answer => !answer.isCorrect && answer.selectedOptionIndex !== null)
        .map(answer => {
          const question = completedTest.questions.find(q => q.qid === answer.qid)!;
          return {
            qid: answer.qid,
            timestamp: completedTest.endTime || new Date().toISOString(), // 确保timestamp一定有值
            question,
            userOptionIndex: answer.selectedOptionIndex!
          };
        });

      // 获取当前已存储的错题列表，用于更新UI
      const currentWrongAnswers = await getWrongAnswers();

      // 保存新的错题（会合并统计错题次数）
      for (const wrongAnswerTemp of testWrongAnswerTemps) {
        await saveWrongAnswer(wrongAnswerTemp);
      }

      // Save test result
      await saveTestResult(result);

      // 重新获取最新的错题列表，包含统计后的数据
      const updatedWrongAnswers = await getWrongAnswers();

      // Update state
      setActiveTest(null);
      setTestResults(result);
      setWrongAnswers(updatedWrongAnswers);
      setSelectedAnswer(null);

      // Clear current test since it's completed
      await clearCurrentTest();
    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Show wrong answers review
  const reviewWrongAnswers = () => {
    setShowWrongAnswers(true);
  };

  // Close wrong answers review
  const closeWrongAnswersReview = () => {
    setShowWrongAnswers(false);
  };

  // Export wrong answers as JSON
  const exportWrongAnswers = () => {
    if (wrongAnswers.length === 0) {
      toast({
        description: "No wrong answers to export",
      });
      return;
    }

    exportWrongAnswersAsJson(wrongAnswers);
    toast({
      description: "错题已导出", // Wrong answers exported
    });
  };

  // 退出当前测试，返回首页
  const exitTest = async () => {
    try {
      const confirmExit = window.confirm("确定要退出测试吗？当前进度将会保存。");
      if (!confirmExit) return;

      setIsLoading(true);

      // 保存当前状态
      if (activeTest && !activeTest.completed) {
        await saveCurrentTest(activeTest);
      }

      // 清理状态
      setActiveTest(null);
      setSelectedAnswer(null);
      setTestResults(null);
      setShowWrongAnswers(false);

      toast({
        description: "已退出测试",
        duration: 1500,
      });
    } catch (error) {
      console.error('Error exiting test:', error);
      toast({
        description: "退出测试时出错，请重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 增加状态同步函数
  const syncTestState = async (test: Test) => {
    try {
      await saveCurrentTest(test);
    } catch (error) {
      console.error('Error syncing test state:', error);
      toast({
        description: "保存测试状态失败",
        variant: "destructive"
      });
    }
  };

  const finishTest = async () => {
    if (!activeTest) return;
    // 清理localStorage中的测试状态
    localStorage.removeItem('activeTest');
    localStorage.removeItem('selectedAnswer');
  };


  // Context value
  const contextValue: TestContextType = {
    activeTest,
    currentQuestion,
    selectedAnswer,
    isLastQuestion,
    progress,
    startNewTest,
    selectAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    submitTest,
    exitTest,
    testResults,
    wrongAnswers,
    showWrongAnswers,
    reviewWrongAnswers,
    closeWrongAnswersReview,
    exportWrongAnswers
  };

  return (
    <TestContext.Provider value={contextValue}>
      {children}
    </TestContext.Provider>
  );
};

// Custom hook to use the test context
export const useTest = () => {
  const context = useContext(TestContext);
  if (context === undefined) {
    throw new Error('useTest must be used within a TestProvider');
  }
  return context;
};