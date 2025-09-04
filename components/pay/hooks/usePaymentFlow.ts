import { useState, useRef, useEffect } from 'react';
import { Alert, Animated } from 'react-native';
import { PaymentFlowManager, PaymentFlowState } from '@/utils/PaymentFlowManager';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.31.94:3000';

interface PaymentData {
  amount: number;
  recipientVpa: string;
  recipientName: string;
  note?: string; // Optional custom note
}

interface UsePaymentFlowProps {
  onPaymentSuccess?: (referenceId: string) => void;
  onPaymentFailure?: (error: string, canRetry: boolean) => void;
  onPaymentTimeout?: () => void;
}

// Utility function to sanitize payment purpose/note
const sanitizePaymentNote = (note: string): string => {
  // Remove special characters that cause payout failures
  // Keep only alphanumeric characters, spaces, and safe punctuation
  return note
    .replace(/[.@#$%^&*!;:'"~`?=+)(]/g, '') // Remove problematic special characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim() // Remove leading/trailing spaces
    .substring(0, 35); // Limit to 35 characters as per API requirement
};

export const usePaymentFlow = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentTimeout,
}: UsePaymentFlowProps = {}) => {
  // Store callbacks in refs to avoid recreating PaymentFlowManager
  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  const onPaymentFailureRef = useRef(onPaymentFailure);
  const onPaymentTimeoutRef = useRef(onPaymentTimeout);

  // Update refs when callbacks change
  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
    onPaymentFailureRef.current = onPaymentFailure;
    onPaymentTimeoutRef.current = onPaymentTimeout;
  }, [onPaymentSuccess, onPaymentFailure, onPaymentTimeout]);

  // Payment flow state
  const [paymentFlowState, setPaymentFlowState] = useState<PaymentFlowState>({
    status: 'idle',
    message: '',
    referenceId: null,
    collectionLinks: null,
    error: null,
    canRetry: true,
  });

  // Payment timer for 3-minute countdown
  const [paymentTimer, setPaymentTimer] = useState<number>(0);
  const paymentTimerRef = useRef<any>(null);

  // Payment flow manager instance
  const paymentFlowManagerRef = useRef<PaymentFlowManager | null>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Initialize payment flow manager (no dependencies to avoid recreation)
  useEffect(() => {
    paymentFlowManagerRef.current = new PaymentFlowManager(API_URL, {
      onStateChange: (state) => {
        console.log('🔄 Payment flow state changed:', state);
        setPaymentFlowState(state);
      },
      onSuccess: (referenceId) => {
        console.log('🎉 Payment successful:', referenceId);
        stopPaymentTimer();
        onPaymentSuccessRef.current?.(referenceId);
      },
      onFailure: (error, canRetry) => {
        console.log('❌ Payment failed:', error);
        stopPaymentTimer();
        onPaymentFailureRef.current?.(error, canRetry);
      },
      onTimeout: () => {
        console.log('⏰ Payment timeout');
        stopPaymentTimer();
        onPaymentTimeoutRef.current?.();
      },
    });

    return () => {
      if (paymentFlowManagerRef.current) {
        paymentFlowManagerRef.current.dispose();
      }
      if (paymentTimerRef.current) {
        clearInterval(paymentTimerRef.current);
      }
    };
  }, []); // Empty dependencies - only create once

  // Animation for loader
  useEffect(() => {
    if (
      paymentFlowState.status !== 'idle' &&
      paymentFlowState.status !== 'completed' &&
      paymentFlowState.status !== 'failed'
    ) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [paymentFlowState.status, spinValue]);

  // Payment timer functions
  const startPaymentTimer = () => {
    console.log('⏰ Starting 3-minute payment timer');
    setPaymentTimer(180);

    if (paymentTimerRef.current) {
      clearInterval(paymentTimerRef.current);
    }

    const interval = setInterval(() => {
      setPaymentTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          paymentTimerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    paymentTimerRef.current = interval;
  };

  const stopPaymentTimer = () => {
    if (paymentTimerRef.current) {
      clearInterval(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    setPaymentTimer(0);
  };

  // Reset payment flow
  const resetPaymentFlow = () => {
    console.log('🧹 Resetting payment flow completely...');

    setPaymentFlowState({
      status: 'idle',
      message: '',
      referenceId: null,
      collectionLinks: null,
      error: null,
      canRetry: true,
    });

    stopPaymentTimer();

    if (paymentFlowManagerRef.current) {
      paymentFlowManagerRef.current.cancel();
    }
  };

  // Start payment
  const startPayment = async (paymentData: PaymentData) => {
    console.log('🚀 Starting payment flow...', paymentData);

    if (!paymentFlowManagerRef.current) {
      console.error('❌ PaymentFlowManager not initialized');
      onPaymentFailure?.('Payment system not ready. Please try again.', true);
      return;
    }

    try {
      startPaymentTimer();

      // Sanitize the payment note to avoid payout failures
      const sanitizedNote = sanitizePaymentNote(paymentData.note || `Payment via Capn Pay`);

      console.log('🔄 Calling PaymentFlowManager.startPayment...');
      await paymentFlowManagerRef.current.startPayment({
        amount: paymentData.amount,
        recipientVpa: paymentData.recipientVpa,
        recipientName: paymentData.recipientName,
        category: 'Payment',
        note: sanitizedNote,
      });
      console.log('✅ PaymentFlowManager.startPayment completed');
    } catch (error) {
      console.error('❌ Error in usePaymentFlow.startPayment:', error);
      stopPaymentTimer();
      onPaymentFailure?.(
        error instanceof Error ? error.message : 'Payment initiation failed',
        true,
      );
    }
  };

  // Handle UPI App Selection
  const selectUpiApp = (appName: string) => {
    console.log(`🎯 Selected UPI app: ${appName}`);
    if (paymentFlowManagerRef.current) {
      paymentFlowManagerRef.current.selectUpiApp(appName);
    }
  };

  return {
    // State
    paymentFlowState,
    paymentTimer,
    spinValue,

    // Actions
    startPayment,
    selectUpiApp,
    resetPaymentFlow,

    // Status checks
    isPaymentInProgress:
      paymentFlowState.status !== 'idle' &&
      paymentFlowState.status !== 'completed' &&
      paymentFlowState.status !== 'failed',
    isPaymentCompleted: paymentFlowState.status === 'completed',
    isPaymentFailed: paymentFlowState.status === 'failed',
  };
};
