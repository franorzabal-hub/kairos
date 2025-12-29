import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, AppUser } from '../api/directus';

type FilterMode = 'unread' | 'all';

interface AppContextType {
  // User state
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  isAuthenticated: boolean;

  // Children state
  children: Student[];
  setChildren: (children: Student[]) => void;

  // Global filter state
  filterMode: FilterMode;
  setFilterMode: (mode: FilterMode) => void;
  selectedChildId: string | null; // null means "all children"
  setSelectedChildId: (id: string | null) => void;

  // Unread counts per tab
  unreadCounts: {
    novedades: number;
    eventos: number;
    mensajes: number;
    cambios: number;
    boletines: number;
  };
  setUnreadCounts: (counts: Partial<AppContextType['unreadCounts']>) => void;
}

const defaultUnreadCounts = {
  novedades: 0,
  eventos: 0,
  mensajes: 0,
  cambios: 0,
  boletines: 0,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children: childrenProp }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [children, setChildren] = useState<Student[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [unreadCounts, setUnreadCountsState] = useState(defaultUnreadCounts);

  const setUnreadCounts = (counts: Partial<AppContextType['unreadCounts']>) => {
    setUnreadCountsState(prev => ({ ...prev, ...counts }));
  };

  const isAuthenticated = user !== null;

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        children,
        setChildren,
        filterMode,
        setFilterMode,
        selectedChildId,
        setSelectedChildId,
        unreadCounts,
        setUnreadCounts,
      }}
    >
      {childrenProp}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Convenience hooks
export function useFilters() {
  const { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children } = useAppContext();
  return { filterMode, setFilterMode, selectedChildId, setSelectedChildId, children };
}

export function useUnreadCounts() {
  const { unreadCounts, setUnreadCounts } = useAppContext();
  return { unreadCounts, setUnreadCounts };
}
