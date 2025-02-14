import { PushAPI } from '@pushprotocol/restapi';
import type { IUser } from '@pushprotocol/restapi';

//---------------------------------------------------
// PROFILE SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing user profile operations
 */
export class ProfileService {
  constructor(
    private readonly pushUser: PushAPI
  ) {}

  //---------------------------------------------------
  // PROFILE GETTERS
  //---------------------------------------------------

  /**
   * Get profile of the current user
   */
  public async getProfile(): Promise<{ success: boolean; data?: IUser; error?: Error }> {
    try {
      const profile = await this.pushUser.info();
      return { success: true, data: profile };
    } catch (error) {
      console.error('Failed to get profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get profile')
      };
    }
  }

  /**
   * Get profile by address
   */
  public async getProfileByAddress(address: string): Promise<{ success: boolean; data?: IUser; error?: Error }> {
    try {
      const profile = await this.pushUser.info({ overrideAccount: address });
      return { success: true, data: profile };
    } catch (error) {
      console.error('Failed to get profile by address:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to get profile by address')
      };
    }
  }

  //---------------------------------------------------
  // PROFILE UPDATES
  //---------------------------------------------------

  /**
   * Update user profile
   */
  public async updateProfile(update: {
    name?: string;
    desc?: string;
    picture?: string;
  }): Promise<{ success: boolean; error?: Error }> {
    try {
      await this.pushUser.profile.update(update);
      return { success: true };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Failed to update profile')
      };
    }
  }
}
