import { useEffect, useRef, useState } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at the top of the scroll container
      if (container.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        touchStartY.current = startY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === 0 || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;

      // Only pull down when at top and pulling down
      if (container.scrollTop === 0 && distance > 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          touchStartY.current = 0;
        }
      } else {
        setPullDistance(0);
        touchStartY.current = 0;
      }
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, onRefresh, isRefreshing, pullDistance]);

  return {
    scrollContainerRef,
    isRefreshing,
    pullDistance,
    isPulling: pullDistance > 0,
  };
}
