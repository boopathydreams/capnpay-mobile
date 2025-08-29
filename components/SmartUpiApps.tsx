import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  onAppSelectionChange?: (selectedApp: string | null) => void;
}

export default function SmartUpiApps({
  apps = [],
  recommendedApp,
  onAppSelect,
  vpa,
  amount = '0',
  payeeName,
  onAppSelectionChange,
}: SmartUpiAppsProps) {
  const [selectedApp, setSelectedApp] = useState<string | null>(recommendedApp ?? null);

  // Filter and order apps: Google Pay, PhonePe, Paytm
  const majorUpiApps = [
    'com.google.android.apps.nbu.paisa.user', // Google Pay
    'com.phonepe.app', // PhonePe
    'net.one97.paytm', // Paytm
  ];

  // Handle recommended app changes - notify parent when recommended app is set
  useEffect(() => {
    if (recommendedApp && recommendedApp !== selectedApp) {
      setSelectedApp(recommendedApp);
      onAppSelectionChange?.(recommendedApp);
      console.log('Set recommended app:', recommendedApp);
    }
  }, [recommendedApp]);

  // Auto-select first app if no recommendation and apps are available
  useEffect(() => {
    if (!selectedApp && apps.length > 0 && !recommendedApp) {
      const firstMajorApp = majorUpiApps.find((packageName) =>
        apps.some((app) => app.packageName === packageName),
      );
      if (firstMajorApp) {
        setSelectedApp(firstMajorApp);
        onAppSelectionChange?.(firstMajorApp);
        console.log('Auto-selected first major app: ' + firstMajorApp);
      }
    }
  }, [apps, selectedApp, recommendedApp]);

  // Get payment app icon from local assets
  const getUpiAppIcon = (packageName: string) => {
    const iconMap = {
      'com.google.android.apps.nbu.paisa.user': require('../assets/images/payment_icons/google-pay/icons8-google-pay-48.png'),
      'com.phonepe.app': require('../assets/images/payment_icons/phone-pe/icons8-phone-pe-48.png'),
      'net.one97.paytm': require('../assets/images/payment_icons/paytm/icons8-paytm-48.png'),
    };
    return iconMap[packageName as keyof typeof iconMap];
  };

  // Get brand colors for payment apps
  const getUpiAppColors = (packageName: string) => {
    const colorMap = {
      'com.google.android.apps.nbu.paisa.user': {
        primary: '#34A853',
        light: '#E8F5E8',
        border: '#81C784',
      },
      'com.phonepe.app': {
        primary: '#5F2EEA',
        light: '#F3EAFF',
        border: '#9C7AE8',
      },
      'net.one97.paytm': {
        primary: '#00BAF2',
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

  // Memoize selectedAppData to prevent unnecessary re-renders
  const selectedAppData = useMemo(
    () => (selectedApp ? apps.find((app) => app.packageName === selectedApp) : null),
    [selectedApp], // Remove apps dependency to prevent infinite re-renders
  );

  // Memoize the apps rendering to prevent re-execution on every state change
  const renderedApps = useMemo(() => {
    console.log('Rendering apps list - this should only happen once or when apps change');

    // Filter to only major UPI apps and maintain order
    const filteredApps = majorUpiApps
      .map((packageName) => apps.find((app) => app.packageName === packageName))
      .filter(Boolean) as UpiApp[];

    return filteredApps.map((app, index) => {
      console.log('in apps.map : ' + app.packageName);
      return {
        app,
        index,
        key: `${app.packageName}-${index}`,
      };
    });
  }, [apps]);

  const handleAppSelection = (packageName: string) => {
    console.log('package in handleApp Selection: ' + packageName);
    // Use callback to avoid circular re-render issues
    setSelectedApp(packageName);
    // Notify parent component of selection change
    onAppSelectionChange?.(packageName);
  };

  const handlePayment = () => {
    if (selectedApp) {
      onAppSelect(selectedApp);
    } else if (recommendedApp) {
      onAppSelect(recommendedApp);
      onAppSelectionChange?.(recommendedApp);
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
    <View style={{ flex: 1 }}>
      {/* Main UPI Selection Content - Scrollable */}
      <View style={{ flex: 1 }}>
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

        <View
          style={{
            marginBottom: DESIGN_SYSTEM.spacing.sm, // Reduced from md
          }}
        >
          <View style={{ padding: DESIGN_SYSTEM.spacing.xs }}>
            <View
              style={{
                paddingHorizontal: DESIGN_SYSTEM.spacing.sm,
                alignItems: 'center',
              }}
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
                  {renderedApps.map(({ app, index, key }) => {
                    const isRecommended = app.packageName === recommendedApp;
                    const isSelected = app.packageName === selectedApp;
                    const isInstalled = Boolean(app.isInstalled);
                    const appColors = getUpiAppColors(app.packageName);
                    const appIcon = getUpiAppIcon(app.packageName);

                    return (
                      <TouchableOpacity
                        key={app.packageName}
                        onPress={() => handleAppSelection(app.packageName)}
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: DESIGN_SYSTEM.spacing.md,
                          borderRadius: DESIGN_SYSTEM.borderRadius.lg,
                          borderWidth: isSelected ? 3 : 2,
                          borderColor: isSelected
                            ? appColors.primary
                            : DESIGN_SYSTEM.colors.light.border,
                          backgroundColor: isSelected
                            ? appColors.light
                            : DESIGN_SYSTEM.colors.light.surface,
                          width: 90,
                          height: 100,
                          opacity: isInstalled ? 1 : 0.6,
                          shadowColor: isSelected ? appColors.primary : '#000',
                          shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
                          shadowOpacity: isSelected ? 0.25 : 0.1,
                          shadowRadius: isSelected ? 8 : 4,
                          elevation: isSelected ? 6 : 2,
                        }}
                      >
                        {/* Recommended Badge - Smaller */}
                        {isRecommended && (
                          <View
                            style={{
                              position: 'absolute',
                              top: -6, // Reduced from -8
                              backgroundColor: appColors.primary,
                              borderRadius: DESIGN_SYSTEM.borderRadius.full,
                              paddingHorizontal: DESIGN_SYSTEM.spacing.xs, // Reduced
                              paddingVertical: 2, // Reduced from 3
                              flexDirection: 'row',
                              alignItems: 'center',
                            }}
                          >
                            <MaterialIcons name="star" size={10} color="white" />
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

                        {/* Selection Indicator - Better positioned */}
                        {/* {isSelected && (
                          <View
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              backgroundColor: appColors.primary,
                              borderRadius: DESIGN_SYSTEM.borderRadius.full,
                              width: 24,
                              height: 24,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 2,
                              borderColor: 'white',
                            }}
                          >
                            <MaterialIcons name="check" size={16} color="white" />
                          </View>
                        )} */}

                        {/* App Icon - Centered and Consistent Size */}
                        <View
                          style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: DESIGN_SYSTEM.spacing.xs,
                          }}
                        >
                          {appIcon ? (
                            <Image
                              source={appIcon}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                              }}
                              resizeMode="contain"
                            />
                          ) : (
                            <View
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                backgroundColor: DESIGN_SYSTEM.colors.light.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <MaterialIcons
                                name="payment"
                                size={24}
                                color={DESIGN_SYSTEM.colors.light.textSecondary}
                              />
                            </View>
                          )}
                        </View>

                        {/* App Name - Centered */}
                        <Text
                          style={{
                            fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
                            fontWeight: '600',
                            color: isSelected ? appColors.primary : DESIGN_SYSTEM.colors.light.text,
                            textAlign: 'center',
                            marginBottom: 4,
                            maxWidth: 70,
                          }}
                          numberOfLines={1}
                        >
                          {app.name || 'App'}
                        </Text>

                        {/* Install Status - Compact */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialIcons
                            name={isInstalled ? 'check-circle' : 'cloud-download'}
                            size={12}
                            color={
                              isInstalled
                                ? DESIGN_SYSTEM.status.ok
                                : DESIGN_SYSTEM.colors.light.textTertiary
                            }
                          />
                          <Text
                            style={{
                              fontSize: 11,
                              color: isInstalled
                                ? DESIGN_SYSTEM.status.ok
                                : DESIGN_SYSTEM.colors.light.textTertiary,
                              textAlign: 'center',
                              marginLeft: 3,
                              fontWeight: '500',
                            }}
                          >
                            {isInstalled ? 'Ready' : 'Install'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
