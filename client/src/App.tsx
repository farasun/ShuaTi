import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from "@/components/AppHeader";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { TestScreen } from "@/components/TestScreen";
import { ResultsScreen } from "@/components/ResultsScreen";
import { WrongAnswersScreen } from "@/components/WrongAnswersScreen";
import { TestProvider, useTest } from "@/context/TestContext";
import { Button } from "@/components/ui/button";

function TestFooter() {
  const { 
    activeTest, 
    goToPreviousQuestion, 
    goToNextQuestion, 
    isLastQuestion,
    selectedAnswer
  } = useTest();
  
  if (!activeTest) return null;
  
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4 fixed bottom-0 left-0 right-0">
      <div className="max-w-3xl mx-auto flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={goToPreviousQuestion}
          disabled={activeTest.currentQuestionIndex === 0}
          className="py-2 px-4 text-gray-600 font-medium"
        >
          上一题
        </Button>
        <Button
          onClick={goToNextQuestion}
          disabled={selectedAnswer === null}
          className="py-2 px-4"
        >
          {isLastQuestion ? '提交测试' : '下一题'}
        </Button>
      </div>
    </footer>
  );
}

function AppContent() {
  const { activeTest, testResults, showWrongAnswers } = useTest();
  
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      
      <main className="flex-grow px-4 py-6 max-w-3xl mx-auto w-full pb-20">
        {!activeTest && !testResults && !showWrongAnswers && <WelcomeScreen />}
        {activeTest && <TestScreen />}
        {testResults && <ResultsScreen />}
        {showWrongAnswers && <WrongAnswersScreen />}
      </main>
      
      {activeTest && <TestFooter />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestProvider>
        <AppContent />
        <Toaster />
      </TestProvider>
    </QueryClientProvider>
  );
}

export default App;
