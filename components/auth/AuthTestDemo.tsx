import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

// Component that should only be accessible when authenticated
function SecureContent() {
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Alert.alert('Success', 'You have been logged out successfully');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Secure Feature</Text>
      <Text style={styles.subtitle}>Authentication Required</Text>

      <View style={styles.infoCard}>
        <Text style={styles.label}>Authentication Status:</Text>
        <Text style={[styles.value, { color: isAuthenticated ? '#4CAF50' : '#F44336' }]}>
          {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
        </Text>
      </View>

      {user && (
        <View style={styles.infoCard}>
          <Text style={styles.label}>User Information:</Text>
          <Text style={styles.value}>ID: {user.id}</Text>
          <Text style={styles.value}>Name: {user.name || 'Not provided'}</Text>
          <Text style={styles.value}>Phone: {user.phone}</Text>
          <Text style={styles.value}>
            Onboarding: {user.isOnboardingComplete ? '✅ Complete' : '⏳ Pending'}
          </Text>
        </View>
      )}

      <View style={styles.featureList}>
        <Text style={styles.featureTitle}>Protected Features:</Text>
        <Text style={styles.featureItem}>💳 Payment Processing</Text>
        <Text style={styles.featureItem}>📊 Transaction History</Text>
        <Text style={styles.featureItem}>🎯 Spending Categories</Text>
        <Text style={styles.featureItem}>📈 Financial Insights</Text>
        <Text style={styles.featureItem}>⚙️ Account Settings</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

// Public component to demonstrate access control
export function AuthTestDemo() {
  // Since auth is handled at app level, we can just show the secure content
  // If user reaches this component, they're already authenticated
  return <SecureContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  featureList: {
    backgroundColor: '#e8f5e8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  blockedFeatures: {
    backgroundColor: '#ffeaea',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  featureItem: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  blockedItem: {
    fontSize: 14,
    color: '#F44336',
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
