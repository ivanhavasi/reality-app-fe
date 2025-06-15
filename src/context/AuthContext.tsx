import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { tokenService } from '../services/TokenService';
import { getUserInfo } from '../services/api';
import { useUser } from './UserContext';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(tokenService.getToken());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(tokenService.hasToken());
  const { setUser } = useUser();

  useEffect(() => {
    // Update authentication state when token changes
    setIsAuthenticated(!!token);
  }, [token]);

  const login = async (accessToken: string) => {
    tokenService.setToken(accessToken);
    setToken(accessToken);
    
    // Fetch user info and store the ID
    try {
      const userInfo = await getUserInfo();
      setUser(userInfo);
    } catch (error) {
      console.error('Failed to fetch user info after login:', error);
    }
  };

  const logout = () => {
    tokenService.removeToken();
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    isAuthenticated,
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
