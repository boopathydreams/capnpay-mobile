import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Share,
  Alert,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';
import { useMemo } from 'react';
import CircularGauge from '../CircularGauge';
import PaymentOverlay from '../PaymentOverlay';
import { usePaymentFlow } from './hooks/usePaymentFlow';
import { AnimatedNotesRow } from './AnimatedNotesRow';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Mock data for comprehensive testing - Over budget scenario
const MOCK_PAYMENT_ANALYSIS: PaymentAnalysis = {
  suggestedTag: {
    categoryId: 'food_01',
    tagText: 'Food & Dining',
    confidence: 0.85,
    category: {
      id: 'food_01',
      name: 'Food & Dining',
      color: '#10B981',
    },
  },
  aiNudges: [
    {
      id: 'nudge_01',
      type: 'warning',
      severity: 'high',
      icon: '⚠️',
      message: 'This exceeds your Food cap. Proceed anyway?',
      action: 'Consider cooking at home for the next few days',
      color: '#F59E0B',
    },
    {
      id: 'nudge_02',
      type: 'info',
      severity: 'medium',
      icon: '💡',
      message: 'You typically spend ₹350 on similar transactions',
      action: 'Try reducing portion sizes?',
      color: '#3B82F6',
    },
  ],
  spendingInsights: {
    currentMonthSpent: 4700, // Spent this month
    averageTransactionAmount: 350, // Similar spends avg
    lastTransactionDays: 2,
    frequencyScore: 0.7,
  },
  caps: {
    status: 'over',
    percentUsed: 94, // 94% - over budget
    remainingAmount: 300, // Remaining (negative scenario)
    details: {
      status: 'over',
      totalSpent: 4700,
      totalLimit: 5000,
      categories: [
        { id: 'food_01', name: 'Food & Dining', spent: 4700, limit: 5000, utilizationPct: 94 },
        { id: 'transport_01', name: 'Transport', spent: 1800, limit: 3000, utilizationPct: 60 },
        { id: 'shopping_01', name: 'Shopping', spent: 2800, limit: 4000, utilizationPct: 70 },
      ],
    },
  },
  upiOptions: {
    availableApps: [
      {
        name: 'Google Pay',
        packageName: 'com.google.android.apps.nbu.paisa.user',
        icon: '🔵',
        isInstalled: true,
      },
      { name: 'PhonePe', packageName: 'com.phonepe.app', icon: '🟣', isInstalled: true },
      { name: 'Paytm', packageName: 'net.one97.paytm', icon: '🔷', isInstalled: true },
    ],
    recommendedApp: 'com.google.android.apps.nbu.paisa.user',
  },
};

// Utilities and new helpers
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(
    Math.max(0, Math.round(n || 0)),
  );

type CtaVariant = 'primary' | 'warning-outline' | 'destructive-outline';

const getPrimaryCta = (status: 'ok' | 'near' | 'over' | undefined, amount: number) => {
  if (!amount || amount <= 0) return { label: 'Continue', variant: 'primary' as CtaVariant };
  if (status === 'over')
    return {
      label: `Continue & Pay ₹${formatINR(amount)}`,
      variant: 'destructive-outline' as CtaVariant,
    };
  if (status === 'near')
    return {
      label: `Confirm & Pay ₹${formatINR(amount)}`,
      variant: 'warning-outline' as CtaVariant,
    };
  return { label: `Pay ₹${formatINR(amount)}`, variant: 'primary' as CtaVariant };
};

const NudgeBanner: React.FC<{ status: 'ok' | 'near' | 'over'; text: string }> = ({
  status,
  text,
}) => {
  const bg = status === 'over' ? '#FEF3C7' : status === 'near' ? '#FFF7ED' : '#ECFDF5';
  const border = status === 'over' ? '#F59E0B' : status === 'near' ? '#FDBA74' : '#10B981';
  const icon = status === 'over' ? '⚠️' : status === 'near' ? '🟠' : '✅';
  const color = status === 'over' ? '#92400E' : status === 'near' ? '#7C2D12' : '#065F46';
  return (
    <View
      style={[styles.nudgeBanner, { backgroundColor: bg, borderColor: border }]}
      pointerEvents="box-none"
    >
      <Text style={[styles.nudgeIcon]}>{icon}</Text>
      <Text style={[styles.nudgeText, { color }]}>{text}</Text>
    </View>
  );
};

