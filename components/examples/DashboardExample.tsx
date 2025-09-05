import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProtectedRoute, useProtectedAction } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

// Example of a protected dashboard component
export const DashboardExample: React.FC = () => {
  const { user, authenticatedFetch, requireOnboarding } = useAuth();
  const { executeWithAuth } = useProtectedAction();

  const handleProtectedAction = () => {
    executeWithAuth(() => {
      console.log('Protected action executed for user:', user?.name);
      // Your protected logic here
    }, true); // Requires onboarding completion
  };

  const handleApiCall = async () => {
    if (!requireOnboarding()) return;

    try {
      const response = await authenticatedFetch('/api/protected-endpoint');
      const data = await response.json();
      console.log('Protected API response:', data);
    } catch (error) {
      console.error('Protected API call failed:', error);
    }
  };

  return (
    <ProtectedRoute requireOnboarding>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <MaterialIcons name="dashboard" size={32} color={DESIGN_SYSTEM.colors.primary[500]} />
              <Text style={styles.title}>Protected Dashboard</Text>
            </View>

            {/* Auth Status Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔐 Authentication Status</Text>
              <Text style={styles.statusText}>✅ User authenticated</Text>
              <Text style={styles.statusText}>✅ Onboarding complete</Text>
              <Text style={styles.userInfo}>Welcome, {user?.name}</Text>
            </View>

            {/* Protected Features */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛡️ Protected Features</Text>
              <Text style={styles.description}>
                These features are only accessible to authenticated users who have completed
                onboarding.
              </Text>

              <TouchableOpacity style={styles.actionButton} onPress={handleProtectedAction}>
                <MaterialIcons name="security" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Execute Protected Action</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleApiCall}>
                <MaterialIcons name="api" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Make Authenticated API Call</Text>
              </TouchableOpacity>
            </View>

            {/* Usage Examples */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📚 Usage Examples</Text>
              <Text style={styles.description}>
                Here's how to implement authentication protection in your components:
              </Text>

              <View style={styles.codeBlock}>
                <Text style={styles.codeText}>
                  {`// Wrap components with ProtectedRoute
<ProtectedRoute requireOnboarding>
  <YourComponent />
</ProtectedRoute>

// Use auth hooks
const { user, authenticatedFetch } = useAuth();

// Execute protected actions
const { executeWithAuth } = useProtectedAction();`}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    ...DESIGN_SYSTEM.typography.h1,
    color: DESIGN_SYSTEM.colors.light.text,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    padding: 20,
    marginBottom: 16,
    ...DESIGN_SYSTEM.shadows.md,
  },
  cardTitle: {
    ...DESIGN_SYSTEM.typography.h3,
    color: DESIGN_SYSTEM.colors.light.text,
    marginBottom: 12,
  },
  statusText: {
    ...DESIGN_SYSTEM.typography.body,
    color: DESIGN_SYSTEM.colors.success[600],
    marginBottom: 4,
  },
  userInfo: {
    ...DESIGN_SYSTEM.typography.body,
    color: DESIGN_SYSTEM.colors.primary[600],
    fontWeight: '600',
    marginTop: 8,
  },
  description: {
    ...DESIGN_SYSTEM.typography.body,
    color: DESIGN_SYSTEM.colors.neutral[600],
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    marginBottom: 12,
    gap: 8,
  },
  actionButtonText: {
    ...DESIGN_SYSTEM.typography.button,
    color: '#FFFFFF',
  },
  codeBlock: {
    backgroundColor: DESIGN_SYSTEM.colors.neutral[900],
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: 16,
  },
  codeText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.neutral[100],
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
