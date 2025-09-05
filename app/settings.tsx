import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { ModernCard, HeadingText, BodyText, CaptionText } from '../components/AdvancedUI';
import { DESIGN_SYSTEM } from '../constants/DesignSystem';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  id: string;
  phone: string;
  name?: string;
  avatarUrl?: string;
  isOnboardingComplete: boolean;
  monthlySalary?: number;
  currency: string;
  timeZone?: string;
  language: string;
  notificationsEnabled: boolean;
  createdAt: string;
  settings?: {
    themePreference: string;
    biometricEnabled: boolean;
    transactionAlerts: boolean;
    budgetAlerts: boolean;
    monthlyReports: boolean;
    marketingEmails: boolean;
    autoTagging: boolean;
    spendingInsights: boolean;
  } | null;
  categories: Array<{
    id: string;
    name: string;
    color: string;
    capAmount: number;
    softBlock: boolean;
    nearThresholdPct: number;
  }>;
}

export default function SettingsScreen() {
  const { user, logout, authenticatedFetch } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile...');
      const response = await authenticatedFetch('/users/profile');
      console.log('Profile response status:', response.status);

      if (response.ok) {
        const profile = await response.json();
        console.log('Profile data received:', profile);
        setUserProfile(profile);
      } else {
        const errorText = await response.text();
        console.error(
          'Failed to fetch user profile - Status:',
          response.status,
          'Error:',
          errorText,
        );
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateUserSettings = async (settingKey: string, value: boolean) => {
    if (!userProfile) return;

    setUpdating(true);
    try {
      const response = await authenticatedFetch('/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [settingKey]: value,
        }),
      });

      if (response.ok) {
        // Ensure settings object exists before updating
        const currentSettings = userProfile.settings || {
          themePreference: 'system',
          biometricEnabled: false,
          transactionAlerts: true,
          budgetAlerts: true,
          monthlyReports: true,
          marketingEmails: false,
          autoTagging: true,
          spendingInsights: true,
        };

        setUserProfile({
          ...userProfile,
          settings: {
            ...currentSettings,
            [settingKey]: value,
          },
        });
      } else {
        Alert.alert('Error', 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await authenticatedFetch('/users/account', {
                method: 'DELETE',
              });

              if (response.ok) {
                await logout();
                Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
              } else {
                Alert.alert('Error', 'Failed to delete account');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary[500]} />
          <Text className="mt-4 text-gray-600">Loading profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!userProfile) {
    return (
      <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
        <View className="flex-1 justify-center items-center px-6">
          <MaterialIcons name="error-outline" size={48} color={DESIGN_SYSTEM.colors.error[500]} />
          <Text className="mt-4 text-center text-gray-600">
            Failed to load profile. Please try again.
          </Text>
          <TouchableOpacity
            className="mt-4 bg-blue-600 px-6 py-3 rounded-lg"
            onPress={fetchUserProfile}
          >
            <Text className="text-white font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Ensure settings exist with defaults
  const settings = userProfile.settings || {
    themePreference: 'system',
    biometricEnabled: false,
    transactionAlerts: true,
    budgetAlerts: true,
    monthlyReports: true,
    marketingEmails: false,
    autoTagging: true,
    spendingInsights: true,
  };

  const settingsItems = [
    {
      key: 'transactionAlerts',
      title: 'Transaction Alerts',
      description: 'Get notified for all transactions',
      value: settings.transactionAlerts,
    },
    {
      key: 'budgetAlerts',
      title: 'Budget Alerts',
      description: 'Notify when approaching budget limits',
      value: settings.budgetAlerts,
    },
    {
      key: 'monthlyReports',
      title: 'Monthly Reports',
      description: 'Receive monthly spending reports',
      value: settings.monthlyReports,
    },
    {
      key: 'autoTagging',
      title: 'Auto-Tagging',
      description: 'Automatically categorize transactions',
      value: settings.autoTagging,
    },
    {
      key: 'spendingInsights',
      title: 'Spending Insights',
      description: 'Personalized spending analysis',
      value: settings.spendingInsights,
    },
    {
      key: 'biometricEnabled',
      title: 'Biometric Authentication',
      description: 'Use fingerprint or face unlock',
      value: settings.biometricEnabled,
    },
    {
      key: 'marketingEmails',
      title: 'Marketing Emails',
      description: 'Receive promotional content',
      value: settings.marketingEmails,
    },
  ];

  return (
    <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
      <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <HeadingText
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: DESIGN_SYSTEM.colors.light.text,
            }}
          >
            Settings
          </HeadingText>
        </View>

        {/* Profile Section */}
        <ModernCard
          style={{
            backgroundColor: DESIGN_SYSTEM.colors.primary[50],
            borderRadius: DESIGN_SYSTEM.borderRadius.xl,
            padding: DESIGN_SYSTEM.spacing.lg,
            marginBottom: 24,
            borderColor: DESIGN_SYSTEM.colors.primary[200],
            borderWidth: 1,
          }}
        >
          <View className="flex-row items-center">
            {/* Avatar */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: DESIGN_SYSTEM.colors.primary[200],
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}
            >
              {userProfile.avatarUrl ? (
                <Image
                  source={{ uri: userProfile.avatarUrl }}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
              ) : (
                <MaterialIcons name="person" size={32} color={DESIGN_SYSTEM.colors.primary[600]} />
              )}
            </View>

            {/* User Info */}
            <View className="flex-1">
              <HeadingText
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: DESIGN_SYSTEM.colors.primary[700],
                  marginBottom: 4,
                }}
              >
                {userProfile.name || 'User'}
              </HeadingText>
              <CaptionText
                style={{
                  color: DESIGN_SYSTEM.colors.primary[600],
                  fontSize: 14,
                  marginBottom: 4,
                }}
              >
                {userProfile.phone}
              </CaptionText>
              <CaptionText
                style={{
                  color: DESIGN_SYSTEM.colors.primary[600],
                  fontSize: 12,
                }}
              >
                {userProfile.categories.length} categories • {userProfile.currency}
              </CaptionText>
            </View>

            {/* Edit Profile */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                // Navigate to edit profile
                console.log('Edit profile');
              }}
            >
              <MaterialIcons name="edit" size={20} color={DESIGN_SYSTEM.colors.primary[600]} />
            </TouchableOpacity>
          </View>
        </ModernCard>

        {/* Settings List */}
        <ModernCard
          style={{
            backgroundColor: DESIGN_SYSTEM.colors.light.surface,
            borderRadius: DESIGN_SYSTEM.borderRadius.xl,
            padding: 0,
            marginBottom: 24,
            borderColor: DESIGN_SYSTEM.colors.neutral[200],
            borderWidth: 1,
          }}
        >
          {settingsItems.map((item, index) => (
            <View key={item.key}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                }}
              >
                <View className="flex-1">
                  <BodyText
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: DESIGN_SYSTEM.colors.light.text,
                      marginBottom: 4,
                    }}
                  >
                    {item.title}
                  </BodyText>
                  <CaptionText
                    style={{
                      color: DESIGN_SYSTEM.colors.light.textSecondary,
                      fontSize: 14,
                    }}
                  >
                    {item.description}
                  </CaptionText>
                </View>

                <Switch
                  value={item.value}
                  onValueChange={(value) => updateUserSettings(item.key, value)}
                  trackColor={{
                    false: DESIGN_SYSTEM.colors.neutral[300],
                    true: DESIGN_SYSTEM.colors.primary[200],
                  }}
                  thumbColor={
                    item.value
                      ? DESIGN_SYSTEM.colors.primary[500]
                      : DESIGN_SYSTEM.colors.neutral[100]
                  }
                  disabled={updating}
                />
              </View>

              {index < settingsItems.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: DESIGN_SYSTEM.colors.neutral[200],
                    marginHorizontal: 20,
                  }}
                />
              )}
            </View>
          ))}
        </ModernCard>

        {/* Action Buttons */}
        <View className="space-y-3 mb-8">
          {/* Logout */}
          <TouchableOpacity
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
              borderRadius: DESIGN_SYSTEM.borderRadius.lg,
              padding: 16,
              alignItems: 'center',
              borderColor: DESIGN_SYSTEM.colors.neutral[200],
              borderWidth: 1,
            }}
            onPress={handleLogout}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.neutral[700],
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>

          {/* Delete Account */}
          <TouchableOpacity
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.error[50],
              borderRadius: DESIGN_SYSTEM.borderRadius.lg,
              padding: 16,
              alignItems: 'center',
              borderColor: DESIGN_SYSTEM.colors.error[200],
              borderWidth: 1,
            }}
            onPress={handleDeleteAccount}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.error[600],
              }}
            >
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="items-center mb-8">
          <CaptionText
            style={{
              color: DESIGN_SYSTEM.colors.light.textSecondary,
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            Cap'n Pay v1.0.0
          </CaptionText>
          <CaptionText
            style={{
              color: DESIGN_SYSTEM.colors.light.textSecondary,
              fontSize: 12,
            }}
          >
            Made with ❤️ in India
          </CaptionText>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
