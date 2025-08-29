import React from 'react';
import { View, ScrollView, Dimensions, Image, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import {
  ModernCard,
  StatusChip,
  ProgressBar,
  DisplayText,
  HeadingText,
  BodyText,
  CaptionText
} from '../../components/AdvancedUI';
import { DESIGN_SYSTEM } from '../../constants/DesignSystem';

const { width } = Dimensions.get('window');

// Mock data based on the fintech app design
const userData = {
  name: 'Boopathy',
  totalSpent: 18400, // MTD spend
  monthlyLimit: 25000, // Monthly cap
  safeToSpendToday: 1250,
  projectedMonthEnd: 24600,
  tagCoverage: 100,
  tagStreak: 14,
};

const upcomingBills = [
  { name: 'Rent', amount: 2000, daysLeft: 3 },
  { name: 'DTH', amount: 600, daysLeft: 5 },
  { name: 'Gym', amount: 600, daysLeft: 6 },
  { name: 'Internet', amount: 1200, daysLeft: 8 },
];

const capsData = [
  { name: 'Food', spent: 6200, limit: 8000, progress: 0.775, status: 'ok' as const },
  { name: 'Shopping', spent: 4100, limit: 5000, progress: 0.82, status: 'near' as const },
  { name: 'Transport', spent: 3200, limit: 4000, progress: 0.8, status: 'ok' as const },
  { name: 'Other', spent: 5000, limit: 4000, progress: 1.25, status: 'over' as const },
];

const recentActivity = [
  { merchant: 'Zomato', category: 'Food', amount: 480, time: 'Today 12:40', icon: 'restaurant', description: 'Eating out' },
  { merchant: 'Myntra', category: 'Shopping', amount: 1490, time: 'Yesterday 19:10', icon: 'shopping-bag', description: 'Online shopping' },
  { merchant: 'Uber', category: 'Transport', amount: 320, time: 'Tue 08:25', icon: 'directions-car', description: 'Ride booking' },
];

const quickActions = [
  { title: 'Mobile\nRecharge', icon: 'phone-android' },
  { title: 'Scan &\nPay', icon: 'qr-code-scanner' },
  { title: 'Send to\nUPI ID', icon: 'alternate-email' },
  { title: 'Pay\nBills', icon: 'receipt-long' },
];

export default function HomeScreen() {
  const spentPercentage = (userData.totalSpent / userData.monthlyLimit) * 100;
  const projectionPercentage = userData.projectedMonthEnd / userData.monthlyLimit;
  const totalUpcomingBills = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);

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
            {/* Tag Coverage Indicator */}
            <View style={{
              backgroundColor: DESIGN_SYSTEM.colors.warning[100],
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
              marginRight: 12,
              alignItems: 'center'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <MaterialIcons
                  name="local-offer"
                  size={10}
                  color={DESIGN_SYSTEM.colors.warning[600]}
                  style={{ marginRight: 4 }}
                />
                <CaptionText style={{
                  color: DESIGN_SYSTEM.colors.warning[600],
                  fontSize: 9,
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Tag Coverage • Streak
                </CaptionText>
              </View>
              <CaptionText style={{
                color: DESIGN_SYSTEM.colors.warning[600],
                fontSize: 12,
                fontWeight: '700'
              }}>
                {userData.tagCoverage}% • {userData.tagStreak}d
              </CaptionText>
            </View>

            <CaptionText style={{
              color: DESIGN_SYSTEM.colors.light.textSecondary,
              marginRight: 8,
              fontWeight: '500'
            }}>
              Aug 2025
            </CaptionText>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={20}
              color={DESIGN_SYSTEM.colors.light.textSecondary}
            />
          </View>
        </View>

        {/* Hero Section - Progress Ring + Key Metrics */}
        <View className="px-6 mb-6">
          <ModernCard style={{
            backgroundColor: DESIGN_SYSTEM.colors.primary[50],
            borderRadius: DESIGN_SYSTEM.borderRadius['2xl'],
            padding: DESIGN_SYSTEM.spacing.xl,
            borderColor: DESIGN_SYSTEM.colors.primary[200],
            borderWidth: 1,
            ...DESIGN_SYSTEM.shadows.lg,
          }}>
            <View className="flex-row items-center">
              {/* Left side - Progress Ring */}
              <View className="mr-6" style={{ alignItems: 'center' }}>
                <AnimatedCircularProgress
                  size={140}
                  width={12}
                  fill={spentPercentage}
                  tintColor={spentPercentage > 90 ? DESIGN_SYSTEM.colors.error[500] : DESIGN_SYSTEM.colors.primary[500]}
                  backgroundColor={DESIGN_SYSTEM.colors.primary[200]}
                  rotation={0}
                  lineCap="round"
                >
                  {() => (
                    <View style={{ alignItems: 'center' }}>
                      <DisplayText style={{
                        fontSize: 24,
                        fontWeight: '800',
                        color: DESIGN_SYSTEM.colors.primary[700],
                        textAlign: 'center'
                      }}>
                        ₹{(userData.totalSpent / 1000).toFixed(1)}k
                      </DisplayText>
                      <CaptionText style={{
                        color: DESIGN_SYSTEM.colors.primary[600],
                        textAlign: 'center',
                        fontWeight: '500'
                      }}>
                        of ₹{userData.monthlyLimit / 1000}k
                      </CaptionText>
                    </View>
                  )}
                </AnimatedCircularProgress>
              </View>

              {/* Right side - Key Metrics */}
              <View className="flex-1">
                {/* Safe to Spend Today */}
                <View style={{
                  backgroundColor: DESIGN_SYSTEM.colors.success[50],
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  padding: DESIGN_SYSTEM.spacing.sm,
                  marginBottom: DESIGN_SYSTEM.spacing.xs,
                  // borderLeftWidth: 3,
                  // borderLeftColor: DESIGN_SYSTEM.colors.success[500],
                  minHeight: 60
                }}>
                  <CaptionText
                    numberOfLines={1}
                    style={{
                      color: DESIGN_SYSTEM.colors.success[600],
                      fontWeight: '600',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 2
                    }}>
                    Safe-to-spend today
                  </CaptionText>
                  <HeadingText
                    numberOfLines={1}
                    style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.success[600]
                    }}>
                    ₹{userData.safeToSpendToday.toLocaleString('en-IN')}
                  </HeadingText>
                </View>

                {/* Projected Month-End */}
                <View style={{
                  backgroundColor: projectionPercentage > 1 ? DESIGN_SYSTEM.colors.error[50] : DESIGN_SYSTEM.colors.primary[100],
                  borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                  padding: DESIGN_SYSTEM.spacing.sm,
                  marginBottom: DESIGN_SYSTEM.spacing.xs,
                  marginTop: DESIGN_SYSTEM.spacing.xs,
                  // borderLeftWidth: 3,
                  // borderLeftColor: projectionPercentage > 1 ? DESIGN_SYSTEM.colors.error[500] : DESIGN_SYSTEM.colors.primary[500],
                  minHeight: 60
                }}>
                  <CaptionText
                    numberOfLines={1}
                    style={{
                      color: projectionPercentage > 1 ? DESIGN_SYSTEM.colors.error[600] : DESIGN_SYSTEM.colors.primary[600],
                      fontWeight: '600',
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 2
                    }}>
                    Projected month-end
                  </CaptionText>
                  <HeadingText
                    numberOfLines={1}
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: projectionPercentage > 1 ? DESIGN_SYSTEM.colors.error[600] : DESIGN_SYSTEM.colors.primary[600]
                    }}>
                    ₹{(userData.projectedMonthEnd / 1000).toFixed(1)}k / ₹{userData.monthlyLimit / 1000}k
                  </HeadingText>
                </View>
              </View>
            </View>
          </ModernCard>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <HeadingText style={{
            fontSize: 14,
            fontWeight: '700',
            color: DESIGN_SYSTEM.colors.light.text,
            marginBottom: 8
          }}>
            Quick Actions
          </HeadingText>

          <ModernCard style={{
            backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
            borderRadius: DESIGN_SYSTEM.borderRadius['xl'],
            padding: DESIGN_SYSTEM.spacing.md,
            borderColor: DESIGN_SYSTEM.colors.neutral[200],
            borderWidth: 1,
            // ...DESIGN_SYSTEM.shadows.lg,
          }}>


          <View className="flex-row justify-around">
            {quickActions.map((action, index) => (
              <View
                key={index}
                style={{
                  alignItems: 'center',
                }}
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
                <CaptionText style={{
                  color: DESIGN_SYSTEM.colors.light.text,
                  fontWeight: '500',
                  textAlign: 'center',
                  fontSize: 12,
                  lineHeight: 16,
                }}>
                  {action.title}
                </CaptionText>
              </View>
            ))}
          </View>
          </ModernCard>
        </View>

        {/* Your Caps */}
        <View className="px-6 mb-6">


          <View className="flex-row justify-between items-center mb-4">
            <HeadingText style={{
              fontSize: 14,
              fontWeight: '700',
              color: DESIGN_SYSTEM.colors.light.text,
            }}>
              Your Caps
            </HeadingText>
            <CaptionText style={{
              color: DESIGN_SYSTEM.colors.primary[600],
              fontWeight: '600',
              fontSize: 12
            }}>
              View All
            </CaptionText>
          </View>

          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            // marginHorizontal: -4
          }}>
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
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16
                  }}>
                    <BodyText style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.light.text,
                      flex: 1
                    }}>
                      {cap.name}
                    </BodyText>

                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      backgroundColor: cap.status === 'over'
                        ? DESIGN_SYSTEM.colors.error[100]
                        : cap.status === 'near'
                          ? DESIGN_SYSTEM.colors.warning[100]
                          : DESIGN_SYSTEM.colors.success[100],
                    }}>
                      <CaptionText style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: cap.status === 'over'
                          ? DESIGN_SYSTEM.colors.error[600]
                          : cap.status === 'near'
                            ? DESIGN_SYSTEM.colors.warning[600]
                            : DESIGN_SYSTEM.colors.success[600],
                        textTransform: 'uppercase'
                      }}>
                        {cap.status === 'over' ? 'OVER' : cap.status === 'near' ? 'NEAR' : 'OK'}
                      </CaptionText>
                    </View>
                  </View>

                  {/* Row 2: Progress Bar + Amount (3/4) + Icon (1/4) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    flex: 1
                  }}>
                    {/* Progress and Amount Section (3/4 width) */}
                    <View style={{ flex: 3, marginRight: 12 }}>
                      {/* Progress Bar */}
                      <View style={{
                        height: 6,
                        backgroundColor: DESIGN_SYSTEM.colors.neutral[200],
                        borderRadius: 3,
                        overflow: 'hidden',
                        marginBottom: 8
                      }}>
                        <View style={{
                          height: '100%',
                          width: `${Math.min(cap.progress * 100, 100)}%`,
                          backgroundColor: cap.status === 'over'
                            ? DESIGN_SYSTEM.colors.error[500]
                            : cap.status === 'near'
                              ? DESIGN_SYSTEM.colors.warning[500]
                              : DESIGN_SYSTEM.colors.success[500],
                          borderRadius: 3
                        }} />
                      </View>

                      {/* Amount */}
                      <CaptionText style={{
                        color: DESIGN_SYSTEM.colors.light.textSecondary,
                        fontSize: 12,
                        fontWeight: '500'
                      }}>
                        ₹{(cap.spent / 1000).toFixed(1)}k / ₹{(cap.limit / 1000).toFixed(1)}k
                      </CaptionText>
                    </View>

                    {/* Category Icon Section (1/4 width) */}
                    <View style={{
                      flex: 1,
                      alignItems: 'flex-end',
                      justifyContent: 'flex-end'
                    }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <MaterialIcons
                          name={
                            cap.name === 'Food' ? 'restaurant' :
                            cap.name === 'Shopping' ? 'shopping-bag' :
                            cap.name === 'Transport' ? 'directions-car' :
                            'category'
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
            <HeadingText style={{
              fontSize: 14,
              fontWeight: '700',
              color: DESIGN_SYSTEM.colors.light.text,
            }}>
              Upcoming (7 days)
            </HeadingText>
            <CaptionText style={{
              color: DESIGN_SYSTEM.colors.primary[600],
              fontWeight: '600',
              fontSize: 12
            }}>
              View All
            </CaptionText>
          </View>

          {/* Bills Total Card */}
          <ModernCard style={{
            backgroundColor: DESIGN_SYSTEM.colors.neutral[100],
            borderRadius: DESIGN_SYSTEM.borderRadius.xl,
            padding: DESIGN_SYSTEM.spacing.md,
            borderColor: DESIGN_SYSTEM.colors.neutral[200],
            borderWidth: 1,
            marginBottom: 16
          }}>
            <View className="flex-row items-center">
              <View style={{ flex: 1, marginRight: 16 }}>
                <HeadingText style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: DESIGN_SYSTEM.colors.light.text,
                  marginBottom: 4
                }}>
                  Bills Total
                </HeadingText>
                <CaptionText style={{
                  fontSize: 12,
                  color: DESIGN_SYSTEM.colors.light.textSecondary,
                  marginBottom: 8
                }}>
                  Upcoming payments in 7 days
                </CaptionText>
                <DisplayText style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: DESIGN_SYSTEM.colors.light.text
                }}>
                  ₹{totalUpcomingBills.toLocaleString('en-IN')}
                </DisplayText>
              </View>

              {/* Bills Icon */}
              <View style={{
                width: 80,
                height: 60,
                borderRadius: 8,
                backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <MaterialIcons
                  name="payment"
                  size={32}
                  color={DESIGN_SYSTEM.colors.primary[600]}
                />
              </View>
            </View>
          </ModernCard>

          {/* Individual Bills - 2x2 Grid */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}>
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
                    height: 100
                  }}
                >
                  {/* Row 1: Bill Icon + Name */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: DESIGN_SYSTEM.colors.primary[100],
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 8
                    }}>
                      <MaterialIcons
                        name={
                          bill.name === 'Rent' ? 'home' :
                          bill.name === 'DTH' ? 'tv' :
                          bill.name === 'Gym' ? 'fitness-center' :
                          bill.name === 'Internet' ? 'wifi' :
                          'receipt'
                        }
                        size={16}
                        color={DESIGN_SYSTEM.colors.primary[600]}
                      />
                    </View>
                    <BodyText style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: DESIGN_SYSTEM.colors.light.text,
                      flex: 1
                    }}>
                      {bill.name}
                    </BodyText>
                  </View>

                  {/* Row 2: Amount + Days Left */}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    flex: 1
                  }}>
                    <BodyText style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.light.text
                    }}>
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </BodyText>

                    <CaptionText style={{
                      fontSize: 11,
                      color: DESIGN_SYSTEM.colors.light.textSecondary,
                      fontWeight: '500'
                    }}>
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
            <HeadingText style={{
              fontSize: 14,
              fontWeight: '700',
              color: DESIGN_SYSTEM.colors.light.text,
            }}>
              Recent Activity
            </HeadingText>
            <CaptionText style={{
              color: DESIGN_SYSTEM.colors.primary[600],
              fontWeight: '600',
              fontSize: 12
            }}>
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
                      activity.merchant === 'Zomato' ? '#E23744' :
                      activity.merchant === 'Myntra' ? '#FF3F6C' :
                      activity.merchant === 'Uber' ? '#000000' :
                      DESIGN_SYSTEM.colors.primary[500],
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Text style={{
                    color: 'white',
                    fontWeight: '700',
                    fontSize: 16,
                    textTransform: 'uppercase'
                  }}>
                    {activity.merchant.charAt(0)}
                  </Text>
                </View>

                <View className="flex-1">
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4
                  }}>
                    <BodyText style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: DESIGN_SYSTEM.colors.light.text,
                    }}>
                      {activity.merchant}
                    </BodyText>
                    <BodyText style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: DESIGN_SYSTEM.colors.light.text,
                    }}>
                      ₹{activity.amount}
                    </BodyText>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <CaptionText style={{
                      color: DESIGN_SYSTEM.colors.light.textSecondary,
                      fontSize: 12
                    }}>
                      {activity.description} • {activity.time}
                    </CaptionText>
                    <View style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor:
                        activity.category === 'Food' ? DESIGN_SYSTEM.colors.success[50] :
                        activity.category === 'Shopping' ? DESIGN_SYSTEM.colors.warning[50] :
                        activity.category === 'Transport' ? DESIGN_SYSTEM.colors.primary[50] :
                        DESIGN_SYSTEM.colors.neutral[100]
                    }}>
                      <CaptionText style={{
                        fontSize: 10,
                        fontWeight: '500',
                        color:
                          activity.category === 'Food' ? DESIGN_SYSTEM.colors.success[600] :
                          activity.category === 'Shopping' ? DESIGN_SYSTEM.colors.warning[600] :
                          activity.category === 'Transport' ? DESIGN_SYSTEM.colors.primary[600] :
                          DESIGN_SYSTEM.colors.neutral[600]
                      }}>
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
    </ScreenWrapper>
  );
}
