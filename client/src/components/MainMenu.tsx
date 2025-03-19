import React from 'react';
import { X, Home, AlertTriangle, Download, Info } from 'lucide-react';
import { useTest } from '@/context/TestContext';
import { useToast } from '@/hooks/use-toast';

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ isOpen, onClose }) => {
  const { 
    reviewWrongAnswers, 
    exportWrongAnswers,
    activeTest,
    testResults,
    showWrongAnswers
  } = useTest();
  const { toast } = useToast();

  const handleWrongAnswersClick = () => {
    onClose();
    reviewWrongAnswers();
  };

  const handleExportClick = () => {
    onClose();
    exportWrongAnswers();
  };

  const handleHomeClick = () => {
    onClose();
    // 强制刷新页面回到首页
    window.location.reload();
  };
  
  const handleAboutClick = () => {
    onClose();
    toast({
      description: "成人技能考试刷题工具 V1.0",
      duration: 2000, // 2秒后自动消失
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="absolute right-0 top-0 h-full bg-white w-64 shadow-xl">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-medium text-lg">菜单</h3>
          <button 
            className="text-gray-500 hover:text-gray-700" 
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="py-2">
          <button 
            className="block w-full text-left px-4 py-3 hover:bg-gray-50"
            onClick={handleHomeClick}
          >
            <div className="flex items-center">
              <Home className="h-5 w-5 mr-3 text-gray-500" />
              首页
            </div>
          </button>
          <button 
            className="block w-full text-left px-4 py-3 hover:bg-gray-50"
            onClick={handleWrongAnswersClick}
          >
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-3 text-gray-500" />
              错题本
            </div>
          </button>
          <button 
            className="block w-full text-left px-4 py-3 hover:bg-gray-50"
            onClick={handleExportClick}
          >
            <div className="flex items-center">
              <Download className="h-5 w-5 mr-3 text-gray-500" />
              导出错题
            </div>
          </button>
          <button 
            className="block w-full text-left px-4 py-3 hover:bg-gray-50"
            onClick={handleAboutClick}
          >
            <div className="flex items-center">
              <Info className="h-5 w-5 mr-3 text-gray-500" />
              关于
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};