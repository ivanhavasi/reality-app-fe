import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';

interface ErrorContextType {
  error: string | null;
  setError: (message: string | null) => void;
  clearError: () => void;
}

// Create a default context value to avoid undefined errors
const defaultContextValue: ErrorContextType = {
  error: null,
  setError: () => {},
  clearError: () => {}
};

const ErrorContext = createContext<ErrorContextType>(defaultContextValue);

export const ErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setErrorState] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState<number>(0);

  // Force a re-render when the same error is set again
  const setError = useCallback((message: string | null) => {
    console.log('ErrorContext: Setting error to', message);
    // Update timestamp to force re-render even if error message is the same
    setTimestamp(Date.now());
    setErrorState(message);
  }, []);

  const clearError = useCallback(() => {
    console.log('ErrorContext: Clearing error');
    setErrorState(null);
  }, []);

  // Debug logging to track error state changes
  useEffect(() => {
    if (error) {
      console.log(`Error state changed at ${timestamp}: ${error}`);
    }
  }, [error, timestamp]);

  // Recreate the context value only when the functions change
  const contextValue = React.useMemo(() => ({
    error,
    setError,
    clearError
  }), [error, setError, clearError]);

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = (): ErrorContextType => {
  return useContext(ErrorContext);
};
