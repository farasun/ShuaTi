import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value: number
    max?: number
    className?: string
    indicatorClassName?: string
  }
>(({ className, value, max = 100, indicatorClassName, ...props }, ref) => {
  const percentage = value >= 0 ? Math.min(value, max) / max * 100 : 0

  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200", 
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all",
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
