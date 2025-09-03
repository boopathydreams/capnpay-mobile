import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';
import DynamicUpiApps, { UpiApp } from '@/components/DynamicUpiApps';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [vpa, setVpa] = useState('user@paytm');
  const [amount, setAmount] = useState('100');
  const [tag, setTag] = useState('Test payment');

  // Request camera permission
  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Handle barcode scanning
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    console.log('📱 QR Code scanned:', data);

    // Parse UPI QR code
    if (data.includes('upi://pay') || data.includes('upi:')) {
      try {
        const url = new URL(data.replace('upi:', 'upi://pay?'));
        const params = new URLSearchParams(url.search);

        const scannedVpa = params.get('pa');
        const scannedAmount = params.get('am');
        const scannedNote = params.get('tn');

        if (scannedVpa) {
          setVpa(scannedVpa);
          if (scannedAmount) setAmount(scannedAmount);
          if (scannedNote) setTag(scannedNote);

          Alert.alert('QR Code Scanned!', `VPA: ${scannedVpa}`, [{ text: 'OK' }]);
        }
      } catch (error) {
        console.error('QR parsing error:', error);
      }
    }
  };

  // Handle payment
  const handlePayment = async (selectedApp: UpiApp) => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      console.log('🚀 Testing merchant aggregator payment...');

      const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.114:3000';

      const paymentData = {
        vpa,
        actualRecipientVpa: vpa,
        payeeName: 'Test Recipient',
        amount: parseFloat(amount),
        transactionNote: tag,
      };

      console.log('📤 Payment request:', paymentData);

      const response = await fetch(`${API_URL}/payment-intents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Payment intent result:', result);

      // Try to launch UPI app if URL is provided
      if (result.upiUrl || result.deepLink) {
        const upiUrl = result.upiUrl || result.deepLink;
        console.log('🔗 Launching UPI app with URL:', upiUrl);

        try {
          await Linking.openURL(upiUrl);
          Alert.alert('Success!', `Payment initiated through ${selectedApp.label}`);
        } catch (linkingError) {
          console.error('Failed to open UPI app:', linkingError);
          Alert.alert('URL Generated', `Merchant URL created but couldn't open app: ${upiUrl}`);
        }
      } else {
        Alert.alert(
          'Test Success',
          `Merchant aggregator working!\nApp: ${selectedApp.label}\nAmount: ₹${amount}`,
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      console.error('❌ Payment error:', error);
      Alert.alert(
        'Error',
        `Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan QR / Test Payment</Text>
      </View>

      <ScrollView style={styles.container}>
        {/* Camera Section */}
        <View style={styles.cameraSection}>
          {permission?.granted ? (
            <CameraView style={styles.camera} onBarcodeScanned={handleBarCodeScanned}>
              <View style={styles.cameraOverlay}>
                <View style={styles.scanFrame} />
                <Text style={styles.scanText}>Point camera at UPI QR code</Text>
              </View>
            </CameraView>
          ) : (
            <View style={styles.cameraPlaceholder}>
              <Ionicons name="camera" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>
                {permission ? 'Camera permission required' : 'Loading camera...'}
              </Text>
              {permission && !permission.granted && (
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Manual Input Form */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Manual Test Input</Text>

          <Text style={styles.label}>VPA / UPI ID</Text>
          <TextInput
            style={styles.input}
            value={vpa}
            onChangeText={setVpa}
            placeholder="user@paytm"
          />

          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="100"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Tag/Note</Text>
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Payment note"
          />
        </View>

        {/* UPI Apps Section */}
        {vpa && amount && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Test Merchant Aggregator</Text>
            <DynamicUpiApps
              vpa={vpa}
              amount={amount}
              transactionNote={tag}
              onAppSelect={handlePayment}
              onPaymentLaunch={(success, app, url) => {
                console.log(`Payment result: ${success}, App: ${app.label}`);
              }}
            />
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  cameraSection: {
    height: 300,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scanText: {
    marginTop: 20,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  form: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  paymentSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
});
