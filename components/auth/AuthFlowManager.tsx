import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useAuth, User } from '../../contexts/AuthContext';
import { apiService } from '../../src/services/api';

import { PhoneInputScreen } from './PhoneInputScreen';
import { OtpVerificationScreen } from './OtpVerificationScreen';
import { OnboardingWelcomeScreen } from './OnboardingWelcomeScreen';
import { OnboardingBudgetScreen } from './OnboardingBudgetScreen';
import { OnboardingCapsScreen } from './OnboardingCapsScreen';

type AuthStep =
  | 'phone'
  | 'otp'
  | 'onboarding-welcome'
  | 'onboarding-budget'
  | 'onboarding-caps'
  | 'complete';

interface UserData {
  phone: string;
  name?: string;
  salary?: number;
  totalBudget?: number;
  categories?: Array<{
    name: string;
    color: string;
    amount: number;
    percentage: number;
    description: string;
  }>;
}

interface AuthFlowManagerProps {
  onAuthComplete?: () => void;
}

const AuthFlowManager: React.FC<AuthFlowManagerProps> = ({ onAuthComplete }) => {
  const { login, markOnboardingComplete, getAuthToken } = useAuth();
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [userData, setUserData] = useState<UserData>({
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.94:3000';

  const handlePhoneSubmit = async (phone: string) => {
    try {
      setIsLoading(true);

      const response = await apiService.requestOtp(phone);
      setUserData({ ...userData, phone });
      setCurrentStep('otp');
    } catch (error) {
      console.error('Error requesting OTP:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (otp: string) => {
    try {
      setIsLoading(true);

      const response = await apiService.verifyOtp(userData.phone, otp);

      // Create user object from backend response
      const user: User = {
        id: response.user.id,
        phone: response.user.phone,
        name: response.user.name || 'User',
        isOnboardingComplete: response.user.isOnboardingComplete,
        hasCategories: response.user.hasCategories,
        currency: 'INR',
        language: 'en',
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
      };

      await login(response.accessToken, user);

      // Check if user needs onboarding
      if (!response.user.isOnboardingComplete) {
        console.log('📝 User needs onboarding, showing welcome screen');
        setCurrentStep('onboarding-welcome');
      } else {
        console.log('✅ User onboarding complete, going to main app');
        onAuthComplete?.();
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingWelcome = (name: string, salary: number) => {
    setUserData({ ...userData, name, salary });
    setCurrentStep('onboarding-budget');
  };

  const handleOnboardingBudget = (totalBudget: number, categories: UserData['categories']) => {
    setUserData({ ...userData, totalBudget, categories });
    setCurrentStep('onboarding-caps');
  };

  const handleOnboardingComplete = async (
    caps: Array<{
      id: string;
      name: string;
      color: string;
      description: string;
      dailyLimit: number;
      weeklyLimit: number;
      monthlyLimit: number;
      isEnabled: boolean;
    }>,
  ) => {
    try {
      setIsLoading(true);

      const onboardingData = {
        name: userData.name,
        salary: userData.salary,
        totalBudget: userData.totalBudget,
        categories: userData.categories?.map((cat) => {
          // Clean up any legacy properties and ensure proper format
          const cleanCat = {
            name: cat.name,
            color: cat.color,
            amount: cat.amount,
            description: cat.description,
          };
          // Remove any unwanted properties that might exist
          return cleanCat;
        }),
        caps: caps.map((cap) => {
          // Clean up any legacy properties and ensure proper format
          const cleanCap = {
            id: cap.id,
            name: cap.name,
            color: cap.color,
            description: cap.description,
            dailyLimit: cap.dailyLimit,
            weeklyLimit: cap.weeklyLimit,
            monthlyLimit: cap.monthlyLimit,
            isEnabled: cap.isEnabled,
          };
          // Remove any unwanted properties that might exist
          return cleanCap;
        }),
      };

      const response = await fetch(`${API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await getAuthToken()) || ''}`,
        },
        body: JSON.stringify(onboardingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete onboarding');
      }

      // Mark onboarding as complete in auth context
      await markOnboardingComplete();

      // Show success message - navigation will happen automatically via auth context state change
      Alert.alert('Setup Complete! 🎉', 'Welcome to CapnPay! Your account is ready to use.', [
        { text: 'Get Started' },
      ]);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to complete setup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'otp':
        setCurrentStep('phone');
        break;
      case 'onboarding-welcome':
        setCurrentStep('otp');
        break;
      case 'onboarding-budget':
        setCurrentStep('onboarding-welcome');
        break;
      case 'onboarding-caps':
        setCurrentStep('onboarding-budget');
        break;
      default:
        break;
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'phone':
        return <PhoneInputScreen onContinue={handlePhoneSubmit} isLoading={isLoading} />;

      case 'otp':
        return (
          <OtpVerificationScreen
            phoneNumber={userData.phone}
            onVerify={handleOtpVerify}
            onBack={handleBack}
            onResendOtp={() => handlePhoneSubmit(userData.phone)}
            isLoading={isLoading}
          />
        );

      case 'onboarding-welcome':
        return (
          <OnboardingWelcomeScreen
            onContinue={handleOnboardingWelcome}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );

      case 'onboarding-budget':
        return (
          <OnboardingBudgetScreen
            salary={userData.salary!}
            onContinue={handleOnboardingBudget}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );

      case 'onboarding-caps':
        return (
          <OnboardingCapsScreen
            userName={userData.name!}
            totalBudget={userData.totalBudget!}
            categories={userData.categories!}
            onComplete={handleOnboardingComplete}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return <View style={{ flex: 1 }}>{renderCurrentStep()}</View>;
};

// Add displayName for debugging
AuthFlowManager.displayName = 'AuthFlowManager';

export { AuthFlowManager };
