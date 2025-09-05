import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  fallbackComponent?: ReactNode;
  title?: string;
  description?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = false,
  fallbackComponent,
  title = 'Access Restricted',
  description = 'You need to be authenticated to access this feature.',
}) => {
  const { isAuthenticated, isOnboardingComplete, isLoading, logout } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <MaterialIcons
            name="hourglass-empty"
            size={48}
            color={DESIGN_SYSTEM.colors.neutral[400]}
          />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      fallbackComponent || (
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContent}>
            <MaterialIcons
              name="lock-outline"
              size={64}
              color={DESIGN_SYSTEM.colors.warning[500]}
            />
            <Text style={styles.title}>Authentication Required</Text>
            <Text style={styles.description}>Please login to access this feature.</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )
    );
  }

  // Check onboarding completion if required
  if (requireOnboarding && !isOnboardingComplete) {
    return (
      fallbackComponent || (
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContent}>
            <MaterialIcons
              name="assignment-late"
              size={64}
              color={DESIGN_SYSTEM.colors.primary[500]}
            />
            <Text style={styles.title}>Setup Required</Text>
            <Text style={styles.description}>
              Please complete your account setup to access this feature.
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Complete Setup</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )
    );
  }

  // User is authenticated and meets requirements
  return <>{children}</>;
};

// Hook for checking auth status in components
export const useProtectedAction = () => {
  const { requireAuth, requireOnboarding } = useAuth();

  const executeWithAuth = (action: () => void, requireOnboardingComplete = false) => {
    if (requireOnboardingComplete) {
      if (requireOnboarding()) {
        action();
      }
    } else {
      if (requireAuth()) {
        action();
      }
    }
  };

  return { executeWithAuth };
};

// Higher-order component for protecting components
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    requireOnboarding?: boolean;
    fallbackComponent?: ReactNode;
  } = {},
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.light.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    ...DESIGN_SYSTEM.typography.body,
    color: DESIGN_SYSTEM.colors.neutral[600],
    marginTop: 16,
  },
  title: {
    ...DESIGN_SYSTEM.typography.h2,
    color: DESIGN_SYSTEM.colors.light.text,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  description: {
    ...DESIGN_SYSTEM.typography.body,
    color: DESIGN_SYSTEM.colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    ...DESIGN_SYSTEM.shadows.sm,
  },
  actionButtonText: {
    ...DESIGN_SYSTEM.typography.button,
    color: '#FFFFFF',
  },
});
