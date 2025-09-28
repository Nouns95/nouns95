import { useBalance } from 'wagmi';
import { useEffect, useState } from 'react';
import styles from './TreasuryBalance.module.css';
import { mainnet } from 'wagmi/chains';

const TREASURY_ADDRESS = '0xb1a32FC9F9D8b2cf86C068Cae13108809547ef71' as `0x${string}`;

const TOKEN_ADDRESSES = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`,
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' as `0x${string}`,
  STETH: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84' as `0x${string}`,
  WSTETH: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0' as `0x${string}`,
  RETH: '0xae78736Cd615f374D3085123A210448E74Fc6393' as `0x${string}`,
  METH: '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa' as `0x${string}`
};

// Token IDs for CoinGecko API
const COINGECKO_IDS = {
  ETH: 'ethereum',
  USDC: 'usd-coin',
  STETH: 'staked-ether',
  RETH: 'rocket-pool-eth',
  METH: 'mantle-staked-ether' // Note: Verify this CoinGecko ID or use ETH price as proxy
};

interface TokenPrices {
  [key: string]: number;
}

const formatEthBalance = (value: string | undefined) => {
  if (!value) return '0.000';
  return Number(value).toFixed(3);
};

const formatUsdcBalance = (value: string | undefined) => {
  if (!value) return '0.00';
  return Number(value).toFixed(2);
};

const formatUsdValue = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatAddress = (address: string) => {
  return `${address.slice(0, 2)}...${address.slice(-4)}`;
};

export function TreasuryBalance() {
  const [prices, setPrices] = useState<TokenPrices>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Token Balances with chainId specified
  const { data: ethBalance, isLoading: isLoadingEth, error: ethError } = useBalance({
    address: TREASURY_ADDRESS,
    chainId: mainnet.id,
  });

  const { data: usdcBalance, isLoading: isLoadingUsdc } = useBalance({
    address: TREASURY_ADDRESS,
    token: TOKEN_ADDRESSES.USDC,
    chainId: mainnet.id,
  });

  const { data: wethBalance, isLoading: isLoadingWeth } = useBalance({
    address: TREASURY_ADDRESS,
    token: TOKEN_ADDRESSES.WETH,
    chainId: mainnet.id,
  });

  const { data: stethBalance, isLoading: isLoadingSteth } = useBalance({
    address: TREASURY_ADDRESS,
    token: TOKEN_ADDRESSES.STETH,
    chainId: mainnet.id,
  });

  const { data: wstethBalance, isLoading: isLoadingWsteth } = useBalance({
    address: TREASURY_ADDRESS,
    token: TOKEN_ADDRESSES.WSTETH,
    chainId: mainnet.id,
  });

  const { data: rethBalance, isLoading: isLoadingReth } = useBalance({
    address: TREASURY_ADDRESS,
    token: TOKEN_ADDRESSES.RETH,
    chainId: mainnet.id,
  });

  const { data: methBalance, isLoading: isLoadingMeth } = useBalance({
    address: TREASURY_ADDRESS,
    token: TOKEN_ADDRESSES.METH,
    chainId: mainnet.id,
  });

  // Retry mechanism for balance loading errors
  useEffect(() => {
    if (ethError && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
      return () => clearTimeout(timer);
    }
  }, [ethError, retryCount]);

  // Fetch token prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setIsLoadingPrices(true);
        setPriceError(null);

        const ids = Object.values(COINGECKO_IDS).join(',');
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }

        const data = await response.json();
        
        setPrices({
          ETH: data[COINGECKO_IDS.ETH]?.usd || 0,
          USDC: data[COINGECKO_IDS.USDC]?.usd || 1, // USDC should be ~1
          STETH: data[COINGECKO_IDS.STETH]?.usd || 0,
          RETH: data[COINGECKO_IDS.RETH]?.usd || 0,
          METH: data[COINGECKO_IDS.METH]?.usd || data[COINGECKO_IDS.ETH]?.usd || 0 // Fallback to ETH price if METH price not available
        });
      } catch {
        // Error fetching prices
        setPriceError('Failed to fetch token prices');
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchPrices();
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isLoading = 
    isLoadingPrices || 
    isLoadingEth || 
    isLoadingUsdc || 
    isLoadingWeth || 
    isLoadingSteth || 
    isLoadingWsteth || 
    isLoadingReth || 
    isLoadingMeth;

  // Calculate total USD values using real-time prices
  const mainBalanceUsd = (
    (Number(ethBalance?.formatted || 0) * (prices.ETH || 0)) +
    (Number(usdcBalance?.formatted || 0)) + // USDC is always ~1 USD
    (Number(wethBalance?.formatted || 0) * (prices.ETH || 0))
  );

  const stakedBalanceUsd = (
    (Number(stethBalance?.formatted || 0) * (prices.STETH || 0)) +
    (Number(wstethBalance?.formatted || 0) * (prices.STETH || 0)) + // Using stETH price for wstETH
    (Number(rethBalance?.formatted || 0) * (prices.RETH || 0)) +
    (Number(methBalance?.formatted || 0) * (prices.METH || 0))
  );

  if (ethError && retryCount >= 3) {
    return (
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Treasury Balance</h2>
          <a 
            href={`https://etherscan.io/address/${TREASURY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.addressLink}
          >
            {formatAddress(TREASURY_ADDRESS)}
          </a>
        </div>
        <div className={styles.error}>
          Failed to load balances. Please try again later.
        </div>
      </div>
    );
  }

  if (priceError) {
    return (
      <div className={styles.container}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Treasury Balance</h2>
          <a 
            href={`https://etherscan.io/address/${TREASURY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.addressLink}
          >
            {formatAddress(TREASURY_ADDRESS)}
          </a>
        </div>
        <div className={styles.error}>
          {priceError}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Treasury Balance</h2>
        <a 
          href={`https://etherscan.io/address/${TREASURY_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.addressLink}
        >
          {formatAddress(TREASURY_ADDRESS)}
        </a>
      </div>
      <div className={styles.sections}>
        <div>
          <div className={`${styles.sectionTotal} ${isLoading ? styles.loading : ''}`}>
            Total: {isLoading ? '...' : formatUsdValue(mainBalanceUsd)}
          </div>
          <div className={styles.balances}>
            <div className={`${styles.balance} ${isLoadingEth ? styles.loading : ''}`}>
              <span className={styles.label}>ETH</span>
              <span className={styles.value}>{formatEthBalance(ethBalance?.formatted)}</span>
            </div>
            <div className={`${styles.balance} ${isLoadingUsdc ? styles.loading : ''}`}>
              <span className={styles.label}>USDC</span>
              <span className={styles.value}>${formatUsdcBalance(usdcBalance?.formatted)}</span>
            </div>
            <div className={`${styles.balance} ${isLoadingWeth ? styles.loading : ''}`}>
              <span className={styles.label}>WETH</span>
              <span className={styles.value}>{formatEthBalance(wethBalance?.formatted)}</span>
            </div>
          </div>
        </div>

        <div className={styles.stakedSection}>
          <h3 className={styles.sectionTitle}>Staked</h3>
          <div className={`${styles.sectionTotal} ${isLoading ? styles.loading : ''}`}>
            Total: {isLoading ? '...' : formatUsdValue(stakedBalanceUsd)}
          </div>
          <div className={styles.balances}>
            <div className={`${styles.balance} ${isLoadingSteth ? styles.loading : ''}`}>
              <span className={styles.label}>stETH</span>
              <span className={styles.value}>{formatEthBalance(stethBalance?.formatted)}</span>
            </div>
            <div className={`${styles.balance} ${isLoadingWsteth ? styles.loading : ''}`}>
              <span className={styles.label}>wstETH</span>
              <span className={styles.value}>{formatEthBalance(wstethBalance?.formatted)}</span>
            </div>
            <div className={`${styles.balance} ${isLoadingReth ? styles.loading : ''}`}>
              <span className={styles.label}>rETH</span>
              <span className={styles.value}>{formatEthBalance(rethBalance?.formatted)}</span>
            </div>
            <div className={`${styles.balance} ${isLoadingMeth ? styles.loading : ''}`}>
              <span className={styles.label}>mETH</span>
              <span className={styles.value}>{formatEthBalance(methBalance?.formatted)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 