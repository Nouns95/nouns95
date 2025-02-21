import { useCallback, useEffect, useState, useRef } from 'react';
import type { IUser } from '@pushprotocol/restapi';
import { CONSTANTS } from '@pushprotocol/restapi';
import { ProfileService } from '../../services/profileService';
import { StreamService } from '../../services/streamService';

// Regular state interface
interface ProfileState {
  profile: IUser | null;
  isLoading: boolean;
  error: Error | null;
}

// Real-time state interface
interface ProfileRealTimeState {
  isOnline: boolean;
  lastSeen: Date | null;
  presence: {
    status: 'online' | 'offline' | 'away';
    lastUpdated: Date;
  };
}

interface ProfileUpdate {
  name?: string;
  desc?: string;
  picture?: string;
}

// Cache interface
interface ProfileCache {
  [address: string]: {
    profile: IUser;
    timestamp: number;
  };
}

// Add these type definitions near the top with other interfaces
interface PresenceUpdateEvent {
  status: 'online' | 'offline' | 'away';
  lastSeen?: number;
}

// Type guard for presence update events
function isPresenceUpdateEvent(data: unknown): data is PresenceUpdateEvent {
  return (
    typeof data === 'object' && 
    data !== null && 
    'status' in data && 
    typeof data.status === 'string' && 
    ['online', 'offline', 'away'].includes(data.status) &&
    (!('lastSeen' in data) || typeof data.lastSeen === 'number')
  );
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useProfile(
  profileService: ProfileService,
  stream: StreamService | null,
  isStreamConnected: boolean
) {
  // Regular profile state
  const [state, setState] = useState<ProfileState>({
    profile: null,
    isLoading: false,
    error: null
  });

  // Real-time state
  const [realTimeState, setRealTimeState] = useState<ProfileRealTimeState>({
    isOnline: false,
    lastSeen: null,
    presence: {
      status: 'offline',
      lastUpdated: new Date()
    }
  });

  // Profile cache
  const profileCache = useRef<ProfileCache>({});

  //---------------------------------------------------
  // PROFILE LOADING
  //---------------------------------------------------

  /**
   * Load current user's profile
   */
  const loadProfile = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await profileService.getProfile();
      if (!result.success || !result.data) {
        throw result.error || new Error('Failed to load profile');
      }

      setState({
        profile: result.data,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState({
        profile: null,
        error: error instanceof Error ? error : new Error('Failed to load profile'),
        isLoading: false
      });
    }
  }, [profileService]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  //---------------------------------------------------
  // PROFILE RESOLUTION
  //---------------------------------------------------

  /**
   * Check if cached profile is still valid
   */
  const isCacheValid = useCallback((address: string) => {
    const cached = profileCache.current[address];
    if (!cached) return false;
    
    const now = Date.now();
    return (now - cached.timestamp) < CACHE_DURATION;
  }, []);

  /**
   * Get profile by address with caching
   */
  const getProfileByAddress = useCallback(async (address: string) => {
    // Check cache first
    if (isCacheValid(address)) {
      return profileCache.current[address].profile;
    }

    try {
      const result = await profileService.getProfileByAddress(address);
      if (!result.success || !result.data) {
        throw result.error || new Error('Failed to get profile');
      }

      // Update cache
      profileCache.current[address] = {
        profile: result.data,
        timestamp: Date.now()
      };

      return result.data;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to get profile');
    }
  }, [profileService, isCacheValid]);

  /**
   * Resolve multiple addresses to profiles in parallel
   */
  const resolveProfiles = useCallback(async (addresses: string[]) => {
    const uniqueAddresses = [...new Set(addresses)];
    const results: { [address: string]: IUser } = {};

    // Split addresses into cached and uncached
    const uncachedAddresses = uniqueAddresses.filter(addr => !isCacheValid(addr));
    const cachedProfiles = uniqueAddresses
      .filter(addr => isCacheValid(addr))
      .reduce((acc, addr) => ({
        ...acc,
        [addr]: profileCache.current[addr].profile
      }), {});

    if (uncachedAddresses.length > 0) {
      // Fetch uncached profiles in parallel
      const promises = uncachedAddresses.map(async (address) => {
        try {
          const profile = await getProfileByAddress(address);
          return { address, profile };
        } catch (error) {
          console.error(`Failed to resolve profile for ${address}:`, error);
          return { address, profile: null };
        }
      });

      const resolved = await Promise.all(promises);
      
      // Add resolved profiles to results
      resolved.forEach(({ address, profile }) => {
        if (profile) {
          results[address] = profile;
        }
      });
    }

    // Combine with cached results
    return { ...results, ...cachedProfiles };
  }, [getProfileByAddress, isCacheValid]);

  //---------------------------------------------------
  // STREAM EVENT HANDLERS
  //---------------------------------------------------

  /**
   * Handle presence update from stream
   */
  const handlePresenceUpdate = useCallback((data: unknown) => {
    if (!isPresenceUpdateEvent(data)) return;
    
    setRealTimeState(prev => ({
      ...prev,
      isOnline: data.status === 'online',
      lastSeen: data.lastSeen ? new Date(data.lastSeen) : prev.lastSeen,
      presence: {
        status: data.status,
        lastUpdated: new Date()
      }
    }));
  }, []);

  // Set up stream event listeners when connected
  useEffect(() => {
    if (!stream || !isStreamConnected) return;

    // Subscribe to presence events
    stream.on(CONSTANTS.STREAM.PROFILE, handlePresenceUpdate);

    // Cleanup listeners on unmount or disconnect
    return () => {
      stream.off(CONSTANTS.STREAM.PROFILE, handlePresenceUpdate);
    };
  }, [stream, isStreamConnected, handlePresenceUpdate]);

  //---------------------------------------------------
  // PROFILE UPDATES
  //---------------------------------------------------

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (update: ProfileUpdate) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await profileService.updateProfile(update);
      if (!result.success) {
        throw result.error || new Error('Failed to update profile');
      }

      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('Failed to update profile'),
        isLoading: false
      }));
    }
  }, [profileService, loadProfile]);

  return {
    // Regular state
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,

    // Real-time state
    isOnline: realTimeState.isOnline,
    lastSeen: realTimeState.lastSeen,
    presence: realTimeState.presence,

    // Profile resolution
    getProfileByAddress,
    resolveProfiles,

    // Actions
    updateProfile,
    reloadProfile: loadProfile,

    // Real-time actions
    setPresenceStatus: (status: 'online' | 'offline' | 'away') => 
      setRealTimeState(prev => ({
        ...prev,
        presence: {
          status,
          lastUpdated: new Date()
        }
      }))
  };
}
