// Question structure that matches both server and client needs
export interface Question {
  qid: string; // 格式：1-1-0001 (知识点编号-序号)
  text: string;
  options: string[];
  correctIndex: number;
  chapter: string;
  difficulty: string;
  knowledgePointId: string; // 新增：知识点编号，格式：1-1, 1-2
}

// User's answer to a question in a test
export interface Answer {
  qid: string;
  questionIndex: number;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
}

// Test session data structure
export interface Test {
  id: string;
  questions: Question[];
  answers: Answer[];
  currentQuestionIndex: number;
  startTime: string;
  endTime?: string;
  completed: boolean;
}

// Test result summary
export interface TestResult {
  id: string;
  timestamp: string;
  score: number;
  total: number;
  percentage: number;
}

// Wrong answer record - 记录当前错题的信息
export interface WrongAnswerTemp {
  qid: string;
  timestamp: string;
  question: Question;
  userOptionIndex: number;
}

// 错题统计记录 - 用于存储和展示
export interface WrongAnswer {
  qid: string;
  timestamp: string; // 最近一次答错的时间
  question: Question;
  wrongCount: number; // 新增：错误次数
}

// User statistics
export interface UserStats {
  totalTests: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
}

// For chapter-based question selection
export interface ChapterCount {
  chapter: string;
  count: number;
}
