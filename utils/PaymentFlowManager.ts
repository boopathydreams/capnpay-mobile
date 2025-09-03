/**
 * Professional Payment Flow Manager for Cap'n Pay
 * Handles escrow payment flows with proper state management and error handling
 *
 * Banking Software Standards:
 * - Single responsibility principle
 * - Proper error handling and recovery
 * - State machine approach
 * - Sequential polling (no concurrent requests)
 * - Timeout management
 * - Clean resource management
 */

export interface PaymentFlowState {
  status:
    | 'idle'
    | 'validating'
    | 'creating_collection'
    | 'selecting_app'
    | 'waiting_payment'
    | 'waiting_in_app'
    | 'processing_payout'
    | 'completed'
    | 'failed';
  message: string;
  referenceId: string | null;
  collectionLinks: any | null;
  error: string | null;
  canRetry: boolean;
}

export interface PaymentStatusResponse {
  status: string;
  message: string;
  collectionStatus?: string;
  payoutStatus?: string;
  payoutTxnId?: string;
  error?: string;
}

export interface PaymentFlowCallbacks {
  onStateChange: (state: PaymentFlowState) => void;
  onSuccess: (referenceId: string) => void;
  onFailure: (error: string, canRetry: boolean) => void;
  onTimeout: () => void;
}

export class PaymentFlowManager {
  private state: PaymentFlowState;
  private callbacks: PaymentFlowCallbacks;
  private apiUrl: string;

  // Polling management
  private isPolling = false;
  private pollTimeoutId: number | null = null;
  private statusTimeoutId: number | null = null;
  private currentPollRequest: Promise<void> | null = null;

  // Configuration
  private readonly POLL_INTERVAL = 3000; // 3 seconds
  private readonly STATUS_TIMEOUT = 300000; // 5 minutes
  private readonly MAX_POLL_ATTEMPTS = 100; // Maximum polling attempts
  private pollAttempts = 0;

  constructor(apiUrl: string, callbacks: PaymentFlowCallbacks) {
    this.apiUrl = apiUrl;
    this.callbacks = callbacks;
    this.state = {
      status: 'idle',
      message: '',
      referenceId: null,
      collectionLinks: null,
      error: null,
      canRetry: true,
    };
  }

