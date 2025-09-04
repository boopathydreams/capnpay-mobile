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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

// Mock data for comprehensive testing
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
      message: "You're 80% through your food budget this month",
      action: 'Consider cooking at home for the next few days',
      color: '#F59E0B',
    },
    {
      id: 'nudge_02',
      type: 'info',
      severity: 'medium',
      icon: '💡',
      message: 'You typically spend ₹150 less on weekday lunches',
      action: 'Try the office canteen today?',
      color: '#3B82F6',
    },
  ],
  spendingInsights: {
    currentMonthSpent: 4200,
    averageTransactionAmount: 280,
    lastTransactionDays: 2,
    frequencyScore: 0.7,
  },
  caps: {
    status: 'near',
    percentUsed: 78,
    remainingAmount: 1100,
    details: {
      status: 'near',
      totalSpent: 15800,
      totalLimit: 20000,
      categories: [
        { id: 'food_01', name: 'Food & Dining', spent: 4200, limit: 5000, utilizationPct: 84 },
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
  onConfirm: (amount: string) => void;
  recipientName?: string;
  recipientVpa?: string;
  isLoading?: boolean;
  analysis?: PaymentAnalysis;
}

export const AmountModal: React.FC<AmountModalProps> = ({
  visible,
  onClose,
  amount,
  onAmountChange,
  onConfirm,
  recipientName = 'Someone',
  recipientVpa = '',
  isLoading = false,
  analysis,
}) => {
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const [paymentAnalysis, setPaymentAnalysis] = useState<PaymentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Animation refs for Smart Payment Compass
  const compassRotation = useRef(new Animated.Value(0)).current;
  const compassScale = useRef(new Animated.Value(0.8)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const nudgeAnimation = useRef(new Animated.Value(0)).current;

  // API URL from environment
  const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.94:3000';

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

  const handleClose = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(onClose);
  };

  const handleConfirm = () => {
    if (amount && parseFloat(amount) > 0) {
      onConfirm(amount);
    }
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
    if (num === 0) return 'zero';
    if (num < 1000) return `${num}`;
    if (num < 100000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 10000000) return `${(num / 100000).toFixed(1)} lakh`;
    return `${(num / 10000000).toFixed(1)} crore`;
  };

  const numericAmount = amount ? parseFloat(amount) : 0;
  const isValidAmount = numericAmount > 0;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
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
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                    <MaterialIcons
                      name="close"
                      size={24}
                      color={DESIGN_SYSTEM.colors.neutral[600]}
                    />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>Enter Amount</Text>
                  <View style={styles.headerRight} />
                </View>

                {/* SCROLLABLE CONTENT */}
                <ScrollView
                  style={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
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
                    <View style={styles.amountInputContainer}>
                      <Text style={styles.currencySymbol}>₹</Text>
                      <TextInput
                        style={styles.amountInput}
                        value={amount}
                        onChangeText={handleAmountChange}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={DESIGN_SYSTEM.colors.neutral[400]}
                        selectionColor={DESIGN_SYSTEM.colors.primary[500]}
                        autoFocus
                      />
                    </View>

                    {numericAmount > 0 && (
                      <Text style={styles.amountWords}>{numberToWords(numericAmount)} rupees</Text>
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
                      {/* Compass Header */}
                      <View style={styles.compassHeader}>
                        <Text style={styles.compassTitle}>🧭 Smart Payment Compass</Text>
                        <TouchableOpacity
                          onPress={() => setIsExpanded(!isExpanded)}
                          style={styles.expandButton}
                        >
                          <Animated.View
                            style={{
                              transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                            }}
                          >
                            <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
                          </Animated.View>
                        </TouchableOpacity>
                      </View>

                      {/* Primary Insight Card */}
                      <View style={styles.primaryInsightCard}>
                        {/* Critical Nudge or Status */}
                        <View style={styles.dominantMessage}>
                          <View style={styles.messageHeader}>
                            <Text style={styles.messageIcon}>⚠️</Text>
                            <Text style={[styles.messageText, { color: '#F59E0B' }]}>
                              {paymentAnalysis.aiNudges[0]?.message ||
                                "You're 78% through your budget"}
                            </Text>
                          </View>
                        </View>

                        {/* Visual Progress Indicator */}
                        <View style={styles.budgetProgress}>
                          <View style={styles.progressDots}>
                            {[...Array(5)].map((_, index) => {
                              const threshold = (index + 1) * 20;
                              const isActive = paymentAnalysis.caps.percentUsed >= threshold;
                              const isOverBudget = paymentAnalysis.caps.percentUsed > 100;

                              return (
                                <Animated.View
                                  key={index}
                                  style={[
                                    styles.progressDot,
                                    {
                                      backgroundColor: isActive
                                        ? isOverBudget
                                          ? DESIGN_SYSTEM.colors.error[500]
                                          : paymentAnalysis.caps.status === 'near'
                                          ? DESIGN_SYSTEM.colors.warning[500]
                                          : DESIGN_SYSTEM.colors.success[500]
                                        : DESIGN_SYSTEM.colors.neutral[200],
                                      transform: [
                                        {
                                          scale: progressAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                          }),
                                        },
                                      ],
                                    },
                                  ]}
                                />
                              );
                            })}
                          </View>
                          <Text style={styles.progressLabel}>
                            {paymentAnalysis.caps.percentUsed}% of{' '}
                            {paymentAnalysis.suggestedTag?.category?.name || 'budget'} used
                          </Text>
                        </View>
                      </View>

                      {/* Details Toggle */}
                      <TouchableOpacity
                        style={styles.detailsToggle}
                        onPress={() => setIsExpanded(!isExpanded)}
                      >
                        <Text style={styles.toggleText}>
                          {isExpanded ? 'Hide details' : 'Show spending context'}
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
                              <Text style={styles.contextTitle}>Spending Context</Text>
                            </View>

                            {/* Context Metrics */}
                            <View style={styles.contextMetrics}>
                              <View style={styles.contextMetric}>
                                <Text style={styles.contextLabel}>This month</Text>
                                <Text style={styles.contextValue}>
                                  ₹
                                  {paymentAnalysis.spendingInsights.currentMonthSpent.toLocaleString()}
                                </Text>
                              </View>

                              {paymentAnalysis.spendingInsights.averageTransactionAmount > 0 && (
                                <View style={styles.contextMetric}>
                                  <Text style={styles.contextLabel}>
                                    Your average to this payee
                                  </Text>
                                  <Text style={styles.contextValue}>
                                    ₹
                                    {Math.round(
                                      paymentAnalysis.spendingInsights.averageTransactionAmount,
                                    ).toLocaleString()}
                                  </Text>
                                </View>
                              )}

                              <View style={styles.contextMetric}>
                                <Text style={styles.contextLabel}>Last payment</Text>
                                <Text style={styles.contextValue}>
                                  {paymentAnalysis.spendingInsights.lastTransactionDays === 0
                                    ? 'Today'
                                    : paymentAnalysis.spendingInsights.lastTransactionDays === 1
                                    ? 'Yesterday'
                                    : `${paymentAnalysis.spendingInsights.lastTransactionDays} days ago`}
                                </Text>
                              </View>
                            </View>

                            {/* All Insights */}
                            {paymentAnalysis.aiNudges.length > 1 && (
                              <View style={styles.allInsightsSection}>
                                <Text style={styles.insightsHeader}>All Insights</Text>
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
                    style={[styles.confirmButton, !isValidAmount && styles.confirmButtonDisabled]}
                    onPress={handleConfirm}
                    disabled={!isValidAmount || isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <MaterialIcons name="arrow-forward" size={20} color="white" />
                    )}
                    <Text style={styles.confirmButtonText}>
                      {isLoading ? 'Processing...' : 'Continue'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
  recipientInfo: {
    marginTop: 20,
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
    marginBottom: 32,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 48,
    fontWeight: '300',
    color: DESIGN_SYSTEM.colors.neutral[400],
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '300',
    color: DESIGN_SYSTEM.colors.light.text,
    minWidth: 100,
    maxWidth: 250,
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

  // Smart Payment Compass Styles
  paymentCompass: {
    marginTop: 24,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    backgroundColor: DESIGN_SYSTEM.colors.neutral[50],
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
});
