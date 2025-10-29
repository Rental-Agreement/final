import { useState, useEffect } from "react";

const MAX_COMPARE = 4;
const STORAGE_KEY = "property_comparison";

export const usePropertyComparison = () => {
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const addToCompare = (propertyId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(propertyId)) return prev;
      if (prev.length >= MAX_COMPARE) {
        return [...prev.slice(1), propertyId]; // Remove oldest, add new
      }
      return [...prev, propertyId];
    });
  };

  const removeFromCompare = (propertyId: string) => {
    setCompareIds((prev) => prev.filter((id) => id !== propertyId));
  };

  const clearComparison = () => {
    setCompareIds([]);
  };

  const isInComparison = (propertyId: string) => compareIds.includes(propertyId);

  return {
    compareIds,
    addToCompare,
    removeFromCompare,
    clearComparison,
    isInComparison,
    canAddMore: compareIds.length < MAX_COMPARE,
    count: compareIds.length,
  };
};
