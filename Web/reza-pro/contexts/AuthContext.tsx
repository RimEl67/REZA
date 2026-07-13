'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  emailVerified?: boolean;
  tenant?: {
    id: string;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    createTenant?: boolean;
    tenantName?: string;
    tenantEmail?: string;
    tenantCity?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          api.setToken(token);
          // Add timeout to prevent hanging if API is unreachable
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );
          const userDataPromise = api.getCurrentUser();
          const userData = await Promise.race([userDataPromise, timeoutPromise]) as any;
          setUser(userData.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Token invalid or expired, or API unreachable
        console.warn('[AuthContext] Failed to initialize auth:', error);
        api.setToken(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[AuthContext] Login attempt for:', email);
      const response = await api.login(email, password);
      console.log('[AuthContext] Login successful, response:', { hasToken: !!response.token, hasUser: !!response.user });
      console.log('[AuthContext] Checking localStorage after login:', localStorage.getItem('token') ? 'Token exists' : 'Token missing');
      setUser(response.user);
      setIsAuthenticated(true);
      // Double-check token is saved
      const tokenCheck = localStorage.getItem('token');
      if (!tokenCheck) {
        console.error('[AuthContext] WARNING: Token not in localStorage after login!');
        // Try to save it again
        if (response.token) {
          api.setToken(response.token);
        }
      }
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Login error:', error);
      return {
        success: false,
        error: error.message || 'Email ou mot de passe invalide'
      };
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
    createTenant?: boolean;
    tenantName?: string;
    tenantEmail?: string;
    tenantCity?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du compte'
      };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      api.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData.user);
    } catch (error) {
      // If refresh fails, user is no longer authenticated
      await logout();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register,
      logout, 
      isAuthenticated, 
      loading,
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
