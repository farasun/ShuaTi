import React, { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { MainMenu } from './MainMenu';
import { useTest } from '@/context/TestContext';
import { Button } from './ui/button';

export const AppHeader: React.FC = () => {
  const [showMainMenu, setShowMainMenu] = useState(false);
  const { activeTest, exitTest } = useTest();
  
  const toggleMainMenu = () => {
    setShowMainMenu(!showMainMenu);
  };
  
  return (
    <>
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">ExamPrep</h1>
          <div className="flex space-x-2 items-center">
            {activeTest ? (
              <Button 
                variant="destructive" 
                size="sm"
                className="hover:bg-red-600 transition-colors"
                onClick={exitTest}
              >
                <LogOut className="h-4 w-4 mr-1" /> 退出测试
              </Button>
            ) : (
              <button 
                className="p-2 rounded-full hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-white"
                onClick={toggleMainMenu}
                aria-label="Menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      </header>
      
      {!activeTest && <MainMenu isOpen={showMainMenu} onClose={() => setShowMainMenu(false)} />}
    </>
  );
};
