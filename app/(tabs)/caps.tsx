import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';
import { COLORS } from '@/constants/AppConstants';

// Mock category data
const categories = [
  { id: '1', name: 'Food & Dining', color: '#F59E0B', spent: 3200, cap: 5000, transactions: 12 },
  { id: '2', name: 'Transport', color: '#3B82F6', spent: 1800, cap: 2500, transactions: 8 },
  { id: '3', name: 'Shopping', color: '#EF4444', spent: 4500, cap: 4000, transactions: 6 },
  { id: '4', name: 'Entertainment', color: '#8B5CF6', spent: 1200, cap: 3000, transactions: 4 },
  { id: '5', name: 'Bills & Utilities', color: '#10B981', spent: 2800, cap: 3500, transactions: 3 },
  { id: '6', name: 'Other', color: '#6B7280', spent: 800, cap: 2000, transactions: 5 },
];

function getStatusColor(spent: number, cap: number) {
  const percentage = (spent / cap) * 100;
  if (percentage >= 100) return '#EF4444'; // Red - Over
  if (percentage >= 80) return '#F59E0B';  // Yellow - Near
  return '#10B981'; // Green - OK
}

function getStatusText(spent: number, cap: number) {
  const percentage = (spent / cap) * 100;
  if (percentage >= 100) return 'Over';
  if (percentage >= 80) return 'Near';
  return 'OK';
}

export default function CapsScreen() {
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalCap = categories.reduce((sum, cat) => sum + cat.cap, 0);

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-900">Spending Caps</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Total Cap Overview */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-2xl shadow-sm">
          <Text className="text-sm text-gray-600 mb-2">Total This Month</Text>
          <Text className="text-3xl font-bold text-gray-900 mb-2">₹{totalSpent.toLocaleString('en-IN')}</Text>
          <Text className="text-sm text-gray-500">
            of ₹{totalCap.toLocaleString('en-IN')} • {Math.round((totalSpent/totalCap)*100)}% used
          </Text>

          {/* Progress Bar */}
          <View className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <View
              className="bg-blue-600 h-3 rounded-full"
              style={{ width: `${Math.min((totalSpent/totalCap)*100, 100)}%` }}
            />
          </View>
        </View>

        {/* Category Caps */}
        <View className="mx-4 mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Category Limits</Text>

          {categories.map((category) => {
            const percentage = Math.round((category.spent / category.cap) * 100);
            const statusColor = getStatusColor(category.spent, category.cap);
            const statusText = getStatusText(category.spent, category.cap);
            const remaining = Math.max(0, category.cap - category.spent);

            return (
              <TouchableOpacity
                key={category.id}
                className="bg-white p-4 rounded-xl mb-3 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    />
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">{category.name}</Text>
                      <Text className="text-sm text-gray-500">
                        {category.transactions} transactions
                      </Text>
                    </View>
                  </View>

                  <View className="items-end">
                    <View
                      className="px-2 py-1 rounded-full mb-1"
                      style={{ backgroundColor: statusColor + '20' }}
                    >
                      <Text className="text-xs font-medium" style={{ color: statusColor }}>
                        {statusText}
                      </Text>
                    </View>
                    <Text className="text-sm font-medium text-gray-900">
                      ₹{remaining.toLocaleString('en-IN')} left
                    </Text>
                  </View>
                </View>

                {/* Amount and Progress */}
                <View className="mt-3">
                  <View className="flex-row justify-between items-end mb-2">
                    <Text className="text-xl font-bold text-gray-900">
                      ₹{category.spent.toLocaleString('en-IN')}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      of ₹{category.cap.toLocaleString('en-IN')} • {percentage}%
                    </Text>
                  </View>

                  {/* Progress Ring/Bar */}
                  <View className="w-full bg-gray-200 rounded-full h-2">
                    <View
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: statusColor
                      }}
                    />
                  </View>
                </View>

                {/* Edit button */}
                <View className="flex-row justify-end mt-3">
                  <TouchableOpacity className="flex-row items-center">
                    <FontAwesome name="edit" size={14} color={COLORS.primary} />
                    <Text className="text-sm text-blue-600 ml-1">Edit Cap</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="h-8" />
      </ScrollView>
    </ScreenWrapper>
  );
}
