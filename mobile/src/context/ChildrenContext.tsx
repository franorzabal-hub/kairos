/**
 * ChildrenContext - Focused context for children/students state
 *
 * Handles:
 * - List of children for current user
 * - Child selection state (when needed across screens)
 */
import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from 'react';
import { Student } from '../api/directus';

interface ChildrenContextType {
  children: Student[];
  setChildren: (children: Student[]) => void;
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;
  // Helper to get child by ID
  getChildById: (id: string) => Student | undefined;
  // Helper to check if a child belongs to the user
  hasChild: (childId: string) => boolean;
}

const ChildrenContext = createContext<ChildrenContextType | undefined>(undefined);

export function ChildrenProvider({ children: childrenProp }: { children: ReactNode }) {
  const [childrenList, setChildrenList] = useState<Student[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const getChildById = useCallback((id: string) => {
    return childrenList.find(child => child.id === id);
  }, [childrenList]);

  const hasChild = useCallback((childId: string) => {
    return childrenList.some(child => child.id === childId);
  }, [childrenList]);

  const contextValue = useMemo<ChildrenContextType>(() => ({
    children: childrenList,
    setChildren: setChildrenList,
    selectedChildId,
    setSelectedChildId,
    getChildById,
    hasChild,
  }), [childrenList, selectedChildId, getChildById, hasChild]);

  return (
    <ChildrenContext.Provider value={contextValue}>
      {childrenProp}
    </ChildrenContext.Provider>
  );
}

export function useChildren() {
  const context = useContext(ChildrenContext);
  if (context === undefined) {
    throw new Error('useChildren must be used within a ChildrenProvider');
  }
  return context;
}

// Convenience hook for just the children list (common use case)
export function useChildrenList() {
  const { children } = useChildren();
  return children;
}

export { ChildrenContext };
