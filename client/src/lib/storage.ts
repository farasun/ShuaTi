import { v4 as uuidv4 } from 'uuid';
import type { WrongAnswer, WrongAnswerTemp, UserStats, TestResult, Test } from '@shared/types';
import { db } from './db';
import { WRONG_ANSWERS_KEY, USER_STATS_KEY, DEFAULT_STATS } from '@/lib/constants';

const CURRENT_TEST_KEY = 'currentTest';

// Wrong Answers Operations
export const getWrongAnswers = async (): Promise<WrongAnswer[]> => {
  try {
    return await db.wrongAnswers.toArray();
  } catch (error) {
    console.error('Error loading wrong answers:', error);
    return [];
  }
};

export const saveWrongAnswer = async (wrongAnswerTemp: WrongAnswerTemp): Promise<void> => {
  try {
    const wrongAnswer: WrongAnswer = {
      ...wrongAnswerTemp,
      wrongCount: 1
    };

    await db.transaction('rw', db.wrongAnswers, async () => {
      const existing = await db.wrongAnswers.get(wrongAnswer.qid);
      if (existing) {
        await db.wrongAnswers.put({
          ...existing,
          timestamp: wrongAnswer.timestamp,
          wrongCount: (existing.wrongCount || 0) + 1
        });
      } else {
        await db.wrongAnswers.put(wrongAnswer);
      }
    });
  } catch (error) {
    console.error('Error saving wrong answer:', error);
    throw error;
  }
};

export const saveWrongAnswers = async (wrongAnswers: WrongAnswer[]): Promise<void> => {
  if (!wrongAnswers || !Array.isArray(wrongAnswers)) {
    console.error('Cannot save wrong answers: invalid data format');
    return;
  }

  try {
    await db.transaction('rw', db.wrongAnswers, async () => {
      await db.wrongAnswers.clear();
      await db.wrongAnswers.bulkPut(wrongAnswers);
    });
  } catch (error) {
    console.error('Error bulk saving wrong answers:', error);
    throw error;
  }
};

// Test Results Operations
export const saveTestResult = async (result: TestResult): Promise<void> => {
  try {
    await db.testResults.put(result);
  } catch (error) {
    console.error('Error saving test result:', error);
    throw error;
  }
};

// Current Test Operations
export const saveCurrentTest = async (test: Test): Promise<void> => {
  try {
    localStorage.setItem(CURRENT_TEST_KEY, JSON.stringify(test));
  } catch (error) {
    console.error('Error saving current test:', error);
  }
};

export const getCurrentTest = async (): Promise<Test | null> => {
  try {
    const saved = localStorage.getItem(CURRENT_TEST_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Error loading current test:', error);
    return null;
  }
};

export const clearCurrentTest = async (): Promise<void> => {
  localStorage.removeItem(CURRENT_TEST_KEY);
};

// Stats Operations
export const getUserStats = async (): Promise<UserStats> => {
  try {
    const saved = localStorage.getItem(USER_STATS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_STATS;
  } catch (error) {
    console.error('Error loading user stats:', error);
    return DEFAULT_STATS;
  }
};

export const updateUserStats = async (stats: UserStats): Promise<void> => {
  try {
    localStorage.setItem(USER_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving user stats:', error);
  }
};

export const generateTestId = (): string => {
  return uuidv4();
};

export const DEFAULT_STATS: UserStats = {
  totalTests: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  wrongAnswers: 0
};

export const clearAllData = async (): Promise<void> => {
  try {
    await db.transaction('rw', db.wrongAnswers, db.testResults, async () => {
      await db.wrongAnswers.clear();
      await db.testResults.clear();
    });
    localStorage.removeItem(CURRENT_TEST_KEY);
    localStorage.removeItem(USER_STATS_KEY);
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

export const getTestResults = async (): Promise<TestResult[]> => {
  try {
    return await db.testResults.toArray();
  } catch (error) {
    console.error('Error loading test results:', error);
    return [];
  }
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