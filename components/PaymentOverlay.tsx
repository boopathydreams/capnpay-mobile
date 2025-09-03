import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated, Alert, Linking } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

interface PaymentOverlayProps {
  visible: boolean;
  paymentStatus:
    | 'idle'
    | 'validating'
    | 'creating_collection'
    | 'selecting_app'
    | 'waiting_payment'
    | 'waiting_in_app'
    | 'processing_payout'
    | 'completed'
    | 'failed';
  paymentStatusMessage: string;
  paymentTimer: number;
  spinValue: Animated.Value;
  collectionLinks: any;
  onUpiAppSelection: (appName: string) => void;
  onReset: () => void;
}

export default function PaymentOverlay({
  visible,
  paymentStatus,
  paymentStatusMessage,
  paymentTimer,
  spinValue,
  collectionLinks,
  onUpiAppSelection,
  onReset,
}: PaymentOverlayProps) {
  if (!visible) return null;

  const handleUpiAppSelection = (appName: string) => {
    console.log(`🎯 PaymentOverlay: Selected UPI app: ${appName}`);

    // Map app display name to URI key
    let uriKey = '';
    switch (appName) {
      case 'Google Pay':
        uriKey = 'gpay_uri';
        break;
      case 'PhonePe':
        uriKey = 'phonepe_uri';
        break;
      case 'Paytm':
        uriKey = 'paytm_uri';
        break;
      default:
        uriKey = 'common_uri';
    }

    // Get the UPI URI
    const upiUri = collectionLinks?.upi_uris?.[uriKey];
    if (!upiUri) {
      Alert.alert('Error', `Could not find UPI link for ${appName}`);
      return;
    }

    // Call parent handler first to update states
    onUpiAppSelection(appName);

    // Open the UPI app
    Linking.openURL(upiUri as string).catch(() => {
      Alert.alert('Error', `Could not open ${appName}. Please install the app.`);
      // Reset if app couldn't open
      onReset();
    });
  };

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
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: 'white',
          padding: 32,
          borderRadius: DESIGN_SYSTEM.borderRadius.lg,
          alignItems: 'center',
          maxWidth: '85%',
          minWidth: 280,
        }}
      >
        <>
          <View style={{ flexDirection: 'row', marginBottom: 24, width: '100%' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: ['waiting_in_app', 'processing_payout', 'completed'].includes(
                    paymentStatus,
                  )
                    ? DESIGN_SYSTEM.colors.success[500]
                    : DESIGN_SYSTEM.colors.primary[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons
                  name={
                    ['waiting_in_app', 'processing_payout', 'completed'].includes(paymentStatus)
                      ? 'check'
                      : 'payment'
                  }
                  size={18}
                  color="white"
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  textAlign: 'center',
                  color: ['waiting_in_app', 'processing_payout', 'completed'].includes(
                    paymentStatus,
                  )
                    ? DESIGN_SYSTEM.colors.success[600]
                    : DESIGN_SYSTEM.colors.primary[600],
                  fontWeight: '600',
                }}
              >
                Collection
              </Text>
            </View>

            <View
              style={{
                width: 40,
                height: 2,
                backgroundColor: ['processing_payout', 'completed'].includes(paymentStatus)
                  ? DESIGN_SYSTEM.colors.success[500]
                  : DESIGN_SYSTEM.colors.neutral[300],
                alignSelf: 'center',
                marginHorizontal: 8,
              }}
            />

            <View style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor:
                    paymentStatus === 'completed'
                      ? DESIGN_SYSTEM.colors.success[500]
                      : paymentStatus === 'processing_payout'
                      ? DESIGN_SYSTEM.colors.primary[500]
                      : DESIGN_SYSTEM.colors.neutral[300],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons
                  name={
                    paymentStatus === 'completed'
                      ? 'check'
                      : paymentStatus === 'processing_payout'
                      ? 'send'
                      : 'schedule'
                  }
                  size={18}
                  color="white"
                />
              </View>
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 4,
                  textAlign: 'center',
                  color:
                    paymentStatus === 'completed'
                      ? DESIGN_SYSTEM.colors.success[600]
                      : paymentStatus === 'processing_payout'
                      ? DESIGN_SYSTEM.colors.primary[600]
                      : DESIGN_SYSTEM.colors.neutral[500],
                  fontWeight: '600',
                }}
              >
                Recipient
              </Text>
            </View>
          </View>
          {paymentStatus === 'selecting_app' ? (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                Choose UPI App
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  color: DESIGN_SYSTEM.colors.light.textSecondary,
                  textAlign: 'center',
                  marginBottom: 24,
                }}
              >
                Select your preferred UPI app to complete payment
              </Text>

              <View style={{ width: '100%', flexDirection: 'row' }} className="space-x-3">
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderWidth: 1,
                    borderColor: DESIGN_SYSTEM.colors.neutral[300],
                    borderRadius: DESIGN_SYSTEM.borderRadius.md,
                    marginBottom: 12,
                    backgroundColor: 'white',
                  }}
                  onPress={() => handleUpiAppSelection('Google Pay')}
                >
                  <Image
                    source={require('../assets/images/payment_icons/google-pay/icons8-google-pay-48.png')}
                    style={{ width: 32, height: 32 }}
                  />
                  <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>Google Pay</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderWidth: 1,
                    borderColor: DESIGN_SYSTEM.colors.neutral[300],
                    borderRadius: DESIGN_SYSTEM.borderRadius.md,
                    marginBottom: 12,
                    backgroundColor: 'white',
                  }}
                  onPress={() => handleUpiAppSelection('PhonePe')}
                >
                  <Image
                    source={require('../assets/images/payment_icons/phone-pe/icons8-phone-pe-48.png')}
                    style={{ width: 32, height: 32 }}
                  />
                  <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>PhonePe</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderWidth: 1,
                    borderColor: DESIGN_SYSTEM.colors.neutral[300],
                    borderRadius: DESIGN_SYSTEM.borderRadius.md,
                    marginBottom: 12,
                    backgroundColor: 'white',
                  }}
                  onPress={() => handleUpiAppSelection('Paytm')}
                >
                  <Image
                    source={require('../assets/images/payment_icons/paytm/icons8-paytm-48.png')}
                    style={{ width: 32, height: 32 }}
                  />
                  <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>Paytm</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
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
                marginBottom: 16,
              }}
            >
              <MaterialIcons
                name={
                  paymentStatus === 'completed'
                    ? 'check-circle'
                    : paymentStatus === 'failed'
                    ? 'error'
                    : 'sync'
                }
                size={48}
                color={
                  paymentStatus === 'completed'
                    ? DESIGN_SYSTEM.colors.success[500]
                    : paymentStatus === 'failed'
                    ? DESIGN_SYSTEM.colors.error[500]
                    : DESIGN_SYSTEM.colors.primary[500]
                }
              />
            </Animated.View>
          )}
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            {paymentStatus === 'validating' && 'Validating Payment'}
            {paymentStatus === 'creating_collection' && 'Setting up Payment'}
            {paymentStatus === 'waiting_in_app' && 'Waiting for Payment'}
            {paymentStatus === 'processing_payout' && 'Processing Transfer'}
            {paymentStatus === 'completed' && 'Payment Successful!'}
            {paymentStatus === 'failed' && 'Payment Failed'}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: DESIGN_SYSTEM.colors.light.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
            }}
          >
            {paymentStatusMessage}
            {paymentStatus === 'waiting_in_app' && paymentTimer > 0 && (
              <Text style={{ fontWeight: '600', color: DESIGN_SYSTEM.colors.warning[600] }}>
                {'\n'}Time remaining: {Math.floor(paymentTimer / 60)}:
                {(paymentTimer % 60).toString().padStart(2, '0')}
              </Text>
            )}
          </Text>

          {paymentStatus === 'failed' && (
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingVertical: 8,
                paddingHorizontal: 16,
                backgroundColor: DESIGN_SYSTEM.colors.primary[600],
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
              }}
              onPress={onReset}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
            </TouchableOpacity>
          )}

          {paymentStatus === 'waiting_in_app' && (
            <TouchableOpacity
              style={{
                marginTop: 16,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: DESIGN_SYSTEM.colors.neutral[300],
                borderRadius: DESIGN_SYSTEM.borderRadius.md,
              }}
              onPress={onReset}
            >
              <Text
                style={{
                  color: DESIGN_SYSTEM.colors.light.textSecondary,
                  fontWeight: '600',
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </>
      </View>
    </View>
  );
}
