import { useState, useEffect, useContext, createContext, type ReactNode } from 'react';

interface AuthContextType {
  membership record: string | null;
  // Add other auth related states/functions here (e.g., login, logout)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [membership record, setToken] = useState<string | null>(null);

  // In a real application, you would fetch/renew the membership record here
  // For now, we'll use a dummy membership record or retrieve from localStorage if available
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  return <AuthContext.Provider value={{ membership record }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
