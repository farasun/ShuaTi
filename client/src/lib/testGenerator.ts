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

// Function to generate a test with the given number of questions based on chapter proportions
export const generateTest = (
  questionBank: Question[],
  totalQuestions: number = 10
): Question[] => {
  if (!questionBank || questionBank.length === 0) {
    return [];
  }

  console.log(`生成测试: 请求题目数量 = ${totalQuestions}`);

  // 初始化日志对象
  const log: TestGenerationLog = {
    total: 0,
    requested: totalQuestions,
    chapter_distribution: {},
    warnings: []
  };

  // 确保题库中有足够的题目
  if (questionBank.length < totalQuestions) {
    console.warn(`警告: 题库中只有 ${questionBank.length} 题, 少于请求的 ${totalQuestions} 题`);
    log.warnings.push(`题库中题目数量(${questionBank.length})少于请求数量(${totalQuestions})`);
  }

  // 获取题库中每章的题目数量
  const availableQuestions = getChapterCounts(questionBank);
  
  // 按官方考纲比例计算每章应分配的题目数量
  const chapterAllocations = calculatePreciseChapterAllocations(
    availableQuestions, 
    totalQuestions,
    log
  );
  
  // 根据分配从各章节选择题目
  const questions = selectQuestionsFromChapters(
    questionBank, 
    chapterAllocations, 
    totalQuestions,
    log
  );
  
  log.total = questions.length;
  console.log('动态组卷完成，分配日志:', log);
  
  return questions;
};

// 获取题库中每章节的题目数量
const getChapterCounts = (questionBank: Question[]): ChapterCount[] => {
  const chapterMap = new Map<string, number>();
  
  // 统计每章的题目数
  questionBank.forEach(question => {
    const count = chapterMap.get(question.chapter) || 0;
    chapterMap.set(question.chapter, count + 1);
  });
  
  // 转换为数组形式
  return Array.from(chapterMap.entries()).map(([chapter, count]) => ({
    chapter,
    count
  }));
};

