import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface OtpVerificationScreenProps {
  phoneNumber: string;
  onVerify: (otp: string) => void;
  onBack: () => void;
  onResendOtp: () => void;
  isLoading?: boolean;
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  phoneNumber,
  onVerify,
  onBack,
  onResendOtp,
  isLoading = false,
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Auto-fill development OTP for testing
  //   useEffect(() => {
  //     const devOtp = __DEV__ ? '123456' : null;
  //     if (devOtp && devOtp.length === 6) {
  //       const otpArray = devOtp.split('');
  //       setOtp(otpArray);
  //     }
  //   }, []); // Timer for resend functionality
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-move to next input
    if (value && index < 5) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 50);
    }

    // Auto-submit when all fields are filled
    if (index === 5 && value) {
      const completeOtp = newOtp.join('');
      if (completeOtp.length === 6) {
        // Dismiss keyboard before submitting
        Keyboard.dismiss();
        handleSubmit(completeOtp);
      }
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current field is empty and backspace is pressed, move to previous field and clear it
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        setTimeout(() => {
          inputRefs.current[index - 1]?.focus();
        }, 50);
      }
    }
  };

  const handleSubmit = async (otpCode?: string) => {
    const finalOtp = otpCode || otp.join('');
    if (finalOtp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP');
      return;
    }

    Keyboard.dismiss();
    await onVerify(finalOtp);
  };

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(30);
    setOtp(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();

    await onResendOtp();
  };

  const maskedPhone = phoneNumber.replace(/(\+91)(\d{5})(\d{5})/, '$1 $2 ***$3');
  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
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
              <MaterialIcons name="sms" size={48} color="#2563EB" />
            </View>

            {/* Title */}
            <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
              Verify Phone Number
            </Text>

            {/* Subtitle */}
            <Text className="text-base text-gray-600 text-center leading-6 px-4 mb-8">
              We've sent a 6-digit verification code to{'\n'}
              <Text className="font-semibold text-gray-900">{maskedPhone}</Text>
            </Text>
          </View>

          {/* OTP Input Section */}
          <View className="items-center mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-6">
              Enter Verification Code
            </Text>

            {/* OTP Input Container */}
            <View className="flex-row justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className={`w-12 h-14 border-2 rounded-xl bg-white text-center text-xl font-semibold ${
                    digit
                      ? 'border-blue-300 bg-blue-50 text-gray-900'
                      : 'border-gray-200 text-gray-900'
                  }`}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(event) => handleKeyPress(event, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  autoFocus={index === 0}
                  selectTextOnFocus
                  blurOnSubmit={false}
                />
              ))}
            </View>

            {/* Dev OTP Display */}
            {__DEV__ && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4">
                <Text className="text-sm text-yellow-700 font-semibold">Dev OTP: 123456</Text>
              </View>
            )}

            {/* Resend Section */}
            <View className="items-center">
              {canResend ? (
                <TouchableOpacity className="py-2 px-4" onPress={handleResend}>
                  <Text className="text-base text-blue-600 font-semibold">Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-base text-gray-500">Resend code in {resendTimer}s</Text>
              )}
            </View>
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            className={`flex-row items-center justify-center py-4 px-6 rounded-xl shadow-sm ${
              isOtpComplete && !isLoading ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300'
            }`}
            onPress={() => handleSubmit()}
            disabled={!isOtpComplete || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text className="text-white font-semibold text-base mr-2">Verify & Continue</Text>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
