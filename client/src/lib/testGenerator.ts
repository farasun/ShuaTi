import { Question, ChapterCount } from '@shared/types';
import _ from 'lodash';

// CDGA官方考纲章节占比（百分比）
const OFFICIAL_CHAPTER_WEIGHTS: Record<string, number> = {
  '第1章': 4,   // 数据管理知识体系概述
  '第2章': 2,   // 数据管理与商业价值
  '第3章': 10,  // 数据治理
  '第4章': 10,  // 数据架构
  '第5章': 10,  // 数据建模与设计
  '第6章': 4,   // 数据存储与操作
  '第7章': 8,   // 数据安全
  '第8章': 4,   // 数据集成与互操作性
  '第9章': 4,   // 文档与内容管理
  '第10章': 4,  // 参考与主数据
  '第11章': 10, // 数据仓库与商务智能
  '第12章': 10, // 元数据
  '第13章': 10, // 数据质量
  '第14章': 4,  // 大数据与数据科学
  '第15章': 6,  // 数据管理组织
  '第16章': 4,  // 数据管理项目管理
  '第17章': 2,  // 数据管理与组织变革
};

// 章节优先级分组（根据要求定义）
const PRIORITY_TIERS = {
  TIER_1: ['第3章', '第4章', '第5章', '第11章', '第12章', '第13章'], // 权重≥10%
  TIER_2: ['第7章', '第15章'],                                      // 权重6-8%
  TIER_3: ['第1章', '第2章', '第6章', '第8章', '第9章', '第10章', '第14章', '第16章', '第17章'] // 权重≤4%
};

// 测试生成日志结构
interface TestGenerationLog {
  total: number;
  requested: number;
  chapter_distribution: Record<string, {
    actual: number;
    theoretical: number;
    percentage: string;
  }>;
  warnings: string[];
}


// Helper function to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};


// Placeholder for database interaction - replace with actual implementation
const getAvailableQuestionCountByChapter = async (): Promise<Map<string, number>> => {
  // Replace this with your actual database query to get available question counts per chapter
  // Example using a mock database
  const mockDatabase = {
    '第1章': 10,
    '第2章': 5,
    '第3章': 20,
    '第4章': 15,
    '第5章': 12,
    '第6章': 8,
    '第7章': 18,
    '第8章': 6,
    '第9章': 7,
    '第10章': 9,
    '第11章': 25,
    '第12章': 16,
    '第13章': 22,
    '第14章': 11,
    '第15章': 14,
    '第16章': 10,
    '第17章': 4,
  };
  return new Map(Object.entries(mockDatabase));
};

// Placeholder for database interaction - replace with actual implementation
const getRandomQuestionsByChapter = async (chapter: string, count: number): Promise<Question[]> => {
  // Replace this with your actual database query to get random questions for a given chapter
  // Example using a mock database
  const mockQuestions: Question[] = [
    { qid: '1', chapter: '第1章', text: 'Question 1', answer: 'A' },
    { qid: '2', chapter: '第1章', text: 'Question 2', answer: 'B' },
    // ... more mock questions ...
  ];

  return shuffleArray(mockQuestions.filter(q => q.chapter === chapter).slice(0, count));
};


// 生成测试的函数
export async function generateTest(totalQuestions: number): Promise<Question[]> {
  console.log('生成测试: 请求题目数量 =', totalQuestions);

  // 初始化分配结果Map
  const allocations = new Map<string, number>();

  // 计算每章理论题目数
  const theoreticalAllocations = new Map<string, number>();
  Object.entries(OFFICIAL_CHAPTER_WEIGHTS).forEach(([chapter, weight]) => {
    theoreticalAllocations.set(chapter, Math.round(totalQuestions * weight / 100));
  });

  // 获取每章可用题目数
  const availableCountByChapter = await getAvailableQuestionCountByChapter();

  // 初始分配
  theoreticalAllocations.forEach((count, chapter) => {
    const available = availableCountByChapter.get(chapter) || 0;
    allocations.set(chapter, Math.min(count, available));
  });

  // 计算当前总题数
  let currentTotal = Array.from(allocations.values()).reduce((sum, count) => sum + count, 0);
  let diff = totalQuestions - currentTotal;

  // 如果需要增加题目
  if (diff > 0) {
    // 计算单章节最大允许题数(20%上限)
    const maxPerChapter = Math.ceil(totalQuestions * 0.2);

    // 轮询所有章节进行补充
    while (diff > 0) {
      let allocated = false;
      for (const [chapter, weight] of Object.entries(OFFICIAL_CHAPTER_WEIGHTS)) {
        const available = availableCountByChapter.get(chapter) || 0;
        const current = allocations.get(chapter) || 0;

        // 检查是否超过单章节上限
        if (current < maxPerChapter && available > current && diff > 0) {
          allocations.set(chapter, current + 1);
          diff--;
          allocated = true;
        }
      }
      if (!allocated) break;
    }
  }

  // 记录分配结果
  const distributionLog = {
    total: totalQuestions,
    requested: totalQuestions,
    chapter_distribution: Object.fromEntries(
      Object.entries(OFFICIAL_CHAPTER_WEIGHTS).map(([chapter, weight]) => [
        chapter,
        {
          actual: allocations.get(chapter) || 0,
          theoretical: theoreticalAllocations.get(chapter) || 0,
          percentage: `${weight}%`
        }
      ])
    ),
    warnings: diff > 0 ? [`还缺少${diff}题未能分配`] : []
  };

  console.log('动态组卷完成，分配日志:', distributionLog);

  // 根据分配结果获取题目
  const selectedQuestions: Question[] = [];
  for (const [chapter, count] of allocations) {
    if (count > 0) {
      const questions = await getRandomQuestionsByChapter(chapter, count);
      selectedQuestions.push(...questions);
    }
  }

  // 打乱题目顺序
  return shuffleArray(selectedQuestions);
}