import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryCap {
  id: string;
  name: string;
  color: string;
  description: string;
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  isEnabled: boolean;
}

interface OnboardingCapsScreenProps {
  userName: string;
  totalBudget: number;
  categories: Array<{
    name: string;
    color: string;
    amount: number;
    percentage: number;
    description: string;
  }>;
  onComplete: (caps: CategoryCap[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const OnboardingCapsScreen: React.FC<OnboardingCapsScreenProps> = ({
  userName,
  totalBudget,
  categories,
  onComplete,
  onBack,
  isLoading = false,
}) => {
  const [caps, setCaps] = useState<CategoryCap[]>(() =>
    categories.map((cat, index) => ({
      id: `cap_${index}`,
      name: cat.name,
      color: cat.color,
      description: cat.description,
      monthlyLimit: cat.amount,
      weeklyLimit: Math.floor(cat.amount / 4.33), // ~4.33 weeks per month
      dailyLimit: Math.floor(cat.amount / 30), // 30 days per month
      isEnabled: true,
    })),
  );

  const toggleCapEnabled = (capId: string) => {
    setCaps((prevCaps) =>
      prevCaps.map((cap) => (cap.id === capId ? { ...cap, isEnabled: !cap.isEnabled } : cap)),
    );
  };

  const adjustLimit = (capId: string, type: 'daily' | 'weekly' | 'monthly', change: number) => {
    setCaps((prevCaps) =>
      prevCaps.map((cap) => {
        if (cap.id !== capId) return cap;

        const newCap = { ...cap };
        switch (type) {
          case 'daily':
            newCap.dailyLimit = Math.max(0, cap.dailyLimit + change);
            break;
          case 'weekly':
            newCap.weeklyLimit = Math.max(0, cap.weeklyLimit + change);
            break;
          case 'monthly':
            newCap.monthlyLimit = Math.max(0, cap.monthlyLimit + change);
            break;
        }
        return newCap;
      }),
    );
  };

  const handleComplete = () => {
    const enabledCaps = caps.filter((cap) => cap.isEnabled);
    if (enabledCaps.length === 0) {
      Alert.alert('No Caps Enabled', 'Enable at least one spending cap to protect your budget.', [
        { text: 'OK' },
      ]);
      return;
    }
    onComplete(caps);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 py-6">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm mb-6"
            onPress={onBack}
          >
            <MaterialIcons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Icon and Title */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
              <MaterialIcons name="security" size={48} color="#DC2626" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Set Spending Caps
            </Text>

            <Text className="text-base text-gray-600 text-center leading-6 px-4 mb-6">
              Protect your budget with smart spending limits. We'll notify you when you're close to
              your caps.
            </Text>

            {/* Summary Card */}
            <View className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="text-sm font-medium text-gray-500 text-center mb-2">
                Welcome, {userName}!
              </Text>
              <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                Your {formatCurrency(totalBudget)} Budget
              </Text>
              <Text className="text-sm text-gray-500 text-center">Set caps to stay on track</Text>
            </View>
          </View>
        </View>

        {/* Spending Caps */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Category Spending Caps</Text>

          {caps.map((cap) => (
            <View
              key={cap.id}
              className={`bg-white rounded-xl p-4 mb-4 shadow-sm border ${
                cap.isEnabled ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              {/* Category Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: cap.color }}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">{cap.name}</Text>
                    <Text className="text-sm text-gray-500">{cap.description}</Text>
                  </View>
                </View>
                <Switch
                  value={cap.isEnabled}
                  onValueChange={() => toggleCapEnabled(cap.id)}
                  trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                  thumbColor={cap.isEnabled ? '#2563EB' : '#9CA3AF'}
                />
              </View>

              {cap.isEnabled && (
                <View className="space-y-4">
                  {/* Daily Limit */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Daily Limit</Text>
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        onPress={() => adjustLimit(cap.id, 'daily', -100)}
                      >
                        <MaterialIcons name="remove" size={20} color="#374151" />
                      </TouchableOpacity>

                      <Text className="text-lg font-semibold text-gray-900">
                        {formatCurrency(cap.dailyLimit)}
                      </Text>

                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        onPress={() => adjustLimit(cap.id, 'daily', 100)}
                      >
                        <MaterialIcons name="add" size={20} color="#374151" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Weekly Limit */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Weekly Limit</Text>
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        onPress={() => adjustLimit(cap.id, 'weekly', -500)}
                      >
                        <MaterialIcons name="remove" size={20} color="#374151" />
                      </TouchableOpacity>

                      <Text className="text-lg font-semibold text-gray-900">
                        {formatCurrency(cap.weeklyLimit)}
                      </Text>

                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        onPress={() => adjustLimit(cap.id, 'weekly', 500)}
                      >
                        <MaterialIcons name="add" size={20} color="#374151" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Monthly Limit */}
                  <View>
                    <Text className="text-sm font-medium text-gray-700 mb-2">Monthly Limit</Text>
                    <View className="flex-row items-center justify-between">
                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        onPress={() => adjustLimit(cap.id, 'monthly', -1000)}
                      >
                        <MaterialIcons name="remove" size={20} color="#374151" />
                      </TouchableOpacity>

                      <Text className="text-lg font-semibold text-gray-900">
                        {formatCurrency(cap.monthlyLimit)}
                      </Text>

                      <TouchableOpacity
                        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                        onPress={() => adjustLimit(cap.id, 'monthly', 1000)}
                      >
                        <MaterialIcons name="add" size={20} color="#374151" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Complete Button */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            className={`flex-row items-center justify-center py-4 px-6 rounded-xl shadow-sm ${
              !isLoading ? 'bg-green-600 active:bg-green-700' : 'bg-gray-300'
            }`}
            onPress={handleComplete}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-white font-semibold text-base mr-2">Complete Setup</Text>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View className="items-center mt-6">
            <View className="w-full h-1 bg-gray-200 rounded-full mb-3">
              <View className="w-full h-full bg-blue-600 rounded-full" />
            </View>
            <Text className="text-sm text-gray-500">Step 3 of 3 • Spending Protection</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
