import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Modal,
  Dimensions,
  Linking,
  SafeAreaView,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ScreenWrapper';

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
  isMerchant: boolean; // Add merchant detection flag
}

// Merchant QR detection markers
const MERCHANT_MARKERS = ['sign', 'orgid', 'mid', 'msid', 'mtid', 'tid', 'paytmqr', 'mc'];

// Check if QR has merchant markers (signed merchant QR)
const hasMerchantMarkers = (params: URLSearchParams): boolean => {
  return MERCHANT_MARKERS.some((marker) => params.has(marker));
};

// Sanitize text for UPI compatibility
const sanitizeAscii = (text: string, maxLength = 40): string => {
  return text
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '') // Remove non-ASCII characters
    .trim()
    .slice(0, maxLength);
};

// Format amount to exactly 2 decimal places
const toTwoDecimals = (amount: string): string => {
  const num = parseFloat(amount);
  return (Math.round(num * 100) / 100).toFixed(2);
};

// Build clean P2P UPI URL
const buildP2P = (
  vpa: string,
  amount: string,
  options?: { pn?: string; tn?: string; tr?: string },
): string => {
  const params = new URLSearchParams();
  params.set('pa', vpa.trim());
  params.set('am', toTwoDecimals(amount));
  params.set('cu', 'INR');

  if (options?.pn) {
    params.set('pn', sanitizeAscii(options.pn));
  }

  if (options?.tn) {
    params.set('tn', sanitizeAscii(options.tn));
  }

  if (options?.tr) {
    params.set('tr', options.tr);
  }

  return `upi://pay?${params.toString()}`;
};

