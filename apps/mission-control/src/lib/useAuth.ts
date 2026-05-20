import { useState, useEffect, useContext, createContext, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  // Add other auth related states/functions here (e.g., login, logout)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  // In a real application, you would fetch/renew the token here
  // For now, we'll use a dummy token or retrieve from localStorage if available
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return <AuthContext.Provider value={{ token }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};