import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: string;
  nickname: string;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
}

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  error: string | null;
  login: (nickname: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing user in localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('tris_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse stored user data');
        localStorage.removeItem('tris_user');
      }
    }
  }, []);

  const login = async (nickname: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if user exists
      const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/users/nickname/${nickname}`);
      
      if (response.data) {
        // User exists, update online status
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/users/${response.data.id}/online-status`, {
          isOnline: true
        });
        
        setUser(response.data);
        localStorage.setItem('tris_user', JSON.stringify(response.data));
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // User doesn't exist, create new user
        try {
          const createResponse = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/users`, {
            nickname
          });
          
          setUser(createResponse.data);
          localStorage.setItem('tris_user', JSON.stringify(createResponse.data));
        } catch (createError) {
          if (axios.isAxiosError(createError)) {
            setError(createError.response?.data?.message || 'Failed to create user');
          } else {
            setError('An unexpected error occurred');
          }
        }
      } else if (axios.isAxiosError(error)) {
        setError(error.response?.data?.message || 'Failed to login');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (user) {
      try {
        // Update online status to offline
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/users/${user.id}/online-status`, {
          isOnline: false
        });
      } catch (error) {
        console.error('Failed to update online status', error);
      }
      
      setUser(null);
      localStorage.removeItem('tris_user');
    }
  };

  // Update online status periodically
  useEffect(() => {
    if (!user) return;
    
    const updateOnlineStatus = async () => {
      try {
        await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:4000'}/users/${user.id}/online-status`, {
          isOnline: true
        });
      } catch (error) {
        console.error('Failed to update online status', error);
      }
    };
    
    // Update online status every 5 minutes
    const interval = setInterval(updateOnlineStatus, 5 * 60 * 1000);
    
    // Update online status when window is focused
    const handleFocus = () => {
      updateOnlineStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, error, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
