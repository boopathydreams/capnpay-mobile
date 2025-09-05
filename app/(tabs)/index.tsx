import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  Image,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Link, useRouter } from 'expo-router';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import {
  ModernCard,
  StatusChip,
  ProgressBar,
  DisplayText,
  HeadingText,
  BodyText,
  CaptionText,
} from '../../components/AdvancedUI';
import { DESIGN_SYSTEM } from '../../constants/DesignSystem';
import { useDashboard } from '../../src/hooks/useDashboard';
import ScannerModal from '../../components/scanner/ScannerModal';
import { AmountModal } from '../../components/pay/AmountModal';

const { width } = Dimensions.get('window');

const quickActions = [
  { title: 'Scan &\nPay', icon: 'qr-code-scanner' },
  { title: 'Pay\nAnyone', icon: 'currency-rupee' },
  { title: 'Send to\nUPI ID', icon: 'alternate-email' },
  { title: 'Pay\nBills', icon: 'receipt-long' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { overview, insights, loading, error, refetch } = useDashboard();
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Amount modal state
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [recipientVpa, setRecipientVpa] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [isAmountLocked, setIsAmountLocked] = useState(false);

  // Handle quick action presses
  const handleQuickAction = (actionTitle: string) => {
    switch (actionTitle) {
      case 'Pay\nAnyone':
        router.push('/pay');
        break;
      case 'Scan &\nPay':
        setShowScannerModal(true);
        break;
      case 'Send to\nUPI ID':
        router.push('/pay'); // Navigate to pay tab for UPI ID entry
        break;
      case 'Pay\nBills':
        // TODO: Implement bills functionality
        console.log('Pay Bills pressed');
        break;
      default:
        console.log('Unknown action:', actionTitle);
    }
  };

  // Handle UPI detection from scanner
  const handleUpiDetected = (upiData: any) => {
    console.log('📱 UPI detected from scanner:', upiData);

    setRecipientVpa(upiData.vpa);
    setRecipientName(upiData.payeeName || 'Unknown');

    // Check if amount is present and if it's a merchant QR
    if (upiData.amount && upiData.isMerchant) {
      // Merchant QR with amount - lock the amount
      setAmount(upiData.amount);
      setIsAmountLocked(true);
      console.log('🔒 Merchant QR detected - amount locked at ₹' + upiData.amount);
    } else if (upiData.amount && !upiData.isMerchant) {
      // P2P QR with amount - prefill but allow editing
      setAmount(upiData.amount);
      setIsAmountLocked(false);
      console.log('💰 P2P QR with amount - prefilled ₹' + upiData.amount);
    } else {
      // UPI ID only - no amount
      setAmount('');
      setIsAmountLocked(false);
      console.log('🆔 UPI ID only - no amount');
    }

    setShowAmountModal(true);
  };

  // Handle amount modal close
  const handleAmountModalClose = () => {
    setShowAmountModal(false);
    setAmount('');
    setRecipientVpa('');
    setRecipientName('');
    setIsAmountLocked(false);
  };

  // Debug logging
  console.log('HomeScreen render:', {
    hasOverview: !!overview,
    loading,
    error,
    overviewKeys: overview ? Object.keys(overview) : 'null',
    hasUserData: overview ? !!overview.userData : false,
    userDataKeys: overview?.userData ? Object.keys(overview.userData) : 'null',
  });

  // Show loading state
  if (loading) {
    return (
      <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={DESIGN_SYSTEM.colors.primary[500]} />
          <Text style={{ marginTop: 16, color: DESIGN_SYSTEM.colors.light.textSecondary }}>
            Loading dashboard...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Show error state
  if (error) {
    return (
      <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialIcons name="error-outline" size={48} color={DESIGN_SYSTEM.colors.error[500]} />
          <Text
            style={{
              marginTop: 16,
              color: DESIGN_SYSTEM.colors.error[500],
              textAlign: 'center',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            Failed to load dashboard
          </Text>
          <Text
            style={{
              marginTop: 8,
              color: DESIGN_SYSTEM.colors.light.textSecondary,
              textAlign: 'center',
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={{
              marginTop: 20,
              backgroundColor: DESIGN_SYSTEM.colors.primary[500],
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  if (!overview || !overview.userData) {
    return (
      <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ marginTop: 16, color: DESIGN_SYSTEM.colors.light.textSecondary }}>
            No dashboard data available
          </Text>
          <TouchableOpacity
            onPress={refetch}
            style={{
              marginTop: 20,
              backgroundColor: DESIGN_SYSTEM.colors.primary[500],
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Load Data</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const userData = overview.userData;
  const upcomingBills = overview.upcomingBills || [];
  const capsData = (overview.capsData || []).map((cap) => ({
    ...cap,
    // Backend already provides spent and limit fields correctly
    spent: cap.spent || 0,
    limit: cap.limit || 0,
    progress: cap.progress || 0,
    status: cap.status,
  }));
  const recentActivity = (overview.recentActivity || []).map((activity) => ({
    ...activity,
    merchant: activity.payeeName,
    time: new Date(activity.date).toLocaleDateString(),
    icon:
      activity.category === 'Food'
        ? 'restaurant'
        : activity.category === 'Shopping'
        ? 'shopping-bag'
        : activity.category === 'Transport'
        ? 'directions-car'
        : 'payment',
    description: activity.category,
  }));

  const spentPercentage = (userData.totalSpent / userData.monthlyLimit) * 100;
  const projectionPercentage = spentPercentage; // Simplified for now
  const totalUpcomingBills = upcomingBills.reduce((sum: number, bill: any) => sum + bill.amount, 0);

  return (
    <ScreenWrapper style={{ backgroundColor: DESIGN_SYSTEM.colors.light.background }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header with Logo */}
        <View className="flex-row justify-between items-center px-6 py-4">
          <View className="flex-row items-center">
            <Image
              source={require('../../assets/images/logo.png')} // Update to use full logo instead of icon
              style={{
                width: 120, // Increased width for full logo
                height: 36, // Appropriate height to maintain aspect ratio
                resizeMode: 'contain', // Ensure logo fits properly
              }}
            />
          </View>

          <View className="flex-row items-center">
            <CaptionText
              style={{
                color: DESIGN_SYSTEM.colors.light.textSecondary,
                marginRight: 8,
                fontWeight: '500',
              }}
            >
              Aug 2025
            </CaptionText>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={20}
              color={DESIGN_SYSTEM.colors.light.textSecondary}
            />

            {/* Notifications */}
            <TouchableOpacity
              className="mr-4"
              onPress={() => {
                console.log('Navigate to Notifications');
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <MaterialIcons
                  name="notifications-none"
                  size={18}
                  color={DESIGN_SYSTEM.colors.neutral[600]}
                />
                {/* Notification badge */}
                <View
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: DESIGN_SYSTEM.colors.error[500],
                  }}
                />
              </View>
            </TouchableOpacity>

            {/* User Avatar & Notifications */}
            <Link href="/settings" asChild>
              <TouchableOpacity className="flex-row items-center mr-4">
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                >
                  <MaterialIcons
                    name="person"
                    size={18}
                    color={DESIGN_SYSTEM.colors.primary[600]}
                  />
                </View>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Hero Section - Progress Ring + Key Metrics */}
        <View className="px-6 mb-6">
          <ModernCard
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
              borderRadius: DESIGN_SYSTEM.borderRadius['xl'],
              padding: DESIGN_SYSTEM.spacing.md,
              borderColor: DESIGN_SYSTEM.colors.neutral[200],
              borderWidth: 1,
              // ...DESIGN_SYSTEM.shadows.lg,
            }}
          >
            <View className="flex-row items-center">
              {/* Left side - Progress Ring */}
              <View className="mr-6" style={{ alignItems: 'center' }}>
                <AnimatedCircularProgress
                  size={140}
                  width={12}
                  fill={spentPercentage}
                  tintColor={
                    spentPercentage > 90
                      ? DESIGN_SYSTEM.colors.error[500]
                      : DESIGN_SYSTEM.colors.primary[500]
                  }
                  backgroundColor={DESIGN_SYSTEM.colors.primary[200]}
                  rotation={0}
                  lineCap="round"
                >
                  {() => (
                    <View style={{ alignItems: 'center' }}>
                      <DisplayText
                        style={{
                          fontSize: 24,
                          fontWeight: '800',
                          color: DESIGN_SYSTEM.colors.primary[700],
                          textAlign: 'center',
                        }}
                      >
                        ₹{(userData.totalSpent / 1000).toFixed(1)}k
                      </DisplayText>
                      <CaptionText
                        style={{
                          color: DESIGN_SYSTEM.colors.primary[600],
                          textAlign: 'center',
                          fontWeight: '500',
                        }}
                      >
                        of ₹{userData.monthlyLimit / 1000}k
                      </CaptionText>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>

              {/* Right side - Key Metrics */}
              <View className="flex-1">
                {/* Safe to Spend Today */}
                <View
                  style={{
                    backgroundColor: DESIGN_SYSTEM.colors.success[50],
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    padding: DESIGN_SYSTEM.spacing.sm,
                    marginBottom: DESIGN_SYSTEM.spacing.xs,
                    // borderLeftWidth: 3,
                    // borderLeftColor: DESIGN_SYSTEM.colors.success[500],
                    minHeight: 60,
                  }}
                >
                  <CaptionText
                    numberOfLines={1}
                    style={{
                      color: DESIGN_SYSTEM.colors.success[600],
                      fontWeight: '600',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 2,
                    }}
                  >
                    Safe-to-spend today
                  </CaptionText>
                  <HeadingText
                    numberOfLines={1}
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.success[600],
                    }}
                  >
                    ₹{userData.safeToSpendToday.toLocaleString('en-IN')}
                  </HeadingText>
                </View>

                {/* Projected Month-End */}
                <View
                  style={{
                    backgroundColor:
                      projectionPercentage > 1
                        ? DESIGN_SYSTEM.colors.error[50]
                        : DESIGN_SYSTEM.colors.primary[100],
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    padding: DESIGN_SYSTEM.spacing.sm,
                    marginBottom: DESIGN_SYSTEM.spacing.xs,
                    marginTop: DESIGN_SYSTEM.spacing.xs,
                    // borderLeftWidth: 3,
                    // borderLeftColor: projectionPercentage > 1 ? DESIGN_SYSTEM.colors.error[500] : DESIGN_SYSTEM.colors.primary[500],
                    minHeight: 60,
                  }}
                >
                  <CaptionText
                    numberOfLines={1}
                    style={{
                      color:
                        projectionPercentage > 1
                          ? DESIGN_SYSTEM.colors.error[600]
                          : DESIGN_SYSTEM.colors.primary[600],
                      fontWeight: '600',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 2,
                    }}
                  >
                    Projected month-end
                  </CaptionText>
                  <HeadingText
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color:
                        projectionPercentage > 1
                          ? DESIGN_SYSTEM.colors.error[600]
                          : DESIGN_SYSTEM.colors.primary[600],
                    }}
                  >
                    ₹{(userData.totalSpent / 1000).toFixed(1)}k / ₹{userData.monthlyLimit / 1000}k
                  </HeadingText>
                </View>
              </View>
            </View>
          </ModernCard>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <HeadingText
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: DESIGN_SYSTEM.colors.light.text,
              marginBottom: 8,
            }}
          >
            Quick Actions
          </HeadingText>

          <ModernCard
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
              borderRadius: DESIGN_SYSTEM.borderRadius['xl'],
              padding: DESIGN_SYSTEM.spacing.md,
              borderColor: DESIGN_SYSTEM.colors.neutral[200],
              borderWidth: 1,
              // ...DESIGN_SYSTEM.shadows.lg,
            }}
          >
            <View className="flex-row justify-around">
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    alignItems: 'center',
                  }}
                  onPress={() => handleQuickAction(action.title)}
                  activeOpacity={0.7}
                >
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginBottom: 8,
                      shadowColor: DESIGN_SYSTEM.colors.primary[500],
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  >
                    <MaterialIcons name={action.icon as any} size={24} color="white" />
                  </View>
                  <CaptionText
                    style={{
                      color: DESIGN_SYSTEM.colors.light.text,
                      fontWeight: '500',
                      textAlign: 'center',
                      fontSize: 12,
                      lineHeight: 16,
                    }}
                  >
                    {action.title}
                  </CaptionText>
                </TouchableOpacity>
              ))}
            </View>
          </ModernCard>
        </View>

        {/* Your Caps */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <HeadingText
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.light.text,
              }}
            >
              Your Caps
            </HeadingText>
            <CaptionText
              style={{
                color: DESIGN_SYSTEM.colors.primary[600],
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              View All
            </CaptionText>
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              // marginHorizontal: -4
            }}
          >
            {capsData.slice(0, 4).map((cap, index) => (
              <ModernCard
                key={index}
                style={{
                  width: '48%',
                  marginBottom: 16,
                  paddingHorizontal: 4,
                  backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
                  borderRadius: DESIGN_SYSTEM.borderRadius['md'],
                  padding: DESIGN_SYSTEM.spacing.md,
                  borderColor: DESIGN_SYSTEM.colors.neutral[200],
                  borderWidth: 1,
                }}
              >
                {/* Row 1: Category Name (Left) + Status Badge (Right) */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                  }}
                >
                  <BodyText
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.light.text,
                      flex: 1,
                    }}
                  >
                    {cap.name}
                  </BodyText>

                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor:
                        cap.status === 'OVER'
                          ? DESIGN_SYSTEM.colors.error[100]
                          : cap.status === 'NEAR'
                          ? DESIGN_SYSTEM.colors.warning[100]
                          : DESIGN_SYSTEM.colors.success[100],
                    }}
                  >
                    <CaptionText
                      style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color:
                          cap.status === 'OVER'
                            ? DESIGN_SYSTEM.colors.error[600]
                            : cap.status === 'NEAR'
                            ? DESIGN_SYSTEM.colors.warning[600]
                            : DESIGN_SYSTEM.colors.success[600],
                        textTransform: 'uppercase',
                      }}
                    >
                      {cap.status === 'OVER' ? 'OVER' : cap.status === 'NEAR' ? 'NEAR' : 'OK'}
                    </CaptionText>
                  </View>
                </View>

                {/* Row 2: Progress Bar + Amount (3/4) + Icon (1/4) */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    flex: 1,
                  }}
                >
                  {/* Progress and Amount Section (3/4 width) */}
                  <View style={{ flex: 3, marginRight: 12 }}>
                    {/* Progress Bar */}
                    <View
                      style={{
                        height: 6,
                        backgroundColor: DESIGN_SYSTEM.colors.neutral[200],
                        borderRadius: 3,
                        overflow: 'hidden',
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          height: '100%',
                          width: `${Math.min(cap.progress * 100, 100)}%`,
                          backgroundColor:
                            cap.status === 'OVER'
                              ? DESIGN_SYSTEM.colors.error[500]
                              : cap.status === 'NEAR'
                              ? DESIGN_SYSTEM.colors.warning[500]
                              : DESIGN_SYSTEM.colors.success[500],
                          borderRadius: 3,
                        }}
                      />
                    </View>

                    {/* Amount */}
                    <CaptionText
                      style={{
                        color: DESIGN_SYSTEM.colors.light.textSecondary,
                        fontSize: 12,
                        fontWeight: '500',
                      }}
                    >
                      ₹{(cap.spent / 1000).toFixed(1)}k / ₹{(cap.limit / 1000).toFixed(1)}k
                    </CaptionText>
                  </View>

                  {/* Category Icon Section (1/4 width) */}
                  <View
                    style={{
                      flex: 1,
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialIcons
                        name={
                          cap.name === 'Food'
                            ? 'restaurant'
                            : cap.name === 'Shopping'
                            ? 'shopping-bag'
                            : cap.name === 'Transport'
                            ? 'directions-car'
                            : 'category'
                        }
                        size={16}
                        color={DESIGN_SYSTEM.colors.primary[600]}
                      />
                    </View>
                  </View>
                </View>
              </ModernCard>
            ))}
          </View>
        </View>

        {/* Upcoming Bills */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <HeadingText
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.light.text,
              }}
            >
              Upcoming (7 days)
            </HeadingText>
            <CaptionText
              style={{
                color: DESIGN_SYSTEM.colors.primary[600],
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              View All
            </CaptionText>
          </View>

          {/* Bills Total Card */}
          <ModernCard
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
              borderRadius: DESIGN_SYSTEM.borderRadius.xl,
              padding: DESIGN_SYSTEM.spacing.md,
              borderColor: DESIGN_SYSTEM.colors.neutral[200],
              borderWidth: 1,
              marginBottom: 16,
            }}
          >
            <View className="flex-row items-center">
              <View style={{ flex: 1, marginRight: 16 }}>
                <HeadingText
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: DESIGN_SYSTEM.colors.light.text,
                    marginBottom: 4,
                  }}
                >
                  Bills Total
                </HeadingText>
                <CaptionText
                  style={{
                    fontSize: 12,
                    color: DESIGN_SYSTEM.colors.light.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Upcoming payments in 7 days
                </CaptionText>
                <DisplayText
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    color: DESIGN_SYSTEM.colors.light.text,
                  }}
                >
                  ₹{totalUpcomingBills.toLocaleString('en-IN')}
                </DisplayText>
              </View>

              {/* Bills Icon */}
              <View
                style={{
                  width: 80,
                  height: 60,
                  borderRadius: 8,
                  backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <MaterialIcons name="payment" size={32} color={DESIGN_SYSTEM.colors.primary[600]} />
              </View>
            </View>
          </ModernCard>

          {/* Individual Bills - 2x2 Grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            {upcomingBills.slice(0, 4).map((bill, index) => (
              <View
                key={index}
                style={{
                  width: '48%',
                  marginBottom: 16,
                }}
              >
                <ModernCard
                  style={{
                    backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
                    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                    padding: 16,
                    borderColor: DESIGN_SYSTEM.colors.neutral[200],
                    borderWidth: 1,
                    height: 100,
                  }}
                >
                  {/* Row 1: Bill Icon + Name */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 8,
                      }}
                    >
                      <MaterialIcons
                        name={
                          bill.name === 'Rent'
                            ? 'home'
                            : bill.name === 'DTH'
                            ? 'tv'
                            : bill.name === 'Gym'
                            ? 'fitness-center'
                            : bill.name === 'Internet'
                            ? 'wifi'
                            : 'receipt'
                        }
                        size={16}
                        color={DESIGN_SYSTEM.colors.primary[600]}
                      />
                    </View>
                    <BodyText
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: DESIGN_SYSTEM.colors.light.text,
                        flex: 1,
                      }}
                    >
                      {bill.name}
                    </BodyText>
                  </View>

                  {/* Row 2: Amount + Days Left */}
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      flex: 1,
                    }}
                  >
                    <BodyText
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: DESIGN_SYSTEM.colors.light.text,
                      }}
                    >
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </BodyText>

                    <CaptionText
                      style={{
                        fontSize: 11,
                        color: DESIGN_SYSTEM.colors.light.textSecondary,
                        fontWeight: '500',
                      }}
                    >
                      {bill.daysLeft}d left
                    </CaptionText>
                  </View>
                </ModernCard>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6">
          <View className="flex-row justify-between items-center mb-4">
            <HeadingText
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: DESIGN_SYSTEM.colors.light.text,
              }}
            >
              Recent Activity
            </HeadingText>
            <CaptionText
              style={{
                color: DESIGN_SYSTEM.colors.primary[600],
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              View All
            </CaptionText>
          </View>

          {recentActivity.map((activity, index) => (
            <View
              key={index}
              style={{
                marginBottom: 16,
              }}
            >
              <ModernCard
                key={index}
                style={{
                  backgroundColor: DESIGN_SYSTEM.colors.light.surface,
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  padding: 16,
                  borderColor: DESIGN_SYSTEM.colors.neutral[200],
                  borderWidth: 1,
                }}
                onPress={() => console.log(`${activity.merchant} pressed`)}
              >
                <View className="flex-row items-center">
                  {/* Brand Icon Circle */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor:
                        activity.merchant === 'Zomato'
                          ? '#E23744'
                          : activity.merchant === 'Myntra'
                          ? '#FF3F6C'
                          : activity.merchant === 'Uber'
                          ? '#000000'
                          : DESIGN_SYSTEM.colors.primary[500],
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: '700',
                        fontSize: 16,
                        textTransform: 'uppercase',
                      }}
                    >
                      {activity.merchant.charAt(0)}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <BodyText
                        style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: DESIGN_SYSTEM.colors.light.text,
                        }}
                      >
                        {activity.merchant}
                      </BodyText>
                      <BodyText
                        style={{
                          fontSize: 16,
                          fontWeight: '700',
                          color: DESIGN_SYSTEM.colors.light.text,
                        }}
                      >
                        ₹{activity.amount}
                      </BodyText>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <CaptionText
                        style={{
                          color: DESIGN_SYSTEM.colors.light.textSecondary,
                          fontSize: 12,
                        }}
                      >
                        {activity.description} • {activity.time}
                      </CaptionText>
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                          backgroundColor:
                            activity.category === 'Food'
                              ? DESIGN_SYSTEM.colors.success[50]
                              : activity.category === 'Shopping'
                              ? DESIGN_SYSTEM.colors.warning[50]
                              : activity.category === 'Transport'
                              ? DESIGN_SYSTEM.colors.primary[50]
                              : DESIGN_SYSTEM.colors.neutral[100],
                        }}
                      >
                        <CaptionText
                          style={{
                            fontSize: 10,
                            fontWeight: '500',
                            color:
                              activity.category === 'Food'
                                ? DESIGN_SYSTEM.colors.success[600]
                                : activity.category === 'Shopping'
                                ? DESIGN_SYSTEM.colors.warning[600]
                                : activity.category === 'Transport'
                                ? DESIGN_SYSTEM.colors.primary[600]
                                : DESIGN_SYSTEM.colors.neutral[600],
                          }}
                        >
                          {activity.category}
                        </CaptionText>
                      </View>
                    </View>
                  </View>
                </View>
              </ModernCard>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Scanner Modal */}
      <ScannerModal
        visible={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onUpiDetected={handleUpiDetected}
      />

      {/* Amount Modal */}
      <AmountModal
        visible={showAmountModal}
        onClose={handleAmountModalClose}
        amount={amount}
        onAmountChange={isAmountLocked ? () => {} : setAmount} // Prevent editing if locked
        isAmountLocked={isAmountLocked}
        recipientName={recipientName}
        recipientVpa={recipientVpa}
        onPaymentSuccess={(referenceId) => {
          console.log('✅ Payment successful:', referenceId);
          handleAmountModalClose();
        }}
        onPaymentFailure={(error) => {
          console.log('❌ Payment failed:', error);
          // Keep modal open to allow retry
        }}
      />
    </ScreenWrapper>
  );
}