  /**
   * Start the escrow payment flow
   */
  async startPayment(params: {
    amount: number;
    recipientVpa: string;
    recipientName?: string;
    category?: string;
    note?: string;
  }): Promise<void> {
    console.log('🚀 PaymentFlowManager: Starting payment flow', params);

    // Reset state for new payment
    this.reset();

    try {
      // Step 1: Validate and create collection
      this.updateState({
        status: 'validating',
        message: 'Validating recipient UPI...',
        canRetry: true,
      });

      const response = await fetch(`${this.apiUrl}/pay-intents/escrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const escrowIntent = await response.json();
      console.log('✅ PaymentFlowManager: Escrow intent created', escrowIntent);

      // Step 2: Update state with collection data
      this.updateState({
        status: 'selecting_app',
        message: 'Select your UPI app to complete payment',
        referenceId: escrowIntent.referenceId,
        collectionLinks: escrowIntent.collectionLinks,
        canRetry: true,
      });
    } catch (error) {
      console.error('❌ PaymentFlowManager: Payment creation failed', error);
      this.updateState({
        status: 'failed',
        message: 'Failed to create payment',
        error: error instanceof Error ? error.message : 'Unknown error',
        canRetry: true,
      });
      this.callbacks.onFailure(error instanceof Error ? error.message : 'Unknown error', true);
    }
  }

  /**
   * Handle UPI app selection and start monitoring
   */
  async selectUpiApp(appName: string): Promise<void> {
    console.log('🎯 PaymentFlowManager: UPI app selected', appName);

    this.updateState({
      status: 'waiting_in_app',
      message: `Complete payment in ${appName}...`,
      canRetry: false,
    });

    // Start status monitoring
    this.startStatusMonitoring();
  }

  /**
   * Start sequential status monitoring with proper error handling
   */
  private startStatusMonitoring(): void {
    if (!this.state.referenceId) {
      console.error('❌ PaymentFlowManager: No reference ID for monitoring');
      return;
    }

    console.log('🔄 PaymentFlowManager: Starting status monitoring');

    // Set overall timeout
    this.statusTimeoutId = window.setTimeout(() => {
      this.handleTimeout();
    }, this.STATUS_TIMEOUT);

    this.isPolling = true;
    this.pollAttempts = 0;

    // Start first poll immediately
    this.scheduleNextPoll();
  }

  /**
   * Schedule next poll with proper delay and sequential execution
   */
  private scheduleNextPoll(): void {
    if (!this.isPolling || this.state.status === 'completed' || this.state.status === 'failed') {
      console.log('🛑 PaymentFlowManager: Polling stopped', {
        isPolling: this.isPolling,
        status: this.state.status,
      });
      return;
    }

    if (this.pollAttempts >= this.MAX_POLL_ATTEMPTS) {
      console.log('⏰ PaymentFlowManager: Max poll attempts reached');
      this.handleTimeout();
      return;
    }

    this.pollTimeoutId = window.setTimeout(() => {
      this.executePoll();
    }, this.POLL_INTERVAL);
  }

  /**
   * Execute single poll request (sequential, not concurrent)
   */
  private async executePoll(): Promise<void> {
    if (!this.isPolling || this.currentPollRequest) {
      console.log('⚠️ PaymentFlowManager: Skipping poll - already in progress or stopped');
      return;
    }

    this.pollAttempts++;
    console.log(
      `🔍 PaymentFlowManager: Polling attempt ${this.pollAttempts}/${this.MAX_POLL_ATTEMPTS}`,
    );

    this.currentPollRequest = this.performStatusCheck();

    try {
      await this.currentPollRequest;
    } catch (error) {
      console.error('❌ PaymentFlowManager: Poll failed', error);
      // Continue polling on errors (transient issues)
    } finally {
      this.currentPollRequest = null;

      // Schedule next poll if still active
      if (this.isPolling && this.state.status !== 'completed' && this.state.status !== 'failed') {
        this.scheduleNextPoll();
      }
    }
  }

  /**
   * Perform actual status check with proper error handling
   */
  private async performStatusCheck(): Promise<void> {
    if (!this.state.referenceId) {
      throw new Error('No reference ID available');
    }

    try {
      const response = await fetch(`${this.apiUrl}/pay-intents/${this.state.referenceId}/status`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const statusData: PaymentStatusResponse = await response.json();
      console.log('📊 PaymentFlowManager: Status response', statusData);

      // Process status response
      this.processStatusResponse(statusData);
    } catch (error) {
      console.error('❌ PaymentFlowManager: Status check error', error);
      // Don't fail immediately on network errors - continue polling
      throw error;
    }
  }

  /**
   * Process status response with proper state transitions
   */
  private processStatusResponse(statusData: PaymentStatusResponse): void {
    switch (statusData.status) {
      case 'initiated':
        // Still waiting for collection payment
        this.updateState({
          status: 'waiting_in_app',
          message: 'Waiting for payment collection...',
        });
        break;

      case 'collection_paid':
      case 'processing_payout':
        // Collection successful, payout initiated
        this.updateState({
          status: 'processing_payout',
          message: 'Payment received! Processing payout to recipient...',
        });
        break;

      case 'payout_completed':
      case 'completed':
        // Payment fully completed
        this.handleSuccess();
        break;

      case 'failed':
        // Payment failed
        this.handleFailure(statusData.error || 'Payment failed', true);
        break;

      default:
        console.warn('⚠️ PaymentFlowManager: Unknown status', statusData.status);
        // Continue polling for unknown statuses
        break;
    }
  }

  /**
   * Handle successful payment completion
   */
  private handleSuccess(): void {
    console.log('🎉 PaymentFlowManager: Payment completed successfully');

    this.stopPolling();

    this.updateState({
      status: 'completed',
      message: 'Payment completed successfully!',
      error: null,
      canRetry: false,
    });

    if (this.state.referenceId) {
      this.callbacks.onSuccess(this.state.referenceId);
    }
  }

  /**
   * Handle payment failure
   */
  private handleFailure(error: string, canRetry: boolean): void {
    console.log('❌ PaymentFlowManager: Payment failed', { error, canRetry });

    this.stopPolling();

    this.updateState({
      status: 'failed',
      message: 'Payment failed',
      error,
      canRetry,
    });

    this.callbacks.onFailure(error, canRetry);
  }

  /**
   * Handle timeout
   */
  private handleTimeout(): void {
    console.log('⏰ PaymentFlowManager: Payment timeout');

    this.stopPolling();

    this.updateState({
      status: 'failed',
      message: 'Payment timeout',
      error: 'Payment took too long to complete',
      canRetry: true,
    });

    this.callbacks.onTimeout();
  }

  /**
   * Stop all polling and cleanup resources
   */
  private stopPolling(): void {
    console.log('🛑 PaymentFlowManager: Stopping all polling');

    this.isPolling = false;

    if (this.pollTimeoutId) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }

    if (this.statusTimeoutId) {
      clearTimeout(this.statusTimeoutId);
      this.statusTimeoutId = null;
    }

    // Wait for current request to finish (don't interrupt)
    // this.currentPollRequest will resolve naturally
  }

  /**
   * Update state and notify callbacks
   */
  private updateState(updates: Partial<PaymentFlowState>): void {
    this.state = { ...this.state, ...updates };
    this.callbacks.onStateChange(this.state);
  }

  /**
   * Reset manager for new payment
   */
  private reset(): void {
    console.log('🔄 PaymentFlowManager: Resetting state');

    this.stopPolling();
    this.pollAttempts = 0;
    this.currentPollRequest = null;

    this.state = {
      status: 'idle',
      message: '',
      referenceId: null,
      collectionLinks: null,
      error: null,
      canRetry: true,
    };
  }

  /**
   * Get current state
   */
  public getState(): PaymentFlowState {
    return { ...this.state };
  }

  /**
   * Cancel current payment
   */
  public cancel(): void {
    console.log('🚫 PaymentFlowManager: Payment cancelled');
    this.reset();
  }

  /**
   * Retry failed payment
   */
  public retry(): void {
    if (this.state.canRetry) {
      console.log('🔄 PaymentFlowManager: Retrying payment');
      this.reset();
    }
  }

  /**
   * Cleanup resources (call on unmount)
   */
  public dispose(): void {
    console.log('🧹 PaymentFlowManager: Disposing resources');
    this.stopPolling();
  }
}