const InfoChips: React.FC<{ spent: number; remaining: number; average: number }> = ({
  spent,
  remaining,
  average,
}) => {
  return (
    <View style={styles.chipsContainer}>
      {/* First Row: Spent & Remaining */}
      <View style={styles.firstRow}>
        <View style={styles.spentChip}>
          <Text style={styles.chipText}>
            <Text style={styles.chipAmount}>₹{formatINR(spent)}</Text> spent — you're keeping good
            track!
          </Text>
        </View>
        <View
          style={[
            styles.remainingChip,
            remaining < 0 && { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
          ]}
        >
          <Text style={[styles.chipText, { color: remaining < 0 ? '#EF4444' : '#10B981' }]}>
            {remaining < 0 ? (
              <>
                <Text style={[styles.chipAmount, { color: '#EF4444' }]}>
                  ₹{formatINR(Math.abs(remaining))}
                </Text>{' '}
                over — but hey, life happens!
              </>
            ) : (
              <>
                <Text style={[styles.chipAmount, { color: '#10B981' }]}>
                  ₹{formatINR(remaining)}
                </Text>{' '}
                left to enjoy
              </>
            )}
          </Text>
        </View>
      </View>

      {/* Second Row: Similar Spends */}
      <View style={styles.secondRow}>
        <View style={styles.similarSpendChip}>
          <Text style={styles.chipText}>
            Similar spends usually around{' '}
            <Text style={styles.chipAmount}>₹{formatINR(average)}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

// Receipt View Component
interface ReceiptViewProps {
  visible: boolean;
  amount: string;
  recipientName: string;
  recipientVpa: string;
  onShare: () => void;
  onClose: () => void;
}

const ReceiptView: React.FC<ReceiptViewProps> = ({
  visible,
  amount,
  recipientName,
  recipientVpa,
  onShare,
  onClose,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(screenHeight);
    }
  }, [visible]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `✅ Payment Successful!\n\n₹${amount} sent to ${recipientName}\nUPI ID: ${recipientVpa}\n\nSent via Cap'n Pay`,
        title: 'Payment Receipt',
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
      }}
    >
      <Animated.View
        style={[
          {
            backgroundColor: 'white',
            margin: 20,
            borderRadius: 16,
            padding: 24,
            alignItems: 'center',
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Success Icon */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: DESIGN_SYSTEM.colors.success[100],
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <MaterialIcons name="check-circle" size={48} color={DESIGN_SYSTEM.colors.success[500]} />
        </View>

        {/* Receipt Content */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
          Payment Successful!
        </Text>

        <Text style={{ fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 4 }}>
          ₹{amount}
        </Text>

        <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 24 }}>
          sent to {recipientName}
        </Text>

        {/* Receipt Details */}
        <View
          style={{
            width: '100%',
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#6B7280' }}>To</Text>
            <Text style={{ fontWeight: '600', color: '#111827' }}>{recipientName}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#6B7280' }}>UPI ID</Text>
            <Text style={{ fontWeight: '600', color: '#111827' }}>{recipientVpa}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#6B7280' }}>Date</Text>
            <Text style={{ fontWeight: '600', color: '#111827' }}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: DESIGN_SYSTEM.colors.primary[500],
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleShare}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Share Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#F3F4F6',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={onClose}
          >
            <Text style={{ color: '#111827', fontWeight: '600' }}>Done</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

// Status Cards Component
interface StatusCardsProps {
  currentMonthSpent: number;
  remainingAmount: number;
  averageSpent: number;
  status: 'ok' | 'near' | 'over';
}

const StatusCards: React.FC<StatusCardsProps> = ({
  currentMonthSpent,
  remainingAmount,
  averageSpent,
  status,
}) => {
  return (
    <View style={styles.statusCardsContainer}>
      <View style={styles.statusCard}>
        <Text style={styles.statusCardLabel}>Spent this month</Text>
        <Text style={styles.statusCardValue}>₹{currentMonthSpent.toLocaleString()}</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusCardLabel}>Remaining</Text>
        <Text
          style={[styles.statusCardValue, { color: remainingAmount < 0 ? '#EF4444' : '#10B981' }]}
        >
          ₹{Math.abs(remainingAmount).toLocaleString()}
          {remainingAmount < 0 && ' over'}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusCardLabel}>Similar spends</Text>
        <Text style={styles.statusCardValue}>₹{averageSpent} avg</Text>
      </View>
    </View>
  );
};

interface PaymentNudge {
  id: string;
  type: 'warning' | 'info' | 'success';
  severity: 'low' | 'medium' | 'high';
  icon: string;
  message: string;
  action?: string;
  color: string;
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
  aiNudges: PaymentNudge[];
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

interface AmountModalProps {
  visible: boolean;
  onClose: () => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  recipientName?: string;
  recipientVpa?: string;
  analysis?: PaymentAnalysis;
  // Optional callbacks for external handling
  onPaymentSuccess?: (referenceId: string) => void;
  onPaymentFailure?: (error: string) => void;
}

export const AmountModal: React.FC<AmountModalProps> = ({
  visible,
  onClose,
  amount,
  onAmountChange,
  recipientName = 'Someone',
  recipientVpa = '',
  analysis,
  onPaymentSuccess,
  onPaymentFailure,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [paymentAnalysis, setPaymentAnalysis] = useState<PaymentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Note states
  const [textNote, setTextNote] = useState('');
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Input refs for better keyboard management
  const amountInputRef = useRef<TextInput>(null);

  // Payment flow hook - handles all payment logic internally
  const {
    paymentFlowState,
    paymentTimer,
    spinValue,
    startPayment,
    selectUpiApp,
    resetPaymentFlow,
    isPaymentInProgress,
    isPaymentCompleted,
    isPaymentFailed,
  } = usePaymentFlow({
    onPaymentSuccess: (referenceId) => {
      setShowReceipt(true);
      onPaymentSuccess?.(referenceId);
    },
    onPaymentFailure: (error, canRetry) => {
      Alert.alert('❌ Payment Failed', error, [
        { text: 'OK', onPress: canRetry ? undefined : resetPaymentFlow },
      ]);
      onPaymentFailure?.(error);
    },
    onPaymentTimeout: () => {
      Alert.alert(
        'Payment Timeout',
        'Payment took too long. Please check your transaction manually.',
        [{ text: 'OK', onPress: resetPaymentFlow }],
      );
    },
  });

  // Animation refs for Smart Payment Compass
  const compassRotation = useRef(new Animated.Value(0)).current;
  const compassScale = useRef(new Animated.Value(0.8)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const nudgeAnimation = useRef(new Animated.Value(0)).current;

  // Cleanup effect for recording timer
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    };
  }, []);

  // For development testing - use mock data
  useEffect(() => {
    const testWithMockData = () => {
      console.log('🔄 Testing with MOCK_PAYMENT_ANALYSIS');
      setPaymentAnalysis(MOCK_PAYMENT_ANALYSIS);

      // Trigger compass animations
      Animated.sequence([
        Animated.timing(compassScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(compassRotation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate nudges
      Animated.timing(nudgeAnimation, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    };

    // For testing purposes, always show the compass with mock data
    if (visible && amount && parseFloat(amount) > 0) {
      const timer = setTimeout(testWithMockData, 500);
      return () => clearTimeout(timer);
    } else {
      setPaymentAnalysis(null);
    }
  }, [amount, visible]);

  // Handle payment completion
  useEffect(() => {
    if (paymentFlowState.status === 'completed') {
      setShowReceipt(true);
    }
  }, [paymentFlowState.status]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      slideAnim.setValue(screenHeight);
      setShowReceipt(false); // Reset receipt when modal closes
    }
  }, [visible]);

  const handleClose = () => {
    Keyboard.dismiss();
    resetPaymentFlow(); // Reset payment state when closing
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(onClose);
  };

  const handleConfirm = async () => {
    if (amount && parseFloat(amount) > 0 && recipientVpa) {
      // Start internal payment flow
      await startPayment({
        amount: parseFloat(amount),
        recipientVpa,
        recipientName,
        note: textNote || undefined, // Pass text note if provided
      });
    }
  };

  // Voice recording functionality - with proper timer management
  const recordingIntervalRef = useRef<number | null>(null);

  const toggleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setRecordingDuration(0);

      // Clear the interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);

      // Start the recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= 30) {
            // Max 30 seconds - auto stop
            setIsRecording(false);
            if (recordingIntervalRef.current) {
              clearInterval(recordingIntervalRef.current);
              recordingIntervalRef.current = null;
            }
            return 0;
          }
          return newDuration;
        });
      }, 1000);
    }
  };

  // Handle amount input focus
  const handleAmountFocus = () => {
    console.log('Amount input focused');
  };

  const formatAmount = (value: string) => {
    const numericValue = value.replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return numericValue;
  };

  const handleAmountChange = (text: string) => {
    const formatted = formatAmount(text);
    onAmountChange(formatted);
  };

  const numberToWords = (num: number): string => {
    if (num === 0) return "That's zero rupees";
    if (num < 1000) return `That's ${num} rupees`;
    if (num < 100000) return `That's ${(num / 1000).toFixed(1)}K rupees`;
    if (num < 10000000) return `That's ${(num / 100000).toFixed(1)} lakh rupees`;
    return `That's ${(num / 10000000).toFixed(1)} crore rupees`;
  };

  const numericAmount = amount ? parseFloat(amount) : 0;
  const isValidAmount = numericAmount > 0;

  const headerTitleText = useMemo(() => {
    if (isValidAmount && recipientName) {
      return `Send ₹${formatINR(numericAmount)} to ${recipientName}`;
    }
    return 'Enter Amount';
  }, [isValidAmount, numericAmount, recipientName]);

  const ctaMeta = getPrimaryCta(paymentAnalysis?.caps.status, numericAmount);

  // Dynamic gauge sizing based on text input width
  const calculateGaugeSize = useMemo(() => {
    const baseSize = 200;
    const minSize = 180;
    const maxSize = 280;

    // Estimate text width based on amount length and font size (48px)
    const textLength = amount.length || 1;
    const estimatedTextWidth = textLength * 25 + 60; // 25px per char + currency symbol

    // Calculate gauge size to accommodate text with some padding
    const dynamicSize = Math.max(minSize, Math.min(maxSize, estimatedTextWidth + 80));

    return dynamicSize;
  }, [amount]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop that closes the modal */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Modal content – no touchable wrapper */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* FIXED HEADER */}
          <View style={styles.fixedHeader}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <MaterialIcons name="close" size={24} color={DESIGN_SYSTEM.colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{headerTitleText}</Text>
            <View style={styles.headerRight} />
          </View>

          {/* SCROLLABLE CONTENT */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
            bounces={true}
            alwaysBounceVertical={false}
            nestedScrollEnabled={true}
          >
            {/* Recipient Info */}
            {recipientName && (
              <View style={styles.recipientInfo}>
                <View style={styles.recipientCard}>
                  <View style={styles.recipientAvatar}>
                    <Text style={styles.recipientInitial}>
                      {recipientName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.recipientDetails}>
                    <Text style={styles.recipientName}>{recipientName}</Text>
                    {recipientVpa && <Text style={styles.recipientVpa}>{recipientVpa}</Text>}
                  </View>
                </View>
              </View>
            )}

            {/* Amount Input Section */}
            <View style={styles.amountSection}>
              <View
                style={[
                  styles.amountInputWrapper,
                  {
                    width: calculateGaugeSize,
                    height: calculateGaugeSize * 0.6,
                  },
                ]}
                pointerEvents="box-none" // Allow touch events to pass through to ScrollView
              >
                {/* Circular Budget Gauge around Amount Input */}
                {paymentAnalysis && (
                  <View
                    style={[
                      styles.compassRingContainer,
                      {
                        width: calculateGaugeSize,
                        height: calculateGaugeSize * 0.6,
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <CircularGauge
                      value={paymentAnalysis.caps.percentUsed}
                      maxValue={100}
                      size={calculateGaugeSize}
                      strokeWidth={18}
                      showPointer={true}
                      animationDuration={2000}
                      sections={[
                        {
                          color: '#10B981',
                          gradientStart: '#10B981',
                          gradientEnd: '#059669',
                          startPercentage: 0,
                          endPercentage: 60,
                          label: 'Safe',
                        },
                        {
                          color: '#F59E0B',
                          gradientStart: '#F59E0B',
                          gradientEnd: '#D97706',
                          startPercentage: 60,
                          endPercentage: 80,
                          label: 'Warning',
                        },
                        {
                          color: '#EF4444',
                          gradientStart: '#EF4444',
                          gradientEnd: '#DC2626',
                          startPercentage: 80,
                          endPercentage: 100,
                          label: 'Critical',
                        },
                      ]}
                    />
                  </View>
                )}

                {/* Amount Input Container - Centered */}
                <View style={styles.amountInputContainer} pointerEvents="box-none">
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    ref={amountInputRef}
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={DESIGN_SYSTEM.colors.neutral[400]}
                    selectionColor={DESIGN_SYSTEM.colors.primary[500]}
                    autoFocus
                    onFocus={handleAmountFocus}
                    pointerEvents="auto"
                  />
                </View>
              </View>

              {numericAmount > 0 && (
                <View style={styles.paymentDetailsSection}>
                  {/* Cap/Tag with Percentage */}
                  {paymentAnalysis && (
                    <View style={styles.capTagContainer}>
                      <View
                        style={[
                          styles.capTagChip,
                          { borderColor: paymentAnalysis.suggestedTag.category.color },
                        ]}
                      >
                        <View
                          style={[
                            styles.capTagDot,
                            { backgroundColor: paymentAnalysis.suggestedTag.category.color },
                          ]}
                        />
                        <Text style={styles.capTagText}>
                          {paymentAnalysis.suggestedTag.category.name}
                        </Text>
                        <Text
                          style={[
                            styles.capTagPercentage,
                            {
                              color:
                                paymentAnalysis.caps.status === 'over'
                                  ? '#EF4444'
                                  : paymentAnalysis.caps.status === 'near'
                                  ? '#F59E0B'
                                  : '#10B981',
                            },
                          ]}
                        >
                          {paymentAnalysis.caps.percentUsed}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Animated Notes Row */}
                  <AnimatedNotesRow
                    textNote={textNote}
                    onTextNoteChange={setTextNote}
                    voiceNote={voiceNote}
                    onVoiceNoteChange={setVoiceNote}
                    isRecording={isRecording}
                    recordingDuration={recordingDuration}
                    onToggleRecording={toggleVoiceRecording}
                  />
                </View>
              )}
            </View>

            {/* Smart Payment Compass */}
            {paymentAnalysis && (
              <Animated.View
                style={[
                  styles.paymentCompass,
                  {
                    transform: [{ scale: compassScale }],
                    opacity: compassScale,
                  },
                ]}
              >
                {/* AI Nudge Banner */}
                <NudgeBanner
                  status={paymentAnalysis.caps.status}
                  text={
                    paymentAnalysis.caps.status === 'over'
                      ? "Heads up: You've crossed your Food budget this month. Want to continue?"
                      : paymentAnalysis.caps.status === 'near'
                      ? "Just so you know, you're getting close to your Food budget."
                      : 'Looking good! This is well within your Food budget.'
                  }
                />

                {/* Chips Row */}
                <InfoChips
                  spent={paymentAnalysis.spendingInsights.currentMonthSpent}
                  remaining={paymentAnalysis.caps.remainingAmount}
                  average={paymentAnalysis.spendingInsights.averageTransactionAmount}
                />

                {/* Details Toggle */}
                <TouchableOpacity
                  style={styles.detailsToggle}
                  onPress={() => setIsExpanded(!isExpanded)}
                >
                  <Text style={styles.toggleText}>
                    {isExpanded ? 'Got it, hide details' : 'View Details'}
                  </Text>
                  <MaterialIcons
                    name={isExpanded ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={DESIGN_SYSTEM.colors.neutral[600]}
                  />
                </TouchableOpacity>

                {/* Expandable Details */}
                {isExpanded && (
                  <Animated.View
                    style={[
                      styles.expandedDetails,
                      {
                        opacity: nudgeAnimation,
                        transform: [
                          {
                            translateY: nudgeAnimation.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            }),
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.spendingContext}>
                      <View style={styles.contextHeader}>
                        <MaterialIcons
                          name="insights"
                          size={18}
                          color={DESIGN_SYSTEM.colors.primary[500]}
                        />
                        <Text style={styles.contextTitle}>Your spending story</Text>
                      </View>

                      {/* Context Metrics */}
                      <View style={styles.contextMetrics}>
                        <View style={styles.contextMetric}>
                          <Text style={styles.contextLabel}>This month so far</Text>
                          <Text style={styles.contextValue}>
                            ₹{paymentAnalysis.spendingInsights.currentMonthSpent.toLocaleString()}
                          </Text>
                        </View>

                        {paymentAnalysis.spendingInsights.averageTransactionAmount > 0 && (
                          <View style={styles.contextMetric}>
                            <Text style={styles.contextLabel}>You usually send to this person</Text>
                            <Text style={styles.contextValue}>
                              ₹
                              {Math.round(
                                paymentAnalysis.spendingInsights.averageTransactionAmount,
                              ).toLocaleString()}
                            </Text>
                          </View>
                        )}

                        <View style={styles.contextMetric}>
                          <Text style={styles.contextLabel}>Your last payment here was</Text>
                          <Text style={styles.contextValue}>
                            {paymentAnalysis.spendingInsights.lastTransactionDays === 0
                              ? 'Earlier today'
                              : paymentAnalysis.spendingInsights.lastTransactionDays === 1
                              ? 'Yesterday'
                              : `${paymentAnalysis.spendingInsights.lastTransactionDays} days ago`}
                          </Text>
                        </View>
                      </View>

                      {/* All Insights */}
                      {paymentAnalysis.aiNudges.length > 1 && (
                        <View style={styles.allInsightsSection}>
                          <Text style={styles.insightsHeader}>A few more things I noticed</Text>
                          {paymentAnalysis.aiNudges.map((nudge, index) => (
                            <View key={`${nudge.id}-${index}`} style={styles.insightItem}>
                              <Text style={styles.insightItemIcon}>{nudge.icon}</Text>
                              <Text style={styles.insightItemText}>{nudge.message}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </ScrollView>

          {/* Fixed Bottom Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                ctaMeta.variant === 'warning-outline' && styles.confirmButtonWarning,
                ctaMeta.variant === 'destructive-outline' && styles.confirmButtonDestructive,
                !isValidAmount && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!isValidAmount || isPaymentInProgress}
            >
              {isPaymentInProgress ? (
                <ActivityIndicator
                  size="small"
                  color={ctaMeta.variant === 'primary' ? 'white' : '#111827'}
                />
              ) : (
                <MaterialIcons
                  name="arrow-forward"
                  size={20}
                  color={ctaMeta.variant === 'primary' ? 'white' : '#111827'}
                />
              )}
              <Text
                style={[
                  styles.confirmButtonText,
                  ctaMeta.variant !== 'primary' && { color: '#111827' },
                ]}
              >
                {isPaymentInProgress ? 'Processing...' : ctaMeta.label}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Payment Overlay - Appears above the amount modal */}
        {paymentFlowState.status !== 'idle' && paymentFlowState.status !== 'completed' && (
          <PaymentOverlay
            visible={true}
            paymentStatus={paymentFlowState.status}
            paymentStatusMessage={paymentFlowState.message}
            paymentTimer={paymentTimer}
            spinValue={spinValue}
            collectionLinks={paymentFlowState.collectionLinks}
            onUpiAppSelection={selectUpiApp}
            onReset={resetPaymentFlow}
          />
        )}

        {/* Receipt View - Shows after successful payment */}
        {showReceipt && (
          <ReceiptView
            visible={showReceipt}
            amount={amount}
            recipientName={recipientName}
            recipientVpa={recipientVpa}
            onShare={() => {
              // TODO: Implement receipt sharing
              console.log('Share receipt');
            }}
            onClose={() => {
              setShowReceipt(false);
              onClose();
            }}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    top: screenHeight * 0.1,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.neutral[200],
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 100,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.light.text,
  },
  headerRight: {
    width: 32,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContentContainer: {
    paddingBottom: 100, // Extra padding at bottom for scroll clearance
    flexGrow: 1,
    minHeight: '100%', // Ensure content can be scrolled even if short
  },
  recipientInfo: {
    marginTop: 10,
    marginBottom: 24,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_SYSTEM.colors.primary[50],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.primary[200],
  },
  recipientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipientInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  recipientDetails: {
    marginLeft: 12,
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.light.text,
    marginBottom: 2,
  },
  recipientVpa: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.neutral[600],
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  amountInputWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    // Dynamic width and height will be applied via inline styles
  },
  compassRingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    // Dynamic width and height will be applied via inline styles
  },
  compassRingSvg: {
    position: 'absolute',
  },
  needleWrapper: {
    position: 'absolute',
    top: 98, // Center of 200px container minus half needle height
    left: 98, // Center of 200px container minus half needle width
    width: 4,
    height: 75,
    ...(Platform.OS === 'web' ? { transformOrigin: 'center bottom' } : {}),
  } as ViewStyle,
  needlePointer: {
    width: 3,
    height: 75,
    backgroundColor: '#1F2937',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align to bottom
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0, // Position at bottom of the semicircle
    alignSelf: 'center', // Center the container instead of spanning full width
    paddingBottom: 10, // Small padding from the very bottom
    // Remove left: 0, right: 0 to avoid blocking scroll gestures
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    color: DESIGN_SYSTEM.colors.neutral[400],
    marginRight: 4, // Consistent small gap
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '300',
    color: DESIGN_SYSTEM.colors.light.text,
    // Remove minWidth to allow natural sizing
    maxWidth: 250,
    textAlign: 'left', // Align left so text starts immediately after currency
    paddingHorizontal: 0, // Remove any internal padding
    margin: 0, // Remove any margins
  },
  amountWords: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.neutral[500],
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.neutral[200],
    backgroundColor: 'white',
  },
  confirmButton: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[600],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: DESIGN_SYSTEM.colors.neutral[300],
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonWarning: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  confirmButtonDestructive: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#EF4444',
  },

  // Smart Payment Compass Styles
  paymentCompass: {
    // marginTop: 24,
    marginBottom: 16,
    backgroundColor: 'white',
    // borderRadius: 16,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 4,
  },
  compassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  compassTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DESIGN_SYSTEM.colors.primary[700],
  },
  expandButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: DESIGN_SYSTEM.colors.primary[100],
  },
  primaryInsightCard: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[50],
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.primary[200],
  },
  dominantMessage: {
    marginBottom: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageIcon: {
    fontSize: 24,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: DESIGN_SYSTEM.colors.light.text,
    lineHeight: 22,
  },
  budgetProgress: {
    alignItems: 'center',
    gap: 12,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.neutral[600],
    textAlign: 'center',
    fontWeight: '500',
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 0,
    marginHorizontal: 0,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    // height: 44,
    // backgroundColor: DESIGN_SYSTEM.colors.neutral[50],
  },
  toggleText: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.neutral[700],
    fontWeight: '500',
  },
  expandedDetails: {
    marginTop: 8,
  },
  spendingContext: {
    padding: 16,
    margin: 16,
    backgroundColor: DESIGN_SYSTEM.colors.light.surface,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.light.text,
  },
  contextMetrics: {
    gap: 12,
  },
  contextMetric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 14,
    color: DESIGN_SYSTEM.colors.neutral[600],
  },
  contextValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.light.text,
  },
  allInsightsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  insightsHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.light.text,
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
    paddingVertical: 4,
  },
  insightItemIcon: {
    fontSize: 18,
  },
  insightItemText: {
    fontSize: 13,
    color: DESIGN_SYSTEM.colors.neutral[700],
    flex: 1,
    lineHeight: 18,
  },

  // Compass styles
  compassContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  compassSvg: {
    transform: [{ rotate: '0deg' }],
  },
  needleContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needle: {
    position: 'absolute',
    width: 3,
    height: 70,
    backgroundColor: '#374151',
    borderRadius: 2,
    ...(Platform.OS === 'web' ? { transformOrigin: 'center bottom' } : {}),
    bottom: 100, // Half of container height
  } as ViewStyle,
  centerAmount: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerAmountText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },

  // Status Cards styles
  statusCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statusCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  statusCardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },

  // Warning Card styles
  warningCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  proceedButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Nudge Banner & Chips
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 0,
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  nudgeIcon: { fontSize: 16 },
  nudgeText: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  chipsContainer: {
    marginHorizontal: 0,
    marginBottom: 8,
    gap: 8,
  },
  firstRow: {
    flexDirection: 'row',
    gap: 10,
  },
  spentChip: {
    flex: 2,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  remainingChip: {
    flex: 1,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  secondRow: {
    flexDirection: 'row',
  },
  similarSpendChip: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 18,
  },
  chipAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  combinedChip: {
    flex: 2, // Takes more space than single chip
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    overflow: 'hidden',
  },
  halfChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chipDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipLabel: { fontSize: 11, color: '#6B7280' },
  chipValue: { fontSize: 15, fontWeight: '700', color: '#111827', marginTop: 2 },

  // Circle Gauge styles
  gaugeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Payment Details Section styles
  paymentDetailsSection: {
    marginTop: 16,
    gap: 12,
    alignItems: 'center',
  },

  // Cap/Tag styles
  capTagContainer: {
    alignItems: 'center',
  },
  capTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  capTagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  capTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  capTagPercentage: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Combined Notes Row styles
  notesRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    maxWidth: 320,
    alignItems: 'flex-start',
  },

  // Text Note styles
  textNoteContainer: {
    width: 210, // 2/3 of available space by default
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    minHeight: 40,
  },
  textNoteContainerFocused: {
    // Keep same width to prevent layout changes that cause keyboard to disappear
    borderColor: DESIGN_SYSTEM.colors.primary[300],
    backgroundColor: '#FEFEFE',
    shadowColor: DESIGN_SYSTEM.colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  textNoteInput: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
    minHeight: 18,
    maxHeight: 50,
    paddingVertical: 0,
  },

  // Voice Note Container
  voiceNoteContainer: {
    width: 100, // 1/3 of available space by default
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  voiceNoteContainerCompact: {
    // Keep same width to prevent layout changes
    width: 100,
  },

  // Voice Note Playback styles
  voiceNotePlayback: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    width: '100%',
  },
  voiceNotePlaybackCompact: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
  },
  playButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceWaveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    height: 16,
  },
  waveBar: {
    width: 2,
    backgroundColor: DESIGN_SYSTEM.colors.primary[400],
    borderRadius: 1,
    opacity: 0.7,
  },
  deleteVoiceButton: {
    padding: 2,
    borderRadius: 8,
  },

  // Voice Recording styles
  voiceRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    width: '100%',
    minHeight: 40,
  },
  voiceRecordButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  recordingTimer: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Old Note Input styles (keeping for backward compatibility)
  noteInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    maxWidth: 280,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    minHeight: 20,
    maxHeight: 60,
  },

  // Old Voice Note styles (keeping for backward compatibility)
  voiceNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    width: '100%',
    maxWidth: 280,
  },
  voiceNoteButtonRecording: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  voiceNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  voiceNoteTextRecording: {
    color: '#EF4444',
    fontWeight: '500',
  },
  clearVoiceButton: {
    padding: 2,
  },
});
