const ProgressBar = ({ progress }: { progress: number }) => {
  // 根据进度动态计算颜色
  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 60) return 'bg-yellow-500';
    if (progress < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div
        className={`${getProgressColor(progress)} h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};


const SuccessMessage = ({ visible, message }: { visible: boolean; message: string }) => {
  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full bg-green-100 text-green-700 p-4 text-sm">
      {message}
    </div>
  );
};

// ... rest of the component code ...  (This is a placeholder.  The actual rest of the component needs to be provided to complete the code.)