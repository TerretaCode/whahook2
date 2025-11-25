/**
 * Auto-Reconnection Service with Exponential Backoff
 * 
 * Implements intelligent reconnection strategy for WhatsApp sessions:
 * - Exponential backoff with jitter to prevent thundering herd
 * - Configurable max retries and delays
 * - Distinction between temporary and permanent disconnections
 */

export interface ReconnectionConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitter: boolean;
  backoffMultiplier: number;
}

export interface ReconnectionAttempt {
  attemptNumber: number;
  delay: number;
  timestamp: Date;
  reason?: string;
}

export interface ReconnectionResult {
  success: boolean;
  attempts: ReconnectionAttempt[];
  totalDuration: number;
  error?: Error;
}

const DEFAULT_CONFIG: ReconnectionConfig = {
  maxRetries: 3,
  baseDelay: 2000,        // Start with 2 seconds
  maxDelay: 60000,        // Max 1 minute
  jitter: true,
  backoffMultiplier: 2,
};

/**
 * Permanent disconnection reasons that should NOT trigger auto-reconnection
 * These require manual intervention (re-scanning QR code)
 */
const PERMANENT_DISCONNECTION_REASONS = [
  'LOGOUT',
  'LOGGED_OUT',
  'AUTHENTICATION_FAILURE',
  'AUTH_FAILURE',
  'REVOKED',
  'CONFLICT',
  'REPLACED',
  'SESSION_EXPIRED',
  'UNPAIRED',
  'UNPAIRED_PHONE',
  'PHONE_REMOVED',
];

export class AutoReconnectService {
  private config: ReconnectionConfig;
  private activeReconnections: Map<string, ReconnectionAttempt[]> = new Map();

  constructor(config?: Partial<ReconnectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    console.log('🔄 AutoReconnectService initialized', { config: this.config });
  }

  /**
   * Determine if a disconnection is permanent or temporary
   */
  isPermanentDisconnection(reason: string): boolean {
    if (!reason) return false;
    
    const upperReason = reason.toUpperCase();
    const isPermanent = PERMANENT_DISCONNECTION_REASONS.some(pr => 
      upperReason.includes(pr)
    );

    console.log(`🔍 Disconnection type: ${isPermanent ? 'PERMANENT' : 'TEMPORARY'} (reason: ${reason})`);
    return isPermanent;
  }

  /**
   * Calculate delay for next reconnection attempt using exponential backoff with jitter
   */
  private calculateDelay(attemptNumber: number): number {
    const exponentialDelay = this.config.baseDelay * Math.pow(
      this.config.backoffMultiplier,
      attemptNumber
    );

    let delay = Math.min(this.config.maxDelay, exponentialDelay);

    if (this.config.jitter) {
      const jitterFactor = 0.5 + Math.random() * 0.5;
      delay = Math.floor(delay * jitterFactor);
    }

    return delay;
  }

  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute reconnection with exponential backoff
   */
  async executeReconnection(
    sessionId: string,
    reconnectFn: () => Promise<boolean>,
    reason?: string
  ): Promise<ReconnectionResult> {
    const startTime = Date.now();
    const attempts: ReconnectionAttempt[] = [];

    console.log(`🔄 Starting auto-reconnection for ${sessionId} (reason: ${reason})`);

    this.activeReconnections.set(sessionId, attempts);

    try {
      for (let attemptNumber = 0; attemptNumber < this.config.maxRetries; attemptNumber++) {
        const delay = attemptNumber === 0 ? 0 : this.calculateDelay(attemptNumber - 1);
        
        if (delay > 0) {
          console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before attempt ${attemptNumber + 1}...`);
          await this.wait(delay);
        }

        const attempt: ReconnectionAttempt = {
          attemptNumber: attemptNumber + 1,
          delay,
          timestamp: new Date(),
          reason
        };
        attempts.push(attempt);

        console.log(`🔄 Reconnection attempt ${attemptNumber + 1}/${this.config.maxRetries} for ${sessionId}`);

        try {
          const success = await reconnectFn();
          
          if (success) {
            const totalDuration = Date.now() - startTime;
            console.log(`✅ Reconnection successful for ${sessionId} after ${attempts.length} attempt(s)`);

            this.activeReconnections.delete(sessionId);

            return {
              success: true,
              attempts,
              totalDuration
            };
          } else {
            console.warn(`⚠️ Reconnection attempt ${attemptNumber + 1} failed for ${sessionId}`);
          }
        } catch (error) {
          console.error(`❌ Reconnection attempt ${attemptNumber + 1} error:`, error);
        }
      }

      // All attempts failed
      const totalDuration = Date.now() - startTime;
      const error = new Error(`Failed to reconnect after ${this.config.maxRetries} attempts`);
      
      console.error(`❌ All reconnection attempts failed for ${sessionId}`);

      this.activeReconnections.delete(sessionId);

      return {
        success: false,
        attempts,
        totalDuration,
        error
      };

    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ Reconnection process failed for ${sessionId}:`, error);

      this.activeReconnections.delete(sessionId);

      return {
        success: false,
        attempts,
        totalDuration,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  isReconnecting(sessionId: string): boolean {
    return this.activeReconnections.has(sessionId);
  }

  getReconnectionAttempts(sessionId: string): ReconnectionAttempt[] | undefined {
    return this.activeReconnections.get(sessionId);
  }

  cancelReconnection(sessionId: string): void {
    if (this.activeReconnections.has(sessionId)) {
      console.log(`🛑 Cancelling reconnection for ${sessionId}`);
      this.activeReconnections.delete(sessionId);
    }
  }

  getActiveReconnections(): string[] {
    return Array.from(this.activeReconnections.keys());
  }
}

export const autoReconnectService = new AutoReconnectService();
