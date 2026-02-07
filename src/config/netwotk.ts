/**
 * Default chain / network config.
 * Ethereum Sepolia as default testnet.
 */

export interface Network {
  name: string;
  rpcUrl: string;
  chainId: string;
  /** Native token symbol; default ETH when omitted. */
  symbol?: string;
  /** Block explorer base URL (optional). */
  blockExplorer?: string;
}

/** Default chains shown in Network list (e.g. Ethereum Sepolia). */
export const DEFAULT_NETWORKS: Network[] = [
  {
    name: 'Ethereum Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    chainId: '11155111',
    symbol: 'ETH',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
];

// {
//   name: 'Base Sepolia',
//   rpcUrl: 'https://base-sepolia.drpc.org',
//   chainId: '84532',
//   symbol: 'ETH',
//   blockExplorer: 'https://sepolia.basescan.org/',
// },
