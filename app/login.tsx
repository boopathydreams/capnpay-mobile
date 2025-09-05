import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { DESIGN_SYSTEM } from '../constants/DesignSystem';
import { apiService } from '../src/services/api';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [phone, setPhone] = useState('+919876543210'); // Pre-filled for testing
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');

  const { login } = useAuth();

  const handleRequestOtp = async () => {
    if (!phone || phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.requestOtp(phone);
      if (response.devCode) {
        setDevCode(response.devCode);
        setOtp(response.devCode); // Auto-fill for testing
      }
      setStep('otp');
      Alert.alert(
        'OTP Sent',
        `OTP sent to ${phone}${response.devCode ? ` (Dev code: ${response.devCode})` : ''}`,
      );
    } catch (error) {
      console.error('OTP request error:', error);
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyOtp(phone, otp);

      // Create user object from response - we'll get user details after token is set
      const user = {
        id: 'temp',
        phone: phone,
        name: 'User',
        isOnboardingComplete: true,
        hasCategories: true,
        currency: 'INR',
        language: 'en',
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
      };

      await login(response.accessToken, user);
      Alert.alert('Success', 'Login successful!');
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    setStep('phone');
    setOtp('');
    setDevCode('');
  };

  return (
    <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          {/* Header */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <MaterialIcons
                name="account-balance-wallet"
                size={40}
                color={DESIGN_SYSTEM.colors.primary[600]}
              />
            </View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: DESIGN_SYSTEM.colors.light.text,
                marginBottom: 8,
              }}
            >
              Welcome to Cap'n Pay
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: DESIGN_SYSTEM.colors.light.textSecondary,
                textAlign: 'center',
              }}
            >
              {step === 'phone'
                ? 'Enter your mobile number to get started'
                : 'Enter the OTP sent to your mobile number'}
            </Text>
          </View>

          {/* Phone Input */}
          {step === 'phone' && (
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: DESIGN_SYSTEM.colors.light.text,
                  marginBottom: 8,
                }}
              >
                Mobile Number
              </Text>
              <TextInput
                style={{
                  height: 56,
                  borderWidth: 1,
                  borderColor: DESIGN_SYSTEM.colors.neutral[300],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  fontSize: 16,
                  backgroundColor: 'white',
                  marginBottom: 24,
                }}
                placeholder="+91 9876543210"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus
              />

              <TouchableOpacity
                style={{
                  height: 56,
                  backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                }}
                onPress={handleRequestOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: '600',
                        marginRight: 8,
                      }}
                    >
                      Send OTP
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input */}
          {step === 'otp' && (
            <View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: DESIGN_SYSTEM.colors.light.text,
                  marginBottom: 8,
                }}
              >
                Enter OTP
              </Text>
              {devCode && (
                <Text
                  style={{
                    fontSize: 14,
                    color: DESIGN_SYSTEM.colors.warning[600],
                    marginBottom: 8,
                  }}
                >
                  Dev Code: {devCode}
                </Text>
              )}
              <TextInput
                style={{
                  height: 56,
                  borderWidth: 1,
                  borderColor: DESIGN_SYSTEM.colors.neutral[300],
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  fontSize: 18,
                  backgroundColor: 'white',
                  marginBottom: 24,
                  textAlign: 'center',
                  letterSpacing: 4,
                }}
                placeholder="000000"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />

              <TouchableOpacity
                style={{
                  height: 56,
                  backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                  borderRadius: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  marginBottom: 16,
                }}
                onPress={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: '600',
                        marginRight: 8,
                      }}
                    >
                      Verify & Login
                    </Text>
                    <MaterialIcons name="check" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleResendOtp}
              >
                <Text
                  style={{
                    color: DESIGN_SYSTEM.colors.primary[500],
                    fontSize: 16,
                    fontWeight: '600',
                  }}
                >
                  Resend OTP
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
