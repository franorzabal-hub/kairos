import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast from '../components/Toast';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showError: (error: unknown) => void;
  showSuccess: (message: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Global toast provider for showing feedback messages throughout the app.
 * Used by the global error handler to display API errors.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ visible: true, message, type });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((error: unknown) => {
    let message = 'Ocurrió un error. Por favor intenta de nuevo.';

    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Network')) {
        message = 'Error de conexión. Verifica tu internet.';
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        message = 'Sesión expirada. Por favor inicia sesión nuevamente.';
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        message = 'No tienes permiso para realizar esta acción.';
      } else if (error.message.includes('404')) {
        message = 'El recurso no fue encontrado.';
      } else if (error.message.includes('500')) {
        message = 'Error del servidor. Por favor intenta más tarde.';
      } else if (error.message.length < 100) {
        // Use error message if it's short enough
        message = error.message;
      }
    }

    showToast(message, 'error');
  }, [showToast]);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, hideToast }}>
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functions.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
