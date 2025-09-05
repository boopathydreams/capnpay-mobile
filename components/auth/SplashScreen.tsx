import React from 'react';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SplashScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-5">
        {/* Logo */}
        <Image
          source={require('@/assets/images/logo.png')}
          className="w-60 h-24 mb-8"
          resizeMode="contain"
        />

        {/* App Name */}
        <Text className="text-4xl font-bold text-blue-600 mb-2">Cap'n Pay</Text>

        {/* Tagline */}
        <Text className="text-lg text-gray-600 text-center mb-12">Smart Expense Tracking</Text>

        {/* Loading Indicator */}
        <ActivityIndicator size="large" color="#2563EB" className="mb-4" />

        {/* Loading Text */}
        <Text className="text-base text-gray-500">Loading...</Text>
      </View>
    </SafeAreaView>
  );
};
