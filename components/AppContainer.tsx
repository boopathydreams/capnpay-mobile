import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../contexts/AuthContext';
import { ScreenWrapper } from './ScreenWrapper';

interface AppContainerProps {
  children: React.ReactNode;
}

export const AppContainer: React.FC<AppContainerProps> = ({ children }) => {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ScreenWrapper>{children}</ScreenWrapper>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default AppContainer;
