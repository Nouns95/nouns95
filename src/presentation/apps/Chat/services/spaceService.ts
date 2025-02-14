import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';
import { SpaceV2 } from '@pushprotocol/restapi/src/lib/space/SpaceV2';
import { 
    SpaceInfoDTO,
    SpaceIFeeds,
    SignerType,
    SpaceDTO,
    EnvOptionsType,
    GroupAccess,
} from '@pushprotocol/restapi/src/lib/types';
import { ChatCreateSpaceType } from '@pushprotocol/restapi/src/lib/space/create';
import { ChatUpdateSpaceType } from '@pushprotocol/restapi/src/lib/space/update';
import { ChatsOptionsType } from '@pushprotocol/restapi/src/lib/space/spaces';
import { TrendingOptionsType } from '@pushprotocol/restapi/src/lib/space/trending';
import { SearchSpacesType } from '@pushprotocol/restapi/src/lib/space/search';
import { isErrorWithResponse, isErrorWithResponseV2, ValidationError } from '@pushprotocol/restapi/src/lib/errors/validationError';
import { HttpStatus } from '@pushprotocol/restapi/src/lib/errors/httpStatus';

//---------------------------------------------------
// SPACE SERVICE
//---------------------------------------------------

/**
 * Service responsible for managing Push Protocol spaces
 */
export class SpaceService {
  private pushUser: PushAPI;
  private spaceInstances: Map<string, SpaceV2>;

  constructor(pushUser: PushAPI) {
    this.pushUser = pushUser;
    this.spaceInstances = new Map();
  }

  //---------------------------------------------------
  // SPACE MANAGEMENT
  //---------------------------------------------------

  /**
   * Get or create a SpaceV2 instance for a given spaceId
   */
  private async getSpaceV2Instance(spaceId: string): Promise<SpaceV2> {
    const spaceV2 = this.spaceInstances.get(spaceId);
    if (spaceV2) {
      return spaceV2;
    }

    const spaceInfo = await this.pushUser.space.info(spaceId);
    const newSpaceV2 = new SpaceV2({
      // @ts-expect-error - SDK type mismatch between PushAPI space instance and SpaceV2 constructor requirements
      spaceV1Instance: this.pushUser.space,
      spaceInfo
    });
    this.spaceInstances.set(spaceId, newSpaceV2);
    return newSpaceV2;
  }

