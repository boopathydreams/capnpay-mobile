import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { DESIGN_SYSTEM } from '@/constants/DesignSystem';

const { width, height } = Dimensions.get('window');

interface ParsedUpiData {
  vpa: string;
  payeeName?: string;
  amount?: string;
  transactionNote?: string;
  currency?: string;
  merchantCode?: string;
  transactionRef?: string;
  originalUrl: string;
  isMerchant: boolean;
}

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onUpiDetected: (upiData: ParsedUpiData) => void;
}

// Merchant QR detection markers
const MERCHANT_MARKERS = ['sign', 'orgid', 'mid', 'msid', 'mtid', 'tid', 'paytmqr', 'mc'];

// Check if QR has merchant markers (signed merchant QR)
const hasMerchantMarkers = (params: URLSearchParams): boolean => {
  return MERCHANT_MARKERS.some((marker) => params.has(marker));
};

// Parse UPI QR code data
const parseUpiQrCode = (qrCodeData: string): ParsedUpiData | null => {
  try {
    console.log('🔍 Parsing QR code:', qrCodeData);

    // Handle UPI URLs
    if (qrCodeData.startsWith('upi://pay')) {
      const url = new URL(qrCodeData);
      const params = url.searchParams;
      const isMerchant = hasMerchantMarkers(params);

      const parsedData: ParsedUpiData = {
        vpa: params.get('pa') || '',
        payeeName: params.get('pn') ? decodeURIComponent(params.get('pn')!).trim() : undefined,
        amount: params.get('am') ? decodeURIComponent(params.get('am')!).trim() : undefined,
        transactionNote: params.get('tn')
          ? decodeURIComponent(params.get('tn')!).trim()
          : undefined,
        currency: params.get('cu') || 'INR',
        merchantCode: params.get('mc') ? decodeURIComponent(params.get('mc')!).trim() : undefined,
        transactionRef: params.get('tr') ? decodeURIComponent(params.get('tr')!).trim() : undefined,
        originalUrl: qrCodeData,
        isMerchant,
      };

      console.log('✅ Parsed UPI data:', parsedData);
      return parsedData;
    }

    // Handle other URL formats that might contain UPI data
    if (qrCodeData.includes('pa=') && qrCodeData.includes('@')) {
      console.log('🔧 Attempting fallback parsing for non-standard UPI URL');

      const fallbackData: ParsedUpiData = {
        vpa: qrCodeData.match(/pa=([^&\s]+)@([^&\s]+)/)?.[0]?.replace('pa=', '') || '',
        payeeName: qrCodeData.match(/pn=([^&]+)/)?.[1]
          ? decodeURIComponent(qrCodeData.match(/pn=([^&]+)/)![1]).trim()
          : undefined,
        amount: qrCodeData.match(/am=([^&]+)/)?.[1]
          ? decodeURIComponent(qrCodeData.match(/am=([^&]+)/)![1]).trim()
          : undefined,
        transactionRef: qrCodeData.match(/tr=([^&]+)/)?.[1]
          ? decodeURIComponent(qrCodeData.match(/tr=([^&]+)/)![1]).trim()
          : undefined,
        currency: 'INR',
        originalUrl: qrCodeData,
        isMerchant: false,
      };
      return fallbackData;
    }

    return null;
  } catch (error) {
    console.error('❌ Error parsing UPI QR code:', error);
    return null;
  }
};

export default function ScannerModal({ visible, onClose, onUpiDetected }: ScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Reset scanned state when modal opens
  useEffect(() => {
    if (visible) {
      setScanned(false);
    }
  }, [visible]);

  // Handle barcode scanning
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    console.log('📱 QR Code scanned:', data);
    setScanned(true);

    const upiData = parseUpiQrCode(data);

    // Validate UPI data
    if (upiData && (upiData.vpa || upiData.payeeName)) {
      console.log('✅ Valid UPI QR code detected');

      // If VPA is empty but we have payee name, try to extract VPA from original URL
      if (!upiData.vpa && upiData.originalUrl) {
        const paMatch = upiData.originalUrl.match(/pa=([^&\s]+)/);
        if (paMatch) {
          upiData.vpa = decodeURIComponent(paMatch[1]);
          console.log('🔧 Extracted VPA from URL:', upiData.vpa);
        }
      }

      // Close modal and pass data to parent
      onClose();
      onUpiDetected(upiData);
    } else {
      console.log('❌ Invalid UPI QR - missing VPA and payee name');

      setTimeout(() => {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain valid UPI payment information. Please scan a proper UPI payment QR code.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setScanned(false);
              },
            },
            {
              text: 'Cancel',
              onPress: onClose,
              style: 'cancel',
            },
          ],
        );
      }, 500);
    }
  };

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={DESIGN_SYSTEM.colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Camera Permission Required</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.centerContent}>
            <Ionicons name="camera-outline" size={64} color="#666" />
            <Text style={styles.permissionText}>Camera access is required to scan QR codes</Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={DESIGN_SYSTEM.colors.neutral[600]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan UPI QR Code</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.headerSubtitle}>
          {scanned ? 'QR Code Detected!' : 'Point camera at any UPI QR code'}
        </Text>

        {/* Camera View */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
          />

          {/* Scanning Overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            {!scanned && (
              <View style={styles.scanInstructions}>
                <Text style={styles.scanText}>Position QR code within the frame</Text>
                <Text style={styles.scanSubText}>Automatic detection enabled</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.neutral[200],
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: DESIGN_SYSTEM.colors.neutral[900],
  },
  headerSubtitle: {
    textAlign: 'center',
    color: 'white',
    fontSize: 16,
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanInstructions: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  scanSubText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 16,
    color: DESIGN_SYSTEM.colors.neutral[600],
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: DESIGN_SYSTEM.colors.primary[500],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
