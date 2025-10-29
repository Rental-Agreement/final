import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface LoadingProgressProps {
  total?: number;
  loaded?: number;
  message?: string;
}

export function LoadingProgress({ total, loaded, message = "Loading..." }: LoadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (total && loaded !== undefined) {
      setProgress(Math.round((loaded / total) * 100));
    } else {
      // Simulate progress if we don't have actual numbers
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [total, loaded]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {/* Animated Loader */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xs mb-3">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Message and Percentage */}
      <p className="text-sm font-medium mb-1">{message}</p>
      {total && loaded !== undefined ? (
        <p className="text-xs text-muted-foreground">
          {loaded} of {total} items loaded
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
      )}
    </div>
  );
}
