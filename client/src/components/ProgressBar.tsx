
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = current > 0 ? Math.min((current / total) * 100, 100) : 0;
  
  return (
    <Progress 
      value={progress} 
      max={100}
      className="w-full bg-gray-200"
      indicatorClassName="bg-primary transition-all duration-300 ease-in-out"
    />
  );
}
