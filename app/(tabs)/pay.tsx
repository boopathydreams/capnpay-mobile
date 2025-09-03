import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Platform,
  Clipboard,
  Image,
  Animated,
} from 'react-native';
import * as Linking from 'expo-linking';
import { MaterialIcons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';
import { ModernCard } from '@/components/ModernUI';
import SmartAmountCard from '@/components/SmartAmountCard';
import PaymentOverlay from '@/components/PaymentOverlay';
import { PaymentFlowManager, PaymentFlowState } from '@/utils/PaymentFlowManager';

// API Configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.114:3000';

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
  const [paymentAnalysis, setPaymentAnalysis] = useState<PaymentAnalysis | null>(null);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);

  // Payment flow state managed by PaymentFlowManager
  const [paymentFlowState, setPaymentFlowState] = useState<PaymentFlowState>({
    status: 'idle',
    message: '',
    referenceId: null,
    collectionLinks: null,
    error: null,
    canRetry: true,
  });

  // Payment timer for 3-minute countdown
  const [paymentTimer, setPaymentTimer] = useState<number>(0);
  const paymentTimerRef = useRef<any>(null);

  // Payment flow manager instance
  const paymentFlowManagerRef = useRef<PaymentFlowManager | null>(null);

  const spinValue = useRef(new Animated.Value(0)).current;

  // Initialize payment flow manager
  useEffect(() => {
    paymentFlowManagerRef.current = new PaymentFlowManager(API_URL, {
      onStateChange: (state) => {
        console.log('🔄 Payment flow state changed:', state);
        setPaymentFlowState(state);
      },
      onSuccess: (referenceId) => {
        console.log('🎉 Payment successful:', referenceId);
        stopPaymentTimer();
        Alert.alert(
          '✅ Payment Successful!',
          `₹${amount} has been successfully sent to ${selectedPayee?.name || vpaInput}`,
          [{ text: 'Done', onPress: resetPaymentFlow }],
        );
      },
      onFailure: (error, canRetry) => {
        console.log('❌ Payment failed:', error);
        stopPaymentTimer();
        Alert.alert('❌ Payment Failed', error, [
          { text: 'OK', onPress: canRetry ? undefined : resetPaymentFlow },
        ]);
      },
      onTimeout: () => {
        console.log('⏰ Payment timeout');
        stopPaymentTimer();
        Alert.alert(
          'Payment Timeout',
          'Payment took too long. Please check your transaction manually.',
          [{ text: 'OK', onPress: resetPaymentFlow }],
        );
      },
    });

    return () => {
      // Cleanup on unmount
      if (paymentFlowManagerRef.current) {
        paymentFlowManagerRef.current.dispose();
      }
      if (paymentTimerRef.current) {
        clearInterval(paymentTimerRef.current);
      }
    };
  }, []);

  // Start/stop payment timer
  const startPaymentTimer = () => {
    console.log('⏰ Starting 3-minute payment timer');
    setPaymentTimer(180); // 3 minutes = 180 seconds

    if (paymentTimerRef.current) {
      clearInterval(paymentTimerRef.current);
    }

    const interval = setInterval(() => {
      setPaymentTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          paymentTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    paymentTimerRef.current = interval;
  };

  const stopPaymentTimer = () => {
    if (paymentTimerRef.current) {
      clearInterval(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    setPaymentTimer(0);
  };

  // Reset payment flow
  const resetPaymentFlow = () => {
    console.log('🧹 Resetting payment flow completely...');

    // Reset all states
    setPaymentFlowState({
      status: 'idle',
      message: '',
      referenceId: null,
      collectionLinks: null,
      error: null,
      canRetry: true,
    });

    // Stop timer
    stopPaymentTimer();

    // Cancel payment flow manager
    if (paymentFlowManagerRef.current) {
      paymentFlowManagerRef.current.cancel();
    }

    // Reset form
    setAmount('');
    setSelectedPayee(null);
    setVpaInput('');
    setPaymentAnalysis(null);
    setSelectedUpiApp(null);
  };

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
        primary: '#4CAF50',
        light: '#E8F5E8',
        border: '#81C784',
      },
      'com.phonepe.app': {
        primary: '#7C3AED',
        light: '#F3EAFF',
        border: '#9C7AE8',
      },
      'net.one97.paytm': {
        primary: '#03DAF6',
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

  // Animation for loader
  useEffect(() => {
    if (
      paymentFlowState.status !== 'idle' &&
      paymentFlowState.status !== 'completed' &&
      paymentFlowState.status !== 'failed'
    ) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [paymentFlowState.status, spinValue]);

  // Load data on mount
  useEffect(() => {
    loadCategories();
    loadRecentPayees();
  }, []);

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
      const mockPayees: UpiDirectoryEntry[] = [
        { phone: '+919876543210', vpa: 'john.doe@paytm', name: 'John Doe', handle: 'paytm' },
        {
          phone: '+919876543211',
          vpa: 'alice.smith@phonepe',
          name: 'Alice Smith',
          handle: 'phonepe',
        },
        { phone: '+919876543212', vpa: 'bob.wilson@gpay', name: 'Bob Wilson', handle: 'gpay' },
      ];
      setRecentPayees(mockPayees);
    } catch (error) {
      console.error('Failed to load recent payees:', error);
    }
  };

  // New Professional Payment Flow Handler using PaymentFlowManager
  const handleConfirmPayment = async () => {
    if (!amount || (!selectedPayee && !vpaInput)) {
      Alert.alert('Missing Information', 'Please enter amount and select payee');
      return;
    }

    console.log('🚀 Starting professional payment flow...');

    // Start the payment using the professional flow manager
    if (paymentFlowManagerRef.current) {
      startPaymentTimer();

      await paymentFlowManagerRef.current.startPayment({
        amount: parseFloat(amount),
        recipientVpa: selectedPayee?.vpa || vpaInput,
        recipientName: selectedPayee?.name,
        category: paymentAnalysis?.suggestedTag?.category?.name || 'Payment',
        note: paymentAnalysis?.suggestedTag?.tagText || "Escrow payment via Cap'n Pay",
      });
    }
  };

  // Handle UPI App Selection using PaymentFlowManager
  const handleUpiAppSelection = (appName: string) => {
    console.log(`🎯 Selected UPI app: ${appName}`);

    setSelectedUpiApp(appName);

    // Delegate to the payment flow manager
    if (paymentFlowManagerRef.current) {
      paymentFlowManagerRef.current.selectUpiApp(appName);
    }
  };

  // Handle payee selection from modal
  const handlePayeeSelect = (payee: UpiDirectoryEntry) => {
    setSelectedPayee(payee);
    setVpaInput('');
    setShowPayeeModal(false);
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
                    fontWeight: '500',
                  }}
                >
                  View All
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {recentPayees.map((payee, index) => (
                  <TouchableOpacity
                    key={index}
                    style={{
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: DESIGN_SYSTEM.borderRadius.md,
                      backgroundColor: DESIGN_SYSTEM.colors.neutral[50],
                      minWidth: 80,
                      borderWidth: selectedPayee?.vpa === payee.vpa ? 2 : 1,
                      borderColor:
                        selectedPayee?.vpa === payee.vpa
                          ? DESIGN_SYSTEM.colors.primary[500]
                          : DESIGN_SYSTEM.colors.neutral[200],
                    }}
                    onPress={() => {
                      setSelectedPayee(payee);
                      setVpaInput('');
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: DESIGN_SYSTEM.colors.primary[700],
                        }}
                      >
                        {payee.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .substring(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '500',
                        textAlign: 'center',
                        color: DESIGN_SYSTEM.colors.light.text,
                      }}
                      numberOfLines={1}
                    >
                      {payee.name.split(' ')[0]}
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
                  Paying to {selectedPayee.name}
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

          {/* UPI Input */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: DESIGN_SYSTEM.colors.light.textSecondary,
                marginBottom: 8,
              }}
            >
              Or enter UPI ID
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: DESIGN_SYSTEM.colors.neutral[300],
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                backgroundColor: 'white',
              }}
              placeholder="someone@paytm"
              value={vpaInput}
              onChangeText={(text) => {
                setVpaInput(text);
                setSelectedPayee(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Payment Button */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <TouchableOpacity
              style={{
                backgroundColor:
                  !amount || (!selectedPayee && !vpaInput) || paymentFlowState.status !== 'idle'
                    ? DESIGN_SYSTEM.colors.neutral[300]
                    : DESIGN_SYSTEM.colors.primary[600],
                paddingVertical: 16,
                borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}
              disabled={
                !amount || (!selectedPayee && !vpaInput) || paymentFlowState.status !== 'idle'
              }
              onPress={handleConfirmPayment}
            >
              {paymentFlowState.status !== 'idle' ? (
                <Animated.View
                  style={{
                    transform: [
                      {
                        rotate: spinValue.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  }}
                >
                  <MaterialIcons name="sync" size={20} color="white" />
                </Animated.View>
              ) : (
                <MaterialIcons name="wallet" size={20} color="white" />
              )}
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: '600',
                }}
              >
                {paymentFlowState.status !== 'idle' ? 'Processing...' : `Confirm`}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Payment Overlay */}
        <PaymentOverlay
          visible={
            paymentFlowState.status !== 'idle' && paymentFlowState.status !== 'waiting_payment'
          }
          paymentStatus={paymentFlowState.status}
          paymentStatusMessage={paymentFlowState.message}
          paymentTimer={paymentTimer}
          spinValue={spinValue}
          collectionLinks={paymentFlowState.collectionLinks}
          onUpiAppSelection={handleUpiAppSelection}
          onReset={resetPaymentFlow}
        />

        {/* Payee Selection Modal */}
        <Modal
          visible={showPayeeModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPayeeModal(false)}
        >
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
                          backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: '700',
                            fontSize: 18,
                            color: DESIGN_SYSTEM.colors.primary[600],
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
      </View>
    </ScreenWrapper>
  );
}
