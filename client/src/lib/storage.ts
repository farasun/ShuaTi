import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import { WRONG_ANSWERS_KEY, USER_STATS_KEY, DEFAULT_STATS } from '@/lib/constants';
import type { WrongAnswer, WrongAnswerTemp, UserStats, TestResult, Test } from '@shared/types';

// Configure localforage
localforage.config({
  name: 'exam-prep-app',
  storeName: 'exam_prep_data',
  description: 'Storage for the Exam Prep Application'
});

// Storage keys
const CURRENT_TEST_KEY = 'currentTest';
const TEST_RESULTS_KEY = 'testResults';

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    await localforage.clear();
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};


// Test Storage Operations
export const saveCurrentTest = async (test: Test): Promise<void> => {
  await localforage.setItem(CURRENT_TEST_KEY, test);
};

export const getCurrentTest = async (): Promise<Test | null> => {
  return await localforage.getItem<Test>(CURRENT_TEST_KEY);
};

export const clearCurrentTest = async (): Promise<void> => {
  await localforage.removeItem(CURRENT_TEST_KEY);
};

// Test Results Operations
export const saveTestResult = async (result: TestResult): Promise<void> => {
  const existingResults = await getTestResults();

  // Keep only the last 3 results
  const updatedResults = [result, ...existingResults].slice(0, 3);
  await localforage.setItem(TEST_RESULTS_KEY, updatedResults);

  // Update stats
  await updateStatsAfterTest(result);
};

export const getTestResults = async (): Promise<TestResult[]> => {
  const results = await localforage.getItem<TestResult[]>(TEST_RESULTS_KEY);
  return results || [];
};

// Wrong Answers Operations
export const getWrongAnswers = async (): Promise<WrongAnswer[]> => {
  try {
    const wrongAnswers = await localforage.getItem<WrongAnswer[]>(WRONG_ANSWERS_KEY);
    if (!wrongAnswers) {
      await localforage.setItem(WRONG_ANSWERS_KEY, []);
      return [];
    }
    return wrongAnswers;
  } catch (error) {
    console.error('Error loading wrong answers:', error);
    return [];
  }
};

export const saveWrongAnswer = async (wrongAnswerTemp: WrongAnswerTemp): Promise<void> => {
  try {
    console.log('Processing wrong answer:', wrongAnswerTemp);
    
    // 确保题目数据完整性
    if (!wrongAnswerTemp.question) {
      console.error('Cannot save wrong answer: question data is missing', wrongAnswerTemp);
      return;
    }
    
    // 获取现有错题
    const currentWrongAnswers = await getWrongAnswers();
    
    // 查找是否已存在相同qid的错题
    const existingIndex = currentWrongAnswers.findIndex(wa => wa.qid === wrongAnswerTemp.qid);
    
    // 如果已存在相同qid的错题，更新错题数据
    if (existingIndex !== -1) {
      console.log('Updating existing wrong answer count:', wrongAnswerTemp.qid);
      
      // 更新最后答错时间和错误次数
      const updatedWrongAnswer: WrongAnswer = {
        ...currentWrongAnswers[existingIndex],
        timestamp: wrongAnswerTemp.timestamp, // 更新为最新的时间戳
        wrongCount: currentWrongAnswers[existingIndex].wrongCount + 1 // 增加错误次数
      };
      
      // 替换原有记录
      currentWrongAnswers[existingIndex] = updatedWrongAnswer;
    } else {
      // 如果是新的错题，创建新记录
      const newWrongAnswer: WrongAnswer = {
        qid: wrongAnswerTemp.qid,
        timestamp: wrongAnswerTemp.timestamp,
        question: wrongAnswerTemp.question,
        wrongCount: 1 // 初始错误次数为1
      };
      
      // 添加到数组
      currentWrongAnswers.push(newWrongAnswer);
    }
    
    console.log('Saving updated wrong answers collection:', currentWrongAnswers);
    
    // 保存所有错题
    await localforage.setItem(WRONG_ANSWERS_KEY, currentWrongAnswers);
    
    // 验证保存是否成功
    const savedAnswers = await localforage.getItem(WRONG_ANSWERS_KEY);
    console.log('Verified saved answers:', savedAnswers);
  } catch (error) {
    console.error('Error saving wrong answer:', error);
  }
};

export const saveWrongAnswers = async (wrongAnswers: WrongAnswer[]): Promise<void> => {
  try {
    if (!wrongAnswers || !Array.isArray(wrongAnswers)) {
      console.error('Cannot save wrong answers: invalid data format', wrongAnswers);
      return;
    }
    
    console.log('Bulk saving wrong answers:', wrongAnswers.length);
    await localforage.setItem(WRONG_ANSWERS_KEY, wrongAnswers);
    
    // 验证保存
    const saved = await localforage.getItem(WRONG_ANSWERS_KEY);
    console.log('Verified bulk saved answers:', saved);
  } catch (error) {
    console.error('Error saving wrong answers:', error);
  }
};

// Stats Operations
export const getUserStats = async (): Promise<UserStats> => {
  const stats = await localforage.getItem<UserStats>(USER_STATS_KEY);
  return stats || DEFAULT_STATS;
};

export const updateUserStats = async (stats: UserStats): Promise<void> => {
  await localforage.setItem(USER_STATS_KEY, stats);
};

const updateStatsAfterTest = async (result: TestResult): Promise<void> => {
  const currentStats = await getUserStats();

  const updatedStats: UserStats = {
    totalTests: currentStats.totalTests + 1,
    totalQuestions: currentStats.totalQuestions + result.total,
    correctAnswers: currentStats.correctAnswers + result.score,
    wrongAnswers: currentStats.wrongAnswers + (result.total - result.score)
  };

  await updateUserStats(updatedStats);
};

// Helper to generate unique test ID
export const generateTestId = (): string => {
  return uuidv4();
};

// Export test data as JSON
export const exportWrongAnswersAsJson = (wrongAnswers: WrongAnswer[]): void => {
  const dataStr = JSON.stringify(wrongAnswers, null, 2);
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

  const exportLink = document.createElement("a");
  exportLink.setAttribute("href", dataUri);
  exportLink.setAttribute("download", "wrong_answers.json");
  exportLink.click();
};

