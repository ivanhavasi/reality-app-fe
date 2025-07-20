import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { tokenService } from '../services/TokenService';
import { getUserInfo, setTokenExpirationCallback } from '../services/api';
import { useUser } from './UserContext';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const { setUser } = useUser();
  const initializationDone = useRef(false);

  const logout = useCallback(() => {
    console.log('Logging out user');
    tokenService.removeToken();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  }, [setUser]);

  // Initialize authentication state from localStorage - run only once
  useEffect(() => {
    if (initializationDone.current) return;

    const initializeAuth = async () => {
      const storedToken = tokenService.getToken();

      if (!storedToken) {
        setIsAuthenticated(false);
        setIsInitializing(false);
        initializationDone.current = true;
        return;
      }

      // Token exists in localStorage, assume it's valid initially
      setToken(storedToken);
      setIsAuthenticated(true);

      // Try to fetch user info to populate user context - only if user context is empty
      try {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      } catch (error) {
        console.warn('Failed to fetch user info on initialization:', error);
        // Don't logout here - let the API interceptor handle actual token expiration
      } finally {
        setIsInitializing(false);
        initializationDone.current = true;
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - run only once

  // Set up token expiration callback - run only once
  useEffect(() => {
    setTokenExpirationCallback(() => {
      console.log('Token expired detected by API interceptor, triggering logout');
      logout();
    });
  }, [logout]);

  const login = useCallback(async (accessToken: string) => {
    tokenService.setToken(accessToken);
    setToken(accessToken);
    setIsAuthenticated(true);

    // Fetch user info and store the ID
    try {
      const userInfo = await getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to fetch user info after login:', error);
      // If we can't fetch user info with the new token, it might be invalid
      logout();
    }
  }, [setUser, logout]);

  const value = {
    token,
    isAuthenticated,
    isInitializing,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