// 按精确考纲比例计算章节分配
const calculatePreciseChapterAllocations = (
  availableQuestions: ChapterCount[],
  totalQuestions: number,
  log: TestGenerationLog
): Map<string, number> => {
  const allocations = new Map<string, number>();
  const warnings: string[] = [];
  
  // 创建章节可用题目查询映射
  const availableCountByChapter = new Map<string, number>();
  availableQuestions.forEach(({ chapter, count }) => {
    availableCountByChapter.set(chapter, count);
  });
  
  // 计算理论分配（基于官方权重）
  const theoreticalAllocations = new Map<string, number>();
  let theoreticalTotal = 0;
  
  Object.entries(OFFICIAL_CHAPTER_WEIGHTS).forEach(([chapter, weight]) => {
    const theoreticalCount = (weight / 100) * totalQuestions;
    theoreticalAllocations.set(chapter, theoreticalCount);
    theoreticalTotal += theoreticalCount;
    
    // 记录到日志
    log.chapter_distribution[chapter] = {
      actual: 0,
      theoretical: theoreticalCount,
      percentage: `${weight}%`
    };
    
    // 检查章节是否在题库中有题目
    if (!availableCountByChapter.has(chapter)) {
      warnings.push(`${chapter}在题库中没有题目`);
      availableCountByChapter.set(chapter, 0);
    }
  });
  
  // 实施小样本优化策略（N < 50时）
  if (totalQuestions < 50) {
    // 第一步：确保第一梯队章节（权重≥10%）至少有1题
    PRIORITY_TIERS.TIER_1.forEach(chapter => {
      if (availableCountByChapter.get(chapter) || 0 > 0) {
        allocations.set(chapter, Math.max(1, Math.floor(theoreticalAllocations.get(chapter) || 0)));
      } else {
        allocations.set(chapter, 0);
        warnings.push(`${chapter}无可用题目，无法保证最低分配`);
      }
    });
    
    // 第二步：分配第二梯队章节（权重6-8%）
    PRIORITY_TIERS.TIER_2.forEach(chapter => {
      if (availableCountByChapter.get(chapter) || 0 > 0) {
        allocations.set(chapter, Math.floor(theoreticalAllocations.get(chapter) || 0));
      } else {
        allocations.set(chapter, 0);
        warnings.push(`${chapter}无可用题目，无法分配`);
      }
    });
    
    // 第三步：剩余题量按比例分配给第三梯队（权重≤4%）
    const allocatedSoFar = Array.from(allocations.values()).reduce((sum, val) => sum + val, 0);
    const remaining = totalQuestions - allocatedSoFar;
    
    if (remaining > 0) {
      // 计算第三梯队的总理论值
      const tier3Total = PRIORITY_TIERS.TIER_3.reduce((sum, chapter) => 
        sum + (theoreticalAllocations.get(chapter) || 0), 0);
      
      // 按比例分配剩余题目
      PRIORITY_TIERS.TIER_3.forEach(chapter => {
        const available = availableCountByChapter.get(chapter) || 0;
        if (available > 0) {
          const proportion = (theoreticalAllocations.get(chapter) || 0) / tier3Total;
          const allocation = Math.floor(remaining * proportion);
          allocations.set(chapter, allocation);
        } else {
          allocations.set(chapter, 0);
          warnings.push(`${chapter}无可用题目，无法分配`);
        }
      });
    } else {
      // 如果没有剩余题目，第三梯队全部设为0
      PRIORITY_TIERS.TIER_3.forEach(chapter => {
        allocations.set(chapter, 0);
      });
      warnings.push('第一、二梯队章节已占用全部题量，第三梯队章节无法分配题目');
    }
  } else {
    // 标准分配逻辑（N ≥ 50）
    Object.entries(OFFICIAL_CHAPTER_WEIGHTS).forEach(([chapter, weight]) => {
      const available = availableCountByChapter.get(chapter) || 0;
      const theoreticalCount = (weight / 100) * totalQuestions;
      
      if (available >= theoreticalCount) {
        // 如果有足够题目，按理论值分配
        allocations.set(chapter, Math.floor(theoreticalCount));
      } else if (available > 0) {
        // 如果有题目但不足，全部分配
        allocations.set(chapter, available);
        warnings.push(`${chapter}可用题目不足(${available}<${theoreticalCount.toFixed(1)})`);
      } else {
        // 如果没有题目，分配为0
        allocations.set(chapter, 0);
        warnings.push(`${chapter}无可用题目，无法分配`);
      }
    });
  }
  
  // 最终调整：确保总题数正确
  let allocatedTotal = Array.from(allocations.values()).reduce((sum, val) => sum + val, 0);
  let diff = totalQuestions - allocatedTotal;
  
  if (diff !== 0) {
    console.log(`需要调整题目数量: 当前${allocatedTotal}, 目标${totalQuestions}, 差值${diff}`);
    
    // 如果需要增加题目
    if (diff > 0) {
      // 按照权重大小排序章节
      const sortedChapters = Object.entries(OFFICIAL_CHAPTER_WEIGHTS)
        .sort((a, b) => b[1] - a[1])
        .map(([chapter]) => chapter);
      
      for (let i = 0; i < sortedChapters.length && diff > 0; i++) {
        const chapter = sortedChapters[i];
        const available = availableCountByChapter.get(chapter) || 0;
        const current = allocations.get(chapter) || 0;
        
        if (available > current) {
          const toAdd = Math.min(diff, available - current);
          allocations.set(chapter, current + toAdd);
          diff -= toAdd;
        }
      }
    } 
    // 如果需要减少题目
    else if (diff < 0) {
      // 按照权重从小到大排序章节
      const sortedChapters = Object.entries(OFFICIAL_CHAPTER_WEIGHTS)
        .sort((a, b) => a[1] - b[1])
        .map(([chapter]) => chapter);
      
      let remaining = -diff;
      for (let i = 0; i < sortedChapters.length && remaining > 0; i++) {
        const chapter = sortedChapters[i];
        const current = allocations.get(chapter) || 0;
        
        if (current > 0) {
          const toRemove = Math.min(remaining, current);
          allocations.set(chapter, current - toRemove);
          remaining -= toRemove;
        }
      }
    }
    
    allocatedTotal = Array.from(allocations.values()).reduce((sum, val) => sum + val, 0);
    if (allocatedTotal !== totalQuestions) {
      warnings.push(`最终分配题目数(${allocatedTotal})与要求数量(${totalQuestions})不符`);
    }
  }
  
  // 更新日志中的实际分配数
  for (const [chapter, count] of allocations.entries()) {
    if (log.chapter_distribution[chapter]) {
      log.chapter_distribution[chapter].actual = count;
    }
  }
  
  // 验证分配比例偏差
  validateDistribution(allocations, theoreticalAllocations, totalQuestions, warnings);
  
  // 添加警告到日志
  log.warnings.push(...warnings);
  
  return allocations;
};

