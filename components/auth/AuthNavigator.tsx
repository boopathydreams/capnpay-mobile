import React from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from './SplashScreen';
import { AuthFlowManager } from './AuthFlowManager';

interface AuthNavigatorProps {
  children: React.ReactNode;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ children }) => {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuth();

  // Show splash screen while checking authentication status
  if (isLoading) {
    return <SplashScreen />;
  }

  // If not authenticated, show auth flow (login/register)
  if (!isAuthenticated) {
    return <AuthFlowManager />;
  }

  // If authenticated but requires onboarding, show auth flow for onboarding
  if (requiresOnboarding) {
    return <AuthFlowManager />;
  }

  // If authenticated and onboarding complete, show the main app (tabs)
  return <>{children}</>;
};
