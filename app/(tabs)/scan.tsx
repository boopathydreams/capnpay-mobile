import React from 'react';
import { View, Text } from 'react-native';
import ScreenWrapper from '@/components/ScreenWrapper';

export default function ScanScreen() {
  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <Text className="text-xl font-semibold text-gray-900">Scan QR</Text>
      </View>

      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-500 text-center">
          QR Scanner will be implemented here{'\n'}
          Camera + UPI QR parsing
        </Text>
      </View>
    </ScreenWrapper>
  );
}
