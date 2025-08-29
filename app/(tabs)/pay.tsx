import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
  Platform,
  Clipboard,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';
import { ModernCard } from '@/components/ModernUI';
import SmartAmountCard from '@/components/SmartAmountCard';
import SmartUpiApps from '@/components/SmartUpiApps';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.0.103:3000';

// Types for API integration
interface Category {
  id: string;
  name: string;
  color: string;
  capAmount: string;
}

interface SuggestedTag {
  categoryId: string;
  tagText: string;
  confidence: number;
}

interface PaymentIntent {
  tr: string;
  upiDeepLink: string;
  suggestedTag: SuggestedTag;
  categoryId: string;
  capsState: 'ok' | 'near' | 'over';
  requiresOverride?: boolean;
}

interface UpiDirectoryEntry {
  phone: string;
  vpa: string;
  name: string;
  handle: string;
}

interface PaymentAnalysis {
  suggestedTag: {
    categoryId: string;
    tagText: string;
    confidence: number;
    category: {
      id: string;
      name: string;
      color: string;
    };
  };
  aiNudges: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    severity: 'low' | 'medium' | 'high';
    icon: string;
    message: string;
    action?: string;
    color: string;
  }>;
  spendingInsights: {
    currentMonthSpent: number;
    averageTransactionAmount: number;
    lastTransactionDays: number;
    frequencyScore: number;
  };
  caps: {
    status: 'ok' | 'near' | 'over';
    percentUsed: number;
    remainingAmount: number;
    details: any;
  };
  upiOptions: {
    availableApps: Array<{
      name: string;
      packageName: string;
      icon: string;
      isInstalled: boolean;
    }>;
    recommendedApp: string;
  };
}

