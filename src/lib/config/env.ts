// Environment detection
const isServer = typeof window === 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';

function getBaseUrl(): string {
  // Client-side: always use window.location.origin
  if (!isServer) return window.location.origin;
  
  // Server-side: check environment variables
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (isDevelopment) return 'http://localhost:3000';
  
  // Production fallback for build time
  return 'http://localhost:3000';
}

// Public configurations (available on client)
export const publicConfig = {
  baseUrl: getBaseUrl(),
  reownProjectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID,
  // Persona KYC configuration
  personaTemplateId: process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID,
  personaEnvironmentId: process.env.NEXT_PUBLIC_PERSONA_ENVIRONMENT_ID,
} as const;

// Server-side configurations (only available in API routes and server components)
export const serverConfig = {
  etherscanApiKey: process.env.ETHERSCAN_API_KEY,
  alchemyApiKey: process.env.ALCHEMY_API_KEY,
  solanaRpcUrl: process.env.SOLANA_RPC_URL,
  heliusApiKey: process.env.HELIUS_API_KEY,
} as const;

// API endpoints (relative paths)
export const apiEndpoints = {
  alchemyApi: '/api/ethereum/alchemy',
  etherscanApi: '/api/ethereum/etherscan',
} as const;

//Ensure URL has HTTPS protocol
function ensureHttps(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) return `https://${url}`;
  return url.replace('http://', 'https://');
}

// Full URLs for external connections
export const apiUrls = {
  alchemyApi: `${ensureHttps(publicConfig.baseUrl)}${apiEndpoints.alchemyApi}`,
  etherscanApi: `${ensureHttps(publicConfig.baseUrl)}${apiEndpoints.etherscanApi}`,
} as const;

// Validation functions
export function validatePublicConfig() {
  try {
    // Validate base URL
    const url = new URL(publicConfig.baseUrl);
    if (!url.protocol.startsWith('https') && !isDevelopment) {
      throw new Error('Production URLs must use HTTPS');
    }

    // Validate Reown Project ID
    if (!publicConfig.reownProjectId) {
      throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is required');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Config validation failed: ${error.message}`);
    }
    throw error;
  }
}

export function validateServerConfig() {
  const required = [
    'etherscanApiKey', 
    'alchemyApiKey',
    'solanaRpcUrl',
    'heliusApiKey'
  ] as const;
  
  for (const key of required) {
    if (!serverConfig[key]) throw new Error(`${key} environment variable is required`);
  }
}

// Helper function to construct API URLs with parameters
export function constructEtherscanUrl(params: {
  moduleType: string;
  action: string;
  address: string;
}) {
  const { moduleType, action, address } = params;
  return `${apiEndpoints.etherscanApi}?moduleType=${moduleType}&action=${action}&address=${address}`;
} 