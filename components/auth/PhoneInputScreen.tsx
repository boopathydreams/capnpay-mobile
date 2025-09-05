import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PhoneInputScreenProps {
  onContinue: (phone: string) => void;
  isLoading?: boolean;
}

export const PhoneInputScreen: React.FC<PhoneInputScreenProps> = ({
  onContinue,
  isLoading = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const phoneInputRef = useRef<TextInput>(null);

  // Handle phone number input with validation
  const handlePhoneChange = (text: string) => {
    // Remove all non-digit characters
    const digitsOnly = text.replace(/\D/g, '');

    // Limit to exactly 10 digits
    if (digitsOnly.length <= 10) {
      setPhoneNumber(digitsOnly);
    }
  };

  const handleSubmit = async () => {
    if (phoneNumber.length !== 10) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return;
    }

    // Dismiss keyboard before submitting
    Keyboard.dismiss();
    const e164Phone = `+91${phoneNumber}`;
    await onContinue(e164Phone);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const isValidPhone = phoneNumber.length === 10;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 px-6 py-8">
            {/* Header with Logo */}
            <View className="items-center mt-12">
              {/* Logo */}
              <View className="mb-8">
                <Image
                  source={require('@/assets/images/logo.png')}
                  className="w-60 h-20"
                  resizeMode="contain"
                />
              </View>

              {/* Welcome Text */}
              <View className="items-center mb-12">
                {/* <Text className="text-3xl font-bold text-gray-900 mb-3">Welcome</Text> */}
                <Text className="text-base text-gray-600 text-center leading-6 px-4">
                  Smart expense tracking that helps you stay within budget and reach your financial
                  goals
                </Text>
              </View>
            </View>

            {/* Phone Input Section */}
            <View className="mb-8">
              <Text className="text-base font-semibold text-gray-900 mb-3">Phone Number</Text>

              {/* Phone Input Container */}
              <View className="flex-row border-2 border-gray-200 rounded-xl bg-white overflow-hidden focus-within:border-blue-500">
                {/* Country Code */}
                <View className="px-4 py-4 bg-gray-50 border-r border-gray-200 justify-center">
                  <Text className="text-base font-semibold text-gray-900">🇮🇳 +91</Text>
                </View>

                {/* Phone Number Input */}
                <TextInput
                  ref={phoneInputRef}
                  className="flex-1 px-4 py-4 text-base text-gray-900"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  maxLength={10}
                  autoFocus
                  onBlur={dismissKeyboard}
                />
              </View>

              {/* Help Text */}
              <Text className="text-sm text-gray-500 mt-2">
                We'll send you a verification code to this number
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`flex-row items-center justify-center py-4 px-6 rounded-xl shadow-sm ${
                isValidPhone && !isLoading ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300'
              }`}
              onPress={handleSubmit}
              disabled={!isValidPhone || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text className="text-white font-semibold text-base mr-2">
                    Get Verification Code
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View className="mt-8">
              <Text className="text-xs text-gray-500 text-center leading-4">
                By continuing, you agree to our{' '}
                <Text className="text-blue-600">Terms of Service</Text> and{' '}
                <Text className="text-blue-600">Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
