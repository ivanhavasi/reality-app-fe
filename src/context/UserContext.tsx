import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  createdAt: Date;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  clearUser: () => void;
}

const defaultValue: UserContextType = {
  user: null,
  setUser: () => {},
  isAdmin: false,
  clearUser: () => {}
};

const UserContext = createContext<UserContextType>(defaultValue);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);

  const setUser = (newUser: User | null) => {
    setUserState(newUser);
  };

  const clearUser = () => {
    setUserState(null);
  };

  // Determine if the user has admin role
  const isAdmin = user?.roles?.includes('ADMIN') || false;

  const value = {
    user,
    setUser,
    isAdmin,
    clearUser
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    return defaultValue;
  }
  return context;
};
