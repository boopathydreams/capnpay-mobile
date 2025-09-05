import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Types for user and authentication state
export interface User {
  id: string;
  phone: string;
  name?: string;
  avatarUrl?: string;
  isOnboardingComplete: boolean;
  hasCategories: boolean;
  monthlySalary?: number;
  currency: string;
  timeZone?: string;
  language: string;
  notificationsEnabled: boolean;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  requiresOnboarding: boolean;
}

// Authentication context type
interface AuthContextType extends AuthState {
  // Authentication methods
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;

  // Token management
  getAuthToken: () => Promise<string | null>;
  refreshToken: () => Promise<boolean>;

  // Protected API calls
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;

  // Onboarding helpers
  markOnboardingComplete: () => Promise<void>;

  // Auth checks
  requireAuth: () => boolean;
  checkRequiresOnboarding: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    token: null,
    requiresOnboarding: false,
  });

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.94:3000';

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing auth...');
      const token = await AsyncStorage.getItem('auth_token');
      const userInfo = await AsyncStorage.getItem('user_info');

      console.log('🔍 Stored auth data:', { hasToken: !!token, hasUserInfo: !!userInfo });

      if (token && userInfo) {
        const userData = JSON.parse(userInfo) as User;
        console.log('👤 Found stored user:', userData);

        // Verify token is still valid
        const isValid = await verifyToken(token);
        console.log('✅ Token validation result:', isValid);

        if (isValid) {
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: userData,
            token,
            requiresOnboarding: !userData.isOnboardingComplete,
          });
          console.log('🎉 User authenticated successfully');
        } else {
          // Token is invalid, clear storage
          console.log('❌ Token invalid, clearing storage');
          await clearAuthStorage();
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            token: null,
            requiresOnboarding: false,
          });
        }
      } else {
        console.log('🚪 No stored auth data, user needs to login');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          token: null,
          requiresOnboarding: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        requiresOnboarding: false,
      });
    }
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const clearAuthStorage = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user_info']);
    } catch (error) {
      console.error('Error clearing auth storage:', error);
    }
  };

  const login = async (token: string, user: User): Promise<void> => {
    try {
      // Store credentials
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_info', JSON.stringify(user));

      // Update state
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        token,
        requiresOnboarding: !user.isOnboardingComplete,
      });
    } catch (error) {
      console.error('Error during login:', error);
      throw new Error('Failed to store authentication data');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear storage
      await clearAuthStorage();

      // Reset state
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        requiresOnboarding: false,
      });
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Failed to logout');
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!authState.user) {
      throw new Error('No user to update');
    }

    try {
      const updatedUser = { ...authState.user, ...userData };
      await AsyncStorage.setItem('user_info', JSON.stringify(updatedUser));

      setAuthState((prev) => ({
        ...prev,
        user: updatedUser,
        requiresOnboarding: !updatedUser.isOnboardingComplete,
      }));
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user data');
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (authState.token) {
      return authState.token;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const currentToken = await getAuthToken();
      if (!currentToken) {
        return false;
      }

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        await AsyncStorage.setItem('auth_token', data.token);

        setAuthState((prev) => ({
          ...prev,
          token: data.token,
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAuthToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    // Ensure URL is absolute by prepending API_URL if it's a relative URL
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry with new token
        const newToken = await getAuthToken();
        const retryResponse = await fetch(fullUrl, {
          ...options,
          headers: {
            ...headers,
            Authorization: `Bearer ${newToken}`,
          },
        });
        return retryResponse;
      } else {
        // Refresh failed, logout user
        await logout();
        Alert.alert('Session Expired', 'Please login again to continue.');
        throw new Error('Authentication failed');
      }
    }

    return response;
  };

  const markOnboardingComplete = async (): Promise<void> => {
    if (!authState.user) {
      throw new Error('No user to update');
    }

    await updateUser({ isOnboardingComplete: true });
  };

  const requireAuth = (): boolean => {
    if (!authState.isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to access this feature.', [
        { text: 'OK' },
      ]);
      return false;
    }
    return true;
  };

  const requiresOnboardingCheck = (): boolean => {
    if (!authState.isAuthenticated) {
      Alert.alert('Authentication Required', 'Please login to access this feature.', [
        { text: 'OK' },
      ]);
      return false;
    }

    if (authState.requiresOnboarding) {
      Alert.alert('Setup Required', 'Please complete your account setup to access this feature.', [
        { text: 'OK' },
      ]);
      return false;
    }

    return true;
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    updateUser,
    getAuthToken,
    refreshToken,
    authenticatedFetch,
    markOnboardingComplete,
    requireAuth,
    checkRequiresOnboarding: requiresOnboardingCheck,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
