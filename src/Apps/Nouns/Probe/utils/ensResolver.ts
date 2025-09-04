// ENS Resolution utility with batching and caching

interface ENSCache {
  [address: string]: {
    name: string | null;
    timestamp: number;
    isResolved: boolean;
  };
}

class ENSResolver {
  private cache: ENSCache = {};
  private queue: Set<string> = new Set();
  private isProcessing = false;
  private callbacks: Map<string, Array<(name: string | null) => void>> = new Map();
  
  // Cache duration: 10 minutes
  private readonly CACHE_DURATION = 10 * 60 * 1000;
  // Batch size and delay - more aggressive for background processing
  private readonly BATCH_SIZE = 30;
  private readonly BATCH_DELAY = 200; // 0.2 seconds between batches

  async resolve(address: string): Promise<string | null> {
    // Check cache first
    const cached = this.cache[address];
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.name;
    }

    // Return promise that resolves when ENS is resolved
    return new Promise((resolve) => {
      // Add callback for this address
      if (!this.callbacks.has(address)) {
        this.callbacks.set(address, []);
      }
      this.callbacks.get(address)!.push(resolve);

      // Add to queue
      this.queue.add(address);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processBatch();
      }
    });
  }

  private async processBatch() {
    if (this.queue.size === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;

    // Take up to BATCH_SIZE addresses from queue
    const batch = Array.from(this.queue).slice(0, this.BATCH_SIZE);
    batch.forEach(addr => this.queue.delete(addr));

    // Process batch with delay to avoid rate limiting
    await Promise.all(
      batch.map(async (address) => {
        try {
          // Add small random delay to spread requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          
          const response = await fetch(`https://api.ensdata.net/${address}`);
          let ensName: string | null = null;
          
          if (response.ok) {
            const data = await response.json();
            ensName = data.ens || null;
          }

          // Cache the result
          this.cache[address] = {
            name: ensName,
            timestamp: Date.now(),
            isResolved: true
          };

          // Call all callbacks for this address
          const callbacks = this.callbacks.get(address) || [];
          callbacks.forEach(callback => callback(ensName));
          this.callbacks.delete(address);

        } catch {
          console.debug('ENS resolution failed for', address);
          
          // Cache as null to avoid retrying immediately
          this.cache[address] = {
            name: null,
            timestamp: Date.now(),
            isResolved: true
          };

          // Call callbacks with null
          const callbacks = this.callbacks.get(address) || [];
          callbacks.forEach(callback => callback(null));
          this.callbacks.delete(address);
        }
      })
    );

    // Wait before processing next batch
    if (this.queue.size > 0) {
      setTimeout(() => this.processBatch(), this.BATCH_DELAY);
    } else {
      this.isProcessing = false;
    }
  }

  // Get cached result without triggering resolution
  getCached(address: string): string | null | undefined {
    const cached = this.cache[address];
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.name;
    }
    return undefined; // Not cached or expired
  }

  // Check if address is currently being resolved
  isResolving(address: string): boolean {
    return this.queue.has(address) || this.callbacks.has(address);
  }
}

// Global singleton instance
export const ensResolver = new ENSResolver();
