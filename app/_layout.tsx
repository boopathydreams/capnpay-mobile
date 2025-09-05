import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SplashScreen as AuthSplashScreen } from '../components/auth/SplashScreen';
import { AuthFlowManager } from '../components/auth/AuthFlowManager';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function AuthNavigatorInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, requiresOnboarding } = useAuth();

  console.log('🧭 AuthNavigator state:', { isAuthenticated, isLoading, requiresOnboarding });

  // Show splash screen while checking authentication status
  if (isLoading) {
    console.log('⏳ Showing splash screen (loading)');
    return <AuthSplashScreen />;
  }

  // If not authenticated, show auth flow (login/register)
  if (!isAuthenticated) {
    console.log('🔐 Showing auth flow (not authenticated)');
    return <AuthFlowManager />;
  }

  // If authenticated but requires onboarding, show auth flow for onboarding
  if (requiresOnboarding) {
    console.log('📝 Showing onboarding flow');
    return <AuthFlowManager />;
  }

  // If authenticated and onboarding complete, show the main app (tabs)
  console.log('🏠 Showing main app (authenticated)');
  return <>{children}</>;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthNavigatorInner>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
          </Stack>
        </AuthNavigatorInner>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
