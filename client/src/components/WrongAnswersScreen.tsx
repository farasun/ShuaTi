import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Check, ArrowLeft, BookOpen, Trash2, Eye, EyeOff, Copy } from 'lucide-react';
import { useTest } from '@/context/TestContext';
import { getWrongAnswers, saveWrongAnswers } from '@/lib/storage';
import { WrongAnswer } from '@shared/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export const WrongAnswersScreen: React.FC = () => {
  const { closeWrongAnswersReview } = useTest();
  const { toast } = useToast();
  const [localWrongAnswers, setLocalWrongAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState<{[key: string]: boolean}>({});
  const [sortBy, setSortBy] = useState<'time' | 'count' | 'chapter'>('time');
  
  // 复制QID到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast({
          description: "已复制到剪贴板",
          duration: 500, // 0.5秒后自动消失
        });
      })
      .catch(err => {
        console.error('复制失败:', err);
        toast({
          description: "复制失败，请手动复制",
          variant: "destructive",
        });
      });
  };
  
  // 从localStorage加载错题数据
  useEffect(() => {
    const loadWrongAnswers = async () => {
      try {
        setLoading(true);
        const storedAnswers = await getWrongAnswers();
        console.log('Loaded wrong answers from storage:', storedAnswers);
        
        if (storedAnswers && Array.isArray(storedAnswers)) {
          setLocalWrongAnswers(storedAnswers);
          
          // 初始化显示答案的状态 - 默认隐藏所有正确答案
          const initialShowState: {[key: string]: boolean} = {};
          storedAnswers.forEach(wa => {
            initialShowState[wa.qid] = false; // 默认隐藏正确答案
          });
          setShowAnswers(initialShowState);
        }
      } catch (error) {
        console.error('Error loading wrong answers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadWrongAnswers();
  }, []);
  
  // 排序错题列表
  const sortedWrongAnswers = React.useMemo(() => {
    if (sortBy === 'time') {
      return [...localWrongAnswers].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } else if (sortBy === 'count') {
      return [...localWrongAnswers].sort((a, b) => (b.wrongCount || 0) - (a.wrongCount || 0));
    } else if (sortBy === 'chapter') {
      return [...localWrongAnswers].sort((a, b) => {
        // First check if questions exist
        if (!a.question || !b.question) return 0;
        
        // Then compare chapters
        if (a.question.chapter !== b.question.chapter) {
          return (a.question.chapter || '').localeCompare(b.question.chapter || '');
        }
        
        // Finally compare knowledge point IDs if they exist
        const aKnowledgeId = a.question.knowledgePointId || '';
        const bKnowledgeId = b.question.knowledgePointId || '';
        return aKnowledgeId.localeCompare(bKnowledgeId);
      });
    }
    return localWrongAnswers;
  }, [localWrongAnswers, sortBy]);
  
  // 切换显示/隐藏答案
  const toggleShowAnswer = (qid: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };
  
  // 删除单个错题
  const removeWrongAnswer = async (qid: string) => {
    if (window.confirm('确定要删除这道错题吗？')) {
      const updatedAnswers = localWrongAnswers.filter(wa => wa.qid !== qid);
      setLocalWrongAnswers(updatedAnswers);
      await saveWrongAnswers(updatedAnswers);
    }
  };
  
  // 返回首页 - 使用状态管理而非页面刷新
  const handleBackClick = () => {
    // 添加加载状态反馈
    setLoading(true);
    
    // 使用setTimeout模拟异步，但实际很快就会执行
    setTimeout(() => {
      closeWrongAnswersReview();
    }, 100);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <button 
            onClick={handleBackClick}
            className="mr-3 p-2 rounded-full hover:bg-gray-100"
            aria-label="返回首页"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">错题本</h2>
        </div>
        <div className="text-sm text-gray-500">
          共 {localWrongAnswers.length} 道错题
        </div>
      </div>
      
      {/* 排序选项 */}
      <div className="flex mb-4 space-x-2">
        <Button 
          onClick={() => setSortBy('time')} 
          variant={sortBy === 'time' ? 'default' : 'outline'}
          size="sm"
        >
          按时间排序
        </Button>
        <Button 
          onClick={() => setSortBy('count')} 
          variant={sortBy === 'count' ? 'default' : 'outline'}
          size="sm"
        >
          按错误次数
        </Button>
        <Button 
          onClick={() => setSortBy('chapter')} 
          variant={sortBy === 'chapter' ? 'default' : 'outline'}
          size="sm"
        >
          按章节排序
        </Button>
      </div>

      {localWrongAnswers.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">暂无错题记录</p>
            <Button 
              onClick={handleBackClick}
              className="mt-4"
            >
              返回首页
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {sortedWrongAnswers.map((wrongAnswer, index) => (
            <Card key={index} className="shadow-sm mb-4">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-blue-50">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {wrongAnswer.question.knowledgePointId || '未知知识点'}
                    </Badge>
                    <Badge variant="outline" className="bg-red-50">
                      错误 {wrongAnswer.wrongCount || 0} 次
                    </Badge>
                  </div>
                  <button 
                    className="p-1.5 rounded-full hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors" 
                    onClick={() => toggleShowAnswer(wrongAnswer.qid)}
                    aria-label={showAnswers[wrongAnswer.qid] ? "隐藏正确答案" : "显示正确答案"}
                    title={showAnswers[wrongAnswer.qid] ? "隐藏正确答案" : "显示正确答案"}
                  >
                    {showAnswers[wrongAnswer.qid] ? 
                      <EyeOff className="h-5 w-5 text-gray-700" /> : 
                      <Eye className="h-5 w-5 text-gray-700" />
                    }
                  </button>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {wrongAnswer.question.text}
                </h3>
                
                {/* 默认显示所有选项，根据眼睛图标状态决定是否高亮正确答案 */}
                <div className="space-y-3 mb-4 mt-5">
                  {wrongAnswer.question.options.map((option, optionIndex) => {
                    const isCorrect = optionIndex === wrongAnswer.question.correctIndex;
                    const showCorrect = showAnswers[wrongAnswer.qid] && isCorrect;
                    
                    return (
                      <div 
                        key={optionIndex} 
                        className={`p-3 rounded-lg ${
                          showCorrect
                            ? 'border-2 border-green-500 bg-green-50' 
                            : 'border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start">
                          {showCorrect && (
                            <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-gray-900">{option}</div>
                            {showCorrect && (
                              <div className="text-sm text-green-600 mt-1">正确答案</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 题目信息 */}
                <div className="flex justify-between items-center text-sm text-gray-500 mt-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    {/* QID标签 - 可点击复制 */}
                    <button 
                      onClick={() => copyToClipboard(wrongAnswer.qid)}
                      className="flex items-center space-x-1 bg-gray-700 text-white px-2 py-1 rounded-md hover:bg-gray-600 transition-colors cursor-pointer"
                      title="点击复制题目ID"
                    >
                      <span className="text-xs">ID:{wrongAnswer.qid}</span>
                      <Copy className="h-3 w-3" />
                    </button>
                    <span>{wrongAnswer.question.chapter} · 难度: {wrongAnswer.question.difficulty}</span>
                  </div>
                  <div>
                    最近错误: {new Date(wrongAnswer.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex justify-center mt-6 pb-6">
            <Button 
              onClick={handleBackClick}
              size="lg"
            >
              返回首页
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
