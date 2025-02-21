import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';
import type { SignerType, ProgressHookType } from '@pushprotocol/restapi';
import { isErrorWithResponse, isErrorWithResponseV2, ValidationError } from '@pushprotocol/restapi/src/lib/errors/validationError';
import { HttpStatus } from '@pushprotocol/restapi/src/lib/errors/httpStatus';

//---------------------------------------------------
// INITIALIZATION SERVICE
//---------------------------------------------------

/**
 * Service responsible for initializing and managing Push Protocol instance
 */
export class InitializationService {
  private pushUser: PushAPI | null = null;

  constructor() {}

  /**
   * Helper to handle Push Protocol specific errors
   */
  private handlePushError(error: unknown, context: string): Error {
    if (isErrorWithResponse(error)) {
      const status = error.response.status;
      const { message, errorCode, details } = error.response.data;
      return new ValidationError(
        status as HttpStatus,
        errorCode,
        `${context}: ${message}`,
        details
      );
    }
    if (isErrorWithResponseV2(error)) {
      const status = error.response.status;
      const { message, validation, error: errorCode } = error.response.data;
      return new ValidationError(
        status as HttpStatus,
        errorCode,
        `${context}: ${message}`,
        validation
      );
    }
    if (error instanceof Error) {
      return new ValidationError(
        HttpStatus.InternalError,
        'UNKNOWN_ERROR',
        error.message,
        error.stack || ''
      );
    }
    return new ValidationError(
      HttpStatus.InternalError,
      'UNKNOWN_ERROR',
      `${context}: Unknown error`,
      String(error)
    );
  }

  //---------------------------------------------------
  // CORE INITIALIZATION
  //---------------------------------------------------

  /**
   * Initialize Push Protocol user instance
   */
  public async initialize(
    signer: SignerType,
    progressHook?: (progress: ProgressHookType) => void,
    options?: {
      env?: keyof typeof CONSTANTS.ENV;
      account?: string;
    }
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      // Initialize Push user with signer and default options
      this.pushUser = await PushAPI.initialize(signer, {
        env: options?.env ? CONSTANTS.ENV[options.env] : CONSTANTS.ENV.STAGING,
        progressHook,
        account: options?.account,
        autoUpgrade: true
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to initialize Push user:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to initialize Push user')
      };
    }
  }

  //---------------------------------------------------
  // USER MANAGEMENT
  //---------------------------------------------------

  /**
   * Get current Push user instance
   */
  public getPushUser(): PushAPI | null {
    return this.pushUser;
  }

  /**
   * Check if Push user is initialized
   */
  public isInitialized(): boolean {
    return this.pushUser !== null;
  }

  /**
   * Reset Push user instance
   */
  public reset(): void {
    this.pushUser = null;
  }

  //---------------------------------------------------
  // VALIDATION
  //---------------------------------------------------

  /**
   * Ensure Push user is initialized
   * @throws {ValidationError} If Push user is not initialized
   */
  public ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new ValidationError(
        HttpStatus.BadRequest,
        'USER_NOT_INITIALIZED',
        'Push user not initialized',
        'Initialize Push user before performing operations'
      );
    }
  }
}