export default function PayScreen() {
  // State management
  const [amount, setAmount] = useState<string>('');
  const [selectedPayee, setSelectedPayee] = useState<UpiDirectoryEntry | null>(null);
  const [vpaInput, setVpaInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'recent' | 'contacts' | 'upi'>('recent');
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentPayees, setRecentPayees] = useState<UpiDirectoryEntry[]>([]);
  const [selectedTag, setSelectedTag] = useState<SuggestedTag | null>(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [showPayeeModal, setShowPayeeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [capsState, setCapsState] = useState<'ok' | 'near' | 'over'>('ok');
  const [paymentAnalysis, setPaymentAnalysis] = useState<PaymentAnalysis | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);

  // Helper functions for UPI app details
  const getUpiAppIcon = (packageName: string) => {
    const iconMap = {
      'com.google.android.apps.nbu.paisa.user': require('../../assets/images/payment_icons/google-pay/icons8-google-pay-48.png'),
      'com.phonepe.app': require('../../assets/images/payment_icons/phone-pe/icons8-phone-pe-48.png'),
      'net.one97.paytm': require('../../assets/images/payment_icons/paytm/icons8-paytm-48.png'),
    };
    return iconMap[packageName as keyof typeof iconMap];
  };

  const getUpiAppColors = (packageName: string) => {
    const colorMap = {
      'com.google.android.apps.nbu.paisa.user': {
      primary: '#4CAF50',  // Lighter green (was #34A853)
      light: '#E8F5E8',
      border: '#81C784',
      },
      'com.phonepe.app': {
      primary: '#7C3AED',  // Lighter purple (was #5F2EEA)
      light: '#F3EAFF',
      border: '#9C7AE8',
      },
      'net.one97.paytm': {
      primary: '#03DAF6',  // Lighter blue (was #00BAF2)
      light: '#E3F7FF',
      border: '#66D4FF',
      },
    };
    return (
      colorMap[packageName as keyof typeof colorMap] || {
        primary: DESIGN_SYSTEM.colors.primary[500],
        light: DESIGN_SYSTEM.colors.primary[50],
        border: DESIGN_SYSTEM.colors.primary[300],
      }
    );
  };

  const getUpiAppName = (packageName: string) => {
    const nameMap = {
      'com.google.android.apps.nbu.paisa.user': 'Google Pay',
      'com.phonepe.app': 'PhonePe',
      'net.one97.paytm': 'Paytm',
    };
    return nameMap[packageName as keyof typeof nameMap] || 'UPI App';
  };

  // Load initial data
  useEffect(() => {
    loadCategories();
    loadRecentPayees();
  }, []);

  // Auto-select recommended UPI app when payment analysis updates
  useEffect(() => {
    if (paymentAnalysis?.upiOptions?.recommendedApp && !selectedUpiApp) {
      console.log('Auto-selecting recommended app:', paymentAnalysis.upiOptions.recommendedApp);
      setSelectedUpiApp(paymentAnalysis.upiOptions.recommendedApp);
    }
  }, [paymentAnalysis]);

  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadRecentPayees = async () => {
    try {
      const response = await fetch(`${API_URL}/upi-directory/entries`);
      const data = await response.json();
      setRecentPayees(data.slice(0, 5)); // Show top 5 recent
    } catch (error) {
      console.error('Failed to load recent payees:', error);
    }
  };

  const handleAmountPreset = (presetAmount: string) => {
    setAmount(presetAmount);
  };

  const handlePayeeSelect = (payee: UpiDirectoryEntry) => {
    setSelectedPayee(payee);
    setVpaInput(payee.vpa);
    setShowPayeeModal(false);
  };

  const createPaymentIntent = async () => {
    if (!amount || (!selectedPayee && !vpaInput)) {
      Alert.alert('Missing Information', 'Please enter amount and select payee');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/pay-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          vpa: selectedPayee?.vpa || vpaInput,
          payeeName: selectedPayee?.name,
          entrypoint: 'pay_screen',
          platform: Platform.OS.toUpperCase(),
        }),
      });

      const paymentIntent: PaymentIntent = await response.json();

      setSelectedTag(paymentIntent.suggestedTag);
      setCapsState(paymentIntent.capsState);
      setShowTagModal(true);
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      Alert.alert('Error', 'Failed to create payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const completePayment = async (trRef: string, status: string) => {
    try {
      await fetch(`${API_URL}/pay-intents/${trRef}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: status,
          upiTxnRef: status === 'SUCCESS' ? `UPI${Date.now()}` : undefined,
        }),
      });

      // Reset form
      setAmount('');
      setSelectedPayee(null);
      setVpaInput('');
      setSelectedTag(null);

      Alert.alert(
        'Payment Complete',
        status === 'SUCCESS' ? 'Payment completed successfully!' : 'Payment marked as failed',
      );
    } catch (error) {
      console.error('Failed to complete payment:', error);
    }
  };

  const launchUpiIntent = async () => {
    if (!selectedTag) return;

    setIsLoading(true);
    try {
      // Create payment intent to get UPI deep link
      const response = await fetch(`${API_URL}/pay-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          vpa: selectedPayee?.vpa || vpaInput,
          payeeName: selectedPayee?.name,
          entrypoint: 'pay_screen_confirm',
          platform: Platform.OS.toUpperCase(),
        }),
      });

      const paymentIntent: PaymentIntent = await response.json();

      // Check if we're in Expo Go development environment
      const isExpoGo = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';

      if (isExpoGo) {
        // In Expo Go, simulate UPI flow for testing
        Alert.alert(
          'UPI Payment Simulation',
          `Amount: ₹${amount}\nTo: ${selectedPayee?.name || vpaInput}\nCategory: ${selectedTag?.tagText}`,
          [
            {
              text: 'Copy UPI Link',
              style: 'default',
              onPress: () => {
                Clipboard.setString(paymentIntent.upiDeepLink);
                Alert.alert('Copied!', 'UPI link copied to clipboard');
              },
            },
            {
              text: 'Simulate Failed',
              style: 'destructive',
              onPress: () => completePayment(paymentIntent.tr, 'FAILED'),
            },
            {
              text: 'Simulate Success',
              style: 'default',
              onPress: () => completePayment(paymentIntent.tr, 'SUCCESS'),
            },
          ],
        );
      } else {
        // Production: Try to launch UPI intent
        const canOpen = await Linking.canOpenURL(paymentIntent.upiDeepLink);

        if (canOpen) {
          await Linking.openURL(paymentIntent.upiDeepLink);

          // For iOS or if callback doesn't work, show manual confirmation
          if (Platform.OS === 'ios') {
            setTimeout(() => {
              Alert.alert('Payment Status', 'Was your payment successful?', [
                {
                  text: 'Failed',
                  style: 'destructive',
                  onPress: () => completePayment(paymentIntent.tr, 'FAILED'),
                },
                {
                  text: 'Success',
                  style: 'default',
                  onPress: () => completePayment(paymentIntent.tr, 'SUCCESS'),
                },
              ]);
            }, 3000); // Give time for UPI app to return
          } else {
            // Android - simulate callback handling (in real app, this would be handled by deep link)
            setTimeout(() => {
              completePayment(paymentIntent.tr, 'SUCCESS');
            }, 5000);
          }
        } else {
          Alert.alert(
            'UPI App Not Found',
            'Please install a UPI app like PhonePe, Google Pay, or Paytm to complete the payment.',
            [
              {
                text: 'OK',
                onPress: () => completePayment(paymentIntent.tr, 'FAILED'),
              },
            ],
          );
        }
      }
    } catch (error) {
      console.error('Failed to launch UPI intent:', error);
      Alert.alert('Error', 'Failed to launch payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const launchUpiPaymentDirect = async (preferredApp?: string) => {
    if (!amount || (!selectedPayee && !vpaInput)) {
      Alert.alert('Missing Information', 'Please enter amount and select payee');
      return;
    }

    setIsLoading(true);
    try {
      // Create payment intent to get UPI deep link
      const response = await fetch(`${API_URL}/pay-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          vpa: selectedPayee?.vpa || vpaInput,
          payeeName: selectedPayee?.name,
          entrypoint: 'pay_screen_direct',
          platform: Platform.OS.toUpperCase(),
        }),
      });

      const paymentIntent: PaymentIntent = await response.json();

      // Check if we're in Expo Go development environment
      const isExpoGo = process.env.EXPO_PUBLIC_ENVIRONMENT === 'development';

      if (isExpoGo) {
        // In Expo Go, simulate UPI flow for testing
        Alert.alert(
          'UPI Payment Simulation',
          `Amount: ₹${amount}\nTo: ${selectedPayee?.name || vpaInput}\nApp: ${preferredApp || 'Default'}\nCategory: ${paymentAnalysis?.suggestedTag?.tagText || 'General'}`,
          [
            {
              text: 'Copy UPI Link',
              style: 'default',
              onPress: () => {
                Clipboard.setString(paymentIntent.upiDeepLink);
                Alert.alert('Copied!', 'UPI link copied to clipboard');
              },
            },
            {
              text: 'Simulate Failed',
              style: 'destructive',
              onPress: () => completePayment(paymentIntent.tr, 'FAILED'),
            },
            {
              text: 'Simulate Success',
              style: 'default',
              onPress: () => completePayment(paymentIntent.tr, 'SUCCESS'),
            },
          ],
        );
      } else {
        // Production: Try to launch UPI intent with preferred app
        let upiLink = paymentIntent.upiDeepLink;

        // Modify UPI link for specific app if provided
        if (preferredApp) {
          // This would typically involve app-specific URL schemes
          // For now, we'll use the generic UPI link
        }

        const canOpen = await Linking.canOpenURL(upiLink);

        if (canOpen) {
          await Linking.openURL(upiLink);

          // For iOS or if callback doesn't work, show manual confirmation
          if (Platform.OS === 'ios') {
            setTimeout(() => {
              Alert.alert('Payment Status', 'Was your payment successful?', [
                {
                  text: 'Failed',
                  style: 'destructive',
                  onPress: () => completePayment(paymentIntent.tr, 'FAILED'),
                },
                {
                  text: 'Success',
                  style: 'default',
                  onPress: () => completePayment(paymentIntent.tr, 'SUCCESS'),
                },
              ]);
            }, 3000);
          } else {
            // Android - simulate callback handling
            setTimeout(() => {
              completePayment(paymentIntent.tr, 'SUCCESS');
            }, 5000);
          }
        } else {
          Alert.alert(
            'UPI App Not Found',
            'Please install a UPI app like PhonePe, Google Pay, or Paytm to complete the payment.',
            [
              {
                text: 'OK',
                onPress: () => completePayment(paymentIntent.tr, 'FAILED'),
              },
            ],
          );
        }
      }
    } catch (error) {
      console.error('Failed to launch UPI payment:', error);
      Alert.alert('Error', 'Failed to launch payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Test function
  const handleTestButton = () => {
    Alert.alert('Test Button', 'This is a test button for development', [
      {
        text: 'Test Payment Flow',
        onPress: () => {
          setAmount('100');
          setSelectedPayee({
            phone: '+919876543210',
            vpa: 'test@paytm',
            name: 'Test User',
            handle: 'paytm',
          });
        },
      },
      {
        text: 'Test Analysis',
        onPress: () => {
          if (paymentAnalysis) {
            Alert.alert('Payment Analysis', JSON.stringify(paymentAnalysis, null, 2));
          } else {
            Alert.alert('No Analysis', 'Enter amount and payee first');
          }
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Smart Amount Input with AI Analysis */}
          <SmartAmountCard
            amount={amount}
            onAmountChange={setAmount}
            vpa={selectedPayee?.vpa || vpaInput || undefined}
            payeeName={selectedPayee?.name}
            onAnalysisUpdate={setPaymentAnalysis}
          />

          {/* Compact Recent Payees - Horizontal Scroll */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: DESIGN_SYSTEM.colors.light.text,
                }}
              >
                Pay To
              </Text>
              <TouchableOpacity onPress={() => setShowPayeeModal(true)}>
                <Text
                  style={{
                    fontSize: 14,
                    color: DESIGN_SYSTEM.colors.primary[600],
                    fontWeight: '600',
                  }}
                >
                  More
                </Text>
              </TouchableOpacity>
            </View>

            {/* Horizontal Recent Payees */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Add New Payee Button */}
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    padding: 12,
                    borderRadius: DESIGN_SYSTEM.borderRadius.md,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: DESIGN_SYSTEM.colors.primary[300],
                    backgroundColor: DESIGN_SYSTEM.colors.primary[50],
                    minWidth: 70,
                  }}
                  onPress={() => setShowPayeeModal(true)}
                >
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <MaterialIcons name="add" size={18} color={DESIGN_SYSTEM.colors.primary[600]} />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: DESIGN_SYSTEM.colors.primary[600],
                      fontWeight: '600',
                      textAlign: 'center',
                    }}
                  >
                    New
                  </Text>
                </TouchableOpacity>

                {/* Recent Payees */}
                {recentPayees.map((payee) => (
                  <TouchableOpacity
                    key={`${payee.phone}-${payee.vpa}`}
                    style={{
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: DESIGN_SYSTEM.borderRadius.md,
                      borderWidth: 2,
                      borderColor:
                        selectedPayee?.vpa === payee.vpa
                          ? DESIGN_SYSTEM.colors.primary[500]
                          : DESIGN_SYSTEM.colors.neutral[200],
                      backgroundColor:
                        selectedPayee?.vpa === payee.vpa
                          ? DESIGN_SYSTEM.colors.primary[50]
                          : DESIGN_SYSTEM.colors.light.surface,
                      minWidth: 70,
                    }}
                    onPress={() => handlePayeeSelect(payee)}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor:
                          selectedPayee?.vpa === payee.vpa
                            ? DESIGN_SYSTEM.colors.primary[500]
                            : DESIGN_SYSTEM.colors.primary[100],
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color:
                            selectedPayee?.vpa === payee.vpa
                              ? 'white'
                              : DESIGN_SYSTEM.colors.primary[600],
                          fontWeight: '700',
                          fontSize: 14,
                        }}
                      >
                        {payee.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color:
                          selectedPayee?.vpa === payee.vpa
                            ? DESIGN_SYSTEM.colors.primary[700]
                            : DESIGN_SYSTEM.colors.light.text,
                        textAlign: 'center',
                      }}
                    >
                      {payee.name.length > 8 ? payee.name.substring(0, 8) + '...' : payee.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Selected Payee Info - Compact */}
          {selectedPayee && (
            <View
              style={{
                marginHorizontal: 24,
                marginBottom: 16,
                padding: 12,
                backgroundColor: DESIGN_SYSTEM.colors.success[50],
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
                borderWidth: 1,
                borderColor: DESIGN_SYSTEM.colors.success[200],
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialIcons
                name="check-circle"
                size={16}
                color={DESIGN_SYSTEM.colors.success[600]}
                style={{ marginRight: 8 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: DESIGN_SYSTEM.colors.success[700],
                  }}
                >
                  Paying {selectedPayee.name}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: DESIGN_SYSTEM.colors.success[600],
                  }}
                >
                  {selectedPayee.vpa}
                </Text>
              </View>
            </View>
          )}

          {/* Smart UPI Apps - Show when payment analysis is available */}
          {paymentAnalysis?.upiOptions && (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <SmartUpiApps
                apps={paymentAnalysis.upiOptions.availableApps}
                recommendedApp={paymentAnalysis.upiOptions.recommendedApp}
                onAppSelect={(packageName) => {
                  console.log('Selected UPI app:', packageName);
                  launchUpiPaymentDirect(packageName);
                }}
                onAppSelectionChange={(selectedApp) => {
                  console.log('App selection changed:', selectedApp);
                  setSelectedUpiApp(selectedApp);
                }}
                vpa={selectedPayee?.vpa || vpaInput}
                amount={amount}
                payeeName={selectedPayee?.name || vpaInput}
              />
            </View>
          )}
        </ScrollView>

        {/* Dynamic Pay/Test Button */}
        {selectedUpiApp && amount && (selectedPayee || vpaInput) && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 0,
              // left: 24,
              // right: 24,
              width: '100%',
              height: 60,
              backgroundColor: selectedUpiApp
                ? getUpiAppColors(selectedUpiApp).border
                : DESIGN_SYSTEM.colors.warning[500],
              paddingVertical: 16,
              // borderRadius: DESIGN_SYSTEM.borderRadius.xl,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              shadowColor: selectedUpiApp ? getUpiAppColors(selectedUpiApp).primary : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 5,
            }}
            onPress={
              selectedUpiApp && amount && (selectedPayee || vpaInput)
                ? () => launchUpiPaymentDirect(selectedUpiApp)
                : handleTestButton
            }
          >
            <>
              {/* UPI App Icon */}
              {getUpiAppIcon(selectedUpiApp) && (
                <Image
                  source={getUpiAppIcon(selectedUpiApp)}
                  style={{
                    width: 24,
                    height: 24,
                    marginRight: 12,
                    borderRadius: 6,
                  }}
                  resizeMode="contain"
                />
              )}
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '700',
                  marginRight: 8,
                }}
              >
                Pay ₹{amount} via {getUpiAppName(selectedUpiApp)}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="white" />
            </>
          </TouchableOpacity>
        )}
      </View>

      {/* Payee Modal */}
      <Modal visible={showPayeeModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
          {/* Modal Header */}
          <View
            style={{
              padding: 24,
              borderBottomWidth: 1,
              borderColor: DESIGN_SYSTEM.colors.neutral[200],
              backgroundColor: DESIGN_SYSTEM.colors.light.surface,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: DESIGN_SYSTEM.colors.light.text,
                }}
              >
                Select Payee
              </Text>
              <TouchableOpacity onPress={() => setShowPayeeModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={DESIGN_SYSTEM.colors.light.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Navigation */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: DESIGN_SYSTEM.colors.light.surface,
              paddingHorizontal: 24,
              paddingTop: 16,
            }}
          >
            {[
              { key: 'recent', label: 'Recent' },
              { key: 'contacts', label: 'Contacts' },
              { key: 'upi', label: 'UPI ID' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: DESIGN_SYSTEM.borderRadius.md,
                  marginRight: 8,
                  backgroundColor:
                    activeTab === tab.key ? DESIGN_SYSTEM.colors.primary[500] : 'transparent',
                }}
                onPress={() => setActiveTab(tab.key as any)}
              >
                <Text
                  style={{
                    fontWeight: '600',
                    color:
                      activeTab === tab.key ? 'white' : DESIGN_SYSTEM.colors.light.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <ScrollView style={{ flex: 1, padding: 24 }}>
            {activeTab === 'recent' && (
              <View>
                {recentPayees.map((payee) => (
                  <TouchableOpacity
                    key={payee.vpa}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: DESIGN_SYSTEM.colors.light.surface,
                      borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                      padding: 16,
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: DESIGN_SYSTEM.colors.neutral[200],
                    }}
                    onPress={() => handlePayeeSelect(payee)}
                  >
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor:
                          payee.name === 'Zomato'
                            ? '#E23744'
                            : payee.name === 'Myntra'
                              ? '#FF3F6C'
                              : payee.name === 'Uber'
                                ? '#000000'
                                : DESIGN_SYSTEM.colors.primary[100],
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 16,
                      }}
                    >
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 18,
                          color:
                            payee.name === 'Zomato' ||
                            payee.name === 'Myntra' ||
                            payee.name === 'Uber'
                              ? 'white'
                              : DESIGN_SYSTEM.colors.primary[600],
                        }}
                      >
                        {payee.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontWeight: '600',
                          fontSize: 16,
                          color: DESIGN_SYSTEM.colors.light.text,
                          marginBottom: 4,
                        }}
                      >
                        {payee.name}
                      </Text>
                      <Text
                        style={{
                          color: DESIGN_SYSTEM.colors.light.textSecondary,
                          fontSize: 14,
                        }}
                      >
                        {payee.vpa}
                      </Text>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={DESIGN_SYSTEM.colors.light.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {activeTab === 'upi' && (
              <View>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: DESIGN_SYSTEM.colors.light.text,
                    marginBottom: 16,
                  }}
                >
                  Enter UPI ID
                </Text>
                <TextInput
                  style={{
                    backgroundColor: DESIGN_SYSTEM.colors.light.surface,
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: DESIGN_SYSTEM.colors.neutral[200],
                    marginBottom: 24,
                  }}
                  value={vpaInput}
                  onChangeText={setVpaInput}
                  placeholder="Enter UPI ID (e.g., user@paytm)"
                  placeholderTextColor={DESIGN_SYSTEM.colors.light.textSecondary}
                  autoCapitalize="none"
                />
                {vpaInput && (
                  <TouchableOpacity
                    style={{
                      backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                      paddingVertical: 16,
                      borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      if (vpaInput) {
                        setSelectedPayee({
                          phone: '',
                          vpa: vpaInput,
                          name: vpaInput.split('@')[0],
                          handle: vpaInput.split('@')[1] || '',
                        });
                        setShowPayeeModal(false);
                      }
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                      Select This UPI ID
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {activeTab === 'contacts' && (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: 40,
                }}
              >
                <MaterialIcons
                  name="contacts"
                  size={48}
                  color={DESIGN_SYSTEM.colors.neutral[400]}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: DESIGN_SYSTEM.colors.light.textSecondary,
                    textAlign: 'center',
                    marginTop: 16,
                  }}
                >
                  Contact integration coming soon
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Tag Modal */}
      <Modal visible={showTagModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
          {/* Modal Header */}
          <View
            style={{
              padding: 24,
              borderBottomWidth: 1,
              borderColor: DESIGN_SYSTEM.colors.neutral[200],
              backgroundColor: DESIGN_SYSTEM.colors.light.surface,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                textAlign: 'center',
                color: DESIGN_SYSTEM.colors.light.text,
              }}
            >
              Confirm Payment
            </Text>
          </View>

          <ScrollView style={{ flex: 1 }}>
            {/* Payment Summary */}
            <View style={{ padding: 24 }}>
              <ModernCard
                style={{
                  backgroundColor: DESIGN_SYSTEM.colors.primary[50],
                  borderRadius: DESIGN_SYSTEM.borderRadius['2xl'],
                  padding: DESIGN_SYSTEM.spacing.xl,
                  borderColor: DESIGN_SYSTEM.colors.primary[200],
                  borderWidth: 1,
                  alignItems: 'center',
                  marginBottom: 24,
                }}
              >
                <Text
                  style={{
                    fontSize: 48,
                    fontWeight: '800',
                    color: DESIGN_SYSTEM.colors.primary[700],
                  }}
                >
                  ₹{amount}
                </Text>
                <Text
                  style={{
                    color: DESIGN_SYSTEM.colors.primary[600],
                    marginTop: 8,
                    fontSize: 16,
                    fontWeight: '500',
                  }}
                >
                  to {selectedPayee?.name || vpaInput}
                </Text>
              </ModernCard>

              {/* Caps Warning */}
              {capsState !== 'ok' && (
                <ModernCard
                  style={{
                    backgroundColor:
                      capsState === 'over'
                        ? DESIGN_SYSTEM.colors.error[50]
                        : DESIGN_SYSTEM.colors.warning[50],
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    padding: 16,
                    borderColor:
                      capsState === 'over'
                        ? DESIGN_SYSTEM.colors.error[200]
                        : DESIGN_SYSTEM.colors.warning[200],
                    borderWidth: 1,
                    marginBottom: 24,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialIcons
                      name={capsState === 'over' ? 'warning' : 'info'}
                      size={20}
                      color={
                        capsState === 'over'
                          ? DESIGN_SYSTEM.colors.error[600]
                          : DESIGN_SYSTEM.colors.warning[600]
                      }
                    />
                    <Text
                      style={{
                        fontWeight: '600',
                        marginLeft: 8,
                        color:
                          capsState === 'over'
                            ? DESIGN_SYSTEM.colors.error[600]
                            : DESIGN_SYSTEM.colors.warning[600],
                      }}
                    >
                      {capsState === 'over' ? 'Cap Exceeded' : 'Near Cap Limit'}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color:
                        capsState === 'over'
                          ? DESIGN_SYSTEM.colors.error[600]
                          : DESIGN_SYSTEM.colors.warning[600],
                    }}
                  >
                    {capsState === 'over'
                      ? 'This payment will exceed your category spending limit.'
                      : 'This payment will bring you close to your spending limit.'}
                  </Text>
                </ModernCard>
              )}

              {/* AI Tag Suggestion */}
              {selectedTag && (
                <ModernCard
                  style={{
                    backgroundColor: DESIGN_SYSTEM.colors.success[50],
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    padding: 16,
                    borderColor: DESIGN_SYSTEM.colors.success[200],
                    borderWidth: 1,
                    marginBottom: 24,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialIcons
                      name="local-offer"
                      size={20}
                      color={DESIGN_SYSTEM.colors.success[600]}
                    />
                    <Text
                      style={{
                        fontWeight: '600',
                        marginLeft: 8,
                        color: DESIGN_SYSTEM.colors.success[600],
                      }}
                    >
                      AI Suggested Tag
                    </Text>
                    <View
                      style={{
                        backgroundColor: DESIGN_SYSTEM.colors.success[100],
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 12,
                        marginLeft: 'auto',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: DESIGN_SYSTEM.colors.success[600],
                          fontWeight: '500',
                        }}
                      >
                        {Math.round(selectedTag.confidence * 100)}% confidence
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: DESIGN_SYSTEM.colors.success[700],
                    }}
                  >
                    {selectedTag.tagText}
                  </Text>
                </ModernCard>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View
            style={{
              padding: 24,
              backgroundColor: DESIGN_SYSTEM.colors.light.surface,
              borderTopWidth: 1,
              borderTopColor: DESIGN_SYSTEM.colors.neutral[200],
            }}
          >
            <TouchableOpacity
              style={{
                backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                paddingVertical: 16,
                borderRadius: DESIGN_SYSTEM.borderRadius.xl,
                alignItems: 'center',
                marginBottom: 12,
              }}
              onPress={async () => {
                setShowTagModal(false);
                await launchUpiIntent();
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: '700',
                }}
              >
                Pay Now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingVertical: 16,
                alignItems: 'center',
              }}
              onPress={() => setShowTagModal(false)}
            >
              <Text
                style={{
                  color: DESIGN_SYSTEM.colors.light.textSecondary,
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