// 验证分配结果是否符合偏差控制要求
const validateDistribution = (
  actual: Map<string, number>,
  theoretical: Map<string, number>,
  totalQuestions: number,
  warnings: string[]
) => {
  // 计算允许的最大偏差: max(2%, 100%/N)
  const maxDeviationPercent = Math.max(2, 100 / totalQuestions);
  
  for (const [chapter, theoreticalValue] of theoretical.entries()) {
    const actualValue = actual.get(chapter) || 0;
    
    if (theoreticalValue > 0) {
      // 计算实际占比和理论占比
      const theoreticalPercent = (theoreticalValue / totalQuestions) * 100;
      const actualPercent = (actualValue / totalQuestions) * 100;
      const deviation = Math.abs(actualPercent - theoreticalPercent);
      
      // 检查是否超过最大偏差
      if (deviation > maxDeviationPercent) {
        warnings.push(`${chapter}分配偏差(${deviation.toFixed(1)}%)超过允许范围(${maxDeviationPercent.toFixed(1)}%)`);
      }
      
      // 检查单个章节是否超过理论题数的150%
      if (actualValue > theoreticalValue * 1.5) {
        warnings.push(`${chapter}分配题数(${actualValue})超过理论值(${theoreticalValue.toFixed(1)})的150%`);
      }
    }
  }
};

// 根据分配从各章节选择题目
const selectQuestionsFromChapters = (
  questionBank: Question[],
  chapterAllocations: Map<string, number>,
  totalQuestions: number,
  log: TestGenerationLog
): Question[] => {
  const selectedQuestions: Question[] = [];
  
  // 按章节分组
  const questionsByChapter = _.groupBy(questionBank, 'chapter');
  
  // 从每个章节选择题目
  for (const [chapter, allocation] of chapterAllocations.entries()) {
    if (allocation > 0) {
      const chapterQuestions = questionsByChapter[chapter] || [];
      
      // 如果章节题目不足
      if (chapterQuestions.length < allocation) {
        log.warnings.push(`${chapter}实际可用题目(${chapterQuestions.length})少于分配数量(${allocation})`);
      }
      
      // 随机选择题目
      const shuffled = _.shuffle(chapterQuestions);
      const selected = shuffled.slice(0, allocation);
      
      selectedQuestions.push(...selected);
    }
  }
  
  // 最终校验与调整
  let finalQuestions = _.shuffle(selectedQuestions);
  
  // 确保题目数量正确
  if (finalQuestions.length !== totalQuestions) {
    if (finalQuestions.length > totalQuestions) {
      console.log(`最终调整: 从 ${finalQuestions.length} 减少到 ${totalQuestions} 题`);
      finalQuestions = finalQuestions.slice(0, totalQuestions);
    } else if (finalQuestions.length < totalQuestions && questionBank.length >= totalQuestions) {
      // 如果题目不足但题库足够，从题库中随机补充
      console.log(`题目不足: 需要从题库随机补充 ${totalQuestions - finalQuestions.length} 题`);
      
      // 获取未被选中的题目
      const selectedIds = new Set(finalQuestions.map(q => q.qid));
      const remainingQuestions = questionBank.filter(q => !selectedIds.has(q.qid));
      
      // 随机选择并补充
      const additional = _.shuffle(remainingQuestions).slice(0, totalQuestions - finalQuestions.length);
      finalQuestions = [...finalQuestions, ...additional];
      
      log.warnings.push(`由于分配不均，随机补充了${additional.length}题以达到要求数量`);
    }
  }
  
  return finalQuestions;
};
