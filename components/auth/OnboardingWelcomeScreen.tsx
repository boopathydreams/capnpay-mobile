import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface OnboardingWelcomeScreenProps {
  onContinue: (name: string, salary: number) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const OnboardingWelcomeScreen: React.FC<OnboardingWelcomeScreenProps> = ({
  onContinue,
  onBack,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [salary, setSalary] = useState('');

  const handleContinue = () => {
    const salaryNumber = parseInt(salary.replace(/,/g, ''), 10);
    if (name.trim() && salaryNumber >= 10000) {
      onContinue(name.trim(), salaryNumber);
    }
  };

  const formatSalary = (value: string) => {
    // Remove all non-digits
    const digitsOnly = value.replace(/\D/g, '');

    // Format with commas
    const formatted = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setSalary(formatted);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isValid = name.trim().length >= 2 && parseInt(salary.replace(/,/g, ''), 10) >= 10000;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6 py-6">
            {/* Header */}
            <View className="items-center mt-4">
              {/* Back Button */}
              <TouchableOpacity className="absolute left-0 top-0 p-2 z-10" onPress={onBack}>
                <MaterialIcons name="arrow-back" size={24} color="#374151" />
              </TouchableOpacity>

              {/* Icon */}
              <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-6 mt-10">
                <MaterialIcons name="person-add" size={48} color="#2563EB" />
              </View>

              {/* Title */}
              <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
                Welcome to Cap'n Pay
              </Text>

              {/* Subtitle */}
              <Text className="text-base text-gray-600 text-center leading-6 px-4 mb-8">
                Let's set up your account with a few quick details to personalize your experience
              </Text>
            </View>

            {/* Form Section */}
            <View className="mb-8">
              {/* Name Input */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">Your Full Name</Text>
                <TextInput
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl bg-white text-gray-900 text-base font-medium"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <Text className="text-sm text-gray-500 mt-2">
                  This will be used for your profile and transactions
                </Text>
              </View>

              {/* Salary Input */}
              <View className="mb-6">
                <Text className="text-base font-semibold text-gray-900 mb-3">Monthly Income</Text>
                <View className="flex-row items-center border-2 border-gray-200 rounded-xl bg-white">
                  <View className="px-4 py-4 border-r border-gray-200">
                    <Text className="text-gray-700 font-semibold text-base">₹</Text>
                  </View>
                  <TextInput
                    className="flex-1 px-4 py-4 text-gray-900 text-base font-medium"
                    placeholder="50,000"
                    placeholderTextColor="#9CA3AF"
                    value={salary}
                    onChangeText={formatSalary}
                    keyboardType="numeric"
                  />
                </View>
                <Text className="text-sm text-gray-500 mt-2">
                  Helps us recommend better budget plans (₹10,000 minimum)
                </Text>
              </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              className={`flex-row items-center justify-center py-4 px-6 rounded-xl shadow-sm ${
                isValid && !isLoading ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300'
              }`}
              onPress={handleContinue}
              disabled={!isValid || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-base mr-2">
                    Continue to Budget Setup
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Progress Indicator */}
            <View className="items-center mt-6">
              <View className="w-full h-1 bg-gray-200 rounded-full mb-3">
                <View className="w-1/3 h-full bg-blue-600 rounded-full" />
              </View>
              <Text className="text-sm text-gray-500">Step 1 of 3 • Personal Details</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
