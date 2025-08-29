import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';
import { COLORS } from '@/constants/AppConstants';

// Mock transaction data
const transactions = [
  {
    id: '1',
    payeeName: 'Swiggy',
    amount: 450,
    category: 'Food & Dining',
    categoryColor: '#F59E0B',
    date: '2025-08-27',
    time: '14:30',
    status: 'success' as const,
    tag: 'Lunch delivery'
  },
  {
    id: '2',
    payeeName: 'Uber',
    amount: 280,
    category: 'Transport',
    categoryColor: '#3B82F6',
    date: '2025-08-27',
    time: '09:15',
    status: 'success' as const,
    tag: 'Office commute'
  },
  {
    id: '3',
    payeeName: 'Amazon Pay',
    amount: 1200,
    category: 'Shopping',
    categoryColor: '#EF4444',
    date: '2025-08-26',
    time: '20:45',
    status: 'success' as const,
    tag: 'Electronics'
  },
  {
    id: '4',
    payeeName: 'Netflix',
    amount: 649,
    category: 'Entertainment',
    categoryColor: '#8B5CF6',
    date: '2025-08-26',
    time: '16:20',
    status: 'success' as const,
    tag: 'Subscription'
  },
  {
    id: '5',
    payeeName: 'BESCOM',
    amount: 1850,
    category: 'Bills & Utilities',
    categoryColor: '#10B981',
    date: '2025-08-25',
    time: '11:00',
    status: 'pending' as const,
    tag: 'Electricity bill'
  },
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <FontAwesome name="check-circle" size={16} color="#10B981" />;
    case 'pending':
      return <FontAwesome name="clock-o" size={16} color="#F59E0B" />;
    case 'failed':
      return <FontAwesome name="times-circle" size={16} color="#EF4444" />;
    default:
      return null;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}

export default function HistoryScreen() {
  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const dateKey = formatDate(transaction.date);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
    return groups;
  }, {} as Record<string, typeof transactions>);

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-gray-900">Transaction History</Text>
          <TouchableOpacity>
            <FontAwesome name="search" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-4 py-3 border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row">
            {['All', 'Food', 'Transport', 'Shopping', 'Bills', 'Entertainment'].map((filter, index) => (
              <TouchableOpacity
                key={filter}
                className={`px-4 py-2 rounded-full mr-3 ${
                  index === 0 ? 'bg-blue-600' : 'bg-gray-100'
                }`}
              >
                <Text className={`font-medium ${
                  index === 0 ? 'text-white' : 'text-gray-600'
                }`}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1">
        {/* Monthly Summary */}
        <View className="bg-white mx-4 mt-4 p-6 rounded-2xl shadow-sm">
          <Text className="text-sm text-gray-600 mb-2">August 2025</Text>
          <Text className="text-3xl font-bold text-gray-900 mb-1">₹14,429</Text>
          <View className="flex-row items-center">
            <FontAwesome name="arrow-up" size={12} color="#EF4444" />
            <Text className="text-sm text-red-500 ml-1">+12% from last month</Text>
          </View>
        </View>

        {/* Transactions List */}
        <View className="mx-4 mt-4">
          {Object.entries(groupedTransactions).map(([dateKey, dayTransactions]) => (
            <View key={dateKey} className="mb-4">
              <Text className="text-sm font-medium text-gray-500 mb-3 ml-2">
                {dateKey}
              </Text>

              {dayTransactions.map((transaction) => (
                <TouchableOpacity
                  key={transaction.id}
                  className="bg-white p-4 rounded-xl mb-2 shadow-sm"
                >
                  <View className="flex-row items-center">
                    {/* Category Color Indicator */}
                    <View
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: transaction.categoryColor }}
                    />

                    {/* Transaction Details */}
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="font-semibold text-gray-900">
                          {transaction.payeeName}
                        </Text>
                        <Text className="font-bold text-gray-900">
                          ₹{transaction.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View
                            className="px-2 py-1 rounded-full mr-2"
                            style={{ backgroundColor: transaction.categoryColor + '20' }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: transaction.categoryColor }}
                            >
                              {transaction.tag}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center">
                          <Text className="text-sm text-gray-500 mr-2">
                            {transaction.time}
                          </Text>
                          {getStatusIcon(transaction.status)}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Load More */}
        <TouchableOpacity className="mx-4 mb-8">
          <View className="bg-gray-100 p-4 rounded-xl">
            <Text className="text-gray-600 text-center font-medium">
              Load More Transactions
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
}