  /**
   * Create a new space
   * Note: The SDK's type definition suggests 2 arguments for create(),
   * but the actual implementation only uses one. We follow the implementation.
   */
  public async createSpace(
    options: Omit<ChatCreateSpaceType, 'signer' | 'env' | 'pgpPrivateKey'>
  ): Promise<{ success: boolean; data?: SpaceInfoDTO; error?: Error }> {
    try {
      const envOptions: EnvOptionsType = {
        env: CONSTANTS.ENV.PROD
      };

      // Create space with required options
      const spaceOptions: ChatCreateSpaceType = {
        ...options,
        ...envOptions,
        signer: this.pushUser.signer as SignerType,
        pgpPrivateKey: this.pushUser.account // Using account as pgpPrivateKey is not exposed
      };
      
      // Create the space
      // @ts-expect-error - SDK type definition expects 2 args but implementation accepts 1 arg object
      const spaceInfo = await this.pushUser.space.create(spaceOptions);
      
      // Create and store V2 instance
      const spaceV2 = new SpaceV2({
        // @ts-expect-error - SDK type mismatch between PushAPI space instance and SpaceV2 constructor requirements
        spaceV1Instance: this.pushUser.space,
        spaceInfo
      });
      this.spaceInstances.set(spaceInfo.spaceId, spaceV2);
      
      return { success: true, data: spaceInfo };
    } catch (error) {
      console.error('Failed to create space:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to create space')
      };
    }
  }

  /**
   * Get space information
   */
  public async getSpaceInfo(
    spaceId: string
  ): Promise<{ success: boolean; data?: SpaceInfoDTO; error?: Error }> {
    try {
      const spaceInfo = await this.pushUser.space.info(spaceId);
      return { success: true, data: spaceInfo };
    } catch (error) {
      console.error('Failed to get space info:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get space info')
      };
    }
  }

  /**
   * Update space information
   */
  public async updateSpace(
    spaceId: string,
    options: ChatUpdateSpaceType
  ): Promise<{ success: boolean; data?: SpaceInfoDTO; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.update(options);
      
      // Get updated info
      const updatedInfo = await this.pushUser.space.info(spaceId);
      return { success: true, data: updatedInfo };
    } catch (error) {
      console.error('Failed to update space:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to update space')
      };
    }
  }

  //---------------------------------------------------
  // SPACE PARTICIPATION
  //---------------------------------------------------

  /**
   * Join a space
   */
  public async joinSpace(
    spaceId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.join();
      return { success: true };
    } catch (error) {
      console.error('Failed to join space:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to join space')
      };
    }
  }

  /**
   * Leave a space
   */
  public async leaveSpace(
    spaceId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.leave();
      this.spaceInstances.delete(spaceId); // Clean up the instance
      return { success: true };
    } catch (error) {
      console.error('Failed to leave space:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to leave space')
      };
    }
  }

  //---------------------------------------------------
  // SPACE CONTROLS
  //---------------------------------------------------

  /**
   * Start a space
   */
  public async startSpace(
    spaceId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.start();
      return { success: true };
    } catch (error) {
      console.error('Failed to start space:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to start space')
      };
    }
  }

  /**
   * Stop a space
   */
  public async stopSpace(
    spaceId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.stop();
      return { success: true };
    } catch (error) {
      console.error('Failed to stop space:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to stop space')
      };
    }
  }

  //---------------------------------------------------
  // MICROPHONE MANAGEMENT
  //---------------------------------------------------

  /**
   * Request microphone access in a space
   */
  public async requestMicAccess(
    spaceId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.requestForMic();
      return { success: true };
    } catch (error) {
      console.error('Failed to request mic access:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to request mic access')
      };
    }
  }

  /**
   * Accept a microphone request from a user
   */
  public async acceptMicRequest(
    spaceId: string,
    address: string,
    signal: RTCSessionDescriptionInit
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.acceptMicRequest({ address, signal });
      return { success: true };
    } catch (error) {
      console.error('Failed to accept mic request:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to accept mic request')
      };
    }
  }

  /**
   * Reject a microphone request from a user
   */
  public async rejectMicRequest(
    spaceId: string,
    address: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.rejectMicRequest({ address });
      return { success: true };
    } catch (error) {
      console.error('Failed to reject mic request:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to reject mic request')
      };
    }
  }

  //---------------------------------------------------
  // PROMOTION MANAGEMENT
  //---------------------------------------------------

  /**
   * Invite a user to be promoted to speaker
   */
  public async inviteToPromote(
    spaceId: string,
    address: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.inviteToPromote({ address });
      return { success: true };
    } catch (error) {
      console.error('Failed to invite user to promote:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to invite user to promote')
      };
    }
  }

  /**
   * Accept a promotion invite
   */
  public async acceptPromotionInvite(
    spaceId: string,
    signal: RTCSessionDescriptionInit
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.acceptPromotionInvite({ signal });
      return { success: true };
    } catch (error) {
      console.error('Failed to accept promotion invite:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to accept promotion invite')
      };
    }
  }

  /**
   * Reject a promotion invite
   */
  public async rejectPromotionInvite(
    spaceId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      await spaceV2.rejectPromotionInvite();
      return { success: true };
    } catch (error) {
      console.error('Failed to reject promotion invite:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to reject promotion invite')
      };
    }
  }

  //---------------------------------------------------
  // AUDIO CONFIGURATION
  //---------------------------------------------------

  /**
   * Configure space audio settings
   */
  public async configureAudio(
    spaceId: string,
    options: { audio?: boolean }
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      spaceV2.config(options);
      return { success: true };
    } catch (error) {
      console.error('Failed to configure audio:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to configure audio')
      };
    }
  }

  //---------------------------------------------------
  // SPACE DISCOVERY
  //---------------------------------------------------

  /**
   * List all spaces
   */
  public async listSpaces(
    options?: Omit<ChatsOptionsType, 'account' | 'pgpPrivateKey' | 'env'>
  ): Promise<{ success: boolean; data?: SpaceIFeeds[]; error?: Error }> {
    try {
      const envOptions: EnvOptionsType = {
        env: CONSTANTS.ENV.PROD
      };

      // @ts-expect-error - SDK type definition has incorrect parameter types for space.list
      const spaces = await this.pushUser.space.list({
        ...envOptions,
        account: this.pushUser.account,
        ...options
      });
      return { success: true, data: spaces };
    } catch (error) {
      console.error('Failed to list spaces:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to list spaces')
      };
    }
  }

  /**
   * Get trending spaces
   */
  public async getTrendingSpaces(
    options?: Omit<TrendingOptionsType, 'env'>
  ): Promise<{ success: boolean; data?: SpaceIFeeds[]; error?: Error }> {
    try {
      const envOptions: EnvOptionsType = {
        env: CONSTANTS.ENV.PROD
      };

      const trendingOptions: TrendingOptionsType = {
        page: options?.page || 1,
        limit: options?.limit || 10,
        ...envOptions
      };
      // @ts-expect-error - SDK type definition expects SpaceQueryOptions but accepts TrendingOptionsType
      const spaces = await this.pushUser.space.trending(trendingOptions);
      return { success: true, data: spaces };
    } catch (error) {
      console.error('Failed to get trending spaces:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get trending spaces')
      };
    }
  }

  /**
   * Search for spaces
   * Note: The SDK's type definitions expect SpaceDTO but the API returns SpaceInfoDTO.
   * We convert the response to match the expected type.
   */
  public async searchSpaces(
    searchTerm: string,
    options?: Omit<SearchSpacesType, 'searchTerm' | 'env'>
  ): Promise<{ success: boolean; data?: SpaceDTO[]; error?: Error }> {
    try {
      const envOptions: EnvOptionsType = {
        env: CONSTANTS.ENV.PROD
      };

      const searchOptions: SearchSpacesType = {
        searchTerm,
        ...envOptions,
        pageNumber: options?.pageNumber || 1,
        pageSize: options?.pageSize || 10
      };
      
      // @ts-expect-error - SDK type definition says returns SpaceDTO[] but actually returns SpaceInfoDTO[]
      const spaces: SpaceInfoDTO[] = await this.pushUser.space.search(searchOptions);

      // Convert SpaceInfoDTO[] to SpaceDTO[]
      const convertedSpaces: SpaceDTO[] = spaces.map(space => ({
        ...space,
        members: [],
        pendingMembers: [],
        contractAddressERC20: null,
        numberOfERC20: 0,
        contractAddressNFT: null,
        numberOfNFTTokens: 0,
        verificationProof: '',
        status: space.status || null,
        // Only include inviteeDetails if it exists
        ...(space.inviteeDetails ? { inviteeDetails: space.inviteeDetails } : {}),
        meta: space.meta || null
      }));
      
      return { success: true, data: convertedSpaces };
    } catch (error) {
      console.error('Failed to search spaces:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to search spaces')
      };
    }
  }

  //---------------------------------------------------
  // SPACE FEED
  //---------------------------------------------------

  /**
   * Get space feed
   */
  public async getSpaceFeed(
    spaceId: string
  ): Promise<{ success: boolean; data?: SpaceIFeeds[]; error?: Error }> {
    try {
      // @ts-expect-error - SDK type definition is missing space() method or has incorrect return type
      const feed = await this.pushUser.space.space(spaceId);
      return { success: true, data: feed };
    } catch (error) {
      console.error('Failed to get space feed:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get space feed')
      };
    }
  }

  //---------------------------------------------------
  // MEMBER MANAGEMENT
  //---------------------------------------------------

  /**
   * Add speakers to a space
   */
  public async addSpeakers(
    spaceId: string,
    speakers: string[]
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      // @ts-expect-error - SDK type definition has incorrect parameter types for addSpeakers
      await spaceV2.addSpeakers(speakers);
      return { success: true };
    } catch (error) {
      console.error('Failed to add speakers:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to add speakers')
      };
    }
  }

  /**
   * Remove speakers from a space
   */
  public async removeSpeakers(
    spaceId: string,
    speakers: string[]
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      // @ts-expect-error - SDK type definition has incorrect parameter types for removeSpeakers
      await spaceV2.removeSpeakers(speakers);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove speakers:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to remove speakers')
      };
    }
  }

  /**
   * Add listeners to a space
   */
  public async addListeners(
    spaceId: string,
    listeners: string[]
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      // @ts-expect-error - SDK type definition has incorrect parameter types for addListeners
      await spaceV2.addListeners(listeners);
      return { success: true };
    } catch (error) {
      console.error('Failed to add listeners:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to add listeners')
      };
    }
  }

  /**
   * Remove listeners from a space
   */
  public async removeListeners(
    spaceId: string,
    listeners: string[]
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      // @ts-expect-error - SDK type definition has incorrect parameter types for removeListeners
      await spaceV2.removeListeners(listeners);
      return { success: true };
    } catch (error) {
      console.error('Failed to remove listeners:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to remove listeners')
      };
    }
  }

  //---------------------------------------------------
  // ACCESS CONTROL
  //---------------------------------------------------

  /**
   * Get space access control information
   */
  public async getSpaceAccess(
    spaceId: string
  ): Promise<{ success: boolean; data?: GroupAccess; error?: Error }> {
    try {
      const spaceV2 = await this.getSpaceV2Instance(spaceId);
      // @ts-expect-error - SDK type definition has incorrect return type for getAccess
      const access = await spaceV2.getAccess();
      return { success: true, data: access };
    } catch (error) {
      console.error('Failed to get space access:', error);
      return {
        success: false,
        error: this.handlePushError(error, 'Failed to get space access')
      };
    }
  }

  //---------------------------------------------------
  // ERROR HANDLING
  //---------------------------------------------------

  /**
   * Handle Push Protocol specific errors
   */
  private handlePushError(error: unknown, defaultMessage: string): Error {
    if (isErrorWithResponse(error)) {
      const status = error.response?.status || HttpStatus.InternalError;
      const message = error.response?.data?.message || defaultMessage;
      return new ValidationError(
        status,
        'API_ERROR',
        message,
        error.response?.data?.details || ''
      );
    }
    if (isErrorWithResponseV2(error)) {
      const status = error.response?.status || HttpStatus.InternalError;
      const message = error.response?.data?.error || defaultMessage;
      return new ValidationError(
        status,
        'API_ERROR_V2',
        message,
        error.response?.data?.validation || ''
      );
    }
    if (error instanceof ValidationError) {
      return error;
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
      defaultMessage,
      String(error)
    );
  }
}
