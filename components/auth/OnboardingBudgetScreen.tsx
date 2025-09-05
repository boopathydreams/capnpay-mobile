import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CategoryBudget {
  name: string;
  color: string;
  amount: number;
  percentage: number;
  description: string;
}

interface BudgetRecommendation {
  totalBudget: number;
  salaryPercentage: number;
  categories: CategoryBudget[];
}

interface OnboardingBudgetScreenProps {
  salary: number;
  onContinue: (totalBudget: number, categories: CategoryBudget[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const OnboardingBudgetScreen: React.FC<OnboardingBudgetScreenProps> = ({
  salary,
  onContinue,
  onBack,
  isLoading = false,
}) => {
  const [recommendation, setRecommendation] = useState<BudgetRecommendation | null>(null);
  const [customBudgets, setCustomBudgets] = useState<CategoryBudget[]>([]);
  const [totalBudget, setTotalBudget] = useState(0);
  const [fetchingRecommendation, setFetchingRecommendation] = useState(true);

  // Fetch budget recommendation on mount
  useEffect(() => {
    fetchBudgetRecommendation();
  }, [salary]);

  const fetchBudgetRecommendation = async () => {
    try {
      setFetchingRecommendation(true);

      // Mock recommendation based on salary
      const recommendedBudget = Math.floor(salary * 0.7); // 70% of salary for spending
      const categories: CategoryBudget[] = [
        {
          name: 'Food & Dining',
          color: '#EF4444',
          amount: Math.floor(recommendedBudget * 0.3),
          percentage: 30,
          description: 'Meals, groceries, restaurants',
        },
        {
          name: 'Transportation',
          color: '#3B82F6',
          amount: Math.floor(recommendedBudget * 0.15),
          percentage: 15,
          description: 'Fuel, public transport, maintenance',
        },
        {
          name: 'Entertainment',
          color: '#8B5CF6',
          amount: Math.floor(recommendedBudget * 0.15),
          percentage: 15,
          description: 'Movies, events, hobbies',
        },
        {
          name: 'Shopping',
          color: '#F59E0B',
          amount: Math.floor(recommendedBudget * 0.2),
          percentage: 20,
          description: 'Clothing, electronics, misc',
        },
        {
          name: 'Health & Fitness',
          color: '#10B981',
          amount: Math.floor(recommendedBudget * 0.1),
          percentage: 10,
          description: 'Gym, medical, wellness',
        },
        {
          name: 'Miscellaneous',
          color: '#6B7280',
          amount: Math.floor(recommendedBudget * 0.1),
          percentage: 10,
          description: 'Other expenses',
        },
      ];

      const budgetRecommendation: BudgetRecommendation = {
        totalBudget: recommendedBudget,
        salaryPercentage: 70,
        categories,
      };

      setRecommendation(budgetRecommendation);
      setCustomBudgets(categories);
      setTotalBudget(recommendedBudget);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate budget recommendation');
    } finally {
      setFetchingRecommendation(false);
    }
  };

  const adjustCategoryBudget = (categoryIndex: number, change: number) => {
    const newBudgets = [...customBudgets];
    const newAmount = Math.max(0, newBudgets[categoryIndex].amount + change);
    newBudgets[categoryIndex].amount = newAmount;

    // Recalculate total
    const newTotal = newBudgets.reduce((sum, cat) => sum + cat.amount, 0);
    setTotalBudget(newTotal);
    setCustomBudgets(newBudgets);
  };

  const handleContinue = () => {
    if (totalBudget <= 0) {
      Alert.alert('Invalid Budget', 'Please set a budget greater than ₹0');
      return;
    }
    onContinue(totalBudget, customBudgets);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (fetchingRecommendation) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-base text-gray-600 mt-4">Creating your personalized budget...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-6">
              <MaterialIcons name="account-balance-wallet" size={48} color="#059669" />
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Smart Budget Plan
            </Text>

            <Text className="text-base text-gray-600 text-center leading-6 px-4 mb-6">
              Based on your ₹{salary.toLocaleString('en-IN')} monthly income, here's your
              recommended budget
            </Text>

            {/* Total Budget Card */}
            <View className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="text-sm font-medium text-gray-500 text-center mb-2">
                Monthly Budget
              </Text>
              <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
                {formatCurrency(totalBudget)}
              </Text>
              <Text className="text-sm text-gray-500 text-center">
                {Math.round((totalBudget / salary) * 100)}% of your income
              </Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View className="px-6 pb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</Text>

          {customBudgets.map((category, index) => (
            <View
              key={category.name}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
            >
              {/* Category Header */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: category.color }}
                  />
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">{category.name}</Text>
                    <Text className="text-sm text-gray-500">{category.description}</Text>
                  </View>
                </View>
              </View>

              {/* Amount Controls */}
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => adjustCategoryBudget(index, -1000)}
                >
                  <MaterialIcons name="remove" size={20} color="#374151" />
                </TouchableOpacity>

                <View className="flex-1 mx-4">
                  <Text className="text-xl font-bold text-gray-900 text-center">
                    {formatCurrency(category.amount)}
                  </Text>
                  <Text className="text-sm text-gray-500 text-center">
                    {Math.round((category.amount / totalBudget) * 100)}% of budget
                  </Text>
                </View>

                <TouchableOpacity
                  className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => adjustCategoryBudget(index, 1000)}
                >
                  <MaterialIcons name="add" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Continue Button */}
        <View className="px-6 pb-8">
          <TouchableOpacity
            className={`flex-row items-center justify-center py-4 px-6 rounded-xl shadow-sm ${
              totalBudget > 0 && !isLoading ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300'
            }`}
            onPress={handleContinue}
            disabled={totalBudget <= 0 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-white font-semibold text-base mr-2">
                  Continue to Spending Caps
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Progress Indicator */}
          <View className="items-center mt-6">
            <View className="w-full h-1 bg-gray-200 rounded-full mb-3">
              <View className="w-2/3 h-full bg-blue-600 rounded-full" />
            </View>
            <Text className="text-sm text-gray-500">Step 2 of 3 • Budget Planning</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
