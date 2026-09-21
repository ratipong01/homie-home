import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../services/authApi';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isSessionUnlocked: boolean;
  login: (token: string, user: User) => void;
  unlockSession: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('homie_auth_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('homie_auth_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isSessionUnlocked, setIsSessionUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        setUser(res.user);
        localStorage.setItem('homie_auth_user', JSON.stringify(res.user));
      } catch (_err) {
        localStorage.removeItem('homie_auth_token');
        localStorage.removeItem('homie_auth_user');
        setToken(null);
        setUser(null);
        setIsSessionUnlocked(false);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('homie_auth_token', newToken);
    localStorage.setItem('homie_auth_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsSessionUnlocked(true);
  };

  const unlockSession = () => {
    setIsSessionUnlocked(true);
  };

  const logout = () => {
    localStorage.removeItem('homie_auth_token');
    localStorage.removeItem('homie_auth_user');
    localStorage.removeItem('homie_remembered_phone');
    setToken(null);
    setUser(null);
    setIsSessionUnlocked(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isSessionUnlocked,
        login,
        unlockSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
