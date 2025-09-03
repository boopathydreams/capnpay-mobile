import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '../constants/DesignSystem';
import { ModernCard } from './ModernUI';

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

interface SmartAmountCardProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  vpa?: string;
  payeeName?: string;
  onAnalysisUpdate?: (analysis: PaymentAnalysis | null) => void;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.114:3000';

export default function SmartAmountCard({
  amount,
  onAmountChange,
  vpa,
  payeeName,
  onAnalysisUpdate,
}: SmartAmountCardProps) {
  const [analysis, setAnalysis] = useState<PaymentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<number | null>(null);

  // Debounced analysis call
  const analyzePayment = async (amountValue: number) => {
    if (!vpa || !payeeName || amountValue <= 0) {
      setAnalysis(null);
      onAnalysisUpdate?.(null);
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`${API_URL}/pay-intents/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountValue,
          vpa,
          payeeName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
        onAnalysisUpdate?.(data);
      }
    } catch (error) {
      console.error('Payment analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounced effect for amount changes
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const amountValue = parseFloat(amount) || 0;
    if (amountValue > 0 && vpa && payeeName) {
      const timer = setTimeout(() => {
        analyzePayment(amountValue);
      }, 800); // 800ms debounce
      setDebounceTimer(timer);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [amount, vpa, payeeName]);

  const getCapsStatusColor = (status: string) => {
    switch (status) {
      case 'over':
        return DESIGN_SYSTEM.status.over;
      case 'near':
        return DESIGN_SYSTEM.status.near;
      default:
        return DESIGN_SYSTEM.status.ok;
    }
  };

  const getCapsStatusIcon = (status: string) => {
    switch (status) {
      case 'over':
        return '🚨';
      case 'near':
        return '⚠️';
      default:
        return '✅';
    }
  };

  return (
    <ModernCard
      style={{
        marginBottom: DESIGN_SYSTEM.spacing.sm, // Reduced from md
        ...DESIGN_SYSTEM.shadows.none,

        //   backgroundColor: DESIGN_SYSTEM.colors.light.surface,
        //   borderWidth: 2,
        //   borderColor: DESIGN_SYSTEM.colors.primary[100],
      }}
    >
      {/* Main Amount Input - More Compact */}
      <View style={{ alignItems: 'center', marginBottom: DESIGN_SYSTEM.spacing.md }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: DESIGN_SYSTEM.spacing.xs,
          }}
        >
          <MaterialIcons
            name="account-balance-wallet"
            size={18} // Reduced from 20
            color={DESIGN_SYSTEM.colors.primary[500]}
          />
          <Text
            style={{
              fontSize: DESIGN_SYSTEM.typography.bodyMedium.fontSize,
              color: DESIGN_SYSTEM.colors.primary[600],
              marginLeft: DESIGN_SYSTEM.spacing.xs,
              fontWeight: '600',
            }}
          >
            Enter Amount
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: DESIGN_SYSTEM.colors.primary[50],
            borderRadius: DESIGN_SYSTEM.borderRadius.xl,
            paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
            paddingVertical: DESIGN_SYSTEM.spacing.md,
            borderWidth: 2,
            borderColor: amount
              ? DESIGN_SYSTEM.colors.primary[200]
              : DESIGN_SYSTEM.colors.neutral[200],
          }}
        >
          <Text
            style={{
              fontSize: 40,
              fontWeight: '800',
              color: DESIGN_SYSTEM.colors.primary[600],
              marginRight: DESIGN_SYSTEM.spacing.sm,
            }}
          >
            ₹
          </Text>
          <TextInput
            style={{
              fontSize: 40,
              fontWeight: '800',
              color: DESIGN_SYSTEM.colors.primary[600],
              minWidth: 120,
              textAlign: 'left',
              flex: 1,
            }}
            value={amount}
            onChangeText={onAmountChange}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={DESIGN_SYSTEM.colors.primary[300]}
          />
          {isAnalyzing && (
            <ActivityIndicator
              size="small"
              color={DESIGN_SYSTEM.colors.primary[500]}
              style={{ marginLeft: DESIGN_SYSTEM.spacing.xs }}
            />
          )}
        </View>
      </View>

      {/* AI Analysis Section - Compact */}
      {analysis && (
        <View>
          {/* Compact Summary Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: DESIGN_SYSTEM.spacing.sm,
              paddingVertical: DESIGN_SYSTEM.spacing.sm,
              paddingHorizontal: DESIGN_SYSTEM.spacing.md,
              backgroundColor: DESIGN_SYSTEM.colors.primary[50],
              borderRadius: DESIGN_SYSTEM.borderRadius.md,
              borderLeftWidth: 3,
              borderLeftColor:
                analysis.suggestedTag?.category.color || DESIGN_SYSTEM.colors.primary[500],
            }}
          >
            {/* Left: AI Tag */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons
                name="auto-awesome"
                size={16}
                color={DESIGN_SYSTEM.colors.primary[500]}
                style={{ marginRight: DESIGN_SYSTEM.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
                  color: DESIGN_SYSTEM.colors.light.text,
                  fontWeight: '600',
                }}
              >
                {analysis.suggestedTag?.tagText || 'General'}
              </Text>
            </View>

            {/* Center: Caps Status */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginHorizontal: DESIGN_SYSTEM.spacing.md,
              }}
            >
              <Text style={{ fontSize: 12, marginRight: 4 }}>
                {getCapsStatusIcon(analysis.caps.status)}
              </Text>
              <Text
                style={{
                  fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                  color: getCapsStatusColor(analysis.caps.status),
                  fontWeight: '600',
                }}
              >
                {analysis.caps.percentUsed}%
              </Text>
            </View>

            {/* Right: Expand/Collapse */}
            <TouchableOpacity
              onPress={() => setIsExpanded(!isExpanded)}
              style={{
                padding: DESIGN_SYSTEM.spacing.xs,
                borderRadius: DESIGN_SYSTEM.borderRadius.sm,
                backgroundColor: DESIGN_SYSTEM.colors.primary[100],
              }}
            >
              <MaterialIcons
                name={isExpanded ? 'expand-less' : 'expand-more'}
                size={16}
                color={DESIGN_SYSTEM.colors.primary[600]}
              />
            </TouchableOpacity>
          </View>

          {/* Critical Nudges Only (High Priority) */}
          {analysis.aiNudges
            .filter((nudge) => nudge.severity === 'high' || nudge.type === 'warning')
            .slice(0, 1) // Show only most critical
            .map((nudge) => (
              <View
                key={nudge.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: nudge.color + '20',
                  borderRadius: DESIGN_SYSTEM.borderRadius.sm,
                  padding: DESIGN_SYSTEM.spacing.sm,
                  marginBottom: DESIGN_SYSTEM.spacing.xs,
                  borderLeftWidth: 3,
                  borderLeftColor: nudge.color,
                }}
              >
                <Text
                  style={{
                    marginRight: DESIGN_SYSTEM.spacing.xs,
                    fontSize: 14,
                  }}
                >
                  {nudge.icon}
                </Text>
                <Text
                  style={{
                    fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
                    color: DESIGN_SYSTEM.colors.light.text,
                    flex: 1,
                    fontWeight: '500',
                  }}
                >
                  {nudge.message}
                </Text>
              </View>
            ))}

          {/* Expanded Details - Only show when expanded */}
          {isExpanded && (
            <View
              style={{
                marginTop: DESIGN_SYSTEM.spacing.sm,
                padding: DESIGN_SYSTEM.spacing.md,
                backgroundColor: DESIGN_SYSTEM.colors.light.surfaceSecondary,
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
              }}
            >
              {/* All Nudges */}
              {analysis.aiNudges.map((nudge) => (
                <View
                  key={nudge.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: nudge.color + '15',
                    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
                    padding: DESIGN_SYSTEM.spacing.sm,
                    marginBottom: DESIGN_SYSTEM.spacing.xs,
                  }}
                >
                  <Text
                    style={{
                      marginRight: DESIGN_SYSTEM.spacing.xs,
                      fontSize: 16,
                    }}
                  >
                    {nudge.icon}
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
                      color: DESIGN_SYSTEM.colors.light.text,
                      flex: 1,
                    }}
                  >
                    {nudge.message}
                  </Text>
                </View>
              ))}

              {/* Spending Insights */}
              <View
                style={{
                  marginTop: DESIGN_SYSTEM.spacing.sm,
                  paddingTop: DESIGN_SYSTEM.spacing.sm,
                  borderTopWidth: 1,
                  borderTopColor: DESIGN_SYSTEM.colors.neutral[200],
                }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: DESIGN_SYSTEM.spacing.sm,
                  }}
                >
                  <MaterialIcons
                    name="insights"
                    size={16}
                    color={DESIGN_SYSTEM.colors.primary[500]}
                    style={{ marginRight: DESIGN_SYSTEM.spacing.xs }}
                  />
                  <Text
                    style={{
                      fontSize: DESIGN_SYSTEM.typography.bodyMedium.fontSize,
                      fontWeight: '600',
                      color: DESIGN_SYSTEM.colors.light.text,
                    }}
                  >
                    Spending Insights
                  </Text>
                </View>

                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}
                >
                  <Text
                    style={{
                      fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                      color: DESIGN_SYSTEM.colors.light.textSecondary,
                    }}
                  >
                    Monthly spend
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                      color: DESIGN_SYSTEM.colors.light.text,
                      fontWeight: '600',
                    }}
                  >
                    ₹{analysis.spendingInsights.currentMonthSpent.toLocaleString()}
                  </Text>
                </View>

                {analysis.spendingInsights.averageTransactionAmount > 0 && (
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                        color: DESIGN_SYSTEM.colors.light.textSecondary,
                      }}
                    >
                      Avg to this payee
                    </Text>
                    <Text
                      style={{
                        fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                        color: DESIGN_SYSTEM.colors.light.text,
                        fontWeight: '600',
                      }}
                    >
                      ₹
                      {Math.round(
                        analysis.spendingInsights.averageTransactionAmount,
                      ).toLocaleString()}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                      color: DESIGN_SYSTEM.colors.light.textSecondary,
                    }}
                  >
                    Last payment
                  </Text>
                  <Text
                    style={{
                      fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                      color: DESIGN_SYSTEM.colors.light.text,
                      fontWeight: '600',
                    }}
                  >
                    {analysis.spendingInsights.lastTransactionDays === 0
                      ? 'Today'
                      : analysis.spendingInsights.lastTransactionDays === 1
                        ? 'Yesterday'
                        : `${analysis.spendingInsights.lastTransactionDays} days ago`}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      )}
    </ModernCard>
  );
}
