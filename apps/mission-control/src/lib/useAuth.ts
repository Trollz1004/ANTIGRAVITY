import { useState, useEffect, useContext, createContext, type ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  // Add other auth related states/functions here (e.g., login, logout)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  // In a real application, you would fetch/renew the token here
  // For now, we'll use a dummy token or retrieve from localStorage if available
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      // For demonstration, provide a dummy token if none exists
      // In a real app, this would be a proper login flow
      const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNDQ4MjkwOC04Yjc3LTQyZjYtYjIzZC0zMzk0NDkzNDg0ZmIiLCJleHAiOjE3NTAwMDAwMDB9.S9N_eZJjB7W4L_0c2eM_W1cQ8f8f8f8f8f8f8f8f8'; // Replace with a valid test token
      localStorage.setItem('auth_token', dummyToken);
      setToken(dummyToken);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
