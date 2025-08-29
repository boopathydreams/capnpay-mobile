import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '../constants/DesignSystem';
import { ModernCard } from './ModernUI';

interface UpiApp {
  name: string;
  packageName: string;
  icon: string;
  isInstalled: boolean;
}

interface SmartUpiAppsProps {
  apps: UpiApp[];
  recommendedApp?: string;
  onAppSelect: (packageName: string) => void;
  vpa?: string;
  amount?: string;
  payeeName?: string;
}

export default function SmartUpiApps({
  apps = [],
  recommendedApp,
  onAppSelect,
  vpa,
  amount = '',
  payeeName,
}: SmartUpiAppsProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const getVpaHandle = (vpa?: string) => {
    if (!vpa) return null;
    return vpa.split('@')[1];
  };

  const getHandleName = (handle?: string) => {
    const handleNames: Record<string, string> = {
      ybl: 'PhonePe',
      paytm: 'Paytm',
      okaxis: 'Google Pay',
      apl: 'Amazon Pay',
      ibl: 'PhonePe',
    };
    return handle ? handleNames[handle] || handle : null;
  };

  const handle = getVpaHandle(vpa);
  const handleName = getHandleName(handle || undefined);
  const selectedAppData = apps.find((app) => app.packageName === selectedApp);

  const handleAppSelection = (packageName: string) => {
    setSelectedApp(packageName);
  };

  const handlePayment = () => {
    if (selectedApp) {
      onAppSelect(selectedApp);
    } else if (recommendedApp) {
      onAppSelect(recommendedApp);
    }
  };

  // Safety check for apps array
  if (!apps || apps.length === 0) {
    return (
      <ModernCard
        style={{
          marginBottom: DESIGN_SYSTEM.spacing.sm,
          backgroundColor: DESIGN_SYSTEM.colors.light.surface,
          borderWidth: 2,
          borderColor: DESIGN_SYSTEM.colors.primary[100],
        }}
      >
        <View style={{ padding: DESIGN_SYSTEM.spacing.md, alignItems: 'center' }}>
          <Text
            style={{
              color: DESIGN_SYSTEM.colors.light.textSecondary,
              fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
            }}
          >
            No UPI apps available
          </Text>
        </View>
      </ModernCard>
    );
  }

  return (
    <ModernCard
      style={{
        marginBottom: DESIGN_SYSTEM.spacing.sm, // Reduced from md
        backgroundColor: DESIGN_SYSTEM.colors.light.surface,
        borderWidth: 2,
        borderColor: DESIGN_SYSTEM.colors.primary[100],
      }}
    >
      <View style={{ padding: DESIGN_SYSTEM.spacing.md }}>
        {/* Compact Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: DESIGN_SYSTEM.spacing.sm, // Reduced from md
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialIcons
              name="account-balance-wallet"
              size={18} // Reduced from 20
              color={DESIGN_SYSTEM.colors.primary[500]}
            />
            <Text
              style={{
                fontSize: DESIGN_SYSTEM.typography.bodyMedium.fontSize, // Smaller than h4
                fontWeight: '600',
                color: DESIGN_SYSTEM.colors.light.text,
                marginLeft: DESIGN_SYSTEM.spacing.xs,
              }}
            >
              Choose UPI App
            </Text>
            {handle && handleName && (
              <Text
                style={{
                  fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                  color: DESIGN_SYSTEM.colors.primary[600],
                  marginLeft: DESIGN_SYSTEM.spacing.sm,
                  fontWeight: '500',
                }}
              >
                ({handleName})
              </Text>
            )}
          </View>

          {selectedApp && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: DESIGN_SYSTEM.colors.success[50],
                paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
                paddingVertical: DESIGN_SYSTEM.spacing.xs,
                borderRadius: DESIGN_SYSTEM.borderRadius.sm,
              }}
            >
              <MaterialIcons
                name="check-circle"
                size={14}
                color={DESIGN_SYSTEM.colors.success[600]}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                  color: DESIGN_SYSTEM.colors.success[600],
                  fontWeight: '600',
                }}
              >
                Ready
              </Text>
            </View>
          )}
        </View>

        {/* Compact App Grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: DESIGN_SYSTEM.spacing.xs }}>
            {' '}
            {/* Reduced gap */}
            {apps
              .filter((app) => app && typeof app === 'object' && app.packageName)
              .map((app) => {
                const isRecommended = app.packageName === recommendedApp;
                const isSelected = app.packageName === selectedApp;
                const isInstalled = Boolean(app.isInstalled);

                return (
                  <ModernCard
                    key={app.packageName}
                    onPress={() => handleAppSelection(app.packageName)}
                    style={{
                      alignItems: 'center',
                      padding: DESIGN_SYSTEM.spacing.sm, // Reduced from md
                      borderRadius: DESIGN_SYSTEM.borderRadius.md, // Reduced from lg
                      borderWidth: 2, // Reduced from 3
                      borderColor: isSelected
                        ? DESIGN_SYSTEM.colors.primary[500]
                        : isRecommended
                          ? DESIGN_SYSTEM.colors.primary[300]
                          : DESIGN_SYSTEM.colors.light.border,
                      backgroundColor: isSelected
                        ? DESIGN_SYSTEM.colors.primary[100]
                        : isRecommended
                          ? DESIGN_SYSTEM.colors.primary[50]
                          : DESIGN_SYSTEM.colors.light.surface,
                      minWidth: 75, // Reduced from 90
                      opacity: isInstalled ? 1 : 0.6,
                      transform: isSelected ? [{ scale: 1.02 }] : [{ scale: 1 }],
                    }}
                  >
                    {/* Recommended Badge - Smaller */}
                    {isRecommended && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -6, // Reduced from -8
                          backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                          borderRadius: DESIGN_SYSTEM.borderRadius.full,
                          paddingHorizontal: DESIGN_SYSTEM.spacing.xs, // Reduced
                          paddingVertical: 2, // Reduced from 3
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <MaterialIcons name="star" size={10} color="white" /> {/* Smaller icon */}
                        <Text
                          style={{
                            fontSize: 10, // Smaller text
                            color: 'white',
                            fontWeight: '700',
                            marginLeft: 2,
                          }}
                        >
                          Best
                        </Text>
                      </View>
                    )}

                    {/* Selection Indicator - Smaller */}
                    {isSelected && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 6, // Reduced from 8
                          right: 6, // Reduced from 8
                          backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                          borderRadius: DESIGN_SYSTEM.borderRadius.full,
                          width: 20, // Reduced from 24
                          height: 20, // Reduced from 24
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialIcons name="check" size={14} color="white" /> {/* Smaller icon */}
                      </View>
                    )}

                    {/* App Icon - Smaller */}
                    <Text
                      style={{
                        fontSize: 28, // Reduced from 36
                        marginBottom: DESIGN_SYSTEM.spacing.xs, // Reduced from sm
                      }}
                    >
                      {app.icon || '📱'}
                    </Text>

                    {/* App Name - Smaller */}
                    <Text
                      style={{
                        fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize, // Reduced from bodyMedium
                        fontWeight: '600',
                        color: DESIGN_SYSTEM.colors.light.text,
                        textAlign: 'center',
                        marginBottom: 2, // Reduced from 4
                      }}
                    >
                      {app.name || 'App'}
                    </Text>

                    {/* Install Status - More Compact */}
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <MaterialIcons
                        name={isInstalled ? 'check-circle' : 'error'}
                        size={10} // Reduced from 12
                        color={
                          isInstalled
                            ? DESIGN_SYSTEM.status.ok
                            : DESIGN_SYSTEM.colors.light.textTertiary
                        }
                      />
                      <Text
                        style={{
                          fontSize: 10, // Smaller text
                          color: isInstalled
                            ? DESIGN_SYSTEM.status.ok
                            : DESIGN_SYSTEM.colors.light.textTertiary,
                          textAlign: 'center',
                          marginLeft: 2, // Reduced from 4
                          fontWeight: '500',
                        }}
                      >
                        {isInstalled ? 'Ready' : 'Install'}
                      </Text>
                    </View>
                  </ModernCard>
                );
              })}
          </View>
        </ScrollView>

        {/* Compact Payment Confirmation */}
        {selectedApp && selectedAppData && (
          <View
            style={{
              marginTop: DESIGN_SYSTEM.spacing.sm, // Reduced from lg
              backgroundColor: DESIGN_SYSTEM.colors.primary[50],
              borderRadius: DESIGN_SYSTEM.borderRadius.md, // Reduced from lg
              padding: DESIGN_SYSTEM.spacing.sm, // Reduced from md
              borderWidth: 1,
              borderColor: DESIGN_SYSTEM.colors.primary[200],
            }}
          >
            {/* Inline Payment Summary - Single Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: DESIGN_SYSTEM.spacing.sm,
                paddingHorizontal: DESIGN_SYSTEM.spacing.xs,
                paddingVertical: DESIGN_SYSTEM.spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons
                  name="receipt"
                  size={14}
                  color={DESIGN_SYSTEM.colors.primary[500]}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: DESIGN_SYSTEM.typography.caption.fontSize,
                    color: DESIGN_SYSTEM.colors.light.textSecondary,
                  }}
                >
                  Payment Summary
                </Text>
              </View>
              <MaterialIcons name="east" size={14} color={DESIGN_SYSTEM.colors.primary[500]} />
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: DESIGN_SYSTEM.colors.primary[500],
                borderRadius: DESIGN_SYSTEM.borderRadius.md, // Reduced from lg
                paddingVertical: DESIGN_SYSTEM.spacing.sm, // Reduced from md
                paddingHorizontal: DESIGN_SYSTEM.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: DESIGN_SYSTEM.colors.primary[500],
                shadowOffset: { width: 0, height: 2 }, // Reduced shadow
                shadowOpacity: 0.2, // Reduced shadow
                shadowRadius: 4, // Reduced shadow
                elevation: 4, // Reduced elevation
              }}
              onPress={handlePayment}
            >
              <MaterialIcons
                name="payment"
                size={18} // Reduced from 20
                color="white"
                style={{ marginRight: DESIGN_SYSTEM.spacing.xs }}
              />
              <Text
                style={{
                  fontSize: DESIGN_SYSTEM.typography.bodyMedium.fontSize, // Slightly smaller
                  fontWeight: '600',
                  color: 'white',
                  marginRight: DESIGN_SYSTEM.spacing.xs,
                }}
              >
                Pay ₹{amount || '0'}
              </Text>
              <MaterialIcons name="arrow-forward" size={16} color="white" /> {/* Smaller icon */}
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Pay for Recommended App - Compact */}
        {!selectedApp && recommendedApp && (
          <TouchableOpacity
            style={{
              backgroundColor: DESIGN_SYSTEM.colors.primary[500],
              borderRadius: DESIGN_SYSTEM.borderRadius.md, // Reduced from lg
              paddingVertical: DESIGN_SYSTEM.spacing.sm, // Reduced from md
              paddingHorizontal: DESIGN_SYSTEM.spacing.md,
              marginTop: DESIGN_SYSTEM.spacing.sm, // Reduced from md
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => {
              setSelectedApp(recommendedApp);
              setTimeout(() => onAppSelect(recommendedApp), 100);
            }}
          >
            <MaterialIcons
              name="flash-on"
              size={18} // Reduced from 20
              color="white"
              style={{ marginRight: DESIGN_SYSTEM.spacing.xs }}
            />
            <Text
              style={{
                fontSize: DESIGN_SYSTEM.typography.bodyMedium.fontSize, // Slightly smaller
                fontWeight: '600',
                color: 'white',
              }}
            >
              Quick Pay
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ModernCard>
  );
}
