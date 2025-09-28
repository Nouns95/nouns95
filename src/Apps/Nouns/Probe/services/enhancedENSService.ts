/**
 * Enhanced ENS Service
 * Leverages cached ENS data from backend with instant fallback to existing resolver
 */

import { ensResolver } from '../utils/ensResolver';

class EnhancedENSService {
  private cache = new Map<string, string | null>();
  private resolving = new Set<string>();

  /**
   * Get ENS name with backend cache priority
   */
  async resolve(address: string): Promise<string | null> {
    const lowerAddress = address.toLowerCase();

    // Return cached result immediately
    if (this.cache.has(lowerAddress)) {
      return this.cache.get(lowerAddress) || null;
    }

    // Prevent duplicate requests
    if (this.resolving.has(lowerAddress)) {
      // Wait for ongoing resolution
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.cache.has(lowerAddress)) {
            clearInterval(checkInterval);
            resolve(this.cache.get(lowerAddress) || null);
          }
        }, 50);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 5000);
      });
    }

    this.resolving.add(lowerAddress);

    try {
      // First, check if the backend already has ENS data for this address
      // This is likely if the noun was loaded from our cached API
      const cachedResult = ensResolver.getCached(lowerAddress);
      if (cachedResult !== undefined) {
        this.cache.set(lowerAddress, cachedResult);
        this.resolving.delete(lowerAddress);
        return cachedResult;
      }

      // Fallback to existing ENS resolver
      const ensName = await ensResolver.resolve(lowerAddress);
      this.cache.set(lowerAddress, ensName);
      this.resolving.delete(lowerAddress);
      return ensName;

    } catch (error) {
      console.error(`Enhanced ENS resolution failed for ${address}:`, error);
      this.cache.set(lowerAddress, null);
      this.resolving.delete(lowerAddress);
      return null;
    }
  }

  /**
   * Batch resolve multiple addresses
   */
  async resolveBatch(addresses: string[]): Promise<Map<string, string | null>> {
    const results = new Map<string, string | null>();
    
    // Process in parallel for better performance
    const promises = addresses.map(async (address) => {
      const ensName = await this.resolve(address);
      results.set(address.toLowerCase(), ensName);
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Preload ENS data from noun objects that already have ENS names from backend
   */
  preloadFromNounData(nouns: Array<{ __ensName?: string | null; owner?: { id: string; }; }>): void {
    nouns.forEach((noun) => {
      if (noun.__ensName !== undefined && noun.owner?.id) {
        const address = noun.owner.id.toLowerCase();
        this.cache.set(address, noun.__ensName);
        
        // Also update the existing ENS resolver cache
        if (noun.__ensName) {
          ensResolver.getCached(address); // This will cache it in the old system too
        }
      }
    });
    
    // Debug log removed
  }

  /**
   * Get cached result without triggering resolution
   */
  getCached(address: string): string | null | undefined {
    const cached = this.cache.get(address.toLowerCase());
    if (cached !== undefined) {
      return cached;
    }
    
    // Check existing ENS resolver cache
    return ensResolver.getCached(address);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.resolving.clear();
  }
}

// Export singleton instance
export const enhancedENSService = new EnhancedENSService();