// Build camera-compatible UPI URL by preserving original scanned URL structure
// This preserves critical iOS fields like 'aid' parameter and original encoding
const buildFromScanned = (
  originalUrl: string,
  amount: string,
  transactionNote?: string,
): string => {
  return `upi://pay?pa=9994678569@axl&pn=BOOPATHY%20N%20R&cu=INR`;

  try {
    const url = new URL(originalUrl);
    const params = url.searchParams;
    params.delete('am'); // Remove existing amount if any
    params.delete('tn'); // Remove existing note to replace if needed
    params.delete('mc'); // Remove merchant code to avoid conflicts
    params.delete('tr'); // Optionally remove existing transaction ref
    params.delete('orgid'); // Remove orgid to avoid conflicts
    params.delete('mid'); // Remove mid to avoid conflicts
    params.delete('msid'); // Remove msid to avoid conflicts
    params.delete('mode'); // Remove mtid to avoid conflicts
    params.delete('purpose'); // Remove purpose to avoid conflicts
    params.delete('aid'); // Remove aid to avoid conflicts

    // Set/update critical payment fields
    // params.set('am', toTwoDecimals(amount));
    params.set('cu', 'INR');

    // Add transaction note if provided
    if (transactionNote?.trim()) {
      params.set('tn', sanitizeAscii(transactionNote.trim()));
    }

    // return `gpay://upi/pay?${params.toString()}`;
    return `upi://pay?pa=9994678569@axl&pn=BOOPATHY%20N%20R&cu=INR`;
    // Preserve original URL structure with updated params
    // return `${url.protocol}//${url.host}${url.pathname}?${params.toString()}`;
  } catch (error) {
    console.log('Error building from scanned URL, falling back to buildP2P:', error);
    // Fallback to standard P2P building if URL parsing fails
    return buildP2P(originalUrl, amount, { tn: transactionNote });
  }
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedUpiData | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [tag, setTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Request camera permission
  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission]);

  // Parse UPI QR code data
  const parseUpiQrCode = (qrCodeData: string): ParsedUpiData | null => {
    try {
      // Handle various UPI URL patterns
      let cleanUrl = qrCodeData.trim();

      // Handle paytm://pay pattern
      if (cleanUrl.startsWith('paytm://pay')) {
        cleanUrl = cleanUrl.replace('paytm://pay', 'upi://pay');
      }

      // Handle tez://upi pattern
      if (cleanUrl.startsWith('tez://upi')) {
        cleanUrl = cleanUrl.replace('tez://upi', 'upi://pay');
      }

      if (!cleanUrl.startsWith('upi://pay')) {
        console.log('Invalid UPI URL format:', cleanUrl);
        return null;
      }

      const upiUrl = new URL(cleanUrl);
      const params = upiUrl.searchParams;

      // Check if this is a merchant QR with signature markers
      const isMerchant = hasMerchantMarkers(params);

      // Extract VPA (required field)
      const vpa = params.get('pa')?.trim();
      if (!vpa || vpa === '') {
        console.log('No VPA found in QR code');
        return null;
      }

      // Extract all available data
      const parsedData: ParsedUpiData = {
        vpa,
        payeeName: params.get('pn')?.trim() || undefined,
        amount: params.get('am')?.trim() || undefined,
        transactionNote: params.get('tn')?.trim() || undefined,
        currency: params.get('cu')?.trim() || 'INR',
        merchantCode: params.get('mc')?.trim() || undefined,
        transactionRef: params.get('tr')?.trim() || undefined,
        originalUrl: cleanUrl,
        isMerchant,
      };

      return parsedData;
    } catch (error) {
      console.log('Error parsing QR code:', error);
      // Fallback regex parsing
      const vpaMatch = qrCodeData.match(/pa=([^&]+)/);
      if (vpaMatch) {
        const fallbackData: ParsedUpiData = {
          vpa: decodeURIComponent(vpaMatch[1]).trim(),
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
          isMerchant: false, // Default to false for fallback
        };
        return fallbackData;
      }
      return null;
    }
  };

  // Handle barcode scanning
  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;

    console.log('📱 QR Code scanned:', data);
    setScanned(true);

    const upiData = parseUpiQrCode(data);

    // More robust validation - check if we have VPA OR payeeName (for merchant QRs)
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

      setParsedData(upiData);

      // Pre-fill amount if available
      if (upiData.amount) {
        setAmount(upiData.amount);
      }

      // Pre-fill transaction note if available
      if (upiData.transactionNote) {
        setTag(upiData.transactionNote);
      }

      setShowPaymentModal(true);
    } else {
      console.log('❌ Invalid UPI QR - missing VPA and payee name');

      // Add a delay to prevent spam alerts
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
          ],
        );
      }, 500);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async () => {
    if (!parsedData) {
      console.log('No parsed UPI data available');
      return;
    }

    try {
      let finalUpiUrl: string;

      // For merchant QRs with signatures, use the original URL to preserve integrity
      if (parsedData.isMerchant) {
        finalUpiUrl = buildFromScanned(parsedData.originalUrl, amount, tag.trim() || undefined); //parsedData.originalUrl;
        console.log('Using original merchant QR (signed):', finalUpiUrl);
      } else {
        // For P2P QRs, use camera-compatible building to preserve iOS trust signals
        finalUpiUrl = buildFromScanned(parsedData.originalUrl, amount, tag.trim() || undefined);
        console.log('Built camera-compatible P2P URL:', finalUpiUrl);
      }

      // Launch UPI apps with app-specific scheme preferences for iOS
      if (Platform.OS === 'ios') {
        // Try app-specific schemes first for better compatibility
        const appSchemes = [
          { scheme: 'gpay://', name: 'Google Pay' },
          { scheme: 'phonepe://', name: 'PhonePe' },
          { scheme: 'paytm://', name: 'Paytm' },
          { scheme: 'bharatpe://', name: 'BharatPe' },
          { scheme: 'mobikwik://', name: 'MobiKwik' },
        ];

        let opened = false;

        for (const app of appSchemes) {
          try {
            const canOpen = await Linking.canOpenURL(app.scheme);
            if (canOpen) {
              console.log(`Opening with ${app.name}:`, finalUpiUrl);
              await Linking.openURL(finalUpiUrl);
              opened = true;
              break;
            }
          } catch (error) {
            console.log(`Failed to open ${app.name}:`, error);
            continue;
          }
        }

        // Fallback to generic UPI scheme
        if (!opened) {
          console.log('Opening with generic UPI scheme:', finalUpiUrl);
          await Linking.openURL(finalUpiUrl);
        }
      } else {
        // Android: Use generic UPI scheme (works better)
        console.log('Opening Android UPI intent:', finalUpiUrl);
        await Linking.openURL(finalUpiUrl);
      }

      // Reset the modal state
      setShowPaymentModal(false);
      setParsedData(null);
      setAmount('');
      setTag('');

      // Give user feedback
      setTimeout(() => {
        setScanned(false); // Allow scanning again after UPI app closes
      }, 1000);
    } catch (error) {
      console.log('Error handling payment:', error);
      Alert.alert('Error', 'Failed to open UPI app. Please try again.');
    }
  };

  // Permission states
  if (!permission) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Requesting camera permission...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#666" />
          <Text style={styles.permissionText}>Camera access is required to scan QR codes</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan UPI QR Code</Text>
        <Text style={styles.headerSubtitle}>
          {scanned ? 'QR Code Detected!' : 'Point camera at any UPI QR code'}
        </Text>
      </View>

      {/* Big Camera View */}
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

        {/* Reset button */}
        {scanned && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => {
              setScanned(false);
              setParsedData(null);
              setShowPaymentModal(false);
              setAmount('');
              setTag('');
            }}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.resetButtonText}>Scan Another QR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Simple Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" presentationStyle="pageSheet">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Complete Payment</Text>
                <Text style={styles.modalSubtitle}>
                  To: {parsedData?.payeeName || parsedData?.vpa}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowPaymentModal(false);
                  setScanned(false);
                  setParsedData(null);
                  setAmount('');
                  setTag('');
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Payment Form */}
            <ScrollView
              style={styles.paymentForm}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {/* Recipient Info */}
              <View style={styles.recipientCard}>
                <Text style={styles.sectionTitle}>Payment To</Text>
                <Text style={styles.vpaText}>{parsedData?.vpa}</Text>
                {parsedData?.payeeName && (
                  <Text style={styles.payeeNameText}>{parsedData.payeeName}</Text>
                )}
              </View>

              {/* Amount Input */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Amount (₹)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  editable={!isProcessing}
                  autoFocus
                />
              </View>

              {/* Tag Input */}
              <View style={styles.inputSection}>
                <Text style={styles.sectionTitle}>Note/Tag (Optional)</Text>
                <TextInput
                  style={styles.tagInput}
                  value={tag}
                  onChangeText={setTag}
                  placeholder="Add a note or tag"
                  editable={!isProcessing}
                />
              </View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmountSection}>
                <Text style={styles.sectionTitle}>Quick Amount</Text>
                <View style={styles.quickAmountButtons}>
                  {['50', '100', '200', '500', '1000'].map((quickAmount) => (
                    <TouchableOpacity
                      key={quickAmount}
                      style={[
                        styles.quickAmountButton,
                        amount === quickAmount && styles.quickAmountButtonActive,
                      ]}
                      onPress={() => setAmount(quickAmount)}
                      disabled={isProcessing}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          amount === quickAmount && styles.quickAmountTextActive,
                        ]}
                      >
                        ₹{quickAmount}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Pay Button */}
              <TouchableOpacity
                style={[
                  styles.payButton,
                  (!amount || parseFloat(amount) <= 0 || isProcessing) && styles.payButtonDisabled,
                ]}
                onPress={handlePaymentComplete}
                disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              >
                <Text style={styles.payButtonText}>
                  {isProcessing ? 'Launching Payment...' : `Pay ₹${amount || '0'}`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
    width: width * 0.8,
    height: width * 0.8,
    borderWidth: 3,
    borderColor: '#00FF88',
    borderRadius: 16,
    backgroundColor: 'transparent',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  scanInstructions: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  scanText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  scanSubText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  resetButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
    color: '#666',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  paymentForm: {
    flex: 1,
    padding: 20,
  },
  recipientCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  vpaText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  payeeNameText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inputSection: {
    marginBottom: 20,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'white',
    textAlign: 'center',
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  quickAmountSection: {
    marginBottom: 30,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickAmountButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quickAmountButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  quickAmountTextActive: {
    color: 'white',
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  payButtonDisabled: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
